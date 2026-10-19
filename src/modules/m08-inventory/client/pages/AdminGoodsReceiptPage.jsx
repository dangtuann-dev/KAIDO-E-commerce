/**
 * [TOY-M08] Kho và tồn kho — AdminGoodsReceiptPage
 * SRS: M08 | API/FR: M08-F02, M08-F12, API-M08-05, BR-M08-04
 * Route: /admin/inventory/receipts/new
 * Render: Client Component (tương tác) — TODO(M08-F02).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng GoodsReceiptModal: chọn NCC, kho, quét barcode/nhập SKU, số lượng, giá nhập VAT.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F02): dựng form nhập kho và nối API-M08-05.
export default function AdminGoodsReceiptPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M08"
        moduleName="Kho và tồn kho"
        componentName="AdminGoodsReceiptPage"
        route="/admin/inventory/receipts/new"
        srsRefs={['M08-F02', 'M08-F12', 'API-M08-05', 'BR-M08-04']}
        todos={[
          'Dựng GoodsReceiptModal: chọn NCC, kho, quét barcode/nhập SKU, số lượng, giá nhập VAT.',
          'Tính giá vốn bình quân gia quyền (BR-M08-04).',
          'Nối API-M08-05; phiếu COMPLETED là bất biến (BR-M08-05).',
        ]}
        description="Lập phiếu nhập kho từ nhà cung cấp. Danh mục NCC và API quản trị chưa có trong SRS (TODO)."
      />
    </div>
  );
}
