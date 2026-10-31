import { redirect } from 'next/navigation';
import { verifyReturn } from '@/server/integrations/payment/vnpay.js';

/**
 * [TOY-M05] Điểm nhận chuyển hướng từ VNPAY (vnp_ReturnUrl).
 * Chỉ kiểm tra chữ ký để biết kết quả; trạng thái đơn được chốt bởi IPN (API-M05-04).
 */
export const metadata = {
  title: 'Kết quả thanh toán',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function VnpayReturnRoute({ searchParams }) {
  const params = (await searchParams) ?? {};

  let result = null;
  try {
    result = await verifyReturn(params);
  } catch {
    result = null;
  }

  if (!result?.valid || !result.orderRef) {
    redirect('/account/orders?payment=invalid');
  }

  redirect(
    `/order-success/${encodeURIComponent(result.orderRef)}?payment=${
      result.isSuccess ? 'success' : 'failed'
    }`,
  );
}
