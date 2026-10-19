'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — ArticleCard
 * SRS: M09-F02, M09-F07 | API: API-M09-06
 * Route: /blog, /blog/[slug], /
 * UI: Card bài viết: ảnh, tiêu đề, mô tả ngắn, ngày đăng và chuyên mục.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F02): Nối useListArticles; tối ưu LCP bằng next/image và kích thước ảnh hợp lý.
export default function ArticleCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M09"
      moduleName="Nội dung và chiến dịch quảng bá"
      componentName="ArticleCard"
      route="/blog"
      srsRefs={['M09-F02', 'M09-F07', 'API-M09-06']}
      todos={[
        'Nối useListArticles; tối ưu LCP bằng next/image và kích thước ảnh hợp lý.',
        'Nối API-M09-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Card bài viết: ảnh, tiêu đề, mô tả ngắn, ngày đăng và chuyên mục."
      headingLevel="h2"
    />
  );
}
