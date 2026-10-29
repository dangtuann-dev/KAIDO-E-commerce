'use client';

/**
 * [TOY-M04] Giỏ hàng — CouponInputBox
 * SRS: M04-F07 | API: API-M04-07 | BR: BR-M09-02, BR-M09-03
 * Route: /cart
 * UI: Ô nhập voucher, hiển thị giảm giá hợp lệ hoặc lỗi; mỗi đơn tối đa 1 coupon.
 * Mọi xác thực mã đi qua CouponService của M09 (OPEN_DECISIONS #9).
 */
import { useState } from 'react';
import { formatVND } from '@/shared/utils/formatVND.js';
import Input from '@/shared/ui/input.jsx';
import Button from '@/shared/ui/button.jsx';

/**
 * @param {{
 *   onApply?: (code: string) => Promise<{ message?: string, discount_amount?: number } | void>,
 *   disabled?: boolean,
 *   appliedCoupon?: { code: string, discount_amount: number } | null,
 * }} props
 */
export default function CouponInputBox({ onApply, disabled = false, appliedCoupon = null }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      setNotice(null);
      setError('Vui lòng nhập mã giảm giá.');
      return;
    }

    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const result = await onApply?.(normalized);
      const discount = Number(result?.discount_amount ?? 0);
      setNotice(
        discount > 0
          ? `Đã áp dụng ${normalized}: giảm ${formatVND(discount)}.`
          : (result?.message ?? `Đã kiểm tra mã ${normalized}.`),
      );
      setCode('');
    } catch (caught) {
      setError(caught?.message ?? 'Không áp dụng được mã giảm giá.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="cart-coupon-title"
      className="rounded-md border border-dashed border-fog bg-white p-4"
    >
      <h2 id="cart-coupon-title" className="text-body-s font-semibold text-ink">
        Mã giảm giá
      </h2>
      <p className="mt-1 text-caption text-slate">Mỗi đơn hàng chỉ áp dụng tối đa 1 mã.</p>

      {appliedCoupon ? (
        <p className="mt-2 rounded-sm bg-success/10 px-3 py-2 text-caption font-semibold text-success-strong">
          Đang dùng mã {appliedCoupon.code} · giảm {formatVND(appliedCoupon.discount_amount)}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          id="cart-coupon-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="VD: TOY2026"
          autoComplete="off"
          maxLength={20}
          aria-label="Mã giảm giá"
          error={error ?? undefined}
          containerClassName="flex-1"
          disabled={disabled || pending}
        />
        <Button
          type="submit"
          variant="outline"
          className="sm:mt-0"
          loading={pending}
          disabled={disabled}
          loadingLabel="Đang kiểm tra…"
        >
          Áp dụng
        </Button>
      </form>

      {notice ? (
        <p role="status" className="mt-2 text-caption font-semibold text-success-strong">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
