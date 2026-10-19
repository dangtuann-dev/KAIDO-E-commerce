/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/news', destination: '/blog', permanent: true },
      { source: '/faqs', destination: '/faq', permanent: true },
      { source: '/help', destination: '/faq', permanent: true },
    ];
  },
};

export default nextConfig;
