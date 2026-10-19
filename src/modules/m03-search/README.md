# M03 — Tìm kiếm, lọc và sắp xếp

- **Mã SRS:** `TOY-M03`
- **Thư mục:** `src/modules/m03-search`
- **Trạng thái nền tảng:** khung server, handler trả `501 NOT_IMPLEMENTED`; chưa có nghiệp vụ.

## 1. Mục tiêu và phạm vi

Tìm kiếm sản phẩm theo từ khóa không dấu, autocomplete, faceted filter, sắp xếp, phân trang và thống kê từ khóa.

Chỉ ĐỌC catalog từ M02 qua `public.server.js`; không ghi trực tiếp bảng sản phẩm. Chỉ ghi `search_history` của chính module.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                              | API / ghi chú             |
| --------- | ------------------------------------------ | ------------------------- |
| `M03-F01` | Tìm kiếm sản phẩm theo từ khóa             | API-M03-01                |
| `M03-F02` | Gợi ý từ khóa tự động                      | API-M03-02                |
| `M03-F03` | Lọc theo danh mục và thương hiệu           | API-M03-01 (facet)        |
| `M03-F04` | Lọc theo khoảng giá                        | API-M03-01 (facet)        |
| `M03-F05` | Lọc theo độ tuổi và giới tính              | API-M03-01 (facet)        |
| `M03-F06` | Lọc theo tình trạng                        | API-M03-01 (facet)        |
| `M03-F07` | Sắp xếp kết quả                            | API-M03-01 (sort)         |
| `M03-F08` | Phân trang kết quả                         | API-M03-01 (page/limit)   |
| `M03-F09` | Số lượng kết quả theo bộ lọc và xóa bộ lọc | API-M03-01 (facets)       |
| `M03-F10` | Xử lý không có kết quả                     | API-M03-03                |
| `M03-F11` | Lưu lịch sử tìm kiếm                       | Ghi nội bộ search_history |
| `M03-F12` | Từ khóa phổ biến và thống kê               | API-M03-03, API-M03-04    |

Tổng: **12 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                          | Quyền  |
| ------------ | ------ | --------------------------------- | ------ |
| `API-M03-01` | GET    | `/api/v1/search/products`         | public |
| `API-M03-02` | GET    | `/api/v1/search/autocomplete`     | public |
| `API-M03-03` | GET    | `/api/v1/search/popular-keywords` | public |
| `API-M03-04` | GET    | `/api/v1/search/statistics`       | role   |

Registry đầy đủ tại `src/shared/api-endpoints.js`; route được sinh bởi `npm run gen:routes`.

## 4. Bảng dữ liệu sở hữu

- `search_history`

Bảng duy nhất M03 sở hữu. Không lập chỉ mục sản phẩm DISCONTINUED (BR-M03-05); sản phẩm ACTIVE nhưng hết hàng vẫn xuất hiện.

## 5. Hợp đồng public.server.js

| Hàm                     | Tham số | SRS     | Mục đích                                                      |
| ----------------------- | ------- | ------- | ------------------------------------------------------------- |
| `searchCatalogIndex`    | `input` | M03-F01 | Cho phép module nội bộ tái sử dụng tìm kiếm; M03 chỉ đọc M02. |
| `getPopularSearchTerms` | `limit` | M03-F12 | Từ khóa phổ biến dùng chung cho gợi ý.                        |

Module khác chỉ được import `src/modules/m03-search/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 (đọc catalog), M08 (trạng thái tồn kho).

**Bên sử dụng:**

- Storefront `/search`, `/category/[slug]`; admin `/admin/analytics/search`.

## 7. Yêu cầu phi chức năng

- `NFR-M03-01`
- `NFR-M03-02`
- `NFR-M03-03`
- `NFR-M03-04`

## 8. Thành phần UI dự kiến

- SearchBar
- FilterPanel
- SortDropdown
- ProductGrid
- Pagination
- NoResult
- SearchKeywordStats

## 9. Cấu trúc thư mục

```text
m03-search/
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

- **Server Component (SEO/ISR):** /search, /category/[slug] — vỏ trang SSR cho SEO; kết quả có thể stream.
- **Client Component:** Bộ lọc, sắp xếp, autocomplete và phân trang phía client; /admin/analytics/search.
- **Component dùng toàn site:** SearchBar (Header toàn site).
- `public.client.js` là cửa ngõ import chéo duy nhất phía client.
- `client/components/`: mỗi component trong bảng UI Components ở mục 8 là một file khung; các component toàn site đã có bản tối giản dùng được.
- `client/hooks/`: một hook TanStack Query cho mỗi API-Mxx-yy; `client/services/`: một hàm cho mỗi API, đọc path từ `src/shared/api-endpoints.js`.
- `client/pages/`: khung `ModuleStub`; khi triển khai phải giữ đúng chế độ render ở trên.
