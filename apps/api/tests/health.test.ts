import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Check', () => {
  it('should return 200 and service info', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'clarityflow-api',
    });
  });
});
