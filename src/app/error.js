'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/shared/ui/button.jsx';

/**
 * [APP] Error boundary toàn ứng dụng — hiển thị lỗi runtime và cho phép thử lại.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[app:error]', error);
  }, [error]);

  return (
    <div className="kaido-container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-heading text-h2 text-secondary">Đã có lỗi xảy ra</p>
      <p className="mt-3 max-w-md text-body text-slate">
        Hệ thống không thể hoàn tất yêu cầu. Vui lòng thử lại hoặc quay về trang chủ.
      </p>
      {error?.digest ? <p className="mt-2 text-caption text-mist">Mã lỗi: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()}>Thử lại</Button>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
