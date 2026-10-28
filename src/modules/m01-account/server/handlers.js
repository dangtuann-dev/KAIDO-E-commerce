import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';
import { REFRESH_TOKEN_COOKIE } from '@/shared/constants/auth.js';
import {
  getRefreshTokenFromRequest,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '@/server/auth/cookies.js';
import { errorResponse, successResponse } from '@/server/http/apiResponse.js';
import {
  registerAccount,
  login,
  refreshSession,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from './service.js';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './service.js';

const registerHandler = async ({ body }) => registerAccount(body);

const loginHandler = async ({ body }) => {
  const { refresh_token, refresh_expires_in, ...publicData } = await login(body);

  const response = new Response(JSON.stringify({ success: true, data: publicData }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.append(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=${refresh_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${refresh_expires_in}${secure}`,
  );
  return response;
};

const refreshHandler = async ({ request, requestId }) => {
  try {
    const { refresh_token, refresh_expires_in, ...publicData } = await refreshSession({
      refreshToken: getRefreshTokenFromRequest(request),
    });

    return attachRefreshTokenCookie(successResponse(publicData, { requestId }), refresh_token, {
      maxAgeSeconds: refresh_expires_in,
    });
  } catch (error) {
    // Cookie hỏng/hết hạn: xóa luôn để lần tải trang sau không gọi refresh lặp lại.
    return clearRefreshTokenCookie(errorResponse(error, { requestId }));
  }
};

const logoutHandler = async () => {
  await logout();

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const response = new Response(JSON.stringify({ success: true, data: { success: true } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  // Max-Age=0 làm trình duyệt xóa cookie; Path và tên phải giống lúc đăng nhập
  response.headers.append(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  );
  return response;
};

const profileHandler = async ({ auth }) => getProfile({ userId: auth.userId });

const updateProfileHandler = async ({ auth, body }) => updateProfile({ userId: auth.userId, body });

const listAddressesHandler = async ({ auth }) => listAddresses({ userId: auth.userId });

const createAddressHandler = async ({ auth, body }) => createAddress({ userId: auth.userId, body });

const updateAddressHandler = async ({ auth, params, body }) =>
  updateAddress({ userId: auth.userId, id: params.id, body });

const deleteAddressHandler = async ({ auth, params }) =>
  deleteAddress({ userId: auth.userId, id: params.id });

const setDefaultAddressHandler = async ({ auth, params }) =>
  setDefaultAddress({ userId: auth.userId, id: params.id });

const changePasswordHandler = async ({ auth, body }) =>
  changePassword({ userId: auth.userId, body });

export const handlers = Object.freeze({
  'API-M01-01': registerHandler,
  'API-M01-02': loginHandler,
  'API-M01-03': profileHandler,
  'API-M01-04': updateProfileHandler,
  'API-M01-05': listAddressesHandler,
  'API-M01-06': notImplementedHandler('API-M01-06'),
  'API-M01-07': notImplementedHandler('API-M01-07'),
  'API-M01-08': createAddressHandler,
  'API-M01-09': updateAddressHandler,
  'API-M01-10': deleteAddressHandler,
  'API-M01-11': setDefaultAddressHandler,
  'API-M01-12': changePasswordHandler,
  'API-M01-13': logoutHandler,
  'API-M01-14': refreshHandler,
});
