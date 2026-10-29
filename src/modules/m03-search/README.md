# M03 — Tìm kiếm, lọc và sắp xếp

- **Mã SRS:** `TOY-M03`
- **Thư mục:** `src/modules/m03-search`
- **Trạng thái:** đã triển khai đầy đủ 4 API, storefront `/search`, autocomplete toàn site và trang admin `/admin/analytics/search`.

## 1. Mục tiêu và phạm vi

Tìm kiếm sản phẩm theo từ khóa không dấu, autocomplete, faceted filter, sắp xếp, phân trang và thống kê từ khóa.

M03 chỉ ĐỌC catalog từ M02 qua `public.server.js` (`getSearchCatalog`). Không đọc trực tiếp bảng `products` và không ghi dữ liệu M02. Bảng duy nhất M03 ghi là `search_history`.

## 2. Chức năng theo SRS

| Mã CN     | Tên chức năng                              | API / ghi chú                       |
| --------- | ------------------------------------------ | ----------------------------------- |
| `M03-F01` | Tìm kiếm sản phẩm theo từ khóa             | API-M03-01, `searchProducts`        |
| `M03-F02` | Gợi ý từ khóa tự động                      | API-M03-02, tối đa 8 gợi ý          |
| `M03-F03` | Lọc theo danh mục và thương hiệu           | API-M03-01 (`category_id`,`brand_id`) |
| `M03-F04` | Lọc theo khoảng giá                        | API-M03-01 (`price_min`,`price_max`) |
| `M03-F05` | Lọc theo độ tuổi và giới tính              | API-M03-01 (`age_group`,`gender`)   |
| `M03-F06` | Lọc theo tình trạng                        | API-M03-01 (`in_stock`,`on_sale`)   |
| `M03-F07` | Sắp xếp kết quả                            | API-M03-01 (`sort`)                 |
| `M03-F08` | Phân trang kết quả                         | API-M03-01 (`page`,`limit`)         |
| `M03-F09` | Số lượng kết quả theo bộ lọc và xóa bộ lọc | API-M03-01 (`facets`)               |
| `M03-F10` | Xử lý không có kết quả                     | API-M03-03 + `NoResult`             |
| `M03-F11` | Lưu lịch sử tìm kiếm                       | Ghi nội bộ `search_history`         |
| `M03-F12` | Từ khóa phổ biến và thống kê               | API-M03-03, API-M03-04              |

Tổng: **12 FR** theo SRS (không đổi mã SRS).

## 3. API thuộc module

| Mã API       | Method | Endpoint                          | Quyền             |
| ------------ | ------ | --------------------------------- | ----------------- |
| `API-M03-01` | GET    | `/api/v1/search/products`         | public (rate limit) |
| `API-M03-02` | GET    | `/api/v1/search/autocomplete`     | public            |
| `API-M03-03` | GET    | `/api/v1/search/popular-keywords` | public            |
| `API-M03-04` | GET    | `/api/v1/search/statistics`       | ADMIN, MARKETING  |

Registry tại `src/shared/api-endpoints.js` (trạng thái `IMPLEMENTED`); route sinh bởi `npm run gen:routes`, không sửa tay.

### Hợp đồng phản hồi chính (API-M03-01)

```json
{
  "keyword": "xe dap",
  "total": 24,
  "page": 1,
  "limit": 12,
  "total_pages": 2,
  "results": ["…ProductSummary của M02…"],
  "facets": {
    "category": [{ "id": "…", "name": "Xe đạp", "slug": "xe-dap", "count": 10 }],
    "brand": [{ "id": "…", "name": "KAIDO", "count": 6 }],
    "price": { "min": 250000, "max": 9000000 },
    "age_group": [{ "value": "KID", "label": "Trẻ em", "count": 4 }],
    "gender": [{ "value": "BOY", "label": "Bé trai", "count": 3 }],
    "in_stock": [{ "value": true, "label": "Còn hàng", "count": 20 }],
    "on_sale": [{ "value": true, "label": "Đang khuyến mãi", "count": 7 }]
  }
}
```

