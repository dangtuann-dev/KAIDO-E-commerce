import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M04').map((endpoint) => endpoint.code);

const UUID = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('M04 — hợp đồng server', () => {
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

describe('M04 — validation thêm/cập nhật dòng giỏ', () => {
  it('thêm vào giỏ bắt buộc product_id và số lượng 1–20', () => {
    const schema = validationSchemas['API-M04-02'].body;
    expect(schema.safeParse({ product_id: UUID, quantity: 1 }).success).toBe(true);
    expect(schema.safeParse({ product_id: UUID, variant_id: UUID_2, quantity: 20 }).success).toBe(
      true,
    );
    expect(schema.safeParse({ product_id: UUID, quantity: 0 }).success).toBe(false);
    expect(schema.safeParse({ product_id: UUID, quantity: 21 }).success).toBe(false);
    expect(schema.safeParse({ quantity: 1 }).success).toBe(false);
    expect(schema.safeParse({ product_id: 'abc', quantity: 1 }).success).toBe(false);
  });

  it('cập nhật số lượng cho phép 0 để xóa dòng (BR-M04-06) nhưng chặn > 20', () => {
    const schema = validationSchemas['API-M04-03'].body;
    expect(schema.parse({ quantity: 0 }).quantity).toBe(0);
    expect(schema.safeParse({ quantity: 20 }).success).toBe(true);
    expect(schema.safeParse({ quantity: 21 }).success).toBe(false);
    expect(schema.safeParse({ quantity: -1 }).success).toBe(false);
    expect(schema.safeParse({ quantity: 2.5 }).success).toBe(false);
  });

  it('params itemId phải là uuid', () => {
    expect(validationSchemas['API-M04-03'].params.safeParse({ itemId: UUID }).success).toBe(true);
    expect(validationSchemas['API-M04-03'].params.safeParse({ itemId: '1' }).success).toBe(false);
  });

  it('xóa nhiều dòng cần 1–50 item hợp lệ', () => {
    const schema = validationSchemas['API-M04-05'].body;
    expect(schema.safeParse({ item_ids: [UUID] }).success).toBe(true);
    expect(schema.safeParse({ item_ids: [] }).success).toBe(false);
    expect(schema.safeParse({ item_ids: new Array(51).fill(UUID) }).success).toBe(false);
    expect(schema.safeParse({ item_ids: ['abc'] }).success).toBe(false);
  });
});

describe('M04 — validation chọn thanh toán & voucher', () => {
  it('chọn thanh toán bắt buộc ít nhất 1 dòng', () => {
    const schema = validationSchemas['API-M04-09'].body;
    expect(schema.safeParse({ item_ids: [UUID, UUID_2] }).success).toBe(true);
    expect(schema.safeParse({ item_ids: [] }).success).toBe(false);
  });

  it('mã giảm giá được chuẩn hóa chữ hoa và chặn mã quá ngắn', () => {
    const schema = validationSchemas['API-M04-07'].body;
    expect(schema.parse({ coupon_code: ' toy2026 ' }).coupon_code).toBe('TOY2026');
    expect(schema.safeParse({ coupon_code: 'ABC' }).success).toBe(false);
    expect(schema.safeParse({ coupon_code: 'TOY-2026' }).success).toBe(false);
    expect(schema.safeParse({ coupon_code: 'TOY2026', item_ids: [UUID] }).success).toBe(true);
  });

  it('merge giỏ chặn guest_session_id sai định dạng', () => {
    const schema = validationSchemas['API-M04-06'].body;
    expect(schema.safeParse({ guest_session_id: 'a1b2c3d4-e5f6-4a7b' }).success).toBe(true);
    expect(schema.safeParse({ guest_session_id: 'short' }).success).toBe(false);
  });
});

describe('M04 — validation truy vấn & món đã lưu', () => {
  it('GET /cart chấp nhận selected_item_ids dạng csv và bỏ rỗng', () => {
    const schema = validationSchemas['API-M04-01'].query;
    expect(schema.parse({}).selected_item_ids).toEqual([]);
    expect(schema.parse({ selected_item_ids: `${UUID},${UUID_2}` }).selected_item_ids).toEqual([
      UUID,
      UUID_2,
    ]);
    expect(schema.safeParse({ selected_item_ids: 'abc' }).success).toBe(false);
  });

  it('GET /cart chuẩn hóa cờ revalidate từ query string', () => {
    const schema = validationSchemas['API-M04-01'].query;
    expect(schema.parse({ revalidate: 'true' }).revalidate).toBe(true);
    expect(schema.parse({ revalidate: 'false' }).revalidate).toBe(false);
    expect(schema.parse({}).revalidate).toBe(false);
  });

  it('món đã lưu dùng savedItemId là uuid', () => {
    expect(validationSchemas['API-M04-11'].params.safeParse({ savedItemId: UUID }).success).toBe(
      true,
    );
    expect(validationSchemas['API-M04-12'].params.safeParse({ savedItemId: 'x' }).success).toBe(
      false,
    );
  });

  it('API-M04-08 (xóa cả giỏ) không cần body', () => {
    expect(validationSchemas['API-M04-08']).toEqual({});
  });
});
