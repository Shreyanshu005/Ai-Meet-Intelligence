import { prisma } from '../../lib/prisma';
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const createTestUser = async (email = 'test@example.com', passwordHash = 'hashedpassword') => {
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });
  const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
  return { user, accessToken, refreshToken };
};

export const createTestMeeting = async (userId: string) => {
  return prisma.meeting.create({
    data: {
      userId,
      title: 'Test Meeting',
      participants: ['alice@example.com', 'bob@example.com'],
      meetingDate: new Date(),
      transcript: [
        { timestamp: "00:01", speaker: "Alice", text: "Bob, please fix the tests." }
      ],
    },
  });
};

export const createTestActionItem = async (meetingId: string, userId: string, overrides: any = {}) => {
  return prisma.actionItem.create({
    data: {
      meetingId,
      userId,
      task: 'Fix the tests',
      assignee: 'Bob',
      citations: [{ timestamp: "00:01" }],
      ...overrides,
    },
  });
};

export const mockGroqResponse = (data: any) => {
  vi.mock('groq-sdk', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(data) } }],
            }),
          },
        },
      })),
    };
  });
};

export const mockGroqError = (message: string) => {
  vi.mock('groq-sdk', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error(message)),
          },
        },
      })),
    };
  });
};
