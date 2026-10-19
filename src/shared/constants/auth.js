/**
 * [SHARED] Tên cookie/header và tham số JWT — dùng chung server, middleware và client.
 * Không chứa bí mật; secret chỉ nằm trong biến môi trường phía server.
 */
export const REFRESH_TOKEN_COOKIE = 'kaido_refresh_token';

export const GUEST_SESSION_HEADER = 'x-guest-session-id';

export const REQUEST_ID_HEADER = 'x-request-id';

export const JWT_ISSUER = 'kaido-ecommerce';

export const JWT_AUDIENCE = 'kaido-api';

export const JWT_TOKEN_TYPES = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
});
