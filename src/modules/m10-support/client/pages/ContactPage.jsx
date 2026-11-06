/**
 * [TOY-M10] Hỗ trợ và đánh giá — ContactPage
 * SRS: M10-F06, M10-F10 | API: API-M10-03
 * Route: /contact
 * Render: Server Component (SEO) — kênh liên hệ chính thức, quy trình xử lý yêu cầu
 * và lối tắt tới ticket/FAQ; JSON-LD ContactPage.
 */
import Link from 'next/link';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import SupportTicketLauncher from '../components/SupportTicketLauncher.jsx';
import { TICKET_AUTO_CLOSE_HOURS, TICKET_SLA_HOURS } from '../display.js';

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function jsonLd(payload) {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

const CHANNELS = [
  {
    title: 'Yêu cầu hỗ trợ (ticket)',
    description:
      'Phù hợp khi cần kiểm tra đơn cụ thể, bảo hành hoặc đổi trả. Mỗi yêu cầu có mã ticket để theo dõi.',
    action: 'launcher',
  },
  {
    title: 'Câu hỏi thường gặp',
    description: 'Giao hàng, thanh toán, đổi trả và bảo hành — câu trả lời sẵn có, không cần chờ.',
    href: '/faq',
    linkLabel: 'Xem FAQ',
  },
  {
    title: 'Đơn hàng của tôi',
    description: 'Xem trạng thái đơn, vận chuyển và yêu cầu đổi trả ngay trên chi tiết đơn hàng.',
    href: '/account/orders',
    linkLabel: 'Mở đơn hàng',
  },
];

const STEPS = [
  'Gửi yêu cầu kèm mã đơn và mô tả chi tiết (ảnh/video nếu có).',
  `KAIDO tiếp nhận và phản hồi trong ${TICKET_SLA_HOURS} giờ làm việc.`,
  'Theo dõi hội thoại ngay trong trung tâm hỗ trợ bằng mã ticket.',
  `Yêu cầu đã giải quyết sẽ tự đóng sau ${TICKET_AUTO_CLOSE_HOURS} giờ nếu không có phản hồi mới (BR-M10-04).`,
];

export default function ContactPage() {
  const base = siteUrl();
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${base}/contact`,
    name: 'Liên hệ KAIDO',
    about: { '@type': 'Organization', name: 'KAIDO', url: base },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${base}/account/support`,
      availableLanguage: ['vi'],
    },
  };

  return (
    <div className="kaido-container py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(contactJsonLd) }}
      />

      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }]} />

      <header className="mt-4 max-w-3xl">
        <h1 className="font-heading text-h1 text-ink">Liên hệ KAIDO</h1>
        <p className="mt-2 text-body-l text-slate">
          KAIDO tiếp nhận mọi yêu cầu qua kênh hỗ trợ trực tuyến để lưu lại đầy đủ hội thoại và tra
          cứu nhanh theo mã ticket. Chọn kênh phù hợp bên dưới để bắt đầu.
        </p>
      </header>

      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {CHANNELS.map((channel) => (
          <li key={channel.title} className="flex flex-col rounded-md border border-fog bg-white p-5">
            <h2 className="font-heading text-h5 text-ink">{channel.title}</h2>
            <p className="mt-2 flex-1 text-body-s text-slate">{channel.description}</p>
            <div className="mt-4">
              {channel.action === 'launcher' ? (
                <SupportTicketLauncher nextPath="/contact" />
              ) : (
                <Link
                  href={channel.href}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
                >
                  {channel.linkLabel}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="contact-process-heading" className="mt-10 max-w-3xl">
        <h2 id="contact-process-heading" className="font-heading text-h3 text-ink">
          Quy trình xử lý yêu cầu
        </h2>
        <ol className="mt-4 flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-md border border-fog bg-white p-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sky font-semibold text-primary-active"
              >
                {index + 1}
              </span>
              <p className="text-body-s text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="contact-note-heading"
        className="mt-10 rounded-md border border-accent/60 bg-accent/10 p-5"
      >
        <h2 id="contact-note-heading" className="font-heading text-h5 text-ink">
          Trước khi gửi yêu cầu
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-body-s text-ink/80">
          <li>Chuẩn bị mã đơn (dạng #KD-XXXXX) để KAIDO kiểm tra nhanh.</li>
          <li>Đơn hàng phải thuộc tài khoản đang đăng nhập (NFR-M10-02).</li>
          <li>Tệp đính kèm gửi dưới dạng URL ảnh/video, tối đa 5 ảnh hoặc 1 video ≤ 5MB (BR-M10-05).</li>
        </ul>
      </section>
    </div>
  );
}
