import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';
import { REFRESH_TOKEN_COOKIE } from '@/shared/constants/auth.js';
import { registerAccount, login, getProfile, updateProfile } from './service.js';

const registerHandler = async ({ body }) => {
  const user = await registerAccount(body);
  return { status: 201, data: user };
};

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

const profileHandler = async ({ auth }) => {
  return getProfile({ userId: auth.userId });
};

const updateProfileHandler = async ({ auth, body }) => {
  return updateProfile({ userId: auth.userId, body });
};

const listAddressesHandler = async ({ auth }) => {
  return listAddresses({ userId: auth.userId });
};

export const handlers = Object.freeze({
  'API-M01-01': registerHandler, // M01-F01
  'API-M01-02': loginHandler, // M01-F02
  'API-M01-03': profileHandler, // M01-F03
  'API-M01-04': updateProfileHandler, // M01-F04
  'API-M01-05': listAddressesHandler, // M01-F05
  'API-M01-06': notImplementedHandler('API-M01-06'), // M01-F05
  'API-M01-07': notImplementedHandler('API-M01-07'), // M01-F07
});