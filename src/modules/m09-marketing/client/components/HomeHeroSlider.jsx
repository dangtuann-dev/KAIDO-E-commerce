'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — HomeHeroSlider
 * SRS: M09-F01, M09-F07 | API: API-M09-01 | BR: BR-M09-04
 * Route: /
 * UI: Slider banner vị trí HOME_HERO (tối đa 5 banner), tự xoay 6 giây, có dots và nút điều hướng.
 * Không có banner đang hiệu lực thì hiển thị khối hero thương hiệu KAIDO (giữ nguyên Blueprint §3.1).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import { cn } from '@/shared/utils/cn.js';

const ROTATE_MS = 6000;

const HERO_CTA =
  'inline-flex min-h-[44px] items-center justify-center rounded-sm px-6 text-body-s font-semibold transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function isExternalUrl(url) {
  return /^https?:\/\//i.test(String(url ?? ''));
}

function BannerLink({ href, label, className, children }) {
  if (!href) return <div className={className}>{children}</div>;
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

function CarouselArrow({ direction, onClick }) {
  const isPrevious = direction === 'previous';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrevious ? 'Banner trước' : 'Banner sau'}
      className={cn(
        'hidden h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-card transition-colors duration-250 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex',
        isPrevious ? 'left-4' : 'right-4',
        'absolute top-1/2 z-20 -translate-y-1/2',
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d={isPrevious ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

/** Khung hero thương hiệu — dùng khi M09 chưa có banner HOME_HERO đang hiệu lực. */
function BrandHero() {
  return (
    <section className="bg-surface-mint">
      <div className="kaido-container grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
        <div>
          <Badge tone="warning">KAIDO — Đồ chơi trẻ em</Badge>
          <h2 className="mt-4 font-heading text-h1 leading-tight text-ink md:text-display">
            Đồ chơi an toàn,
            <br />
            <span className="text-primary">niềm vui trọn vẹn</span>
          </h2>
          <p className="mt-4 max-w-xl text-body-l text-slate">
            Khám phá thế giới đồ chơi được tuyển chọn cho từng độ tuổi — từ bộ lắp ráp, đồ chơi giáo
            dục đến những người bạn thú bông đáng yêu.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/products" className={cn(HERO_CTA, 'bg-primary text-white hover:bg-primary-hover')}>
              Khám phá sản phẩm
            </Link>
            <Link
              href="/promotions"
              className={cn(
                HERO_CTA,
                'border border-primary/30 bg-white text-primary hover:border-primary',
              )}
            >
              Xem khuyến mãi
            </Link>
          </div>
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
  );
}

export default function HomeHeroSlider({ banners = [] }) {
  const slides = useMemo(
    () => (Array.isArray(banners) ? banners.filter((banner) => banner?.image_url) : []),
    [banners],
  );
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = slides.length;
  const index = total > 0 ? Math.min(active, total - 1) : 0;

  const goTo = useCallback(
    (next) => {
      if (total === 0) return;
      setActive(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total < 2 || paused) return undefined;
    const timer = setInterval(() => setActive((current) => (current + 1) % total), ROTATE_MS);
    return () => clearInterval(timer);
  }, [total, paused]);

  if (total === 0) return <BrandHero />;

  return (
    <section aria-label="Banner khuyến mãi" aria-roledescription="carousel" className="kaido-container py-5">
      <div
        className="relative overflow-hidden rounded-lg bg-surface-sky"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/8]">
          {slides.map((banner, slideIndex) => {
            const isActive = slideIndex === index;
            return (
              <BannerLink
                key={banner.id ?? `${banner.image_url}-${slideIndex}`}
                href={banner.target_url}
                label={banner.title || `Banner ${slideIndex + 1}`}
                className={cn(
                  'absolute inset-0 block transition-opacity duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                  isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                <Image
                  src={banner.image_url}
                  alt={banner.title || 'Banner KAIDO'}
                  fill
                  priority={slideIndex === 0}
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-cover"
                />
                {banner.title ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent p-5 md:p-8">
                    <p className="max-w-2xl font-heading text-h4 text-white md:text-h2">
                      {banner.title}
                    </p>
                    {banner.target_url ? (
                      <span
                        className={cn(HERO_CTA, 'mt-3 bg-accent text-ink hover:bg-accent-hover')}
                      >
                        Khám phá ngay
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </BannerLink>
            );
          })}
        </div>

        {total > 1 ? (
          <>
            <CarouselArrow direction="previous" onClick={() => goTo(index - 1)} />
            <CarouselArrow direction="next" onClick={() => goTo(index + 1)} />

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2">
              {slides.map((banner, slideIndex) => (
                <button
                  key={`dot-${banner.id ?? slideIndex}`}
                  type="button"
                  onClick={() => goTo(slideIndex)}
                  aria-label={`Xem banner ${slideIndex + 1}`}
                  aria-current={slideIndex === index ? 'true' : undefined}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    slideIndex === index ? 'w-8 bg-primary' : 'w-2.5 bg-white/80 hover:bg-white',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
