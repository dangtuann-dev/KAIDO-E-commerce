import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { clearCache } from '@/server/cache/index.js';
import { signAccessToken } from '@/server/auth/jwt.js';
import { NotImplementedError } from '@/server/http/errors.js';
import { withApi } from '@/server/http/withApi.js';

const PUBLIC_ENDPOINT = 'API-M02-01';
const USER_PROFILE_ENDPOINT = 'API-M01-03';
const ADMIN_USERS_ENDPOINT = 'API-M01-07';
const ADMIN_CREATE_PRODUCT_ENDPOINT = 'API-M02-04';
const LOGIN_ENDPOINT = 'API-M01-01';

function request(path, options = {}) {
  return new Request(`https://kaido.test${path}`, options);
}

async function tokenFor(role, userId = '00000000-0000-4000-8000-000000000001') {
  const { token } = await signAccessToken({ userId, role, email: 'test@kaido.vn' });
  return token;
}

beforeEach(async () => {
  await clearCache();
});

describe('withApi — envelope và lỗi', () => {
  it('bọc dữ liệu thành công vào envelope và gắn requestId', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async () => ({ categories: [] }));
    const response = await route(request('/api/v1/categories/tree'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toMatchObject({ success: true, data: { categories: [] } });
    expect(typeof body.meta.requestId).toBe('string');
    expect(response.headers.get('x-request-id')).toBe(body.meta.requestId);
  });

  it('giữ requestId do client hợp lệ gửi lên', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async () => ({ ok: true }));
    const response = await route(
      request('/api/v1/categories/tree', { headers: { 'x-request-id': 'req-12345678' } }),
    );
    const body = await response.json();

    expect(body.meta.requestId).toBe('req-12345678');
    expect(response.headers.get('x-request-id')).toBe('req-12345678');
  });

  it('trả 501 NOT_IMPLEMENTED đúng envelope', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async () => {
      throw new NotImplementedError('M02-F01');
    });
    const response = await route(request('/api/v1/categories/tree'));
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', details: { todo: 'M02-F01' } },
    });
    expect(typeof body.requestId).toBe('string');
  });

  it('trả 405 khi sai method', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async () => ({ ok: true }));
    const response = await route(
      request('/api/v1/categories/tree', { method: 'POST', body: '{}' }),
    );
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
    expect(response.headers.get('allow')).toBe('GET');
  });

  it('trả 401 khi endpoint yêu cầu đăng nhập', async () => {
    const route = withApi(USER_PROFILE_ENDPOINT, async () => ({ id: 'x' }));
    const response = await route(request('/api/v1/user/profile'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(typeof body.requestId).toBe('string');
  });

  it('trả 403 khi vai trò không được phép vào endpoint admin', async () => {
    const token = await tokenFor('CUSTOMER');
    const route = withApi(ADMIN_USERS_ENDPOINT, async () => ({ users: [] }));
    const response = await route(
      request('/api/v1/admin/users', { headers: { authorization: `Bearer ${token}` } }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('cho phép ADMIN gọi endpoint admin và truyền auth vào handler', async () => {
    const token = await tokenFor('ADMIN');
    const route = withApi(ADMIN_USERS_ENDPOINT, async (ctx) => ({
      role: ctx.auth?.role,
      requestId: ctx.requestId,
    }));
    const response = await route(
      request('/api/v1/admin/users', { headers: { authorization: `Bearer ${token}` } }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.role).toBe('ADMIN');
  });

  it('validate body bằng Zod và trả details lỗi 422', async () => {
    const token = await tokenFor('ADMIN');
    const route = withApi(ADMIN_CREATE_PRODUCT_ENDPOINT, async () => ({ created: true }), {
      schemas: { body: z.object({ name: z.string().min(2) }) },
    });
    const response = await route(
      request('/api/v1/admin/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details[0]).toMatchObject({ path: 'name' });
  });

  it('validate và coerce query theo schema', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async (ctx) => ctx.query, {
      schemas: { query: z.object({ page: z.coerce.number().int().min(1) }) },
    });
    const response = await route(request('/api/v1/categories/tree?page=2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.page).toBe(2);
  });

  it('đọc header X-Guest-Session-Id hợp lệ', async () => {
    const route = withApi(PUBLIC_ENDPOINT, async (ctx) => ({ guest: ctx.guestSessionId }));
    const response = await route(
      request('/api/v1/categories/tree', {
        headers: { 'x-guest-session-id': '11111111-2222-4333-8444-555555555555' },
      }),
    );
    const body = await response.json();

    expect(body.data.guest).toBe('11111111-2222-4333-8444-555555555555');
  });

  it('áp rate limit theo preset và trả 429 khi vượt ngưỡng', async () => {
    const route = withApi(LOGIN_ENDPOINT, async () => ({ ok: true }));
    let response;

    for (let attempt = 0; attempt < 11; attempt += 1) {
      response = await route(request('/api/v1/auth/login', { method: 'POST' }));
    }

    const body = await response.json();
    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(response.headers.get('retry-after')).toBeTruthy();
  });
});
