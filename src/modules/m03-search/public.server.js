import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M03 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M03-F01 — Cho phép module nội bộ tái sử dụng tìm kiếm; M03 chỉ đọc M02.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function searchCatalogIndex(_input) {
  throw new NotImplementedError('M03-F01');
}

/**
 * M03-F12 — Từ khóa phổ biến dùng chung cho gợi ý.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getPopularSearchTerms(_limit) {
  throw new NotImplementedError('M03-F12');
}
