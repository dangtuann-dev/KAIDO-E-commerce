// Trang /payment/zalopay-return: xác thực checksum, chốt đơn idempotent rồi điều hướng.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyRedirect, recordPaymentResult } = vi.hoisted(() => ({
  verifyRedirect: vi.fn(),
  recordPaymentResult: vi.fn(),
}));

vi.mock('@/server/integrations/payment/zalopay.js', () => ({
  verifyRedirect: (...args) => verifyRedirect(...args),
}));
vi.mock('@/modules/m05-checkout/public.server.js', () => ({
  recordPaymentResult: (...args) => recordPaymentResult(...args),
}));
vi.mock('next/navigation', () => ({
  redirect: (url) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const { default: ZalopayReturnRoute } = await import('../page.js');

const ORDER_REF = 'KD-261117-0001';

const successResult = {
  valid: true,
  orderRef: ORDER_REF,
  amountVnd: 250000,
  status: '1',
  isSuccess: true,
  raw: { apptransid: `261117_554_${ORDER_REF}`, status: '1' },
};

function render(params = { apptransid: `261117_554_${ORDER_REF}` }) {
  return ZalopayReturnRoute({ searchParams: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  recordPaymentResult.mockResolvedValue({ updated: true });
});

describe('M05 — /payment/zalopay-return', () => {
  it('chốt đơn khi khách thanh toán thành công rồi chuyển trang đơn', async () => {
    verifyRedirect.mockResolvedValue(successResult);

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=success`,
    );
    expect(recordPaymentResult).toHaveBeenCalledWith(
      expect.objectContaining({
        orderRef: ORDER_REF,
        provider: 'ZALOPAY',
        amountVnd: 250000,
        status: 'SUCCESS',
      }),
    );
  });

  it('ghi nhận thất bại khi khách hủy trên cổng', async () => {
    verifyRedirect.mockResolvedValue({ ...successResult, status: '2', isSuccess: false });

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=failed`,
    );
    expect(recordPaymentResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('lỗi khi chốt trạng thái không chặn việc chuyển trang', async () => {
    verifyRedirect.mockResolvedValue(successResult);
    recordPaymentResult.mockRejectedValue(new Error('DB tạm thời không phản hồi'));

    await expect(render()).rejects.toThrow(
      `NEXT_REDIRECT:/order-success/${ORDER_REF}?payment=success`,
    );
  });

  it('checksum không hợp lệ thì không ghi nhận gì', async () => {
    verifyRedirect.mockResolvedValue({ valid: false, orderRef: null, raw: null });

    await expect(render({ apptransid: 'abc', checksum: 'bad' })).rejects.toThrow(
      'NEXT_REDIRECT:/account/orders?payment=invalid',
    );
    expect(recordPaymentResult).not.toHaveBeenCalled();
  });
});
