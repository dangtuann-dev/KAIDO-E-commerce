# M08 — Kho và tồn kho

- **Mã SRS:** `TOY-M08`
- **Thư mục:** `src/modules/m08-inventory`
- **Trạng thái:** đã triển khai đầy đủ 13 chức năng (API + UI back-office).

## 1. Mục tiêu và phạm vi

Quản lý kho, nhà cung cấp, nhập/xuất/giữ chỗ/giải phóng tồn, kiểm kê điều chỉnh, chuyển kho, cảnh báo tồn thấp và thẻ kho bất biến.

Nguồn sự thật duy nhất cho `on_hand`, `reserved`, `available`. Mọi thay đổi tồn phải qua RPC PL/pgSQL nguyên tử; không cập nhật trực tiếp từ client/module khác.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                       | API / ghi chú                      |
| --------- | ----------------------------------- | ---------------------------------- |
| `M08-F01` | Quản lý kho                         | API-M08-09 → 11                    |
| `M08-F02` | Nhập kho                            | API-M08-05, API-M08-15             |
| `M08-F03` | Xem & Tra cứu tồn kho               | API-M08-08, API-M08-23             |
| `M08-F04` | Cung cấp tình trạng tồn kho (API)   | API-M08-01                         |
| `M08-F05` | Giữ hàng (Reserve Stock)            | API-M08-02                         |
| `M08-F06` | Xuất kho thực tế                    | API-M08-04                         |
| `M08-F07` | Giải phóng hàng giữ (Release Stock) | API-M08-03                         |
| `M08-F08` | Nhập lại hàng hoàn / Đổi trả        | API-M08-21                         |
| `M08-F09` | Kiểm kê & Điều chỉnh tồn kho        | API-M08-06, API-M08-16, API-M08-17 |
| `M08-F10` | Chuyển kho nội bộ                   | API-M08-18 → 20                    |
| `M08-F11` | Cảnh báo tồn kho thấp               | API-M08-22, cron `low-stock-scan`  |
| `M08-F12` | Quản lý nhà cung cấp                | API-M08-12 → 14                    |
| `M08-F13` | Sổ biến động kho & Báo cáo tồn      | API-M08-07, API-M08-23             |

Tổng: **13 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                   | Quyền                          |
| ------------ | ------ | ------------------------------------------ | ------------------------------ |
| `API-M08-01` | GET    | `/api/v1/inventory/stock-check`            | public                         |
| `API-M08-02` | POST   | `/api/v1/inventory/reserve`                | ADMIN, STAFF, WAREHOUSE_KEEPER |
| `API-M08-03` | POST   | `/api/v1/inventory/release`                | ADMIN, STAFF, WAREHOUSE_KEEPER |
| `API-M08-04` | POST   | `/api/v1/inventory/fulfill`                | ADMIN, STAFF, WAREHOUSE_KEEPER |
| `API-M08-05` | POST   | `/api/v1/admin/inventory/goods-receipt`    | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-06` | POST   | `/api/v1/admin/inventory/adjustments`      | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-07` | GET    | `/api/v1/admin/inventory/stock-card`       | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-08` | GET    | `/api/v1/admin/inventory/stock`            | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-09` | GET    | `/api/v1/admin/inventory/warehouses`       | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-10` | POST   | `/api/v1/admin/inventory/warehouses`       | ADMIN                          |
| `API-M08-11` | PUT    | `/api/v1/admin/inventory/warehouses/[id]`  | ADMIN                          |
| `API-M08-12` | GET    | `/api/v1/admin/inventory/suppliers`        | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-13` | POST   | `/api/v1/admin/inventory/suppliers`        | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-14` | PUT    | `/api/v1/admin/inventory/suppliers/[id]`   | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-15` | GET    | `/api/v1/admin/inventory/goods-receipts`   | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-16` | GET    | `/api/v1/admin/inventory/adjustments`      | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-17` | PUT    | `/api/v1/admin/inventory/adjustments/[id]` | ADMIN                          |
| `API-M08-18` | GET    | `/api/v1/admin/inventory/transfers`        | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-19` | POST   | `/api/v1/admin/inventory/transfers`        | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-20` | PUT    | `/api/v1/admin/inventory/transfers/[id]`   | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-21` | POST   | `/api/v1/admin/inventory/returns`          | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-22` | GET    | `/api/v1/admin/inventory/low-stock`        | ADMIN, WAREHOUSE_KEEPER        |
| `API-M08-23` | GET    | `/api/v1/admin/inventory/summary`          | ADMIN, WAREHOUSE_KEEPER        |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `warehouses`
- `suppliers`
- `inventory_stocks`
- `stock_reservations`
- `goods_receipts`
- `goods_receipt_items`
- `stock_adjustments`
- `stock_adjustment_items`
- `stock_transfers`
- `stock_transfer_items`
- `stock_movement_logs`

