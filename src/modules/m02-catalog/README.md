# M02 — Sản phẩm và danh mục

- **Mã SRS:** `TOY-M02`
- **Thư mục:** `src/modules/m02-catalog`
- **Trạng thái:** đã triển khai server (18 API), storefront và back-office; dữ liệu đọc/ghi Supabase thật.

## 1. Mục tiêu và phạm vi

Quản lý cây danh mục, thương hiệu, sản phẩm/biến thể/ảnh và cung cấp dữ liệu catalog cho storefront, tìm kiếm và các module khác.

Khách hàng xem catalog; ADMIN/STAFF quản trị sản phẩm. M02 không sở hữu tồn kho thực tế (M08) và không ghi lịch sử tìm kiếm (M03).

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                        | API / ghi chú                                                                 |
| --------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `M02-F01` | Xem menu cây danh mục                | API-M02-01 — chỉ trả danh mục đang hoạt động cho header/mega menu             |
| `M02-F02` | Quản lý danh mục                     | API-M02-11..14 — cây tối đa 3 cấp, slug tự sinh, chặn xóa theo BR-M02-02      |
| `M02-F03` | Quản lý thương hiệu                  | API-M02-10, API-M02-15..18 — chặn xóa thương hiệu còn sản phẩm               |
| `M02-F04` | Thêm sản phẩm mới                    | API-M02-04 — SKU duy nhất toàn hệ thống (BR-M02-01)                          |
| `M02-F05` | Cập nhật thông tin sản phẩm          | API-M02-05, API-M02-08, API-M02-09                                           |
| `M02-F06` | Ẩn, ngừng kinh doanh & xóa SP        | API-M02-06 — xóa mềm (`deleted_at`), chuyển trạng thái `INACTIVE`            |
| `M02-F07` | Quản lý hình ảnh sản phẩm            | Ảnh theo URL (tối đa 10); upload Storage/signed URL chưa triển khai           |
| `M02-F08` | Quản lý giá & khuyến mãi sản phẩm    | API-M02-05 — BR-M02-03: `price_sale` ≤ `price_regular`                        |
| `M02-F09` | Quản lý tồn kho cơ bản               | Đọc tồn kho M08; M08 chưa triển khai nên UI hiển thị “Đang cập nhật tồn kho”  |
| `M02-F10` | Xem danh sách sản phẩm theo danh mục | API-M02-02, API-M02-10 — PLP lọc danh mục/thương hiệu/từ khóa, sắp xếp        |
| `M02-F11` | Xem chi tiết sản phẩm (PDP)          | API-M02-03 — biến thể, ảnh, thương hiệu, sản phẩm liên quan                  |
| `M02-F12` | Cung cấp API Catalog nội bộ          | API-M02-07 — delta theo `since_timestamp` cho M03/M09                        |
| `M02-F13` | Cảnh báo sản phẩm sắp hết hàng       | API-M02-08 hiển thị badge tồn kho; cron low-stock-scan thuộc M08             |

