import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from './error';

type Source = 'body' | 'query' | 'params';

/** Parse & validate a request segment with zod; parsed value replaces the original. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
      return next(new ApiError(422, 'VALIDATION_ERROR', `${path}${issue?.message ?? 'Invalid input'}`));
    }
    // Express 4 allows assignment on query/params/body.
    (req as Record<Source, unknown>)[source] = result.data;
    next();
  };
}
