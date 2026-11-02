export { default } from '@/modules/m09-marketing/client/pages/BlogPostPage.jsx';

export const metadata = {
  title: 'Bài viết',
};

// Nội dung + SEO lấy theo slug mỗi request để bản mới xuất bản hiển thị ngay (M09-F02).
export const dynamic = 'force-dynamic';
