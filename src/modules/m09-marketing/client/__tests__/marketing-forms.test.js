/**
 * [TOY-M09] Hợp đồng phía client: chuyển đổi ngày giờ theo múi giờ Việt Nam
 * và schema form mã giảm giá (tạo mới vs. chỉnh sửa). Thuần hàm, không cần DOM.
 */
import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  fromDateTimeInput,
  toDateTimeInput,
} from '../display.js';
import { buildCouponFormSchema } from '../validation/coupon-form.schema.js';

const PRODUCT_UUID = '7b1c4d1e-2f3a-4b5c-8d9e-0f1a2b3c4d5e';

const VALID_CREATE = {
  code: 'toy2026',
  name: '',
  description: '',
  type: 'PERCENT',
  value: '10',
  max_discount: '',
  min_order: '',
  scope: 'ALL',
  applicable_targets: '',
  usage_limit: '',
  usage_limit_per_user: '',
  start_time: '2026-11-01T08:00',
  end_time: '2026-11-30T23:59',
  is_active: true,
};

function issuePaths(result) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('display — ngày giờ theo Asia/Ho_Chi_Minh', () => {
  it('hiển thị ISO theo giờ Việt Nam', () => {
    expect(formatDateTime('2026-10-31T01:00:00.000Z')).toMatch(/08:00/);
    expect(formatDate('2026-10-31T17:30:00.000Z')).toMatch(/01\/11\/2026/);
  });

  it('đổi ISO sang giá trị cho input datetime-local', () => {
    expect(toDateTimeInput('2026-10-31T01:00:00.000Z')).toBe('2026-10-31T08:00');
    expect(toDateTimeInput(null)).toBe('');
    expect(toDateTimeInput('không-phải-ngày')).toBe('');
  });

  it('đổi giá trị input datetime-local sang ISO UTC', () => {
    expect(fromDateTimeInput('2026-10-31T08:00')).toBe('2026-10-31T01:00:00.000Z');
    expect(fromDateTimeInput('')).toBeNull();
    expect(fromDateTimeInput(undefined)).toBeNull();
    expect(fromDateTimeInput('31/10/2026 08:00')).toBeNull();
  });

  it('đi và về giữ nguyên mốc thời gian', () => {
    const iso = '2026-12-24T17:30:00.000Z';
    expect(fromDateTimeInput(toDateTimeInput(iso))).toBe(iso);
  });
});

describe('coupon-form.schema — tạo mới', () => {
  const schema = buildCouponFormSchema();

  it('chấp nhận payload hợp lệ và chuẩn hoá mã thành chữ hoa', () => {
    const result = schema.safeParse(VALID_CREATE);
    expect(issuePaths(result)).toEqual([]);
    expect(result.data.code).toBe('TOY2026');
  });

  it('bắt buộc mã, thời điểm bắt đầu và kết thúc', () => {
    expect(issuePaths(schema.safeParse({ ...VALID_CREATE, code: '' }))).toContain('code');
    expect(issuePaths(schema.safeParse({ ...VALID_CREATE, start_time: '' }))).toContain(
      'start_time',
    );
    expect(issuePaths(schema.safeParse({ ...VALID_CREATE, end_time: '' }))).toContain('end_time');
  });

  it('kiểm tra cửa sổ hiệu lực', () => {
    const result = schema.safeParse({
      ...VALID_CREATE,
      start_time: '2026-11-30T09:00',
      end_time: '2026-11-30T09:00',
    });
    expect(issuePaths(result)).toContain('end_time');
  });

  it('giới hạn giá trị theo loại giảm giá', () => {
    expect(issuePaths(schema.safeParse({ ...VALID_CREATE, value: '150' }))).toContain('value');
    expect(
      issuePaths(schema.safeParse({ ...VALID_CREATE, type: 'FIXED', value: '0' })),
    ).toContain('value');
  });

  it('bắt buộc đối tượng khi giới hạn theo sản phẩm/danh mục', () => {
    const missing = schema.safeParse({ ...VALID_CREATE, scope: 'PRODUCT' });
    expect(issuePaths(missing)).toContain('applicable_targets');

    const invalidId = schema.safeParse({
      ...VALID_CREATE,
      scope: 'PRODUCT',
      applicable_targets: 'khong-phai-uuid',
    });
    expect(issuePaths(invalidId)).toContain('applicable_targets');

    const valid = schema.safeParse({
      ...VALID_CREATE,
      scope: 'PRODUCT',
      applicable_targets: `${PRODUCT_UUID}, ${PRODUCT_UUID.toUpperCase()}`,
    });
    expect(issuePaths(valid)).toEqual([]);
    expect(valid.data.applicable_targets).toHaveLength(2);
  });

  it('loại bỏ chuỗi rỗng thành null cho các giới hạn không bắt buộc', () => {
    const result = schema.safeParse(VALID_CREATE);
    expect(result.data.max_discount).toBeNull();
    expect(result.data.usage_limit).toBeNull();
    expect(result.data.usage_limit_per_user).toBeNull();
  });
});

describe('coupon-form.schema — chỉnh sửa', () => {
  it('không đòi lại mã/loại giảm/phạm vi đã chốt', () => {
    const schema = buildCouponFormSchema({ editing: true, discountType: 'FIXED' });
    const result = schema.safeParse({
      value: '50000',
      max_discount: '',
      min_order: '200000',
      applicable_targets: '',
      usage_limit: '',
      usage_limit_per_user: '',
      end_time: '2026-12-31T23:59',
      is_active: true,
    });
    expect(issuePaths(result)).toEqual([]);
  });

  it('vẫn kiểm tra giá trị theo loại giảm giá của bản ghi', () => {
    const percent = buildCouponFormSchema({ editing: true, discountType: 'PERCENT' });
    expect(
      issuePaths(percent.safeParse({ value: '120', end_time: '2026-12-31T23:59' })),
    ).toContain('value');

    const fixed = buildCouponFormSchema({ editing: true, discountType: 'FIXED' });
    expect(issuePaths(fixed.safeParse({ value: '0', end_time: '2026-12-31T23:59' }))).toContain(
      'value',
    );
  });
});
