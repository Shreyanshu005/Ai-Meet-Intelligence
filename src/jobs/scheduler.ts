import cron from 'node-cron';
import { runReminderJob } from './reminderJob';
import { logger } from '../lib/logger';

export const startScheduler = () => {
  cron.schedule('*/15 * * * *', async () => {
    logger.info({ job: 'reminder' }, 'Running overdue reminder sweep');
    await runReminderJob();
  });
};
