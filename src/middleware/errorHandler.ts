import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { fail } from '../lib/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, traceId: req.traceId }, 'Unhandled error');

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json(fail('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', req.traceId));
};
