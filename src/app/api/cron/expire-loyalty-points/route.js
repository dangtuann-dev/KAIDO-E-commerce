/**
 * [CRON] Quét điểm thưởng hết hạn — M07-F07.
 * Vercel Cron: 0 1 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 * Trạng thái: TODO — thân job chưa triển khai.
 */
import { withCron } from '@/server/http/withCron.js';
import { NotImplementedError } from '@/server/http/errors.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('expire-loyalty-points', async () => {
  // TODO(M07-F07): ghi loyalty_point_transactions EXPIRE cho điểm quá expires_at bằng RPC nguyên tử.
  throw new NotImplementedError('M07-F07', 'Cron hết hạn điểm thưởng chưa được triển khai.');
});
