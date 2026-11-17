# M05 — Đặt hàng và thanh toán

- **Mã SRS:** `TOY-M05`
- **Thư mục:** `src/modules/m05-checkout`
- **Trạng thái:** đã triển khai đầy đủ nghiệp vụ F01–F11 (server, UI, VNPAY live + sandbox mô phỏng, Cổng ZaloPay sandbox).

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
| `M05-F09` | Hủy đơn hàng tự động (Timeout)     | API-M05-05 + cron `/api/cron/cancel-timeout-orders` (pg_cron `cancel_timeout_orders`) |
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
| `API-M05-09` | POST   | `/api/v1/payments/zalopay/callback` | public |

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

## 8. Thành phần UI

| Component               | Vai trò                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `CheckoutShippingForm`  | Người nhận + địa chỉ 2 cấp Tỉnh → Xã (Blueprint §3.4 thể hiện ở form), chọn vận chuyển. |
| `PaymentMethodSelector` | Chỉ COD/VNPAY/MoMo/ZaloPay, badge “Sắp có”/“môi trường mô phỏng”; không có form thẻ (SYS-NFR-04). |
| `OrderSummarySidebar`   | Tóm tắt dòng hàng, phí ship, voucher, điểm thưởng, nút vàng `accent` “Đặt hàng”. |
| `OrderSuccessCard`      | Xác nhận đơn + đếm ngược hạn thanh toán 20 phút (BR-M05-02).             |
| `OrderTrackingTimeline` | Timeline trạng thái 13 giá trị (BR-M06-01), dùng lại được ở M06.         |
| `AdminOrderTable`       | Bảng đơn có lọc trạng thái/từ khóa/khoảng ngày + chip đếm theo trạng thái. |
| `PaymentSandboxPanel`   | Chỉ dev: giả lập cổng VNPAY, gửi IPN đã ký lên API-M05-04.               |

### Trang và route

| Route                                   | Page                    | Chức năng                                                       |
| --------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| `/checkout?items=<cartItemId,...>`      | `CheckoutPage`          | F01–F06: gọi API-M05-01 mỗi khi đổi địa chỉ/vận chuyển/voucher/điểm, đặt hàng qua API-M05-02. |
| `/order-success/[code]`                 | `OrderSuccessPage`      | F08–F10: poll 5s khi đơn `PENDING_PAYMENT`, hủy đơn (API-M05-05).|
| `/checkout/payment-sandbox/[orderRef]`  | Server Component        | Chỉ mở khi `mode = sandbox`; đọc cookie refresh để dựng `auth` cho service. |
| `/payment/vnpay-return`                 | Server Component        | `vnp_ReturnUrl`: xác thực chữ ký, chốt trạng thái idempotent rồi chuyển về trang đơn. |
| `/payment/zalopay-return`               | Server Component        | `embed_data.redirecturl`: xác thực `checksum` (Key2), chốt trạng thái idempotent rồi chuyển về trang đơn. |
| `/admin/orders`                         | `AdminOrderListPage`    | F11: lọc + phân trang server-side qua API-M05-06.                |
| `/admin/orders/[id]`                    | `AdminOrderDetailPage`  | F11: chi tiết, lịch sử trạng thái, chuyển trạng thái theo `ORDER_TRANSITIONS`. |

## 9. Cấu trúc thư mục

```text
m05-checkout/
├── README.md
├── public.client.js        # component dùng chéo (M06 dùng OrderTrackingTimeline)
├── public.server.js        # hợp đồng cho module khác (chỉ file này được import chéo)
├── server/
│   ├── constants.js        # ngưỡng COD, timeout 20 phút, số coupon/đơn
│   ├── handlers.js         # map API-M05-xx -> service
│   ├── repository.js       # truy vấn Supabase (orders, order_items, payment_transactions…)
│   ├── service.js          # F01–F11 + IPN VNPAY + callback ZaloPay + sandbox
│   ├── validation.js       # Zod schema theo API
│   └── __tests__/module.test.js
└── client/
    ├── components/         # 7 component ở mục 8
    ├── constants/          # vn-provinces.js — 63 tỉnh/thành kèm mã GSO
    ├── hooks/              # 1 hook TanStack Query cho mỗi API
    ├── pages/              # 4 page component
    ├── services/           # checkout.api.js — 1 hàm cho mỗi API
    └── utils/              # datetime.js — định dạng ngày/đếm ngược
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError`/`NotImplementedError`.
- Ghi dữ liệu nguyên tử bằng RPC PL/pgSQL khi có giao dịch nhiều bảng.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- TODO còn lại phải giữ mã SRS để truy vết.

