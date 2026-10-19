/**
 * [SHARED] Danh mục 10 module — nguồn dữ liệu cho docs, sidebar admin và scripts.
 * Mã SRS giữ nguyên TOY-Mxx.
 */
export const MODULE_PRIORITY = Object.freeze({
  HIGH: 'High (Must-have)',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
});

export const MODULES = Object.freeze({
  M01: {
    code: 'TOY-M01',
    folder: 'm01-account',
    name: 'Tài khoản và người dùng',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/account/*', '/admin/users'],
    apiPrefixes: ['/auth', '/user', '/admin/users'],
  },
  M02: {
    code: 'TOY-M02',
    folder: 'm02-catalog',
    name: 'Sản phẩm và danh mục',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/products/[idOrSlug]', '/admin/products'],
    apiPrefixes: ['/categories', '/products', '/admin/products', '/internal/products'],
  },
  M03: {
    code: 'TOY-M03',
    folder: 'm03-search',
    name: 'Tìm kiếm, lọc, sắp xếp',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/search', '/category/[slug]'],
    apiPrefixes: ['/search'],
  },
  M04: {
    code: 'TOY-M04',
    folder: 'm04-cart',
    name: 'Giỏ hàng',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/cart', 'MiniCartDrawer'],
    apiPrefixes: ['/cart'],
  },
  M05: {
    code: 'TOY-M05',
    folder: 'm05-checkout',
    name: 'Đặt hàng và thanh toán',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/checkout', '/order-success/[code]', '/admin/orders'],
    apiPrefixes: ['/orders', '/payments', '/admin/orders'],
  },
  M06: {
    code: 'TOY-M06',
    folder: 'm06-fulfillment',
    name: 'Đơn hàng và giao vận',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/account/orders/*', '/admin/shipping', '/admin/orders/[id]'],
    apiPrefixes: ['/shipping', '/orders/[orderRef]/...', '/admin/returns'],
  },
  M07: {
    code: 'TOY-M07',
    folder: 'm07-loyalty',
    name: 'Khuyến mãi và khách thân thiết',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/account/loyalty/*', '/admin/loyalty/*'],
    apiPrefixes: ['/loyalty', '/admin/loyalty'],
  },
  M08: {
    code: 'TOY-M08',
    folder: 'm08-inventory',
    name: 'Kho và tồn kho',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/admin/inventory/*'],
    apiPrefixes: ['/inventory', '/admin/inventory'],
  },
  M09: {
    code: 'TOY-M09',
    folder: 'm09-marketing',
    name: 'Nội dung và chiến dịch quảng bá',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/blog/*', '/promotions', '/admin/marketing/*', '/'],
    apiPrefixes: ['/content', '/promotions', '/admin/marketing'],
  },
  M10: {
    code: 'TOY-M10',
    folder: 'm10-support',
    name: 'Hỗ trợ và đánh giá',
    priority: MODULE_PRIORITY.HIGH,
    feRoutes: ['/faq', '/account/support/*', '/admin/reviews'],
    apiPrefixes: ['/products/[idOrSlug]/reviews', '/support', '/admin/reviews'],
  },
});

export const MODULE_CODES = Object.freeze(Object.keys(MODULES));

export function getModule(code) {
  return MODULES[code] || null;
}

export function getModuleFolder(code) {
  return MODULES[code]?.folder ?? null;
}
