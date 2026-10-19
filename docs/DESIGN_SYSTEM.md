# Design System — KAIDO E-commerce

Tài liệu này chuyển Blueprint thiết kế (mục 0, 1, 4, 5) thành quy chuẩn triển khai cho frontend. Nguồn gốc: [Blueprint_Thiet_ke_Website_KAIDO.md](source/Blueprint_Thiet_ke_Website_KAIDO.md).

## 1. Nguồn token và giới hạn hiện tại

| Hạng mục                        | Nguồn                                              | Trạng thái                     |
| ------------------------------- | -------------------------------------------------- | ------------------------------ |
| Màu, typography, radius, shadow | `src/styles/tokens.css`, `tailwind.config.js`      | Đã có token                    |
| Mã HEX                          | Ước lượng bằng mắt từ ảnh PDF                      | **Chưa phải số đo chính thức** |
| Font                            | Google Fonts qua `next/font` (`Fredoka`, `Nunito`) | Đã tải                         |
| Component                       | `src/shared/ui`, `src/modules/*/public.client.js`  | Skeleton + trạng thái cơ bản   |

> **Việc cần làm trước go-live:** lấy mã màu, font size, spacing thật từ Figma/Adobe gốc hoặc color picker trên PDF chất lượng cao, rồi cập nhật đồng thời `tokens.css` và `tailwind.config.js`. Không hard-code màu trong component — chỉ dùng token.
>
> **Ghi chú font:** Fredoka không có subset tiếng Việt. `next/font` chỉ tải `latin` + `latin-ext` cho Fredoka; các dấu tiếng Việt rơi xuống Nunito (đứng sau trong `fontFamily.heading`). Cần kiểm tra lại với thiết kế nếu muốn đồng nhất glyph heading. Xem [OPEN_DECISIONS.md](OPEN_DECISIONS.md).

## 2. Bảng màu

Hex viết thường trong CSS, viết hoa trong tài liệu cho dễ đọc.

| Vai trò             | Token                            | HEX                   | Dùng cho                                                             |
| ------------------- | -------------------------------- | --------------------- | -------------------------------------------------------------------- |
| Primary             | `primary.DEFAULT`                | `#1385B5`             | Top bar, nút “Thêm vào giỏ”, nút tìm kiếm, link, tiêu đề phụ         |
| Primary hover       | `primary.hover`                  | `#0E6D96`             | Hover/focus nút primary                                              |
| Primary active      | `primary.active`                 | `#0A5878`             | Trạng thái nhấn                                                      |
| Accent CTA          | `accent.DEFAULT`                 | `#FFE61E`             | Nút “Shop now”, “Tiến hành đặt hàng”; **bắt buộc chữ `ink`**         |
| Accent hover/active | `accent.hover` / `accent.active` | `#F5D90A` / `#E6C800` | Trạng thái nút vàng                                                  |
| Secondary           | `secondary`                      | `#F4685B`             | Logo, icon mạng xã hội, điểm nhấn                                    |
| Sale / Error        | `sale`                           | `#F0524B`             | Badge SALE, cảnh báo, lỗi form                                       |
| Success             | `success`                        | `#22A34A`             | Giá khuyến mãi, còn hàng, thành công                                 |
| Success đậm         | `success.strong`                 | `#15803D`             | Chữ xanh lá cỡ nhỏ trên nền trắng (đạt AA)                           |
| Star                | `star`                           | `#FFC107`             | Icon sao đánh giá                                                    |
| Ink                 | `ink`                            | `#1F2A37`             | Tiêu đề, nội dung chính                                              |
| Slate               | `slate`                          | `#6B7280`             | Mô tả, nhãn phụ, breadcrumb                                          |
| Mist                | `mist`                           | `#9CA3AF`             | Giá gốc gạch ngang, placeholder (không dùng cho nội dung quan trọng) |
| Fog                 | `fog`                            | `#E5E7EB`             | Viền card, input, divider                                            |
| Surface Mint        | `surface.mint`                   | `#E6F4F1`             | Khối dịch vụ, Newsletter, footer                                     |
| Surface Blush       | `surface.blush`                  | `#FCEBEC`             | Card testimonial                                                     |
| Surface Sky         | `surface.sky`                    | `#E3F3FA`             | Banner quảng bá, khối customer care                                  |

