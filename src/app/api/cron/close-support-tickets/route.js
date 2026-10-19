import 'server-only';
/**
 * [CRON] Tự đóng ticket RESOLVED quá 72 giờ — BR-M10-04.
 * Vercel Cron: 0 2 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 * Trạng thái: TODO — thân job chưa triển khai.
 */
import { withCron } from '@/server/http/withCron.js';
import { NotImplementedError } from '@/server/http/errors.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('close-support-tickets', async () => {
  // TODO(BR-M10-04): đóng ticket RESOLVED nếu không có phản hồi mới trong 72 giờ.
  throw new NotImplementedError('BR-M10-04', 'Cron tự đóng ticket chưa được triển khai.');
});
