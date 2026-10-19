# M08 — Kho và tồn kho

- **Mã SRS:** `TOY-M08`
- **Thư mục:** `src/modules/m08-inventory`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Quản lý kho, nhà cung cấp, nhập/xuất/giữ chỗ/giải phóng tồn, kiểm kê điều chỉnh, chuyển kho, cảnh báo tồn thấp và thẻ kho bất biến.

Nguồn sự thật duy nhất cho `on_hand`, `reserved`, `available`. Mọi thay đổi tồn phải qua RPC PL/pgSQL nguyên tử; không cập nhật trực tiếp từ client/module khác.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                       | API / ghi chú                              |
| --------- | ----------------------------------- | ------------------------------------------ |
| `M08-F01` | Quản lý kho                         | TODO — API quản trị kho chưa có trong SRS  |
| `M08-F02` | Nhập kho                            | API-M08-05                                 |
| `M08-F03` | Xem & Tra cứu tồn kho               | API-M08-01                                 |
| `M08-F04` | Cung cấp tình trạng tồn kho (API)   | API-M08-01                                 |
| `M08-F05` | Giữ hàng (Reserve Stock)            | API-M08-02                                 |
| `M08-F06` | Xuất kho thực tế                    | API-M08-04                                 |
| `M08-F07` | Giải phóng hàng giữ (Release Stock) | API-M08-03                                 |
| `M08-F08` | Nhập lại hàng hoàn / Đổi trả        | TODO — chưa có API trong SRS               |
| `M08-F09` | Kiểm kê & Điều chỉnh tồn kho        | API-M08-06                                 |
| `M08-F10` | Chuyển kho nội bộ                   | TODO — bảng stock_transfers, chưa có API   |
| `M08-F11` | Cảnh báo tồn kho thấp               | Cron low-stock-scan + M02 public.server.js |
| `M08-F12` | Quản lý nhà cung cấp                | TODO — chưa có API trong SRS               |
| `M08-F13` | Sổ biến động kho & Báo cáo tồn      | API-M08-07                                 |

Tổng: **13 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                | Quyền  |
| ------------ | ------ | --------------------------------------- | ------ |
| `API-M08-01` | GET    | `/api/v1/inventory/stock-check`         | public |
| `API-M08-02` | POST   | `/api/v1/inventory/reserve`             | role   |
| `API-M08-03` | POST   | `/api/v1/inventory/release`             | role   |
| `API-M08-04` | POST   | `/api/v1/inventory/fulfill`             | role   |
| `API-M08-05` | POST   | `/api/v1/admin/inventory/goods-receipt` | role   |
| `API-M08-06` | POST   | `/api/v1/admin/inventory/adjustments`   | role   |
| `API-M08-07` | GET    | `/api/v1/admin/inventory/stock-card`    | role   |

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

- M02 (cờ hết hàng), RPC reserve_stock/release_stock/fulfill_stock, pg_cron release_expired_reservations.

**Bên sử dụng:**

- M04/M05/M06 gọi public.server.js; M03/M02 đọc tồn.

## 7. Yêu cầu phi chức năng

- `NFR-M08-01`
- `NFR-M08-02`
- `NFR-M08-03`

## 8. Thành phần UI dự kiến

- StockLevelBadge
- GoodsReceiptModal
- StockAuditTable
- InventoryHistoryLog
- LowStockAlertBanner

## 9. Cấu trúc thư mục

```text
m08-inventory/
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

- **Server Component (SEO/ISR):** Không có trang public SEO; API tồn kho chỉ dành cho vai trò nội bộ.
- **Client Component:** /admin, /admin/inventory/**.
- **Component dùng toàn site:** Không có component toàn site.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
