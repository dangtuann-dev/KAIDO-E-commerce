import 'server-only';
/**
 * [CRON] Quét tồn kho thấp và cảnh báo — M08-F11, M02-F13.
 * Vercel Cron: 0 3 * * * (xem vercel.json). Bảo vệ bằng CRON_SECRET.
 */
import { withCron } from '@/server/http/withCron.js';
import { scanLowStock } from '@/modules/m08-inventory/server/service.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withCron('low-stock-scan', async () => scanLowStock());
