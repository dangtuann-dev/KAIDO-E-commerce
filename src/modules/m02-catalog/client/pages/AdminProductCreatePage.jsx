/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductCreatePage
 * SRS: M02-F04, M02-F07 | API: API-M02-04 | BR: BR-M02-01
 * Route: /admin/products/create
 */
import Link from 'next/link';
import AdminProductForm from '../components/AdminProductForm.jsx';

export default function AdminProductCreatePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="text-body-s text-slate">
        <Link href="/admin/products" className="hover:text-primary">
          Quản lý sản phẩm
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="font-semibold text-ink">Thêm sản phẩm</span>
      </nav>

      <h1 className="mt-2 font-heading text-h2 text-ink">Thêm sản phẩm</h1>
      <p className="mt-1 text-body-s text-slate">
        SKU phải duy nhất toàn hệ thống; giá sale không được lớn hơn giá niêm yết.
      </p>

      <div className="mt-5">
        <AdminProductForm mode="create" />
      </div>
    </div>
  );
}
