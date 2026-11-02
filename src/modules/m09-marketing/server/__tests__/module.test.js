import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M09').map((endpoint) => endpoint.code);

const VALID_BANNER = {
  title: 'Ưu đãi Trung Thu 2026',
  image_url: 'https://cdn.kaido.vn/banner-trung-thu.webp',
  position: 'HOME_HERO',
  status: 'SCHEDULED',
  start_time: '2026-09-01T00:00:00.000Z',
  end_time: '2026-09-30T00:00:00.000Z',
};

const VALID_ARTICLE = {
  title: 'Bộ lắp ráp giúp bé phát triển tư duy',
  excerpt: 'Gợi ý chọn bộ lắp ráp theo độ tuổi.',
  content: 'Nội dung bài viết đủ dài để vượt ngưỡng tối thiểu 20 ký tự.',
  status: 'DRAFT',
};

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';

const VALID_CAMPAIGN = {
  name: 'Flash sale Trung Thu 2026',
  starts_at: '2026-09-01T00:00:00.000Z',
  ends_at: '2026-09-10T00:00:00.000Z',
  items: [{ product_id: PRODUCT_ID, sale_price: 149000, quantity_limit: 20 }],
};

const VALID_COUPON = {
  code: 'toy2026',
  name: 'Ưu đãi Trung Thu',
  type: 'PERCENT',
  value: 15,
  min_order: 200000,
  start_time: '2026-09-01T00:00:00.000Z',
  end_time: '2026-09-30T00:00:00.000Z',
};

