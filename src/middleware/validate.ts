import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fail } from '../lib/response';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(fail('VALIDATION_ERROR', error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), req.traceId));
    }
    next(error);
  }
};
