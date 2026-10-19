/**
 * [SHARED] Ma trận RBAC — SRS §2.2 (chuyển thành dữ liệu để kiểm tra lập trình).
 * GUEST = khách vãng lai; STAFF = NV Bán hàng + CSKH; MARKETING bổ sung theo OPEN_DECISIONS #4.
 */
export const CAPABILITIES = Object.freeze({
  M01: {
    GUEST: ['register', 'login', 'forgot_password'],
    CUSTOMER: ['manage_self', 'manage_addresses', 'view_own_orders'],
    WAREHOUSE_KEEPER: ['view_order_customer_info'],
    STAFF: ['view_order_customer_info'],
    MARKETING: [],
    ADMIN: ['manage_all'],
  },
  M02: {
    GUEST: ['view_products'],
    CUSTOMER: ['view_products'],
    WAREHOUSE_KEEPER: ['view_inventory'],
    STAFF: ['view_products'],
    MARKETING: ['view_products'],
    ADMIN: ['manage_catalog'],
  },
  M03: {
    GUEST: ['search'],
    CUSTOMER: ['search'],
    WAREHOUSE_KEEPER: [],
    STAFF: ['search_internal'],
    MARKETING: ['view_hot_keywords'],
    ADMIN: ['view_search_analytics'],
  },
  M04: {
    GUEST: ['guest_cart'],
    CUSTOMER: ['personal_cart', 'merge_guest_cart'],
    WAREHOUSE_KEEPER: [],
    STAFF: ['assist_customer_cart'],
    MARKETING: [],
    ADMIN: ['view_cart_statistics'],
  },
  M05: {
    GUEST: ['view_policies'],
    CUSTOMER: ['create_order', 'pay_online', 'view_own_orders'],
    WAREHOUSE_KEEPER: [],
    STAFF: ['create_assisted_order'],
    MARKETING: [],
    ADMIN: ['manage_revenue'],
  },
  M06: {
    GUEST: ['track_by_code_and_phone'],
    CUSTOMER: ['view_order_history', 'cancel_order', 'request_return'],
    WAREHOUSE_KEEPER: ['print_packing_slip'],
    STAFF: ['approve_orders', 'process_fulfillment', 'process_tickets'],
    MARKETING: [],
    ADMIN: ['configure_carriers'],
  },
  M07: {
    GUEST: ['view_promotions'],
    CUSTOMER: ['earn_points', 'redeem_points', 'manage_loyalty'],
    WAREHOUSE_KEEPER: [],
    STAFF: ['apply_coupon_for_customer'],
    MARKETING: ['create_vouchers'],
    ADMIN: ['configure_loyalty', 'manage_vouchers'],
  },
  M08: {
    GUEST: [],
    CUSTOMER: [],
    WAREHOUSE_KEEPER: ['receive_stock', 'issue_stock', 'stocktake'],
    STAFF: ['view_available_stock'],
    MARKETING: [],
    ADMIN: ['approve_stocktake', 'manage_warehouses'],
  },
  M09: {
    GUEST: ['view_content'],
    CUSTOMER: ['view_content'],
    WAREHOUSE_KEEPER: [],
    STAFF: [],
    MARKETING: ['manage_content', 'manage_campaigns', 'upload_banners'],
    ADMIN: ['approve_publishing', 'manage_content'],
  },
  M10: {
    GUEST: ['view_reviews', 'view_faq'],
    CUSTOMER: ['submit_review', 'submit_ticket'],
    WAREHOUSE_KEEPER: [],
    STAFF: ['reply_tickets', 'moderate_reviews'],
    MARKETING: ['view_feedback_analytics'],
    ADMIN: ['moderate_reviews', 'manage_faq', 'manage_tickets'],
  },
});

export const GUEST_ROLE = 'GUEST';

export function getRoleCapabilities(moduleCode, role) {
  if (role === null || role === undefined) {
    return CAPABILITIES[moduleCode]?.[GUEST_ROLE] ?? [];
  }
  return CAPABILITIES[moduleCode]?.[role] ?? [];
}

export function hasModuleCapability(moduleCode, role, capability) {
  return getRoleCapabilities(moduleCode, role).includes(capability);
}

export function canAccessAdminPanel(role) {
  return ['ADMIN', 'STAFF', 'WAREHOUSE_KEEPER', 'MARKETING'].includes(role);
}

/** Module hiển thị trong sidebar admin theo vai trò. */
export const ADMIN_SIDEBAR_MODULES = Object.freeze({
  ADMIN: ['M01', 'M02', 'M03', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10'],
  STAFF: ['M01', 'M02', 'M05', 'M06', 'M10'],
  WAREHOUSE_KEEPER: ['M02', 'M08'],
  MARKETING: ['M02', 'M03', 'M07', 'M09', 'M10'],
});
