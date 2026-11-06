# M10 — Hỗ trợ và đánh giá

- **Mã SRS:** `TOY-M10`
- **Thư mục:** `src/modules/m10-support`
- **Trạng thái:** đã triển khai đầy đủ server (23 API) + storefront (/faq, /contact, khối đánh giá trên PDP) + account (/account/reviews, /account/support) + back-office (/admin/reviews, /admin/support).

## 1. Mục tiêu và phạm vi

Đánh giá sản phẩm có xác thực mua hàng, kiểm duyệt/phản hồi, ticket hỗ trợ hai chiều, FAQ và dashboard CSKH.

Sở hữu review/ticket/FAQ. Xác thực quyền mua qua M05, đồng bộ rating sang M02. Khách chỉ xem ticket của chính mình (NFR-M10-02).

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                    | API / ghi chú                                                         |
| --------- | -------------------------------- | --------------------------------------------------------------------- |
| `M10-F01` | Gửi đánh giá sản phẩm            | API-M10-02 + `assertVerifiedPurchase` (M05) + trigger DB             |
| `M10-F02` | Sửa / Xóa đánh giá               | API-M10-08, API-M10-09, API-M10-10 — trang `/account/reviews`         |
| `M10-F03` | Xem đánh giá & Điểm sao          | API-M10-01 + `ProductReviewsSection` trên PDP (M02)                   |
| `M10-F04` | Kiểm duyệt đánh giá              | API-M10-07, API-M10-12 — `/admin/reviews`                             |
| `M10-F05` | Phản hồi đánh giá                | API-M10-11 — `StoreReplyBox` (mỗi đánh giá một phản hồi)              |
| `M10-F06` | Gửi yêu cầu hỗ trợ (Ticket)      | API-M10-03 — `TicketCreateModal`, `SupportTicketLauncher`             |
| `M10-F07` | Theo dõi tiến trình yêu cầu      | API-M10-04, API-M10-05, API-M10-13 — `/account/support`               |
| `M10-F08` | Tiếp nhận & Xử lý Ticket         | API-M10-14..17 — `/admin/support` (gán, phản hồi, resolve, đóng, mở)  |
| `M10-F09` | Quản lý câu hỏi thường gặp (FAQ) | API-M10-18..23 — tab FAQ trong `/admin/support`                       |
| `M10-F10` | Tra cứu câu hỏi thường gặp       | API-M10-06 + `listFaqCategories` — `/faq` có JSON-LD FAQPage          |
| `M10-F11` | Tìm kiếm và lọc CSKH             | API-M10-17 + bộ lọc keyword/trạng thái/ưu tiên/loại trên trang admin  |

Tổng: **11 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                        | Quyền        |
| ------------ | ------ | ----------------------------------------------- | ------------ |
| `API-M10-01` | GET    | `/api/v1/products/[idOrSlug]/reviews`           | public       |
| `API-M10-02` | POST   | `/api/v1/products/[idOrSlug]/reviews`           | auth         |
| `API-M10-03` | POST   | `/api/v1/support/tickets`                       | auth         |
| `API-M10-04` | GET    | `/api/v1/support/tickets/[ticketRef]`           | auth         |
| `API-M10-05` | POST   | `/api/v1/support/tickets/[ticketRef]/reply`     | auth         |
| `API-M10-06` | GET    | `/api/v1/support/faqs`                          | public       |
| `API-M10-07` | PUT    | `/api/v1/admin/reviews/[id]/moderate`           | ADMIN, STAFF |
| `API-M10-08` | PUT    | `/api/v1/reviews/[id]`                          | auth         |
| `API-M10-09` | DELETE | `/api/v1/reviews/[id]`                          | auth         |
| `API-M10-10` | GET    | `/api/v1/reviews/my`                            | auth         |
| `API-M10-11` | POST   | `/api/v1/admin/reviews/[id]/reply`              | ADMIN, STAFF |
| `API-M10-12` | GET    | `/api/v1/admin/reviews`                         | ADMIN, STAFF |
| `API-M10-13` | GET    | `/api/v1/support/tickets`                       | auth         |
| `API-M10-14` | GET    | `/api/v1/admin/support/tickets`                 | ADMIN, STAFF |
| `API-M10-15` | GET    | `/api/v1/admin/support/tickets/[id]`            | ADMIN, STAFF |
| `API-M10-16` | PUT    | `/api/v1/admin/support/tickets/[id]`            | ADMIN, STAFF |
| `API-M10-17` | GET    | `/api/v1/admin/support/dashboard`               | ADMIN, STAFF |
| `API-M10-18` | GET    | `/api/v1/admin/support/faqs`                    | ADMIN, STAFF |
| `API-M10-19` | POST   | `/api/v1/admin/support/faqs`                    | ADMIN, STAFF |
| `API-M10-20` | PUT    | `/api/v1/admin/support/faqs/[id]`               | ADMIN, STAFF |
| `API-M10-21` | DELETE | `/api/v1/admin/support/faqs/[id]`               | ADMIN, STAFF |
| `API-M10-22` | GET    | `/api/v1/admin/support/faq-categories`          | ADMIN, STAFF |
| `API-M10-23` | POST   | `/api/v1/admin/support/faq-categories`          | ADMIN, STAFF |

API-M10-08..23 mở rộng ngoài 7 API gốc của SRS để đủ vòng đời review (sửa/xóa/danh sách của tôi), phản hồi đánh giá, back-office ticket và CRUD FAQ; toàn bộ đều `IMPLEMENTED`.

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `reviews`
- `review_media`
- `review_replies`
- `faq_categories`
- `faqs`
- `support_tickets`
- `ticket_messages`
- `ticket_attachments`

