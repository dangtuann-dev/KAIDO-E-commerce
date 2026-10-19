import Link from 'next/link';

export const metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="kaido-container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-heading text-display text-primary/20">404</p>
      <h1 className="mt-2 font-heading text-h2 text-ink">Trang không tồn tại</h1>
      <p className="mt-3 max-w-md text-body text-slate">
        Đường dẫn bạn truy cập có thể đã thay đổi hoặc chưa được xây dựng trong phiên bản nền tảng
        này.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
        >
          Về trang chủ
        </Link>
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
