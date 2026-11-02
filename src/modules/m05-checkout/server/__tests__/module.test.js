import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import {
  buildSandboxSimulation,
  buildSecureHash,
  verifyIpn,
} from '@/server/integrations/payment/vnpay.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M05').map((endpoint) => endpoint.code);

const UUID = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';
const ORDER_CODE = 'KD-261031-ABC123';

const SHIPPING_ADDRESS = {
  recipient_name: 'Nguyen Van An',
  recipient_phone: '0901234567',
  province: 'TP. Hồ Chí Minh',
  province_code: '79',
  ward: 'Phường Bến Thành',
  address_line: '12 Lê Lợi, Quận 1',
};

describe('M05 — hợp đồng server', () => {
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

  it('mọi API của module đã được đánh dấu IMPLEMENTED trong registry', () => {
    for (const endpoint of getEndpointsByModule('M05')) {
      expect(endpoint.status).toBe('IMPLEMENTED');
    }
  });
});

describe('M05 — validation tóm tắt checkout (API-M05-01)', () => {
  const schema = validationSchemas['API-M05-01'].body;

  it('chấp nhận địa chỉ đã lưu hoặc địa chỉ nhập tay', () => {
    expect(schema.safeParse({ item_ids: [UUID], address_id: UUID_2 }).success).toBe(true);
    expect(
      schema.safeParse({ item_ids: [UUID], shipping_address: SHIPPING_ADDRESS }).success,
    ).toBe(true);
  });

  it('bắt buộc có ít nhất một nguồn địa chỉ', () => {
    expect(schema.safeParse({ item_ids: [UUID] }).success).toBe(false);
  });

  it('điểm tiêu phải là bội số của 10 và mặc định 0', () => {
    expect(schema.parse({ item_ids: [UUID], address_id: UUID_2 }).points_redeemed).toBe(0);
    expect(
      schema.safeParse({ item_ids: [UUID], address_id: UUID_2, points_redeemed: 20 }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ item_ids: [UUID], address_id: UUID_2, points_redeemed: 15 }).success,
    ).toBe(false);
  });

  it('danh sách item_ids phải từ 1 đến 50 uuid', () => {
    expect(schema.safeParse({ item_ids: [], address_id: UUID }).success).toBe(false);
    expect(
      schema.safeParse({ item_ids: new Array(51).fill(UUID), address_id: UUID }).success,
    ).toBe(false);
    expect(schema.safeParse({ item_ids: ['abc'], address_id: UUID }).success).toBe(false);
  });
});

describe('M05 — validation đặt hàng (API-M05-02)', () => {
  const schema = validationSchemas['API-M05-02'].body;

  const base = {
    shipping_address: SHIPPING_ADDRESS,
    payment_method: 'COD',
    items: [{ product_id: UUID, variant_id: UUID_2, quantity: 2 }],
  };

  it('chấp nhận COD và gán shipping_method mặc định STANDARD', () => {
    const parsed = schema.parse(base);
    expect(parsed.shipping_method).toBe('STANDARD');
    expect(parsed.points_redeemed).toBe(0);
  });

  it('chỉ cho phép các phương thức thanh toán trong registry', () => {
    expect(schema.safeParse({ ...base, payment_method: 'VNPAY' }).success).toBe(true);
    expect(schema.safeParse({ ...base, payment_method: 'CARD' }).success).toBe(false);
  });

  it('chặn số điện thoại và địa chỉ không hợp lệ', () => {
    expect(
      schema.safeParse({
        ...base,
        shipping_address: { ...SHIPPING_ADDRESS, recipient_phone: '123' },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...base,
        shipping_address: { ...SHIPPING_ADDRESS, address_line: '1A' },
      }).success,
    ).toBe(false);
  });

  it('bắt buộc ít nhất một dòng hàng và số lượng 1–20', () => {
    expect(schema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, items: [{ product_id: UUID, quantity: 21 }] }).success,
    ).toBe(false);
  });
});

describe('M05 — validation hủy đơn & quản trị (API-M05-05, 06, 07)', () => {
  it('lý do hủy tối thiểu 5 ký tự và orderRef đúng định dạng', () => {
    const schema = validationSchemas['API-M05-05'];
    expect(schema.body.safeParse({ reason: 'Đặt nhầm sản phẩm' }).success).toBe(true);
    expect(schema.body.safeParse({ reason: 'Sai' }).success).toBe(false);
    expect(schema.params.safeParse({ orderRef: ORDER_CODE }).success).toBe(true);
    expect(schema.params.safeParse({ orderRef: `KD-1-ABC` }).success).toBe(false);
  });

  it('danh sách đơn quản trị lọc được theo trạng thái và khoảng ngày', () => {
    const schema = validationSchemas['API-M05-06'].query;
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ status: 'PENDING_PAYMENT' }).success).toBe(true);
    expect(schema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
    expect(schema.safeParse({ from_date: '2026-10-01', to_date: '2026-10-31' }).success).toBe(true);
    expect(schema.safeParse({ from_date: '31/10/2026' }).success).toBe(false);
  });

  it('cập nhật trạng thái cần uuid đơn và trạng thái thuộc enum', () => {
    const schema = validationSchemas['API-M05-07'];
    expect(schema.params.safeParse({ id: UUID }).success).toBe(true);
    expect(schema.params.safeParse({ id: 'abc' }).success).toBe(false);
    expect(schema.body.safeParse({ new_status: 'CONFIRMED' }).success).toBe(true);
    expect(schema.body.safeParse({ new_status: 'DONE' }).success).toBe(false);
  });
});

describe('M05 — ký và xác thực VNPAY (M05-F04, M05-F07)', () => {
  it('HMAC-SHA512 thay đổi khi tham số thay đổi', () => {
    const secret = 'kaido-vnpay-sandbox-secret';
    const first = buildSecureHash({ vnp_TxnRef: ORDER_CODE, vnp_Amount: '100' }, secret);
    const second = buildSecureHash({ vnp_TxnRef: ORDER_CODE, vnp_Amount: '200' }, secret);
    expect(first).toHaveLength(128);
    expect(first).not.toBe(second);
  });

  it('IPN mô phỏng hợp lệ được chấp nhận', async () => {
    const simulation = buildSandboxSimulation({
      orderRef: ORDER_CODE,
      amountVnd: 250000,
      success: true,
    });

    const verified = await verifyIpn(simulation.fields);
    expect(verified.valid).toBe(true);
    expect(verified.orderRef).toBe(ORDER_CODE);
    expect(verified.amountVnd).toBe(250000);
    expect(verified.isSuccess).toBe(true);
  });

  it('IPN bị sửa số tiền sẽ bị từ chối', async () => {
    const simulation = buildSandboxSimulation({
      orderRef: ORDER_CODE,
      amountVnd: 250000,
      success: true,
    });

    const verified = await verifyIpn({ ...simulation.fields, vnp_Amount: '99999900' });
    expect(verified.valid).toBe(false);
    expect(verified.reason).toBe('VNPAY_IPN_INVALID_SIGNATURE');
  });

  it('IPN mô phỏng thất bại không được coi là thành công', async () => {
    const simulation = buildSandboxSimulation({
      orderRef: ORDER_CODE,
      amountVnd: 250000,
      success: false,
    });

    const verified = await verifyIpn(simulation.fields);
    expect(verified.valid).toBe(true);
    expect(verified.isSuccess).toBe(false);
  });
});
