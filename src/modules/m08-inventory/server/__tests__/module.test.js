import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M08').map((endpoint) => endpoint.code);

const UUID = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('M08 — hợp đồng server', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
  });

  it('mọi handler đều là function (không còn stub 501)', () => {
    for (const code of API_CODES) {
      expect(handlers[code]).toBeTypeOf('function');
    }
  });

  it('mọi API của module đều có schema validation', () => {
    for (const code of API_CODES) {
      expect(validationSchemas[code]).toBeTypeOf('object');
    }
  });

  it('validationSchemas chỉ khai báo API của module', () => {
    for (const code of Object.keys(validationSchemas)) {
      expect(API_CODES).toContain(code);
    }
  });
});

describe('M08 — validation tồn kho', () => {
  it('tách danh sách SKU và chuẩn hóa chữ hoa', () => {
    const parsed = validationSchemas['API-M08-01'].query.parse({ skus: 'abc-01, xyz-02' });
    expect(parsed.skus).toEqual(['ABC-01', 'XYZ-02']);
    expect(validationSchemas['API-M08-01'].query.safeParse({ skus: '' }).success).toBe(false);
  });

  it('giữ chỗ yêu cầu số lượng nguyên dương', () => {
    const schema = validationSchemas['API-M08-02'].body;
    expect(
      schema.safeParse({ order_ref: 'KD-01', items: [{ sku: 'ABC-01', quantity: 2 }] }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ order_ref: 'KD-01', items: [{ sku: 'ABC-01', quantity: 0 }] }).success,
    ).toBe(false);
  });

  it('phiếu nhập kho nhận VAT và mặc định không bắt buộc', () => {
    const parsed = validationSchemas['API-M08-05'].body.parse({
      supplier_id: UUID,
      warehouse_id: UUID_2,
      items: [{ sku: 'ABC-01', quantity: 10, unit_cost: 100000, vat_rate: 8 }],
    });
    expect(parsed.items[0].vat_rate).toBe(8);
    expect(
      validationSchemas['API-M08-05'].body.safeParse({
        supplier_id: UUID,
        warehouse_id: UUID_2,
        items: [{ sku: 'ABC-01', quantity: 10, unit_cost: 100000, vat_rate: 101 }],
      }).success,
    ).toBe(false);
  });

  it('kiểm kê bắt buộc lý do ≥ 10 ký tự và chênh lệch khác 0', () => {
    const schema = validationSchemas['API-M08-06'].body;
    const base = {
      warehouse_id: UUID,
      items: [{ sku: 'ABC-01', diff_quantity: 2, reason: 'Kiểm kê tháng 10' }],
    };
    expect(schema.safeParse(base).success).toBe(true);
    expect(
      schema.safeParse({
        ...base,
        items: [{ sku: 'ABC-01', diff_quantity: 2, reason: 'Thiếu' }],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...base,
        items: [{ sku: 'ABC-01', diff_quantity: 0, reason: 'Kiểm kê tháng 10' }],
      }).success,
    ).toBe(false);
  });

  it('thẻ kho chặn khoảng ngày ngược', () => {
    const schema = validationSchemas['API-M08-07'].query;
    expect(
      schema.safeParse({
        sku: 'ABC-01',
        warehouse_id: UUID,
        from_date: '2026-10-20',
        to_date: '2026-10-10',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        sku: 'ABC-01',
        warehouse_id: UUID,
        from_date: '2026-10-01',
        to_date: '2026-10-20',
      }).success,
    ).toBe(true);
  });
});

describe('M08 — validation quản trị kho/NCC', () => {
  it('chuẩn hóa mã kho và chặn mã sai', () => {
    const parsed = validationSchemas['API-M08-10'].body.parse({
      code: 'kho-hn',
      name: 'Kho Hà Nội',
    });
    expect(parsed.code).toBe('KHO-HN');
    expect(validationSchemas['API-M08-10'].body.safeParse({ code: 'K', name: 'Kho' }).success).toBe(
      false,
    );
  });

  it('cập nhật kho bắt buộc ít nhất một trường', () => {
    expect(validationSchemas['API-M08-11'].body.safeParse({}).success).toBe(false);
    expect(validationSchemas['API-M08-11'].body.safeParse({ is_default: true }).success).toBe(true);
  });

  it('email nhà cung cấp được chuẩn hóa chữ thường, ô trống thành null', () => {
    const parsed = validationSchemas['API-M08-13'].body.parse({
      code: 'ncc-01',
      name: 'Nhà cung cấp ABC',
      email: 'SALES@ABC.VN',
    });
    expect(parsed.email).toBe('sales@abc.vn');

    const empty = validationSchemas['API-M08-13'].body.parse({
      code: 'ncc-02',
      name: 'Nhà cung cấp XYZ',
      email: '',
      phone: '',
    });
    expect(empty.email).toBeNull();
    expect(empty.phone).toBeNull();
  });

  it('chuyển kho chặn trùng kho nguồn/đích', () => {
    const schema = validationSchemas['API-M08-19'].body;
    expect(
      schema.safeParse({
        from_warehouse_id: UUID,
        to_warehouse_id: UUID,
        items: [{ sku: 'ABC-01', quantity: 1 }],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        from_warehouse_id: UUID,
        to_warehouse_id: UUID_2,
        items: [{ sku: 'ABC-01', quantity: 1 }],
      }).success,
    ).toBe(true);
  });

  it('hàng hoàn mặc định là nguyên vẹn', () => {
    const parsed = validationSchemas['API-M08-21'].body.parse({
      order_ref: 'KD-01',
      warehouse_id: UUID,
      items: [{ sku: 'ABC-01', quantity: 1 }],
    });
    expect(parsed.items[0].condition).toBe('SELLABLE');
  });

  it('bộ lọc tồn thấp nhận chuỗi query và áp giới hạn limit', () => {
    const parsed = validationSchemas['API-M08-08'].query.parse({
      low_stock_only: 'true',
      page: '2',
      limit: '20',
    });
    expect(parsed.low_stock_only).toBe(true);
    expect(parsed.page).toBe(2);
    expect(validationSchemas['API-M08-22'].query.safeParse({ limit: 101 }).success).toBe(false);
  });
});
