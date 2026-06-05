import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { ActionItem, Meeting, User } from '@prisma/client';
import { prisma } from '../lib/prisma';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export class NotificationService {
  async sendReminder(item: ActionItem & { meeting: Meeting }) {
    if (!resend) {
      logger.warn('Resend API key not set, skipping email reminder for action item %s', item.id);
      return false;
    }

    const user = await prisma.user.findUnique({ where: { id: item.userId } });
    if (!user) return false;

    try {
      const { error } = await resend.emails.send({
        from: 'reminders@aimeetintelligence.example.com',
        to: user.email,
        subject: `Overdue Action Item from ${item.meeting.title}`,
        html: `<p>Hello,</p><p>This is a reminder that the task <strong>${item.task}</strong> assigned to ${item.assignee} from the meeting "${item.meeting.title}" is overdue.</p>`,
      });

      if (error) {
        logger.error({ error }, 'Failed to send email via Resend');
        return false;
      }

      return true;
    } catch (e) {
      logger.error({ err: e }, 'Exception while sending email');
      return false;
    }
  }
}

export const notificationService = new NotificationService();
