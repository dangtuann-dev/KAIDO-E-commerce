// Kiểm thử adapter chuyển khoản ngân hàng: cấu hình, VietQR, đối chiếu nội dung, webhook secret.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTransferMemo,
  buildVietQrUrl,
  extractBankTransferEvent,
  getBankTransferSettings,
  getBankTransferTimeoutMinutes,
  isBankTransferConfigured,
  parseOrderRefFromContent,
  verifyWebhookSecret,
} from '@/server/integrations/payment/vietqr.js';

const ORDER_REF = 'KD-261117-ABC123';
const ORIGINAL_ENV = { ...process.env };

function setEnv(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('VietQR / chuyển khoản ngân hàng adapter', () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: 'test',
      BANK_TRANSFER_BANK_BIN: '970436',
      BANK_TRANSFER_BANK_NAME: 'Vietcombank',
      BANK_TRANSFER_ACCOUNT_NO: '0071 000 123456',
      BANK_TRANSFER_ACCOUNT_NAME: 'CONG TY KAIDO',
      BANK_TRANSFER_WEBHOOK_SECRET: 'sepay-secret',
      BANK_TRANSFER_TIMEOUT_MINUTES: undefined,
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('thiếu tài khoản nhận tiền thì coi như chưa cấu hình và từ chối (503)', () => {
    setEnv({ BANK_TRANSFER_ACCOUNT_NO: undefined });

    expect(isBankTransferConfigured()).toBe(false);
    expect(() => getBankTransferSettings()).toThrowError(/chưa cấu hình tài khoản nhận/i);
  });

  it('cấu hình đủ thì chuẩn hóa số tài khoản và mặc định giữ tồn 60 phút', () => {
    const settings = getBankTransferSettings();

    expect(settings.accountNo).toBe('0071000123456');
    expect(settings.bankName).toBe('Vietcombank');
    expect(settings.timeoutMinutes).toBe(60);
    expect(getBankTransferTimeoutMinutes()).toBe(60);
  });

  it('hạn giữ tồn bị chặn trong khoảng 5 phút … 7 ngày', () => {
    setEnv({ BANK_TRANSFER_TIMEOUT_MINUTES: '1' });
    expect(getBankTransferTimeoutMinutes()).toBe(5);

    setEnv({ BANK_TRANSFER_TIMEOUT_MINUTES: '120' });
    expect(getBankTransferTimeoutMinutes()).toBe(120);
  });

  it('sinh ảnh VietQR kèm số tiền, nội dung và tên chủ tài khoản', () => {
    const url = buildVietQrUrl({ amountVnd: 250000, memo: buildTransferMemo(ORDER_REF) });

    expect(url).toContain('https://img.vietqr.io/image/970436-0071000123456-compact2.png');
    expect(url).toContain('amount=250000');
    expect(url).toContain(`addInfo=${encodeURIComponent(ORDER_REF)}`);
    expect(url).toContain('accountName=CONG+TY+KAIDO');
  });

  it('tìm mã đơn trong nội dung chuyển khoản dù ngân hàng chèn khoảng trắng', () => {
    expect(parseOrderRefFromContent('KD 261117 ABC123 chuyen tien')).toBe(ORDER_REF);
    expect(parseOrderRefFromContent('ck KD-261117-ABC123')).toBe(ORDER_REF);
    expect(parseOrderRefFromContent('thanh toan don hang')).toBeNull();
  });

  it('webhook chỉ chấp nhận đúng secret dạng Apikey/Bearer', () => {
    expect(verifyWebhookSecret('Apikey sepay-secret', 'sepay-secret')).toBe(true);
    expect(verifyWebhookSecret('Bearer sepay-secret', 'sepay-secret')).toBe(true);
    expect(verifyWebhookSecret('sepay-secret', 'sepay-secret')).toBe(true);
    expect(verifyWebhookSecret('Apikey sai-secret', 'sepay-secret')).toBe(false);
    expect(verifyWebhookSecret(null, 'sepay-secret')).toBe(false);
  });

  it('chuẩn hóa payload SePay: chỉ nhận tiền vào, giữ mã tham chiếu', () => {
    const event = extractBankTransferEvent({
      transferType: 'in',
      transferAmount: 250000,
      content: `CK ${ORDER_REF}`,
      referenceCode: 'FT26117',
      id: 123,
    });

    expect(event.transferType).toBe('in');
    expect(event.amountVnd).toBe(250000);
    expect(event.content).toContain(ORDER_REF);
    expect(event.referenceCode).toBe('FT26117');

    const fallback = extractBankTransferEvent({ id: 456, amount: 1000 });
    expect(fallback.referenceCode).toBe('BANK-456');
  });
});
