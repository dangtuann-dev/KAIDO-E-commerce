/**
 * [TOY-M09] Client services — Nội dung và chiến dịch quảng bá
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: đã triển khai (Giai đoạn 9) — backend M09 hoạt động đầy đủ.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/* ------------------------------------------------------------------ */
/* Nội dung công khai (storefront)                                     */
/* ------------------------------------------------------------------ */

/**
 * API-M09-01 — Banner theo vị trí
 * Banner đang hiệu lực, sắp theo display_order, tối đa 5 banner lớn (BR-M09-04).
 * GET /api/v1/content/banners · quyền: công khai
 * Input: ?position=home_main
 * Output: [{ id, title, image_url, target_url, display_order }]
 */
export function getBanners({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-01');
  return api.get(endpoint.path, { query, auth: false });
}

/**
 * API-M09-02 — Chiến dịch đang chạy
 * Chiến dịch trong khoảng thời gian hiệu lực (M09-F05, F07).
 * GET /api/v1/content/promotions/active · quyền: công khai
 * Input: Không
 * Output: [{ campaign_id, title, banner_url, start_date, end_date, items }]
 */
export function getActivePromotions({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-02');
  return api.get(endpoint.path, { query, auth: false });
}

/**
 * API-M09-03 — Xác thực coupon
 * Kiểm tra coupon cho M04/M05, dùng chung CouponService (M09-F08, NFR-M09-02).
 * POST /api/v1/promotions/verify-coupon · quyền: công khai hoặc đăng nhập
 * Input: { code, order_amount, customer_id, items }
 * Output: { is_valid, discount_amount, message }
 */
export function verifyCoupon({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-03');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-06 — Danh sách bài viết
 * Bài viết đã publish, phân trang, lọc danh mục (M09-F02).
 * GET /api/v1/content/articles · quyền: công khai
 * Input: ?category=news&page=1
 * Output: { total, page, limit, total_pages, items, categories }
 */
export function listArticles({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-06');
  return api.get(endpoint.path, { query, auth: false });
}

/**
 * API-M09-07 — Chi tiết bài viết theo slug
 * Bài viết đã publish theo slug, kèm nội dung rich text và SEO (M09-F02, F07).
 * GET /api/v1/content/articles/[slug] · quyền: công khai
 * Input: slug hoặc id bài viết
 * Output: { id, title, slug, content, cover_image_url, category, published_at, seo }
 */
export function getArticleBySlug({ slug }) {
  const endpoint = getApiEndpoint('API-M09-07');
  return api.get(endpoint.path.replace('[slug]', encodeURIComponent(slug)), { auth: false });
}

/**
 * API-M09-08 — Voucher đang phát hành
 * Mã giảm giá công khai còn hiệu lực để trưng bày tại trang khuyến mãi (M09-F04, F07).
 * GET /api/v1/content/promotions/coupons · quyền: công khai
 * Input: ?limit=12
 * Output: [{ code, name, discount_type, discount_value, min_order_amount, valid_to }]
 */
export function getPublicCoupons({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-08');
  return api.get(endpoint.path, { query, auth: false });
}

/* ------------------------------------------------------------------ */
/* Banner (Admin)                                                      */
/* ------------------------------------------------------------------ */

/**
 * API-M09-04 — Tạo banner (Admin)
 * Tạo banner; ảnh jpg/png/webp <= 2MB, có lịch hiển thị (M09-F01, F05).
 * POST /api/v1/admin/marketing/banners · quyền: ADMIN, MARKETING
 */
export function createBanner({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-09 — Danh sách banner (Admin)
 * Bảng banner back-office: lọc vị trí/trạng thái, tìm kiếm, phân trang (M09-F01, F06).
 * GET /api/v1/admin/marketing/banners · quyền: ADMIN, MARKETING
 */
export function listAdminBanners({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-09');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-10 — Cập nhật banner (Admin)
 * Sửa nội dung, thứ tự, lịch hiển thị và bật/tắt banner (M09-F01, F05).
 * PUT /api/v1/admin/marketing/banners/[id] · quyền: ADMIN, MARKETING
 */
export function updateBanner({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M09-10');
  return api.put(endpoint.path.replace('[id]', id), body);
}

/**
 * API-M09-11 — Xóa banner (Admin)
 * Xóa mềm banner, giải phóng suất HOME_HERO (M09-F01, BR-M09-04).
 * DELETE /api/v1/admin/marketing/banners/[id] · quyền: ADMIN, MARKETING
 */
export function deleteBanner({ id } = {}) {
  const endpoint = getApiEndpoint('API-M09-11');
  return api.delete(endpoint.path.replace('[id]', id));
}

/* ------------------------------------------------------------------ */
/* Bài viết (Admin)                                                    */
/* ------------------------------------------------------------------ */

/**
 * API-M09-12 — Danh sách bài viết (Admin)
 * Bài viết mọi trạng thái kèm danh mục để chọn lọc (M09-F02, F06).
 * GET /api/v1/admin/marketing/articles · quyền: ADMIN, MARKETING
 */
export function listAdminArticles({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-12');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-13 — Tạo bài viết (Admin)
 * Tạo bài viết WYSIWYG, slug SEO, OpenGraph (M09-F02, NFR-M09-01).
 * POST /api/v1/admin/marketing/articles · quyền: ADMIN, MARKETING
 */
export function createArticle({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-13');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-14 — Cập nhật bài viết (Admin)
 * Biên tập/xuất bản/lưu trữ bài viết, giữ slug cũ khi không đổi (M09-F02).
 * PUT /api/v1/admin/marketing/articles/[id] · quyền: ADMIN, MARKETING
 */
export function updateArticle({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M09-14');
  return api.put(endpoint.path.replace('[id]', id), body);
}

/**
 * API-M09-15 — Xóa bài viết (Admin)
 * Xóa mềm bài viết, gỡ khỏi blog công khai (M09-F02).
 * DELETE /api/v1/admin/marketing/articles/[id] · quyền: ADMIN, MARKETING
 */
export function deleteArticle({ id } = {}) {
  const endpoint = getApiEndpoint('API-M09-15');
  return api.delete(endpoint.path.replace('[id]', id));
}

/**
 * API-M09-24 — Chi tiết bài viết (Admin)
 * Trả về bài viết kèm nội dung đầy đủ để nạp vào trình biên tập (M09-F02).
 * GET /api/v1/admin/marketing/articles/[id] · quyền: ADMIN, MARKETING
 */
export function getAdminArticle({ id } = {}) {
  const endpoint = getApiEndpoint('API-M09-24');
  return api.get(endpoint.path.replace('[id]', id));
}

/* ------------------------------------------------------------------ */
/* Chiến dịch (Admin)                                                  */
/* ------------------------------------------------------------------ */

/**
 * API-M09-16 — Danh sách chiến dịch (Admin)
 * Chiến dịch mọi trạng thái kèm số SKU và doanh số bán (M09-F03, F06).
 * GET /api/v1/admin/marketing/campaigns · quyền: ADMIN, MARKETING
 */
export function listAdminCampaigns({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-16');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-17 — Tạo chiến dịch (Admin)
 * Tạo chiến dịch nhóm banner/SKU với giá flash sale (M09-F03).
 * POST /api/v1/admin/marketing/campaigns · quyền: ADMIN, MARKETING
 */
export function createCampaign({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-17');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-18 — Chi tiết chiến dịch (Admin)
 * Chi tiết chiến dịch kèm danh sách SKU để biên tập (M09-F03).
 * GET /api/v1/admin/marketing/campaigns/[id] · quyền: ADMIN, MARKETING
 */
export function getAdminCampaign({ id } = {}) {
  const endpoint = getApiEndpoint('API-M09-18');
  return api.get(endpoint.path.replace('[id]', id));
}

/**
 * API-M09-19 — Cập nhật chiến dịch (Admin)
 * Sửa thông tin, khung giờ và danh sách SKU flash sale (M09-F03).
 * PUT /api/v1/admin/marketing/campaigns/[id] · quyền: ADMIN, MARKETING
 */
export function updateCampaign({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M09-19');
  return api.put(endpoint.path.replace('[id]', id), body);
}

/**
 * API-M09-20 — Đổi trạng thái chiến dịch (Admin)
 * Kích hoạt/tạm dừng/kết thúc/hủy chiến dịch theo lịch hợp lệ (M09-F05, BR-M09-05).
 * PATCH /api/v1/admin/marketing/campaigns/[id]/status · quyền: ADMIN, MARKETING
 */
export function changeCampaignStatus({ id, action } = {}) {
  const endpoint = getApiEndpoint('API-M09-20');
  return api.patch(endpoint.path.replace('[id]', id), { action });
}

/* ------------------------------------------------------------------ */
/* Coupon (Admin)                                                      */
/* ------------------------------------------------------------------ */

/**
 * API-M09-05 — Tạo coupon chiến dịch (Admin)
 * Tạo voucher thuộc chiến dịch; một CouponService dùng chung (M09-F04).
 * POST /api/v1/admin/marketing/coupons · quyền: ADMIN, MARKETING
 */
export function createCoupon({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-05');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-21 — Danh sách coupon (Admin)
 * Coupon mọi trạng thái kèm lượt dùng thực tế (M09-F04, F06).
 * GET /api/v1/admin/marketing/coupons · quyền: ADMIN, MARKETING
 */
export function listAdminCoupons({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-21');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-22 — Cập nhật coupon (Admin)
 * Sửa điều kiện/giới hạn/hiệu lực coupon qua CouponService (M09-F04).
 * PUT /api/v1/admin/marketing/coupons/[id] · quyền: ADMIN, MARKETING
 */
export function updateCoupon({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M09-22');
  return api.put(endpoint.path.replace('[id]', id), body);
}

/**
 * API-M09-23 — Ngừng coupon (Admin)
 * Xóa mềm coupon, ngừng áp dụng ngay cho mọi đơn mới (M09-F04, BR-M09-01).
 * DELETE /api/v1/admin/marketing/coupons/[id] · quyền: ADMIN, MARKETING
 */
export function deleteCoupon({ id } = {}) {
  const endpoint = getApiEndpoint('API-M09-23');
  return api.delete(endpoint.path.replace('[id]', id));
}

/* ------------------------------------------------------------------ */
/* Tiện ích chọn SKU cho chiến dịch                                    */
/* ------------------------------------------------------------------ */

/**
 * Bộ chọn sản phẩm của form chiến dịch — đọc hợp đồng công khai M02 (API-M02-02).
 * Chỉ lấy id/tên/giá để dựng dòng flash sale; server M09 vẫn kiểm tra lại
 * trạng thái và giá niêm yết qua public.server.js của M02 khi lưu.
 */
export function searchCatalogProducts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-02');
  return api.get(endpoint.path, { query, auth: false });
}
