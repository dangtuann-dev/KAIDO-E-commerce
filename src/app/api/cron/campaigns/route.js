import 'server-only';
/**
 * [CRON] Kích hoạt/kết thúc chiến dịch quảng bá theo lịch — M09-F05.
 * Vercel Cron: 0 0 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 * Đồng thời bật/tắt banner SCHEDULED và xuất bản bài viết đã tới lịch.
 */
import { withCron } from '@/server/http/withCron.js';
import { activateScheduledContent } from '@/modules/m09-marketing/server/service.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('campaigns', async () => activateScheduledContent());
