import { describe, expect, it } from 'vitest';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';

const API_CODES = getEndpointsByModule('M10').map((endpoint) => endpoint.code);

const REVIEW_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';
const STAFF_ID = '44444444-4444-4444-8444-444444444444';

const VALID_REVIEW = {
  order_id: '#KD-00021',
  rating: 5,
  title: 'Bé rất thích',
  comment: 'Đóng gói cẩn thận, chất lượng tốt hơn mong đợi.',
  images: ['https://cdn.kaido.vn/review-1.webp'],
};

const VALID_TICKET = {
  category: 'ORDER_ISSUE',
  subject: 'Đơn hàng giao chậm',
  message: 'Đơn của tôi đã quá hạn giao 2 ngày, nhờ KAIDO kiểm tra giúp.',
};

const VALID_FAQ = {
  category_id: CATEGORY_ID,
  question: 'Bao lâu thì đơn hàng được giao?',
  answer: 'Đơn nội thành thường được giao trong 1–2 ngày làm việc.',
};

function issuePaths(result) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('M10 — hợp đồng server', () => {
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

  it('mọi API đều đã chuyển sang IMPLEMENTED', () => {
    const endpoints = getEndpointsByModule('M10');
    expect(endpoints.every((endpoint) => endpoint.status === 'IMPLEMENTED')).toBe(true);
  });
});

describe('M10 — validation đánh giá (F01, F02, F03, BR-M10-01)', () => {
  const createSchema = validationSchemas['API-M10-02'].body;
  const updateSchema = validationSchemas['API-M10-08'].body;
  const listQuery = validationSchemas['API-M10-01'].query;

  it('chấp nhận đánh giá hợp lệ kèm URL ảnh đã cho', () => {
    const parsed = createSchema.parse(VALID_REVIEW);
    expect(parsed.rating).toBe(5);
    expect(parsed.images).toHaveLength(1);
  });

  it('bắt buộc mã đơn hàng để xác thực Verified Purchase', () => {
    const { order_id: _omitted, ...withoutOrder } = VALID_REVIEW;
    expect(createSchema.safeParse(withoutOrder).success).toBe(false);
    expect(issuePaths(createSchema.safeParse({ ...VALID_REVIEW, order_id: 'KD' }))).toContain(
      'order_id',
    );
  });

  it('giới hạn số sao 1–5 và nội dung tối thiểu', () => {
    expect(createSchema.safeParse({ ...VALID_REVIEW, rating: 0 }).success).toBe(false);
    expect(createSchema.safeParse({ ...VALID_REVIEW, rating: 6 }).success).toBe(false);
    const tooShort = createSchema.safeParse({ ...VALID_REVIEW, comment: 'Hay' });
    expect(issuePaths(tooShort)).toContain('comment');
  });

  it('chỉ nhận URL tệp và chặn vượt số tệp tối đa (BR-M10-05)', () => {
    expect(
      createSchema.safeParse({ ...VALID_REVIEW, images: ['khong-phai-url'] }).success,
    ).toBe(false);
    const tooMany = Array.from({ length: 6 }, (_, index) => `https://cdn.kaido.vn/${index}.webp`);
    expect(createSchema.safeParse({ ...VALID_REVIEW, images: tooMany }).success).toBe(false);
  });

  it('cập nhật đánh giá phải có ít nhất một trường và không cần mã đơn', () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
    expect(updateSchema.safeParse({ rating: 4 }).success).toBe(true);
    expect(updateSchema.safeParse({ rating: 9 }).success).toBe(false);
  });

  it('danh sách đánh giá áp dụng phân trang và lọc số sao', () => {
    const parsed = listQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBeGreaterThan(0);
    expect(listQuery.parse({ stars: '5' }).stars).toBe(5);
    expect(listQuery.safeParse({ stars: '6' }).success).toBe(false);
    expect(validationSchemas['API-M10-01'].params.safeParse({ idOrSlug: '' }).success).toBe(false);
  });
});