**Rainbow** (chỉ trang trí, không dùng nền chữ): `#F4685B → #F7A23B → #FCD34D → #6CC59B → #3EA6DE → #9B7FD4`.

Quy tắc tương phản:

- Chữ trắng trên primary `#1385B5` đạt khoảng 4.5:1 — kiểm tra lại bằng công cụ trước khi chốt.
- Chữ trắng trên accent vàng **không đạt** — luôn dùng `text-ink`.
- Giá xanh cỡ nhỏ dùng `success.strong`, không dùng `success.DEFAULT`.

## 3. Typography

| Cấp       | Desktop | Mobile | Weight | Line-height | Ứng dụng                   |
| --------- | ------- | ------ | ------ | ----------- | -------------------------- |
| Display   | 56px    | —      | 700    | 1.1         | Headline hero              |
| H1        | 44px    | 30px   | 700    | 1.2         | Một H1 mỗi trang           |
| H2        | 34px    | 26px   | 700    | 1.25        | Tiêu đề section            |
| H3        | 26px    | 22px   | 600    | 1.3         | Tiêu đề khối nhỏ           |
| H4        | 22px    | 19px   | 600    | 1.35        | Tên sản phẩm danh sách lớn |
| H5        | 18px    | 17px   | 600    | 1.4         | Tiêu đề card/form          |
| H6        | 16px    | 16px   | 600    | 1.4         | Nhãn nhóm, tiêu đề footer  |
| Body L    | 18px    | 17px   | 400    | 1.6         | Mô tả chính                |
| Body      | 16px    | 16px   | 400    | 1.6         | Nội dung mặc định          |
| Body S    | 14px    | 14px   | 400    | 1.5         | Mô tả phụ, ghi chú         |
| Caption   | 12px    | 12px   | 500    | 1.4         | Badge, ngày đăng           |
| Price     | 20px    | 18px   | 700    | 1.2         | Giá bán chính              |
| Price Old | 14px    | 13px   | 400    | 1.2         | Giá gốc gạch ngang         |

Quy tắc: không dùng chữ dưới 12px; độ dài dòng 45–75 ký tự; không viết hoa toàn bộ quá một dòng.

## 4. Layout và responsive

| Thông số      | Mobile `<768px`                       | Tablet `768–1023px`          | Desktop `≥1024px`      |
| ------------- | ------------------------------------- | ---------------------------- | ---------------------- |
| Container     | 100%, padding 16px                    | 100%, padding 24px           | max-width 1200px       |
| Grid          | 4 cột, gutter 16px                    | 8 cột, gutter 20px           | 12 cột, gutter 24px    |
| Lưới sản phẩm | 2 cột                                 | 3 cột                        | 3–4 cột                |
| Header        | Hamburger, logo giữa, giỏ + tài khoản | Menu rút gọn, search thu gọn | Đầy đủ                 |
| Sidebar lọc   | Drawer từ dưới, nút “Bộ lọc (n)”      | Drawer                       | Cột trái ~260px        |
| Mini-cart     | Full-screen sheet                     | Drawer phải ~400px           | Drawer phải ~400px     |
| PDP           | Gallery vuốt ngang, sticky bar đáy    | 1 cột                        | Gallery 50% / info 50% |
| Checkout      | 1 cột, summary thu gọn đầu trang      | 1 cột                        | Form 60% / summary 40% |
| Hero          | ~360px, 4:5                           | ~420px                       | ~520px, 16:6           |

