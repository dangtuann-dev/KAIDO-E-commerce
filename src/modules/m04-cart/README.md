# M04 — Giỏ hàng

- **Mã SRS:** `TOY-M04`
- **Thư mục:** `src/modules/m04-cart`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Quản lý giỏ hàng guest/member, số lượng, chọn sản phẩm thanh toán, áp coupon sơ bộ và lưu mua sau.

Khách vãng lai dùng `X-Guest-Session-Id`, thành viên dùng JWT. M04 không tạo đơn, không trừ tồn; chỉ kiểm tra tồn qua M08 và gọi CouponService của M09.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                       | API / ghi chú                              |
| --------- | ----------------------------------- | ------------------------------------------ |
| `M04-F01` | Thêm sản phẩm vào giỏ hàng          | API-M04-02                                 |
| `M04-F02` | Xem giỏ hàng & Mini-Cart            | API-M04-01                                 |
| `M04-F03` | Cập nhật số lượng sản phẩm          | API-M04-03                                 |
| `M04-F04` | Xóa sản phẩm khỏi giỏ hàng          | API-M04-04, API-M04-05                     |
| `M04-F05` | Xóa toàn bộ giỏ hàng                | TODO — chưa có API riêng, dùng bulk-delete |
| `M04-F06` | Chọn sản phẩm thanh toán            | TODO — trạng thái chọn lưu phía client     |
| `M04-F07` | Nhập mã giảm giá / khuyến mãi sơ bộ | API-M04-07                                 |
| `M04-F08` | Đồng bộ giỏ Guest & Member          | API-M04-06                                 |
| `M04-F09` | Cảnh báo biến động giá và tồn kho   | API-M04-01 (revalidate)                    |
| `M04-F10` | Lưu lại mua sau (Save for Later)    | TODO — bảng cart_saved_items, chưa có API  |

Tổng: **10 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                         | Quyền    |
| ------------ | ------ | -------------------------------- | -------- |
| `API-M04-01` | GET    | `/api/v1/cart`                   | optional |
| `API-M04-02` | POST   | `/api/v1/cart/items`             | optional |
| `API-M04-03` | PUT    | `/api/v1/cart/items/[itemId]`    | optional |
| `API-M04-04` | DELETE | `/api/v1/cart/items/[itemId]`    | optional |
| `API-M04-05` | POST   | `/api/v1/cart/items/bulk-delete` | optional |
| `API-M04-06` | POST   | `/api/v1/cart/merge`             | auth     |
| `API-M04-07` | POST   | `/api/v1/cart/apply-coupon`      | optional |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `carts`
- `cart_items`
- `cart_saved_items`

`carts.user_id` hoặc `guest_session_id` xác định chủ giỏ. Không lưu giá snapshot lâu dài: giá được tính lại khi xem/checkout (BR-M04-02).

## 5. Hợp đồng public.server.js

| Hàm                         | Tham số                  | SRS     | Mục đích                                  |
| --------------------------- | ------------------------ | ------- | ----------------------------------------- |
| `getCartSummaryForCheckout` | `userId, itemIds`        | M04-F06 | Snapshot giỏ đã xác thực cho M05 tạo đơn. |
| `clearCartAfterOrder`       | `cartId`                 | M04-F05 | Xóa giỏ sau khi đặt hàng thành công.      |
| `mergeGuestCartIntoUser`    | `userId, guestSessionId` | M04-F08 | Gộp giỏ sau đăng nhập.                    |

Module khác chỉ được import `src/modules/m04-cart/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 (snapshot sản phẩm), M08 (tồn khả dụng), M09 CouponService (M04-F07).

**Bên sử dụng:**

- M05 đọc giỏ qua `getCartSummaryForCheckout`; không đọc trực tiếp bảng cart_*.

## 7. Yêu cầu phi chức năng

- `NFR-M04-01`
- `NFR-M04-02`
- `NFR-M04-03`

## 8. Thành phần UI dự kiến

- CartBadge
- MiniCartDrawer
- CartItemRow
- CartSummaryCard
- OutOfStockAlert
- CouponInputBox

## 9. Cấu trúc thư mục

```text
m04-cart/
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
