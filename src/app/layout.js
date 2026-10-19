import { Baloo_2, Nunito } from 'next/font/google';
import Providers from '@/app/providers.js';
import '@/styles/tokens.css';
import '@/app/globals.css';

/**
 * [APP] Root layout — ngôn ngữ tiếng Việt, font Blueprint §1.3.
 * Baloo 2 giữ phong cách bo tròn của Fredoka và có đầy đủ subset Vietnamese,
 * tránh việc dấu tiếng Việt phải fallback sang font khác.
 */
const baloo = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-baloo',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  display: 'swap',
});

const FALLBACK_SITE_URL = 'http://localhost:3000';

function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return FALLBACK_SITE_URL;
  try {
    return new URL(configured).toString();
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const siteUrl = getSiteUrl();
const siteDescription =
  'KAIDO E-commerce — nền tảng website bán đồ chơi trẻ em tại Việt Nam: sản phẩm chính hãng, giao vận toàn quốc, tích điểm thành viên.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KAIDO — Đồ chơi trẻ em',
    template: '%s | KAIDO',
  },
  description: siteDescription,
  applicationName: 'KAIDO E-commerce',
  keywords: ['đồ chơi trẻ em', 'KAIDO', 'đồ chơi giáo dục', 'đồ chơi an toàn'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'KAIDO',
    title: 'KAIDO — Đồ chơi trẻ em',
    description: siteDescription,
    url: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1385B5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="min-h-screen bg-white font-body text-ink antialiased">
        <a href="#main-content" className="kaido-skip-link">
          Bỏ qua điều hướng, đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
