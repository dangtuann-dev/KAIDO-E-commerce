/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — PromotionsPage
 * SRS: M09-F03, M09-F04, M09-F05, M09-F07 | API: API-M09-02, API-M09-08
 * Route: /promotions
 * Render: Server Component (SEO) — chiến dịch đang chạy, SKU flash sale và voucher công khai.
 */
import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';
import FlashSaleCountdownBar from '../components/FlashSaleCountdownBar.jsx';
import PromoCodeBadgeList from '../components/PromoCodeBadgeList.jsx';
import { CAMPAIGN_TYPE_LABELS, formatDateTime } from '../display.js';
import { getActiveCampaigns, getBanners, getPublicCoupons } from '../../server/service.js';

export const metadata = {
  title: 'Khuyến mãi & chiến dịch',
  description:
    'Tổng hợp flash sale, quà tặng theo mùa và mã giảm giá đang áp dụng tại KAIDO — đồ chơi trẻ em chính hãng.',
  alternates: { canonical: '/promotions' },
};

async function loadPromotions() {
  const [campaigns, coupons, banners] = await Promise.all([
    getActiveCampaigns().catch((error) => {
      console.warn('[m09:promotions] Không tải được chiến dịch:', error?.message ?? error);
      return [];
    }),
    getPublicCoupons({ query: { limit: 12 } }).catch((error) => {
      console.warn('[m09:promotions] Không tải được voucher:', error?.message ?? error);
      return [];
    }),
    getBanners({ position: 'HOME_PROMO' }).catch((error) => {
      console.warn('[m09:promotions] Không tải được banner:', error?.message ?? error);
      return [];
    }),
  ]);

  return { campaigns, coupons, banners };
}

function CampaignCard({ campaign }) {
  const items = campaign.items ?? [];
  const typeLabel = CAMPAIGN_TYPE_LABELS[campaign.campaign_type] ?? campaign.campaign_type;

  return (
    <section className="overflow-hidden rounded-lg border border-fog bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-fog px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sale">{typeLabel}</Badge>
            <Badge tone="success">Đang diễn ra</Badge>
          </div>
          <h2 className="mt-2 font-heading text-h4 text-ink">{campaign.name}</h2>
          {campaign.description ? (
            <p className="mt-1 max-w-2xl text-body-s text-slate">{campaign.description}</p>
          ) : null}
        </div>
        <p className="text-body-s text-slate">
          {formatDateTime(campaign.starts_at)}
          <span aria-hidden="true" className="mx-1.5 text-mist">
            →
          </span>
          {formatDateTime(campaign.ends_at)}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-6 text-body-s text-slate">
          Danh sách sản phẩm của chiến dịch đang được cập nhật.
        </p>
      ) : (
        <ul className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const hasSale =
              Number(product.price_regular) > 0 && item.sale_price < Number(product.price_regular);
            const soldOut =
              item.quantity_limit != null && Number(item.sold_count) >= Number(item.quantity_limit);

            return (
              <li key={item.id} className="rounded-md border border-fog p-3">
                <p className="line-clamp-2 font-heading text-h6 text-ink">{product.name}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-price text-sale">{formatVND(item.sale_price)}</span>
                  {hasSale ? (
                    <s className="text-price-old text-mist">{formatVND(product.price_regular)}</s>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-slate">
                  {item.quantity_limit != null ? (
                    <span>
                      Đã bán {Number(item.sold_count)}/{Number(item.quantity_limit)}
                    </span>
                  ) : (
                    <span>Không giới hạn số lượng</span>
                  )}
                  {soldOut ? <Badge tone="neutral">Hết ưu đãi</Badge> : null}
                </div>
                {product.slug ? (
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-3 inline-flex min-h-[44px] items-center text-body-s font-semibold text-primary"
                  >
                    Xem sản phẩm
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function PromotionsPage() {
  const { campaigns, coupons, banners } = await loadPromotions();

  return (
    <>
      <FlashSaleCountdownBar campaigns={campaigns} />

      <div className="kaido-container py-8 md:py-10">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Khuyến mãi' }]} />

        <header className="mt-4 max-w-3xl">
          <Badge tone="warning">Ưu đãi KAIDO</Badge>
          <h1 className="mt-3 font-heading text-h1 text-ink">Khuyến mãi đang diễn ra</h1>
          <p className="mt-2 text-body-l text-slate">
            Săn flash sale theo khung giờ và lưu ngay mã giảm giá còn hiệu lực để dùng khi thanh
            toán.
          </p>
        </header>

        {banners.length > 0 ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {banners.map((banner) => (
              <li
                key={banner.id}
                className="relative aspect-[16/7] overflow-hidden rounded-md bg-surface-sky"
              >
                <Image
                  src={banner.image_url}
                  alt={banner.title || 'Banner khuyến mãi KAIDO'}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                {banner.title ? (
                  <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 font-heading text-h5 text-white">
                    {banner.title}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col gap-6">
          {campaigns.length === 0 ? (
            <EmptyState
              title="Chưa có chiến dịch nào đang chạy"
              description="Các chương trình flash sale và quà tặng theo mùa sẽ xuất hiện tại đây."
              action={
                <Link
                  href="/products"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-6 text-body-s font-semibold text-white"
                >
                  Xem sản phẩm
                </Link>
              }
            />
          ) : (
            campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
          )}
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-h3 text-ink">Mã giảm giá</h2>
              <p className="mt-1 text-body-s text-slate">
                Sao chép mã và nhập ở bước thanh toán để được giảm giá.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <PromoCodeBadgeList coupons={coupons} />
          </div>
        </section>

        <p className="mt-8 text-caption text-slate">
          Mỗi khách hàng được dùng tối đa 1 lượt cho mỗi mã. Ưu đãi không áp dụng đồng thời với
          chương trình khác nếu không có thông báo riêng.
        </p>
      </div>
    </>
  );
}