Breakpoint Tailwind: `md` = 768px, `lg` = 1024px, container dừng ở 1200px (`2xl` cũng 1200px).

## 5. Radius, elevation, motion

- Radius: `sm` 12px, `md` 16px, `lg` 20px, `xl` 24px. Card/input dùng `md`; modal/sheet dùng `xl`.
- Shadow: `card` cho card nghỉ; `lift` khi hover card (desktop). Không lạm dụng shadow để phân cấp — ưu tiên border `fog`.
- Motion:
  - Hover card: nâng 4px, 200ms ease; chỉ desktop.
  - Hover nút: đổi màu nền, 150ms.
  - Hero auto-play 5s, dừng khi hover/focus, có nút tạm dừng.
  - Flash Sale countdown cập nhật mỗi giây, đổi đỏ khi còn dưới 1 giờ; đồng bộ giờ server.
  - Skeleton thay spinner toàn trang.
  - Scroll reveal 400ms, tắt khi `prefers-reduced-motion`.
  - Mini-cart trượt phải 250ms.
- Mọi chuyển động phải tắt được qua `prefers-reduced-motion: reduce`. Không animation lặp vô hạn ngoài slider và spinner.

## 6. Component dùng chung (`src/shared/ui`)

| Component                              | Biến thể / trạng thái chính                              | Ghi chú                                                              |
| -------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `Button`                               | primary, accent, secondary, outline, ghost, danger, icon | Min-height 44px; focus ring 2px; accent dùng chữ ink; có `isLoading` |
| `Input`                                | default, error, disabled; kèm prefix/suffix              | Label liên kết, lỗi qua `aria-describedby`                           |
| `Select`                               | default, error, disabled                                 | Dùng cho tỉnh/huyện/xã, sắp xếp                                      |
| `Checkbox`                             | default, error, disabled                                 | Label bấm được                                                       |
| `Radio`                                | default, error, disabled                                 | Nhóm phương thức thanh toán, trạng thái đơn                          |
| `Badge`                                | primary, sale, success, neutral, warning                 | Badge SALE, còn hàng, hạng thành viên                                |
| `Modal`                                | default, confirm, danger                                 | Giữ focus trong modal, trả focus khi đóng, đóng bằng Esc             |
| `Pagination`                           | desktop + mobile thu gọn                                 | Một kiểu hiển thị thống nhất toàn site                               |
| `Breadcrumb`                           | —                                                        | Có JSON-LD `BreadcrumbList` ở trang dùng                             |
| `EmptyState`                           | mặc định, có CTA                                         | Giỏ trống, không có kết quả                                          |
| `Skeleton`                             | text, card, grid                                         | Dùng khi tải danh sách                                               |
| `Spinner`                              | inline                                                   | Chỉ dùng trong nút/khối nhỏ                                          |
| `Toast` / `ToastProvider` / `useToast` | success, error, info                                     | `role="status"` / `role="alert"`                                     |

## 7. Component theo module

Mỗi module export component qua `public.client.js` (client) hoặc `public.server.js` (server). Không import xuyên module bằng đường dẫn nội bộ.

