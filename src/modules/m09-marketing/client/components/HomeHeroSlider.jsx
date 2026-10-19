'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — HomeHeroSlider
 * SRS: M09-F01, M09-F07 | API: API-M09-01 | BR: BR-M09-04
 * Route: /
 * UI: Slider banner vị trí HOME_HERO, tối đa 5 banner, lazy-load và alt text.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F01): Nối useGetBanners; dựng slider responsive và CTA chiến dịch.
export default function HomeHeroSlider() {
  return (
    <ModuleStub
      moduleCode="TOY-M09"
      moduleName="Nội dung và chiến dịch quảng bá"
      componentName="HomeHeroSlider"
      route="/"
      srsRefs={['M09-F01', 'M09-F07', 'API-M09-01', 'BR-M09-04']}
      todos={[
        'Nối useGetBanners; dựng slider responsive và CTA chiến dịch.',
        'Nối API-M09-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Slider banner vị trí HOME_HERO, tối đa 5 banner, lazy-load và alt text."
      headingLevel="h2"
    />
  );
}
