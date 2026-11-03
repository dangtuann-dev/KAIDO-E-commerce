'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — ReturnRequestPage
 * SRS: M06-F12 | API: API-M06-06 | BR: BR-M06-05
 * Route: /account/orders/[orderRef]/return
 * UI: Chọn sản phẩm, lý do, ảnh minh chứng và gửi yêu cầu đổi trả.
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useGetOrderDetail } from '../hooks/use-get-order-detail.js';
import ReturnRequestForm from '../components/ReturnRequestForm.jsx';

export default function ReturnRequestPage() {
  const params = useParams();
  const orderRef = typeof params?.orderRef === 'string' ? decodeURIComponent(params.orderRef) : '';

  const query = useGetOrderDetail({ orderRef }, { enabled: Boolean(orderRef) });
  const detail = query.data ?? null;
  const order = detail?.order ?? null;
  const items = detail?.order_items ?? [];

  if (!orderRef) {
    return (
      <EmptyState
        title="Thiếu mã đơn hàng"
        description="Đường dẫn không chứa mã đơn cần đổi trả."
        action={
          <Link href="/account/orders" className="kaido-link font-semibold">
            Về danh sách đơn
          </Link>
        }
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" rounded="md" />
      </div>
    );
  }

  if (query.isError || !order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description={query.error?.message ?? 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}
        action={
          <Link
            href="/account/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Về danh sách đơn
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <nav aria-label="Breadcrumb" className="text-caption text-slate">
          <Link href="/account/orders" className="hover:text-primary hover:underline">
            Đơn hàng của tôi
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link
            href={`/account/orders/${encodeURIComponent(order.order_code)}`}
            className="hover:text-primary hover:underline"
          >
            {order.order_code}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span className="font-semibold text-ink">Đổi trả</span>
        </nav>
        <h1 className="mt-1 font-heading text-h2 text-ink">Yêu cầu đổi trả</h1>
        <p className="mt-1 text-body-s text-slate">
          Đơn {order.order_code} · đổi trả trong 7 ngày kể từ khi nhận hàng (BR-M06-05).
        </p>
      </header>

      <ReturnRequestForm orderRef={order.order_code} order={order} items={items} />
    </div>
  );
}
