import { prisma } from '../../lib/prisma';
import { ActionStatus } from '@prisma/client';

export class ActionItemsService {
  async listActionItems(userId: string) {
    return prisma.actionItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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