Review bắt buộc thuộc đơn COMPLETED (BR-M10-01); trigger `enforce_review_verified_purchase` chặn ghi đè từ client. Tối đa 5 ảnh hoặc 1 video, mỗi tệp <= 5MB và chỉ nhận URL (BR-M10-05). Ticket tự đóng sau 72 giờ RESOLVED (BR-M10-04) qua RPC `m10_close_resolved_tickets`.

Migration: `database/migrations/006_m10_support.sql` (bảng `review_replies`, trigger verified purchase, trigger đồng bộ mốc thời gian ticket, RPC đóng ticket quá hạn).

## 5. Hợp đồng public.server.js

| Hàm                       | Tham số                                | SRS     | Mục đích                                             |
| ------------------------- | -------------------------------------- | ------- | ---------------------------------------------------- |
| `getProductRatingSummary` | `productId`                            | M10-F03 | Rating trung bình/số lượt/phân bố sao cho M02.        |
| `assertVerifiedPurchase`  | `{ userId, orderRef, productId }`      | M10-F01 | Trả `order_id/order_item_id/order_code` nếu hợp lệ.   |
| `closeResolvedTickets`    | `{ hours? }`                           | M10-F08 | Điểm vào cron close-support-tickets.                  |

Module khác chỉ được import `src/modules/m10-support/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M05 (verified purchase + trạng thái đơn), M02 (đồng bộ rating, thông tin sản phẩm), M01 (hồ sơ khách), integrations mail, Vercel cron.

**Bên sử dụng:**

- M02 render khối đánh giá trên trang chi tiết sản phẩm qua `public.client.js`; M02 đọc rating summary qua `public.server.js`.
- `/contact` và `/faq` liên kết chéo tới luồng ticket của M10.

## 7. Yêu cầu phi chức năng

- `NFR-M10-01` — API phản hồi P95 < 500ms.
- `NFR-M10-02` — khách chỉ đọc được ticket/đánh giá của chính mình; kiểm tra quyền sở hữu ở service.
- `NFR-M10-03` — nội dung khách gửi được lưu dạng văn bản thuần, không render HTML thô.

## 8. Thành phần UI

- `ProductReviewsSection` — khối đánh giá trên PDP (tổng hợp sao, lọc sao, gửi đánh giá).
- `ProductRatingSummary`, `StarRating`, `StarRatingInput` — hiển thị và nhập điểm sao.
- `ReviewCard`, `ReviewSubmissionModal`, `StoreReplyBox`, `ReviewModerationModal` — hiển thị/gửi/sửa/duyệt/phản hồi đánh giá.
- `CustomerTicketList`, `TicketChatBox`, `TicketCreateModal`, `TicketReplyForm`, `SupportTicketLauncher` — luồng ticket phía khách.
- `FaqAccordion` — tra cứu FAQ.
- Nội bộ admin: `AdminTicketDetailModal`, `AdminFaqManager`, `FaqFormModal`, `FaqCategoryFormModal`.

`public.client.js` export 10 component dùng chéo module (ProductReviewsSection, ProductRatingSummary, StarRating, ReviewSubmissionModal, StoreReplyBox, CustomerTicketList, TicketChatBox, TicketCreateModal, SupportTicketLauncher, FaqAccordion).

## 9. Cấu trúc thư mục

```text
m10-support/
├── README.md
├── public.client.js        # component cho module khác (chỉ file này được import chéo)
├── public.server.js        # rating summary + verified purchase + cron cho module khác
├── server/
│   ├── constants.js        # enum trạng thái review/ticket, SLA, giới hạn media
│   ├── helpers.js          # chuẩn hóa media, mã ticket, tính SLA
│   ├── repository.js       # truy vấn Supabase (reviews/media/replies/FAQ)
│   ├── service.js          # nghiệp vụ review/FAQ/rating + cron đóng ticket
│   ├── ticket-service.js   # nghiệp vụ ticket 2 chiều + dashboard CSKH
│   ├── handlers.js         # map API-M10-xx -> service
│   ├── validation.js       # Zod schema theo API
│   └── __tests__/module.test.js
└── client/
    ├── components/         # 18 component (xem mục 8)
    ├── display.js          # nhãn tiếng Việt, tông badge, định dạng ngày giờ VN
    ├── hooks/              # một hook TanStack Query cho mỗi API-M10-xx
    ├── pages/              # FaqPage, ContactPage, MyReviewsPage, SupportTicketsPage,
    │                       # SupportTicketDetailPage, AdminReviewsPage, AdminSupportPage
    ├── services/support.api.js
    └── validation/support-form.schema.js
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError`.
- Ghi dữ liệu nguyên tử bằng RPC PL/pgSQL khi giao dịch nhiều bảng (`database/migrations/006_m10_support.sql`).
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Ảnh/video đánh giá và tệp ticket nhập bằng URL (nền tảng chưa có endpoint upload).
- Sửa nội dung đánh giá đưa review về `PENDING` và xóa dấu kiểm duyệt cũ (BR-M10-03).

## 11. Client và render

- **Server Component (đọc DB mỗi request):** `/faq` (JSON-LD FAQPage), `/contact` (JSON-LD ContactPage).
- **Client Component:** `/account/reviews`, `/account/support`, `/account/support/[ticketId]`, `/admin/reviews`, `/admin/support`.
- **Nhúng trong module khác:** `ProductReviewsSection` render trên `/products/[slug]` của M02.
- Đăng nhập là modal tại `/` — link bảo vệ dùng `/?auth=login&next=<path>` (xem `SupportTicketLauncher`).
- Cron `close-support-tickets` chạy `0 2 * * *`, gọi `closeResolvedTickets()` qua RPC, có fallback cập nhật từng bản ghi nếu RPC chưa tồn tại.
