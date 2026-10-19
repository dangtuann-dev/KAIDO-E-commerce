# M01 — Tài khoản và người dùng

- **Mã SRS:** `TOY-M01`
- **Thư mục:** `src/modules/m01-account`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Đăng ký, đăng nhập, hồ sơ cá nhân, sổ địa chỉ, khôi phục mật khẩu và quản trị người dùng. Là nguồn xác thực JWT và danh tính cho toàn hệ thống.

Khách hàng, mọi vai trò đã đăng nhập và Quản trị viên. Module cung cấp thông tin liên hệ tối thiểu cho M05/M06/M10, không sở hữu đơn hàng hay điểm thưởng.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng              | API / ghi chú                    |
| --------- | -------------------------- | -------------------------------- |
| `M01-F01` | Đăng ký tài khoản          | API-M01-01                       |
| `M01-F02` | Đăng nhập & đăng xuất      | API-M01-02                       |
| `M01-F03` | Quản lý hồ sơ cá nhân      | API-M01-03, API-M01-04           |
| `M01-F04` | Quản lý sổ địa chỉ         | API-M01-05                       |
| `M01-F05` | Quên mật khẩu & khôi phục  | API-M01-06                       |
| `M01-F06` | Xem lịch sử mua hàng       | Đọc qua M05/M06 public.server.js |
| `M01-F07` | Quản lý người dùng (Admin) | API-M01-07                       |

Tổng: **7 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                       | Quyền  |
| ------------ | ------ | ------------------------------ | ------ |
| `API-M01-01` | POST   | `/api/v1/auth/register`        | public |
| `API-M01-02` | POST   | `/api/v1/auth/login`           | public |
| `API-M01-03` | GET    | `/api/v1/user/profile`         | auth   |
| `API-M01-04` | PUT    | `/api/v1/user/profile`         | auth   |
| `API-M01-05` | GET    | `/api/v1/user/addresses`       | auth   |
| `API-M01-06` | POST   | `/api/v1/auth/forgot-password` | public |
| `API-M01-07` | GET    | `/api/v1/admin/users`          | role   |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `users`
- `addresses`
- `refresh_tokens`
- `password_reset_otps`
- `notifications`

`refresh_tokens` chỉ lưu hash; `password_reset_otps` lưu hash OTP. Voucher sinh nhật dùng `users.child_birthdate` nhưng nghiệp vụ cấp voucher thuộc M07/M09.

## 5. Hợp đồng public.server.js

| Hàm                      | Tham số  | SRS     | Mục đích                                                 |
| ------------------------ | -------- | ------- | -------------------------------------------------------- |
| `getUserContact`         | `userId` | M01-F03 | Lấy email, SĐT và tên hiển thị cho M05/M06/M10.          |
| `getCustomerDisplayName` | `userId` | M01-F03 | Tên hiển thị cho đánh giá/ticket của M10.                |
| `assertActiveUser`       | `userId` | M01-F07 | Chặn tài khoản LOCKED/DISABLED trước thao tác nghiệp vụ. |

Module khác chỉ được import `src/modules/m01-account/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- Không phụ thuộc module khác ở tầng server.

**Bên sử dụng:**

- M05, M06, M10 đọc hồ sơ qua `public.server.js`.

## 7. Yêu cầu phi chức năng

- `NFR-M01-01`
- `NFR-M01-02`
- `NFR-M01-03`

## 8. Thành phần UI dự kiến

- AuthModal
- UserProfileCard
- AddressBookManager
- PasswordChangeForm
- AdminUserTable

## 9. Cấu trúc thư mục

```text
m01-account/
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

- **Server Component (SEO/ISR):** Không có trang public SEO; các trang tài khoản và admin bắt buộc đăng nhập.
- **Client Component:** /account/profile, /account/addresses, /account/security, /admin/users.
- **Component dùng toàn site:** AuthModal (Header toàn site).
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
