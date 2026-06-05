import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

describe('Auth Module', () => {
  beforeEach(async () => {
    // Rely on global db cleanup
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers and returns tokens', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: 'password123' });
      const res = await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('hashes password in db', async () => {
      await request(app).post('/api/auth/register').send({ email: 'hash@example.com', password: 'password123' });
      const user = await prisma.user.findUnique({ where: { email: 'hash@example.com' } });
      expect(user?.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', user!.passwordHash)).toBe(true);
    });

    it('returns 400 for bad payloads', async () => {
      const res1 = await request(app).post('/api/auth/register').send({ email: 'bad' });
      expect(res1.status).toBe(400);
      const res2 = await request(app).post('/api/auth/register').send({ email: 'a@example.com', password: '12' });
      expect(res2.status).toBe(400); // Min length 6
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashed = await bcrypt.hash('password123', 10);
      await prisma.user.create({ data: { email: 'login@example.com', passwordHash: hashed } });
    });

    it('logs in successfully', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'none@example.com', password: 'password123' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
