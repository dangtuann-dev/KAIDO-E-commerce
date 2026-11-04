import 'server-only';
/**
 * [CRON] Quét điểm thưởng hết hạn và tặng voucher sinh nhật — M07-F06/F07.
 * Vercel Cron: 0 1 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 */
import { withCron } from '@/server/http/withCron.js';
import {
  expireLoyaltyPoints,
  issueBirthdayVouchers,
} from '@/modules/m07-loyalty/server/service.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('expire-loyalty-points', async () => {
  const now = new Date();
  const expired = await expireLoyaltyPoints(now);
  const birthday = await issueBirthdayVouchers(now);

  return {
    job: 'expire-loyalty-points',
    expired_points: expired,
    birthday_vouchers: birthday,
    ran_at: now.toISOString(),
  };
});
