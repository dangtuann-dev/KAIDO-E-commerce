import { describe, expect, it } from 'vitest';
import {
  computeHmac,
  timingSafeEqualStrings,
  verifySignature,
} from '@/server/security/verifySignature.js';
import { sanitizeSearchKeyword, sanitizeText, stripHtml } from '@/server/security/sanitize.js';
import { buildPaginationMeta, parsePagination } from '@/server/http/pagination.js';

describe('HMAC', () => {
  it('xác thực chữ ký đúng và từ chối chữ ký sai', () => {
    const payload = JSON.stringify({ order: 'KD-260101-ABC123' });
    const secret = 'webhook-secret';
    const signature = computeHmac(payload, secret);

    expect(verifySignature({ payload, signature, secret })).toBe(true);
    expect(verifySignature({ payload: `${payload} `, signature, secret })).toBe(false);
    expect(verifySignature({ payload, signature: `${signature}00`, secret })).toBe(false);
  });

  it('so sánh chuỗi an toàn theo thời gian', () => {
    expect(timingSafeEqualStrings('abc', 'abc')).toBe(true);
    expect(timingSafeEqualStrings('abc', 'abd')).toBe(false);
    expect(timingSafeEqualStrings('abc', 'abcd')).toBe(false);
  });
});

describe('sanitize', () => {
  it('loại script và thẻ HTML khỏi văn bản', () => {
    const input = '<p>Đồ chơi <strong>gỗ</strong></p><script>alert(1)</script>';
    const stripped = stripHtml(input);

    expect(stripped).toContain('Đồ chơi');
    expect(stripped).toContain('gỗ');
    expect(stripped).not.toContain('<');
    expect(stripped).not.toContain('alert');
    expect(sanitizeText(input)).toBe('Đồ chơi gỗ');
  });

  it('chuẩn hóa từ khóa tìm kiếm thành một dòng', () => {
    expect(sanitizeSearchKeyword('  <b>lego</b>\n  city  ')).toBe('lego city');
  });
});

describe('pagination', () => {
  it('áp giá trị mặc định và giới hạn', () => {
    expect(parsePagination(new URLSearchParams(''))).toEqual({ page: 1, limit: 12, offset: 0 });
    expect(parsePagination({ page: '3', limit: '999' })).toEqual({
      page: 3,
      limit: 100,
      offset: 200,
    });
    expect(parsePagination(new URLSearchParams('page=0&limit=-5'))).toEqual({
      page: 1,
      limit: 12,
      offset: 0,
    });
  });

  it('tạo meta phân trang', () => {
    expect(buildPaginationMeta({ page: 2, limit: 10, total: 25 })).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      total_pages: 3,
      has_next: true,
      has_prev: true,
    });
  });
});
