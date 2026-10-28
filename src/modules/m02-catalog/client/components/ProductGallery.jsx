'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — ProductGallery
 * SRS: M02-F07, M02-F11 | API: API-M02-03
 * Route: /products/[slug]
 * UI: Ảnh chính vuông + thumbnail, tối đa 10 ảnh, alt text và zoom nhẹ trên desktop.
 */
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/utils/cn.js';

export default function ProductGallery({ images = [], productName = 'Sản phẩm' }) {
  const gallery = Array.isArray(images) ? images : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = Math.min(selectedIndex, Math.max(0, gallery.length - 1));

  if (gallery.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-md border border-fog bg-surface-sky/40 text-body-s text-mist">
        Chưa có ảnh sản phẩm
      </div>
    );
  }

  const active = gallery[Math.min(activeIndex, gallery.length - 1)] ?? gallery[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-md border border-fog bg-white">
        <Image
          src={active.url}
          alt={active.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain transition-transform duration-500 md:group-hover:scale-105"
        />
      </div>

      {gallery.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Ảnh sản phẩm">
          {gallery.slice(0, 10).map((image, index) => (
            <li key={image.id ?? image.url}>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-sm border bg-white transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  index === activeIndex
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-fog hover:border-primary/60',
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt_text || `${productName} — ảnh ${index + 1}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
