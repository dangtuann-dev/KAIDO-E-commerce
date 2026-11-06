/**
 * [TOY-M10] Hợp đồng phía client: hằng số hiển thị, luồng hành động ticket,
 * định dạng ngày giờ Việt Nam và schema form (tạo vs. sửa đánh giá).
 * Thuần hàm, không cần DOM.
 */
import { describe, expect, it } from 'vitest';
import {
  MEDIA_LIMITS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONES,
  STORE_REPLY_LABEL,
  TICKET_SENDER_LABELS,
  TICKET_STATUS_TONES,
  buildRatingBars,
  formatDate,
  formatDateTime,
  starsLabel,
  ticketActions,
} from '../display.js';
import {
  buildReviewFormSchema,
  buildTicketFormSchema,
  faqCategoryFormSchema,
  faqFormSchema,
  moderationFormSchema,
  staffReplyFormSchema,
  ticketReplyFormSchema,
} from '../validation/support-form.schema.js';

const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';

function issuePaths(result) {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('M10 display — nhãn và tông badge', () => {
  it('có nhãn tiếng Việt cho mọi trạng thái đánh giá', () => {
    expect(REVIEW_STATUS_LABELS.APPROVED).toBeTypeOf('string');
    expect(REVIEW_STATUS_LABELS.PENDING).toBeTypeOf('string');
    expect(Object.keys(REVIEW_STATUS_TONES)).toEqual(Object.keys(REVIEW_STATUS_LABELS));
    expect(STORE_REPLY_LABEL).toBe('KAIDO Store');
  });

  it('có tông badge cho mọi trạng thái ticket và nhãn người gửi', () => {
    expect(TICKET_STATUS_TONES).toMatchObject({
      OPEN: expect.any(String),
      IN_PROGRESS: expect.any(String),
      RESOLVED: expect.any(String),
      CLOSED: expect.any(String),
    });
    expect(TICKET_SENDER_LABELS.STAFF).toBe('KAIDO');
  });

  it('giới hạn tệp đính kèm lấy từ BR-M10-05', () => {
    expect(MEDIA_LIMITS.maxFiles).toBeGreaterThan(0);
    expect(MEDIA_LIMITS.maxVideoFiles).toBeGreaterThan(0);
    expect(MEDIA_LIMITS.minTextLength).toBeLessThan(MEDIA_LIMITS.maxTextLength);
  });
});

describe('M10 display — luồng hành động ticket', () => {
  it('ticket mới cho phép phân công, phản hồi, đóng', () => {
    expect(ticketActions('OPEN').map((item) => item.action)).toEqual([
      'ASSIGN',
      'REPLY',
      'CLOSE',
    ]);
  });

  it('ticket đang xử lý cho phép phản hồi, giải quyết, đóng', () => {
    expect(ticketActions('IN_PROGRESS').map((item) => item.action)).toEqual([
      'REPLY',
      'RESOLVE',
      'CLOSE',
    ]);
  });

  it('ticket đã giải quyết chỉ cho mở lại hoặc đóng, ticket đóng thì không còn hành động', () => {
    expect(ticketActions('RESOLVED').map((item) => item.action)).toEqual(['REOPEN', 'CLOSE']);
    expect(ticketActions('CLOSED')).toEqual([]);
    expect(ticketActions('UNKNOWN')).toEqual([]);
  });
});

describe('M10 display — điểm sao và phân bố', () => {
  it('định dạng nhãn số sao', () => {
    expect(starsLabel(4)).toBe('4 sao');
    expect(starsLabel('5')).toBe('5 sao');
    expect(starsLabel(null)).toBe('—');
  });

  it('tính phần trăm phân bố 5..1 sao', () => {
    const bars = buildRatingBars({ 5: 3, 4: 1 }, 4);
    expect(bars.map((bar) => bar.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(bars[0]).toEqual({ stars: 5, count: 3, percent: 75 });
    expect(bars[1].percent).toBe(25);
    expect(bars[2].percent).toBe(0);
  });

  it('không chia cho 0 khi chưa có đánh giá', () => {
    const bars = buildRatingBars(null, 0);
    expect(bars.every((bar) => bar.count === 0 && bar.percent === 0)).toBe(true);
  });
});

describe('M10 display — ngày giờ theo Asia/Ho_Chi_Minh', () => {
  it('hiển thị ISO theo giờ Việt Nam', () => {
    expect(formatDateTime('2026-10-31T01:00:00.000Z')).toMatch(/08:00/);
    expect(formatDate('2026-10-31T17:30:00.000Z')).toBe('01/11/2026');
  });

  it('trả dấu gạch ngang với giá trị không hợp lệ', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime('khong-phai-ngay')).toBe('—');
  });
});

describe('M10 form — gửi/sửa đánh giá (F01, F02, BR-M10-05)', () => {
  const createSchema = buildReviewFormSchema();
  const editSchema = buildReviewFormSchema({ editing: true });

  it('bắt buộc mã đơn khi tạo mới nhưng không cần khi sửa', () => {
    const base = {
      rating: '5',
      title: '',
      comment: 'Sản phẩm rất tốt, bé nhà mình chơi cả ngày.',
      images: '',
    };
    expect(issuePaths(createSchema.safeParse(base))).toContain('order_code');
    expect(createSchema.safeParse({ ...base, order_code: '#KD-00021' }).success).toBe(true);
    expect(editSchema.safeParse(base).success).toBe(true);
  });

  it('tách URL ảnh theo dòng và bỏ dòng trống', () => {
    const parsed = createSchema.parse({
      order_code: '#KD-00021',
      rating: '4',
      title: '',
      comment: 'Sản phẩm rất tốt, bé nhà mình chơi cả ngày.',
      images: 'https://cdn.kaido.vn/1.webp\n\n https://cdn.kaido.vn/2.webp ',
    });
    expect(parsed.images).toEqual([
      'https://cdn.kaido.vn/1.webp',
      'https://cdn.kaido.vn/2.webp',
    ]);
  });

  it('chặn URL sai định dạng và quá số ảnh/video', () => {
    const base = {
      order_code: '#KD-00021',
      rating: 5,
      comment: 'Sản phẩm rất tốt, bé nhà mình chơi cả ngày.',
    };
    expect(issuePaths(createSchema.safeParse({ ...base, images: 'khong-phai-url' }))).toContain(
      'images',
    );
    expect(
      issuePaths(
        createSchema.safeParse({ ...base, images: 'https://cdn.kaido.vn/a.mp4\nhttps://cdn.kaido.vn/b.mp4' }),
      ),
    ).toContain('images');
  });

  it('giới hạn số sao và độ dài nội dung', () => {
    const base = { order_code: '#KD-00021', comment: 'Sản phẩm rất tốt, bé nhà mình chơi cả ngày.' };
    expect(issuePaths(createSchema.safeParse({ ...base, rating: 0 }))).toContain('rating');
    expect(issuePaths(createSchema.safeParse({ ...base, rating: 5, comment: 'Hay' }))).toContain(
      'comment',
    );
  });
});

describe('M10 form — ticket và FAQ (F06..F09)', () => {
  it('schema tạo ticket yêu cầu chủ đề, tiêu đề và mô tả', () => {
    const schema = buildTicketFormSchema();
    expect(issuePaths(schema.safeParse({ category: 'ORDER_ISSUE', subject: '', message: '' }))).toEqual(
      expect.arrayContaining(['subject', 'message']),
    );
    expect(
      schema.parse({
        category: 'ORDER_ISSUE',
        subject: 'Đơn hàng giao chậm',
        message: 'Đơn của tôi đã quá hạn giao 2 ngày.',
        order_id: '',
        files: '',
      }).files,
    ).toEqual([]);
  });

  it('phản hồi ticket của khách và của CSKH dùng chung quy tắc nội dung', () => {
    expect(ticketReplyFormSchema.safeParse({ message: '', files: '' }).success).toBe(false);
    expect(staffReplyFormSchema.safeParse({ message: 'Đã xử lý', files: '', priority: '' }).success).toBe(
      true,
    );
    expect(staffReplyFormSchema.safeParse({ message: 'Đã xử lý', files: '', priority: 'ASAP' }).success).toBe(
      false,
    );
  });

  it('kiểm duyệt chỉ bắt buộc lý do khi từ chối/ẩn', () => {
    expect(moderationFormSchema.safeParse({ action: 'APPROVE', reason: '' }).success).toBe(true);
    expect(issuePaths(moderationFormSchema.safeParse({ action: 'HIDE', reason: '' }))).toContain(
      'reason',
    );
    expect(moderationFormSchema.safeParse({ action: 'REJECT', reason: 'Spam' }).success).toBe(true);
  });

  it('schema FAQ kiểm tra nhóm, câu hỏi và câu trả lời', () => {
    expect(issuePaths(faqFormSchema.safeParse({ category_id: '', question: '', answer: '' }))).toEqual(
      expect.arrayContaining(['category_id', 'question', 'answer']),
    );
    expect(
      faqFormSchema.parse({
        category_id: CATEGORY_ID,
        question: 'Bao lâu thì đơn hàng được giao?',
        answer: 'Đơn nội thành thường được giao trong 1 đến 2 ngày làm việc.',
        sort_order: '3',
        is_active: true,
      }).sort_order,
    ).toBe(3);
  });

  it('slug nhóm FAQ bỏ trống được chấp nhận để server tự sinh', () => {
    expect(faqCategoryFormSchema.safeParse({ name: 'Đơn hàng', slug: '', sort_order: 0 }).success).toBe(
      true,
    );
    expect(faqCategoryFormSchema.safeParse({ name: 'Đơn hàng', slug: 'Don Hang' }).success).toBe(
      false,
    );
  });
});
