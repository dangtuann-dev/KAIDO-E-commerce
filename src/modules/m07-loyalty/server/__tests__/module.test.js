import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { earnedPointsFor, maxRedeemablePoints } from '../service.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M07').map((endpoint) => endpoint.code);

const VALID_VOUCHER = {
  code: 'tet2027',
  type: 'PERCENT',
  value: 15,
  max_discount: 50000,
  min_order: 200000,
  usage_limit: 100,
  start_time: '2027-01-01T00:00:00.000Z',
  end_time: '2027-02-01T00:00:00.000Z',
};

describe('M07 — hợp đồng server', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
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

describe('M07 — validation kiểm tra voucher (F02, API-M07-01)', () => {
  const schema = validationSchemas['API-M07-01'].body;

  it('chuẩn hóa mã về chữ hoa', () => {
    const parsed = schema.parse({ code: ' toy2026 ', order_subtotal: 250000 });
    expect(parsed.code).toBe('TOY2026');
  });

  it('từ chối mã sai định dạng và tạm tính âm', () => {
    expect(schema.safeParse({ code: 'TOY', order_subtotal: 1000 }).success).toBe(false);
    expect(schema.safeParse({ code: 'TOY2026', order_subtotal: -1 }).success).toBe(false);
  });
});

describe('M07 — validation phân trang lịch sử điểm (F07, API-M07-03)', () => {
  const schema = validationSchemas['API-M07-03'].query;

  it('áp dụng mặc định page=1, limit=20', () => {
    const parsed = schema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it('giới hạn limit tối đa 100', () => {
    expect(schema.safeParse({ limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ limit: 50 }).success).toBe(true);
  });
});

describe('M07 — validation tiêu điểm (F04, API-M07-04)', () => {
  const schema = validationSchemas['API-M07-04'].body;

  it('chỉ nhận điểm là bội số của 10', () => {
    expect(schema.safeParse({ points_redeemed: 25, subtotal: 500000 }).success).toBe(false);
    expect(schema.safeParse({ points_redeemed: 30, subtotal: 500000 }).success).toBe(true);
  });

  it('chuẩn hóa mã voucher và từ chối điểm âm', () => {
    const parsed = schema.parse({
      points_redeemed: 0,
      voucher_code: 'toy2026',
      subtotal: 100000,
    });
    expect(parsed.voucher_code).toBe('TOY2026');
    expect(schema.safeParse({ points_redeemed: -10, subtotal: 100000 }).success).toBe(false);
  });
});

describe('M07 — validation tạo voucher (F01, API-M07-05)', () => {
  const schema = validationSchemas['API-M07-05'].body;

  it('chấp nhận voucher hợp lệ và mặc định đơn tối thiểu 0', () => {
    const parsed = schema.parse({ code: 'tet2027', type: 'PERCENT', value: 15 });
    expect(parsed.code).toBe('TET2027');
    expect(parsed.min_order).toBe(0);
  });

  it('ràng buộc giá trị theo loại giảm', () => {
    expect(schema.safeParse({ ...VALID_VOUCHER, value: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_VOUCHER, value: 101 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_VOUCHER, type: 'FIXED', value: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_VOUCHER, type: 'FIXED', value: 50000 }).success).toBe(true);
  });

  it('từ chối khung hiệu lực đảo ngược', () => {
    const result = schema.safeParse({
      ...VALID_VOUCHER,
      start_time: '2027-02-01T00:00:00.000Z',
      end_time: '2027-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path.includes('end_time'))).toBe(true);
  });
});

describe('M07 — quy tắc tích điểm (F03, BR-M07-01)', () => {
  it('100.000đ = 1 điểm, làm tròn xuống', () => {
    expect(earnedPointsFor(100000)).toBe(1);
    expect(earnedPointsFor(250000)).toBe(2);
    expect(earnedPointsFor(99999)).toBe(0);
  });

  it('áp hệ số hạng thành viên', () => {
    expect(earnedPointsFor(1000000, 1)).toBe(10);
    expect(earnedPointsFor(1000000, 1.2)).toBe(12);
    expect(earnedPointsFor(1000000, 1.5)).toBe(15);
    expect(earnedPointsFor(1000000, 2)).toBe(20);
  });

  it('bỏ qua số tiền âm hoặc hệ số không hợp lệ', () => {
    expect(earnedPointsFor(-500000, 2)).toBe(0);
    expect(earnedPointsFor(100000, 0)).toBe(1);
  });
});

describe('M07 — trần quy đổi điểm (F04, BR-M07-02)', () => {
  it('giới hạn 50% giá trị hàng và bội số 10', () => {
    expect(maxRedeemablePoints(1000, 1000000)).toBe(500);
    expect(maxRedeemablePoints(1000, 50000)).toBe(20);
    expect(maxRedeemablePoints(1000, 0)).toBe(0);
  });

  it('không vượt quá số điểm khả dụng', () => {
    expect(maxRedeemablePoints(25, 1000000)).toBe(20);
    expect(maxRedeemablePoints(7, 1000000)).toBe(0);
  });
});
