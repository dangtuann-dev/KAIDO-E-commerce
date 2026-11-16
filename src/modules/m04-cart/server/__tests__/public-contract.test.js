import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCartAfterOrder } from '../../public.server.js';
import { clearCartAfterOrder as clearCartAfterOrderService } from '../service.js';

vi.mock('../service.js', () => ({
  clearCartAfterOrder: vi.fn(),
  getCartSummaryForCheckout: vi.fn(),
  mergeGuestCartIntoUser: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('M04 public.server — clearCartAfterOrder', () => {
  it('chuyển tiếp danh sách dòng đã đặt xuống service', async () => {
    const orderedItems = [{ item_id: 'item-1', quantity: 2 }];
    clearCartAfterOrderService.mockResolvedValue({ remaining_count: 1 });

    await clearCartAfterOrder('cart-1', orderedItems);

    expect(clearCartAfterOrderService).toHaveBeenCalledWith('cart-1', orderedItems);
  });

  it('giữ tương thích khi M05 không truyền danh sách', async () => {
    clearCartAfterOrderService.mockResolvedValue({ remaining_count: 0 });

    await clearCartAfterOrder('cart-1');

    expect(clearCartAfterOrderService).toHaveBeenCalledWith('cart-1', []);
  });
});
