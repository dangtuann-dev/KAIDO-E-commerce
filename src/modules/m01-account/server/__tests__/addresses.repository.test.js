import { describe, expect, it } from 'vitest';
import {
  insertAddress,
  patchAddress,
  listAddressesByUser,
  findAddressForUser,
} from '../repository.js';

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('M01-F04 — repository địa chỉ (stub bộ nhớ, chưa nối Supabase)', () => {
  it('lưu địa chỉ mới, tự sinh id và liệt kê theo chủ tài khoản', async () => {
    const row = await insertAddress({ user_id: USER_A, recipient_name: 'Tester', is_default: true });

    expect(row.id).toBeTruthy();
    expect(row.user_id).toBe(USER_A);

    const list = await listAddressesByUser(USER_A);
    expect(list.map((a) => a.id)).toContain(row.id);
    expect(await listAddressesByUser(USER_B)).toHaveLength(0);
  });

  it('cập nhật địa chỉ theo id', async () => {
    const row = await insertAddress({ user_id: USER_A, recipient_name: 'Tester' });

    const updated = await patchAddress(row.id, { recipient_name: 'Tester Two' });

    expect(updated.recipient_name).toBe('Tester Two');
    expect((await findAddressForUser(row.id, USER_A)).recipient_name).toBe('Tester Two');
  });

  it('không trả địa chỉ của người dùng khác hoặc đã xóa', async () => {
    const row = await insertAddress({ user_id: USER_B, recipient_name: 'Tester' });

    expect(await findAddressForUser(row.id, USER_A)).toBeNull();

    await patchAddress(row.id, { deleted_at: new Date().toISOString() });
    expect(await findAddressForUser(row.id, USER_B)).toBeNull();
  });
});
