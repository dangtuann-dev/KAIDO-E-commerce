# Database — KAIDO E-commerce

PostgreSQL trên Supabase. `schema.sql` là nguồn chân lý của mô hình dữ liệu; `seed.sql` chứa dữ liệu tham chiếu/demo.

## 1. Cài đặt lần đầu

1. Tạo project Supabase (khuyến nghị region **Singapore** cho gần Vercel `sin1`).
2. Mở **SQL Editor**, dán và chạy toàn bộ `schema.sql`.
3. Chạy tiếp `seed.sql`.
4. Bật các extension cần thiết trong **Database → Extensions**:
   - `pgcrypto` (UUID, có sẵn trên Supabase)
   - `unaccent`, `pg_trgm` (tìm kiếm không dấu — M03)
   - `pg_cron` (job mỗi phút)
5. Sau khi bật `pg_cron`, chạy lại **khối pg_cron ở cuối `schema.sql`** (hoặc chạy lại cả file — an toàn) để đăng ký 2 job:
   - `kaido-cancel-timeout-orders` — hủy đơn `PENDING_PAYMENT` quá 20 phút (BR-M05-02)
   - `kaido-release-expired-reservations` — nhả tồn giữ chỗ quá hạn (M08-F07)

Kiểm tra job:

```sql
SELECT jobid, jobname, schedule, command, active FROM cron.job ORDER BY jobid;
```

> `pg_cron` của Supabase chạy trên database `postgres` (mặc định). Nếu job không chạy, kiểm tra `cron.job_run_details` và biến `cron.database_name`.

## 2. Seed có gì

| Nội dung | Ghi chú |
|---|---|
| `system_settings` (36 khóa) | Giá trị mặc định theo SRS §2.7, khớp `src/shared/constants/business-rules.js` |
| `membership_tiers` | Bronze / Silver / Gold / Diamond, hệ số điểm 1.0 / 1.2 / 1.5 / 2.0 |
| `shipping_fee_rules` | Nội thành 25.000đ; tỉnh 35.000–50.000đ; miễn phí từ 500.000đ |
| `warehouses` | 1 kho mặc định, địa chỉ là DEMO |
| `faq_categories` | 4 nhóm: Giao hàng, Đổi trả, Thanh toán, Bảo hành và Kỹ thuật |
| `categories` | 5 danh mục cấp 1 **DEMO** từ Blueprint §3.1, đánh dấu `[DEMO]` trong mô tả |

Seed **không** tạo tài khoản hay mật khẩu/hash. Đây là quy định bảo mật của dự án.

### Tạo Admin đầu tiên

TOY-M01 sẽ cung cấp script `scripts/create-admin.js` (TODO) đọc `ADMIN_EMAIL` / `ADMIN_PASSWORD` từ biến môi trường, băm bằng `bcryptjs` rồi insert vào `users`. Không hard-code hoặc commit hash mật khẩu.

## 3. Mô hình dữ liệu

- **55 bảng**, chia theo block `TOY-M01` … `TOY-M10` + hệ thống.
- Mọi khóa chính dùng UUID (trừ `bigserial` cho log).
- Trạng thái dùng ENUM khớp `src/shared/constants`; trạng thái đơn là enum thống nhất M05 + M06.
- Ràng buộc đáng chú ý:
  - Email/SĐT duy nhất (BR-M01-01), SKU duy nhất toàn hệ thống (BR-M02-01)
  - `0 <= price_sale <= price_regular` (BR-M02-03)
  - `on_hand >= 0`, `reserved >= 0`, `reserved <= on_hand` (BR-M08-01)
  - Số lượng mỗi dòng 1–20 (BR-M04-05); review 1–5 sao, nội dung 10–1000 ký tự
  - Tối đa 10 địa chỉ và đúng 1 địa chỉ mặc định mỗi user (trigger M01)
  - Tối đa 10 ảnh/sản phẩm, tối đa 5 ảnh hoặc 1 video cho review/ticket, mỗi tệp ≤ 5MB
  - Tối đa 5 banner `HOME_HERO` đang bật (trigger M09)
