import Link from 'next/link';

/**
 * [SHARED] CheckoutLayout — header rút gọn, không điều hướng phân tán (Blueprint §3.9).
 */
export default function CheckoutLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-sky/30">
      <header className="border-b border-fog bg-white">
        <div className="kaido-container flex min-h-[64px] items-center justify-between gap-4 py-2">
          <Link href="/" className="flex items-center gap-2" aria-label="KAIDO — về trang chủ">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-sm bg-primary font-heading text-h6 text-white"
            >
              K
            </span>
            <span className="font-heading text-h4 tracking-wide text-ink">
              KAIDO<span className="text-secondary">.</span>
            </span>
          </Link>
          <p className="flex items-center gap-2 text-body-s font-semibold text-slate">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-success"
              fill="none"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            Thanh toán an toàn
          </p>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-fog bg-white">
        <div className="kaido-container flex flex-col gap-1 py-4 text-caption text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KAIDO E-commerce</p>
          <p>
            Cần hỗ trợ?{' '}
            <Link href="/faq" className="text-primary hover:underline">
              Xem câu hỏi thường gặp
            </Link>{' '}
            hoặc{' '}
            <Link href="/contact" className="text-primary hover:underline">
              liên hệ
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
