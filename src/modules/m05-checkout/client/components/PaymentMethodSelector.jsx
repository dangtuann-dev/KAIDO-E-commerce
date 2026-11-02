'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — PaymentMethodSelector
 * SRS: M05-F04, M05-F07 | API: API-M05-01, API-M05-02 | BR: BR-M05-02, BR-M05-03
 * Route: /checkout
 * UI: Chỉ COD, VNPAY, MoMo, ZaloPay; tuyệt đối không có form thẻ tín dụng (SYS-NFR-04).
 * Danh sách phương thức + trạng thái khả dụng do API-M05-01 trả về.
 */
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Radio from '@/shared/ui/radio.jsx';
import { cn } from '@/shared/utils/cn.js';

/**
 * @param {{
 *   methods?: Array<{
 *     method: string,
 *     label: string,
 *     description?: string,
 *     available: boolean,
 *     mode?: string,
 *     sandbox?: boolean,
 *     note?: string | null,
 *   }>,
 *   value?: string,
 *   onChange?: (method: string) => void,
 *   total?: number,
 *   codThreshold?: number,
 *   disabled?: boolean,
 * }} props
 */
export default function PaymentMethodSelector({
  methods = [],
  value,
  onChange,
  total = 0,
  codThreshold = 0,
  disabled = false,
}) {
  const codNeedsApproval = codThreshold > 0 && total > codThreshold;

  return (
    <section aria-labelledby="checkout-payment-title" className="space-y-3">
      <div>
        <h2 id="checkout-payment-title" className="font-heading text-h5 text-ink">
          Phương thức thanh toán
        </h2>
        <p className="mt-1 text-body-s text-slate">
          KAIDO không lưu thông tin thẻ. Thanh toán online được xử lý tại cổng của ngân hàng/ví.
        </p>
      </div>

      <div role="radiogroup" aria-labelledby="checkout-payment-title" className="space-y-2">
        {methods.map((option) => {
          const isDisabled = disabled || !option.available;
          const checked = value === option.method;
          const isCod = option.method === 'COD';

          return (
            <div
              key={option.method}
              className={cn(
                'rounded-md border px-3 py-3 transition-colors duration-250',
                checked ? 'border-primary bg-surface-sky/60' : 'border-fog bg-white',
                isDisabled && 'opacity-70',
              )}
            >
              <Radio
                name="payment_method"
                value={option.method}
                checked={checked}
                disabled={isDisabled}
                onChange={() => onChange?.(option.method)}
                label={
                  <span className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{option.label}</span>
                      {option.sandbox ? <Badge tone="info">Môi trường mô phỏng</Badge> : null}
                      {!option.available ? <Badge tone="neutral">Sắp có</Badge> : null}
                      {isCod && codNeedsApproval ? (
                        <Badge tone="warning">Cần nhân viên xác nhận</Badge>
                      ) : null}
                    </span>
                    {option.description ? (
                      <span className="text-body-s text-slate">{option.description}</span>
                    ) : null}
                    {option.note ? (
                      <span className="text-caption text-slate">{option.note}</span>
                    ) : null}
                    {isCod && codNeedsApproval ? (
                      <span className="text-caption text-sale">
                        Đơn từ {formatVND(codThreshold)} trở lên sẽ được KAIDO gọi xác nhận trước khi
                        giao.
                      </span>
                    ) : null}
                  </span>
                }
                containerClassName="w-full"
              />
            </div>
          );
        })}
      </div>

      <p className="rounded-sm bg-surface-sky px-3 py-2 text-caption text-primary">
        {value === 'COD'
          ? 'Bạn thanh toán bằng tiền mặt cho nhân viên giao hàng khi nhận sản phẩm.'
          : 'Sau khi bấm “Đặt hàng”, bạn sẽ được chuyển sang cổng thanh toán. Đơn được giữ tồn trong 20 phút.'}
      </p>
    </section>
  );
}
