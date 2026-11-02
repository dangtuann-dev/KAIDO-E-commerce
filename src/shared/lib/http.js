/**
 * [SHARED] HTTP client — gọi API nội bộ theo envelope chuẩn (SRS §2.5).
 * - Access token CHỈ giữ trong bộ nhớ (biến module), không dùng localStorage.
 * - Refresh token là cookie HttpOnly; khi 401, tự gọi refresh một lần rồi retry.
 * - Gắn X-Guest-Session-Id cho giỏ khách vãng lai (M04, BR-M04-04).
 * - Không gọi Supabase trực tiếp từ trình duyệt.
 */
import { GUEST_SESSION_HEADER, REQUEST_ID_HEADER } from '@/shared/constants/auth.js';

const API_PREFIX = '/api/v1';

/**
 * POST /api/v1/auth/refresh (API-M01-14) đọc cookie refresh token và xoay token.
 */
export const REFRESH_ENDPOINT = '/api/v1/auth/refresh';

const GUEST_SESSION_STORAGE_KEY = 'kaido_guest_session_id';

let accessToken = null;
let refreshPromise = null;

export class ApiError extends Error {
  /**
   * @param {{ code?: string, message?: string, status?: number, details?: unknown, requestId?: string | null }} input
   */
  constructor({
    code = 'UNKNOWN_ERROR',
    message = 'Đã có lỗi xảy ra.',
    status = 0,
    details,
    requestId = null,
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export function setAccessToken(token) {
  accessToken = typeof token === 'string' && token ? token : null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Đọc (và tạo nếu chưa có) mã phiên giỏ khách vãng lai — BR-M04-04.
 * M04 dùng lại hàm này để biết khi nào cần gộp giỏ sau khi đăng nhập (M04-F08).
 */
export function getGuestSessionId() {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const created = createId();
    window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

/**
 * Chỉ đọc mã phiên giỏ khách đã có (không tạo mới).
 * Dùng khi cần biết “khách này từng có giỏ hàng chưa” — ví dụ gộp giỏ sau đăng nhập (M04-F08).
 */
export function readGuestSessionId() {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    return existing || null;
  } catch {
    return null;
  }
}

/**
 * Xóa mã phiên giỏ khách sau khi đã gộp vào giỏ thành viên để không gộp lặp lại
 * (M04-F08). Lần mua với tư cách khách kế tiếp sẽ nhận mã phiên mới.
 */
export function clearGuestSessionId() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
  } catch {
    // Trình duyệt chặn localStorage: bỏ qua, server vẫn chống gộp lặp bằng trạng thái MERGED.
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/api/') ? path : `${API_PREFIX}${path}`;
  if (!query) return normalizedPath;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') search.append(key, String(item));
      });
    } else {
      search.set(key, String(value));
    }
  }

  const serialized = search.toString();
  return serialized ? `${normalizedPath}?${serialized}` : normalizedPath;
}

/**
 * Thay tham số động `[orderRef]`, `[idOrSlug]`... bằng giá trị đã mã hóa.
 * @param {string} path
 * @param {Record<string, string | number>} [params]
 */
export function resolveEndpointPath(path, params = {}) {
  return path.replace(/\[([^\]]+)\]/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Thiếu tham số đường dẫn "${key}" cho ${path}.`);
    }
    return encodeURIComponent(String(value));
  });
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(REFRESH_ENDPOINT, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          clearAccessToken();
          return null;
        }

        const payload = await response.json().catch(() => null);
        const token = payload?.data?.access_token ?? null;
        if (token) setAccessToken(token);
        return token;
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function ensureAccessToken() {
  if (accessToken) return accessToken;
  return refreshAccessToken();
}

/**
 * Gọi API và trả về đầy đủ `{ data, meta, requestId }`.
 * @param {string} path Đường dẫn bắt đầu bằng /api/v1 hoặc /api/cron.
 * @param {{
 *   method?: string,
 *   query?: Record<string, unknown>,
 *   body?: unknown,
 *   headers?: Record<string, string>,
 *   auth?: boolean,
 *   signal?: AbortSignal,
 * }} [options]
 * @returns {Promise<{ data: unknown, meta: unknown, requestId: string | null }>}
 */
export async function request(path, options = {}) {
  if (typeof window === 'undefined') {
    throw new ApiError({
      code: 'CLIENT_ONLY',
      message: 'http client chỉ được gọi trong trình duyệt.',
    });
  }

  const {
    method = 'GET',
    query,
    body,
    headers = {},
    auth = true,
    signal,
    retryOnUnauthorized = true,
  } = options;

  async function execute(isRetry) {
    const requestHeaders = {
      Accept: 'application/json',
      [REQUEST_ID_HEADER]: createId(),
      ...headers,
    };

    const guestSessionId = getGuestSessionId();
    if (guestSessionId) requestHeaders[GUEST_SESSION_HEADER] = guestSessionId;

    if (auth && accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }

    let payload = body;
    if (
      body !== undefined &&
      body !== null &&
      !(body instanceof FormData) &&
      typeof body !== 'string'
    ) {
      requestHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(path, query), {
      method,
      headers: requestHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : payload,
      credentials: 'same-origin',
      signal,
    });

    if (response.status === 401 && auth && retryOnUnauthorized && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return execute(true);
    }

    if (response.status === 204) {
      return { data: null, meta: null, requestId: response.headers.get(REQUEST_ID_HEADER) };
    }

    const raw = await response.text();
    let parsed = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401) clearAccessToken();
      const error = parsed?.error;
      throw new ApiError({
        code: error?.code ?? `HTTP_${response.status}`,
        message: error?.message ?? 'Không thể kết nối máy chủ. Vui lòng thử lại.',
        status: response.status,
        details: error?.details,
        requestId: parsed?.requestId ?? response.headers.get(REQUEST_ID_HEADER),
      });
    }

    if (parsed && parsed.success === true) {
      return {
        data: parsed.data ?? null,
        meta: parsed.meta ?? null,
        requestId: parsed.requestId ?? response.headers.get(REQUEST_ID_HEADER),
      };
    }

    return {
      data: parsed,
      meta: null,
      requestId: response.headers.get(REQUEST_ID_HEADER),
    };
  }

  return execute(false);
}

/** Wrapper trả về `data` — dùng trong service của từng module. */
export const api = {
  /**
   * @param {string} path
   * @param {Parameters<typeof request>[1]} [options]
   */
  get: (path, options) =>
    request(path, { ...options, method: 'GET' }).then((result) => result.data),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {Parameters<typeof request>[1]} [options]
   */
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body }).then((result) => result.data),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {Parameters<typeof request>[1]} [options]
   */
  put: (path, body, options) =>
    request(path, { ...options, method: 'PUT', body }).then((result) => result.data),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {Parameters<typeof request>[1]} [options]
   */
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }).then((result) => result.data),
  /**
   * @param {string} path
   * @param {Parameters<typeof request>[1]} [options]
   */
  delete: (path, options) =>
    request(path, { ...options, method: 'DELETE' }).then((result) => result.data),
};
