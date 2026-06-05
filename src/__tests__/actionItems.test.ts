import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { createTestUser, createTestMeeting, createTestActionItem } from './helpers';

describe('Action Items Module', () => {
  let validToken: string;
  let userId: string;
  let meetingId: string;

  beforeEach(async () => {
    const testUser = await createTestUser();
    validToken = testUser.accessToken;
    userId = testUser.user.id;
    const meeting = await createTestMeeting(userId);
    meetingId = meeting.id;
  });

  describe('GET /api/action-items', () => {
    it('returns user action items', async () => {
      await createTestActionItem(meetingId, userId);
      const res = await request(app).get('/api/action-items').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBe(1);
    });
  });

  describe('GET /api/action-items/overdue', () => {
    it('returns overdue items', async () => {
      // Overdue
      await createTestActionItem(meetingId, userId, { dueDate: new Date(Date.now() - 100000) });
      // Future
      await createTestActionItem(meetingId, userId, { dueDate: new Date(Date.now() + 100000) });
      // Completed Overdue
      await createTestActionItem(meetingId, userId, { dueDate: new Date(Date.now() - 100000), status: 'COMPLETED' });
      
      const res = await request(app).get('/api/action-items/overdue').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // Only the first one should be returned
    });
  });

  describe('PATCH /api/action-items/:id/status', () => {
    it('updates status', async () => {
      const item = await createTestActionItem(meetingId, userId);
      const res = await request(app)
        .patch(`/api/action-items/${item.id}/status`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status: 'COMPLETED' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('returns 400 on bad status', async () => {
      const item = await createTestActionItem(meetingId, userId);
      const res = await request(app)
        .patch(`/api/action-items/${item.id}/status`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status: 'INVALID' });
      expect(res.status).toBe(400);
    });
  });
});
