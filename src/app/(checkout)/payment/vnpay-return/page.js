import { redirect } from 'next/navigation';
import { verifyReturn } from '@/server/integrations/payment/vnpay.js';
import { recordPaymentResult } from '@/modules/m05-checkout/public.server.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/shared/constants/payment.js';

/**
 * [TOY-M05] Điểm nhận chuyển hướng từ VNPAY (vnp_ReturnUrl).
 * Chữ ký hợp lệ thì chốt trạng thái ngay (idempotent) để đơn không bị treo khi IPN
 * chưa về (merchant demo không gửi IPN cho KAIDO). IPN vẫn là kênh chính;
 * hai đường cùng ghi nhận trên một giao dịch duy nhất nên không cộng trùng.
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

  try {
    await recordPaymentResult({
      orderRef: result.orderRef,
      provider: PAYMENT_METHODS.VNPAY,
      providerTransactionId: result.result?.transactionRef ?? null,
      amountVnd: result.result?.amountVnd ?? 0,
      status: result.isSuccess ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
      payload: result.result?.raw ?? null,
      note: `VNPAY Return xác nhận (${result.responseCode ?? 'n/a'})`,
    });
  } catch (error) {
    // Không chặn điều hướng: IPN sẽ chốt lại khi cổng gọi được endpoint của KAIDO.
    console.warn('[vnpay-return] Chưa chốt được trạng thái từ Return URL:', error?.message);
  }

  redirect(
    `/order-success/${encodeURIComponent(result.orderRef)}?payment=${
      result.isSuccess ? 'success' : 'failed'
    }`,
  );
}
