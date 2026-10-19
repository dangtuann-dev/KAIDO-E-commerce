-- =====================================================================
-- KAIDO E-COMMERCE — SEED DATA
-- Chạy SAU database/schema.sql trong Supabase SQL Editor.
-- Script có thể chạy lặp lại: dùng ON CONFLICT DO NOTHING / WHERE NOT EXISTS.
--
-- Nội dung seed:
--   * system_settings — giá trị mặc định theo SRS §2.7 (nguồn: business-rules.js)
--   * membership_tiers — 4 hạng thành viên (M07-F05)
--   * shipping_fee_rules — phí ship khởi tạo (M06-F08)
--   * warehouses — 1 kho mặc định (M08)
--   * faq_categories — 4 nhóm FAQ (M10-F07)
--   * categories — 5 danh mục cấp 1 DEMO từ Blueprint §3.1 (chưa chốt)
--
-- KHÔNG seed tài khoản hay mật khẩu/hash trong repo. Tạo Admin đầu tiên
-- bằng script riêng đọc mật khẩu từ biến môi trường (xem database/README.md).
-- =====================================================================

-- =====================================================================
-- SYSTEM SETTINGS (§2.7)
-- =====================================================================
INSERT INTO public.system_settings (key, value, description) VALUES
  ('auth.access_token_ttl_seconds', '900'::jsonb, 'Access token JWT hết hạn sau 15 phút (M01-F02)'),
  ('auth.refresh_token_ttl_seconds', '604800'::jsonb, 'Refresh token 7 ngày trong cookie HttpOnly (M01-F02)'),
  ('auth.max_login_attempts', '5'::jsonb, 'Sai mật khẩu 5 lần thì khóa tạm (BR-M01-02)'),
  ('auth.lockout_minutes', '15'::jsonb, 'Thời gian khóa tài khoản sau 5 lần sai (BR-M01-02)'),
  ('auth.max_addresses_per_user', '10'::jsonb, 'Tối đa 10 địa chỉ/tài khoản (M01-F04)'),
  ('auth.otp_ttl_seconds', '300'::jsonb, 'OTP quên mật khẩu hiệu lực 5 phút (M01-F05)'),
  ('auth.otp_max_resends_per_hour', '3'::jsonb, 'Tối đa 3 lần gửi lại OTP/giờ (M01-F05)'),
  ('catalog.max_product_images', '10'::jsonb, 'Tối đa 10 ảnh/sản phẩm (M02-F07)'),
  ('catalog.default_low_stock_threshold', '5'::jsonb, 'Ngưỡng cảnh báo tồn thấp mặc định (M02-F13)'),
  ('catalog.default_page_size', '12'::jsonb, 'Số sản phẩm mặc định mỗi trang (M03-F08)'),
  ('catalog.autocomplete_min_chars', '2'::jsonb, 'Autocomplete bắt đầu từ 2 ký tự (M03-F02)'),
  ('catalog.autocomplete_max_results', '8'::jsonb, 'Tối đa 8 gợi ý autocomplete (M03-F02)'),
  ('catalog.autocomplete_debounce_ms', '300'::jsonb, 'Debounce autocomplete 300ms (M03-F02)'),
  ('cart.max_quantity_per_item', '20'::jsonb, 'Tối đa 20 sản phẩm/lần đặt (BR-M04-05)'),
  ('cart.guest_cart_ttl_days', '30'::jsonb, 'Giỏ khách vãng lai giữ 30 ngày (BR-M04-04)'),
  ('order.payment_timeout_minutes', '20'::jsonb, 'Hủy đơn online quá 20 phút (BR-M05-02)'),
  ('order.cod_confirmation_threshold_vnd', '3000000'::jsonb, 'COD vượt 3.000.000đ cần gọi xác nhận (BR-M05-03)'),
  ('shipping.inner_city_fee_vnd', '25000'::jsonb, 'Phí ship nội thành (M06-F08)'),
  ('shipping.province_fee_min_vnd', '35000'::jsonb, 'Phí ship tỉnh mức thấp (M06-F08)'),
  ('shipping.province_fee_max_vnd', '50000'::jsonb, 'Phí ship tỉnh mức cao (M06-F08)'),
  ('shipping.free_threshold_vnd', '500000'::jsonb, 'Miễn phí vận chuyển từ 500.000đ (M06-F08)'),
  ('shipping.max_delivery_attempts', '3'::jsonb, 'Tối đa 3 lần giao thất bại (BR-M06-03)'),
  ('shipping.return_window_days', '7'::jsonb, 'Đổi trả trong 7 ngày từ khi nhận (BR-M06-05)'),
  ('loyalty.vnd_per_earned_point', '100000'::jsonb, 'Mỗi 100.000đ = 1 điểm (M07-F03)'),
  ('loyalty.point_value_vnd', '1000'::jsonb, 'Giá trị quy đổi 1 điểm = 1.000đ'),
  ('loyalty.max_redemption_percent', '50'::jsonb, 'Tối đa 50% giá trị hóa đơn khi tiêu điểm (M07-F04)'),
  ('loyalty.redeem_point_multiple', '10'::jsonb, 'Số điểm tiêu là bội số của 10 (M07-F04)'),
  ('loyalty.point_expiry_days', '365'::jsonb, 'Điểm hết hạn sau 365 ngày (M07-F07)'),
  ('loyalty.tier_evaluation_months', '12'::jsonb, 'Hạng thành viên xét theo 12 tháng gần nhất (BR-M07-04)'),
  ('inventory.stocktake_admin_approval_value_vnd', '5000000'::jsonb, 'Lệch kiểm kê > 5.000.000đ cần Admin duyệt (M08-F09)'),
  ('inventory.stocktake_admin_approval_quantity', '10'::jsonb, 'Lệch kiểm kê > 10 sản phẩm cần Admin duyệt (M08-F09)'),
  ('marketing.max_home_hero_banners', '5'::jsonb, 'Tối đa 5 banner lớn trang chủ (BR-M09-04)'),
  ('marketing.voucher_rate_limit_per_minute', '10'::jsonb, 'Thử voucher tối đa 10 lần/phút/IP (NFR-M09-02)'),
  ('support.max_review_media_files', '5'::jsonb, 'Tối đa 5 ảnh đánh giá (BR-M10-05)'),
  ('support.max_attachment_size_mb', '5'::jsonb, 'Mỗi tệp đính kèm tối đa 5MB (BR-M10-05)'),
  ('support.ticket_auto_close_hours', '72'::jsonb, 'Tự đóng ticket sau 72 giờ RESOLVED (BR-M10-04)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- MEMBERSHIP TIERS (M07-F05 / BR-M07-04)
-- =====================================================================
INSERT INTO public.membership_tiers
  (code, name, min_spend, max_spend, point_multiplier, benefits, sort_order)
VALUES
  ('BRONZE', 'Đồng', 0, 2000000, 1.0, '{}'::jsonb, 1),
  ('SILVER', 'Bạc', 2000000, 5000000, 1.2, '{}'::jsonb, 2),
  ('GOLD', 'Vàng', 5000000, 15000000, 1.5, '{}'::jsonb, 3),
  ('DIAMOND', 'Kim cương', 15000000, NULL, 2.0, '{}'::jsonb, 4)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- SHIPPING FEE RULES (M06-F08) — giá trị khởi tạo theo SRS §2.7.
-- Việc chọn quy tắc theo địa bàn cụ thể sẽ chốt sau (OPEN_DECISIONS).
-- =====================================================================
INSERT INTO public.shipping_fee_rules
  (id, name, region_type, province_code, shipping_method, base_fee, free_shipping_threshold)
VALUES
  ('00000000-0000-0000-0000-00000000f001', 'Nội thành TP.HCM', 'INNER_CITY', '79', 'STANDARD', 25000, 500000),
  ('00000000-0000-0000-0000-00000000f002', 'Ngoại thành / tỉnh lân cận', 'PROVINCE', NULL, 'STANDARD', 35000, 500000),
  ('00000000-0000-0000-0000-00000000f003', 'Tỉnh xa', 'PROVINCE', NULL, 'STANDARD', 50000, 500000)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- KHO MẶC ĐỊNH (M08) — chỉ tạo khi chưa có kho mặc định.
-- Địa chỉ/điện thoại là DEMO, cần cập nhật theo thực tế KAIDO Store.
-- =====================================================================
INSERT INTO public.warehouses (code, name, address, is_default, is_active)
SELECT 'WH-HCM-01', 'Kho trung tâm TP.HCM (demo)', 'Địa chỉ kho cập nhật sau', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.warehouses WHERE is_default);

