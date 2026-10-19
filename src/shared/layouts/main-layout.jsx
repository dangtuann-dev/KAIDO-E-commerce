import SiteFooter from '@/shared/layouts/site-footer.jsx';
import SiteHeader from '@/shared/layouts/site-header.jsx';

/**
 * [SHARED] MainLayout — layout storefront (Blueprint §3.9).
 */
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
