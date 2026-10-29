# M04 — Giỏ hàng

- **Mã SRS:** `TOY-M04`
- **Thư mục:** `src/modules/m04-cart`
- **Trạng thái:** đã triển khai đầy đủ 10 chức năng (API + UI `/cart` + Mini-Cart).

## 1. Mục tiêu và phạm vi

Quản lý giỏ hàng guest/member, số lượng, chọn sản phẩm thanh toán, áp coupon sơ bộ và lưu mua sau.

Khách vãng lai dùng `X-Guest-Session-Id`, thành viên dùng JWT. M04 không tạo đơn, không trừ tồn; chỉ kiểm tra tồn qua M08 và gọi CouponService của M09.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                       | API / ghi chú                              |
| --------- | ----------------------------------- | ------------------------------------------ |
| `M04-F01` | Thêm sản phẩm vào giỏ hàng          | API-M04-02                                 |
| `M04-F02` | Xem giỏ hàng & Mini-Cart            | API-M04-01                                 |
| `M04-F03` | Cập nhật số lượng sản phẩm          | API-M04-03                                 |
| `M04-F04` | Xóa sản phẩm khỏi giỏ hàng          | API-M04-04, API-M04-05 (+ Undo 5 giây)     |
| `M04-F05` | Xóa toàn bộ giỏ hàng                | API-M04-08                                 |
| `M04-F06` | Chọn sản phẩm thanh toán            | API-M04-09 (`PUT /cart/selection`)         |
| `M04-F07` | Nhập mã giảm giá / khuyến mãi sơ bộ | API-M04-07 → `M09 CouponService`           |
| `M04-F08` | Đồng bộ giỏ Guest & Member          | API-M04-06 + `GuestCartMerger`             |
| `M04-F09` | Cảnh báo biến động giá và tồn kho   | API-M04-01 (`revalidate`) + `warnings[]`   |
| `M04-F10` | Lưu lại mua sau (Save for Later)    | API-M04-10 → API-M04-12                    |

Tổng: **10 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                               | Quyền    |
| ------------ | ------ | ------------------------------------------------------ | -------- |
| `API-M04-01` | GET    | `/api/v1/cart`                                         | optional |
| `API-M04-02` | POST   | `/api/v1/cart/items`                                   | optional |
| `API-M04-03` | PUT    | `/api/v1/cart/items/[itemId]`                          | optional |
| `API-M04-04` | DELETE | `/api/v1/cart/items/[itemId]`                          | optional |
| `API-M04-05` | POST   | `/api/v1/cart/items/bulk-delete`                       | optional |
| `API-M04-06` | POST   | `/api/v1/cart/merge`                                   | auth     |
| `API-M04-07` | POST   | `/api/v1/cart/apply-coupon`                            | optional |
| `API-M04-08` | DELETE | `/api/v1/cart`                                         | optional |
| `API-M04-09` | PUT    | `/api/v1/cart/selection`                               | optional |
| `API-M04-10` | POST   | `/api/v1/cart/items/[itemId]/save-for-later`           | optional |
| `API-M04-11` | POST   | `/api/v1/cart/saved-items/[savedItemId]/restore`       | optional |
| `API-M04-12` | DELETE | `/api/v1/cart/saved-items/[savedItemId]`               | optional |