Tổng: **13 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                                 | Quyền         |
| ------------ | ------ | ---------------------------------------- | ------------- |
| `API-M02-01` | GET    | `/api/v1/categories/tree`                | public        |
| `API-M02-02` | GET    | `/api/v1/products`                       | public        |
| `API-M02-03` | GET    | `/api/v1/products/[idOrSlug]`            | public        |
| `API-M02-04` | POST   | `/api/v1/admin/products`                 | ADMIN, STAFF  |
| `API-M02-05` | PUT    | `/api/v1/admin/products/[id]`            | ADMIN, STAFF  |
| `API-M02-06` | DELETE | `/api/v1/admin/products/[id]`            | ADMIN, STAFF  |
| `API-M02-07` | GET    | `/api/v1/internal/products/catalog-sync` | ADMIN, nội bộ |
| `API-M02-08` | GET    | `/api/v1/admin/products`                 | ADMIN, STAFF  |
| `API-M02-09` | GET    | `/api/v1/admin/products/[id]`            | ADMIN, STAFF  |
| `API-M02-10` | GET    | `/api/v1/brands`                         | public        |
| `API-M02-11` | GET    | `/api/v1/admin/categories`               | ADMIN, STAFF  |
| `API-M02-12` | POST   | `/api/v1/admin/categories`               | ADMIN, STAFF  |
| `API-M02-13` | PUT    | `/api/v1/admin/categories/[id]`          | ADMIN, STAFF  |
| `API-M02-14` | DELETE | `/api/v1/admin/categories/[id]`          | ADMIN, STAFF  |
| `API-M02-15` | GET    | `/api/v1/admin/brands`                   | ADMIN, STAFF  |
| `API-M02-16` | POST   | `/api/v1/admin/brands`                   | ADMIN, STAFF  |
| `API-M02-17` | PUT    | `/api/v1/admin/brands/[id]`              | ADMIN, STAFF  |
| `API-M02-18` | DELETE | `/api/v1/admin/brands/[id]`              | ADMIN, STAFF  |

`API-M02-08..18` bổ sung cho back-office (SRS chưa liệt kê mã). Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `categories` — cây danh mục, `slug` duy nhất
- `brands` — thương hiệu, `slug` duy nhất
- `products` — `slug` duy nhất, `deleted_at` cho xóa mềm
- `product_categories` — liên kết sản phẩm ↔ danh mục (`is_primary`)
- `product_variants` — SKU duy nhất toàn hệ thống; luôn có biến thể `Mặc định`
- `product_images` — ảnh theo URL, tối đa 10 ảnh/sản phẩm

Giá bán và `rating_avg`/`rating_count` là dữ liệu của M02; rating được M10 đồng bộ qua `public.server.js`.

### Quy ước nghiệp vụ đã áp dụng

- `price_sale` để trống lưu `NULL` (không lưu `0`); giá hiển thị = `price_sale` khi có và nhỏ hơn giá niêm yết, ngược lại là `price_regular`.
- Tên sản phẩm 5–200 ký tự; SKU `[A-Za-z0-9-]{3,30}`.
- Danh mục tối đa 3 cấp; slug sinh/chuẩn hóa tự động từ tên, đổi tên sẽ sinh lại slug.
- Xóa danh mục bị chặn khi còn danh mục con hoặc sản phẩm (BR-M02-02).
- Xóa thương hiệu bị chặn khi còn sản phẩm tham chiếu.
- Tồn kho không lưu cờ denormalized: không có dữ liệu M08 ⇒ trạng thái “Đang cập nhật tồn kho”; chỉ báo hết hàng khi khả dụng ≤ 0.

## 5. Hợp đồng public.server.js

| Hàm                          | Tham số                | SRS     | Mục đích                                                          |
| ---------------------------- | ---------------------- | ------- | ----------------------------------------------------------------- |
| `getProductSnapshot`         | `productId, variantId` | M02-F11 | Snapshot tên/SKU/giá/ảnh tại thời điểm đặt hàng (BR-M05-05).      |
| `listProductSnapshots`       | `productIds`           | M02-F10 | Thông tin tối thiểu cho giỏ hàng/tìm kiếm.                        |
| `updateProductRatingSummary` | `productId, summary`   | M02-F11 | Đồng bộ rating_avg/rating_count từ M10 (BR-M10-03).               |
| `setProductStockFlag`        | `productId, inStock`   | M02-F06 | Giữ hợp đồng cho M08; M02 đọc tồn kho trực tiếp khi hiển thị.     |
| `getCatalogDelta`            | `sinceTimestamp`       | M02-F12 | Dữ liệu delta cho M03/M09.                                        |

