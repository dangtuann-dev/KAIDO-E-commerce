/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — HomePage (storefront)
 * SRS: M09 | FR: M09-F07 | API: API-M09-01, API-M09-02
 * Đồng thời đặt khung cho khu sản phẩm nổi bật của M02 (M02-F10) và lối vào M07.
 * Route: /
 * Render: Server Component (SEO/FCP) — banner và shelf sẽ nối dữ liệu ở Giai đoạn 7.
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 */
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import ModuleStub from '@/shared/ui/module-stub.jsx';

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

export default function HomePage() {
  return (
    <>
      <section className="bg-surface-mint">
        <div className="kaido-container grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
          <div>
            <Badge tone="warning">KAIDO — Đồ chơi trẻ em</Badge>
            <h1 className="mt-4 font-heading text-h1 leading-tight text-ink md:text-display">
              Đồ chơi an toàn,
              <br />
              <span className="text-primary">niềm vui trọn vẹn</span>
            </h1>
            <p className="mt-4 max-w-xl text-body-l text-slate">
              Khám phá thế giới đồ chơi được tuyển chọn cho từng độ tuổi — từ bộ lắp ráp, đồ chơi
              giáo dục đến những người bạn thú bông đáng yêu.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-6 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
              >
                Khám phá sản phẩm
              </Link>
              <Link
                href="/promotions"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-primary/30 bg-white px-6 text-body-s font-semibold text-primary transition-colors duration-250 hover:border-primary"
              >
                Xem khuyến mãi
              </Link>
            </div>
            <p className="mt-5 text-caption text-slate">
              Giao diện khung — nội dung banner và sản phẩm sẽ được nối từ API M09/M02.
            </p>
          </div>

          <div aria-hidden="true" className="relative hidden md:block">
            <div className="mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-full bg-white/70">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 w-24 rotate-[-6deg] rounded-lg bg-primary shadow-card" />
                <div className="mt-6 h-20 w-20 rotate-6 rounded-md bg-accent shadow-card" />
                <div className="h-20 w-20 rotate-3 rounded-md bg-secondary shadow-card" />
                <div className="-mt-4 h-24 w-24 rotate-[-4deg] rounded-lg bg-surface-sky shadow-card" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kaido-container py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-h3 text-ink">Danh mục đồ chơi</h2>
            <p className="mt-1 text-body-s text-slate">
              Danh mục demo từ Blueprint §3.1 — chưa chốt.
            </p>
          </div>
          <Link href="/products" className="kaido-link text-body-s font-semibold">
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

      <section className="kaido-container pb-4">
        <ModuleStub
          headingLevel="h2"
          moduleCode="TOY-M09"
          moduleName="Nội dung và chiến dịch quảng bá"
          componentName="BannerCarousel"
          route="/"
          srsRefs={['M09-F01', 'M09-F07', 'API-M09-01', 'BR-M09-04']}
          todos={[
            'Nối API-M09-01 với vị trí HOME_HERO và giới hạn 5 banner (BR-M09-04).',
            'Dựng slider responsive với Swiper.js, lazy-load ảnh (M09-F07).',
            'Bổ sung CTA, alt text và liên kết chiến dịch.',
          ]}
          description="Khu banner chính trang chủ. Dữ liệu và thành phần tương tác sẽ do M09 cung cấp qua public.client.js."
        />
      </section>

      <section className="kaido-container py-8">
        <ModuleStub
          headingLevel="h2"
          moduleCode="TOY-M02"
          moduleName="Sản phẩm và danh mục"
          componentName="FeaturedProductShelf"
          route="/"
          srsRefs={['M02-F10', 'M02-F11', 'M03-F01', 'API-M02-02']}
          todos={[
            'Dựng ProductCard tái sử dụng (ảnh, giá, nhãn hết hàng).',
            'Nối dữ liệu sản phẩm nổi bật qua API-M02-02/M03-01.',
            'Xử lý skeleton và trạng thái lỗi bằng TanStack Query.',
          ]}
          description="Khu sản phẩm nổi bật sẽ lấy dữ liệu từ M02/M03; chưa có nghiệp vụ trong bản nền tảng."
        />
      </section>

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
