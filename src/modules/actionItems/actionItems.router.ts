import { Router, Request, Response, NextFunction } from 'express';
import { actionItemsService } from './actionItems.service';
import { validate } from '../../middleware/validate';
import { updateStatusSchema } from './actionItems.schema';
import { ok, fail } from '../../lib/response';

export const actionItemsRouter = Router();

actionItemsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      status: req.query.status as any,
      assignee: req.query.assignee as string,
      meetingId: req.query.meetingId as string
    };
    const items = await actionItemsService.listActionItems(req.userId!, filters, page, limit);
    res.json(ok(items, req.traceId));
  } catch (error) {
    next(error);
  }
});

actionItemsRouter.get('/overdue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await actionItemsService.getOverdue(req.userId!);
    res.json(ok(items, req.traceId));
  } catch (error) {
    next(error);
  }
});

actionItemsRouter.patch('/:id/status', validate(updateStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await actionItemsService.updateStatus(req.params.id as string, req.userId!, req.body.status);
    res.json(ok(item, req.traceId));
  } catch (error: any) {
    if (error.message === 'Action item not found') {
      res.status(404).json(fail('NOT_FOUND', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});
