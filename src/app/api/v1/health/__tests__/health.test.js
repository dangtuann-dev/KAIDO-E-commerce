import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/v1/health/route.js';

describe('GET /api/v1/health', () => {
  it('trả 200 và báo database not_configured khi chưa có Supabase', async () => {
    const response = await GET(
      new Request('https://kaido.test/api/v1/health', {
        headers: { 'x-request-id': 'health-test-01' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      status: 'ok',
      service: 'kaido-ecommerce',
      checks: {
        app: 'ok',
        env: 'ok',
        auth: 'configured',
        database: 'not_configured',
      },
      database: {
        configured: false,
        status: 'not_configured',
      },
    });
    expect(body.meta.requestId).toBe('health-test-01');
  });
});
