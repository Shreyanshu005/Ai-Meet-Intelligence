import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Utility Endpoints', () => {
  it('GET /health returns 200 and traceId', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.traceId).toBeDefined();
  });
});
