/**
 * [CRON] Quét tồn kho thấp và cảnh báo — M08-F11, M02-F13.
 * Vercel Cron: 0 3 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 * Trạng thái: TODO — thân job chưa triển khai.
 */
import { withCron } from '@/server/http/withCron.js';
import { NotImplementedError } from '@/server/http/errors.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('low-stock-scan', async () => {
  // TODO(M08-F11): tìm inventory_stocks.available <= low_stock_threshold và gửi cảnh báo.
  throw new NotImplementedError('M08-F11', 'Cron quét tồn kho thấp chưa được triển khai.');
});
