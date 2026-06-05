import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

describe('Security Edge Cases', () => {
  beforeEach(async () => {
    // Rely on global cleanup
  });

  it('handles SQL injection attempts smoothly via Zod / Prisma parameterization', async () => {
    // Email with SQL syntax
    const maliciousEmail = "admin@example.com'; DROP TABLE User;--";
    const res = await request(app).post('/api/auth/register').send({
      email: maliciousEmail,
      password: 'password123'
    });
    // Should be caught by Zod email validation
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('handles large payloads with 413 or rejects nicely', async () => {
    const hugePayload = { email: 'a'.repeat(100000) + '@example.com', password: 'password123' };
    const res = await request(app).post('/api/auth/register').send(hugePayload);
    // Express JSON default limit is 100kb. Depending on size it might be 413, or Zod catches it (if length limits apply)
    expect(res.status).toBeGreaterThanOrEqual(400); 
  });
});
