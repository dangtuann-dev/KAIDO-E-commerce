import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M01 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M01-F03 — Lấy email, SĐT và tên hiển thị cho M05/M06/M10.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getUserContact(_userId) {
  throw new NotImplementedError('M01-F03');
}

/**
 * M01-F03 — Tên hiển thị cho đánh giá/ticket của M10.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getCustomerDisplayName(_userId) {
  throw new NotImplementedError('M01-F03');
}

/**
 * M01-F07 — Chặn tài khoản LOCKED/DISABLED trước thao tác nghiệp vụ.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function assertActiveUser(_userId) {
  throw new NotImplementedError('M01-F07');
}