Module khác chỉ được import `src/modules/m02-catalog/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M08 cung cấp tồn khả dụng (chưa triển khai); M10 đồng bộ điểm đánh giá; ảnh hiện dùng URL công khai (chưa upload Storage).

**Bên sử dụng:**

- M03, M04, M05, M08, M09, M10 đọc snapshot sản phẩm qua `public.server.js`.

## 7. Yêu cầu phi chức năng

- `NFR-M02-01`
- `NFR-M02-02`
- `NFR-M02-03`

## 8. Thành phần UI

| Component            | Vai trò                                                       |
| -------------------- | ------------------------------------------------------------- |
| `MegaMenuCategory`   | Menu danh mục đa cấp trên header (API-M02-01).                |
| `ProductCard`        | Thẻ sản phẩm PLP/trang chủ, giá sale, độ tuổi, tồn kho.       |
| `ProductGallery`     | Gallery ảnh PDP.                                              |
| `AgeBadge`           | Nhãn độ tuổi.                                                 |
| `AdminProductForm`   | Form tạo/sửa sản phẩm (ảnh URL, biến thể, giá, trạng thái).   |
| `FeaturedProductShelf` | Shelf “Sản phẩm nổi bật” trên trang chủ.                    |
| `CatalogFilters`     | Bộ lọc PLP, đồng bộ URL chia sẻ được.                         |
| `CatalogPagination`  | Phân trang PLP giữ nguyên bộ lọc trên URL.                    |
| `ProductStockBadge`  | Badge tồn kho dùng chung storefront/back-office.              |
| `VariantSelector`    | Chọn biến thể trên PDP.                                       |

### Route đã nối

- Storefront: `/products`, `/products/[slug]`, `/category/[slug]`
- Back-office: `/admin/products`, `/admin/products/create`, `/admin/products/[id]/edit`, `/admin/categories`, `/admin/brands`

## 9. Cấu trúc thư mục

```text
m02-catalog/
├── README.md
├── public.server.js            # hợp đồng cho module khác
├── public.client.js            # component dùng chéo (header, trang chủ…)
├── client/
│   ├── components/             # UI dùng trong module + public.client.js
│   ├── hooks/                  # TanStack Query hook cho từng API-M02-yy
│   ├── pages/                  # PLP, PDP, Category, Admin list/create/edit
│   ├── services/catalog.api.js # gọi API theo registry
│   └── validation/             # schema form sản phẩm (Zod + RHF)
└── server/
    ├── constants.js            # enum/trạng thái, nhãn, giới hạn
    ├── handlers.js             # map API-M02-yy -> service
    ├── repository.js           # truy vấn Supabase
    ├── service.js              # nghiệp vụ theo FR/BR
    ├── validation.js           # Zod schema params/query/body
    └── __tests__/module.test.js
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError` với mã trong `shared/constants/error-codes.js`.
- Ghi dữ liệu nhiều bảng dùng insert tuần tự có bù trừ; lỗi Supabase được chuẩn hóa qua `fromSupabaseError`.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Back-office và storefront dùng chung `ProductStockBadge` để thống nhất ngữ nghĩa tồn kho.

## 11. Client và render

- **Server Component (SEO/ISR):** `/products` (M02-F10), `/products/[slug]` (M02-F11), `/category/[slug]`; shelf trên trang chủ.
- **Client Component:** toàn bộ `/admin/*` của module; bộ lọc/phân trang PLP.
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/hooks/`: một hook TanStack Query cho mỗi API-M02-yy; `client/services/catalog.api.js` đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: trang thật (không còn `ModuleStub`); giữ đúng chế độ render ở trên.

## 12. Kiểm thử và chất lượng

```bash
npm run test            # Vitest: hợp đồng handler/schema + nghiệp vụ validation
npm run lint            # ESLint, gồm kiểm tra ranh giới module
npm run check:modules   # đối chiếu registry/route/module
npm run build           # build production
```

Smoke test thủ công đã thực hiện trên Supabase thật: CRUD danh mục/thương hiệu/sản phẩm, BR-M02-02, BR-M02-03, xóa mềm, lọc/phân trang, hiển thị giá sale và tồn kho.
