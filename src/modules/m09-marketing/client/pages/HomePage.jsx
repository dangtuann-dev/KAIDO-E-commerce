/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — HomePage (storefront)
 * SRS: M09-F01, M09-F02, M09-F03, M09-F07 | API: API-M09-01, API-M09-02, API-M09-06
 * Route: /
 * Render: Server Component (SEO/FCP) — banner, đếm ngược chiến dịch và bài viết mới nhất.
 * Khu sản phẩm nổi bật do M02 cung cấp qua public.client.js (M02-F10).
 */
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import FlashSaleCountdownBar from '../components/FlashSaleCountdownBar.jsx';
import HomeHeroSlider from '../components/HomeHeroSlider.jsx';
import { getActiveCampaigns, getBanners, listPublicArticles } from '../../server/service.js';
import { FeaturedProductShelf } from '@/modules/m02-catalog/public.client.js';

const DEMO_CATEGORIES = [
  { href: '/category/bo-lap-rap', label: 'Bộ lắp ráp', tone: 'bg-surface-sky' },
  { href: '/category/do-choi-dieu-khien', label: 'Đồ chơi điều khiển', tone: 'bg-surface-mint' },
  { href: '/category/do-choi-giao-duc', label: 'Đồ chơi giáo dục', tone: 'bg-surface-blush' },
  {
    href: '/category/do-choi-than-thien-moi-truong',
    label: 'Thân thiện môi trường',
    tone: 'bg-accent/30',
  },
  { href: '/category/thu-bong', label: 'Thú bông', tone: 'bg-fog/60' },
];

const HIGHLIGHTS = [
  { title: 'Sản phẩm chính hãng', text: 'Nguồn gốc rõ ràng, kiểm soát tồn kho theo SKU.' },
  { title: 'Giao hàng toàn quốc', text: 'GHN, GHTK, Viettel Post — miễn phí từ 500.000đ.' },
  { title: 'Tích điểm thành viên', text: 'Mỗi 100.000đ = 1 điểm, nhiều đặc quyền theo hạng.' },
];

/** M09-F07: banner và bài viết lỗi không được chặn trang chủ. */
async function loadMarketingContent() {
  const [banners, campaigns, articles] = await Promise.all([
    getBanners({ position: 'HOME_HERO' }).catch((error) => {
      console.warn('[m09:storefront] Không tải được banner:', error?.message ?? error);
      return [];
    }),
    getActiveCampaigns().catch((error) => {
      console.warn('[m09:storefront] Không tải được chiến dịch:', error?.message ?? error);
      return [];
    }),
    listPublicArticles({ query: { limit: 3 } }).catch((error) => {
      console.warn('[m09:storefront] Không tải được bài viết:', error?.message ?? error);
      return { items: [] };
    }),
  ]);

  return { banners, campaigns, articles: articles?.items ?? [] };
}

export default async function HomePage() {
  const { banners, campaigns, articles } = await loadMarketingContent();

  return (
    <>
      <HomeHeroSlider banners={banners} />

      <FlashSaleCountdownBar campaigns={campaigns} />

      <section className="kaido-container py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-h3 text-ink">Danh mục đồ chơi</h2>
            <p className="mt-1 text-body-s text-slate">
              Chọn nhanh nhóm đồ chơi phù hợp với độ tuổi của bé.
            </p>
          </div>
          <Link href="/products" className="text-body-s font-semibold text-primary">
            Xem tất cả
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {DEMO_CATEGORIES.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                className={`flex min-h-[104px] items-end rounded-md border border-fog p-4 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary ${category.tone}`}
              >
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white">
        <FeaturedProductShelf />
      </section>

      {articles.length > 0 ? (
        <section className="kaido-container py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge tone="primary">Cẩm nang KAIDO</Badge>
              <h2 className="mt-3 font-heading text-h3 text-ink">Góc tư vấn cho phụ huynh</h2>
              <p className="mt-1 text-body-s text-slate">
                Kinh nghiệm chọn đồ chơi an toàn và phù hợp từng giai đoạn phát triển.
              </p>
            </div>
            <Link href="/blog" className="text-body-s font-semibold text-primary">
              Xem tất cả bài viết
            </Link>
          </div>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-y border-fog bg-white">
        <div className="kaido-container grid gap-5 py-9 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="rounded-md border border-fog bg-white p-5">
              <span aria-hidden="true" className="block h-2 w-10 rounded-full bg-secondary" />
              <h2 className="mt-3 font-heading text-h6 text-ink">{item.title}</h2>
              <p className="mt-1 text-body-s text-slate">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-sky/60">
        <div className="kaido-container flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-h3 text-ink">Thành viên KAIDO</h2>
            <p className="mt-2 max-w-2xl text-body text-slate">
              Tích điểm mỗi khi mua sắm, theo dõi hạng thành viên và nhận đặc quyền dành riêng cho
              bé yêu.
            </p>
          </div>
          <Link
            href="/account/loyalty"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-6 text-body-s font-semibold text-ink transition-colors duration-250 hover:bg-accent-hover"
          >
            Xem điểm thưởng
          </Link>
        </div>
      </section>
    </>
  );
}
