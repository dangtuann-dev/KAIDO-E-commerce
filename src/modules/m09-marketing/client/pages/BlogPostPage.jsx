/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — BlogPostPage
 * SRS: M09 | API/FR: M09-F02, API-M09-06, NFR-M09-01
 * Route: /blog/[slug]
 * Render: Server Component (SEO) — TODO(M09-F02).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Render nội dung WYSIWYG an toàn, slug SEO và OpenGraph tag.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F02): dựng trang bài viết, sanitize nội dung và nối API-M09-06.
export default function BlogPostPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M09"
        moduleName="Nội dung và chiến dịch quảng bá"
        componentName="BlogPostPage"
        route="/blog/[slug]"
        srsRefs={['M09-F02', 'API-M09-06', 'NFR-M09-01']}
        todos={[
          'Render nội dung WYSIWYG an toàn, slug SEO và OpenGraph tag.',
          'Nối API-M09-06 theo slug; trả 404 khi bài viết không tồn tại.',
          'Tối ưu LCP/PageSpeed bằng lazy-load ảnh (M09-F07).',
        ]}
        description="Trang chi tiết bài viết với nội dung rich text, SEO và OpenGraph. Dữ liệu từ M09."
      />
    </div>
  );
}
