import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/cron/campaigns/route.js';

describe('GET /api/cron/campaigns', () => {
  it('từ chối request không có CRON_SECRET đúng', async () => {
    const response = await GET(new Request('https://kaido.test/api/cron/campaigns'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('chấp nhận CRON_SECRET đúng và trả 501 vì job còn TODO', async () => {
    const response = await GET(
      new Request('https://kaido.test/api/cron/campaigns', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.error.code).toBe('NOT_IMPLEMENTED');
    expect(body.error.details.todo).toBe('M09-F05');
  });
});
