# M09 — Nội dung và chiến dịch quảng bá

- **Mã SRS:** `TOY-M09`
- **Thư mục:** `src/modules/m09-marketing`
- **Trạng thái:** đã triển khai đầy đủ server (24 API) + storefront (/, /promotions, /blog, /blog/[slug]) + back-office (/admin/marketing/{banners,campaigns,articles,coupons}).

## 1. Mục tiêu và phạm vi

Quản lý banner, bài viết/cẩm nang, chiến dịch, coupon và lịch hiển thị nội dung; cung cấp CouponService duy nhất cho M04/M05/M07.

Sở hữu nội dung marketing và CouponService. Không xử lý giỏ/đơn/điểm; chỉ cung cấp dữ liệu coupon và nội dung qua `public.server.js`.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                    | API / ghi chú                                         |
| --------- | -------------------------------- | ----------------------------------------------------- |
| `M09-F01` | Quản lý banner quảng cáo         | API-M09-01, API-M09-04, API-M09-09..11                |
| `M09-F02` | Quản lý nội dung quảng bá        | API-M09-06, 07, 12, 13, 14, 15, 24                    |
| `M09-F03` | Quản lý chiến dịch quảng bá      | API-M09-02, 16, 17, 18, 19                            |
| `M09-F04` | Quản lý chương trình khuyến mãi  | API-M09-05, 21, 22, 23                                |
| `M09-F05` | Quản lý trạng thái hiển thị      | API-M09-20 + cron campaigns (`activateScheduledContent`) |
| `M09-F06` | Tìm kiếm và lọc nội dung         | Danh sách admin kèm `keyword`/`status`/`category`     |
| `M09-F07` | Hiển thị nội dung cho khách hàng | API-M09-01, 02, 06, 07, 08                            |
| `M09-F08` | Áp dụng & Xác thực mã khuyến mãi | API-M09-03 + `CouponService` (verify/consume/release) |

Tổng: **8 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                    | Quyền              |
| ------------ | ------ | ------------------------------------------- | ------------------ |
| `API-M09-01` | GET    | `/api/v1/content/banners`                   | public             |
| `API-M09-02` | GET    | `/api/v1/content/promotions/active`         | public             |
| `API-M09-03` | POST   | `/api/v1/promotions/verify-coupon`          | optional           |
| `API-M09-04` | POST   | `/api/v1/admin/marketing/banners`           | ADMIN, MARKETING   |
| `API-M09-05` | POST   | `/api/v1/admin/marketing/coupons`           | ADMIN, MARKETING   |
| `API-M09-06` | GET    | `/api/v1/content/articles`                  | public             |
| `API-M09-07` | GET    | `/api/v1/content/articles/[slug]`           | public             |
| `API-M09-08` | GET    | `/api/v1/content/coupons`                   | public             |
| `API-M09-09` | GET    | `/api/v1/admin/marketing/banners`           | ADMIN, MARKETING   |
| `API-M09-10` | PUT    | `/api/v1/admin/marketing/banners/[id]`      | ADMIN, MARKETING   |
| `API-M09-11` | DELETE | `/api/v1/admin/marketing/banners/[id]`      | ADMIN, MARKETING   |
| `API-M09-12` | GET    | `/api/v1/admin/marketing/articles`          | ADMIN, MARKETING   |
| `API-M09-13` | POST   | `/api/v1/admin/marketing/articles`          | ADMIN, MARKETING   |
| `API-M09-14` | PUT    | `/api/v1/admin/marketing/articles/[id]`     | ADMIN, MARKETING   |
| `API-M09-15` | DELETE | `/api/v1/admin/marketing/articles/[id]`     | ADMIN, MARKETING   |
| `API-M09-16` | GET    | `/api/v1/admin/marketing/campaigns`         | ADMIN, MARKETING   |
| `API-M09-17` | POST   | `/api/v1/admin/marketing/campaigns`         | ADMIN, MARKETING   |
| `API-M09-18` | GET    | `/api/v1/admin/marketing/campaigns/[id]`    | ADMIN, MARKETING   |
| `API-M09-19` | PUT    | `/api/v1/admin/marketing/campaigns/[id]`    | ADMIN, MARKETING   |
| `API-M09-20` | PATCH  | `/api/v1/admin/marketing/campaigns/[id]/status` | ADMIN, MARKETING |
| `API-M09-21` | GET    | `/api/v1/admin/marketing/coupons`           | ADMIN, MARKETING   |
| `API-M09-22` | PUT    | `/api/v1/admin/marketing/coupons/[id]`      | ADMIN, MARKETING   |
| `API-M09-23` | DELETE | `/api/v1/admin/marketing/coupons/[id]`      | ADMIN, MARKETING   |
| `API-M09-24` | GET    | `/api/v1/admin/marketing/articles/[id]`     | ADMIN, MARKETING   |

