// Callback ZaloPay (API-M05-09): xác thực mac, chặn lệch tiền, chốt đơn idempotent.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = vi.hoisted(() => ({
  findOrderByRef: vi.fn(),
  findPaymentTransactionByProvider: vi.fn(),
  findPaymentTransactionByIdempotencyKey: vi.fn(),
  insertPaymentTransaction: vi.fn(),
  updatePaymentTransaction: vi.fn(),
  updateOrder: vi.fn(),
  insertOrderStatusHistory: vi.fn(),
}));

const zalopay = vi.hoisted(() => ({
  createOrder: vi.fn(),
  isZalopaySandbox: vi.fn(() => true),
  verifyCallback: vi.fn(),
}));

vi.mock('../repository.js', () => repo);
vi.mock('@/server/integrations/payment/zalopay.js', () => ({
  createOrder: (...args) => zalopay.createOrder(...args),
  isZalopaySandbox: () => zalopay.isZalopaySandbox(),
  verifyCallback: (...args) => zalopay.verifyCallback(...args),
}));
vi.mock('@/server/integrations/payment/vnpay.js', () => ({
  buildSandboxSimulation: vi.fn(),
  createPaymentUrl: vi.fn(),
  getVnpaySettings: vi.fn(() => ({ mode: 'sandbox' })),
  verifyIpn: vi.fn(),
}));
vi.mock('@/server/env.js', () => ({
  getPaymentGatewayStatus: vi.fn(() => ({ COD: true, VNPAY: false, MOMO: false, ZALOPAY: true })),
}));
vi.mock('@/server/db/supabase.js', () => ({ rpc: vi.fn() }));
vi.mock('@/modules/m04-cart/public.server.js', () => ({
  clearCartAfterOrder: vi.fn(),
  getCartSummaryForCheckout: vi.fn(),
}));
vi.mock('@/modules/m08-inventory/public.server.js', () => ({
  checkAvailability: vi.fn(),
  releaseForOrder: vi.fn(),
  reserveForOrder: vi.fn(),
}));
vi.mock('@/modules/m09-marketing/public.server.js', () => ({ CouponService: {} }));
vi.mock('@/modules/m07-loyalty/public.server.js', () => ({}));

const { handleZalopayCallback } = await import('../service.js');

const ORDER = {
  id: 'order-1',
  order_code: 'KD-261117-0001',
  user_id: 'user-1',
  status: 'PENDING_PAYMENT',
  payment_status: 'PENDING',
  payment_method: 'ZALOPAY',
  total_amount: 250000,
  confirmed_at: null,
};

const VERIFIED = {
  valid: true,
  reason: null,
  orderRef: ORDER.order_code,
  appTransId: `261117_554_${ORDER.order_code}`,
  amountVnd: 250000,
  transactionRef: '221117000000001',
  type: 1,
  isSuccess: true,
  raw: { app_trans_id: `261117_554_${ORDER.order_code}`, amount: 250000 },
};

async function bodyOf(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.findPaymentTransactionByProvider.mockResolvedValue(null);
  repo.findPaymentTransactionByIdempotencyKey.mockResolvedValue({ id: 'txn-1' });
  repo.updatePaymentTransaction.mockResolvedValue({ id: 'txn-1' });
  repo.insertOrderStatusHistory.mockResolvedValue({});
  repo.updateOrder.mockImplementation(async (id, patch) => ({ ...ORDER, id, ...patch }));
  zalopay.verifyCallback.mockResolvedValue(VERIFIED);
});

describe('M05 — callback ZaloPay', () => {
  it('đơn PENDING_PAYMENT được chốt PENDING + SUCCESS và trả return_code=1', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER });

    const response = await handleZalopayCallback({ body: { data: 'x', mac: 'y', type: 1 } });

    expect(await bodyOf(response)).toEqual({ return_code: 1, return_message: 'success' });
    expect(repo.updatePaymentTransaction).toHaveBeenCalledWith(
      'txn-1',
      expect.objectContaining({ status: 'SUCCESS', provider_transaction_id: '221117000000001' }),
    );
    expect(repo.updateOrder).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ payment_status: 'SUCCESS', status: 'PENDING' }),
    );
    expect(repo.insertOrderStatusHistory).toHaveBeenCalledTimes(1);
  });

  it('mac sai thì từ chối và không ghi dữ liệu', async () => {
    zalopay.verifyCallback.mockResolvedValue({ ...VERIFIED, valid: false, isSuccess: false });

    const response = await handleZalopayCallback({ body: { data: 'x', mac: 'bad', type: 1 } });

    expect((await bodyOf(response)).return_code).toBe(-1);
    expect(repo.findOrderByRef).not.toHaveBeenCalled();
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('không tìm thấy đơn thì trả mã âm để cổng gửi lại', async () => {
    repo.findOrderByRef.mockResolvedValue(null);

    const response = await handleZalopayCallback({ body: { data: 'x', mac: 'y', type: 1 } });

    expect((await bodyOf(response)).return_code).toBe(-2);
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('số tiền lệch với đơn thì không chốt', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER });
    zalopay.verifyCallback.mockResolvedValue({ ...VERIFIED, amountVnd: 1000 });

    const response = await handleZalopayCallback({ body: { data: 'x', mac: 'y', type: 1 } });

    expect((await bodyOf(response)).return_code).toBe(-3);
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('cổng chưa cấu hình thì trả return_code=0 thay vì ném lỗi 500', async () => {
    const { AppError } = await import('@/server/http/errors.js');
    const { ERROR_CODES } = await import('@/shared/constants/error-codes.js');
    zalopay.verifyCallback.mockRejectedValue(
      new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, 'ZaloPay chưa cấu hình'),
    );

    const response = await handleZalopayCallback({ body: {} });

    expect((await bodyOf(response)).return_code).toBe(0);
  });
});
