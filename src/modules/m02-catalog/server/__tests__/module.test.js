import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M02').map((endpoint) => endpoint.code);

const VALID_PRODUCT = {
  name: 'Xe đạp cân bằng KAIDO',
  sku: 'kaido-balance-01',
  category_id: '11111111-1111-4111-8111-111111111111',
  age_group: '3-6Y',
  price_regular: 199000,
  price_sale: 149000,
};

describe('M02 — hợp đồng server', () => {
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

describe('M02 — validation sản phẩm', () => {
  const createSchema = validationSchemas['API-M02-04'].body;
  const updateSchema = validationSchemas['API-M02-05'].body;

  it('chấp nhận và chuẩn hóa sản phẩm tối thiểu', () => {
    const parsed = createSchema.parse(VALID_PRODUCT);
    expect(parsed.sku).toBe('KAIDO-BALANCE-01');
    expect(parsed.gender_target).toBe('UNISEX');
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.price_sale).toBe(149000);
  });

  it('từ chối giá sale lớn hơn giá niêm yết (BR-M02-03)', () => {
    const result = createSchema.safeParse({ ...VALID_PRODUCT, price_sale: 299000 });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path.includes('price_sale'))).toBe(true);
  });

  it('từ chối SKU sai định dạng', () => {
    expect(createSchema.safeParse({ ...VALID_PRODUCT, sku: 'ab' }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_PRODUCT, sku: 'SKU có dấu' }).success).toBe(false);
  });

  it('từ chối giá niêm yết không phải số nguyên dương', () => {
    expect(createSchema.safeParse({ ...VALID_PRODUCT, price_regular: 0 }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_PRODUCT, price_regular: 1.5 }).success).toBe(false);
  });

  it('ô giá sale/ngưỡng tồn kho để trống không bị ép thành 0', () => {
    const parsed = createSchema.parse({
      ...VALID_PRODUCT,
      price_sale: '',
      low_stock_threshold: '',
    });
    expect(parsed.price_sale).toBeNull();
    expect(parsed.low_stock_threshold).toBeUndefined();
  });

  it('giới hạn tối đa 10 ảnh và 5 danh mục phụ', () => {
    const images = Array.from({ length: 11 }, (_, index) => ({
      url: `https://cdn.kaido.vn/${index}.jpg`,
    }));
    expect(createSchema.safeParse({ ...VALID_PRODUCT, images }).success).toBe(false);

    const categoryIds = Array.from(
      { length: 6 },
      (_, index) => `2222222${index}-2222-4222-8222-222222222222`,
    );
    expect(createSchema.safeParse({ ...VALID_PRODUCT, category_ids: categoryIds }).success).toBe(
      false,
    );
  });

  it('từ chối body cập nhật rỗng', () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
  });

  it('cho phép cập nhật từng phần', () => {
    const parsed = updateSchema.parse({ status: 'ACTIVE' });
    expect(parsed).toEqual({ status: 'ACTIVE' });
  });

  it('vẫn kiểm tra giá khi cập nhật một phần', () => {
    expect(updateSchema.safeParse({ price_sale: 500000 }).success).toBe(true);
    expect(
      updateSchema.safeParse({ price_regular: 100000, price_sale: 150000 }).success,
    ).toBe(false);
  });
});

describe('M02 — validation danh sách và danh mục', () => {
  it('áp dụng phân trang mặc định cho PLP', () => {
    const parsed = validationSchemas['API-M02-02'].query.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBeGreaterThan(0);
  });

  it('từ chối trạng thái không hợp lệ ở danh sách admin', () => {
    expect(
      validationSchemas['API-M02-08'].query.safeParse({ status: 'PUBLISHED' }).success,
    ).toBe(false);
    expect(
      validationSchemas['API-M02-08'].query.safeParse({ status: 'ACTIVE' }).success,
    ).toBe(true);
  });

  it('từ chối slug danh mục sai định dạng', () => {
    const schema = validationSchemas['API-M02-12'].body;
    expect(schema.safeParse({ name: 'Đồ chơi vận động', slug: 'Đồ chơi' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Đồ chơi vận động', slug: 'do-choi-van-dong' }).success).toBe(
      true,
    );
  });

  it('từ chối cập nhật danh mục/thương hiệu rỗng', () => {
    expect(validationSchemas['API-M02-13'].body.safeParse({}).success).toBe(false);
    expect(validationSchemas['API-M02-17'].body.safeParse({}).success).toBe(false);
  });

  it('yêu cầu id dạng UUID cho route admin', () => {
    const schema = validationSchemas['API-M02-09'].params;
    expect(schema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
    expect(schema.safeParse({ id: '11111111-1111-4111-8111-111111111111' }).success).toBe(true);
  });
});
