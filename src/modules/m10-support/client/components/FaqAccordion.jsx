/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqAccordion
 * SRS: M10-F09, M10-F10 | API: API-M10-06
 * Route: /faq
 * UI: Accordion câu hỏi thường gặp nhóm theo chủ đề; dùng <details> để mở nhiều mục.
 */

/**
 * @param {{
 *   groups?: Array<{ category: { id: string, name: string, slug: string }, questions: Array<{ id: string, question: string, answer: string }> }>,
 *   emptyText?: string,
 * }} props
 */
export default function FaqAccordion({ groups = [], emptyText = 'Chưa có câu hỏi nào phù hợp.' }) {
  if (groups.length === 0) {
    return <p className="rounded-md border border-dashed border-fog bg-white px-4 py-8 text-center text-body-s text-slate">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.category.id} aria-labelledby={`faq-${group.category.slug}`}>
          <h2 id={`faq-${group.category.slug}`} className="font-heading text-h3 text-ink">
            {group.category.name}
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {group.questions.map((item) => (
              <details
                key={item.id}
                className="group rounded-md border border-fog bg-white px-4 py-3 open:border-primary/40"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-body-s font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-slate transition-transform duration-250 group-open:rotate-180"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 whitespace-pre-line text-body-s text-slate">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
