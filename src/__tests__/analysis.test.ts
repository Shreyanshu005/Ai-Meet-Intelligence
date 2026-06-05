import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { createTestUser, createTestMeeting } from './helpers';

const mockCreate = vi.fn();

vi.mock('groq-sdk', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('AI Analysis Pipeline', () => {
  let validToken: string;
  let userId: string;
  let meetingId: string;

  beforeEach(async () => {
    mockCreate.mockReset();
    const testUser = await createTestUser();
    validToken = testUser.accessToken;
    userId = testUser.user.id;
    const meeting = await createTestMeeting(userId);
    meetingId = meeting.id;
  });

  it('analyzes successfully with valid mock', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        summary: [{ text: "Summary", citations: [{ timestamp: "00:01" }] }],
        actionItems: [{ task: "Fix tests", assignee: "Bob", dueDate: null, citations: [{ timestamp: "00:01" }] }],
        decisions: [],
        followUps: []
      }) } }]
    });

    const res = await request(app).post(`/api/meetings/${meetingId}/analyze`).set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionItems.length).toBe(1);
  });

  it('returns 422 on hallucinated citation', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        summary: [{ text: "Summary", citations: [{ timestamp: "99:99" }] }], // 99:99 not in transcript
      }) } }]
    });

    const res = await request(app).post(`/api/meetings/${meetingId}/analyze`).set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(422); // UNPROCESSABLE_ENTITY per our router
  });

  it('handles groq errors', async () => {
    mockCreate.mockRejectedValue(new Error('AI is down'));
    const res = await request(app).post(`/api/meetings/${meetingId}/analyze`).set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});
