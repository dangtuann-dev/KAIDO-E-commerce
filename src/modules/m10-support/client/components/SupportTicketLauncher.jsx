'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — SupportTicketLauncher
 * SRS: M10-F06 | API: API-M10-03
 * Route: /contact, /faq
 * UI: Nút mở form gửi yêu cầu hỗ trợ; khách chưa đăng nhập được đưa về trang chủ
 * để đăng nhập rồi quay lại trung tâm hỗ trợ (M10-F06 yêu cầu phiên đăng nhập).
 */
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/shared/ui/button.jsx';
import { selectAuthStatus, useAuthStore } from '@/shared/auth/auth-store.js';
import TicketCreateModal from './TicketCreateModal.jsx';

const PRIMARY_LINK_CLASS =
  'inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

/**
 * @param {{
 *   label?: string,
 *   nextPath?: string,
 *   onCreated?: (result: object) => void,
 * }} props
 */
export default function SupportTicketLauncher({
  label = 'Gửi yêu cầu hỗ trợ',
  nextPath = '/account/support',
  onCreated,
}) {
  const status = useAuthStore(selectAuthStatus);
  const [open, setOpen] = useState(false);

  if (status === 'loading') {
    return (
      <Button loading loadingLabel="Đang kiểm tra phiên đăng nhập…">
        {label}
      </Button>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Link href={`/?auth=login&next=${encodeURIComponent(nextPath)}`} className={PRIMARY_LINK_CLASS}>
        {label}
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <TicketCreateModal open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
    </>
  );
}
