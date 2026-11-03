import { describe, expect, it } from 'vitest';
import {
  getEndpointsByModule,
  getPrimaryEndpointsByModule,
} from '@/shared/api-endpoints.js';
import {
  parseCarrierWebhook,
  verifyCarrierWebhook,
} from '@/server/integrations/shipping/index.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M06').map((endpoint) => endpoint.code);
const PRIMARY_CODES = getPrimaryEndpointsByModule('M06').map((endpoint) => endpoint.code);
const UUID = '11111111-1111-4111-8111-111111111111';

describe('M06 — hợp đồng server', () => {
  it('có handler cho mọi API không phải alias', () => {
    expect(Object.keys(handlers).sort()).toEqual([...PRIMARY_CODES].sort());
  });

  it('mọi handler đều là function (không còn stub 501)', () => {
    for (const code of PRIMARY_CODES) {
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

  it('mọi API của module đã được triển khai trong registry', () => {
    for (const endpoint of getEndpointsByModule('M06')) {
      expect(endpoint.status).toBe(endpoint.aliasOf ? 'ALIAS' : 'IMPLEMENTED');
    }
  });
});

describe('M06 — validation tính phí (API-M06-01)', () => {
  const schema = validationSchemas['API-M06-01'].body;

  it('chấp nhận địa chỉ, khối lượng và tổng tiền hợp lệ', () => {
    expect(
      schema.safeParse({
        address: { province_code: '79', district_code: '760', ward_code: '26734' },
        weight: 800,
        total_amount: 620000,
      }).success,
    ).toBe(true);
  });

  it('từ chối khối lượng không dương và tổng tiền âm', () => {
    const base = { address: { province_code: '79', ward_code: '26734' }, weight: 800 };
    expect(schema.safeParse({ ...base, weight: 0, total_amount: 100000 }).success).toBe(false);
    expect(schema.safeParse({ ...base, total_amount: -1 }).success).toBe(false);
  });

  it('phương thức giao chỉ nhận STANDARD/EXPRESS', () => {
    const base = {
      address: { province_code: '79', ward_code: '26734' },
      weight: 800,
      total_amount: 100000,
    };
    expect(schema.safeParse({ ...base, shipping_method: 'EXPRESS' }).success).toBe(true);
    expect(schema.safeParse({ ...base, shipping_method: 'DRONE' }).success).toBe(false);
  });
});

describe('M06 — validation vận đơn & webhook (API-M06-02, 03, 04)', () => {
  it('tạo vận đơn cần orderRef và mã ĐVVC thuộc enum', () => {
    const schema = validationSchemas['API-M06-02'];
    expect(schema.params.safeParse({ orderRef: 'KD-261101-ABC123' }).success).toBe(true);
    expect(schema.body.safeParse({ carrier_code: 'GHN' }).success).toBe(true);
    expect(schema.body.safeParse({ carrier_code: 'GHN', pickup_time: '2026-11-04T09:00:00Z' }).success).toBe(true);
    expect(schema.body.safeParse({ carrier_code: 'FAKE' }).success).toBe(false);
    expect(schema.body.safeParse({ carrier_code: 'GHN', pickup_time: 'hôm qua' }).success).toBe(false);
  });

  it('webhook không ràng buộc schema body (payload từng hãng)', () => {
    expect(validationSchemas['API-M06-04']).toEqual({});
  });

  it('theo dõi cần orderRef', () => {
    const schema = validationSchemas['API-M06-03'];
    expect(schema.params.safeParse({ orderRef: 'KD-261101-ABC123' }).success).toBe(true);
    expect(schema.params.safeParse({ orderRef: '' }).success).toBe(false);
  });
});

describe('M06 — validation đổi trả (API-M06-06..10)', () => {
  it('yêu cầu đổi trả cần ít nhất 1 sản phẩm, 1 ảnh và lý do hợp lệ', () => {
    const schema = validationSchemas['API-M06-06'].body;
    const base = {
      item_ids: [UUID],
      reason: 'DEFECTIVE',
      images: ['https://cdn.kaido.vn/returns/1.jpg'],
    };
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, images: [] }).success).toBe(false);
    expect(schema.safeParse({ ...base, reason: 'BORED' }).success).toBe(false);
    expect(schema.safeParse({ ...base, item_ids: [] }).success).toBe(false);
  });

  it('duyệt đổi trả bắt buộc nêu lý do khi từ chối', () => {
    const schema = validationSchemas['API-M06-07'].body;
    expect(schema.safeParse({ action: 'APPROVE' }).success).toBe(true);
    expect(schema.safeParse({ action: 'REJECT' }).success).toBe(false);
    expect(schema.safeParse({ action: 'REJECT', note: 'Sản phẩm đã qua sử dụng' }).success).toBe(true);
  });

  it('danh sách đổi trả lọc theo trạng thái và khoảng ngày', () => {
    const schema = validationSchemas['API-M06-08'].query;
    const parsed = schema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(schema.safeParse({ status: 'RECEIVED' }).success).toBe(true);
    expect(schema.safeParse({ status: 'COMPLETED' }).success).toBe(false);
    expect(schema.safeParse({ from_date: '2026-11-01', to_date: '2026-11-30' }).success).toBe(true);
  });

  it('danh sách vận đơn lọc được theo hãng và trạng thái', () => {
    const schema = validationSchemas['API-M06-09'].query;
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ carrier_code: 'GHTK', status: 'DELIVERED' }).success).toBe(true);
    expect(schema.safeParse({ carrier_code: 'FAKE' }).success).toBe(false);
    expect(schema.safeParse({ status: 'LOST' }).success).toBe(false);
  });

  it('cập nhật trạng thái đổi trả chỉ nhận RECEIVED/REFUNDED/CANCELLED', () => {
    const schema = validationSchemas['API-M06-10'];
    expect(schema.params.safeParse({ id: UUID }).success).toBe(true);
    expect(schema.body.safeParse({ status: 'RECEIVED', warehouse_id: UUID }).success).toBe(true);
    expect(schema.body.safeParse({ status: 'RECEIVED', condition: 'DAMAGED' }).success).toBe(true);
    expect(schema.body.safeParse({ status: 'COMPLETED' }).success).toBe(false);
    expect(schema.body.safeParse({ status: 'RECEIVED', condition: 'BROKEN' }).success).toBe(false);
  });
});