`optional` = `withApi` tự chọn chủ giỏ: có JWT thì dùng giỏ thành viên, không có thì dùng `X-Guest-Session-Id`. Các API **ghi** (thêm/sửa/xóa/gộp) trả `401` khi thiếu cả hai; riêng `GET /api/v1/cart` trả `200` với giỏ rỗng để trang giỏ của khách chưa có mã phiên vẫn tải được.

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes` (không sửa tay file trong `src/app/api/v1/cart/`).

### Hình dạng `cart_summary` (output chung của hầu hết API)

```jsonc
{
  "cart_id": "uuid",
  "items": [
    {
      "item_id": "uuid",
      "variant_id": "uuid",
      "product_id": "uuid",
      "sku": "TOY-001-DO",
      "name": "Xe ô tô đồ chơi - Đỏ",
      "slug": "xe-o-to-do-choi",
      "image_url": "https://...",
      "quantity": 2,
      "unit_price": 120000,
      "current_price": 99000,
      "effective_price": 99000,
      "line_total": 198000,
      "price_changed": true,
      "stock_status": "OK",
      "available": 12,
      "is_purchasable": true
    }
  ],
  "saved_items": [],
  "total_items": 2,
  "total_lines": 1,
  "subtotal": 198000,
  "selected_item_ids": ["uuid"],
  "selected_item_count": 2,
  "selected_subtotal": 198000,
  "total_discount": 0,
  "estimated_total": 198000,
  "warnings": [],
  "coupon": null,
  "is_guest": true,
  "expires_at": "2026-11-28T00:00:00Z",
  "save_for_later_enabled": true,
  "max_quantity_per_item": 20,
  "undo_delete_ms": 5000
}
```

- `unit_price` là giá **snapshot** lúc thêm vào giỏ; `effective_price` là giá **hiện tại** dùng để tính `line_total`/`subtotal` (BR-M04-02 — giỏ luôn khớp giá M05 sẽ thu). Chênh lệch được báo qua `price_changed` và `warnings`.
- `stock_status`: `OK` \| `INSUFFICIENT` \| `OUT_OF_STOCK` \| `UNAVAILABLE` \| `UNKNOWN`. `OUT_OF_STOCK`/`UNAVAILABLE` là **chặn** (UI khóa checkbox, không cho chọn thanh toán); `UNKNOWN` xảy ra khi M08 tạm không phản hồi — giỏ vẫn hiển thị bình thường.
- `warnings[]`: `UNAVAILABLE`, `OUT_OF_STOCK`, `INSUFFICIENT_STOCK`, `PRICE_CHANGED`, `QUANTITY_CAPPED`.

## 4. Bảng dữ liệu sở hữu

- `carts` — `status` ACTIVE / MERGED / CONVERTED / ABANDONED; một giỏ ACTIVE cho mỗi `user_id` và mỗi `guest_session_id`.
- `cart_items` — `UNIQUE(cart_id, variant_id)`, `quantity` 1..20.
- `cart_saved_items` — danh sách “Để dành mua sau”, `UNIQUE(cart_id, variant_id)`.

Giỏ guest hết hạn sau **30 ngày** không hoạt động (`GUEST_CART_TTL_DAYS`); giỏ hết hạn được đánh `ABANDONED` và thay bằng giỏ mới khi khách quay lại.

**Không cần migration mới.** Toàn bộ dữ liệu dùng cột có sẵn trong `schema.sql`:

- Trạng thái “chọn thanh toán” (M04-F06) **không lưu DB** — client giữ tập `item_id` đã chọn, server xác thực lại qua API-M04-09 rồi M05 nhận đúng danh sách đó.
- Mã giảm giá **không lưu** trên `carts`; coupon do M09 sở hữu (OPEN_DECISIONS #9).

## 5. Hợp đồng public.server.js

| Hàm                         | Tham số                  | SRS     | Mục đích                                       |
| --------------------------- | ------------------------ | ------- | ---------------------------------------------- |
| `getCartSummaryForCheckout` | `userId, itemIds`        | M04-F06 | Snapshot giỏ đã xác thực cho M05 tạo đơn.      |
| `clearCartAfterOrder`       | `cartId`                 | M04-F05 | Đánh dấu giỏ `CONVERTED` sau khi đặt hàng.     |
| `mergeGuestCartIntoUser`    | `userId, guestSessionId` | M04-F08 | Gộp giỏ sau đăng nhập (dùng lại khi cần).      |

`getCartSummaryForCheckout` trả summary rỗng (`items: []`, tổng 0) khi thành viên chưa có giỏ ACTIVE, và **bỏ qua** các dòng không còn mua được để M05 không bao giờ nhận giá âm/không tồn tại.

Module khác chỉ được import `src/modules/m04-cart/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 `getProductSnapshot` — tên, SKU, giá niêm yết/giá bán, ảnh thumbnail, trạng thái sản phẩm.
- M08 `checkAvailability(skus)` — tồn khả dụng thật (`on_hand - reserved`).
- M09 `CouponService.verifyCoupon` — M04-F07.

**Bên sử dụng:**

- M05 đọc giỏ qua `getCartSummaryForCheckout` và gọi `clearCartAfterOrder`; không đọc trực tiếp bảng `cart_*`.
- M01 (luồng đăng nhập) được phục vụ gián tiếp qua `GuestCartMerger` phía client.

### Trạng thái M04-F07 (coupon)

