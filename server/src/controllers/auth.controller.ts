import type { Request, Response } from 'express';
import {
  clearRefreshCookie,
  comparePassword,
  generateTokens,
  hashPassword,
  setRefreshCookie,
  verifyRefreshToken,
} from '../auth/jwt';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';
import { PrepModule } from '../models/PrepModule';

const REFRESH_COOKIE = 'refreshToken';

function getCookie(req: Request, name: string): string | undefined {
  return req.cookies?.[name];
}

// POST /api/v1/auth/register — student self-registration (coordinator/admin are provisioned)
export async function register(req: Request, res: Response) {
  const { name, email, password, department, batch, cgpa, backlogs } = req.body as {
    name: string;
    email: string;
    password: string;
    department: string;
    batch: number;
    cgpa: number;
    backlogs: number;
  };

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    role: 'student',
    department,
    batch,
    cgpa,
    backlogs,
    isVerified: true, // department-issued emails are trusted in this deployment
  });

  // Starter prep modules for new students
  await PrepModule.insertMany([
    {
      userId: user._id,
      title: 'DSA',
      subtopics: [
        { title: 'Arrays & Two Pointers', completed: false, resources: [] },
        { title: 'Strings & Sliding Window', completed: false, resources: [] },
        { title: 'Linked Lists & Stacks/Queues', completed: false, resources: [] },
        { title: 'Trees & BST', completed: false, resources: [] },
        { title: 'Graphs (BFS/DFS)', completed: false, resources: [] },
        { title: 'Dynamic Programming Basics', completed: false, resources: [] },
      ],
    },
    {
      userId: user._id,
      title: 'Aptitude',
      subtopics: [
        { title: 'Quantitative: Percentages & Ratios', completed: false, resources: [] },
        { title: 'Logical Reasoning', completed: false, resources: [] },
        { title: 'Verbal Ability', completed: false, resources: [] },
      ],
    },
  ]);

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    status: 'success',
    data: { user: user.toJSON(), accessToken },
  });
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(401, 'BAD_CREDENTIALS', 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated');

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.json({
    status: 'success',
    data: { user: user.toJSON(), accessToken },
  });
}

// POST /api/v1/auth/refresh — rotates the refresh token on every use.
// If an old (already-rotated) token is replayed, the session is revoked.
export async function refresh(req: Request, res: Response) {
  const token = getCookie(req, REFRESH_COOKIE);
  if (!token) throw new ApiError(401, 'NO_REFRESH', 'No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, 'INVALID_REFRESH', 'Refresh token invalid or expired');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || !user.isActive) {
    clearRefreshCookie(res);
    throw new ApiError(401, 'INVALID_REFRESH', 'Session no longer valid');
  }

  // Rotation check: the presented token must be the latest one issued.
  if (user.refreshToken !== token) {
    user.refreshToken = undefined;
    await user.save();
    clearRefreshCookie(res);
    throw new ApiError(401, 'REFRESH_REUSED', 'Refresh token reuse detected — please log in again');
  }

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.json({ status: 'success', data: { accessToken } });
}

// POST /api/v1/auth/logout
export async function logout(req: Request, res: Response) {
  const token = getCookie(req, REFRESH_COOKIE);
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.userId }, { $unset: { refreshToken: 1 } });
    } catch {
      // expired/invalid token — nothing to revoke
    }
  }
  clearRefreshCookie(res);
  res.json({ status: 'success', data: { message: 'Logged out' } });
}

// GET /api/v1/auth/me
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  res.json({ status: 'success', data: { user: user.toJSON() } });
}
