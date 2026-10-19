'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — PointRedemptionSlider
 * SRS: M07-F04 | API: API-M07-04 | BR: BR-M07-03, BR-M07-02
 * Route: /checkout, /cart
 * UI: Slider chọn điểm quy đổi (1 điểm = 1.000đ), hiển thị số tiền giảm tương ứng.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F04): Nối useCalculateLoyaltyDiscount; hoàn 100% điểm nếu đơn bị hủy (BR-M07-02).
export default function PointRedemptionSlider() {
  return (
    <ModuleStub
      moduleCode="TOY-M07"
      moduleName="Khuyến mãi và khách thân thiết"
      componentName="PointRedemptionSlider"
      route="/checkout"
      srsRefs={['M07-F04', 'API-M07-04', 'BR-M07-03', 'BR-M07-02']}
      todos={[
        'Nối useCalculateLoyaltyDiscount; hoàn 100% điểm nếu đơn bị hủy (BR-M07-02).',
        'Nối API-M07-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Slider chọn điểm quy đổi (1 điểm = 1.000đ), hiển thị số tiền giảm tương ứng."
      headingLevel="h2"
    />
  );
}
