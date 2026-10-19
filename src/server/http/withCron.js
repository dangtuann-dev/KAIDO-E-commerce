import 'server-only';

/**
 * [SERVER] Bọc route Vercel Cron: xác thực Authorization: Bearer <CRON_SECRET>.
 * SRS: 2.6 — job ngày/giờ chạy qua Route Handler, không dùng worker thường trực.
 */
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getCronSecret } from '@/server/env.js';
import { errorResponse, successResponse } from '@/server/http/apiResponse.js';
import { AppError, normalizeError } from '@/server/http/errors.js';
import { createRequestId } from '@/server/http/withApi.js';
import { timingSafeEqualStrings } from '@/server/security/verifySignature.js';

/**
 * @param {string} jobName
 * @param {(ctx: { request: Request, requestId: string, jobName: string }) => Promise<unknown>} handler
 * @returns {(request: Request) => Promise<Response>}
 */
export function withCron(jobName, handler) {
  return async function cronRoute(request) {
    const requestId = createRequestId(request);

    try {
      const secret = getCronSecret();
      const provided = request.headers.get('authorization') || '';
      if (!timingSafeEqualStrings(provided, `Bearer ${secret}`)) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED);
      }

      const data = await handler({ request, requestId, jobName });
      return successResponse(data ?? { job: jobName, status: 'DONE' }, { requestId });
    } catch (error) {
      const appError = error instanceof AppError ? error : normalizeError(error);
      const shouldLog =
        !(error instanceof AppError) ||
        (appError.status >= 500 && appError.code !== ERROR_CODES.NOT_IMPLEMENTED);
      if (shouldLog) {
        console.error(`[cron:${jobName}] ${requestId}`, appError.cause || error);
      }
      return errorResponse(appError, { requestId });
    }
  };
}
