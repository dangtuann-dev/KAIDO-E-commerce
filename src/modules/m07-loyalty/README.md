# M07 — Khuyến mãi và khách hàng thân thiết

- **Mã SRS:** `TOY-M07`
- **Thư mục:** `src/modules/m07-loyalty`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Quản lý voucher theo góc nhìn loyalty, cộng/trừ điểm, xếp hạng thành viên, đặc quyền hạng và lịch sử điểm.

Sở hữu điểm và hạng thành viên. KHÔNG tự viết logic coupon: mọi xác thực/tiêu thụ voucher đi qua CouponService duy nhất tại M09 (OPEN_DECISIONS #9).

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                 | API / ghi chú                              |
| --------- | ----------------------------- | ------------------------------------------ |
| `M07-F01` | Quản lý mã khuyến mãi         | API-M07-05 (tạo voucher qua CouponService) |
| `M07-F02` | Áp dụng mã khuyến mãi         | API-M07-01                                 |
| `M07-F03` | Tích điểm thưởng tự động      | API-M07-02 + sự kiện COMPLETED             |
| `M07-F04` | Tiêu điểm thưởng khi mua hàng | API-M07-04                                 |
| `M07-F05` | Quản lý hạng thành viên       | API-M07-06                                 |
| `M07-F06` | Đặc quyền hạng hội viên       | API-M07-02                                 |
| `M07-F07` | Lịch sử biến động điểm        | API-M07-03                                 |

Tổng: **7 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                              | Quyền    |
| ------------ | ------ | ------------------------------------- | -------- |
| `API-M07-01` | POST   | `/api/v1/loyalty/validate-voucher`    | optional |
| `API-M07-02` | GET    | `/api/v1/loyalty/my-points`           | auth     |
| `API-M07-03` | GET    | `/api/v1/loyalty/point-history`       | auth     |
| `API-M07-04` | POST   | `/api/v1/loyalty/calculate-discount`  | auth     |
| `API-M07-05` | POST   | `/api/v1/admin/loyalty/vouchers`      | role     |
| `API-M07-06` | GET    | `/api/v1/admin/loyalty/tiers-summary` | role     |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `membership_tiers`
- `loyalty_accounts`
- `loyalty_point_transactions`
- `customer_vouchers`
- `coupons`
- `coupon_usages`

`coupons`/`coupon_usages` là bảng dùng chung: chỉ CouponService (M09) được ghi; M07 đọc/ghi gián tiếp qua `public.server.js` M09. Điểm có dấu trong `loyalty_point_transactions` và bắt buộc transaction (NFR-M07-02).

## 5. Hợp đồng public.server.js

| Hàm                       | Tham số                    | SRS     | Mục đích                                |
| ------------------------- | -------------------------- | ------- | --------------------------------------- |
| `getLoyaltySummary`       | `userId`                   | M07-F05 | Hạng + số điểm khả dụng cho M05/M09.    |
| `calculatePointsDiscount` | `userId, points, subtotal` | M07-F04 | Kiểm tra bội số 10 và trần 50% hóa đơn. |
| `awardPointsForOrder`     | `orderId`                  | M07-F03 | Điểm vào khi đơn COMPLETED.             |
| `refundPointsForOrder`    | `orderId`                  | M07-F04 | Hoàn điểm khi đơn hủy/trả.              |

Module khác chỉ được import `src/modules/m07-loyalty/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M09 CouponService, M05 (sự kiện COMPLETED), M01 (child_birthdate cho voucher sinh nhật).

**Bên sử dụng:**

- M04/M05 gọi validate/calculate discount; M09 có thể đọc hạng để cấp voucher.

## 7. Yêu cầu phi chức năng

- `NFR-M07-01`
- `NFR-M07-02`
- `NFR-M07-03`

## 8. Thành phần UI dự kiến

- MembershipCard
- PointRedemptionSlider
- VoucherWalletModal
- LoyaltyHistoryTable
- AdminVoucherForm

## 9. Cấu trúc thư mục

```text
m07-loyalty/
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

- **Server Component (SEO/ISR):** Không có trang public SEO; trang điểm thưởng cần đăng nhập.
- **Client Component:** /account/loyalty, /account/loyalty/history, /admin/loyalty/vouchers.
- **Component dùng toàn site:** Không có component toàn site.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
