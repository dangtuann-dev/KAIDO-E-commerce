import 'server-only';

/**
 * [SERVER] withApi — bọc route handler theo registry: method, auth, RBAC, rate limit,
 * validate Zod, envelope lỗi và requestId (SRS 2.5, BR-M01-05).
 *
 * Cách dùng trong route do scripts/gen-routes.js sinh:
 *   export const POST = withApi('API-M05-02', handlers['API-M05-02'], {
 *     schemas: validationSchemas['API-M05-02'],
 *   });
 *
 * Handler nhận ctx và trả về data (tự bọc success) hoặc một Response đầy đủ.
 */
import { randomUUID } from 'node:crypto';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { REQUEST_ID_HEADER } from '@/shared/constants/auth.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ADMIN_ROLES } from '@/shared/constants/roles.js';
import { canAccessAdminPanel } from '@/shared/rbac/permissions.js';
import { formatZodError } from '@/shared/validation/index.js';
import { getGuestSessionId } from '@/server/auth/guestSession.js';
import { verifyAccessToken } from '@/server/auth/jwt.js';
import { errorResponse, successResponse } from '@/server/http/apiResponse.js';
import { AppError, normalizeError } from '@/server/http/errors.js';
import { checkRateLimit } from '@/server/security/rateLimit.js';

const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * @typedef {Object} ApiHandlerContext
 * @property {Request} request
 * @property {Record<string, string>} params
 * @property {Record<string, string>} query
 * @property {unknown} body
 * @property {string} rawBody
 * @property {{ userId: string, role: string, email: string | null } | null} auth
 * @property {string} requestId
 * @property {string | null} guestSessionId
 * @property {object} endpoint
 */

/**
 * @param {Request} request
 * @returns {string}
 */
export function createRequestId(request) {
  const incoming = request.headers.get(REQUEST_ID_HEADER)?.trim();
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
}

/**
 * @param {Request} request
 * @returns {string | null}
 */
function readBearerToken(request) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

function requiresAuthentication(endpoint) {
  return endpoint.access === 'auth' || endpoint.access === 'role';
}

async function resolveAuth(request, endpoint) {
  const token = readBearerToken(request);
  if (!token) {
    if (requiresAuthentication(endpoint)) throw new AppError(ERROR_CODES.UNAUTHORIZED);
    return null;
  }

  try {
    return await verifyAccessToken(token);
  } catch (error) {
    if (requiresAuthentication(endpoint)) throw error;
    return null;
  }
}

function assertRole(auth, endpoint) {
  if (!requiresAuthentication(endpoint)) return;
  if (!auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);

  const isAdminPath = endpoint.path.startsWith('/api/v1/admin/');
  if (isAdminPath && !canAccessAdminPanel(auth.role)) {
    throw new AppError(ERROR_CODES.FORBIDDEN);
  }

  const requiredRoles = endpoint.roles ?? [];
  if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
    throw new AppError(ERROR_CODES.FORBIDDEN);
  }

  // access=role nhưng registry thiếu roles: mặc định chỉ ADMIN/STAFF (BR-M01-05).
  if (
    endpoint.access === 'role' &&
    requiredRoles.length === 0 &&
    !ADMIN_ROLES.includes(auth.role)
  ) {
    throw new AppError(ERROR_CODES.FORBIDDEN);
  }
}

async function readRequestBody(request) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return { body: undefined, rawBody: '' };

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Nội dung yêu cầu quá lớn.', {
      details: { max_bytes: MAX_BODY_BYTES },
    });
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) return { body: undefined, rawBody };
  if (contentLength === 0 && rawBody.length > MAX_BODY_BYTES) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Nội dung yêu cầu quá lớn.', {
      details: { max_bytes: MAX_BODY_BYTES },
    });
  }

  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { body: Object.fromEntries(new URLSearchParams(rawBody).entries()), rawBody };
  }

  if (contentType.includes('application/json') || contentType.includes('+json')) {
    try {
      return { body: JSON.parse(rawBody), rawBody };
    } catch {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Nội dung JSON không hợp lệ.');
    }
  }

  return { body: rawBody, rawBody };
}

function validateInput(schemas, input) {
  const validated = { ...input };
  if (!schemas) return validated;

  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema || typeof schema.safeParse !== 'function') continue;

    const result = schema.safeParse(validated[key]);
    if (!result.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, undefined, {
        details: formatZodError(result.error),
      });
    }
    validated[key] = result.data;
  }

  return validated;
}

function withExtraHeaders(response, extraHeaders) {
  if (!extraHeaders || Object.keys(extraHeaders).length === 0) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(extraHeaders)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * @param {string} code Mã API trong registry, ví dụ "API-M05-02".
 * @param {(ctx: ApiHandlerContext) => Promise<unknown> | unknown} handler
 * @param {{ schemas?: { body?: unknown, query?: unknown, params?: unknown } }} [options]
 * @returns {(request: Request, routeContext?: { params?: Promise<Record<string, string>> | Record<string, string> }) => Promise<Response>}
 */
export function withApi(code, handler, options = {}) {
  if (typeof handler !== 'function') {
    throw new TypeError(`withApi("${code}") yêu cầu handler là function.`);
  }

  return async function apiRoute(request, routeContext) {
    const requestId = createRequestId(request);
    let rateLimit = null;

    try {
      const endpoint = getApiEndpoint(code);
      if (!endpoint) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Endpoint ${code} chưa được đăng ký.`);
      }

      if (request.method.toUpperCase() !== endpoint.method) {
        throw new AppError(ERROR_CODES.METHOD_NOT_ALLOWED, undefined, {
          headers: { allow: endpoint.method },
        });
      }

      rateLimit = await checkRateLimit(request, endpoint.rateLimit);
      const auth = await resolveAuth(request, endpoint);
      assertRole(auth, endpoint);

      const { body, rawBody } = await readRequestBody(request);
      const url = new URL(request.url);
      const query = Object.fromEntries(url.searchParams.entries());
      const params = routeContext?.params ? await routeContext.params : {};

      const validated = validateInput(options.schemas, { params, query, body });

      /** @type {ApiHandlerContext} */
      const ctx = {
        request,
        params: validated.params || {},
        query: validated.query || {},
        body: validated.body,
        rawBody,
        auth,
        requestId,
        guestSessionId: getGuestSessionId(request),
        endpoint,
      };

      const result = await handler(ctx);

      if (result instanceof Response) {
        return withExtraHeaders(result, {
          ...(rateLimit?.headers || {}),
          [REQUEST_ID_HEADER]: requestId,
        });
      }

      return successResponse(result ?? null, {
        requestId,
        headers: rateLimit?.headers,
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : normalizeError(error);
      const shouldLog =
        !(error instanceof AppError) ||
        (appError.status >= 500 && appError.code !== ERROR_CODES.NOT_IMPLEMENTED);
      if (shouldLog) {
        console.error(`[api:${code}] ${requestId}`, appError.cause || error);
      }

      return errorResponse(appError, {
        requestId,
        headers: rateLimit?.headers,
      });
    }
  };
}
