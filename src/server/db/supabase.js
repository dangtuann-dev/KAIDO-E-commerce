import 'server-only';

/**
 * [SERVER] Supabase client dùng service role — CHỈ chạy server, bỏ qua RLS.
 * SRS: 2.3 — mọi thao tác nguyên tử gọi PL/pgSQL qua rpc(); không có transaction đa câu lệnh.
 */
import { createClient } from '@supabase/supabase-js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getSupabaseConfig, isSupabaseConfigured } from '@/server/env.js';
import { AppError, DatabaseNotConfiguredError, fromSupabaseError } from '@/server/http/errors.js';

const GLOBAL_CLIENT_KEY = '__kaidoSupabaseAdmin';

export { isSupabaseConfigured };

/**
 * Client service role được cache theo process (và globalThis để sống qua hot reload).
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseAdmin() {
  if (globalThis[GLOBAL_CLIENT_KEY]) return globalThis[GLOBAL_CLIENT_KEY];

  if (!isSupabaseConfigured()) throw new DatabaseNotConfiguredError();
  const { url, serviceRoleKey } = getSupabaseConfig();

  const client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-kaido-client': 'server' },
    },
  });

  globalThis[GLOBAL_CLIENT_KEY] = client;
  return client;
}

/**
 * Gọi hàm PL/pgSQL và chuẩn hóa lỗi PostgREST thành AppError.
 * @param {string} functionName
 * @param {Record<string, unknown>} [params]
 * @returns {Promise<unknown>}
 */
export async function rpc(functionName, params = {}) {
  if (typeof functionName !== 'string' || !functionName) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Tên RPC không hợp lệ.');
  }

  try {
    const { data, error } = await getSupabaseAdmin().rpc(functionName, params);
    if (error) throw fromSupabaseError(error);
    return data;
  } catch (error) {
    throw fromSupabaseError(error);
  }
}

/**
 * Kiểm tra kết nối DB cho health check. Không ném lỗi.
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ status: 'not_configured' | 'ok' | 'unreachable', latency_ms: number | null, error_code: string | null }>}
 */
export async function pingDatabase(options = {}) {
  if (!isSupabaseConfigured()) {
    return { status: 'not_configured', latency_ms: null, error_code: null };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutMs = Math.max(500, Number(options.timeoutMs) || 2000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { error } = await getSupabaseAdmin()
      .from('system_settings')
      .select('key')
      .limit(1)
      .abortSignal(controller.signal);

    const latency = Date.now() - startedAt;
    if (error) {
      return {
        status: 'unreachable',
        latency_ms: latency,
        error_code: typeof error.code === 'string' ? error.code : null,
      };
    }
    return { status: 'ok', latency_ms: latency, error_code: null };
  } catch {
    return {
      status: 'unreachable',
      latency_ms: Date.now() - startedAt,
      error_code: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
