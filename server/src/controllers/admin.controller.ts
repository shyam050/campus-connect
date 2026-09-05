import type { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { PrepModule } from '../models/PrepModule';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';
import { getAnalytics } from '../services/analytics';

// GET /api/v1/admin/analytics — admin only
export async function analytics(_req: Request, res: Response) {
  const data = await getAnalytics();
  res.json({ status: 'success', data });
}

// GET /api/v1/admin/users
export async function listUsers(req: Request, res: Response) {
  const { page, limit, search, role, department } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    department?: string;
  };

  const query: Record<string, unknown> = {};
  if (role) query.role = role;
  if (department) query.department = department.toUpperCase();
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { email: rx }];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(query);
  res.json({ status: 'success', data: users, meta: { page, limit, total } });
}

// PATCH /api/v1/admin/users/:id
export async function updateUser(req: Request, res: Response) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  const updates = req.body as Partial<{
    role: string;
    isVerified: boolean;
    isActive: boolean;
    department: string;
    batch: number;
    cgpa: number;
    backlogs: number;
  }>;

  // Guard: an admin cannot demote or deactivate their own account
  if (target._id.toString() === req.user!.userId && (updates.role || updates.isActive === false)) {
    throw new ApiError(400, 'SELF_LOCKOUT', 'You cannot change your own role or deactivate yourself');
  }

  // Guard: never leave the system without an active admin
  if (updates.role && target.role === 'admin' && updates.role !== 'admin') {
    const otherAdmins = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: target._id },
    });
    if (otherAdmins === 0) throw new ApiError(400, 'LAST_ADMIN', 'At least one active admin must remain');
  }

  Object.assign(target, updates);
  await target.save();
  res.json({ status: 'success', data: target });
}

// DELETE /api/v1/admin/users/:id — cascades their applications, prep modules
// and (for coordinators) their posted jobs.
export async function deleteUser(req: Request, res: Response) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  if (target._id.toString() === req.user!.userId) {
    throw new ApiError(400, 'SELF_DELETE', 'You cannot delete your own account');
  }
  if (target.role === 'admin') {
    const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: target._id } });
    if (otherAdmins === 0) throw new ApiError(400, 'LAST_ADMIN', 'At least one admin must remain');
  }

  await PrepModule.deleteMany({ userId: target._id });
  await Application.deleteMany({ studentId: target._id });

  if (target.role !== 'student') {
    const postedJobs = await Job.find({ postedBy: target._id }).select('_id');
    const jobIds = postedJobs.map((j) => j._id);
    await Application.deleteMany({ jobId: { $in: jobIds } });
    await Job.deleteMany({ postedBy: target._id });
  }

  await target.deleteOne();
  res.json({ status: 'success', data: { message: `Deleted ${target.name} and related records` } });
}

// POST /api/v1/admin/users/bulk-verify
export async function bulkVerify(req: Request, res: Response) {
  const { userIds } = req.body as { userIds: string[] };
  const result = await User.updateMany({ _id: { $in: userIds } }, { isVerified: true });
  res.json({
    status: 'success',
    data: { message: `${result.modifiedCount} user(s) verified`, modifiedCount: result.modifiedCount },
  });
}

// GET /api/v1/admin/moderation/jobs — all jobs including closed
export async function moderationJobs(req: Request, res: Response) {
  const { page = 1, limit = 20, status } = (req.query ?? {}) as unknown as {
    page?: number;
    limit?: number;
    status?: string;
  };

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const jobs = await Job.find(query)
    .populate('postedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(((page ?? 1) - 1) * (limit ?? 20))
    .limit(limit ?? 20);

  const total = await Job.countDocuments(query);
  res.json({ status: 'success', data: jobs, meta: { page, limit, total } });
}

// GET /api/v1/admin/moderation/applications — latest activity across the portal
export async function moderationApplications(_req: Request, res: Response) {
  const applications = await Application.find()
    .populate('studentId', 'name email department')
    .populate('jobId', 'company role status deadline')
    .sort({ updatedAt: -1 })
    .limit(25);
  res.json({ status: 'success', data: applications });
}