describe('M10 — validation kiểm duyệt & phản hồi đánh giá (F04, F05, BR-M10-03)', () => {
  const moderateSchema = validationSchemas['API-M10-07'].body;

  it('duyệt đánh giá không bắt buộc lý do', () => {
    expect(moderateSchema.safeParse({ action: 'APPROVE' }).success).toBe(true);
  });

  it('từ chối/ẩn đánh giá phải nêu lý do', () => {
    expect(issuePaths(moderateSchema.safeParse({ action: 'HIDE' }))).toContain('reason');
    expect(moderateSchema.safeParse({ action: 'REJECT', reason: 'Nội dung không phù hợp' }).success).toBe(
      true,
    );
    expect(moderateSchema.safeParse({ action: 'DELETE' }).success).toBe(false);
  });

  it('kiểm tra id đánh giá phải là UUID', () => {
    expect(validationSchemas['API-M10-07'].params.safeParse({ id: REVIEW_ID }).success).toBe(true);
    expect(validationSchemas['API-M10-07'].params.safeParse({ id: 'review-1' }).success).toBe(
      false,
    );
  });

  it('phản hồi cửa hàng tối thiểu 5 ký tự', () => {
    const replySchema = validationSchemas['API-M10-11'].body;
    expect(replySchema.safeParse({ content: 'Cảm ơn bạn' }).success).toBe(true);
    expect(issuePaths(replySchema.safeParse({ content: 'Ok' }))).toContain('content');
  });

  it('danh sách admin chỉ nhận trạng thái đánh giá hợp lệ', () => {
    const query = validationSchemas['API-M10-12'].query;
    expect(query.safeParse({ status: 'PENDING', rating: '5' }).success).toBe(true);
    expect(query.safeParse({ status: 'DELETED' }).success).toBe(false);
    expect(query.safeParse({ rating: '6' }).success).toBe(false);
  });
});

