'use client';

/**
 * [TOY-M08] Kho và tồn kho — GoodsReceiptModal
 * SRS: M08-F02, M08-F12 | API: API-M08-05 | BR: BR-M08-04, BR-M08-05
 * Route: /admin/inventory/receipts/new
 * UI: Modal nhập kho: NCC, kho, SKU, số lượng, giá nhập; hiển thị giá vốn bình quân.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F02): Bổ sung API nhà cung cấp còn thiếu (M08-F12), dựng RHF và nối useCreateGoodsReceipt.
export default function GoodsReceiptModal() {
  return (
    <ModuleStub
      moduleCode="TOY-M08"
      moduleName="Kho và tồn kho"
      componentName="GoodsReceiptModal"
      route="/admin/inventory/receipts/new"
      srsRefs={['M08-F02', 'M08-F12', 'API-M08-05', 'BR-M08-04', 'BR-M08-05']}
      todos={[
        'Bổ sung API nhà cung cấp còn thiếu (M08-F12), dựng RHF và nối useCreateGoodsReceipt.',
        'Nối API-M08-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Modal nhập kho: NCC, kho, SKU, số lượng, giá nhập; hiển thị giá vốn bình quân."
      headingLevel="h2"
    />
  );
}