- `page` vượt tổng số trang được kẹp về trang cuối (BR-M03-07).
- Số đếm facet được tính với **mọi bộ lọc trừ chính facet đó**, nên người dùng thấy trước kết quả khi chọn thêm.
- Mặc định `limit=12`, tối đa 48.

## 4. Bảng dữ liệu sở hữu

- `search_history` — cột `user_id`, `guest_session_id`, `keyword`, `normalized_keyword`, `result_count`, `created_at`.

CHECK constraint yêu cầu `user_id` hoặc `guest_session_id`, nên lịch sử chỉ ghi khi request có danh tính:

- Người dùng đăng nhập → `user_id`.
- Khách vãng lai có header `x-guest-session-id` → `guest_session_id`.
- Tìm kiếm nội bộ/SSR không có actor → bỏ qua ghi, vẫn trả kết quả.
- Chỉ ghi ở `page=1` và có `keyword` để tránh nhiễu do phân trang cuộn.
- Lỗi ghi lịch sử là **warning không chặn** tìm kiếm (NFR-M03-03).

## 5. Hợp đồng public.server.js

| Hàm                     | Tham số | SRS     | Mục đích                                                    |
| ----------------------- | ------- | ------- | ----------------------------------------------------------- |
| `searchCatalogIndex`    | `input` | M03-F01 | Cho module nội bộ tái sử dụng tìm kiếm (cùng pipeline API). |
| `getPopularSearchTerms` | `limit` | M03-F12 | Từ khóa phổ biến dùng chung cho gợi ý.                      |

Module khác chỉ được import `src/modules/m03-search/public.server.js` (ESLint `kaido/no-deep-cross-module-imports`).

## 6. Phụ thuộc và bên sử dụng

**Phụ thuộc:**

- M02 — đọc catalog ACTIVE qua `getSearchCatalog()` (name, brand, description, SKU, categories, giá, tồn kho).
- M08 — trạng thái tồn đi kèm catalog M02 (`stock_status`: `IN_STOCK` / `OUT_OF_STOCK` / `UNKNOWN`).

**Bên sử dụng:**

- Storefront `/search` (facets + sort + phân trang + trạng thái rỗng).
- Header toàn site — `SearchBar` autocomplete (≥2 ký tự).
- Admin `/admin/analytics/search` (ADMIN, MARKETING).

## 7. Yêu cầu phi chức năng

| Mã           | Cách đáp ứng                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| `NFR-M03-01` | Chuẩn hóa không dấu, gộp khoảng trắng, bỏ HTML; từ khóa tối đa 100 ký tự.   |
| `NFR-M03-02` | Catalog cache trong bộ nhớ 15 giây; lọc/xếp hạng trong JS, không gọi DB lặp. |
| `NFR-M03-03` | Lỗi M02 → `SERVICE_UNAVAILABLE` (503); lỗi lịch sử không làm hỏng tìm kiếm. |
| `NFR-M03-04` | `withApi` áp rate limit cho API tìm kiếm; lịch sử dùng khóa phiên ẩn danh.   |

## 8. Thành phần UI

