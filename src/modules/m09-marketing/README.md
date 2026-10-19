# M09 — Nội dung và chiến dịch quảng bá

- **Mã SRS:** `TOY-M09`
- **Thư mục:** `src/modules/m09-marketing`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Quản lý banner, bài viết/cẩm nang, chiến dịch, coupon và lịch hiển thị nội dung; cung cấp CouponService duy nhất cho M04/M05/M07.

Sở hữu nội dung marketing và CouponService. Không xử lý giỏ/đơn/điểm; chỉ cung cấp dữ liệu coupon và nội dung qua `public.server.js`.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                    | API / ghi chú                                |
| --------- | -------------------------------- | -------------------------------------------- |
| `M09-F01` | Quản lý banner quảng cáo         | API-M09-01, API-M09-04                       |
| `M09-F02` | Quản lý nội dung quảng bá        | API-M09-06                                   |
| `M09-F03` | Quản lý chiến dịch quảng bá      | API-M09-02                                   |
| `M09-F04` | Quản lý chương trình khuyến mãi  | API-M09-05                                   |
| `M09-F05` | Quản lý trạng thái hiển thị      | Cron campaigns                               |
| `M09-F06` | Tìm kiếm và lọc nội dung         | TODO — API danh sách admin chưa có trong SRS |
| `M09-F07` | Hiển thị nội dung cho khách hàng | API-M09-01, API-M09-02, API-M09-06           |
| `M09-F08` | Áp dụng & Xác thực mã khuyến mãi | API-M09-03                                   |

Tổng: **8 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                            | Quyền    |
| ------------ | ------ | ----------------------------------- | -------- |
| `API-M09-01` | GET    | `/api/v1/content/banners`           | public   |
| `API-M09-02` | GET    | `/api/v1/content/promotions/active` | public   |
| `API-M09-03` | POST   | `/api/v1/promotions/verify-coupon`  | optional |
| `API-M09-04` | POST   | `/api/v1/admin/marketing/banners`   | role     |
| `API-M09-05` | POST   | `/api/v1/admin/marketing/coupons`   | role     |
| `API-M09-06` | GET    | `/api/v1/content/articles`          | public   |

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
├── public.server.js        # hợp đồng cho module khác (chỉ file này được import chéo)
└── server/
    ├── constants.js        # hằng số/enum của module
    ├── handlers.js         # map API-Mxx-yy -> handler (hiện 501)
    ├── repository.js       # stub truy vấn Supabase
    ├── service.js          # stub hàm theo từng FR
    ├── validation.js       # Zod schema theo API
    └── __tests__/module.test.js
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError`/`NotImplementedError`.
- Ghi dữ liệu nguyên tử bằng RPC PL/pgSQL khi có giao dịch nhiều bảng.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- TODO còn lại phải giữ mã SRS để truy vết.

## 11. Client và render

- **Server Component (SEO/ISR):** /, /promotions, /blog, /blog/[slug] — SEO/ISR.
- **Client Component:** /admin/marketing/banners, /admin/marketing/campaigns.
- **Component dùng toàn site:** Không có component toàn site; M09 cung cấp khối home qua page server.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
