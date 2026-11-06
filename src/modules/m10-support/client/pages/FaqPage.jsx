/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqPage
 * SRS: M10-F10 | API: API-M10-06, API-M10-22
 * Route: /faq
 * Render: Server Component (SEO) — FAQ nhóm theo chủ đề, tìm kiếm qua query string
 * và JSON-LD FAQPage (NFR-M10-03).
 */
import Link from 'next/link';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import FaqAccordion from '../components/FaqAccordion.jsx';
import { TICKET_SLA_HOURS } from '../display.js';
import { listFaqCategories, listFaqs } from '../../server/service.js';

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFaqQuery(searchParams = {}) {
  const keyword = String(firstValue(searchParams.keyword) ?? '').trim();
  const category = String(firstValue(searchParams.category) ?? '').trim();
  return {
    keyword: keyword ? keyword.slice(0, 120) : undefined,
    category: category ? category.slice(0, 120) : undefined,
  };
}

function jsonLd(payload) {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function buildFaqJsonLd(groups, base) {
  const questions = groups.flatMap((group) =>
    group.questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  );
  if (questions.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${base}/faq`,
    mainEntity: questions,
  };
}

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function categoryHref(slug, keyword) {
  const params = new URLSearchParams();
  if (slug) params.set('category', slug);
  if (keyword) params.set('keyword', keyword);
  const query = params.toString();
  return query ? `/faq?${query}` : '/faq';
}

function chipClass(active) {
  return `inline-flex min-h-[44px] items-center rounded-full border px-4 text-body-s font-semibold transition-colors duration-250 ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-fog bg-white text-ink hover:border-primary hover:text-primary'
  }`;
}

export default async function FaqPage({ searchParams }) {
  const query = parseFaqQuery((await searchParams) ?? {});

  const [categories, result] = await Promise.all([
    listFaqCategories({}).catch((error) => {
      console.warn('[m10:faq] Không tải được nhóm câu hỏi:', error?.message ?? error);
      return null;
    }),
    listFaqs({ query }).catch((error) => {
      console.warn('[m10:faq] Không tải được câu hỏi:', error?.message ?? error);
      return null;
    }),
  ]);

  const categoryList = categories?.items ?? [];
  const groups = result?.groups ?? [];
  const total = result?.total ?? 0;
  const faqJsonLd = buildFaqJsonLd(groups, siteUrl());

  return (
    <div className="kaido-container py-8 md:py-10">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
        />
      ) : null}

      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Câu hỏi thường gặp' }]} />

      <header className="mt-4 max-w-3xl">
        <h1 className="font-heading text-h1 text-ink">Câu hỏi thường gặp</h1>
        <p className="mt-2 text-body-l text-slate">
          Giao hàng, đổi trả, thanh toán và bảo hành — tổng hợp câu trả lời nhanh từ KAIDO. Không tìm
          thấy điều cần hỏi? Gửi yêu cầu hỗ trợ, KAIDO phản hồi trong {TICKET_SLA_HOURS} giờ làm việc.
        </p>
      </header>

      <form action="/faq" method="get" className="mt-6 flex flex-wrap items-end gap-3" role="search">
        {query.category ? (
          <input type="hidden" name="category" value={query.category} />
        ) : null}
        <label htmlFor="faq-keyword" className="sr-only">
          Tìm câu hỏi
        </label>
        <input
          id="faq-keyword"
          name="keyword"
          type="search"
          defaultValue={query.keyword ?? ''}
          placeholder="Ví dụ: đổi trả, phí vận chuyển…"
          className="min-h-[44px] w-full max-w-md rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-6 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
        >
          Tìm câu hỏi
        </button>
      </form>

      {categoryList.length > 0 ? (
        <nav aria-label="Nhóm câu hỏi" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={categoryHref('', query.keyword)}
                aria-current={query.category ? undefined : 'page'}
                className={chipClass(!query.category)}
              >
                Tất cả
              </Link>
            </li>
            {categoryList.map((category) => {
              const isActive = query.category === category.slug || query.category === category.id;
              return (
                <li key={category.id}>
                  <Link
                    href={categoryHref(category.slug, query.keyword)}
                    aria-current={isActive ? 'page' : undefined}
                    className={chipClass(isActive)}
                  >
                    {category.name}
                    {category.question_count > 0 ? (
                      <span className="ml-1.5 text-caption font-normal opacity-80">
                        ({category.question_count})
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <p className="mt-4 text-body-s text-slate" aria-live="polite">
        {query.keyword
          ? `${total} câu hỏi khớp từ khoá “${query.keyword}”.`
          : `${total} câu hỏi đã xuất bản.`}
      </p>

      <div className="mt-6">
        <FaqAccordion
          groups={groups}
          emptyText={
            query.keyword
              ? 'Không có câu hỏi nào khớp từ khoá. Hãy thử từ khoá khác hoặc gửi yêu cầu hỗ trợ.'
              : 'Câu hỏi thường gặp đang được cập nhật. Vui lòng quay lại sau ít ngày.'
          }
        />
      </div>

      <section
        aria-labelledby="faq-contact-heading"
        className="mt-10 rounded-md border border-fog bg-surface-sky/40 p-5"
      >
        <h2 id="faq-contact-heading" className="font-heading text-h4 text-ink">
          Vẫn cần hỗ trợ?
        </h2>
        <p className="mt-1 text-body-s text-slate">
          Gửi yêu cầu hỗ trợ để KAIDO kiểm tra đơn hàng cụ thể của bạn. Yêu cầu được theo dõi theo mã
          ticket và tự đóng sau thời gian lưu trữ khi đã giải quyết (BR-M10-04).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/account/support"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-6 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Trung tâm hỗ trợ
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-6 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
          >
            Thông tin liên hệ
          </Link>
        </div>
      </section>
    </div>
  );
}
