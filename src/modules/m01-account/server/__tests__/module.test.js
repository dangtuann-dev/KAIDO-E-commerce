import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { NotImplementedError } from '@/server/http/errors.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M01').map((endpoint) => endpoint.code);

describe('M01 — khung server', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
  });

  // API-M01-06 chưa triển khai; M01-07 đã nối danh sách người dùng cho ADMIN.
  it('API-M01-06 trả 501 NOT_IMPLEMENTED kèm mã API', async () => {
    const error = await handlers['API-M01-06']({}).catch((caught) => caught);
    expect(error).toBeInstanceOf(NotImplementedError);
    expect(error.status).toBe(501);
    expect(error.code).toBe('NOT_IMPLEMENTED');
    expect(error.reference).toBe('API-M01-06');
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
