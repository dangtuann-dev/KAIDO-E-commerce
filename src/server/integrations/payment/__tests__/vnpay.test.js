// Kiểm thử adapter VNPAY: chuỗi ký theo x-www-form-urlencoded và chế độ sandbox có kiểm soát.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSecureHash,
  createPaymentUrl,
  getVnpaySettings,
} from '@/server/integrations/payment/vnpay.js';

const SECRET = 'DEMO_SECRET_123456';

const PARAMS = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: 'DEMOV210',
  vnp_Amount: '25000000',
  vnp_CurrCode: 'VND',
  vnp_TxnRef: 'KD-261117-0001',
  vnp_OrderInfo: 'Thanh toan don hang KD-261117-0001',
  vnp_OrderType: 'other',
  vnp_Locale: 'vn',
  vnp_ReturnUrl: 'https://demo.example.com/payment/vnpay-return',
  vnp_IpAddr: '127.0.0.1',
  vnp_CreateDate: '20261117120000',
};

// Hash chuẩn VNPAY (dấu cách → '+'), đối chiếu với thư viện vnpayjs.
const EXPECTED_HASH =
  'f33b4b893c3783d5962de0a2d6662c27b3d4419ae65b70053a41e31575438fc69d676f62ff978a662e429f33004674c2bee286e6e436097986d226de9a82fe87';

const ORIGINAL_ENV = { ...process.env };

function setEnv(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('VNPAY canonical + chế độ sandbox', () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: 'test',
      VNPAY_TMN_CODE: undefined,
      VNPAY_HASH_SECRET: undefined,
      PAYMENT_SANDBOX_DEMO: undefined,
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('ký theo application/x-www-form-urlencoded để cổng VNPAY chấp nhận chữ ký', () => {
    expect(buildSecureHash(PARAMS, SECRET)).toBe(EXPECTED_HASH);
  });

  it('ngoài production: thiếu khóa vẫn dùng chế độ mô phỏng', () => {
    expect(getVnpaySettings().mode).toBe('sandbox');
  });

  it('production thiếu khóa và không bật cờ: từ chối VNPAY (503)', () => {
    setEnv({ NODE_ENV: 'production' });
    expect(() => getVnpaySettings()).toThrowError(/chưa được cấu hình/);
  });

  it('production bật PAYMENT_SANDBOX_DEMO: cho phép mô phỏng và cảnh báo một lần', async () => {
    setEnv({ NODE_ENV: 'production', PAYMENT_SANDBOX_DEMO: 'true' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const settings = getVnpaySettings();
    expect(settings.mode).toBe('sandbox');
    expect(settings.paymentUrl).toContain('/checkout/payment-sandbox');

    const order = await createPaymentUrl({
      orderRef: 'KD-261117-0001',
      amountVnd: 250000,
      orderInfo: 'Thanh toan don hang KD-261117-0001',
    });
    expect(order.paymentUrl).toContain('/checkout/payment-sandbox/KD-261117-0001');
    expect(order.sandbox).toBe(true);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/mô phỏng/);
  });

  it('có khóa thật thì luôn ưu tiên chế độ live, kể cả khi bật cờ demo', () => {
    setEnv({
      NODE_ENV: 'production',
      PAYMENT_SANDBOX_DEMO: 'true',
      VNPAY_TMN_CODE: 'TMN123',
      VNPAY_HASH_SECRET: 'secret123',
    });
    const settings = getVnpaySettings();
    expect(settings.mode).toBe('live');
    expect(settings.tmnCode).toBe('TMN123');
  });
});
