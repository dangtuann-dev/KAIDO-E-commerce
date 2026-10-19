/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — BlogListPage
 * SRS: M09 | API/FR: M09-F02, M09-F07, API-M09-06
 * Route: /blog
 * Render: Server Component (SEO) — TODO(M09-F02).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng danh sách bài viết có phân trang và lọc theo loại nội dung.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F02): dựng danh sách bài viết và nối API-M09-06.
export default function BlogListPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M09"
        moduleName="Nội dung và chiến dịch quảng bá"
        componentName="BlogListPage"
        route="/blog"
        srsRefs={['M09-F02', 'M09-F07', 'API-M09-06']}
        todos={[
          'Dựng danh sách bài viết có phân trang và lọc theo loại nội dung.',
          'Nối API-M09-06; slug chuẩn SEO và lazy-load ảnh.',
          'Bổ sung API quản trị danh sách bài viết — SRS chưa liệt kê (OPEN_DECISIONS).',
        ]}
        description="Trang tin tức/cẩm nang đồ chơi. Nội dung do M09 quản lý, hiển thị công khai theo trạng thái."
      />
    </div>
  );
}
