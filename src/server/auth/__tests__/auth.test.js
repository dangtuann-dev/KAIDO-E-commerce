import { describe, expect, it } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/server/auth/jwt.js';
import { hashPassword, verifyPassword } from '@/server/auth/password.js';
import { getRefreshTokenFromRequest, serializeRefreshTokenCookie } from '@/server/auth/cookies.js';
import { getGuestSessionId } from '@/server/auth/guestSession.js';

const USER_ID = '00000000-0000-4000-8000-000000000001';

describe('JWT', () => {
  it('ký và kiểm tra access token', async () => {
    const { token, expiresIn } = await signAccessToken({
      userId: USER_ID,
      role: 'CUSTOMER',
      email: 'khach@kaido.vn',
    });
    const payload = await verifyAccessToken(token);

    expect(expiresIn).toBeGreaterThan(0);
    expect(payload.userId).toBe(USER_ID);
    expect(payload.role).toBe('CUSTOMER');
    expect(payload.email).toBe('khach@kaido.vn');
  });

  it('không chấp nhận refresh token như access token', async () => {
    const { token } = await signRefreshToken({ userId: USER_ID, role: 'ADMIN' });

    await expect(verifyAccessToken(token)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    await expect(verifyRefreshToken(token)).resolves.toMatchObject({ role: 'ADMIN' });
  });

  it('từ chối token bị sửa', async () => {
    const { token } = await signAccessToken({ userId: USER_ID, role: 'CUSTOMER' });
    const tampered = `${token.slice(0, -2)}xx`;

    await expect(verifyAccessToken(tampered)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
  });
});

describe('bcrypt', () => {
  it('băm và kiểm tra mật khẩu', async () => {
    const hash = await hashPassword('Kaido123');
    expect(hash).not.toContain('Kaido123');
    await expect(verifyPassword('Kaido123', hash)).resolves.toBe(true);
    await expect(verifyPassword('SaiMatKhau1', hash)).resolves.toBe(false);
  });
});

describe('cookie refresh token', () => {
  it('đặt HttpOnly, SameSite=Lax và đọc lại từ request', async () => {
    const cookie = serializeRefreshTokenCookie('token-value', { maxAgeSeconds: 3600 });
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');

    const request = new Request('https://kaido.test/', {
      headers: { cookie: cookie.split(';')[0] },
    });
    expect(getRefreshTokenFromRequest(request)).toBe('token-value');
  });
});

describe('guest session', () => {
  it('chỉ chấp nhận ID đúng định dạng', () => {
    const valid = new Request('https://kaido.test/', {
      headers: { 'x-guest-session-id': '11111111-2222-4333-8444-555555555555' },
    });
    const invalid = new Request('https://kaido.test/', {
      headers: { 'x-guest-session-id': 'abc' },
    });

    expect(getGuestSessionId(valid)).toBe('11111111-2222-4333-8444-555555555555');
    expect(getGuestSessionId(invalid)).toBeNull();
  });
});
