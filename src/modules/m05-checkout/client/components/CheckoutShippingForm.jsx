'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — CheckoutShippingForm
 * SRS: M05-F02, M05-F03 | API: API-M05-01, API-M05-02 | BR: BR-M05-01
 * Route: /checkout
 * UI: Form người nhận + địa chỉ 2 cấp Tỉnh → Xã (Blueprint §3.4) và chọn vận chuyển.
 * Form là controlled: state do CheckoutPage giữ để tính lại phí ship qua API-M05-01.
 */
import { formatVND } from '@/shared/utils/formatVND.js';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import Radio from '@/shared/ui/radio.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { cn } from '@/shared/utils/cn.js';
import { VN_PROVINCE_OPTIONS } from '../constants/vn-provinces.js';

const NOTE_MAX_LENGTH = 500;

/**
 * @param {{
 *   value: {
 *     recipient_name: string,
 *     recipient_phone: string,
 *     recipient_email: string,
 *     province_code: string,
 *     district: string,
 *     ward: string,
 *     address_line: string,
 *     note: string,
 *   },
 *   errors?: Record<string, string>,
 *   onChange?: (field: string, nextValue: string) => void,
 *   shippingOptions?: Array<{
 *     shipping_method: string,
 *     method_label?: string,
 *     name?: string,
 *     fee: number,
 *     is_free: boolean,
 *   }>,
 *   shippingMethod?: string,
 *   onShippingMethodChange?: (method: string) => void,
 *   shippingPending?: boolean,
 *   shippingError?: string | null,
 *   disabled?: boolean,
 * }} props
 */
export default function CheckoutShippingForm({
  value,
  errors = {},
  onChange,
  shippingOptions = [],
  shippingMethod,
  onShippingMethodChange,
  shippingPending = false,
  shippingError = null,
  disabled = false,
}) {
  function update(field) {
    return (event) => onChange?.(field, event.target.value);
  }

  return (
    <section aria-labelledby="checkout-shipping-title" className="space-y-5">
      <div>
        <h2 id="checkout-shipping-title" className="font-heading text-h5 text-ink">
          Thông tin giao hàng
        </h2>
        <p className="mt-1 text-body-s text-slate">
          Đơn hàng chỉ giao trong lãnh thổ Việt Nam. Vui lòng nhập số điện thoại đang dùng.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="checkout-recipient-name"
          label="Họ và tên người nhận"
          required
          value={value.recipient_name}
          onChange={update('recipient_name')}
          error={errors.recipient_name}
          autoComplete="name"
          maxLength={80}
          disabled={disabled}
        />
        <Input
          id="checkout-recipient-phone"
          label="Số điện thoại"
          required
          type="tel"
          inputMode="tel"
          value={value.recipient_phone}
          onChange={update('recipient_phone')}
          error={errors.recipient_phone}
          hint={errors.recipient_phone ? undefined : 'VD: 0901234567'}
          autoComplete="tel"
          maxLength={15}
          disabled={disabled}
        />
      </div>

      <Input
        id="checkout-recipient-email"
        label="Email (không bắt buộc)"
        type="email"
        value={value.recipient_email}
        onChange={update('recipient_email')}
        error={errors.recipient_email}
        hint={errors.recipient_email ? undefined : 'Dùng để gửi hoá đơn điện tử và cập nhật giao hàng.'}
        autoComplete="email"
        maxLength={120}
        disabled={disabled}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="checkout-province"
          label="Tỉnh / Thành phố"
          required
          placeholder="Chọn tỉnh / thành phố"
          options={VN_PROVINCE_OPTIONS}
          value={value.province_code}
          onChange={update('province_code')}
          error={errors.province_code}
          autoComplete="address-level1"
          disabled={disabled}
        />
        <Input
          id="checkout-ward"
          label="Phường / Xã"
          required
          value={value.ward}
          onChange={update('ward')}
          error={errors.ward}
          autoComplete="address-level3"
          maxLength={120}
          disabled={disabled}
        />
      </div>

      <Input
        id="checkout-district"
        label="Quận / Huyện (không bắt buộc)"
        value={value.district}
        onChange={update('district')}
        error={errors.district}
        autoComplete="address-level2"
        maxLength={120}
        disabled={disabled}
      />

      <Input
        id="checkout-address-line"
        label="Địa chỉ cụ thể"
        required
        value={value.address_line}
        onChange={update('address_line')}
        error={errors.address_line}
        hint={errors.address_line ? undefined : 'Số nhà, tên đường, toà nhà…'}
        autoComplete="street-address"
        maxLength={200}
        disabled={disabled}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="checkout-note" className="text-body-s font-semibold text-ink">
          Ghi chú cho đơn hàng
        </label>
        <textarea
          id="checkout-note"
          value={value.note}
          onChange={update('note')}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          disabled={disabled}
          placeholder="VD: giao ngoài giờ hành chính, gọi trước khi giao…"
          className={cn(
            'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
            errors.note && 'border-sale focus:border-sale focus:ring-sale/20',
          )}
        />
        <div className="flex items-center justify-between gap-3 text-caption text-slate">
          <span>{errors.note ? <span className="text-sale">{errors.note}</span> : 'Tối đa 500 ký tự.'}</span>
          <span>
            {value.note.length}/{NOTE_MAX_LENGTH}
          </span>
        </div>
      </div>

      <fieldset className="rounded-md border border-fog bg-white p-4">
        <legend className="px-1 text-body-s font-semibold text-ink">Phương thức vận chuyển</legend>
        <p className="mt-0.5 text-caption text-slate">
          Phí vận chuyển được tính theo tỉnh/thành và giá trị đơn hàng.
        </p>

        {shippingPending && shippingOptions.length === 0 ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            <Skeleton className="h-10 w-full" rounded="sm" />
            <Skeleton className="h-10 w-3/4" rounded="sm" />
          </div>
        ) : shippingOptions.length === 0 ? (
          <p className="mt-3 text-body-s text-slate">
            Nhập đầy đủ địa chỉ để xem phí vận chuyển.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {shippingOptions.map((option) => {
              const method = option.shipping_method;
              return (
                <div
                  key={method}
                  className={cn(
                    'rounded-sm border px-3 py-2.5 transition-colors duration-250',
                    shippingMethod === method
                      ? 'border-primary bg-surface-sky/60'
                      : 'border-fog hover:border-primary/60',
                  )}
                >
                  <Radio
                    name="shipping_method"
                    value={method}
                    checked={shippingMethod === method}
                    onChange={() => onShippingMethodChange?.(method)}
                    disabled={disabled}
                    label={
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="flex flex-col">
                          <span className="font-semibold text-ink">
                            {option.name ?? option.method_label}
                          </span>
                          <span className="text-caption text-slate">
                            {method === 'EXPRESS'
                              ? 'Giao trong ngày với khu vực nội thành.'
                              : 'Giao 2–4 ngày làm việc toàn quốc.'}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-ink">
                          {option.is_free ? 'Miễn phí' : formatVND(option.fee)}
                        </span>
                      </span>
                    }
                    containerClassName="w-full"
                  />
                </div>
              );
            })}
          </div>
        )}

        {shippingError ? (
          <p role="alert" className="mt-3 text-body-s text-sale">
            {shippingError}
          </p>
        ) : null}
      </fieldset>
    </section>
  );
}
