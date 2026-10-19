import 'server-only';

/**
 * [SERVER] Đọc và kiểm tra biến môi trường phía server (lazy, không ném lỗi khi import).
 * SRS: 2.3, 2.7 — ứng dụng vẫn chạy khi chưa cấu hình Supabase; /api/v1/health báo not_configured.
 */
import { z } from 'zod';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { AppError, DatabaseNotConfiguredError } from '@/server/http/errors.js';

const emptyToUndefined = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url('URL không hợp lệ.').optional());
const integerSetting = (fallback, min, max) =>
  z
    .preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .min(min, `Giá trị tối thiểu là ${min}.`)
        .max(max, `Giá trị tối đa là ${max}.`),
    )
    .default(fallback);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_STORAGE_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).default('kaido-media')),
  JWT_ACCESS_SECRET: optionalString,
  JWT_REFRESH_SECRET: optionalString,
  JWT_ACCESS_TTL: integerSetting(900, 60, 86400),
  JWT_REFRESH_TTL: integerSetting(604800, 300, 31536000),
  BCRYPT_ROUNDS: integerSetting(12, 10, 14),
  CRON_SECRET: optionalString,
});

/** @type {z.infer<typeof serverEnvSchema> | null} */
let cachedEnv = null;

function envError(issues) {
  return new AppError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    'Cấu hình biến môi trường phía server chưa hợp lệ.',
    { details: issues },
  );
}

/**
 * Trả biến môi trường đã kiểm tra. Chỉ cache khi hợp lệ.
 * @returns {z.infer<typeof serverEnvSchema>}
 */
export function getEnv() {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      key: issue.path.join('.'),
      message: issue.message,
    }));
    throw envError(issues);
  }

  cachedEnv = Object.freeze(result.data);
  return cachedEnv;
}

/**
 * Kết quả kiểm tra env không ném lỗi — dùng cho health check.
 * Không chứa giá trị bí mật.
 */
export function getEnvStatus() {
  const result = serverEnvSchema.safeParse(process.env);
  return {
    valid: result.success,
    issues: result.success
      ? []
      : result.error.issues.map((issue) => ({
          key: issue.path.join('.'),
          message: issue.message,
        })),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseConfigured: isSupabaseConfigured(),
    authConfigured: isAuthConfigured(),
    cronConfigured: Boolean(emptyToUndefined(process.env.CRON_SECRET)),
  };
}

/**
 * Chỉ kiểm tra sự hiện diện của hai khóa Supabase, không phân tích toàn bộ env.
 */
export function isSupabaseConfigured() {
  return Boolean(
    emptyToUndefined(process.env.SUPABASE_URL) &&
    emptyToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function isAuthConfigured() {
  return Boolean(
    emptyToUndefined(process.env.JWT_ACCESS_SECRET) &&
    emptyToUndefined(process.env.JWT_REFRESH_SECRET),
  );
}

export function getSupabaseConfig() {
  const env = getEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new DatabaseNotConfiguredError();
  }
  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: env.SUPABASE_STORAGE_BUCKET,
  };
}

export function getStorageBucket() {
  return getEnv().SUPABASE_STORAGE_BUCKET;
}

export function getJwtConfig() {
  const env = getEnv();
  if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
    throw new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Chưa cấu hình JWT_ACCESS_SECRET và JWT_REFRESH_SECRET.',
    );
  }
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSeconds: env.JWT_ACCESS_TTL,
    refreshTtlSeconds: env.JWT_REFRESH_TTL,
  };
}

export function getCronSecret() {
  const secret = emptyToUndefined(process.env.CRON_SECRET);
  if (!secret) {
    throw new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Chưa cấu hình CRON_SECRET.');
  }
  return secret;
}

export function getSiteUrl() {
  return getEnv().NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function getBcryptRounds() {
  return getEnv().BCRYPT_ROUNDS;
}
