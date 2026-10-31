import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activateScheduledContent } = vi.hoisted(() => ({
  activateScheduledContent: vi.fn(),
}));

vi.mock('@/modules/m09-marketing/server/service.js', () => ({ activateScheduledContent }));

// Import sau khi mock để route nhận bản service giả lập.
const { GET } = await import('@/app/api/cron/campaigns/route.js');

const CRON_RESULT = {
  ran_at: '2026-10-31T00:00:00.000Z',
  banners_published: 1,
  banners_archived: 0,
  articles_published: 2,
  campaigns_activated: 1,
  campaigns_ended: 0,
  errors: [],
};

describe('GET /api/cron/campaigns', () => {
  beforeEach(() => {
    activateScheduledContent.mockReset();
    activateScheduledContent.mockResolvedValue(CRON_RESULT);
  });

  it('từ chối request không có CRON_SECRET đúng', async () => {
    const response = await GET(new Request('https://kaido.test/api/cron/campaigns'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(activateScheduledContent).not.toHaveBeenCalled();
  });

  it('chạy job M09-F05 khi CRON_SECRET hợp lệ', async () => {
    const response = await GET(
      new Request('https://kaido.test/api/cron/campaigns', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      banners_published: 1,
      articles_published: 2,
      campaigns_activated: 1,
    });
    expect(activateScheduledContent).toHaveBeenCalledTimes(1);
  });
});
