// Chuyển khoản ngân hàng (API-M05-10/11): webhook đối chiếu mã đơn + số tiền, admin xác nhận tay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repo = vi.hoisted(() => ({
  findOrderByRef: vi.fn(),
  findOrderById: vi.fn(),
  listOrderItems: vi.fn(),
  listOrderStatusHistory: vi.fn(),
  listPaymentTransactions: vi.fn(),
  listUsersByIds: vi.fn(),
  findPaymentTransactionByProvider: vi.fn(),
  findPaymentTransactionByIdempotencyKey: vi.fn(),
  insertPaymentTransaction: vi.fn(),
  updatePaymentTransaction: vi.fn(),
  updateOrder: vi.fn(),
  insertOrderStatusHistory: vi.fn(),
}));

vi.mock('../repository.js', () => repo);
vi.mock('@/server/integrations/payment/zalopay.js', () => ({
  createOrder: vi.fn(),
  isZalopaySandbox: vi.fn(() => false),
  verifyCallback: vi.fn(),
}));
vi.mock('@/server/integrations/payment/vnpay.js', () => ({
  buildSandboxSimulation: vi.fn(),
  createPaymentUrl: vi.fn(),
  getVnpaySettings: vi.fn(() => ({ mode: 'live' })),
  verifyIpn: vi.fn(),
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

const { confirmBankTransferPayment, getOrderDetail, handleBankWebhook } = await import(
  '../service.js'
);

const ORDER = {
  id: 'order-1',
  order_code: 'KD-261117-ABC123',
  user_id: 'user-1',
  status: 'PENDING_PAYMENT',
  payment_status: 'PENDING',
  payment_method: 'BANK_TRANSFER',
  shipping_method: 'STANDARD',
  subtotal: 250000,
  discount_amount: 0,
  points_discount_amount: 0,
  shipping_fee: 0,
  total_amount: 250000,
  coupon_code: null,
  points_used: 0,
  recipient_name: 'Nguyen Van A',
  recipient_phone: '0901234567',
  shipping_province: 'TP.HCM',
  payment_expires_at: '2099-01-01T00:00:00.000Z',
  placed_at: '2026-11-17T03:00:00.000Z',
  created_at: '2026-11-17T03:00:00.000Z',
  confirmed_at: null,
};

const ORIGINAL_ENV = { ...process.env };

function webhookRequest(secret = 'sepay-secret') {
  return new Request('http://localhost/api/v1/payments/bank/webhook', {
    method: 'POST',
    headers: { authorization: `Apikey ${secret}`, 'content-type': 'application/json' },
  });
}

function webhookBody(overrides = {}) {
  return {
    transferType: 'in',
    transferAmount: 250000,
    content: `CK ${ORDER.order_code} thanh toan`,
    referenceCode: 'FT26117',
    ...overrides,
  };
}

async function jsonOf(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BANK_TRANSFER_BANK_BIN = '970436';
  process.env.BANK_TRANSFER_BANK_NAME = 'Vietcombank';
  process.env.BANK_TRANSFER_ACCOUNT_NO = '0071000123456';
  process.env.BANK_TRANSFER_ACCOUNT_NAME = 'CONG TY KAIDO';
  process.env.BANK_TRANSFER_WEBHOOK_SECRET = 'sepay-secret';

  repo.findOrderByRef.mockResolvedValue({ ...ORDER });
  repo.findOrderById.mockResolvedValue({ ...ORDER });
  repo.findPaymentTransactionByProvider.mockResolvedValue(null);
  repo.findPaymentTransactionByIdempotencyKey.mockResolvedValue({ id: 'txn-bank' });
  repo.updatePaymentTransaction.mockResolvedValue({ id: 'txn-bank' });
  repo.updateOrder.mockImplementation(async (id, patch) => ({ ...ORDER, id, ...patch }));
  repo.insertOrderStatusHistory.mockResolvedValue({});
  repo.listOrderItems.mockResolvedValue([]);
  repo.listOrderStatusHistory.mockResolvedValue([]);
  repo.listPaymentTransactions.mockResolvedValue([]);
  repo.listUsersByIds.mockResolvedValue([]);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('M05 — webhook chuyển khoản ngân hàng', () => {
  it('tiền vào khớp mã đơn + số tiền thì chốt đơn đã thanh toán', async () => {
    const response = await handleBankWebhook({
      request: webhookRequest(),
      body: webhookBody(),
    });
    const payload = await jsonOf(response);

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.order_code).toBe(ORDER.order_code);
    expect(repo.updatePaymentTransaction).toHaveBeenCalledWith(
      'txn-bank',
      expect.objectContaining({ status: 'SUCCESS', provider_transaction_id: 'FT26117' }),
    );
    expect(repo.updateOrder).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ payment_status: 'SUCCESS', status: 'PENDING' }),
    );
    expect(repo.insertOrderStatusHistory).toHaveBeenCalledTimes(1);
  });

  it('sai khóa webhook thì trả 401 và không ghi dữ liệu', async () => {
    const response = await handleBankWebhook({
      request: webhookRequest('sai-secret'),
      body: webhookBody(),
    });

    expect(response.status).toBe(401);
    expect((await jsonOf(response)).success).toBe(false);
    expect(repo.findOrderByRef).not.toHaveBeenCalled();
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('nội dung không chứa mã đơn thì bỏ qua, không tự đoán', async () => {
    const response = await handleBankWebhook({
      request: webhookRequest(),
      body: webhookBody({ content: 'chuyen tien mua hang' }),
    });

    expect((await jsonOf(response)).success).toBe(false);
    expect(repo.findOrderByRef).not.toHaveBeenCalled();
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('số tiền lệch đơn thì không chốt thanh toán', async () => {
    const response = await handleBankWebhook({
      request: webhookRequest(),
      body: webhookBody({ transferAmount: 1000 }),
    });
    const payload = await jsonOf(response);

    expect(response.status).toBe(200);
    expect(payload.success).toBe(false);
    expect(payload.expected_amount).toBe(250000);
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('đơn đã hủy thì không tự đánh dấu đã thanh toán', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER, status: 'CANCELLED_TIMEOUT' });

    const response = await handleBankWebhook({
      request: webhookRequest(),
      body: webhookBody(),
    });

    expect((await jsonOf(response)).success).toBe(false);
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('giao dịch tiền ra bị bỏ qua', async () => {
    const response = await handleBankWebhook({
      request: webhookRequest(),
      body: webhookBody({ transferType: 'out' }),
    });

    expect((await jsonOf(response)).success).toBe(true);
    expect(repo.findOrderByRef).not.toHaveBeenCalled();
  });
});

describe('M05 — admin xác nhận đã nhận chuyển khoản', () => {
  it('xác nhận thành công thì ghi nhận SUCCESS kèm mã giao dịch ngân hàng', async () => {
    repo.findOrderById
      .mockResolvedValueOnce({ ...ORDER })
      .mockResolvedValueOnce({ ...ORDER, payment_status: 'SUCCESS', status: 'PENDING' });

    const result = await confirmBankTransferPayment({
      auth: { userId: 'staff-1', role: 'STAFF' },
      params: { id: ORDER.id },
      body: { reference_code: 'FT26117' },
    });

    expect(result.payment_status).toBe('SUCCESS');
    expect(result.order_status).toBe('PENDING');
    expect(repo.updatePaymentTransaction).toHaveBeenCalledWith(
      'txn-bank',
      expect.objectContaining({ status: 'SUCCESS', provider_transaction_id: 'FT26117' }),
    );
  });

  it('đơn đã thanh toán thì không xác nhận lặp', async () => {
    repo.findOrderById.mockResolvedValue({ ...ORDER, payment_status: 'SUCCESS' });

    await expect(
      confirmBankTransferPayment({
        auth: { userId: 'staff-1', role: 'STAFF' },
        params: { id: ORDER.id },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('đơn không dùng chuyển khoản thì từ chối', async () => {
    repo.findOrderById.mockResolvedValue({ ...ORDER, payment_method: 'COD' });

    await expect(
      confirmBankTransferPayment({
        auth: { userId: 'staff-1', role: 'STAFF' },
        params: { id: ORDER.id },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('M05 — dữ liệu trang chuyển khoản', () => {
  it('chi tiết đơn trả kèm VietQR đúng số tiền và nội dung mã đơn', async () => {
    const detail = await getOrderDetail({
      auth: { userId: 'user-1', role: 'CUSTOMER' },
      params: { orderRef: ORDER.order_code },
    });

    expect(detail.payment_info.payment_mode).toBe('bank');
    expect(detail.payment_info.bank_transfer.memo).toBe(ORDER.order_code);
    expect(detail.payment_info.bank_transfer.amount).toBe(250000);
    expect(detail.payment_info.bank_transfer.qr_url).toContain('img.vietqr.io');
    expect(detail.payment_info.bank_transfer.qr_url).toContain('amount=250000');
  });
});
