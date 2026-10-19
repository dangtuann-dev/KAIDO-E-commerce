const FALLBACK_SITE_URL = 'http://localhost:3000';

function getSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export default function robots() {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/admin/', '/checkout', '/order-success/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
