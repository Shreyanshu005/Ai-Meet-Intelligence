import { Router, Request, Response, NextFunction } from 'express';
import { meetingsService } from './meetings.service';
import { validate } from '../../middleware/validate';
import { createMeetingSchema } from './meetings.schema';
import { ok, fail } from '../../lib/response';

export const meetingsRouter = Router();

meetingsRouter.post('/', validate(createMeetingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingsService.createMeeting(req.userId!, req.body);
    res.status(201).json(ok(meeting, req.traceId));
  } catch (error) {
    next(error);
  }
});

meetingsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const meetings = await meetingsService.listMeetings(req.userId!, page, limit);
    res.json(ok(meetings, req.traceId));
  } catch (error) {
    next(error);
  }
});

meetingsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingsService.getMeeting(req.params.id, req.userId!);
    res.json(ok(meeting, req.traceId));
  } catch (error: any) {
    if (error.message === 'Meeting not found') {
      res.status(404).json(fail('NOT_FOUND', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});