| Component / Page         | Route / vị trí       | Ghi chú                                                       |
| ------------------------ | -------------------- | ------------------------------------------------------------- |
| `SearchPage`             | `/search`            | Điều khiển URL, parse bộ lọc, reset trang khi đổi bộ lọc.     |
| `FilterPanel`            | `/search` sidebar    | Facet có số đếm, khoảng giá, độ tuổi, giới tính, tình trạng.  |
| `SortDropdown`           | `/search` header     | Liên quan / mới nhất / giá / tên.                             |
| `ProductGrid`            | `/search`            | Tái sử dụng `ProductCard` của M02; skeleton, lỗi 503 + thử lại. |
| `Pagination`             | `/search`            | Ẩn khi 1 trang; khóa khi đang chuyển.                          |
| `NoResult`               | `/search`            | Từ khóa phổ biến, xóa bộ lọc, gợi ý `/products`.               |
| `SearchBar`              | Header toàn site     | Autocomplete ≥2 ký tự, tối đa 8 gợi ý.                        |
| `SearchKeywordStats`     | Admin                | Bảng hạng/từ khóa/lượt với thanh tỷ lệ.                       |
| `AdminSearchAnalyticsPage` | `/admin/analytics/search` | Lọc khoảng ngày, thẻ tổng quan, top & từ khóa 0 kết quả. |

### Thứ tự xếp hạng khi `sort=relevance` (BR-M03-06)

1. Mọi token của từ khóa phải xuất hiện (AND), so khớp trên name/brand/SKU/description.
2. Điểm cộng cụm: name +120, SKU +80, brand +50, description +25.
3. Điểm cộng theo token: name +12, SKU +8, brand +6, description +3.
4. Hòa điểm → ưu tiên sản phẩm mới hơn (`created_at`), sau đó theo tên.

Từ khóa không dấu khớp có dấu (`đ → d`, bỏ dấu kết hợp NFD). Chỉ sản phẩm `ACTIVE` được đánh chỉ mục; sản phẩm hết hàng vẫn xuất hiện trừ khi `in_stock=true` (BR-M03-05). Khi M08 báo `UNKNOWN`, sản phẩm được coi là còn hàng.

## 9. Cấu trúc thư mục

```text
m03-search/
├── README.md
├── public.client.js        # cửa ngõ import chéo phía client
├── public.server.js        # hợp đồng cho module khác (chỉ file này được import chéo)
├── client/
│   ├── components/         # SearchBar, FilterPanel, SortDropdown, ProductGrid, Pagination, NoResult, SearchKeywordStats
│   ├── hooks/              # use-search-products, use-autocomplete-keyword, use-get-popular-keywords, use-get-search-statistics
│   ├── pages/              # SearchPage, AdminSearchAnalyticsPage
│   └── services/search.api.js
└── server/
    ├── constants.js
    ├── handlers.js         # API-M03-01..04
    ├── repository.js       # search_history (phân trang 1000 dòng/lần)
    ├── service.js          # chuẩn hóa, xếp hạng, facet, lịch sử, thống kê
    ├── validation.js       # Zod theo từng API
    └── __tests__/module.test.js
```

## 10. Quy ước triển khai

- Mọi file server bắt đầu bằng `import 'server-only'`.
- Handler trả dữ liệu qua `withApi`; lỗi dùng `AppError`/`ERROR_CODES`.
- Không đặt secret trong module; đọc qua `src/server/env.js`.
- Client đọc path API từ `src/shared/api-endpoints.js`, không hard-code URL.
- Giữ mã SRS trong comment/tên hàm để truy vết.

## 11. Giới hạn đã biết

- `search_history` không có cột lưu bộ lọc/sắp xếp; thống kê phản ánh từ khóa và số kết quả, không phân tích theo facet.
- Catalog được đọc toàn bộ sản phẩm ACTIVE và cache 15 giây trong tiến trình. `listSearchCatalogRows` của M02 chưa phân trang nên bị giới hạn bởi max-rows của PostgREST (mặc định 1000); khi catalog lớn hơn cần chuyển sang tìm kiếm phía DB (full-text/index) hoặc phân trang khi nạp cache.
- `/category/[slug]` vẫn do M02 đảm nhiệm (SSR, filter/sort/phân trang riêng); M03 chỉ phụ trách `/search` và autocomplete.
- Facet được tính trên catalog đã áp từ khóa + bộ lọc khác; đây là ngữ nghĩa "chọn thêm sẽ thấy bao nhiêu", không phải tổng toàn kho.
