import 'server-only';
/**
 * [CRON] Tự đóng ticket RESOLVED quá 72 giờ — BR-M10-04.
 * Vercel Cron: 0 2 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 */
import { withCron } from '@/server/http/withCron.js';
import { closeResolvedTickets } from '@/modules/m10-support/public.server.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('close-support-tickets', async () => closeResolvedTickets());
