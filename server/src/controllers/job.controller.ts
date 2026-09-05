import type { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Job, type IJob } from '../models/Job';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';
import { isApplyOpen, isEligible } from '../services/eligibility';
import { uploadResume } from '../services/storage.service';
import { runDeadlineReminders } from '../cron/reminders';

// GET /api/v1/jobs — role-aware listing.
// Students: open + upcoming + eligibility-filtered (CGPA, backlogs, department, batch).
// Coordinator/admin: full visibility with filters.
export async function listJobs(req: Request, res: Response) {
  const { page, limit, search, type, company, status, mine } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    company?: string;
    status?: 'open' | 'closed';
    mine?: string;
  };
  const user = req.user!;

  // Build query
  const query: Record<string, unknown> = {};

  if (user.role === 'student') {
    const student = await User.findById(user.userId).select('cgpa backlogs');
    query.status = 'open';
    query.deadline = { $gt: new Date() };
    // Only show jobs student is eligible for
    query['eligibility.minCgpa'] = { $lte: student?.cgpa ?? 0 };
    query['eligibility.maxBacklogs'] = { $gte: student?.backlogs ?? 0 };
    query['eligibility.departments'] = { $in: [user.department] };
  } else {
    if (status) query.status = status;
    if (mine === 'true') query.postedBy = user.userId;
  }

  // Search filter (text index on company/role/description)
  if (search) {
    query.$text = { $search: search };
  }
  if (type) query.type = type;
  if (company) query.company = new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const jobs = await Job.find(query)
    .sort({ deadline: 1 }) // Soonest first
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('postedBy', 'name email');

  const total = await Job.countDocuments(query);

  res.json({
    status: 'success',
    data: jobs,
    meta: { page, limit, total },
  });
}

// GET /api/v1/jobs/:id
export async function getJob(req: Request, res: Response) {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  let eligible = true;
  let applied = false;
  let applicationId: string | null = null;

  if (req.user?.role === 'student') {
    const student = await User.findById(req.user.userId).select('cgpa backlogs department batch');
    if (student) eligible = isEligible(student, job);
    const existing = await Application.findOne({
      studentId: req.user.userId,
      jobId: job._id,
    });
    applied = Boolean(existing);
    applicationId = existing?._id.toString() ?? null;
  }

  res.json({
    status: 'success',
    data: {
      job,
      eligible,
      applied,
      applicationId,
      applyOpen: isApplyOpen(job),
    },
  });
}

// POST /api/v1/jobs — coordinator/admin
export async function createJob(req: Request, res: Response) {
  const job = await Job.create({
    ...req.body,
    postedBy: req.user!.userId,
    applicants: [],
    status: 'open',
  });
  res.status(201).json({ status: 'success', data: job });
}

// PATCH /api/v1/jobs/:id — owning coordinator or admin
export async function updateJob(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  const isOwner = job.postedBy.toString() === req.user!.userId;
  if (req.user!.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only edit jobs you posted');
  }

  Object.assign(job, req.body);
  await job.save();
  res.json({ status: 'success', data: job });
}

// DELETE /api/v1/jobs/:id — owning coordinator or admin (cascades applications)
export async function deleteJob(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  const isOwner = job.postedBy.toString() === req.user!.userId;
  if (req.user!.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only delete jobs you posted');
  }

  await Application.deleteMany({ jobId: job._id });
  await job.deleteOne();
  res.json({ status: 'success', data: { message: 'Job and its applications deleted' } });
}

// GET /api/v1/jobs/:id/applicants — coordinator/admin
export async function listApplicants(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  if (req.user!.role !== 'admin' && job.postedBy.toString() !== req.user!.userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only view applicants for jobs you posted');
  }

  const applications = await Application.find({ jobId: job._id })
    .populate('studentId', 'name email department cgpa backlogs batch isVerified')
    .sort({ appliedAt: -1 });

  res.json({
    status: 'success',
    data: { job: job.toJSON(), applications },
  });
}

// POST /api/v1/jobs/:id/apply — student, multipart form with resume file
export async function applyToJob(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  if (!isApplyOpen(job)) {
    throw new ApiError(400, 'JOB_CLOSED', 'This job is closed or the deadline has passed');
  }

  const student = await User.findById(req.user!.userId);
  if (!student) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  if (!isEligible(student, job)) {
    throw new ApiError(403, 'NOT_ELIGIBLE', 'You do not meet the eligibility criteria for this job');
  }

  if (!req.file) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Resume file is required');
  }

  const existing = await Application.findOne({ studentId: student._id, jobId: job._id });
  if (existing) throw new ApiError(409, 'ALREADY_APPLIED', 'You have already applied to this job');

  const stored = await uploadResume(req.file.buffer, req.file.originalname);

  const application = await Application.create({
    studentId: student._id,
    jobId: job._id,
    company: job.company,
    role: job.role,
    status: 'applied',
    resumeUrl: stored.url,
  });

  await Job.updateOne({ _id: job._id }, { $addToSet: { applicants: student._id } });

  res.status(201).json({ status: 'success', data: application });
}

// POST /api/v1/jobs/:id/remind — coordinator/admin: queue deadline reminders now
export async function sendReminders(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');

  if (req.user!.role !== 'admin' && job.postedBy.toString() !== req.user!.userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only send reminders for jobs you posted');
  }

  const summary = await runDeadlineReminders(job._id.toString());
  const queued = summary.emailsQueued;
  res.json({
    status: 'success',
    data: {
      message: queued
        ? `${queued} reminder email(s) queued for eligible students`
        : 'No eligible students pending reminders for this job',
      queued,
    },
  });
}

export function assertJobFound(job: IJob | null): IJob {
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job not found');
  return job;
}
