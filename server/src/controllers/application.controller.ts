import type { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';
import { enqueueEmail } from '../queue/emailQueue';
import { statusUpdateEmail } from '../templates/email.templates';

// GET /api/v1/applications/me — student's own applications
export async function myApplications(req: Request, res: Response) {
  const applications = await Application.find({ studentId: req.user!.userId })
    .populate('jobId', 'company role type location deadline status salary')
    .sort({ appliedAt: -1 });

  res.json({ status: 'success', data: applications });
}

// GET /api/v1/applications — coordinator/admin, filterable by job/status
export async function listApplications(req: Request, res: Response) {
  const { page, limit, jobId, status } = req.query as unknown as {
    page: number;
    limit: number;
    jobId?: string;
    status?: string;
  };

  const query: Record<string, unknown> = {};
  if (jobId) query.jobId = jobId;
  if (status) query.status = status;

  const applications = await Application.find(query)
    .populate('studentId', 'name email department cgpa backlogs')
    .populate('jobId', 'company role deadline status')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Application.countDocuments(query);

  res.json({ status: 'success', data: applications, meta: { page, limit, total } });
}

// PATCH /api/v1/applications/:id/status — coordinator/admin
export async function updateStatus(req: Request, res: Response) {
  const { status, notes } = req.body as { status: string; notes?: string };

  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');

  application.status = status as typeof application.status;
  if (notes !== undefined) application.notes = notes;
  await application.save();

  // Notify the student off the request path via the email queue
  const student = await User.findById(application.studentId).select('name email');
  if (student) {
    await enqueueEmail({
      to: student.email,
      subject: `Application update: ${application.company}`,
      html: statusUpdateEmail({
        studentName: student.name,
        company: application.company,
        role: application.role,
        status,
      }),
    });
  }

  await application.populate('studentId', 'name email department cgpa backlogs');
  res.json({ status: 'success', data: application });
}

// DELETE /api/v1/applications/:id — student withdraws (before first review) or admin
export async function withdrawApplication(req: Request, res: Response) {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');

  const isOwner = application.studentId.toString() === req.user!.userId;
  if (isOwner) {
    if (application.status !== 'applied') {
      throw new ApiError(400, 'TOO_LATE', 'Application is already under review and cannot be withdrawn');
    }
  } else if (req.user!.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
  }

  await Job.updateOne({ _id: application.jobId }, { $pull: { applicants: application.studentId } });
  await application.deleteOne();
  res.json({ status: 'success', data: { message: 'Application withdrawn' } });
}
