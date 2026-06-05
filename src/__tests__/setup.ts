import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  if (!process.env.DATABASE_URL_TEST) {
    throw new Error('DATABASE_URL_TEST is not set in environment variables');
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  
  // Reset DB schema
  execSync('npx prisma db push --accept-data-loss', { stdio: 'ignore' });
});

beforeEach(async () => {
  // Clear tables
  await prisma.reminder.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();

  // Clear redis
  if (redis.isReady) {
    await redis.flushDb();
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  if (redis.isReady) {
    await redis.quit();
  }
});
