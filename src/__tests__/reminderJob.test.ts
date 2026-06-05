import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReminderJob } from '../jobs/reminderJob';
import { prisma } from '../lib/prisma';
import { notificationService } from '../notifications/notificationService';

vi.mock('../notifications/notificationService', () => ({
  notificationService: {
    sendReminder: vi.fn(),
  },
}));

describe('Reminder Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs without overdue items', async () => {
    vi.spyOn(prisma.actionItem, 'findMany').mockResolvedValue([]);
    await runReminderJob();
    expect(notificationService.sendReminder).not.toHaveBeenCalled();
  });

  it('sends reminders for overdue items', async () => {
    vi.spyOn(prisma.actionItem, 'findMany').mockResolvedValue([
      { id: '1', meeting: { title: 'M1' } } as any
    ]);
    vi.spyOn(notificationService, 'sendReminder').mockResolvedValue(true);
    vi.spyOn(prisma.reminder, 'create').mockResolvedValue({} as any);

    await runReminderJob();

    expect(notificationService.sendReminder).toHaveBeenCalledTimes(1);
    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: { actionItemId: '1', channel: 'email', success: true }
    });
  });
});
