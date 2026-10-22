import { describe, expect, it, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { AppError } from '@/server/http/errors.js';
import { login, registerAccount } from '../service.js';
import { findUserByEmail, updateUser } from '../repository.js';

vi.mock('../repository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserByPhone: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  listAddressesByUser: vi.fn(),
  findAddressForUser: vi.fn(),
  insertAddress: vi.fn(),
  patchAddress: vi.fn(),
  clearOtherDefaults: vi.fn(),
}));

const USER_ID = '00000000-0000-4000-8000-0000000000aa';

function fakeUser(overrides = {}) {
  return {
    id: USER_ID,
    email: 'khach@kaido.vn',
    phone: null,
    full_name: 'Tester Kaido',
    password_hash: bcrypt.hashSync('Dung@12345', 10),
    role: 'CUSTOMER',
    status: 'ACTIVE',
    failed_login_count: 0,
    locked_until: null,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('M01 login — mã lỗi nghiệp vụ', () => {
  it('tài khoản không tồn tại → 401 INVALID_CREDENTIALS dạng AppError', async () => {
    findUserByEmail.mockResolvedValue(null);

    const error = await login({ email: 'khach@kaido.vn', password: 'Dung@12345' }).catch(
      (caught) => caught,
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });

  it('sai mật khẩu → 401 INVALID_CREDENTIALS và tăng failed_login_count', async () => {
    findUserByEmail.mockResolvedValue(fakeUser());
    updateUser.mockResolvedValue({});

    const error = await login({ email: 'khach@kaido.vn', password: 'Sai@12345' }).catch(
      (caught) => caught,
    );

    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
    expect(updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ failed_login_count: 1 }),
    );
  });

  it('tài khoản đang bị khóa → 423 ACCOUNT_LOCKED', async () => {
    findUserByEmail.mockResolvedValue(
      fakeUser({ locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() }),
    );

    const error = await login({ email: 'khach@kaido.vn', password: 'Dung@12345' }).catch(
      (caught) => caught,
    );

    expect(error).toMatchObject({ code: 'ACCOUNT_LOCKED', status: 423 });
  });

  it('đăng nhập đúng → trả access_token và reset bộ đếm sai', async () => {
    findUserByEmail.mockResolvedValue(fakeUser({ failed_login_count: 2 }));
    updateUser.mockResolvedValue({});

    const result = await login({ email: 'khach@kaido.vn', password: 'Dung@12345' });

    expect(result.access_token).toBeTruthy();
    expect(result.user_info.email).toBe('khach@kaido.vn');
    expect(updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ failed_login_count: 0, locked_until: null }),
    );
  });
});

describe('M01 register — mã lỗi nghiệp vụ', () => {
  it('email đã được sử dụng → 409 EMAIL_TAKEN', async () => {
    findUserByEmail.mockResolvedValue(fakeUser());

    const error = await registerAccount({
      email: 'khach@kaido.vn',
      password: 'Dung@12345',
      full_name: 'Tester Kaido',
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'EMAIL_TAKEN', status: 409 });
  });
});
