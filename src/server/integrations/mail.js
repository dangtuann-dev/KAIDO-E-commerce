import 'server-only';

/**
 * [SERVER] Gửi email/OTP — interface + stub.
 * SRS: M05-F08, M06-F13, M10-F06 (email xác nhận) | M01-F05 (OTP quên mật khẩu)
 * Trạng thái: TODO
 * Việc cần làm: hàng đợi thông báo (bảng notifications), template email, retry.
 * Owner: (xem docs/MODULES.md)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} _input
 * @returns {Promise<{ messageId: string }>}
 */
export async function sendMail(_input) {
  // TODO(M05-F08): tích hợp SMTP/Resend và ghi notifications.
  throw new NotImplementedError('M05-F08', 'Gửi email chưa được triển khai.');
}

/**
 * @param {{ to: string, otp: string, expiresInMinutes: number }} _input
 * @returns {Promise<{ sent: boolean }>}
 */
export async function sendOtpEmail(_input) {
  // TODO(M01-F05): gửi OTP, giới hạn 3 lần/giờ.
  throw new NotImplementedError('M01-F05', 'Gửi OTP email chưa được triển khai.');
}

/**
 * @param {{ to: string, orderRef: string, template: 'ORDER_PLACED' | 'SHIPPED' | 'DELIVERING' | 'DELIVERED' }} _input
 * @returns {Promise<{ queued: boolean }>}
 */
export async function queueOrderEmail(_input) {
  // TODO(M06-F13): đưa email vào hàng đợi để job gửi lại khi lỗi.
  throw new NotImplementedError('M06-F13', 'Email trạng thái đơn chưa được triển khai.');
}
