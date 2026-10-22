import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/server/db/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(),
  rpc,
}));

import { insertAddress, patchAddress } from '../repository.js';

describe('M01-F04 — repository địa chỉ', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ id: 'address-1' });
  });

  it('lưu địa chỉ mới bằng RPC trên database', async () => {
    const address = { user_id: 'user-1', recipient_name: 'Nguyễn An', is_default: true };

    await expect(insertAddress(address)).resolves.toEqual({ id: 'address-1' });
    expect(rpc).toHaveBeenCalledWith('manage_user_address', {
      p_action: 'create',
      p_user_id: 'user-1',
      p_data: { recipient_name: 'Nguyễn An', is_default: true },
    });
  });

  it.each([
    [{ recipient_name: 'Nguyễn An' }, 'update'],
    [{ deleted_at: '2026-10-21T00:00:00.000Z', is_default: false }, 'delete'],
    [{ is_default: true }, 'set_default'],
  ])('dùng thao tác database %s', async (patch, action) => {
    await patchAddress('address-1', 'user-1', patch);

    expect(rpc).toHaveBeenCalledWith('manage_user_address', {
      p_action: action,
      p_user_id: 'user-1',
      p_address_id: 'address-1',
      p_data: patch,
    });
  });
});
