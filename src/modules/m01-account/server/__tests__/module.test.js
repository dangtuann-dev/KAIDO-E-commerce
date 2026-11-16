import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M01').map((endpoint) => endpoint.code);

describe('M01 — khung server', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
  });

  it('API-M01-06 đã nối handler quên mật khẩu (không còn 501)', () => {
    expect(typeof handlers['API-M01-06']).toBe('function');
  });

  it('API-M01-07 chặn người dùng không phải ADMIN', async () => {
    const error = await handlers['API-M01-07']({
      auth: { userId: 'staff-1', role: 'STAFF' },
      query: {},
    }).catch((caught) => caught);
    expect(error.status).toBe(403);
  });

  it('validationSchemas chỉ khai báo API của module', () => {
    for (const code of Object.keys(validationSchemas)) {
      expect(API_CODES).toContain(code);
    }
  });
});
