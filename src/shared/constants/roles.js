/**
 * [SHARED] Vai trò người dùng — SRS §2.2, M01-F07, BR-M01-05
 * MARKETING được bổ sung theo ma trận RBAC (NV Marketing).
 */
export const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  WAREHOUSE_KEEPER: 'WAREHOUSE_KEEPER',
  MARKETING: 'MARKETING',
  ADMIN: 'ADMIN',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên bán hàng / CSKH',
  WAREHOUSE_KEEPER: 'Nhân viên kho',
  MARKETING: 'Nhân viên Marketing',
  ADMIN: 'Quản trị viên',
});

export const ADMIN_ROLES = Object.freeze([ROLES.ADMIN, ROLES.STAFF]);

export function hasRole(userRole, allowedRoles = []) {
  return Boolean(userRole) && allowedRoles.includes(userRole);
}

export function isAdminRole(role) {
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}
