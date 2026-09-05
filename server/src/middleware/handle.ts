import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { ApiError } from './error';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ status: 'error', error: 'Route not found', code: 'NOT_FOUND' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation failures that bypass the validate middleware
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return res.status(422).json({
      status: 'error',
      error: issue?.message ?? 'Invalid input',
      code: 'VALIDATION_ERROR',
    });
  }

  // Mongoose duplicate key (e.g. already-applied race, duplicate email)
  if (err instanceof MongooseError && (err as { code?: number }).code === 11000) {
    return res.status(409).json({
      status: 'error',
      error: 'Duplicate record',
      code: 'DUPLICATE',
    });
  }

  if (err instanceof MongooseError.CastError) {
    return res
      .status(400)
      .json({ status: 'error', error: `Invalid ${err.path}`, code: 'BAD_ID' });
  }

  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ status: 'error', error: err.message, code: err.code });
  }

  console.error('[error]', err);
  const message =
    err instanceof Error ? err.message : 'Something went wrong';
  res.status(500).json({ status: 'error', error: message, code: 'INTERNAL' });
}
