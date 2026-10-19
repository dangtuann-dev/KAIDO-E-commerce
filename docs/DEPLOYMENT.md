# Deployment — KAIDO E-commerce

Hướng dẫn triển khai ứng dụng Next.js lên Vercel và cấu hình Supabase. Các giới hạn nền tảng được đối chiếu tại thời điểm **2026-10**; luôn kiểm tra lại trang giá/giới hạn của Vercel trước khi nâng cấp.

## 1. Kiến trúc triển khai

| Thành phần | Nơi chạy | Ghi chú |
| --- | --- | --- |
| Storefront + Admin (SSR/RSC) | Vercel Functions, region `sin1` | `vercel.json` đặt `regions: ["sin1"]` |
| API Route Handlers `/api/v1` | Vercel Functions, Node runtime | `runtime = 'nodejs'` cho health/cron |
| PostgreSQL + PL/pgSQL | Supabase, region Singapore | Chọn cùng khu vực để giảm độ trễ |
| Storage ảnh/tệp | Supabase Storage | Upload qua signed URL |
| Job mỗi phút | `pg_cron` trong Supabase | Không phụ thuộc gói Vercel |
| Job hằng ngày | Vercel Cron → `/api/cron/*` | Bảo vệ bằng `CRON_SECRET` |
| Thanh toán/ĐVVC | Webhook HTTPS → API | IPN, HMAC, idempotency |

Không có worker thường trực, không có Redis bắt buộc. Ứng dụng stateless: không ghi file vào filesystem của function.

## 2. Chuẩn bị Supabase

