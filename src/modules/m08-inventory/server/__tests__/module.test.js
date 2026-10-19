import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { NotImplementedError } from '@/server/http/errors.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M08').map((endpoint) => endpoint.code);

describe('M08 — khung server', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
  });

  it.each(API_CODES)('%s trả 501 NOT_IMPLEMENTED kèm mã API', async (code) => {
    const error = await handlers[code]({}).catch((caught) => caught);
    expect(error).toBeInstanceOf(NotImplementedError);
    expect(error.status).toBe(501);
    expect(error.code).toBe('NOT_IMPLEMENTED');
    expect(error.reference).toBe(code);
  });

  it('validationSchemas chỉ khai báo API của module', () => {
    for (const code of Object.keys(validationSchemas)) {
      expect(API_CODES).toContain(code);
    }
  });
});
