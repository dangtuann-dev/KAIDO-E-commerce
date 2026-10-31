import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { REFRESH_TOKEN_COOKIE } from '@/shared/constants/auth.js';
import { verifyRefreshToken } from '@/server/auth/jwt.js';
import * as checkoutService from '@/modules/m05-checkout/server/service.js';
import PaymentSandboxPanel from '@/modules/m05-checkout/client/components/PaymentSandboxPanel.jsx';

/**
 * [TOY-M05] Trang mô phỏng cổng VNPAY (chỉ mở khi chưa cấu hình cổng thật).
 * Server Component: đọc cookie refresh HttpOnly để dựng context auth cho service,
 * tránh phải thêm một endpoint ngoài danh sách API của SRS.
 */
export const metadata = {
  title: 'Mô phỏng thanh toán VNPAY',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function resolveAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyRefreshToken(decodeURIComponent(token));
    return { userId: payload.userId, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export default async function PaymentSandboxRoute({ params }) {
  const { orderRef } = await params;
  const next = `/checkout/payment-sandbox/${orderRef}`;
  const auth = await resolveAuth();

  if (!auth) {
    redirect(`/?auth=login&next=${encodeURIComponent(next)}`);
  }

  let data;
  try {
    data = await checkoutService.getPaymentSandbox({
      auth,
      params: { orderRef: decodeURIComponent(orderRef) },
    });
  } catch {
    notFound();
  }

  return (
    <PaymentSandboxPanel
      order={data.order}
      successFields={data.success_fields}
      failureFields={data.failure_fields}
    />
  );
}