1. Tạo project tại [supabase.com](https://supabase.com), chọn region **Southeast Asia (Singapore)**.
2. Lấy **Project URL** và **service_role key** (Settings → API). Service role key chỉ dùng phía server, không đưa vào client.
3. Bật extension trong **Database → Extensions**:
   - `pgcrypto` (UUID, có sẵn)
   - `unaccent`, `pg_trgm` (tìm kiếm không dấu M03)
   - `pg_cron` (job mỗi phút)
4. Mở **SQL Editor**, chạy toàn bộ [`database/schema.sql`](../database/schema.sql).
5. Chạy [`database/seed.sql`](../database/seed.sql).
6. Chạy lại khối **pg_cron** ở cuối `schema.sql` sau khi extension đã bật (hoặc chạy lại cả file — idempotent).
7. Kiểm tra:

   ```sql
   SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;
   SELECT key, value FROM public.system_settings ORDER BY key;
   ```

8. Tạo bucket Storage:
   - Bucket name khớp `SUPABASE_STORAGE_BUCKET` (mặc định `kaido-media`).
   - Catalog ảnh có thể public; ảnh review/ticket nên private + signed URL hoặc bucket riêng (OPEN_DECISIONS #28).
   - Cấu hình CORS cho domain storefront/preview.
9. Bật sao lưu/PITR theo gói Supabase, đáp ứng RPO < 6 giờ, RTO < 30 phút (SYS-NFR-05).

> **Lưu ý:** `schema.sql` bật RLS trên mọi bảng và không tạo policy. Backend dùng service role để bỏ qua RLS. Không gọi Supabase từ trình duyệt.

## 3. Import repo vào Vercel

1. Đẩy repo lên GitHub/GitLab và chọn **Add New → Project** trong Vercel.
2. Framework preset: **Next.js**. Root directory: thư mục gốc repo.
3. Node.js: **20.9+** (xem `.nvmrc`; Vercel đọc `engines.node` trong `package.json`).
4. Build command: `npm run build`; Install command: `npm ci`.
5. Region: **Singapore (`sin1`)** — đã khai báo trong `vercel.json`.
6. Cấu hình biến môi trường theo mục 5 cho từng môi trường.
7. Deploy. Cron trong `vercel.json` được đăng ký tự động sau khi deploy production.

Build **không cần** bí mật thật: route khung không kết nối DB lúc build; `src/server/env.js` đọc biến lazy. Tuy nhiên production cần đủ biến để API hoạt động.

## 4. Môi trường

| Môi trường | Mục đích | Supabase | Ghi chú |
| --- | --- | --- | --- |
| Development | `npm run dev` trên máy | Project dev riêng | Dùng `.env.local`, không commit |
| Preview | Mỗi PR/branch | Project dev/staging | Có thể dùng chung staging; cẩn thận dữ liệu |
| Production | Domain chính | Project production | Bật backup, cron, webhook thật |

Khuyến nghị tách project Supabase cho production và staging. Preview **không** chạy Vercel Cron (Vercel chỉ chạy cron trên production deployment).

## 5. Biến môi trường

Mẫu đầy đủ: [`.env.example`](../.env.example). Không commit `.env.local`; không đặt bí mật sau tiền tố `NEXT_PUBLIC_`.

| Biến | Bắt buộc | Production | Preview | Development | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Nên có | `https://kaido.vn` | URL preview | `http://localhost:3000` | URL công khai, dùng cho canonical/webhook return |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Không | — | — | — | TODO tích hợp Google; đây là ID công khai, không phải secret |
| `SUPABASE_URL` | Có | URL production | URL staging | URL dev | Server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Key production | Key staging | Key dev | **Bí mật**, không lộ client |
| `SUPABASE_STORAGE_BUCKET` | Có | `kaido-media` | `kaido-media` | `kaido-media` | Tên bucket |
| `JWT_ACCESS_SECRET` | Có | Chuỗi ngẫu nhiên ≥ 32 bytes | Khác production | Khác production | Bí mật; đổi sẽ vô hiệu access token cũ |
| `JWT_REFRESH_SECRET` | Có | Chuỗi ngẫu nhiên ≥ 32 bytes | Khác production | Khác production | Bí mật; cookie refresh |
| `JWT_ACCESS_TTL` | Không | `900` | `900` | `900` | Giây, mặc định 15 phút |
| `JWT_REFRESH_TTL` | Không | `604800` | `604800` | `604800` | Giây, mặc định 7 ngày |
| `BCRYPT_ROUNDS` | Không | `12` | `12` | `12` | Tối thiểu 10 |
| `CRON_SECRET` | Có | Chuỗi ngẫu nhiên mạnh | Có thể bỏ | Có thể bỏ | Vercel gửi `Authorization: Bearer <CRON_SECRET>` |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL` | Khi dùng VNPAY | Sandbox → production | Sandbox | Sandbox | Bí mật hash secret |
| `MOMO_*`, `ZALOPAY_*` | Khi dùng | — | — | — | Interface đã có, tích hợp thật là TODO |
| `GHN_*`, `GHTK_*`, `VIETTELPOST_*`, `CARRIER_WEBHOOK_SECRET` | Khi dùng ĐVVC | Thật | Sandbox | Sandbox | Webhook HMAC |
| `SMTP_*` | Khi gửi email | Thật | Có thể bỏ | Mailhog/console | Interface email là stub |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Khuyến nghị | Có | Có | Có thể bỏ | Rate limit nhiều instance |

Quy tắc:

- Chỉ `NEXT_PUBLIC_*` mới lộ ra bundle trình duyệt. Không đặt service role, JWT secret, khóa cổng thanh toán, SMTP password sau tiền tố này.
- Đổi `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` làm mọi phiên cũ mất hiệu lực; thực hiện có chủ đích.
- Nếu nghi ngờ lộ key: thu hồi/rotate trong Supabase/Vercel, cập nhật env, redeploy, kiểm tra log.

## 6. Webhook và URL callback

Cấu hình trong dashboard của đối tác; URL phải là HTTPS công khai, không dùng preview có bảo vệ SSO.

| Dịch vụ | URL | Bảo vệ |
| --- | --- | --- |
| VNPAY IPN | `https://<domain>/api/v1/payments/vnpay/ipn` | HMAC-SHA512 + idempotency |
| VNPAY return | `https://<domain>/order-success/<code>` | Chỉ hiển thị, xác thực trạng thái server-side |
| MoMo / ZaloPay | TODO — thêm route tương ứng khi tích hợp | Chữ ký theo tài liệu đối tác |
| ĐVVC | `https://<domain>/api/v1/shipping/webhook/carrier` | `CARRIER_WEBHOOK_SECRET` + HMAC |
| Vercel Cron | `/api/cron/*` | `Authorization: Bearer <CRON_SECRET>` |

- IPN phải **idempotent** (xử lý lại cùng giao dịch không tạo bản ghi trùng); dùng `payment_transactions.idempotency_key` và unique provider transaction.
- Không tin dữ liệu client trả về từ cổng thanh toán; luôn xác thực chữ ký và trạng thái ở server.
- Webhook phải trả nhanh (2xx) và ghi log; tác vụ nặng đẩy sang job/ghi nhận sau.

## 7. Cron và giới hạn serverless

### 7.1. Vercel Cron

`vercel.json` khai báo 4 job hằng ngày (giờ UTC):

| Route | Lịch | Ghi chú |
| --- | --- | --- |
| `/api/cron/campaigns` | `0 0 * * *` | M09 |
| `/api/cron/expire-loyalty-points` | `0 1 * * *` | M07 |
| `/api/cron/close-support-tickets` | `0 2 * * *` | M10 |
| `/api/cron/low-stock-scan` | `0 3 * * *` | M08 |

Giới hạn Vercel (tham khảo 2026-10):

- **100 cron job/project** trên mọi gói.
- **Hobby:** tần suất tối thiểu **một lần/ngày**, độ chính xác theo giờ (±59 phút). Biểu thức dày hơn (ví dụ `*/30 * * * *`) sẽ **fail lúc deploy**.
- **Pro/Enterprise:** tần suất tối thiểu **mỗi phút**, độ chính xác theo phút.
- Cron chỉ chạy trên **production deployment**; job gọi Vercel Function nên tiêu tốn thời gian/memory như function thường.
- Đặt `CRON_SECRET` trong Vercel; Vercel tự gắn header `Authorization: Bearer <CRON_SECRET>`. Route trả `401` nếu sai.

Vì job quan trọng cần chạy mỗi phút (hủy đơn quá hạn, nhả tồn) nằm ở **`pg_cron` Supabase**, không đặt trên Vercel Cron — tránh giới hạn gói và độ trễ.

### 7.2. Giới hạn function

- **Request/response body tối đa 4,5 MB** với Vercel Functions. `withApi` tự giới hạn JSON ở **1 MB**; ảnh/tệp lớn phải upload trực tiếp qua **signed URL** của Supabase Storage, không gửi qua Route Handler.
- Thời gian chạy mặc định/tối đa (Fluid compute): Hobby 300 giây; Pro/Enterprise mặc định 300 giây, tối đa 800 giây (một số runtime mở rộng 1.800 giây beta). Thiết kế API ngắn; tác vụ dài dùng job.
- Bundle function tối đa 250 MB (uncompressed); tránh import thư viện nặng vào route.
- Function chạy một region mặc định (`sin1` trong dự án); static assets phân phối qua CDN Vercel.

## 8. Quy trình deploy

```bash
# Máy local
npm ci
npm run gen:routes
npm run lint
npm run test
npm run check:modules
npm run build
```

Sau khi merge vào `main`:

1. Vercel build và deploy production.
2. Kiểm tra `/api/v1/health` trả `200`, `checks.database = "ok"` (hoặc `not_configured` trước khi cấu hình).
3. Kiểm tra trang chủ và các route chính render.
4. Kiểm tra `GET /api/v1/admin/users` không token → `401`; token sai role → `403`.
5. Kiểm tra `/api/cron/*` thiếu secret → `401`.
6. Kiểm tra Vercel → Settings → Cron Jobs thấy 4 job; Supabase `cron.job` thấy 2 job.
7. Gửi thử webhook sandbox (VNPAY/ĐVVC) và xem log.

CI (`.github/workflows/ci.yml`) chạy install → gen routes → diff check → lint → test → check:modules → build trên mỗi push/PR.

## 9. Checklist trước go-live

- [ ] Không có bí mật trong repo, log, ảnh chụp hay commit history; `.env.local` nằm trong `.gitignore`.
- [ ] Production dùng Supabase project riêng; đã chạy schema + seed; RLS bật; backup/PITR đạt RPO/RTO.
- [ ] `pg_cron` bật và 2 job active; đã test hủy đơn timeout/nhả tồn.
- [ ] `CRON_SECRET` mạnh; 4 Vercel Cron hiển thị và trả 200 khi gọi có secret.
- [ ] JWT secret riêng cho production; cookie refresh `HttpOnly`, `Secure`, `SameSite` phù hợp khi triển khai M01.
- [ ] Bucket Storage tồn tại, CORS đúng domain; giới hạn tệp hoạt động; không cấp quyền ghi công khai.
- [ ] Webhook thanh toán/ĐVVC trỏ domain thật, chữ ký bật, idempotency đã test.
- [ ] Rate limit production dùng Upstash (hoặc giải pháp tập trung) thay vì bộ đếm in-memory.
- [ ] Dữ liệu demo đã thay; danh mục/sản phẩm thật; FAQ và chính sách đã duyệt.
- [ ] Tài khoản Admin đầu tiên được tạo an toàn (không hard-code mật khẩu).
- [ ] Trang lỗi 404/500/bảo trì; canonical, sitemap, robots; `lang="vi"`.
- [ ] HTTPS/TLS, domain, HSTS; không lộ sourcemap/secret trong client bundle.
- [ ] Theo dõi log/alert; health check định kỳ; kế hoạch rollback.

## 10. Rollback và vận hành

- **Code:** Promote deployment trước đó trong Vercel (Instant Rollback) hoặc revert commit trên `main` rồi deploy lại.
- **Database:** migration phải có kế hoạch lùi (backup trước, tránh DROP cột ngay). Khôi phục từ backup/PITR nếu lỗi dữ liệu.
- **Cron/webhook:** tạm dừng job bằng cách disable cron trong Vercel/Supabase; webhook có thể trả 503 để đối tác retry.
- **Sự cố bảo mật:** rotate service role/JWT/cổng thanh toán, invalidate phiên, kiểm tra `audit_logs` và log function.
- **Theo dõi:** `/api/v1/health`, Vercel logs, Supabase logs, `cron.job_run_details`, `payment_transactions`, `stock_movement_logs`.

## 11. Tài liệu liên quan

- [ARCHITECTURE.md](ARCHITECTURE.md) — luồng request, auth, job nền.
- [DATABASE.md](DATABASE.md) — schema, RPC, RLS, migration.
- [database/README.md](../database/README.md) — cài đặt Supabase chi tiết.
- [OPEN_DECISIONS.md](OPEN_DECISIONS.md) — các điểm chưa chốt ảnh hưởng triển khai.

Nguồn giới hạn nền tảng: [Vercel Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel Functions limits](https://vercel.com/docs/functions/limitations).
