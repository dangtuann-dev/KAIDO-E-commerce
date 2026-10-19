import 'server-only';

/**
 * [SERVER] Ký/kiểm tra JWT bằng jose (HS256) — M01-F02, BR-M01-02.
 * Access token 15 phút (giữ trong bộ nhớ client), refresh token 7 ngày (cookie HttpOnly).
 * TODO(M01-F02): lưu hash refresh token vào bảng refresh_tokens và xoay vòng khi refresh.
 */
import { randomUUID } from 'node:crypto';
import { SignJWT, errors as joseErrors, jwtVerify } from 'jose';
import { JWT_AUDIENCE, JWT_ISSUER, JWT_TOKEN_TYPES } from '@/shared/constants/auth.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ROLE_VALUES } from '@/shared/constants/roles.js';
import { getJwtConfig } from '@/server/env.js';
import { AppError } from '@/server/http/errors.js';

const ALGORITHM = 'HS256';
const secretEncoder = new TextEncoder();

function toSecretKey(secret) {
  return secretEncoder.encode(secret);
}

function assertUser(userId, role) {
  if (typeof userId !== 'string' || !userId) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Thiếu userId khi tạo token.');
  }
  if (!ROLE_VALUES.includes(role)) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Vai trò không hợp lệ khi tạo token.');
  }
}

/**
 * @param {{ userId: string, role: string, email?: string | null }} input
 * @returns {Promise<{ token: string, expiresIn: number }>}
 */
export async function signAccessToken({ userId, role, email = null }) {
  assertUser(userId, role);
  const config = getJwtConfig();
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    role,
    email,
    type: JWT_TOKEN_TYPES.ACCESS,
  })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + config.accessTtlSeconds)
    .sign(toSecretKey(config.accessSecret));

  return { token, expiresIn: config.accessTtlSeconds };
}

/**
 * @param {{ userId: string, role: string, tokenId?: string }} input
 * @returns {Promise<{ token: string, expiresIn: number, tokenId: string }>}
 */
export async function signRefreshToken({ userId, role, tokenId }) {
  assertUser(userId, role);
  const config = getJwtConfig();
  const jti = tokenId || randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    role,
    type: JWT_TOKEN_TYPES.REFRESH,
  })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(jti)
    .setIssuedAt(now)
    .setExpirationTime(now + config.refreshTtlSeconds)
    .sign(toSecretKey(config.refreshSecret));

  return { token, expiresIn: config.refreshTtlSeconds, tokenId: jti };
}

function toTokenError(error) {
  if (error instanceof AppError) return error;
  const code = /** @type {{ code?: string }} */ (error)?.code;
  if (error instanceof joseErrors.JWTExpired || code === 'ERR_JWT_EXPIRED') {
    return new AppError(ERROR_CODES.TOKEN_EXPIRED, undefined, { cause: error });
  }
  return new AppError(ERROR_CODES.INVALID_TOKEN, undefined, { cause: error });
}

async function verifyToken(token, expectedType, secret) {
  if (typeof token !== 'string' || !token) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  try {
    const { payload } = await jwtVerify(token, toSecretKey(secret), {
      algorithms: [ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.type !== expectedType) {
      throw new AppError(ERROR_CODES.INVALID_TOKEN);
    }
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new AppError(ERROR_CODES.INVALID_TOKEN);
    }
    if (!ROLE_VALUES.includes(payload.role)) {
      throw new AppError(ERROR_CODES.INVALID_TOKEN);
    }

    return {
      userId: payload.sub,
      role: payload.role,
      email: typeof payload.email === 'string' ? payload.email : null,
      tokenId: typeof payload.jti === 'string' ? payload.jti : null,
      issuedAt: payload.iat ?? null,
      expiresAt: payload.exp ?? null,
      payload,
    };
  } catch (error) {
    throw toTokenError(error);
  }
}

/**
 * @param {string} token
 * @returns {Promise<{ userId: string, role: string, email: string | null, tokenId: string | null, issuedAt: number | null, expiresAt: number | null, payload: Record<string, unknown> }>}
 */
export async function verifyAccessToken(token) {
  const config = getJwtConfig();
  return verifyToken(token, JWT_TOKEN_TYPES.ACCESS, config.accessSecret);
}

/**
 * @param {string} token
 * @returns {Promise<{ userId: string, role: string, email: string | null, tokenId: string | null, issuedAt: number | null, expiresAt: number | null, payload: Record<string, unknown> }>}
 */
export async function verifyRefreshToken(token) {
  const config = getJwtConfig();
  return verifyToken(token, JWT_TOKEN_TYPES.REFRESH, config.refreshSecret);
}