-- =====================================================================
-- FAQ CATEGORIES (M10-F07)
-- =====================================================================
INSERT INTO public.faq_categories (name, slug, sort_order, is_active) VALUES
  ('Giao hàng', 'giao-hang', 1, true),
  ('Đổi trả đồ chơi', 'doi-tra-do-choi', 2, true),
  ('Thanh toán', 'thanh-toan', 3, true),
  ('Bảo hành và Kỹ thuật', 'bao-hanh-va-ky-thuat', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- DANH MỤC DEMO (Blueprint §3.1) — CHƯA CHỐT với KAIDO Store.
-- Đánh dấu "[DEMO]" trong mô tả để dễ nhận biết và thay thế sau.
-- =====================================================================
INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Bộ lắp ráp', 'bo-lap-rap',
   '[DEMO] Danh mục minh họa từ Blueprint §3.1 (Playsets) — chưa chốt.', 1, true),
  ('Đồ chơi điều khiển', 'do-choi-dieu-khien',
   '[DEMO] Danh mục minh họa từ Blueprint §3.1 (Control Toys) — chưa chốt.', 2, true),
  ('Đồ chơi giáo dục', 'do-choi-giao-duc',
   '[DEMO] Danh mục minh họa từ Blueprint §3.1 (Educational Toys) — chưa chốt.', 3, true),
  ('Đồ chơi thân thiện môi trường', 'do-choi-than-thien-moi-truong',
   '[DEMO] Danh mục minh họa từ Blueprint §3.1 (Eco-Friendly Toys) — chưa chốt.', 4, true),
  ('Thú bông', 'thu-bong',
   '[DEMO] Danh mục minh họa từ Blueprint §3.1 (Stuffed Toys) — chưa chốt.', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- HẾT SEED
-- =====================================================================
