import { prisma } from '../../lib/prisma';
import { ActionStatus } from '@prisma/client';

export class ActionItemsService {
  async listActionItems(userId: string, filters: { status?: ActionStatus; assignee?: string; meetingId?: string }, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.assignee) where.assignee = { contains: filters.assignee, mode: 'insensitive' };
    if (filters.meetingId) where.meetingId = filters.meetingId;

    const [items, total] = await Promise.all([
      prisma.actionItem.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.actionItem.count({ where })
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getOverdue(userId: string) {
    return prisma.actionItem.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() },
      },
      include: { meeting: { select: { title: true } } },
    });
  }

  async updateStatus(id: string, userId: string, status: ActionStatus) {
    const actionItem = await prisma.actionItem.findUnique({ where: { id } });
    if (!actionItem || actionItem.userId !== userId) {
      throw new Error('Action item not found');
    }

    return prisma.actionItem.update({
      where: { id },
      data: { status },
    });
  }
}

export const actionItemsService = new ActionItemsService();
