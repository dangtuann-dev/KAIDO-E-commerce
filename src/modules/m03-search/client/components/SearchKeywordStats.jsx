'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SearchKeywordStats
 * SRS: M03-F12 | API: API-M03-04
 * Route: /admin/analytics/search
 * UI: Bảng top từ khóa / từ khóa không có kết quả kèm thanh tỷ lệ.
 */
import Link from 'next/link';
import EmptyState from '@/shared/ui/empty-state.jsx';

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

export default function SearchKeywordStats({
  title,
  description,
  rows = [],
  emptyTitle = 'Chưa có dữ liệu',
  showSearchLink = false,
}) {
  const headingId = `${title.replace(/\s+/g, '-').toLowerCase()}-heading`;
  const max = rows.reduce((current, row) => Math.max(current, row.count), 0);

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <div>
        <h2 id={headingId} className="font-heading text-h4 text-ink">
          {title}
        </h2>
        {description ? <p className="mt-1 text-body-s text-slate">{description}</p> : null}
      </div>

      <div className="mt-4 rounded-md border border-fog bg-white">
        {rows.length === 0 ? (
          <EmptyState className="border-0" title={emptyTitle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-body-s">
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="w-12 px-4 py-3 font-semibold">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Từ khóa
                  </th>
                  <th scope="col" className="w-40 px-4 py-3 font-semibold">
                    Lượt tìm
                  </th>
                  {showSearchLink ? (
                    <th scope="col" className="w-28 px-4 py-3 text-right font-semibold">
                      Kiểm tra
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.keyword} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3 text-slate">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{row.keyword}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-10 shrink-0 text-right font-semibold text-ink">
                          {formatNumber(row.count)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-fog"
                        >
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${max ? Math.max(8, (row.count / max) * 100) : 0}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    {showSearchLink ? (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/search?keyword=${encodeURIComponent(row.keyword)}`}
                          className="text-body-s font-semibold text-primary transition-colors duration-250 hover:text-primary-hover"
                        >
                          Xem
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