- **Bảng bất biến** (chặn `UPDATE`/`DELETE` bằng trigger): `audit_logs`, `order_status_history`, `stock_movement_logs`.
- **RLS**: bật trên tất cả bảng, không tạo policy → mặc định từ chối. Backend dùng `SUPABASE_SERVICE_ROLE_KEY` (bỏ qua RLS). Trình duyệt **không** truy cập Supabase trực tiếp.

## 4. Hàm nguyên tử (PL/pgSQL)

Supabase JS đi qua PostgREST nên không có transaction nhiều câu lệnh. Mọi thao tác cần ACID phải gọi bằng `supabase.rpc()`.

| Hàm | Tham số | Kết quả / mục đích |
|---|---|---|
| `reserve_stock(p_order_ref, p_items, p_expires_at?)` | `p_items` là JSONB array `[{"variant_id":"...","warehouse_id":"...","quantity":2}]`; bỏ `warehouse_id` để dùng kho mặc định; `p_expires_at` mặc định `now() + 20 phút` | Giữ tồn, ghi `stock_reservations` + thẻ kho. Idempotent theo `order_ref`: gọi lại trả `already_reserved: true` |
| `release_stock(p_order_ref)` | mã đơn | Nhả toàn bộ reservation `ACTIVE`, ghi thẻ kho `RELEASE` |
| `fulfill_stock(p_order_ref)` | mã đơn | Xuất kho thật: giảm `on_hand` và `reserved`, ghi `FULFILL` |
| `release_expired_reservations()` | — | Nhả reservation quá hạn; trả số dòng đã nhả. Chạy mỗi phút bằng `pg_cron` |
| `cancel_timeout_orders()` | — | Hủy đơn quá hạn thanh toán, nhả tồn, ghi lịch sử trạng thái; trả số đơn đã hủy. Chạy mỗi phút bằng `pg_cron` |

Ví dụ gọi từ server (không bao giờ gọi ở client):

```js
const { data, error } = await supabase.rpc('reserve_stock', {
  p_order_ref: orderCode,
  p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
});
```

Quy tắc khi bổ sung nghiệp vụ:

- Không cập nhật trực tiếp `inventory_stocks` trong service. Chỉ gọi 3 hàm reserve/release/fulfill.
- Các thao tác nguyên tử khác (cộng/trừ điểm, đếm lượt dùng voucher) **phải** được viết thành hàm PL/pgSQL trước khi triển khai module M07/M09 — TODO của M07/M09, không xử lý bằng nhiều câu lệnh rời qua `supabase-js`.
- Hàm chạy với quyền invoker; service role gọi qua API server. Không cấp quyền gọi hàm cho `anon`.

## 5. Supabase Storage

Tạo bucket (mặc định trong `.env.example`: `kaido-media`):

1. **Storage → New bucket** → tên `kaido-media`.
2. Đặt bucket **public** nếu muốn CDN ảnh sản phẩm; ảnh review/ticket có thể dùng bucket public kèm URL khó đoán, hoặc bucket private + signed URL (chốt tại OPEN_DECISIONS).
3. Cấu hình CORS cho domain storefront.
4. Upload ảnh lớn **không** đi qua Route Handler: dùng signed upload URL do server tạo (`src/server/integrations/storage`).

Giới hạn nghiệp vụ (10 ảnh/sản phẩm, 5 ảnh hoặc 1 video/review, ≤ 5MB/tệp) được kiểm tra ở cả DB trigger và module.

## 6. Migrations

- `schema.sql` = baseline cho project mới.
- Sau khi đã có dữ liệu thật, **không sửa trực tiếp** `schema.sql`; tạo file mới trong `database/migrations/`:
  - `001_ten_thay_doi.sql`, `002_...sql`, đánh số tăng dần.
  - Mỗi file chạy được một lần, có comment mã SRS liên quan.
  - Chạy theo thứ tự trên staging trước, sau đó production.
- Có thể chuyển sang Supabase CLI (`supabase db push`) khi đội thống nhất; hiện tại dùng SQL Editor để đơn giản.

## 7. Reset môi trường dev

Chỉ làm trên project dev, không làm trên production:

```sql
-- Xóa toàn bộ object do KAIDO tạo (destructive)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Sau đó chạy lại schema.sql và seed.sql
```

Lưu ý: lệnh trên xóa cả extension/bảng khác trong schema `public`. Cân nhắc dùng Supabase Branching hoặc project dev riêng.