describe('M10 — validation ticket (F06, F07, F08, BR-M10-04)', () => {
  const createSchema = validationSchemas['API-M10-03'].body;
  const processSchema = validationSchemas['API-M10-16'].body;

  it('chấp nhận ticket hợp lệ và bỏ trống mã đơn', () => {
    const parsed = createSchema.parse(VALID_TICKET);
    expect(parsed.category).toBe('ORDER_ISSUE');
    expect(parsed.order_id).toBeUndefined();
  });

  it('từ chối chủ đề lạ và nội dung quá ngắn', () => {
    expect(createSchema.safeParse({ ...VALID_TICKET, category: 'UNKNOWN' }).success).toBe(false);
    expect(issuePaths(createSchema.safeParse({ ...VALID_TICKET, subject: 'Lỗi' }))).toContain(
      'subject',
    );
    expect(issuePaths(createSchema.safeParse({ ...VALID_TICKET, message: 'Ngắn' }))).toContain(
      'message',
    );
  });

  it('phản hồi ticket phải có nội dung', () => {
    const replySchema = validationSchemas['API-M10-05'].body;
    expect(replySchema.safeParse({ message: 'Mình đã nhận hàng.' }).success).toBe(true);
    expect(replySchema.safeParse({ message: '' }).success).toBe(false);
  });

  it('phân công ticket phải chọn nhân viên', () => {
    expect(issuePaths(processSchema.safeParse({ action: 'ASSIGN' }))).toContain('assigned_to');
    expect(processSchema.safeParse({ action: 'ASSIGN', assigned_to: STAFF_ID }).success).toBe(true);
    expect(
      processSchema.safeParse({ action: 'ASSIGN', assigned_to: 'nhan-vien' }).success,
    ).toBe(false);
  });

  it('phản hồi ticket phải kèm message, các hành động khác không cần', () => {
    expect(issuePaths(processSchema.safeParse({ action: 'REPLY' }))).toContain('message');
    expect(processSchema.safeParse({ action: 'CLOSE' }).success).toBe(true);
    expect(processSchema.safeParse({ action: 'RESOLVE', note: 'Đã gửi bù' }).success).toBe(true);
    expect(processSchema.safeParse({ action: 'DELETE' }).success).toBe(false);
  });

  it('hàng đợi admin lọc theo trạng thái/ưu tiên/category', () => {
    const query = validationSchemas['API-M10-14'].query;
    expect(query.safeParse({ status: 'OPEN', priority: 'HIGH', category: 'ORDER_ISSUE' }).success).toBe(
      true,
    );
    expect(query.safeParse({ priority: 'ASAP' }).success).toBe(false);
    expect(query.safeParse({ status: 'DONE' }).success).toBe(false);
  });

  it('danh sách ticket của tôi chỉ nhận trạng thái hợp lệ', () => {
    const query = validationSchemas['API-M10-13'].query;
    expect(query.safeParse({ status: 'RESOLVED' }).success).toBe(true);
    expect(query.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});

describe('M10 — validation FAQ (F09, F10)', () => {
  const createSchema = validationSchemas['API-M10-19'].body;
  const updateSchema = validationSchemas['API-M10-20'].body;
  const categorySchema = validationSchemas['API-M10-23'].body;

  it('chấp nhận câu hỏi hợp lệ với nhóm là UUID', () => {
    const parsed = createSchema.parse(VALID_FAQ);
    expect(parsed.category_id).toBe(CATEGORY_ID);
    expect(parsed.is_active).toBeUndefined();
  });

  it('từ chối thiếu nhóm, câu hỏi ngắn và câu trả lời ngắn', () => {
    const { category_id: _omitted, ...withoutCategory } = VALID_FAQ;
    expect(issuePaths(createSchema.safeParse(withoutCategory))).toContain('category_id');
    expect(issuePaths(createSchema.safeParse({ ...VALID_FAQ, question: 'Giá?' }))).toContain(
      'question',
    );
    expect(issuePaths(createSchema.safeParse({ ...VALID_FAQ, answer: 'Rẻ lắm' }))).toContain(
      'answer',
    );
  });

  it('cập nhật FAQ chấp nhận bật/tắt hiển thị và từ chối body rỗng', () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
    expect(updateSchema.safeParse({ is_active: false }).success).toBe(true);
    expect(updateSchema.safeParse({ sort_order: 3 }).success).toBe(true);
  });

  it('slug nhóm FAQ chỉ gồm chữ thường, số và gạch nối', () => {
    expect(categorySchema.safeParse({ name: 'Đơn hàng', slug: 'don-hang' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: 'Đơn hàng' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: 'Đơn hàng', slug: 'Đơn Hàng' }).success).toBe(false);
    expect(issuePaths(categorySchema.safeParse({ name: 'X' }))).toContain('name');
  });

  it('danh sách admin chỉ nhận cờ include_inactive true/false', () => {
    const query = validationSchemas['API-M10-18'].query;
    expect(query.safeParse({ include_inactive: 'true' }).success).toBe(true);
    expect(query.safeParse({ include_inactive: 'yes' }).success).toBe(false);
    expect(query.safeParse({ category_id: CATEGORY_ID, keyword: 'giao' }).success).toBe(true);
    expect(query.safeParse({ category_id: 'nhom-1' }).success).toBe(false);
  });
});

describe('M10 — phân trang danh sách', () => {
  it('áp dụng mặc định 20 dòng/trang', () => {
    const myReviews = validationSchemas['API-M10-10'].query.parse({});
    expect(myReviews.page).toBe(1);
    expect(myReviews.limit).toBe(20);

    const queue = validationSchemas['API-M10-14'].query.parse({});
    expect(queue.limit).toBe(20);
  });

  it('chặn limit vượt 50 và page không hợp lệ', () => {
    expect(validationSchemas['API-M10-13'].query.safeParse({ limit: '51' }).success).toBe(false);
    expect(validationSchemas['API-M10-13'].query.safeParse({ page: '0' }).success).toBe(false);
  });
});