describe('M09 — hợp đồng server', () => {
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

describe('M09 — validation banner (F01, F05, BR-M09-04)', () => {
  const createSchema = validationSchemas['API-M09-04'].body;
  const updateSchema = validationSchemas['API-M09-10'].body;

  it('áp dụng mặc định vị trí và trạng thái', () => {
    const parsed = createSchema.parse({
      title: 'Khuyến mãi tháng 6',
      image_url: 'https://cdn.kaido.vn/banner.png',
    });
    expect(parsed.position).toBe('HOME_HERO');
    expect(parsed.status).toBe('DRAFT');
  });

  it('chuẩn hóa vị trí cũ home_main về HOME_HERO', () => {
    const parsed = createSchema.parse({ ...VALID_BANNER, position: 'home_main' });
    expect(parsed.position).toBe('HOME_HERO');
  });

  it('chỉ nhận ảnh jpg/png/webp', () => {
    expect(
      createSchema.safeParse({ ...VALID_BANNER, image_url: 'https://cdn.kaido.vn/a.gif' }).success,
    ).toBe(false);
    expect(
      createSchema.safeParse({ ...VALID_BANNER, image_url: 'https://cdn.kaido.vn/a.webp?w=1200' })
        .success,
    ).toBe(true);
  });

  it('từ chối khung hiển thị đảo ngược', () => {
    const result = createSchema.safeParse({
      ...VALID_BANNER,
      start_time: '2026-09-30T00:00:00.000Z',
      end_time: '2026-09-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path.includes('end_time'))).toBe(true);
  });

  it('từ chối body cập nhật rỗng và id không phải UUID', () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
    expect(updateSchema.safeParse({ display_order: 3 }).success).toBe(true);
    expect(validationSchemas['API-M09-10'].params.safeParse({ id: 'abc' }).success).toBe(false);
  });
});

describe('M09 — validation bài viết (F02, NFR-M09-01)', () => {
  const createSchema = validationSchemas['API-M09-13'].body;
  const updateSchema = validationSchemas['API-M09-14'].body;

  it('chấp nhận bài viết tối thiểu và mặc định bản nháp', () => {
    const parsed = createSchema.parse({
      title: VALID_ARTICLE.title,
      content: VALID_ARTICLE.content,
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.slug).toBeUndefined();
  });

  it('từ chối tiêu đề/nội dung quá ngắn', () => {
    expect(createSchema.safeParse({ ...VALID_ARTICLE, title: 'Bé' }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_ARTICLE, content: 'Quá ngắn' }).success).toBe(false);
  });

  it('giới hạn meta title 70 và meta description 160 ký tự', () => {
    expect(
      createSchema.safeParse({ ...VALID_ARTICLE, meta_title: 'x'.repeat(71) }).success,
    ).toBe(false);
    expect(
      createSchema.safeParse({ ...VALID_ARTICLE, meta_description: 'x'.repeat(161) }).success,
    ).toBe(false);
  });

  it('từ chối slug sai định dạng và body cập nhật rỗng', () => {
    expect(createSchema.safeParse({ ...VALID_ARTICLE, slug: 'Bài Viết' }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_ARTICLE, slug: 'bai-viet-moi' }).success).toBe(true);
    expect(updateSchema.safeParse({}).success).toBe(false);
  });
});

describe('M09 — validation chiến dịch (F03, F05, BR-M09-05)', () => {
  const createSchema = validationSchemas['API-M09-17'].body;
  const updateSchema = validationSchemas['API-M09-19'].body;
  const statusSchema = validationSchemas['API-M09-20'].body;

  it('mặc định loại chiến dịch FLASH_SALE', () => {
    const parsed = createSchema.parse(VALID_CAMPAIGN);
    expect(parsed.campaign_type).toBe('FLASH_SALE');
    expect(parsed.items).toHaveLength(1);
  });

  it('từ chối khung giờ đảo ngược', () => {
    const result = createSchema.safeParse({
      ...VALID_CAMPAIGN,
      starts_at: '2026-09-10T00:00:00.000Z',
      ends_at: '2026-09-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path.includes('ends_at'))).toBe(true);
  });

  it('giới hạn tối đa 50 SKU và giá flash sale nguyên dương', () => {
    const items = Array.from({ length: 51 }, () => ({
      product_id: PRODUCT_ID,
      sale_price: 99000,
    }));
    expect(createSchema.safeParse({ ...VALID_CAMPAIGN, items }).success).toBe(false);
    expect(
      createSchema.safeParse({
        ...VALID_CAMPAIGN,
        items: [{ product_id: PRODUCT_ID, sale_price: 1.5 }],
      }).success,
    ).toBe(false);
  });

  it('chỉ nhận hành động chuyển trạng thái hợp lệ', () => {
    expect(statusSchema.safeParse({ action: 'ACTIVATE' }).success).toBe(true);
    expect(statusSchema.safeParse({ action: 'PUBLISH' }).success).toBe(false);
    expect(updateSchema.safeParse({}).success).toBe(false);
  });
});

describe('M09 — validation coupon (F04, F08, BR-M09-01)', () => {
  const createSchema = validationSchemas['API-M09-05'].body;
  const updateSchema = validationSchemas['API-M09-22'].body;

  it('chuẩn hóa mã và mặc định phạm vi toàn đơn', () => {
    const parsed = createSchema.parse(VALID_COUPON);
    expect(parsed.code).toBe('TOY2026');
    expect(parsed.scope).toBe('ALL');
    expect(parsed.min_order).toBe(200000);
  });

  it('ràng buộc giá trị theo loại giảm', () => {
    expect(createSchema.safeParse({ ...VALID_COUPON, value: 150 }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_COUPON, type: 'FIXED', value: 0 }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_COUPON, type: 'FIXED', value: 50000 }).success).toBe(
      true,
    );
    expect(
      createSchema.safeParse({ ...VALID_COUPON, type: 'FIXED', value: 50000, max_discount: 10000 })
        .success,
    ).toBe(false);
  });

  it('bắt buộc chọn đối tượng với phạm vi PRODUCT/CATEGORY', () => {
    expect(createSchema.safeParse({ ...VALID_COUPON, scope: 'PRODUCT' }).success).toBe(false);
    expect(
      createSchema.safeParse({
        ...VALID_COUPON,
        scope: 'PRODUCT',
        applicable_targets: [PRODUCT_ID],
      }).success,
    ).toBe(true);
  });

  it('từ chối mã sai định dạng và hiệu lực đảo ngược', () => {
    expect(createSchema.safeParse({ ...VALID_COUPON, code: 'TOY' }).success).toBe(false);
    expect(
      createSchema.safeParse({
        ...VALID_COUPON,
        start_time: '2026-09-30T00:00:00.000Z',
        end_time: '2026-09-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('cập nhật coupon chỉ nhận các trường điều kiện/hiệu lực', () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
    expect(updateSchema.safeParse({ is_active: false }).success).toBe(true);
    expect(updateSchema.safeParse({ end_time: '2026-10-31T00:00:00.000Z' }).success).toBe(true);
  });

  it('từ chối trạng thái lọc không hợp lệ ở danh sách admin', () => {
    expect(validationSchemas['API-M09-21'].query.safeParse({ status: 'DRAFT' }).success).toBe(false);
    expect(validationSchemas['API-M09-21'].query.safeParse({ status: 'ACTIVE' }).success).toBe(true);
  });
});

describe('M09 — phân trang danh sách', () => {
  it('áp dụng mặc định cho danh sách bài viết/chiến dịch', () => {
    const articles = validationSchemas['API-M09-12'].query.parse({});
    expect(articles.page).toBe(1);
    expect(articles.limit).toBe(20);

    const campaigns = validationSchemas['API-M09-16'].query.parse({});
    expect(campaigns.page).toBe(1);
    expect(campaigns.limit).toBe(20);
  });

  it('giới hạn số voucher công khai trả về', () => {
    expect(validationSchemas['API-M09-08'].query.safeParse({ limit: 51 }).success).toBe(false);
    expect(validationSchemas['API-M09-08'].query.parse({}).limit).toBeGreaterThan(0);
  });
});
