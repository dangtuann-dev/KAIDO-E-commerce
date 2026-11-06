export { default } from '@/modules/m10-support/client/pages/FaqPage.jsx';

export const metadata = {
  title: 'Câu hỏi thường gặp',
  description:
    'Giải đáp nhanh về đơn hàng, giao nhận, đổi trả, thanh toán và bảo hành đồ chơi tại KAIDO.',
};

// FAQ do CSKH biên tập trong /admin/support nên phải đọc DB mỗi request (M10-F09, F10).
export const dynamic = 'force-dynamic';
