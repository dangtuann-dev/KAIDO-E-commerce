/**
 * [APP] GET /api/v1/health — viết tay, không qua registry.
 * SRS: Giai đoạn 4 — trả trạng thái app và DB; 200 cả khi Supabase chưa cấu hình
 * (checks.database = "not_configured") để môi trường foundation vẫn chạy được.
 */
import { createRequestId } from '@/server/http/withApi.js';
import { errorResponse, successResponse } from '@/server/http/apiResponse.js';
import { AppError, normalizeError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getEnvStatus } from '@/server/env.js';
import { pingDatabase } from '@/server/db/supabase.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SERVICE_NAME = 'kaido-ecommerce';
const SERVICE_VERSION = '0.1.0';

async function buildHealth() {
  const env = getEnvStatus();
  const database = await pingDatabase({ timeoutMs: 2000 });

  const degraded = !env.valid || database.status === 'unreachable';

  return {
    status: degraded ? 'degraded' : 'ok',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    checks: {
      app: 'ok',
      env: env.valid ? 'ok' : 'invalid',
      auth: env.authConfigured ? 'configured' : 'not_configured',
      cron: env.cronConfigured ? 'configured' : 'not_configured',
      database: database.status,
    },
    database: {
      configured: env.supabaseConfigured,
      status: database.status,
      latency_ms: database.latency_ms,
      error_code: database.error_code,
    },
    issues: env.issues,
  };
}

export async function GET(request) {
  const requestId = createRequestId(request);

  try {
    const data = await buildHealth();
    return successResponse(data, { requestId });
  } catch (error) {
    console.error(`[health] ${requestId}`, normalizeError(error).cause || error);
    return errorResponse(
      new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Health check không khả dụng.', {
        cause: error,
      }),
      { requestId },
    );
  }
}
