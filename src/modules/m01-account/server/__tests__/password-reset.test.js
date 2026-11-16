import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { requestPasswordReset } from '../service.js';
import {
  findUserByEmail,
  countPasswordResetOtpsSince,
  consumeActivePasswordResetOtps,
  createPasswordResetOtp,
  enqueuePasswordResetOtp,
} from '../repository.js';

vi.mock('../repository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserByPhone: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  countPasswordResetOtpsSince: vi.fn(),
  consumeActivePasswordResetOtps: vi.fn(),
  createPasswordResetOtp: vi.fn(),
  enqueuePasswordResetOtp: vi.fn(),
  listAddressesByUser: vi.fn(),
  findAddressForUser: vi.fn(),
  insertAddress: vi.fn(),
  patchAddress: vi.fn(),
  listUsers: vi.fn(),
}));

const USER = {
  id: '00000000-0000-4000-8000-0000000000aa',
  email: 'khach@kaido.vn',
  status: 'ACTIVE',
};

beforeEach(() => {
  vi.clearAllMocks();
  countPasswordResetOtpsSince.mockResolvedValue(0);
  consumeActivePasswordResetOtps.mockResolvedValue([]);
  createPasswordResetOtp.mockResolvedValue({ id: 'otp-1', expires_at: null });
  enqueuePasswordResetOtp.mockResolvedValue({ id: 'noti-1' });
});

describe('M01-F05 — quên mật khẩu', () => {
  it('email không tồn tại vẫn trả OTP_SENT và không ghi OTP (chống dò tài khoản)', async () => {
    findUserByEmail.mockResolvedValue(null);

    const result = await requestPasswordReset({ email: 'khongco@kaido.vn' });

    expect(result).toEqual({ message: 'OTP_SENT', expired_in: 300 });
    expect(createPasswordResetOtp).not.toHaveBeenCalled();
    expect(enqueuePasswordResetOtp).not.toHaveBeenCalled();
  });

  it('tài khoản hợp lệ: lưu hash OTP 6 số hạn 5 phút và xếp hàng gửi email', async () => {
    findUserByEmail.mockResolvedValue(USER);

    const result = await requestPasswordReset({ email: 'khach@kaido.vn', ip: '1.2.3.4' });

    expect(result).toEqual({ message: 'OTP_SENT', expired_in: 300 });

    const [, saved] = createPasswordResetOtp.mock.calls[0];
    expect(saved.code_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.ip_address).toBe('1.2.3.4');
    const ttlSeconds = (new Date(saved.expires_at).getTime() - Date.now()) / 1000;
    expect(ttlSeconds).toBeGreaterThan(290);
    expect(ttlSeconds).toBeLessThanOrEqual(300);

    const [, queued] = enqueuePasswordResetOtp.mock.calls[0];
    expect(queued).toMatchObject({ email: USER.email, expires_in: 300 });
    expect(queued.otp).toMatch(/^\d{6}$/);
    expect(saved.code_hash).toBe(createHash('sha256').update(queued.otp).digest('hex'));
    expect(consumeActivePasswordResetOtps).toHaveBeenCalledWith(USER.id);
  });

  it('vượt 3 lần gửi trong một giờ → 429 RATE_LIMITED', async () => {
    findUserByEmail.mockResolvedValue(USER);
    countPasswordResetOtpsSince.mockResolvedValue(3);

    const error = await requestPasswordReset({ email: 'khach@kaido.vn' }).catch(
      (caught) => caught,
    );

    expect(error).toMatchObject({ code: 'RATE_LIMITED', status: 429 });
    expect(createPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('tài khoản bị vô hiệu hóa không phát sinh OTP', async () => {
    findUserByEmail.mockResolvedValue({ ...USER, status: 'DISABLED' });

    const result = await requestPasswordReset({ email: 'khach@kaido.vn' });

    expect(result.message).toBe('OTP_SENT');
    expect(createPasswordResetOtp).not.toHaveBeenCalled();
  });
});
