import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/User';
import type { AuthUser } from '../types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface UserLike {
  _id: { toString(): string };
  role: AuthUser['role'];
  department: string;
}

export function generateTokens(user: UserLike) {
  const payload: AuthUser = {
    userId: user._id.toString(),
    role: user.role,
    department: user.department,
  };

  const accessToken = jwt.sign(payload, env.accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId: user._id.toString() }, env.refreshSecret, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  return { accessToken, refreshToken };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Refresh tokens live in an httpOnly cookie scoped to the auth routes only. */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.refreshSecret) as JwtPayload;
}

// Middleware: Verify access token
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, env.accessSecret) as JwtPayload;

    // Re-check the account on every request: deactivated users are cut off
    // immediately, even if their access token is still valid.
    const user = await User.findById(decoded.userId).select('role department isActive');
    if (!user || !user.isActive) {
      return res
        .status(403)
        .json({ status: 'error', error: 'Account disabled or removed', code: 'ACCOUNT_DISABLED' });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      department: user.department,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(403)
        .json({ status: 'error', error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ status: 'error', error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

// Middleware: Check role permission
export function authorize(...allowedRoles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ status: 'error', error: 'Insufficient permissions', code: 'FORBIDDEN' });
    }
    next();
  };
}

// Usage:
// app.post('/jobs', authenticate, authorize('coordinator', 'admin'), createJob);
