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

const { cancelTimeoutOrders } = vi.hoisted(() => ({ cancelTimeoutOrders: vi.fn() }));

vi.mock('@/modules/m05-checkout/server/service.js', () => ({ cancelTimeoutOrders }));

const { GET: cancelTimeoutOrdersGET } = await import(
  '@/app/api/cron/cancel-timeout-orders/route.js'
);

describe('GET /api/cron/cancel-timeout-orders', () => {
  beforeEach(() => {
    cancelTimeoutOrders.mockReset();
    cancelTimeoutOrders.mockResolvedValue({
      cancelled_count: 2,
      executed_at: '2026-11-16T00:00:00.000Z',
    });
  });

  it('từ chối request không có CRON_SECRET đúng', async () => {
    const response = await cancelTimeoutOrdersGET(
      new Request('https://kaido.test/api/cron/cancel-timeout-orders'),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(cancelTimeoutOrders).not.toHaveBeenCalled();
  });

  it('hủy đơn quá hạn khi CRON_SECRET hợp lệ', async () => {
    const response = await cancelTimeoutOrdersGET(
      new Request('https://kaido.test/api/cron/cancel-timeout-orders', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      job: 'cancel-timeout-orders',
      cancelled_count: 2,
    });
    expect(cancelTimeoutOrders).toHaveBeenCalledTimes(1);
  });
});
