import { beforeEach, describe, expect, it, vi } from 'vitest';

const { chain, fromMock, singleSpy, maybeSingleSpy } = vi.hoisted(() => {
  const chain = {};
  for (const method of ['select', 'eq', 'is', 'order', 'insert', 'update']) {
    chain[method] = vi.fn(() => chain);
  }
  const maybeSingleSpy = vi.fn(async () => ({ data: null, error: null }));
  const singleSpy = vi.fn(async () => ({ data: { id: 'user-1' }, error: null }));
  chain.maybeSingle = maybeSingleSpy;
  chain.single = singleSpy;
  const fromMock = vi.fn(() => chain);
  return { chain, fromMock, singleSpy, maybeSingleSpy };
});

vi.mock('@/server/db/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({ from: fromMock })),
  rpc: vi.fn(),
}));

import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updateUser,
} from '../repository.js';

describe('M01-F01/F03 — repository users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findUserByEmail chuẩn hóa email về chữ thường và loại dòng đã xóa', async () => {
    await expect(findUserByEmail('  Khach@Kaido.VN ')).resolves.toBeNull();

    expect(fromMock).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('email', 'khach@kaido.vn');
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    expect(maybeSingleSpy).toHaveBeenCalledTimes(1);
  });

  it('findUserById và findUserByPhone truy vấn đúng cột', async () => {
    await findUserById('user-1');
    expect(chain.eq).toHaveBeenCalledWith('id', 'user-1');

    await findUserByPhone('0909123456');
    expect(chain.eq).toHaveBeenCalledWith('phone', '0909123456');
  });

  it('createUser chèn dữ liệu và trả dòng vừa tạo', async () => {
    const data = { email: 'khach@kaido.vn', full_name: 'Nguyễn An', role: 'CUSTOMER' };

    await expect(createUser(data)).resolves.toEqual({ id: 'user-1' });
    expect(chain.insert).toHaveBeenCalledWith(data);
    expect(chain.select).toHaveBeenCalled();
    expect(singleSpy).toHaveBeenCalledTimes(1);
  });

  it('updateUser cập nhật theo id và trả null khi không có dòng', async () => {
    await expect(updateUser('user-1', { full_name: 'Nguyễn Bình' })).resolves.toBeNull();

    expect(chain.update).toHaveBeenCalledWith({ full_name: 'Nguyễn Bình' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(maybeSingleSpy).toHaveBeenCalledTimes(1);
  });

  it('lỗi PostgREST 23505 được ném thành AppError DUPLICATE_RESOURCE', async () => {
    maybeSingleSpy.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    });

    await expect(findUserByEmail('trung@kaido.vn')).rejects.toMatchObject({
      code: 'DUPLICATE_RESOURCE',
    });
  });
});
