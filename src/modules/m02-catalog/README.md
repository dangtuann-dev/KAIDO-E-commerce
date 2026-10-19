# M02 — Sản phẩm và danh mục

- **Mã SRS:** `TOY-M02`
- **Thư mục:** `src/modules/m02-catalog`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Quản lý cây danh mục, thương hiệu, sản phẩm/biến thể/ảnh và cung cấp dữ liệu catalog cho storefront, tìm kiếm và các module khác.

Khách hàng xem catalog; ADMIN/STAFF quản trị sản phẩm. M02 không sở hữu tồn kho thực tế (M08) và không ghi lịch sử tìm kiếm (M03).

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                        | API / ghi chú                                     |
| --------- | ------------------------------------ | ------------------------------------------------- |
| `M02-F01` | Xem menu cây danh mục                | API-M02-01                                        |
| `M02-F02` | Quản lý danh mục                     | TODO — API quản trị danh mục chưa có trong SRS    |
| `M02-F03` | Quản lý thương hiệu                  | TODO — API quản trị thương hiệu chưa có trong SRS |
| `M02-F04` | Thêm sản phẩm mới                    | API-M02-04                                        |
| `M02-F05` | Cập nhật thông tin sản phẩm          | API-M02-05                                        |
| `M02-F06` | Ẩn, ngừng kinh doanh & xóa SP        | API-M02-06                                        |
| `M02-F07` | Quản lý hình ảnh sản phẩm            | TODO — dùng signed upload URL của Storage         |
| `M02-F08` | Quản lý giá & khuyến mãi sản phẩm    | API-M02-05                                        |
| `M02-F09` | Quản lý tồn kho cơ bản               | Đọc M08 qua public.server.js                      |
| `M02-F10` | Xem danh sách sản phẩm theo danh mục | API-M02-02                                        |
| `M02-F11` | Xem chi tiết sản phẩm (PDP)          | API-M02-03                                        |
| `M02-F12` | Cung cấp API Catalog nội bộ          | API-M02-07                                        |
| `M02-F13` | Cảnh báo sản phẩm sắp hết hàng       | Đọc dữ liệu M08 (cron low-stock-scan)             |

Tổng: **13 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                 | Quyền  |
| ------------ | ------ | ---------------------------------------- | ------ |
| `API-M02-01` | GET    | `/api/v1/categories/tree`                | public |
| `API-M02-02` | GET    | `/api/v1/products`                       | public |
| `API-M02-03` | GET    | `/api/v1/products/[idOrSlug]`            | public |
| `API-M02-04` | POST   | `/api/v1/admin/products`                 | role   |
| `API-M02-05` | PUT    | `/api/v1/admin/products/[id]`            | role   |
| `API-M02-06` | DELETE | `/api/v1/admin/products/[id]`            | role   |
| `API-M02-07` | GET    | `/api/v1/internal/products/catalog-sync` | role   |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `categories`
- `brands`
- `products`
- `product_categories`
- `product_variants`
- `product_images`

Giá bán và `rating_avg`/`rating_count` là dữ liệu của M02; rating được M10 đồng bộ qua `public.server.js`. `products.deleted_at` dùng xóa mềm (M02-F06).

## 5. Hợp đồng public.server.js

| Hàm                          | Tham số                | SRS     | Mục đích                                                          |
| ---------------------------- | ---------------------- | ------- | ----------------------------------------------------------------- |
| `getProductSnapshot`         | `productId, variantId` | M02-F11 | Snapshot tên/SKU/giá/ảnh tại thời điểm đặt hàng (BR-M05-05).      |
| `listProductSnapshots`       | `productIds`           | M02-F10 | Thông tin tối thiểu cho giỏ hàng/tìm kiếm.                        |
| `updateProductRatingSummary` | `productId, summary`   | M02-F11 | Đồng bộ rating_avg/rating_count từ M10 (BR-M10-03).               |
| `setProductStockFlag`        | `productId, inStock`   | M02-F06 | Cập nhật cờ hết hàng khi M08 phát hiện available = 0 (BR-M08-03). |
| `getCatalogDelta`            | `sinceTimestamp`       | M02-F12 | Dữ liệu delta cho M03/M09.                                        |

Module khác chỉ được import `src/modules/m02-catalog/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M08 cung cấp tồn khả dụng; M10 đồng bộ điểm đánh giá; Supabase Storage cho ảnh.

**Bên sử dụng:**

- M03, M04, M05, M08, M09, M10 đọc snapshot sản phẩm qua `public.server.js`.

## 7. Yêu cầu phi chức năng

- `NFR-M02-01`
- `NFR-M02-02`
- `NFR-M02-03`

## 8. Thành phần UI dự kiến

- MegaMenuCategory
- ProductCard
- ProductGallery
- AgeBadge
- AdminProductForm

## 9. Cấu trúc thư mục

```text
m02-catalog/
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

- **Server Component (SEO/ISR):** /products (M02-F10), /products/[slug] (M02-F11) — SEO/ISR; các shelf trên trang chủ.
- **Client Component:** /admin/products, /admin/products/create; bộ lọc client trên PLP.
- **Component dùng toàn site:** MegaMenuCategory (Header toàn site).
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
