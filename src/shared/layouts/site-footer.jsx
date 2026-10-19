import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Mua sắm',
    links: [
      { href: '/products', label: 'Tất cả sản phẩm' },
      { href: '/promotions', label: 'Khuyến mãi' },
      { href: '/blog', label: 'Blog đồ chơi' },
    ],
  },
  {
    title: 'Hỗ trợ khách hàng',
    links: [
      { href: '/faq', label: 'Câu hỏi thường gặp' },
      { href: '/contact', label: 'Liên hệ' },
      { href: '/account/orders', label: 'Tra cứu đơn hàng' },
      { href: '/account/support', label: 'Trung tâm hỗ trợ' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/account/profile', label: 'Hồ sơ cá nhân' },
      { href: '/account/addresses', label: 'Sổ địa chỉ' },
      { href: '/account/loyalty', label: 'Điểm thưởng' },
    ],
  },
];

/**
 * [SHARED] SiteFooter — Blueprint §3.9. Chỉ dựng khung, chưa có nội dung pháp lý
 * và thông tin liên hệ chính thức (TODO khi KAIDO cung cấp).
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-fog bg-surface-sky/50">
      <div className="kaido-container py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="KAIDO — về trang chủ"
            >
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-sm bg-primary font-heading text-h5 text-white"
              >
                K
              </span>
              <span className="font-heading text-h3 tracking-wide text-ink">
                KAIDO<span className="text-secondary">.</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-body-s text-slate">
              Đồ chơi trẻ em được tuyển chọn — đồng hành cùng bé trên mỗi chặng đường khám phá.
            </p>
            <p className="mt-4 text-caption text-slate">
              Thanh toán: COD, VNPAY, MoMo, ZaloPay
              <br />
              Vận chuyển: GHN, GHTK, Viettel Post
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-heading text-h6 text-ink">{column.title}</h2>
              <ul className="mt-3 space-y-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-[36px] items-center text-body-s text-slate transition-colors duration-250 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-fog pt-5 text-caption text-slate md:flex-row md:items-center md:justify-between">
          <p>© {year} KAIDO E-commerce. Website đang trong giai đoạn khởi tạo nền tảng.</p>
          <p>
            Chính sách đổi trả và bảo hành:{' '}
            <Link href="/faq" className="text-primary hover:underline">
              xem FAQ
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
