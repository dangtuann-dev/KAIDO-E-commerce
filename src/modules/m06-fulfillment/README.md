# M06 — Đơn hàng và giao vận

- **Mã SRS:** `TOY-M06`
- **Thư mục:** `src/modules/m06-fulfillment`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Tiếp nhận đơn đã tạo, xác nhận/đóng gói, tính phí vận chuyển, tạo vận đơn, đồng bộ hành trình ĐVVC, xử lý giao thất bại và đổi trả/hoàn tiền.

Sở hữu vòng đời giao vận sau khi M05 tạo đơn. M05 sở hữu tạo đơn/thanh toán; M08 sở hữu tồn kho; M06 điều phối trạng thái đơn trong phạm vi ORDER_TRANSITIONS.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                     | API / ghi chú                                 |
| --------- | --------------------------------- | --------------------------------------------- |
| `M06-F01` | Tiếp nhận & Tạo đơn hàng          | Thuộc M05 (API-M05-02)                        |
| `M06-F02` | Xem danh sách & Chi tiết đơn hàng | API-M05-03, API-M05-06                        |
| `M06-F03` | Theo dõi đơn hàng (Tracking)      | API-M06-03                                    |
| `M06-F04` | Hủy đơn hàng                      | API-M06-05 (alias API-M05-05)                 |
| `M06-F05` | Quản lý & Tra cứu đơn (Admin)     | API-M05-06                                    |
| `M06-F06` | Xác nhận đơn hàng                 | API-M05-07                                    |
| `M06-F07` | Cập nhật tiến trình đóng gói      | API-M05-07                                    |
| `M06-F08` | Tính phí vận chuyển tự động       | API-M06-01                                    |
| `M06-F09` | Tạo vận đơn & Bàn giao ĐVVC       | API-M06-02                                    |
| `M06-F10` | Nhận cập nhật hành trình từ ĐVVC  | API-M06-04                                    |
| `M06-F11` | Xử lý giao thất bại & Hoàn hàng   | API-M06-04, API-M05-07                        |
| `M06-F12` | Đổi trả & Hoàn tiền (RMA)         | API-M06-06, API-M06-07                        |
| `M06-F13` | Thông báo trạng thái đơn tự động  | TODO — notifications qua M01/integration mail |
| `M06-F14` | Báo cáo & Thống kê đơn hàng       | TODO — API báo cáo chưa có trong SRS          |

Tổng: **14 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                | Quyền                       |
| ------------ | ------ | --------------------------------------- | --------------------------- |
| `API-M06-01` | POST   | `/api/v1/shipping/calculate-fee`        | optional                    |
| `API-M06-02` | POST   | `/api/v1/orders/[orderRef]/fulfillment` | role                        |
| `API-M06-03` | GET    | `/api/v1/orders/[orderRef]/tracking`    | auth                        |
| `API-M06-04` | POST   | `/api/v1/shipping/webhook/carrier`      | public                      |
| `API-M06-05` | POST   | `/api/v1/orders/[orderRef]/cancel`      | auth (alias của API-M05-05) |
| `API-M06-06` | POST   | `/api/v1/orders/[orderRef]/returns`     | auth                        |
| `API-M06-07` | PUT    | `/api/v1/admin/returns/[id]/approve`    | role                        |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `shipments`
- `shipment_events`
- `shipping_fee_rules`
- `return_requests`
- `return_request_items`

`shipment_events` và `order_status_history` là log bất biến. `shipping_fee_rules` do seed quản lý; đơn >= 500.000đ miễn phí (BR-M06-03).

## 5. Hợp đồng public.server.js

| Hàm                             | Tham số           | SRS     | Mục đích                                          |
| ------------------------------- | ----------------- | ------- | ------------------------------------------------- |
| `getShipmentByOrder`            | `orderRef`        | M06-F03 | Vận đơn + sự kiện mới nhất cho M05/M01.           |
| `updateOrderStatusFromShipment` | `orderId, status` | M06-F10 | Điểm vào duy nhất để webhook ĐVVC đổi trạng thái. |
| `listReturnRequestsForOrder`    | `orderRef`        | M06-F12 | Yêu cầu đổi trả của một đơn.                      |

Module khác chỉ được import `src/modules/m06-fulfillment/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M05 (đơn/thanh toán), M08 (fulfill/release), integrations GHN/GHTK/ViettelPost, M01 (thông báo).

**Bên sử dụng:**

- M01 hiển thị lịch sử/tracking qua API M06; M07 nhận sự kiện COMPLETED để cộng điểm.

## 7. Yêu cầu phi chức năng

- `NFR-M06-01`
- `NFR-M06-02`
- `NFR-M06-03`

## 8. Thành phần UI dự kiến

- OrderTrackingStepper
- CarrierTrackingCard
- CancelOrderModal
- ReturnRequestForm
- FulfillmentActions
- DeliveryDashboard

## 9. Cấu trúc thư mục

```text
m06-fulfillment/
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
