import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { createTestUser } from './helpers';

describe('Meetings Module', () => {
  let validToken: string;
  let userId: string;

  beforeEach(async () => {
    const testUser = await createTestUser();
    validToken = testUser.accessToken;
    userId = testUser.user.id;
  });

  describe('POST /api/meetings', () => {
    const validPayload = {
      title: 'Q1 Planning',
      participants: ['alice@a.com', 'bob@a.com'],
      meetingDate: new Date().toISOString(),
      transcript: [{ timestamp: '00:00', speaker: 'Alice', text: 'Hello' }],
    };

    it('creates meeting successfully', async () => {
      const res = await request(app).post('/api/meetings').set('Authorization', `Bearer ${validToken}`).send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(validPayload.title);
    });

    it('returns 400 on missing title', async () => {
      const res = await request(app).post('/api/meetings').set('Authorization', `Bearer ${validToken}`).send({ ...validPayload, title: undefined });
      expect(res.status).toBe(400);
    });

    it('returns 401 unauthenticated', async () => {
      const res = await request(app).post('/api/meetings').send(validPayload);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/meetings', () => {
    it('returns only users meetings', async () => {
      await prisma.meeting.create({
        data: {
          title: 'My Mtg',
          userId,
          meetingDate: new Date(),
          participants: [],
          transcript: [],
        }
      });
      const res = await request(app).get('/api/meetings').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBe(1);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('returns meeting', async () => {
      const m = await prisma.meeting.create({
        data: { title: 'Mtg', userId, meetingDate: new Date(), participants: [], transcript: [] }
      });
      const res = await request(app).get(`/api/meetings/${m.id}`).set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(m.id);
    });

    it('returns 404 for wrong user', async () => {
      const otherUser = await createTestUser('other@a.com');
      const m = await prisma.meeting.create({
        data: { title: 'Mtg', userId: otherUser.user.id, meetingDate: new Date(), participants: [], transcript: [] }
      });
      const res = await request(app).get(`/api/meetings/${m.id}`).set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(404);
    });
  });
});
