import { redirect } from 'next/navigation';
import { verifyRedirect } from '@/server/integrations/payment/zalopay.js';
import { recordPaymentResult } from '@/modules/m05-checkout/public.server.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/shared/constants/payment.js';

/**
 * [TOY-M05] Điểm nhận chuyển hướng từ Cổng ZaloPay (embed_data.redirecturl).
 * `checksum` do ZaloPay ký bằng Key2 nên đủ tin cậy để chốt trạng thái ngay (idempotent);
 * callback server-to-server vẫn là kênh chính và không cộng trùng giao dịch.
 */
export const metadata = { title: 'Kết quả thanh toán', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ZalopayReturnRoute({ searchParams }) {
  const params = (await searchParams) ?? {};
  let result = null;
  try {
    result = await verifyRedirect(params);
  } catch {
    result = null;
  }

  if (!result?.valid || !result.orderRef) redirect('/account/orders?payment=invalid');

  try {
    await recordPaymentResult({
      orderRef: result.orderRef,
      provider: PAYMENT_METHODS.ZALOPAY,
      providerTransactionId: null,
      amountVnd: result.amountVnd,
      status: result.isSuccess ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
      payload: result.raw,
      note: `ZaloPay redirect xác nhận (status ${result.status ?? 'n/a'})`,
    });
  } catch (error) {
    // Không chặn điều hướng: callback sẽ chốt lại khi ZaloPay gọi được endpoint của KAIDO.
    console.warn('[zalopay-return] Chưa chốt được trạng thái từ redirect:', error?.message);
  }

  redirect(
    `/order-success/${encodeURIComponent(result.orderRef)}?payment=${result.isSuccess ? 'success' : 'failed'}`,
  );
}