`CouponService` của M09 hiện vẫn ném `NotImplementedError('M09-F08')`. Theo quyết định của chủ dự án, M04 **không** tự đọc bảng `coupons`: `applyCouponToCart` gọi M09, bắt `NotImplementedError` và trả lỗi thân thiện `503 SERVICE_UNAVAILABLE` kèm `details.reason = 'M09_COUPON_PENDING'` để FE hiển thị “tính năng đang hoàn thiện”. Khi M09 xong, chỉ cần bỏ khối `catch` này — không phải sửa client.

## 7. Yêu cầu phi chức năng

- `NFR-M04-01` — phản hồi giỏ < 500 ms với giỏ ≤ 50 dòng (1 truy vấn PostgREST có join + 1 lần gọi M08).
- `NFR-M04-02` — số lượng cập nhật optimistic, debounce 400 ms (`QUANTITY_DEBOUNCE_MS`), Undo xóa 5 giây (`UNDO_DELETE_MS`).
- `NFR-M04-03` — không lộ giá vốn/tồn kho chi tiết; chỉ trả `available` của SKU trong giỏ.

## 8. Thành phần UI

- `CartBadge` — icon + số lượng trên header (ẩn badge khi giỏ rỗng).
- `MiniCartDrawer` — drawer 4 dòng gần nhất, focus trap, đóng bằng Esc.
- `CartItemRow` — checkbox chọn, ảnh, giá gạch + nhãn “Giá mới”, stepper số lượng (nút 44px), “Để dành mua sau”.
- `CartSummaryCard` — tạm tính/giảm giá/phí ship, CTA vàng `accent`, “Xóa tất cả”.
- `OutOfStockAlert` — banner cảnh báo chặn/không chặn theo `warnings[]`.
- `CouponInputBox` — nhập mã, chuẩn hóa uppercase, hiện lỗi 422/503 thân thiện.
- `SavedItemsList` — “Để dành mua sau”: thêm lại vào giỏ hoặc xóa hẳn.
- `GuestCartMerger` — không render UI; tự gộp giỏ khách khi phiên chuyển `authenticated`.

## 9. Trang và route

| Route   | Page       | Chức năng                                                                 |
| ------- | ---------- | ------------------------------------------------------------------------- |
| `/cart` | `CartPage` | Toàn bộ F01–F06, F09, F10; chọn dòng → `PUT /cart/selection` → `/checkout?items=…` |

- `GuestCartMerger` được mount một lần ở `src/app/providers.js` (trong `ToastProvider`).
- `/cart` là Client Component vì phụ thuộc giỏ sống; không có nhu cầu SEO.

## 10. Cấu trúc thư mục

```text
m04-cart/
├── README.md
├── public.server.js        # hợp đồng cho module khác (chỉ file này được import chéo)
├── public.client.js        # component dùng chéo module
├── client/
│   ├── components/         # CartBadge, MiniCartDrawer, CartItemRow, CartSummaryCard,
│   │                       # OutOfStockAlert, CouponInputBox, SavedItemsList, GuestCartMerger
│   ├── hooks/              # 12 hook TanStack Query (mỗi API-M04-yy một hook)
│   ├── pages/              # CartPage
│   └── services/           # cart.api.js (mỗi API một hàm)
└── server/
    ├── constants.js        # CART_STATUS + hằng số BR-M04
    ├── handlers.js         # map 12 API-M04-yy -> service
    ├── repository.js       # truy vấn Supabase (carts/cart_items/cart_saved_items)
    ├── service.js          # nghiệp vụ M04-F01..F10
    ├── validation.js       # Zod schema theo API
    └── __tests__/module.test.js
```

## 11. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError` với `ERROR_CODES` (409 khi vượt tồn, 422 khi dữ liệu sai, 404 khi dòng không thuộc giỏ).
- Repository chỉ ánh xạ dữ liệu; mọi quy tắc nghiệp vụ nằm trong `service.js`.
- Ghi nhiều bảng liên tiếp không cần RPC: mọi ràng buộc quan trọng (`UNIQUE`, `CHECK quantity`) do DB bảo đảm, service bắt `DUPLICATE_RESOURCE` để retry/merge.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Lỗi gộp giỏ (M04-F08) **không** được chặn đăng nhập: client chỉ hiện toast khi `merged_items > 0`.

## 12. Client và render

- **Client Component:** `/cart`; `CartBadge` + `MiniCartDrawer` trong header toàn site.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/hooks/`: một hook TanStack Query cho mỗi API-M04-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- Sau mỗi mutation, invalidate query `API-M04-01` để badge, drawer và trang giỏ đồng bộ.