API-M09-09..24 mở rộng ngoài 6 API gốc của SRS để back-office CRUD đầy đủ; API-M09-24 trả nội dung bài viết cho trình biên tập (danh sách admin chỉ trả tóm tắt).

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `banners`
- `article_categories`
- `articles`
- `campaigns`
- `campaign_items`
- `coupons`
- `coupon_usages`

`coupons`/`coupon_usages` dùng chung với M07 nhưng CHỈ CouponService tại M09 được ghi (OPEN_DECISIONS #9). Mỗi đơn tối đa 1 coupon hàng + 1 freeship (BR-M09-03).

## 5. Hợp đồng public.server.js

| Hàm                  | Tham số    | SRS     | Mục đích                                                                   |
| -------------------- | ---------- | ------- | -------------------------------------------------------------------------- |
| `getBannerContent`   | `position` | M09-F07 | Banner đang hiệu lực cho storefront.                                       |
| `getActiveCampaigns` | `none`     | M09-F07 | Chiến dịch đang chạy.                                                      |
| `CouponService`      | object     | M09-F08 | Service coupon DUY NHẤT: `verifyCoupon`, `consumeCoupon`, `releaseCoupon`. |

Module khác chỉ được import `src/modules/m09-marketing/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 (sản phẩm trong campaign), Supabase Storage (media), cron campaigns.

**Bên sử dụng:**

- M04/M05/M07 gọi CouponService; storefront đọc banner/bài viết/chiến dịch công khai.

## 7. Yêu cầu phi chức năng

- `NFR-M09-01`
- `NFR-M09-02`
- `NFR-M09-03`

## 8. Thành phần UI dự kiến

- HomeHeroSlider
- FlashSaleCountdownBar
- PromoCodeBadgeList
- ArticleCard
- AdminCampaignEditor

## 9. Cấu trúc thư mục

```text
m09-marketing/
├── README.md
├── public.client.js        # component cho module khác (chỉ file này được import chéo)
├── public.server.js        # CouponService + nội dung công khai cho module khác
├── server/
│   ├── constants.js        # enum trạng thái/vị trí/loại
│   ├── repository.js       # truy vấn Supabase (banners/articles/campaigns/coupons)
│   ├── service.js          # nghiệp vụ theo FR + cron activateScheduledContent
│   ├── handlers.js         # map API-M09-xx -> service
│   ├── validation.js       # Zod schema theo API
│   └── __tests__/module.test.js
└── client/
    ├── components/         # HomeHeroSlider, FlashSaleCountdownBar, PromoCodeBadgeList,
    │                       # ArticleCard, AdminBannerForm, AdminCampaignEditor,
    │                       # AdminArticleForm, AdminCouponForm, BlogPagination
    ├── display.js          # nhãn tiếng Việt + định dạng ngày giờ + luồng trạng thái
    ├── hooks/              # một hook TanStack Query cho mỗi API + bộ chọn SKU (M02)
    ├── pages/              # HomePage, PromotionsPage, BlogListPage, BlogPostPage,
    │                       # AdminBannersPage, AdminCampaignsPage,
    │                       # AdminArticlesPage, AdminCouponsPage
    ├── services/marketing.api.js
    └── validation/         # schema form banner/campaign/article/coupon
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError`.
- Ghi dữ liệu nguyên tử bằng RPC PL/pgSQL khi có giao dịch nhiều bảng (`database/migrations/003_m09_marketing_coupon_service.sql`).
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Ảnh banner/bài viết nhập bằng URL (nền tảng chưa có endpoint upload); form kiểm tra đuôi jpg/png/webp.

## 11. Client và render

- **Server Component (đọc DB mỗi request, `force-dynamic`):** `/`, `/promotions`, `/blog`, `/blog/[slug]`.
- **Client Component:** `/admin/marketing/banners`, `/admin/marketing/campaigns`, `/admin/marketing/articles`, `/admin/marketing/coupons`.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client (5 component SRS).
- Nội dung blog hiển thị dạng văn bản thuần, giữ xuống dòng — không chèn HTML thô để tránh XSS.
- Bộ chọn SKU của chiến dịch dùng PLP công khai M02 (API-M02-02) vì API sản phẩm admin giới hạn ADMIN/STAFF.
