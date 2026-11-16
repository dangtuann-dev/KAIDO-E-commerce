import 'server-only';
/**
 * [CRON] Hủy đơn PENDING_PAYMENT quá hạn thanh toán — M05-F09 / BR-M05-02.
 * Vercel Cron: mỗi phút (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 */
import { withCron } from '@/server/http/withCron.js';
import { cancelTimeoutOrders } from '@/modules/m05-checkout/server/service.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('cancel-timeout-orders', async () => {
  const result = await cancelTimeoutOrders();
  return { job: 'cancel-timeout-orders', ...result };
});
