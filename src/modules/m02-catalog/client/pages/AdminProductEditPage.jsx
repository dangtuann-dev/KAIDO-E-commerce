'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductEditPage
 * SRS: M02-F05 | API: API-M02-09, API-M02-05
 * Route: /admin/products/[id]/edit
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Button from '@/shared/ui/button.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import AdminProductForm from '../components/AdminProductForm.jsx';
import { useGetAdminProductDetail } from '../hooks/use-get-admin-product-detail.js';

export default function AdminProductEditPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isPending, isError, error, refetch } = useGetAdminProductDetail({ id });

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="text-body-s text-slate">
        <Link href="/admin/products" className="hover:text-primary">
          Quản lý sản phẩm
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="font-semibold text-ink">Sửa sản phẩm</span>
      </nav>

      <h1 className="mt-2 font-heading text-h2 text-ink">Sửa sản phẩm</h1>
      <p className="mt-1 text-body-s text-slate">
        Thay đổi được áp dụng ngay lên storefront nếu sản phẩm đang ở trạng thái Đang bán.
      </p>

      <div className="mt-5">
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-md border border-sale/40 bg-sale/5 p-5">
            <p role="alert" className="text-body-s text-sale">
              {error?.message || 'Không tải được sản phẩm.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <AdminProductForm mode="edit" productId={id} initialData={data} />
        )}
      </div>
    </div>
  );
}
