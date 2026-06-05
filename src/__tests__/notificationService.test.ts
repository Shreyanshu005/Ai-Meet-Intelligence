import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notifications/notificationService';
import { prisma } from '../lib/prisma';
import { Resend } from 'resend';

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: vi.fn().mockResolvedValue({ error: null }),
      };
    },
  };
});

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends reminder successfully', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ email: 'test@example.com' } as any);
    const item = { userId: '1', task: 'Task', assignee: 'A', meeting: { title: 'Mtg' } } as any;
    
    const result = await notificationService.sendReminder(item);
    expect(result).toBe(true);
  });

  it('handles missing user gracefully', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const item = { userId: '1', task: 'Task', assignee: 'A', meeting: { title: 'Mtg' } } as any;
    
    const result = await notificationService.sendReminder(item);
    expect(result).toBe(false);
  });
});
