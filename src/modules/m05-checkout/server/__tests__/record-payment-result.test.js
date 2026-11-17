// Hợp đồng recordPaymentResult: idempotent, không hạ đơn đã thanh toán, chặn lệch tiền.
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

vi.mock('../repository.js', () => repo);

const { recordPaymentResult } = await import('../../public.server.js');

const ORDER = {
  id: 'order-1',
  order_code: 'KD-261117-0001',
  status: 'PENDING_PAYMENT',
  payment_status: 'PENDING',
  total_amount: 250000,
  confirmed_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.findPaymentTransactionByProvider.mockResolvedValue(null);
  repo.findPaymentTransactionByIdempotencyKey.mockResolvedValue({ id: 'txn-1' });
  repo.updatePaymentTransaction.mockResolvedValue({ id: 'txn-1' });
  repo.updateOrder.mockImplementation(async (id, patch) => ({ ...ORDER, id, ...patch }));
});

describe('M05 — recordPaymentResult', () => {
  it('Return URL chốt đơn PENDING_PAYMENT sang PENDING khi thanh toán thành công', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER });

    const result = await recordPaymentResult({
      orderRef: ORDER.order_code,
      provider: 'VNPAY',
      providerTransactionId: '14500001',
      amountVnd: 250000,
      status: 'SUCCESS',
      payload: { vnp_ResponseCode: '00' },
    });

    expect(result.updated).toBe(true);
    expect(result.payment_status).toBe('SUCCESS');
    expect(repo.updatePaymentTransaction).toHaveBeenCalledWith(
      'txn-1',
      expect.objectContaining({ status: 'SUCCESS', provider_transaction_id: '14500001' }),
    );
    expect(repo.updateOrder).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ payment_status: 'SUCCESS', status: 'PENDING' }),
    );
    expect(repo.insertOrderStatusHistory).toHaveBeenCalledTimes(1);
  });

  it('không hạ đơn đã thanh toán xuống FAILED khi kết quả thất bại về trễ', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER, status: 'PENDING', payment_status: 'SUCCESS' });

    const result = await recordPaymentResult({
      orderRef: ORDER.order_code,
      provider: 'VNPAY',
      providerTransactionId: '14500002',
      amountVnd: 250000,
      status: 'FAILED',
    });

    expect(result.updated).toBe(false);
    expect(repo.updatePaymentTransaction).not.toHaveBeenCalled();
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it('từ chối khi số tiền không khớp đơn hàng', async () => {
    repo.findOrderByRef.mockResolvedValue({ ...ORDER });

    await expect(
      recordPaymentResult({
        orderRef: ORDER.order_code,
        provider: 'VNPAY',
        amountVnd: 1000,
        status: 'SUCCESS',
      }),
    ).rejects.toThrow(/không khớp/);

    expect(repo.updateOrder).not.toHaveBeenCalled();
  });
});
