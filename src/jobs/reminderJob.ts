import { prisma } from '../lib/prisma';
import { notificationService } from '../notifications/notificationService';

export const runReminderJob = async () => {
  const overdue = await prisma.actionItem.findMany({
    where: { status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } },
    include: { meeting: true },
  });

  for (const item of overdue) {
    const sent = await notificationService.sendReminder(item);
    await prisma.reminder.create({
      data: { actionItemId: item.id, channel: 'email', success: sent },
    });
  }
};
