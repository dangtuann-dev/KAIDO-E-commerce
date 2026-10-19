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

/**
 * [APP] Sitemap khung — TODO(M02-F12, M09-F02): bổ sung URL động cho sản phẩm,
 * danh mục và bài viết khi repository tương ứng hoàn thiện.
 */
export default function sitemap() {
  const siteUrl = getSiteUrl();

  return STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