| Module | Component tiêu biểu                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| M01    | `AuthModal`, `UserProfileCard`, `AddressBookManager`, `PasswordChangeForm`, `AdminUserTable`                                           |
| M02    | `MegaMenuCategory`, `ProductCard`, `ProductGallery`, `AgeBadge`, `AdminProductForm`                                                    |
| M03    | `SearchBar`, `FilterPanel`, `SortDropdown`, `ProductGrid`, `Pagination`, `NoResult`, `SearchKeywordStats`                              |
| M04    | `CartBadge`, `MiniCartDrawer`, `CartItemRow`, `CartSummaryCard`, `OutOfStockAlert`, `CouponInputBox`                                   |
| M05    | `CheckoutShippingForm`, `PaymentMethodSelector`, `OrderSummarySidebar`, `OrderSuccessCard`, `OrderTrackingTimeline`, `AdminOrderTable` |
| M06    | `OrderTrackingStepper`, `CarrierTrackingCard`, `CancelOrderModal`, `ReturnRequestForm`, `FulfillmentActions`, `DeliveryDashboard`      |
| M07    | `MembershipCard`, `PointRedemptionSlider`, `VoucherWalletModal`, `LoyaltyHistoryTable`, `AdminVoucherForm`                             |
| M08    | `StockLevelBadge`, `GoodsReceiptModal`, `StockAuditTable`, `InventoryHistoryLog`, `LowStockAlertBanner`                                |
| M09    | `HomeHeroSlider`, `FlashSaleCountdownBar`, `PromoCodeBadgeList`, `ArticleCard`, `AdminCampaignEditor`                                  |
| M10    | `ProductRatingSummary`, `ReviewSubmissionModal`, `StoreReplyBox`, `CustomerTicketList`, `TicketChatBox`, `FaqAccordion`                |

Mọi component phải có đủ trạng thái: mặc định, hover, focus, active, disabled, loading, lỗi (nếu có form), rỗng (nếu có danh sách).

## 8. Lỗi nội dung trong PDF cần sửa

Nguồn: Blueprint mục 0. Đây là các lỗi **nội dung thiết kế**, không phải lỗi code; đội thiết kế cần sửa file gốc trước khi bàn giao.

| #   | Vị trí                | Lỗi trong PDF                                    | Cách xử lý                                                        |
| --- | --------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| 1   | Logo/header           | “rainbooW” sai chữ hoa                           | Dùng “KAIDO” đúng nhận diện                                       |
| 2   | Footer                | “Customer sevice” thiếu “r”                      | “Customer service” hoặc bản dịch tiếng Việt                       |
| 3   | Footer/khối dịch vụ   | “24h hour follow up” thừa chữ                    | “Hỗ trợ 24h” hoặc “Phản hồi trong 24 giờ”                         |
| 4   | Checkout              | “Order notes (optional)” lại có dấu `*` bắt buộc | Bỏ `*`, cho phép rỗng                                             |
| 5   | Form địa chỉ          | Placeholder “Join”, “Gray”                       | Placeholder tiếng Việt: “Nguyễn”, “Văn A”, “0912345678”           |
| 6   | Card sản phẩm         | Tên “Magna etiam tempor orci” lặp lại            | Dữ liệu sản phẩm thật, không dùng Lorem ipsum                     |
| 7   | Danh mục              | Lúc “Showing 1–9 of 24”, lúc “Showing 1–6 of 24” | Chốt page size (mặc định 12 hoặc 24) và một component phân trang  |
| 8   | Dải thông báo/dịch vụ | “Free shipping” và “Free ship” dùng lẫn lộn      | Một cách viết: “Miễn phí vận chuyển” (kèm ngưỡng khi chốt)        |
| 9   | PDP                   | “EXP: 06/08/2026”                                | Bỏ — SRS không yêu cầu hạn sử dụng cho đồ chơi                    |
| 10  | PDP/khối dịch vụ      | “Return within 7 days”                           | Đối chiếu chính sách RMA M06 trước khi công bố                    |
| 11  | Footer/liên hệ        | “NewYork time”, địa chỉ Miami FL                 | Giờ Việt Nam (GMT+7), địa chỉ thật tại Việt Nam                   |
| 12  | Toàn site             | Giá USD 2 số thập phân                           | VNĐ, định dạng `290.000đ`, không thập phân                        |
| 13  | Checkout              | Form số thẻ/PayPal                               | Bỏ form thẻ; chỉ COD, VNPAY, MoMo, ZaloPay qua cổng               |
| 14  | Checkout              | Địa chỉ kiểu Mỹ (Town/State/ZIP)                 | Tỉnh–Huyện–Xã dạng cascade, SĐT 10 số                             |
| 15  | Dải ưu đãi            | “Free shipping over $150”                        | Chốt ngưỡng VNĐ trong `business-rules.js` (hiện là quyết định mở) |

