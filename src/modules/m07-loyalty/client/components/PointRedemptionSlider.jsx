'use client';

/**
 * [TOY-M07] PointRedemptionSlider — chọn điểm quy đổi (1 điểm = 1.000đ).
 * SRS: M07-F04 | API: API-M07-04 | BR: BR-M07-02, BR-M07-03
 * Route: /checkout, /cart
 */
import { useId } from 'react';
import Button from '@/shared/ui/button.jsx';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { formatVND } from '@/shared/utils/formatVND.js';

const { POINT_VALUE_VND, MAX_REDEMPTION_PERCENT, REDEEM_POINT_MULTIPLE } = BUSINESS_RULES.LOYALTY;

function capFor(availablePoints, maxRedeemablePoints, subtotal) {
  if (Number.isFinite(Number(maxRedeemablePoints))) {
    return Math.max(0, Math.floor(Number(maxRedeemablePoints)));
  }
  const byPercent = Math.floor(
    ((Number(subtotal ?? 0) * MAX_REDEMPTION_PERCENT) / 100) / POINT_VALUE_VND,
  );
  const byMultiple = Math.floor(byPercent / REDEEM_POINT_MULTIPLE) * REDEEM_POINT_MULTIPLE;
  return Math.max(0, Math.min(Number(availablePoints ?? 0), byMultiple));
}

export default function PointRedemptionSlider({
  value = 0,
  availablePoints = 0,
  maxRedeemablePoints,
  subtotal = 0,
  onChange,
  onApply,
  disabled = false,
  showApply = false,
  className = '',
}) {
  const inputId = useId();
  const cap = capFor(availablePoints, maxRedeemablePoints, subtotal);
  const draft =
    Math.floor(Math.max(0, Math.min(cap, Number(value) || 0)) / REDEEM_POINT_MULTIPLE) *
    REDEEM_POINT_MULTIPLE;

  function update(nextValue) {
    const rounded =
      Math.floor(Math.max(0, Math.min(cap, Number(nextValue) || 0)) / REDEEM_POINT_MULTIPLE) *
      REDEEM_POINT_MULTIPLE;
    onChange?.(rounded);
  }

  if (cap < REDEEM_POINT_MULTIPLE) {
    return (
      <p className={`text-caption text-slate ${className}`}>
        {Number(availablePoints) > 0
          ? 'Đơn hàng chưa đủ điều kiện dùng điểm (tối đa 50% giá trị hàng).'
          : 'Bạn chưa có điểm khả dụng.'}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3 text-body-s">
        <label htmlFor={inputId} className="font-semibold text-ink">
          Điểm sử dụng
        </label>
        <span className="font-semibold text-primary">
          {draft.toLocaleString('vi-VN')} điểm · −{formatVND(draft * POINT_VALUE_VND)}
        </span>
      </div>

      <input
        id={inputId}
        type="range"
        min={0}
        max={cap}
        step={REDEEM_POINT_MULTIPLE}
        value={draft}
        disabled={disabled}
        onChange={(event) => update(event.target.value)}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-fog accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-slate">
        <span>
          Khả dụng {Number(availablePoints).toLocaleString('vi-VN')} · tối đa{' '}
          {cap.toLocaleString('vi-VN')} điểm
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            className="min-h-[44px] font-semibold text-slate underline hover:text-primary"
            onClick={() => update(0)}
            disabled={disabled || draft === 0}
          >
            Bỏ chọn
          </button>
          <button
            type="button"
            className="min-h-[44px] font-semibold text-primary underline"
            onClick={() => update(cap)}
            disabled={disabled || draft === cap}
          >
            Dùng tối đa
          </button>
        </span>
      </div>

      {showApply ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onApply?.(draft)}
          disabled={disabled}
        >
          Áp dụng {draft.toLocaleString('vi-VN')} điểm
        </Button>
      ) : null}
    </div>
  );
}
