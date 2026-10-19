import 'server-only';
/**
 * [CRON] Kích hoạt/kết thúc chiến dịch quảng bá theo lịch — M09-F05.
 * Vercel Cron: 0 0 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 * Trạng thái: TODO — thân job chưa triển khai.
 */
import { withCron } from '@/server/http/withCron.js';
import { NotImplementedError } from '@/server/http/errors.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('campaigns', async () => {
  // TODO(M09-F05): bật campaign đến starts_at và đóng campaign quá ends_at.
  throw new NotImplementedError('M09-F05', 'Cron kích hoạt chiến dịch chưa được triển khai.');
});
