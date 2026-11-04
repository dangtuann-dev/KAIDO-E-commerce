'use client';

/**
 * [TOY-M07] LoyaltyHistoryTable — nhật ký cộng/trừ điểm có phân trang.
 * SRS: M07-F07 | API: API-M07-03 | BR: BR-M07-01
 * Route: /account/loyalty/history
 */
import Button from '@/shared/ui/button.jsx';

const TYPE_LABELS = Object.freeze({
  EARN: 'Tích điểm',
  REDEEM: 'Sử dụng điểm',
  REFUND: 'Hoàn điểm',
  EXPIRE: 'Hết hạn',
  ADJUST: 'Điều chỉnh',
});

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LoyaltyHistoryTable({
  items = [],
  page = 1,
  totalPages = 1,
  total = 0,
  loading = false,
  error = null,
  onPageChange,
}) {
  if (loading) {
    return <p className="py-6 text-center text-body-s text-slate">Đang tải lịch sử điểm...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="py-6 text-center text-body-s text-sale">
        {error.message ?? 'Không tải được lịch sử điểm.'}
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-body-s text-slate">Chưa có giao dịch điểm nào.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-fog">
        <table className="min-w-full divide-y divide-fog text-body-s">
          <caption className="sr-only">Lịch sử biến động điểm thưởng</caption>
          <thead className="bg-fog/30 text-left text-caption uppercase tracking-wide text-slate">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Thời gian</th>
              <th scope="col" className="px-4 py-3 font-semibold">Lý do</th>
              <th scope="col" className="px-4 py-3 font-semibold">Loại</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Điểm</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Số dư</th>
              <th scope="col" className="px-4 py-3 font-semibold">Hết hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate">
                  {formatDateTime(item.created_at)}
                </td>
                <td className="px-4 py-3 text-ink">{item.reason}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate">
                  {TYPE_LABELS[item.type] ?? item.type}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                    item.change > 0 ? 'text-success-strong' : 'text-sale'
                  }`}
                >
                  {item.change > 0 ? '+' : ''}
                  {Number(item.change ?? 0).toLocaleString('vi-VN')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate">
                  {Number(item.balance_after ?? 0).toLocaleString('vi-VN')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate">
                  {item.expires_at ? new Date(item.expires_at).toLocaleDateString('vi-VN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-slate">
          {total.toLocaleString('vi-VN')} giao dịch · trang {page}/{Math.max(1, totalPages)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
