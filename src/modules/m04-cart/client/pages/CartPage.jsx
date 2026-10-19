/**
 * [TOY-M04] Giỏ hàng — CartPage
 * SRS: M04 | API/FR: M04-F02, M04-F03, M04-F04, M04-F07, API-M04-01, API-M04-03
 * Route: /cart
 * Render: Client Component (tương tác) — TODO(M04-F02).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng giỏ hàng: chọn dòng, cập nhật số lượng, xóa kèm Undo 5 giây.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M04-F02): dựng bảng giỏ hàng, Undo xóa 5 giây và nối API-M04-01.
export default function CartPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M04"
        moduleName="Giỏ hàng"
        componentName="CartPage"
        route="/cart"
        srsRefs={['M04-F02', 'M04-F03', 'M04-F04', 'M04-F07', 'API-M04-01', 'API-M04-03']}
        todos={[
          'Dựng bảng giỏ hàng: chọn dòng, cập nhật số lượng, xóa kèm Undo 5 giây.',
          'Nối API-M04-01/03/04/07; giữ X-Guest-Session-Id do http client tự gắn.',
          'Kiểm tra giới hạn 20 đơn vị/SKU và cảnh báo biến động giá/tồn (BR-M04-05).',
        ]}
        description="Giỏ hàng dùng chung cho khách vãng lai và thành viên; hỗ trợ chọn sản phẩm và áp voucher sơ bộ."
      />
    </div>
  );
}
