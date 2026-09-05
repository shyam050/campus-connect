import type { Request, Response } from 'express';
import { comparePassword, hashPassword } from '../auth/jwt';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';

// PATCH /api/v1/profile — name only; CGPA/backlogs are managed by the placement office
export async function updateProfile(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  const { name } = req.body as { name?: string };
  if (name) user.name = name;
  await user.save();
  res.json({ status: 'success', data: user });
}

// POST /api/v1/profile/change-password
export async function changePassword(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId).select('+password');
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!(await comparePassword(currentPassword, user.password))) {
    throw new ApiError(400, 'BAD_CREDENTIALS', 'Current password is incorrect');
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  res.json({ status: 'success', data: { message: 'Password updated' } });
}
