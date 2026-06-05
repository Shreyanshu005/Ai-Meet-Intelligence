import { Router, Request, Response, NextFunction } from 'express';
import { actionItemsService } from './actionItems.service';
import { validate } from '../../middleware/validate';
import { updateStatusSchema } from './actionItems.schema';
import { ok, fail } from '../../lib/response';

export const actionItemsRouter = Router();

actionItemsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await actionItemsService.listActionItems(req.userId!);
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
    const item = await actionItemsService.updateStatus(req.params.id, req.userId!, req.body.status);
    res.json(ok(item, req.traceId));
  } catch (error: any) {
    if (error.message === 'Action item not found') {
      res.status(404).json(fail('NOT_FOUND', error.message, req.traceId));
    } else {
      next(error);
    }
  }
});