describe('M06 — chuẩn hóa webhook ĐVVC (M06-F10)', () => {
  it('GHN: đọc OrderCode/Status và đổi sang trạng thái chuẩn', () => {
    const parsed = parseCarrierWebhook({
      carrierCode: 'GHN',
      body: { OrderCode: 'GHN123456', Status: 'delivered', Description: 'Giao thành công', Time: 1762000000 },
    });
    expect(parsed.trackingCode).toBe('GHN123456');
    expect(parsed.status).toBe('DELIVERED');
    expect(parsed.occurredAt).toBe(new Date(1762000000 * 1000).toISOString());
  });

  it('GHTK: đọc label_id/status_id', () => {
    const parsed = parseCarrierWebhook({
      carrierCode: 'GHTK',
      body: { label_id: 'S12345', status_id: 4, status_text: 'Đã giao' },
    });
    expect(parsed.trackingCode).toBe('S12345');
    expect(parsed.status).toBe('DELIVERED');
  });

  it('Viettel Post: đọc ORDER_NUMBER/ORDER_STATUS', () => {
    const parsed = parseCarrierWebhook({
      carrierCode: 'VIETTELPOST',
      body: { ORDER_NUMBER: 'VTP001', ORDER_STATUS: 501, ORDER_STATUS_NAME: 'Đã giao' },
    });
    expect(parsed.trackingCode).toBe('VTP001');
    expect(parsed.status).toBe('DELIVERED');
  });

  it('trạng thái lạ trả null để service bỏ qua', () => {
    const parsed = parseCarrierWebhook({
      carrierCode: 'GHN',
      body: { OrderCode: 'GHN1', Status: 'unknown_status' },
    });
    expect(parsed.status).toBeNull();
  });
});

describe('M06 — xác thực chữ ký webhook (M06-F10)', () => {
  it('môi trường phát triển cho phép webhook mô phỏng khi chưa có khóa', () => {
    const result = verifyCarrierWebhook({
      carrierCode: 'GHN',
      rawBody: '{"OrderCode":"GHN1"}',
      headers: new Headers(),
    });
    expect(result.valid).toBe(true);
    expect(result.simulated).toBe(true);
  });
});
