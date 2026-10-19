import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import AccountSidebar from '@/shared/layouts/account-sidebar.jsx';
import SiteFooter from '@/shared/layouts/site-footer.jsx';
import SiteHeader from '@/shared/layouts/site-header.jsx';

/**
 * [APP] Account layout — storefront chrome + sidebar + bảo vệ phía client.
 */
export default function AccountLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <ProtectedRoute>
          <div className="kaido-container py-8 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[264px_minmax(0,1fr)]">
              <AccountSidebar />
              <div className="min-w-0">{children}</div>
            </div>
          </div>
        </ProtectedRoute>
      </main>
      <SiteFooter />
    </div>
  );
}
