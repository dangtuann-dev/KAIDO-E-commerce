'use client';

/**
 * [TOY-M07] VoucherWalletModal — ví voucher của khách.
 * SRS: M07-F02, M07-F06 | API: API-M07-02 | BR: BR-M09-01, BR-M09-02
 * Route: /account/loyalty, /checkout
 */
import Modal from '@/shared/ui/modal.jsx';
import Button from '@/shared/ui/button.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';

function discountText(coupon) {
  if (!coupon) return '';
  if (coupon.discount_type === 'PERCENT') {
    const cap =
      coupon.max_discount_amount != null
        ? ` (tối đa ${formatVND(coupon.max_discount_amount)})`
        : '';
    return `Giảm ${coupon.discount_value}%${cap}`;
  }
  if (coupon.discount_type === 'FIXED') return `Giảm ${formatVND(coupon.discount_value)}`;
  return 'Miễn phí vận chuyển';
}

function VoucherItem({ voucher, onSelect }) {
  const coupon = voucher.coupon;
  const expires = voucher.expires_at ?? coupon?.valid_to ?? null;

  return (
    <li
      className={`rounded-md border p-4 ${
        voucher.usable ? 'border-fog bg-white' : 'border-fog/60 bg-fog/20 opacity-70'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-body-s font-bold text-ink">{coupon?.code ?? '—'}</p>
          <p className="text-body-s text-slate">{discountText(coupon)}</p>
          <p className="text-caption text-slate">
            {coupon?.min_order_amount > 0
              ? `Đơn tối thiểu ${formatVND(coupon.min_order_amount)}`
              : 'Không yêu cầu giá trị đơn tối thiểu'}
            {expires ? ` · HSD ${new Date(expires).toLocaleDateString('vi-VN')}` : ''}
          </p>
        </div>
        {voucher.usable ? (
          <Button variant="outline" size="sm" onClick={() => onSelect?.(coupon?.code)}>
            Dùng mã
          </Button>
        ) : (
          <span className="rounded-sm bg-fog px-2 py-1 text-caption font-semibold text-slate">
            {voucher.reason ?? 'Không khả dụng'}
          </span>
        )}
      </div>
    </li>
  );
}

export default function VoucherWalletModal({ open, onClose, vouchers = [], onSelect }) {
  const usable = vouchers.filter((voucher) => voucher.usable);
  const unavailable = vouchers.filter((voucher) => !voucher.usable);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ví voucher của bạn"
      description="Voucher sinh nhật và voucher theo hạng thành viên."
      size="md"
    >
      {vouchers.length === 0 ? (
        <p className="text-body-s text-slate">Bạn chưa có voucher nào trong ví.</p>
      ) : (
        <div className="space-y-5">
          {usable.length > 0 ? (
            <section>
              <h3 className="mb-2 text-body-s font-semibold text-ink">Khả dụng ({usable.length})</h3>
              <ul className="space-y-3">
                {usable.map((voucher) => (
                  <VoucherItem
                    key={voucher.voucher_id}
                    voucher={voucher}
                    onSelect={(code) => {
                      onSelect?.(code);
                      onClose?.();
                    }}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {unavailable.length > 0 ? (
            <section>
              <h3 className="mb-2 text-body-s font-semibold text-slate">
                Không khả dụng ({unavailable.length})
              </h3>
              <ul className="space-y-3">
                {unavailable.map((voucher) => (
                  <VoucherItem key={voucher.voucher_id} voucher={voucher} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
