import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId as string;
  res.setHeader('X-Trace-Id', req.traceId);
  next();
};

// Also declare global Express namespace extension for traceId and userId
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      userId?: string;
    }
  }
}
