import { Router, Request, Response, NextFunction } from 'express';
import { analysisService } from './analysis.service';
import { ok, fail } from '../../lib/response';

export const analysisRouter = Router();

analysisRouter.post('/:id/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analysisService.analyzeMeeting(req.params.id as string, req.userId!);
    res.json(ok(result, req.traceId));
  } catch (error: any) {
    if (error.message === 'Meeting not found') {
      res.status(404).json(fail('NOT_FOUND', error.message, req.traceId));
    } else if (error.message === 'Meeting has no transcript') {
      res.status(400).json(fail('BAD_REQUEST', error.message, req.traceId));
    } else if (error.message.startsWith('Hallucinated citation')) {
      res.status(422).json(fail('UNPROCESSABLE_ENTITY', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});
