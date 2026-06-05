import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { ok, fail } from '../../lib/response';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.status(201).json(ok(result, req.traceId));
  } catch (error: any) {
    if (error.message === 'User already exists') {
      res.status(409).json(fail('CONFLICT', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});

authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(ok(result, req.traceId));
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json(fail('UNAUTHORIZED', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});