## 11. Client và render

- **Server Component:** 2 route VNPAY (`/checkout/payment-sandbox/[orderRef]`, `/payment/vnpay-return`) vì cần cookie HttpOnly/chữ ký.
- **Client Component:** `/checkout`, `/order-success/[code]`, `/admin/orders`, `/admin/orders/[id]`.
- **Component dùng toàn site:** `OrderTrackingTimeline` được M06 dùng lại qua `public.client.js`.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/hooks/`: một hook TanStack Query cho mỗi API-M05-xx; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `CheckoutPage` giữ state form và gọi lại API-M05-01 (debounce 450ms) thay vì tự tính tiền ở client.

## 12. Thanh toán trực tuyến (VNPAY, ZaloPay) và kiểm thử

- **VNPAY live:** đặt `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` (tuỳ chọn `VNPAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL`). Ký HMAC-SHA512 trên chuỗi `application/x-www-form-urlencoded` đã sắp xếp khóa (dấu cách thành `+`, dùng `URLSearchParams`); `vnp_Amount = tổng × 100`.
- **Chốt trạng thái:** IPN (API-M05-04) là kênh chính; `/payment/vnpay-return` xác thực chữ ký rồi gọi `recordPaymentResult` idempotent làm đường dự phòng — cần khi cổng không gọi được IPN (merchant demo, môi trường không public). Đơn đã `SUCCESS` không bao giờ bị hạ xuống `FAILED`.
- **VNPAY sandbox (dev):** thiếu 2 biến trên và `NODE_ENV !== 'production'` thì `createPaymentUrl` trả `/checkout/payment-sandbox/<order_code>`; trang này (Server Component) gọi `service.getPaymentSandbox` — service tự chặn khi mode là `live`.
- **ZaloPay (Cổng ZaloPay cho web):** đặt `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2` (tuỳ chọn `ZALOPAY_ENDPOINT`, mặc định sandbox `https://sb-openapi.zalopay.vn/v2/create`). `app_trans_id = yymmdd(GMT+7)_appid_<mã đơn>`; tạo đơn ký HMAC-SHA256 (Key1) trên `app_id|app_trans_id|app_user|amount|app_time|embed_data|item`, sau đó redirect khách sang `order_url`.
- **ZaloPay callback:** API-M05-09 kiểm tra `mac = HMAC_SHA256(data, Key2)`, so số tiền với đơn rồi gọi `recordPaymentResult`; trả `{ return_code: 1 }` khi đã xử lý để cổng ngừng retry. `/payment/zalopay-return` xác thực `checksum` (`appid|apptransid|pmcid|bankcode|amount|discountamount|status`, Key2) và chốt trạng thái dự phòng khi callback chưa về.
- **Thẻ test sandbox ZaloPay:** ATM SBI `9704540000000062` (chủ thẻ `NGUYEN VAN A`, ngày phát hành `1018`) hoặc Visa `4111111111111111` (CVV `123`).
- **Luồng kiểm thử tay:** thêm sản phẩm vào giỏ (M08 đã có tồn) → `/cart` → “Thanh toán” → điền địa chỉ → chọn cổng → thanh toán trên trang cổng → callback/redirect chốt đơn `PENDING` + `payment_status=SUCCESS` → kiểm tra `/account/orders` và `/admin/orders`.
- **Tự động:** `npx vitest run src/modules/m05-checkout src/server/integrations/payment` chạy bộ test hợp đồng + Zod + HMAC/IPN + chữ ký ZaloPay + `recordPaymentResult` (không cần DB).
- `getOrderDetail` trả thêm `payment_info.payment_mode` để UI chỉ hiện lối vào trang mô phỏng khi đang ở sandbox.
