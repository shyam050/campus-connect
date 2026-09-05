import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not route rejected promises from async handlers to the error
 * middleware. Every async controller goes through this wrapper.
 */
export function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
