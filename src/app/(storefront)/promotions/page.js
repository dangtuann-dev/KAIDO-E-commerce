export { default } from '@/modules/m09-marketing/client/pages/PromotionsPage.jsx';

export const metadata = {
  title: 'Khuyến mãi',
  description:
    'Chiến dịch flash sale, mã giảm giá và ưu đãi theo mùa đang diễn ra tại KAIDO.',
};

// Chiến dịch/voucher đổi theo khung giờ nên đọc DB mỗi request (M09-F03, M09-F05).
export const dynamic = 'force-dynamic';