Các điểm cần khách hàng chốt (guest checkout, ngưỡng freeship, số ngày đổi trả, logo chính thức) được theo dõi tại [OPEN_DECISIONS.md](OPEN_DECISIONS.md) — không tự quyết trong code.

## 9. Accessibility (WCAG 2.1 AA — đề xuất bổ sung)

SRS không nêu mức WCAG cụ thể; dự án chọn AA làm chuẩn nội bộ.

- **Tương phản:** chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1. Kiểm tra riêng nút vàng, giá xanh, badge sale.
- **Bàn phím:** mọi thành phần tương tác dùng được bằng Tab; thứ tự focus hợp lý; focus ring rõ (2px, không `outline: none` mà không thay thế).
- **Ngữ nghĩa:** dùng `nav`, `main`, `header`, `footer`, `button`; không dùng `div` làm nút.
- **Icon không chữ:** có `aria-label` (yêu thích, so sánh, giỏ hàng, xóa, đóng).
- **Form:** mỗi input có label liên kết; lỗi gắn qua `aria-describedby`; thông báo lỗi `role="alert"`.
- **Modal:** giữ focus trong modal, trả focus về nút mở, đóng bằng Esc, có `aria-modal` và tiêu đề liên kết.
- **Slider:** có nút tạm dừng; không tự chạy khi người dùng bật reduce motion.
- **Ngôn ngữ:** `<html lang="vi">`.
- **Ảnh:** alt mô tả thật; ảnh trang trí alt rỗng.
- **Không chỉ dùng màu** để truyền đạt trạng thái (badge phải có chữ, lỗi có nội dung).

## 10. SEO on-page

- Mỗi trang đúng **một H1**: tên danh mục, tên sản phẩm, tiêu đề bài viết, “Câu hỏi thường gặp”, “Giỏ hàng”. Trang chủ H1 là headline hero; section dùng H2; tiêu đề card dùng H3.
- **Title ≤ 60 ký tự**, meta description ≤ 160 ký tự, mỗi trang giá trị riêng.
- URL slug không dấu, không ID vô nghĩa: `/products/bo-xep-hinh-blocks-shape-sorting`.
- **Canonical** cho trang lọc (`/category/...?price=`) để tránh trùng nội dung.
- Sitemap XML tự sinh gồm sản phẩm, danh mục, bài viết.
- **JSON-LD:** `Product` + `Offer` (giá VNĐ, availability) + `AggregateRating`; `BreadcrumbList` cho breadcrumb; `FAQPage` cho trang FAQ.
- Alt text: sản phẩm mô tả thật kèm tên và đặc điểm; banner mô tả nội dung khuyến mãi (không ghi “banner”); ảnh trang trí `alt=""`.
- Hiệu năng liên quan SEO: ảnh WebP/AVIF, `srcset`/`sizes`, ảnh sản phẩm < 200KB, lazy-load ảnh dưới màn hình đầu, hero `fetchpriority="high"` + preload, font subset tiếng Việt + `font-display: swap`, code splitting theo route. Mục tiêu FCP < 1.5s trên 4G (SYS-NFR-01).

## 11. Checklist bàn giao thiết kế

- [ ] Mã màu và token thật từ Figma, thay thế giá trị ước lượng.
- [ ] Bản mobile và tablet cho toàn bộ màn hình trong PDF + các màn hình còn thiếu (Blueprint mục 2.2).
- [ ] Bộ component đủ trạng thái (mặc định/hover/focus/active/disabled/loading/error/empty).
- [ ] Sửa 15 lỗi nội dung ở mục 8.
- [ ] Chốt các quyết định mở liên quan nội dung: ngưỡng freeship, guest checkout, chính sách đổi trả, logo.
- [ ] Spec animation khớp mục 5 và có phương án reduce motion.