`stock_movement_logs` bất biến (BR-M08-05, SYS-NFR-07). Available = on_hand - reserved >= 0 (BR-M08-01). Reservation hết hạn sau 20 phút. Điều chỉnh lệch > 5.000.000đ hoặc > 10 đơn vị cần ADMIN duyệt.

### Migration bắt buộc

Chạy một lần trong Supabase SQL Editor:

```text
database/migrations/002_m08_inventory_operations.sql
```

Migration này bổ sung cột VAT cho `goods_receipt_items`, mốc `shipped_at`/`received_at` cho `stock_transfers`, và tạo các RPC nguyên tử:

- `inventory_stock_levels`, `inventory_summary`
- `upsert_warehouse`
- `receive_goods`, `create_stock_adjustment`, `decide_stock_adjustment`
- `create_stock_transfer`, `transition_stock_transfer`
- `receive_returned_stock`, `stock_card`
- `generate_document_code`

Migration idempotent (`CREATE OR REPLACE`, `ADD COLUMN IF NOT EXISTS`).

## 5. Hợp đồng public.server.js

| Hàm                 | Tham số           | SRS     | Mục đích                        |
| ------------------- | ----------------- | ------- | ------------------------------- |
| `checkAvailability` | `skus`            | M08-F04 | Tồn khả dụng cho M04/M05.       |
| `reserveForOrder`   | `orderRef, items` | M08-F05 | Giữ tồn nguyên tử khi đặt hàng. |
| `releaseForOrder`   | `orderRef`        | M08-F07 | Giải phóng tồn khi hủy/timeout. |
| `fulfillForOrder`   | `orderRef`        | M08-F06 | Xuất kho khi tạo vận đơn.       |

Module khác chỉ được import `src/modules/m08-inventory/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 (biến thể/SKU, giá niêm yết), RPC reserve_stock/release_stock/fulfill_stock, pg_cron release_expired_reservations.

**Bên sử dụng:**

- M04/M05/M06 gọi public.server.js; M03/M02 đọc tồn.

## 7. Yêu cầu phi chức năng

- `NFR-M08-01`
- `NFR-M08-02`
- `NFR-M08-03`

## 8. Thành phần UI

- `StockLevelBadge` — nhãn tồn kho dùng chung.
- `LowStockAlertBanner` — banner cảnh báo SKU sắp hết/hết hàng.
- `GoodsReceiptModal` + `GoodsReceiptForm` — lập phiếu nhập kho.
- `StockAuditTable` — nhập số đếm kiểm kê, tính chênh lệch và ngưỡng duyệt.
- `InventoryHistoryLog` — bảng thẻ kho bất biến.
- `WarehouseManager`, `SupplierManager`, `TransferManager`, `ReturnedGoodsForm` — cấu hình kho/NCC, chuyển kho, hàng hoàn.

## 9. Trang quản trị

| Route                           | Page                         | Chức năng                                |
| ------------------------------- | ---------------------------- | ---------------------------------------- |
| `/admin`                        | `AdminDashboardPage`         | Tổng quan tồn kho, cảnh báo, lối tắt.    |
| `/admin/inventory`              | `AdminInventoryPage`         | Tra cứu tồn theo SKU/kho, lọc sắp hết.   |
| `/admin/inventory/receipts/new` | `AdminGoodsReceiptPage`      | Lập phiếu nhập + lịch sử phiếu nhập.     |
| `/admin/inventory/audit`        | `AdminStockAuditPage`        | Kiểm kê, gửi/duyệt/hủy phiếu điều chỉnh. |
| `/admin/inventory/stock-cards`  | `AdminStockCardPage`         | Thẻ kho theo SKU/kho/khoảng ngày.        |
| `/admin/inventory/settings`     | `AdminInventorySettingsPage` | Kho, NCC, chuyển kho, nhập hàng hoàn.    |

## 10. Cấu trúc thư mục

```text
m08-inventory/
├── README.md
├── public.server.js        # hợp đồng cho module khác (chỉ file này được import chéo)
├── public.client.js        # component dùng chéo module
├── client/
│   ├── components/
│   ├── constants.js
│   ├── hooks/
│   ├── pages/
│   └── services/
└── server/
    ├── constants.js
    ├── handlers.js
    ├── repository.js
    ├── service.js
    ├── validation.js
    └── __tests__/module.test.js
```

## 11. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError` với `ERROR_CODES`.
- Ghi dữ liệu nguyên tử bằng RPC PL/pgSQL khi có giao dịch nhiều bảng.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Lỗi nghiệp vụ của RPC (`P0001`) được map thành 409/422 tiếng Việt ở service.

## 12. Client và render

- **Server Component (SEO/ISR):** Không có trang public SEO; API tồn kho chỉ dành cho vai trò nội bộ.
- **Client Component:** `/admin`, `/admin/inventory/**`.
- **Component dùng toàn site:** `StockLevelBadge`, `LowStockAlertBanner` qua `public.client.js`.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
