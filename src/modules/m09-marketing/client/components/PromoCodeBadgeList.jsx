'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — PromoCodeBadgeList
 * SRS: M09-F04, M09-F08 | API: API-M09-08 | BR: BR-M09-02
 * Route: /promotions
 * UI: Danh sách mã khuyến mãi còn hiệu lực kèm nút sao chép và điều kiện sử dụng.
 */
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDate(value) {
  const stamp = Date.parse(value ?? '');
  return Number.isFinite(stamp) ? DATE_FORMATTER.format(new Date(stamp)) : null;
}

function discountLabel(coupon) {
  const value = Number(coupon.discount_value);
  if (coupon.discount_type === 'FREESHIP') return 'Miễn phí vận chuyển';
  if (coupon.discount_type === 'PERCENT') {
    const cap = coupon.max_discount_amount
      ? ` (tối đa ${formatVND(coupon.max_discount_amount)})`
      : '';
    return `Giảm ${Number.isFinite(value) ? value : 0}%${cap}`;
  }
  return `Giảm ${formatVND(coupon.discount_value)}`;
}

function conditions(coupon) {
  const items = [];
  if (Number(coupon.min_order_amount) > 0) {
    items.push(`Đơn từ ${formatVND(coupon.min_order_amount)}`);
  }
  const validTo = formatDate(coupon.valid_to);
  if (validTo) items.push(`HSD ${validTo}`);
  if (coupon.remaining != null) items.push(`Còn ${coupon.remaining} lượt`);
  else items.push('Không giới hạn lượt');
  return items;
}

async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export default function PromoCodeBadgeList({ coupons = [] }) {
  const toast = useToast();
  const [copiedCode, setCopiedCode] = useState(null);

  const items = Array.isArray(coupons) ? coupons.filter((coupon) => coupon?.code) : [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có mã giảm giá nào"
        description="Các chương trình ưu đãi mới sẽ xuất hiện tại đây ngay khi được phát hành."
      />
    );
  }

  async function handleCopy(code) {
    const copied = await copyToClipboard(code).catch(() => false);
    if (!copied) {
      toast.warning(`Không sao chép tự động được. Mã của bạn là ${code}.`);
      return;
    }
    setCopiedCode(code);
    toast.success(`Đã sao chép mã ${code}.`);
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((coupon) => (
        <li
          key={coupon.code}
          className="flex h-full flex-col gap-3 rounded-md border border-fog bg-white p-4 transition-shadow duration-250 hover:shadow-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-heading text-h5 text-ink">{discountLabel(coupon)}</p>
              {coupon.name && coupon.name !== coupon.code ? (
                <p className="mt-1 text-body-s text-slate">{coupon.name}</p>
              ) : null}
            </div>
            <Badge tone={coupon.discount_type === 'FREESHIP' ? 'info' : 'warning'}>Voucher</Badge>
          </div>

          <p className="flex items-center gap-2 rounded-sm border border-dashed border-primary/40 bg-surface-sky/50 px-3 py-2 font-heading text-h6 tracking-[0.12em] text-primary">
            {coupon.code}
          </p>

          <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-caption text-slate">
            {conditions(coupon).map((item) => (
              <li key={item} className="flex items-center gap-1">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mist" />
                {item}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant={copiedCode === coupon.code ? 'outline' : 'primary'}
            size="sm"
            onClick={() => handleCopy(coupon.code)}
            aria-label={`Sao chép mã ${coupon.code}`}
          >
            {copiedCode === coupon.code ? 'Đã sao chép' : 'Sao chép mã'}
          </Button>
        </li>
      ))}
    </ul>
  );
}
