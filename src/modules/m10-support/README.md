# M10 — Hỗ trợ và đánh giá

- **Mã SRS:** `TOY-M10`
- **Thư mục:** `src/modules/m10-support`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Đánh giá sản phẩm có xác thực mua hàng, kiểm duyệt/phản hồi, ticket hỗ trợ hai chiều, FAQ và dashboard CSKH.

Sở hữu review/ticket/FAQ. Xác thực quyền mua qua M05, đồng bộ rating sang M02. Khách chỉ xem ticket của chính mình (NFR-M10-02).

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                    | API / ghi chú                               |
| --------- | -------------------------------- | ------------------------------------------- |
| `M10-F01` | Gửi đánh giá sản phẩm            | API-M10-02                                  |
| `M10-F02` | Sửa / Xóa đánh giá               | TODO — chưa có API trong SRS                |
| `M10-F03` | Xem đánh giá & Điểm sao          | API-M10-01                                  |
| `M10-F04` | Kiểm duyệt đánh giá              | API-M10-07                                  |
| `M10-F05` | Phản hồi đánh giá                | TODO — chưa có API trong SRS                |
| `M10-F06` | Gửi yêu cầu hỗ trợ (Ticket)      | API-M10-03                                  |
| `M10-F07` | Theo dõi tiến trình yêu cầu      | API-M10-04, API-M10-05                      |
| `M10-F08` | Tiếp nhận & Xử lý Ticket         | TODO — API admin ticket chưa có trong SRS   |
| `M10-F09` | Quản lý câu hỏi thường gặp (FAQ) | TODO — API admin FAQ chưa có trong SRS      |
| `M10-F10` | Tra cứu câu hỏi thường gặp       | API-M10-06                                  |
| `M10-F11` | Tìm kiếm và lọc CSKH             | TODO — API dashboard CSKH chưa có trong SRS |

Tổng: **11 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                    | Quyền  |
| ------------ | ------ | ------------------------------------------- | ------ |
| `API-M10-01` | GET    | `/api/v1/products/[idOrSlug]/reviews`       | public |
| `API-M10-02` | POST   | `/api/v1/products/[idOrSlug]/reviews`       | auth   |
| `API-M10-03` | POST   | `/api/v1/support/tickets`                   | auth   |
| `API-M10-04` | GET    | `/api/v1/support/tickets/[ticketRef]`       | auth   |
| `API-M10-05` | POST   | `/api/v1/support/tickets/[ticketRef]/reply` | auth   |
| `API-M10-06` | GET    | `/api/v1/support/faqs`                      | public |
| `API-M10-07` | PUT    | `/api/v1/admin/reviews/[id]/moderate`       | role   |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `reviews`
- `review_media`
- `faq_categories`
- `faqs`
- `support_tickets`
- `ticket_messages`
- `ticket_attachments`

Review bắt buộc `order_item_id` từ đơn COMPLETED (BR-M10-01). Tối đa 5 ảnh hoặc 1 video, mỗi tệp <= 5MB (BR-M10-05). Ticket tự đóng sau 72 giờ RESOLVED (BR-M10-04).

## 5. Hợp đồng public.server.js

| Hàm                       | Tham số               | SRS     | Mục đích                                      |
| ------------------------- | --------------------- | ------- | --------------------------------------------- |
| `getProductRatingSummary` | `productId`           | M10-F03 | Rating trung bình/số lượt cho M02/storefront. |
| `assertVerifiedPurchase`  | `userId, orderItemId` | M10-F01 | Kiểm tra quyền đánh giá từ đơn COMPLETED.     |
| `closeResolvedTickets`    | `none`                | M10-F08 | Điểm vào cron close-support-tickets.          |

Module khác chỉ được import `src/modules/m10-support/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M05 (verified purchase), M02 (đồng bộ rating), M01 (hồ sơ), Supabase Storage (media), integrations mail.

**Bên sử dụng:**

- Storefront PDP reviews/FAQ; M02 nhận rating summary qua public.server.js.

## 7. Yêu cầu phi chức năng

- `NFR-M10-01`
- `NFR-M10-02`
- `NFR-M10-03`

## 8. Thành phần UI dự kiến

- ProductRatingSummary
- ReviewSubmissionModal
- StoreReplyBox
- CustomerTicketList
- TicketChatBox
- FaqAccordion

## 9. Cấu trúc thư mục

```text
m10-support/
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

- **Server Component (SEO/ISR):** /faq, /contact — SEO; FAQ có JSON-LD.
- **Client Component:** /account/support/**, /admin/reviews, /admin/support.
- **Component dùng toàn site:** Không có component toàn site.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
