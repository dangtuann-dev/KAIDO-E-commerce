# M05 — Đặt hàng và thanh toán

- **Mã SRS:** `TOY-M05`
- **Thư mục:** `src/modules/m05-checkout`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Khởi tạo checkout, tính tổng tiền, tạo đơn hàng với tồn kho giữ chỗ nguyên tử, xử lý thanh toán online/IPN, hủy đơn timeout và quản lý đơn phía admin.

Tạo đơn và ghi nhận thanh toán. Vòng đời giao vận/đổi trả thuộc M06; giữ/giải phóng tồn thuộc M08; điểm và coupon thuộc M07/M09.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                      | API / ghi chú                              |
| --------- | ---------------------------------- | ------------------------------------------ |
| `M05-F01` | Khởi tạo quy trình Checkout        | API-M05-01                                 |
| `M05-F02` | Quản lý thông tin giao hàng        | API-M05-02                                 |
| `M05-F03` | Lựa chọn phương thức vận chuyển    | API-M06-01                                 |
| `M05-F04` | Lựa chọn phương thức thanh toán    | API-M05-02                                 |
| `M05-F05` | Áp dụng mã giảm giá & điểm thưởng  | API-M05-01                                 |
| `M05-F06` | Xác nhận và Đặt hàng (Place Order) | API-M05-02                                 |
| `M05-F07` | Xử lý thanh toán trực tuyến        | API-M05-04                                 |
| `M05-F08` | Trang xác nhận đơn hàng            | API-M05-03                                 |
| `M05-F09` | Hủy đơn hàng tự động (Timeout)     | API-M05-05 + pg_cron cancel_timeout_orders |
| `M05-F10` | Quản lý & tra cứu đơn của khách    | API-M05-03                                 |
| `M05-F11` | Quản lý đơn hàng (Admin/Staff)     | API-M05-06, API-M05-07                     |

Tổng: **11 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                           | Quyền  |
| ------------ | ------ | ---------------------------------- | ------ |
| `API-M05-01` | POST   | `/api/v1/orders/checkout-summary`  | auth   |
| `API-M05-02` | POST   | `/api/v1/orders`                   | auth   |
| `API-M05-03` | GET    | `/api/v1/orders/[orderRef]`        | auth   |
| `API-M05-04` | POST   | `/api/v1/payments/vnpay/ipn`       | public |
| `API-M05-05` | POST   | `/api/v1/orders/[orderRef]/cancel` | auth   |
| `API-M05-06` | GET    | `/api/v1/admin/orders`             | role   |
| `API-M05-07` | PUT    | `/api/v1/admin/orders/[id]/status` | role   |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `orders`
- `order_items`
- `payment_transactions`
- `order_status_history`

Trạng thái dùng enum thống nhất 13 giá trị (BR-M06-01). Snapshot người nhận/giá tại thời điểm đặt (BR-M05-05); `payment_transactions` chống trùng bằng `idempotency_key`.

## 5. Hợp đồng public.server.js

| Hàm                   | Tham số            | SRS     | Mục đích                                       |
| --------------------- | ------------------ | ------- | ---------------------------------------------- |
| `getOrderByRef`       | `orderRef`         | M05-F10 | Đơn hàng cho M06/M10 theo mã hoặc id.          |
| `getOrderStatus`      | `orderRef`         | M05-F10 | Trạng thái hiện tại cho timeline.              |
| `isOrderOwnedByUser`  | `orderRef, userId` | M05-F10 | Kiểm tra quyền truy cập đơn (NFR-M10-02).      |
| `recordPaymentResult` | `payload`          | M05-F07 | Cập nhật thanh toán idempotent từ IPN/webhook. |

Module khác chỉ được import `src/modules/m05-checkout/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M01, M04, M07 (điểm), M08 (RPC reserve/release), M09 CouponService, M06 (phí ship), cổng thanh toán.

**Bên sử dụng:**

- M06 đọc/ghi trạng thái qua `public.server.js`; M10 xác thực Verified Purchase từ order_items.

## 7. Yêu cầu phi chức năng

- `NFR-M05-01`
- `NFR-M05-02`
- `NFR-M05-03`

## 8. Thành phần UI dự kiến

- CheckoutShippingForm
- PaymentMethodSelector
- OrderSummarySidebar
- OrderSuccessCard
- OrderTrackingTimeline
- AdminOrderTable

## 9. Cấu trúc thư mục

```text
m05-checkout/
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

- **Server Component (SEO/ISR):** Không có trang public SEO; checkout cần dữ liệu người dùng.
- **Client Component:** /checkout, /order-success/[code], /admin/orders, /admin/orders/[id].
- **Component dùng toàn site:** OrderTrackingTimeline được M06 dùng lại qua public.client.js.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
