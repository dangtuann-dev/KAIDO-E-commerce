// Trang /payment/vnpay-return: xác thực chữ ký, chốt đơn idempotent rồi điều hướng.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyReturn, recordPaymentResult } = vi.hoisted(() => ({
  verifyReturn: vi.fn(),
  recordPaymentResult: vi.fn(),
}));

vi.mock('@/server/integrations/payment/vnpay.js', () => ({
  verifyReturn: (...args) => verifyReturn(...args),
}));
vi.mock('@/modules/m05-checkout/public.server.js', () => ({
  recordPaymentResult: (...args) => recordPaymentResult(...args),
}));
vi.mock('next/navigation', () => ({
  redirect: (url) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const { default: VnpayReturnRoute } = await import('../page.js');

const ORDER_REF = 'KD-261117-0001';

const successResult = {
  valid: true,
  orderRef: ORDER_REF,
  responseCode: '00',
  isSuccess: true,
  amountVnd: 250000,
  result: { transactionRef: '14500001', amountVnd: 250000, raw: { vnp_ResponseCode: '00' } },
};

function render(params = { vnp_TxnRef: ORDER_REF }) {
  return VnpayReturnRoute({ searchParams: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  recordPaymentResult.mockResolvedValue({ updated: true });
});

describe('M05 — /payment/vnpay-return', () => {
  it('chốt đơn khi VNPAY trả về thành công rồi chuyển trang đơn', async () => {
    verifyReturn.mockResolvedValue(successResult);

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=success`,
    );
    expect(recordPaymentResult).toHaveBeenCalledWith(
      expect.objectContaining({
        orderRef: ORDER_REF,
        provider: 'VNPAY',
        providerTransactionId: '14500001',
        amountVnd: 250000,
        status: 'SUCCESS',
      }),
    );
  });

  it('ghi nhận thất bại khi khách hủy giao dịch', async () => {
    verifyReturn.mockResolvedValue({
      ...successResult,
      responseCode: '24',
      isSuccess: false,
      result: { ...successResult.result, raw: { vnp_ResponseCode: '24' } },
    });

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=failed`,
    );
    expect(recordPaymentResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('lỗi khi chốt trạng thái không chặn việc chuyển trang', async () => {
    verifyReturn.mockResolvedValue(successResult);
    recordPaymentResult.mockRejectedValue(new Error('DB tạm thời không phản hồi'));

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=success`,
    );
  });

  it('chữ ký không hợp lệ thì không ghi nhận gì', async () => {
    verifyReturn.mockResolvedValue({ valid: false, orderRef: null, result: null });

    await expect(render({ vnp_TxnRef: ORDER_REF })).rejects.toThrow(
      'NEXT_REDIRECT:/account/orders?payment=invalid',
    );
    expect(recordPaymentResult).not.toHaveBeenCalled();
  });
});
