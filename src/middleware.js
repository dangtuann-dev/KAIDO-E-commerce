/**
 * [MIDDLEWARE] Chặn thô các route cần đăng nhập — Giai đoạn 4.
 * Chỉ kiểm tra sự hiện diện cookie refresh token (không xác thực chữ ký).
 * Phân quyền thật nằm ở withApi và route guard phía client.
 *
 * Next.js 16 với thư mục src/ yêu cầu middleware đặt tại src/middleware.js
 * (root middleware.js không được nhận diện khi app nằm trong src/).
 */
import { NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/shared/constants/auth.js';

export function middleware(request) {
  if (request.cookies.has(REFRESH_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.search = '';
  redirectUrl.searchParams.set('auth', 'login');
  redirectUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/checkout', '/checkout/:path*'],
};
