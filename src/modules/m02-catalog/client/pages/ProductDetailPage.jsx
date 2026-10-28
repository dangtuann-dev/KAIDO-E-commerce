/**
 * [TOY-M02] Sản phẩm và danh mục — ProductDetailPage
 * SRS: M02-F11, M02-F09, M02-F12 | API: API-M02-03 | BR: BR-M02-03, BR-M02-05
 * Route: /products/[slug]
 * Render: Server Component (SEO) + gallery/variant tương tác phía client.
 * JSON-LD Product + BreadcrumbList (NFR-M02-01).
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import Badge from '@/shared/ui/badge.jsx';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { AGE_GROUP_LABELS, GENDER_TARGET_LABELS } from '@/shared/constants/product.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import ProductGallery from '../components/ProductGallery.jsx';
import VariantSelector from '../components/VariantSelector.jsx';
import ProductStockBadge from '../components/ProductStockBadge.jsx';
import AgeBadge from '../components/AgeBadge.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { getProductDetail } from '../../server/service.js';

const loadProduct = cache(async (slug) => getProductDetail({ idOrSlug: slug }));

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

function availabilityOf(stock) {
  if (stock?.status === 'OUT_OF_STOCK') return 'https://schema.org/OutOfStock';
  if (stock?.status === 'IN_STOCK' || stock?.status === 'LOW_STOCK') {
    return 'https://schema.org/InStock';
  }
  return undefined;
}

function formatSold(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0
    ? `${new Intl.NumberFormat('vi-VN').format(count)} đã bán`
    : null;
}

function inlineMarkdown(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-inline-${index}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function descriptionBlocks(text) {
  const blocks = [];
  let list = null;
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: 'ul', items: list });
      list = null;
    }
  };

  for (const raw of (text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const listItem = line.match(/^[-*]\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      list ??= [];
      list.push(listItem[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return blocks;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const { product_details: product, images } = await loadProduct(slug);
    if (!product) return { title: 'Không tìm thấy sản phẩm' };

    const title = product.meta_title || product.name;
    const description =
      product.meta_description ||
      product.short_description ||
      `Mua ${product.name} chính hãng tại KAIDO — giao hàng toàn quốc, đổi trả trong ${
        BUSINESS_RULES.SHIPPING.RETURN_WINDOW_DAYS
      } ngày.`;
    const image = images?.[0]?.url;

    return {
      title,
      description,
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        type: 'website',
        title,
        description,
        url: `/products/${product.slug}`,
        images: image ? [{ url: image, alt: product.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: 'Không tìm thấy sản phẩm', robots: { index: false, follow: false } };
  }
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  let data;
  try {
    data = await loadProduct(slug);
  } catch (error) {
    if (error?.code === 'NOT_FOUND' || error?.status === 404) notFound();
    throw error;
  }

  const { product_details: product, images, variants, related_products: related } = data;
  if (!product) notFound();

  const hasSale = product.price_sale != null && Number(product.price_sale) < Number(product.price_regular);
  const soldLabel = formatSold(product.sold_count);
  const ratingCount = Number(product.rating_count);
  const ratingAvg = Number(product.rating_avg);
  const primaryCategory = product.primary_category;
  const categoryPath = product.category_path ?? [];

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    ...categoryPath.map((node, index) => ({
      label: node.name,
      href: index === categoryPath.length - 1 ? undefined : `/category/${node.slug}`,
    })),
    { label: product.name },
  ];

  const base = siteUrl();
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.meta_description || product.short_description || undefined,
    sku: variants.find((variant) => variant.is_default)?.sku ?? variants[0]?.sku,
    image: images.map((image) => image.url),
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: primaryCategory?.name,
    offers: {
      '@type': 'Offer',
      url: `${base}/products/${product.slug}`,
      priceCurrency: 'VND',
      price: Number(product.price),
      itemCondition: 'https://schema.org/NewCondition',
      availability: availabilityOf(product.stock),
      seller: { '@type': 'Organization', name: 'KAIDO' },
    },
    aggregateRating:
      ratingCount > 0
        ? { '@type': 'AggregateRating', ratingValue: ratingAvg, reviewCount: ratingCount }
        : undefined,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${base}${item.href}` : undefined,
    })),
  };

  const descriptionSections = descriptionBlocks(product.description);

  const specRows = [
    ['Chất liệu', product.material],
    ['Xuất xứ', product.origin_country],
    ['Độ tuổi', AGE_GROUP_LABELS[product.age_group] ?? product.age_group],
    ['Giới tính', GENDER_TARGET_LABELS[product.gender_target] ?? product.gender_target],
    ['Thương hiệu', product.brand?.name],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="kaido-container py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <ProductGallery images={images} productName={product.name} />

        <section aria-labelledby="product-title">
          {product.brand || primaryCategory ? (
            <p className="flex flex-wrap items-center gap-2 text-caption font-semibold uppercase tracking-wide text-slate">
              {product.brand ? (
                <Link
                  href={`/products?brand_slug=${product.brand.slug}`}
                  className="hover:text-primary"
                >
                  {product.brand.name}
                </Link>
              ) : null}
              {product.brand && primaryCategory ? <span aria-hidden="true">·</span> : null}
              {primaryCategory ? (
                <Link href={`/category/${primaryCategory.slug}`} className="hover:text-primary">
                  {primaryCategory.name}
                </Link>
              ) : null}
            </p>
          ) : null}

          <h1 id="product-title" className="mt-2 font-heading text-h2 text-ink">
            {product.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-body-s text-slate">
            {ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-ink">
                <span aria-hidden="true" className="text-star">
                  ★
                </span>
                <span className="font-semibold">{ratingAvg.toFixed(1)}</span>
                <span>({ratingCount} đánh giá)</span>
              </span>
            ) : (
              <span>Chưa có đánh giá</span>
            )}
            {soldLabel ? <span>{soldLabel}</span> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-surface-sky/50 px-4 py-3">
            <span className={hasSale ? 'text-h3 font-bold text-sale' : 'text-h3 font-bold text-ink'}>
              {formatVND(product.price)}
            </span>
            {hasSale ? (
              <>
                <s className="text-body-s text-mist">{formatVND(product.price_regular)}</s>
                <Badge tone="sale">-{product.discount_percent}%</Badge>
              </>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AgeBadge ageGroup={product.age_group} />
            <ProductStockBadge stock={product.stock} showQuantity />
            {product.is_featured ? <Badge tone="info">Nổi bật</Badge> : null}
          </div>

          {product.short_description ? (
            <p className="mt-4 text-body text-slate">{product.short_description}</p>
          ) : null}

          <div className="mt-5">
            <VariantSelector variants={variants} productName={product.name} />
          </div>

          <ul className="mt-5 grid gap-2 text-body-s text-slate sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-success">
                ✓
              </span>
              Miễn phí vận chuyển cho đơn từ{' '}
              {formatVND(BUSINESS_RULES.SHIPPING.FREE_SHIPPING_THRESHOLD_VND)}
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-success">
                ✓
              </span>
              Đổi trả trong {BUSINESS_RULES.SHIPPING.RETURN_WINDOW_DAYS} ngày nếu lỗi nhà sản xuất
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-success">
                ✓
              </span>
              Kiểm tra hàng khi nhận, hỗ trợ đổi mới
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-success">
                ✓
              </span>
              Tư vấn chọn đồ chơi theo độ tuổi
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="product-description-heading">
          <h2 id="product-description-heading" className="font-heading text-h3 text-ink">
            Mô tả sản phẩm
          </h2>
          {descriptionSections.length > 0 ? (
            <div className="mt-3 space-y-3 text-body text-ink/90">
              {descriptionSections.map((section, index) => {
                if (section.type === 'ul') {
                  return (
                    <ul key={`desc-${index}`} className="list-disc space-y-1 pl-5">
                      {section.items.map((item, itemIndex) => (
                        <li key={`desc-${index}-${itemIndex}`}>
                          {inlineMarkdown(item, `desc-${index}-${itemIndex}`)}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={`desc-${index}`} className="whitespace-pre-line">
                    {inlineMarkdown(section.text, `desc-${index}`)}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-body-s text-slate">
              Thông tin mô tả chi tiết đang được cập nhật.
            </p>
          )}

          {product.safety_info ? (
            <div className="mt-6 rounded-md border border-accent/60 bg-accent/10 p-4">
              <h3 className="font-heading text-h6 text-ink">Lưu ý an toàn</h3>
              <p className="mt-1 whitespace-pre-line text-body-s text-ink/80">{product.safety_info}</p>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="product-specs-heading">
          <h2 id="product-specs-heading" className="font-heading text-h3 text-ink">
            Thông số
          </h2>
          {specRows.length > 0 ? (
            <dl className="mt-3 overflow-hidden rounded-md border border-fog">
              {specRows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[120px_1fr] gap-3 border-b border-fog px-4 py-3 text-body-s last:border-b-0"
                >
                  <dt className="font-semibold text-slate">{label}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-body-s text-slate">Chưa có thông số kỹ thuật.</p>
          )}
        </section>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="related-heading" className="font-heading text-h3 text-ink">
              Sản phẩm cùng danh mục
            </h2>
            {primaryCategory ? (
              <Link
                href={`/category/${primaryCategory.slug}`}
                className="text-body-s font-semibold text-primary"
              >
                Xem danh mục {primaryCategory.name}
              </Link>
            ) : null}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.slice(0, 8).map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
