export { default } from '@/modules/m09-marketing/client/pages/BlogListPage.jsx';

export const metadata = {
  title: 'Blog',
  description: 'Kinh nghiệm chọn đồ chơi, gợi ý quà tặng và hoạt động cùng bé từ KAIDO.',
};

// Bài viết do M09 xuất bản theo lịch nên danh sách đọc DB mỗi request (M09-F02, F05).
export const dynamic = 'force-dynamic';
