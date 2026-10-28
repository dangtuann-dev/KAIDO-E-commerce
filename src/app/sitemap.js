import { getCategoryTree, listProducts } from '@/modules/m02-catalog/server/service.js';

const FALLBACK_SITE_URL = 'http://localhost:3000';

function getSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/products', changeFrequency: 'daily', priority: 0.9 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/promotions', changeFrequency: 'daily', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
];

const PRODUCT_PAGE_SIZE = 100;

function flattenCategories(nodes, result = []) {
  for (const node of nodes ?? []) {
    result.push(node);
    flattenCategories(node.children, result);
  }
  return result;
}

async function loadCategoryEntries() {
  try {
    const tree = await getCategoryTree();
    return flattenCategories(tree).map((category) => ({
      url: `/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (error) {
    console.warn('[sitemap] Không tải được danh mục:', error?.message ?? error);
    return [];
  }
}

async function loadProductEntries() {
  const entries = [];

  try {
    let page = 1;
    let totalPages = 1;

    do {
      const result = await listProducts({ query: { page, limit: PRODUCT_PAGE_SIZE } });
      totalPages = result.total_pages;

      for (const product of result.items) {
        entries.push({
          url: `/products/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }

      page += 1;
    } while (page <= totalPages && page <= 50);
  } catch (error) {
    console.warn('[sitemap] Không tải được sản phẩm:', error?.message ?? error);
  }

  return entries;
}

/**
 * [APP] Sitemap khung + URL động cho sản phẩm và danh mục (M02-F10, M09-F02).
 * Lỗi truy vấn được hạ cấp thành sitemap tĩnh để build/deploy không gãy.
 */
export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [categories, products] = await Promise.all([loadCategoryEntries(), loadProductEntries()]);

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [
    ...staticEntries,
    ...categories.map((entry) => ({ ...entry, url: `${siteUrl}${entry.url}` })),
    ...products.map((entry) => ({ ...entry, url: `${siteUrl}${entry.url}` })),
  ];
}
