import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/m02-catalog/public.server.js', () => ({ getProductSnapshot: vi.fn() }));
vi.mock('@/modules/m08-inventory/public.server.js', () => ({ checkAvailability: vi.fn() }));
vi.mock('@/modules/m09-marketing/public.server.js', () => ({
  CouponService: { verifyCoupon: vi.fn(), consumeCoupon: vi.fn(), releaseCoupon: vi.fn() },
}));
vi.mock('../repository.js', () => ({
  findCartById: vi.fn(),
  listCartItems: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  deleteCartItems: vi.fn(),
  deleteAllCartItems: vi.fn(),
  updateCartStatus: vi.fn(),
}));

const repo = await import('../repository.js');
const { clearCartAfterOrder } = await import('../service.js');
const { CART_STATUS } = await import('../constants.js');

const ITEM_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ITEM_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('M04 — clearCartAfterOrder chỉ dọn dòng đã đặt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findCartById.mockResolvedValue({ id: 'cart-1', status: 'ACTIVE' });
  });

  it('giữ lại sản phẩm chưa chọn trong giỏ', async () => {
    repo.listCartItems
      .mockResolvedValueOnce([
        { id: ITEM_A, quantity: 2 },
        { id: ITEM_B, quantity: 3 },
      ])
      .mockResolvedValueOnce([{ id: ITEM_B, quantity: 3 }]);
    repo.deleteCartItems.mockResolvedValue([{ id: ITEM_A }]);

    const result = await clearCartAfterOrder('cart-1', [{ item_id: ITEM_A, quantity: 2 }]);

    expect(repo.deleteCartItems).toHaveBeenCalledWith('cart-1', [ITEM_A]);
    expect(repo.deleteAllCartItems).not.toHaveBeenCalled();
    expect(repo.updateCartStatus).not.toHaveBeenCalled();
    expect(result).toMatchObject({ removed_count: 1, remaining_count: 1, cleared: false });
  });

  it('giảm số lượng khi khách chỉ đặt một phần dòng hàng', async () => {
    repo.listCartItems
      .mockResolvedValueOnce([{ id: ITEM_A, quantity: 5 }])
      .mockResolvedValueOnce([{ id: ITEM_A, quantity: 2 }]);

    const result = await clearCartAfterOrder('cart-1', [{ item_id: ITEM_A, quantity: 3 }]);

    expect(repo.updateCartItemQuantity).toHaveBeenCalledWith(ITEM_A, 2);
    expect(repo.deleteCartItems).toHaveBeenCalledWith('cart-1', []);
    expect(result).toMatchObject({ updated_count: 1, remaining_count: 1, cleared: false });
  });

  it('đánh dấu CONVERTED khi giỏ không còn dòng nào', async () => {
    repo.listCartItems
      .mockResolvedValueOnce([{ id: ITEM_A, quantity: 1 }])
      .mockResolvedValueOnce([]);
    repo.deleteCartItems.mockResolvedValue([{ id: ITEM_A }]);

    const result = await clearCartAfterOrder('cart-1', [{ item_id: ITEM_A, quantity: 1 }]);

    expect(repo.updateCartStatus).toHaveBeenCalledWith('cart-1', CART_STATUS.CONVERTED);
    expect(result).toMatchObject({ cleared: true, status: CART_STATUS.CONVERTED });
  });
});
