# Blueprint Thiết Kế Website KAIDO E-commerce
Website Design Blueprint v1.0 (Draft để review)
# Ghi chú nguồn dữ liệu
Nguồn: file PDF thiết kế (9 màn hình desktop) và SRS KAIDO v2.0 (IEEE 830). Blueprint lấy layout và phong cách từ PDF, còn logic, dữ liệu và thanh toán lấy từ SRS.
Phạm vi SRS đã rà soát: mục 1–2 (mục tiêu, phạm vi, RBAC), bảng UI Components của M01–M10, quy tắc nghiệp vụ và validation của M01 và M05, NFR hệ thống (SYS-NFR-01 đến 07). Quy tắc chi tiết của M02–M04 và M06–M10 mới rà ở mức tiêu đề và UI.
# 0. Điểm mâu thuẫn cần chốt trước khi thiết kế
PDF là bản template mẫu (thương hiệu “rainbow rattles”, giá USD, nội dung placeholder). SRS mô tả hệ thống KAIDO bán lẻ tại Việt Nam.
| # | Hạng mục | PDF thiết kế | SRS yêu cầu | Đề xuất xử lý |
|---|---|---|---|---|
| 1 | Thương hiệu | rainbow rattles, logo cầu vồng | KAIDO | Thay logo, tên, footer, email |
| 2 | Tiền tệ | $ (USD), 2 số thập phân | VNĐ (ví dụ ngưỡng COD 3.000.000 VNĐ) | Hiển thị 290.000đ, không dùng số thập phân |
| 3 | Thanh toán | Credit card (có ô số thẻ), PayPal | COD, VNPAY, MoMo, ZaloPay | Bỏ form thẻ trên site, chuyển sang cổng thanh toán (PCI-DSS, SYS-NFR-04) |
| 4 | Địa chỉ | Town/City, State, ZIP (kiểu Mỹ) | Tỉnh–Huyện–Xã (cascade), SĐT 10 số | Thiết kế lại theo hành chính VN |
| 5 | Quyền checkout | Checkout mở cho mọi người | Ma trận RBAC M05: khách vãng lai chỉ “xem chính sách”, tạo đơn thuộc khách hàng | Khách hàng cần quyết định: bắt buộc đăng nhập hay cho guest checkout (nếu cho guest thì phải sửa ma trận) |
| 6 | Ngưỡng Freeship | “Free shipping over $150” | SRS chưa chốt số tiền | Xác nhận ngưỡng bằng VNĐ |
| 7 | Hạn sử dụng | PDP có “EXP: 06/08/2026” | Không có yêu cầu hạn sử dụng cho đồ chơi | Bỏ nếu không áp dụng |
| 8 | Chính sách đổi trả | “Return within 7 days” | Có quy trình RMA (M06) | Đối chiếu số ngày với chính sách chính thức |
| 9 | Giờ làm việc & địa chỉ | “NewYork time”, địa chỉ Miami FL | Vận hành tại Việt Nam | Sửa theo giờ Việt Nam và địa chỉ thật |
| 10 | Mobile | Không có bản mobile | SYS-NFR-06: Mobile/Tablet/Desktop | Phải thiết kế thêm (xem mục 1.4) |

Lỗi nội dung trong PDF cần sửa:
Logo và header: “rainbooW” (sai chữ hoa). Footer: “Customer sevice” (thiếu chữ “r”). “24h hour follow up” (thừa chữ).
Checkout: ô “Order notes (optional)” lại có dấu * bắt buộc.
Placeholder “Join”, “Gray” trong ô Họ/Tên không phù hợp, nên dùng placeholder mô tả như “Nguyễn”.
Tên sản phẩm “Magna etiam tempor orci” lặp lại nhiều lần, cần dữ liệu thật.
Trang danh mục có lúc “Showing 1–9 of 24” và lúc “Showing 1–6 of 24”: chọn một kiểu phân trang thống nhất.
“Free shipping” và “Free ship” dùng hai cách viết khác nhau trong dải thông báo và dải dịch vụ.
# 1. Tổng quan hệ thống thiết kế (Design System & Branding)
## 1.1. Định hướng phong cách
Định vị: cửa hàng đồ chơi trẻ em trực tuyến, khách mục tiêu là phụ huynh. Giao diện cần tạo cảm giác vui tươi, an toàn, đáng tin cậy.
Style: playful nhưng có trật tự (“Friendly Clarity”). Bo góc mềm (radius 12–24px), màu pastel kết hợp các màu chủ đạo sáng, nhiều khoảng trắng, icon tròn, minh họa nhẹ.
Từ khóa cảm xúc: vui tươi, an toàn, gọn gàng, ấm áp, giáo dục.
Tránh: màu quá chói trên nền lớn, font trang trí khó đọc, hiệu ứng nhấp nháy, minh họa có nội dung không phù hợp với hình ảnh sản phẩm.
Moodboard gợi ý: site đồ chơi giáo dục có nền pastel, bo tròn, ảnh trẻ em thật đang chơi (theo mục “Recent photoshoots” trong PDF).
## 1.2. Bảng màu (Color Palette)
Mã HEX dưới đây là ước lượng bằng mắt từ ảnh PDF, không phải số đo chính xác. Cần lấy mã thật từ file Figma/Adobe gốc hoặc dùng color picker trước khi lập design tokens.
| Vai trò | Tên màu | Mã HEX (ước lượng) | Ứng dụng |
|---|---|---|---|
| Primary | Brand Blue | #1385B5 | Top bar, nút Thêm vào giỏ, nút tìm kiếm, link, tiêu đề phụ |
| Primary Hover | Deep Blue | #0E6D96 | Trạng thái hover/active của Primary |
| Secondary | Rainbow Coral | #F4685B | Logo, icon mạng xã hội, điểm nhấn thương hiệu |
| Accent (CTA) | Sunny Yellow | #FFE61E | Nút Shop now, Tiến hành đặt hàng (chữ đen trên nền vàng) |
| Sale / Error | Sale Red | #F0524B | Badge SALE, cảnh báo hết hàng, lỗi form |
| Price Sale | Success Green | #22A34A | Giá khuyến mãi, trạng thái Còn hàng, thành công |
| Rating | Star Gold | #FFC107 | Icon sao đánh giá |
| Background | White | #FFFFFF | Nền chính |
| Surface Mint | Mint Tint | #E6F4F1 | Nền khối dịch vụ, Newsletter, footer |
| Surface Pink | Blush Tint | #FCEBEC | Nền card testimonial |
| Surface Blue | Sky Tint | #E3F3FA | Banner quảng bá, khối Customer care |
| Text Primary | Ink | #1F2A37 | Tiêu đề, nội dung chính |
| Text Secondary | Slate | #6B7280 | Mô tả, nhãn phụ, breadcrumb |
| Text Disabled | Mist | #9CA3AF | Giá gốc gạch ngang, placeholder |
| Border | Fog | #E5E7EB | Viền card, input, divider |

Màu cầu vồng (Rainbow Gradient) dùng cho logo và trang trí: #F4685B → #F7A23B → #FCD34D → #6CC59B → #3EA6DE → #9B7FD4. Không dùng cho nền text.
Kiểm tra tương phản (WCAG AA):
Chữ trắng trên #1385B5: khoảng 4.5:1 (cần kiểm tra lại bằng công cụ).
Chữ trắng trên #FFE61E: không đạt. Nút vàng phải dùng chữ #1F2A37.
Giá xanh #22A34A trên nền trắng: có thể cần đậm hơn (#15803D) cho chữ nhỏ.
## 1.3. Quy chuẩn kiểu chữ (Typography)
Font (ước lượng từ PDF): heading có dạng bo tròn, đậm (gần với Fredoka). Body có dạng hình học, mềm (gần với Nunito hoặc Quicksand).
Đề xuất: heading Fredoka (600–700), body Nunito (400–700). Cả hai hỗ trợ đầy đủ tiếng Việt có dấu.
Fallback: “Fredoka”, “Nunito”, system-ui, -apple-system, “Segoe UI”, Roboto, sans-serif.
Dùng subset Vietnamese khi tải font để giảm dung lượng.
| Cấp | Desktop (≥1024px) | Mobile (<768px) | Weight | Line-height | Ghi chú |
|---|---|---|---|---|---|
| H1 | 44px | 30px | 700 | 1.2 | Một H1 duy nhất mỗi trang |
| H2 | 34px | 26px | 700 | 1.25 | Tiêu đề section |
| H3 | 26px | 22px | 600 | 1.3 | Tiêu đề khối nhỏ, tên module sidebar |
| H4 | 22px | 19px | 600 | 1.35 | Tên sản phẩm trong danh sách lớn |
| H5 | 18px | 17px | 600 | 1.4 | Tiêu đề card, tiêu đề form |
| H6 | 16px | 16px | 600 | 1.4 | Nhãn nhóm, tiêu đề footer |
| Body L | 18px | 17px | 400 | 1.6 | Mô tả chính, đoạn giới thiệu |
| Body M | 16px | 16px | 400 | 1.6 | Nội dung mặc định |
| Body S | 14px | 14px | 400 | 1.5 | Mô tả phụ, ghi chú |
| Caption | 12px | 12px | 500 | 1.4 | Badge, ngày đăng, nhãn nhỏ |
| Price | 20px | 18px | 700 | 1.2 | Giá bán chính |
| Price Old | 14px | 13px | 400 | 1.2 | Giá gốc gạch ngang, màu Mist |

Quy tắc: không dùng chữ dưới 12px. Độ dài dòng 45–75 ký tự cho đoạn mô tả. Không viết hoa toàn bộ quá một dòng.
## 1.4. Giao diện Responsive
| Thông số | Mobile | Tablet | Desktop |
|---|---|---|---|
| Breakpoint | < 768px | 768–1023px | ≥ 1024px |
| Container | 100%, padding 16px | 100%, padding 24px | max-width 1200px |
| Lưới (Grid) | 4 cột, gutter 16px | 8 cột, gutter 20px | 12 cột, gutter 24px |
| Lưới sản phẩm | 2 cột | 3 cột | 3–4 cột |
| Header | Hamburger, logo giữa, icon giỏ và tài khoản | Menu rút gọn, search thu gọn | Đầy đủ: logo, menu, search, icon |
| Sidebar lọc | Drawer từ dưới lên, nút “Bộ lọc (n)” | Drawer | Cột trái cố định (~260px) |
| Mini-cart | Full-screen sheet | Drawer phải (~400px) | Drawer phải (~400px) |
| PDP | Gallery vuốt ngang, sticky bar dưới đáy có giá và nút Thêm vào giỏ | Gallery 1 cột, info bên dưới | Gallery trái 50%, info phải 50% |
| Checkout | 1 cột, summary thu gọn ở đầu | 1 cột | 2 cột (form 60%, summary 40%) |
| Bottom nav | Tuỳ chọn: Trang chủ, Danh mục, Giỏ, Tài khoản | Không | Không |
| Hero banner | Cao ~360px, tỷ lệ 4:5 | ~420px | ~520px, tỷ lệ 16:6 |

# 2. Cấu trúc sơ đồ trang (Sitemap & User Flows)
## 2.1. Ma trận màn hình PDF và module SRS
| # | Màn hình (PDF) | Route theo SRS | Module chính | Ghi chú |
|---|---|---|---|---|
| 1 | Trang chủ | / | M02, M09, M10, M03 | Có đủ 9 khối, cần thêm HomeHeroSlider |
| 2 | Danh sách sản phẩm (lưới và danh sách) | /category/:slug, /products | M02, M03 | Thiếu bộ lọc đa diện, lọc độ tuổi |
| 3 | Chi tiết sản phẩm | /products/{slug} | M02, M10 | Thiếu variant selector, AgeBadge, trạng thái tồn kho |
| 4 | Giỏ hàng | /cart | M04 | Thiếu CartSummaryCard đầy đủ, OutOfStockAlert |
| 5 | Thanh toán | /checkout | M05 | Sai phương thức thanh toán và địa chỉ |
| 6 | Blog / Tin tức | /blog, /news | M09 | Thiếu trang chi tiết bài viết |
| 7 | Liên hệ | Không có trong SRS | — | Cần xác nhận, có thể map với ticket M10 |
| 8 | FAQ | /faq, /faqs, /help | M10 | Ba route trùng nhau, cần chọn một |
| — | Header và Footer | Toàn site | M01, M04, M02, M03 | Xem mục 3.9 |

## 2.2. Màn hình có trong SRS nhưng chưa có trong PDF
| Nhóm | Màn hình / Component | Route | Ưu tiên |
|---|---|---|---|
| Tài khoản | AuthModal (Đăng nhập, Đăng ký, Google Login) | Modal toàn site | Cao |
| Tài khoản | Hồ sơ, sổ địa chỉ, đổi mật khẩu | /account/profile, /addresses, /security | Cao |
| Tìm kiếm | Kết quả tìm kiếm, NoResult | /search | Cao |
| Đơn hàng | Trang thành công, lịch sử đơn, chi tiết và timeline | /order-success/{code}, /account/orders/{code} | Cao |
| Đơn hàng | Modal hủy đơn, form đổi trả | /account/orders/{id}/return | Trung bình |
| Khuyến mãi | Danh sách voucher, Flash Sale | /promotions | Cao |
| Thành viên | Điểm thưởng, hạng thành viên, lịch sử điểm | /account/loyalty, /loyalty/history | Trung bình |
| Hỗ trợ | Danh sách ticket, khung chat | /account/support, /{ticket_id} | Trung bình |
| Đánh giá | Modal viết review, tổng quan sao | PDP và lịch sử đơn | Trung bình |
| Trạng thái | Trang 404, lỗi server, giỏ trống, bảo trì | Toàn site | Trung bình |
| Admin | Dashboard, sản phẩm, đơn hàng, kho, vận chuyển, marketing, phân tích, người dùng, đánh giá | /admin/* | Cao (back-office) |

## 2.3. Luồng người dùng chính
Luồng mua hàng: Trang chủ → Danh mục hoặc Tìm kiếm → Chi tiết sản phẩm → Thêm giỏ (MiniCart Drawer) → Giỏ hàng (/cart) → Đăng nhập (nếu cần) → Thanh toán (/checkout) → COD: Confirmed, hoặc Online: chuyển cổng thanh toán → Đặt hàng thành công (/order-success/{code}) → Theo dõi đơn (/account/orders/{code}) → Nhận hàng → Đánh giá sản phẩm hoặc Đổi trả nếu cần.
Luồng phụ:
Không tìm được sản phẩm: Search → NoResult → gợi ý từ khóa phổ biến → Danh mục.
Thanh toán thất bại hoặc quá 20 phút: trang trạng thái thanh toán → đơn tự hủy (BR-M05-02) → nút Đặt lại giỏ hàng.
Hết hàng sau khi thêm giỏ: cảnh báo đỏ trong dòng sản phẩm → khóa nút thanh toán cho đến khi người dùng sửa số lượng.
# 3. Phân tích chi tiết từng trang / màn hình
## 3.1. Trang chủ
Route: / | Mã SRS: M02, M03, M09, M10
Mục đích và CTA chính: dẫn khách vào danh mục theo độ tuổi và khám phá sản phẩm nổi bật. CTA chính: Shop now (hero). CTA phụ: chọn danh mục, thêm vào giỏ.
Bố cục và cấu trúc thành phần:
Header và navigation: topbar thông báo freeship (CMS), Login/Register (hoặc avatar khi đã đăng nhập). Logo, menu Trang chủ, Shop (mega menu theo M02), Blog, Liên hệ, FAQ. Search bar có autocomplete (M03), icon giỏ có CartBadge (M04). Sticky header khi cuộn.
Hero section (HomeHeroSlider, M09): headline “Play, learn, & grow!” lấy từ CMS, sub-headline 1–2 dòng, ảnh trẻ em đang chơi (WebP, có alt text), nút vàng Shop now. Bổ sung theo SRS: slider auto-play (khuyến nghị 5 giây), dừng khi hover, pagination chấm tròn, swipe trên mobile.
Danh mục nhanh (5 icon tròn): Playsets, Control Toys, Educational Toys, Eco-Friendly Toys, Stuffed Toys. Lấy từ cây danh mục M02 (danh mục cấp 1).
Top picks (tab Featured, Best seller, New arrivals): lưới 4 cột desktop, 2 cột mobile, 8 sản phẩm.
Banner đôi: “Discover the Joy of Play” và “Eco-Friendly Toys, Flash sale 30%”. Lấy từ M09.
Customer Loves (4 sản phẩm): sản phẩm có rating cao hoặc bán chạy.
Testimonials (carousel 3 thẻ): đánh giá khách hàng, nền Blush Tint, có mũi tên trái và phải.
Recent photoshoots (lưới 4 ảnh): không có trong SRS. Nên quản lý qua M09 hoặc bỏ nếu không cần.
Dịch vụ (3 khối): Customer care 24h, Free shipping, Return within 7 days. Nội dung đọc từ CMS.
Newsletter: ô email và nút Join, ưu đãi 15% cho đơn đầu. Không có chi tiết trong SRS, cần xác nhận cách lưu email và quyền gửi tin.
Footer: xem mục 3.9.
Khớp nối nghiệp vụ và dữ liệu:
| Dữ liệu hiển thị | Nguồn SRS | Ghi chú |
|---|---|---|
| Banner hero, tiêu đề, CTA | M09 (HomeHeroSlider) | Quản trị qua /admin/marketing/banners |
| Icon danh mục | M02 (cây danh mục) | Chỉ hiển thị danh mục đang bật |
| Giá sản phẩm (price_regular, giá khuyến mãi) | M02 | Giá lớn hơn 0, đơn vị VNĐ |
| Badge SALE, Mới | M09 (Flash Sale), M02 (ngày tạo) | Badge SALE chỉ hiện khi có giá khuyến mãi còn hiệu lực |
| Sao đánh giá, số lượt | M10 (ProductRatingSummary) | Trung bình và số lượt đánh giá |
| Tình trạng tồn kho | M08 (StockLevelBadge) | Hết hàng: vô hiệu hóa nút thêm giỏ |
| Testimonials | M10 | Chỉ hiển thị đánh giá đã được duyệt |

Quy tắc tương tác và validation:
Nút Thêm vào giỏ bị vô hiệu hóa khi sản phẩm hết hàng, hiện tooltip “Hết hàng”.
Slider tạm dừng auto-play khi người dùng hover hoặc focus bằng bàn phím.
Newsletter: kiểm tra định dạng email trước khi gửi, hiện thông báo thành công hoặc lỗi.
## 3.2. Danh sách sản phẩm và danh mục
Route: /category/:slug (và /products) | Mã SRS: M02, M03
Mục đích và CTA chính: giúp khách lọc theo độ tuổi, giá, thương hiệu để tìm đúng sản phẩm. CTA: mở sản phẩm, thêm vào giỏ, áp bộ lọc.
Bố cục và cấu trúc thành phần:
Breadcrumb: Trang chủ / Danh mục.
Sidebar trái (FilterPanel):
Danh mục: cây đa cấp, mục đang chọn có màu Primary, có dấu + và – để mở rộng.
Lọc giá: thanh trượt hai đầu theo VNĐ, nút Áp dụng.
Lọc đa diện (M03): độ tuổi (ví dụ 0–12 tháng, 1–3 tuổi, 3+ tuổi), thương hiệu, chất liệu, còn hàng, đang giảm giá. PDF chưa có các bộ lọc này.
Sản phẩm phổ biến: 3 sản phẩm có ảnh, giá, sao.
Khối nội dung chính:
H1 là tên danh mục.
Thanh công cụ: nút chuyển lưới và danh sách, SortDropdown (mặc định, giá tăng, giá giảm, mới nhất, bán chạy), số kết quả “Hiển thị 1–9 trên 24 kết quả”.
ProductGrid: thẻ sản phẩm gồm ảnh, badge SALE hoặc Mới, tên, giá gốc và giá bán, sao, icon yêu thích và thêm giỏ.
Chế độ danh sách (PDF có biến thể này): ảnh bên trái, mô tả ngắn, nút Thêm vào giỏ. Mobile nên mặc định là lưới.
Phân trang (M03): số trang và Trang trước, Trang sau. Dùng phân trang thay vì Xem thêm để khớp PDF và tốt cho SEO.
Khớp nối nghiệp vụ và dữ liệu:
| Dữ liệu | Nguồn | Ghi chú |
|---|---|---|
| Tên danh mục, breadcrumb | M02 | Slug theo route /category/{slug} |
| Số kết quả | M03 | Tổng số theo bộ lọc hiện tại |
| Thẻ sản phẩm | M02, M10 | Dùng chung component ProductCard |
| Badge độ tuổi (AgeBadge) | M02 | Ví dụ “3+ Tuổi”, “6–12 Tuổi” (PDF chưa có) |
| Trạng thái Hết hàng, Đang giảm giá | M03 (ProductGrid) | Xem StockLevelBadge (M08) |
| Thương hiệu, chất liệu | M02 (thuộc tính) | Chỉ hiện giá trị có sản phẩm |

Quy tắc tương tác và validation:
Thanh trượt giá lấy giá trị nhỏ nhất và lớn nhất thực tế của danh mục, không hard-code.
Bộ lọc thay đổi thì cập nhật query string trên URL để chia sẻ được và dùng được nút Back.
Không có kết quả: hiện NoResult với gợi ý từ khóa phổ biến và nút xóa bộ lọc.
Sản phẩm hết hàng vẫn hiển thị nhưng có tag Hết hàng.
## 3.3. Chi tiết sản phẩm (PDP)
Route: /products/{slug} | Mã SRS: M02, M04, M10
Mục đích và CTA chính: cung cấp đủ thông tin để khách quyết định mua. CTA chính: Thêm vào giỏ. CTA phụ: yêu thích, so sánh.
Bố cục và cấu trúc thành phần:
Breadcrumb: Trang chủ / Danh mục / Tên sản phẩm.
Khối sản phẩm (2 cột trên desktop):
ProductGallery (trái): ảnh lớn có zoom, thumbnail cuộn ngang, mobile vuốt ngang.
Thông tin (phải):
H1: tên sản phẩm.
Giá bán (giá khuyến mãi nổi bật), giá gốc gạch ngang.
ProductRatingSummary rút gọn: sao và “(14 đánh giá)”, liên kết xuống tab đánh giá.
Mô tả ngắn.
Variant selector (chưa có trong PDF, cần bổ sung): màu sắc hoặc phiên bản, vì SRS có biến thể sản phẩm.
AgeBadge, ví dụ “2–5 tuổi” (PDF chỉ có dòng text “Tags: 2–5 years”).
Bộ điều chỉnh số lượng (– 1 +), nút Thêm vào giỏ (Primary), icon yêu thích và so sánh.
Trạng thái tồn kho: Còn hàng, Sắp hết hàng (còn n sản phẩm), Hết hàng.
Bảng thông số ngắn: SKU, Danh mục, Độ tuổi. Bỏ EXP nếu không áp dụng.
Khối thanh toán an toàn: thay logo thẻ quốc tế bằng logo VNPAY, MoMo, ZaloPay, COD.
Body:
Tabs Mô tả và Đánh giá (14): mô tả là rich text từ M02. Đánh giá gồm ProductRatingSummary (điểm lớn 4.8/5, thanh tiến trình từ 5 sao đến 1 sao), danh sách review, StoreReplyBox (phản hồi của cửa hàng có nền xám hoặc xanh nhạt), nút Viết đánh giá mở ReviewSubmissionModal.
Sản phẩm liên quan: 4 ProductCard.
Sticky bar mobile: tên sản phẩm rút gọn, giá, nút Thêm vào giỏ cố định dưới đáy.
Khớp nối nghiệp vụ và dữ liệu:
| Dữ liệu | Nguồn SRS | Ghi chú |
|---|---|---|
| Tên, mô tả, ảnh, thương hiệu | M02 | Editor rich text và upload kéo thả (AdminProductForm) |
| Giá bán, giá gốc | M02 (price_regular), M09 (khuyến mãi) | VNĐ |
| Biến thể, SKU | M02 | Mỗi biến thể có SKU và tồn kho riêng |
| Tồn kho khả dụng | M08 (Available = On-hand − Reserved) | Hiển thị theo biến thể đang chọn |
| Điểm đánh giá, phân bố sao | M10 (ProductRatingSummary) | Chỉ tính đánh giá đã duyệt |
| Verified Reviews | M10 (F01, ràng buộc Verified) | Gắn nhãn cho đánh giá từ khách đã mua |
| Độ tuổi phù hợp | M02 (thuộc tính) | Hiển thị AgeBadge |

Quy tắc tương tác và validation:
Số lượng tối thiểu là 1, tối đa bằng tồn khả dụng của biến thể. Nếu vượt, hiện OutOfStockAlert và khóa nút tăng.
Đổi biến thể: cập nhật giá, ảnh và tồn kho ngay, không tải lại trang.
Nút Thêm vào giỏ đang xử lý: hiện spinner và khóa nút để tránh bấm nhiều lần.
Viết đánh giá: chỉ hiện với khách đã mua sản phẩm (theo M10). Form gồm chọn sao, nội dung, tải ảnh (giới hạn số lượng và dung lượng cần xác nhận).
## 3.4. Giỏ hàng
Route: /cart (và MiniCartDrawer toàn site) | Mã SRS: M04
Mục đích và CTA chính: xem lại đơn trước khi thanh toán, sửa số lượng, áp voucher. CTA chính: Tiến hành đặt hàng (vàng).
Bố cục và cấu trúc thành phần:
Breadcrumb: Trang chủ / Giỏ hàng.
Bảng giỏ hàng (CartItemRow), các cột: ảnh thumbnail, tên, biến thể, đơn giá, bộ nút +/– số lượng, thành tiền, nút xóa.
Cột phải (CartSummaryCard): Tạm tính, Giảm giá (0 khi chưa áp dụng), Ước tính phí ship, Tổng thanh toán, nút Tiến hành đặt hàng (Accent vàng).
Ô voucher (CouponInputBox): ô nhập mã và nút Áp dụng trong CartSummaryCard. Khi đã áp mã, hiển thị mã kèm nút gỡ.
Hàng nút dưới: Tiếp tục mua sắm (Secondary). Bỏ nút Update cart nếu cập nhật số lượng tự động.
Trạng thái rỗng: minh họa, dòng chữ “Giỏ hàng của bạn đang trống”, nút Khám phá đồ chơi.
Khớp nối nghiệp vụ và dữ liệu:
| Dữ liệu | Nguồn | Ghi chú |
|---|---|---|
| Ảnh, tên, biến thể, đơn giá | M02 | Snapshot giá khi thêm vào giỏ, cập nhật khi giá đổi |
| Số lượng, tồn khả dụng | M08 | Cảnh báo khi vượt tồn |
| Voucher, giảm giá | M07 | Mỗi đơn tối đa 1 mã tiền hàng và 1 mã freeship (M05-F05) |
| Phí ship ước tính | M06, M05 | Chính xác khi chọn địa chỉ ở checkout |
| Giỏ khách và giỏ thành viên | M04 | Gộp giỏ khi đăng nhập (/cart/merge) |

Quy tắc tương tác và validation:
Mỗi dòng sản phẩm có OutOfStockAlert nếu hết hàng hoặc số lượng vượt tồn. Khi đó nút Tiến hành đặt hàng bị khóa.
Xóa sản phẩm: hiện hộp xác nhận ngắn.
Áp voucher thứ hai cùng loại: hiện thông báo “Đơn hàng chỉ áp dụng tối đa 1 mã giảm giá và 1 mã freeship”.
Mã không hợp lệ hoặc hết hạn: hiện lỗi màu đỏ ngay dưới ô nhập.
Cập nhật số lượng: debounce 500ms, hiện loading nhỏ trên dòng sản phẩm.
Mini-cart: hiển thị tối đa 3 dòng, có tổng tiền và nút Thanh toán ngay.
## 3.5. Thanh toán (Checkout)
Route: /checkout | Mã SRS: M05 (quyền truy cập: xem mục 0, dòng 5)
Mục đích và CTA chính: thu thập thông tin giao hàng, chọn phương thức thanh toán và đặt hàng. CTA chính: Đặt hàng.
Bố cục và cấu trúc thành phần:
Header rút gọn: logo, icon giỏ, không có menu dài để khách tập trung thanh toán.
Cột trái (form, 60%):
Thông tin giao hàng (CheckoutShippingForm): họ và tên (bắt buộc), số điện thoại (bắt buộc), email, Tỉnh/Thành → Quận/Huyện → Phường/Xã (dropdown cascade), địa chỉ cụ thể, ghi chú đơn (tùy chọn, không có dấu *), chọn địa chỉ đã lưu nếu đã đăng nhập.
Phương thức vận chuyển: STANDARD hoặc EXPRESS (radio).
Phương thức thanh toán (PaymentMethodSelector): radio có icon COD, VNPAY, MoMo, ZaloPay. Bỏ phần Credit card và PayPal của PDF.
Cột phải (OrderSummarySidebar, 40%): danh sách sản phẩm (ảnh nhỏ, tên, số lượng, thành tiền), ô voucher, Tạm tính, Giảm giá, Phí vận chuyển, Tổng cộng (VNĐ), nút Đặt hàng, dòng cam kết “Thanh toán an toàn và được mã hóa”.
Khớp nối nghiệp vụ và dữ liệu:
| Dữ liệu | Nguồn | Ghi chú |
|---|---|---|
| Tỉnh, Huyện, Xã | Danh mục hành chính | Bắt buộc chọn đúng trong danh mục |
| Phí ship theo địa chỉ và phương thức | M06 (ĐVVC GHN, GHTK) | Gọi API /orders/checkout-summary |
| Các mức tiền | M05 | Snapshot khi đặt hàng (BR-M05-05) |
| Phương thức thanh toán | M05 (COD, VNPAY, MOMO, ZALOPAY) | Đồng bộ với cấu hình cổng thanh toán |
| Voucher | M07 | Áp dụng trước khi đặt hàng |

Validation theo SRS:
| Trường | Quy tắc | Thông báo lỗi gợi ý |
|---|---|---|
| Họ và tên (recipient_name) | 2–50 ký tự, không ký tự đặc biệt hoặc chuỗi vô nghĩa | “Vui lòng nhập họ tên từ 2 đến 50 ký tự” |
| Số điện thoại | 10 chữ số, đầu số hợp lệ 03, 05, 07, 08, 09 | “Số điện thoại không hợp lệ” |
| Tỉnh, Huyện, Xã | Bắt buộc, chọn đúng trong danh mục | “Vui lòng chọn Tỉnh/Thành phố” |
| Địa chỉ cụ thể | Tối thiểu 5 ký tự | “Địa chỉ cần ít nhất 5 ký tự” |
| Phương thức thanh toán | Bắt buộc chọn một trong 4 giá trị | “Vui lòng chọn phương thức thanh toán” |
| Phương thức vận chuyển | STANDARD hoặc EXPRESS | — |

Trạng thái và thông báo đặc thù:
COD giá trị cao (trên 3.000.000 VNĐ): hiện thông báo đơn sẽ được nhân viên gọi điện xác nhận. Trạng thái đơn là Pending_Approval.
Thanh toán online: sau khi đặt hàng, chuyển sang trang chờ thanh toán có đồng hồ đếm ngược 20 phút (BR-M05-02). Hết giờ: thông báo đơn đã hủy và có nút Đặt lại.
Đang xử lý: khóa nút Đặt hàng và hiện spinner sau khi bấm, tránh tạo đơn trùng.
Tồn kho thay đổi: nếu một SKU vừa hết hàng, hiện modal báo lỗi và đưa khách về giỏ hàng.
Lỗi từ cổng thanh toán: hiện thông báo và giữ nguyên thông tin đã nhập.
## 3.6. Đặt hàng thành công và theo dõi đơn
Route: /order-success/{code}, /account/orders/{code} | Mã SRS: M05 (OrderSuccessCard), M06 (OrderTrackingTimeline)
Hai màn hình này không có trong PDF, cần thiết kế thêm.
OrderSuccessCard: icon thành công màu xanh lá, tiêu đề “Đặt hàng thành công!”, mã đơn, tổng tiền, phương thức thanh toán, nút Tiếp tục mua hàng và Theo dõi đơn.
OrderTrackingTimeline: dòng thời gian ngang (desktop) hoặc dọc (mobile): Chờ xử lý → Đã duyệt → Đang đóng gói → Đang giao → Đã giao. Bước hiện tại tô màu Primary, bước đã qua có dấu tích.
CarrierTrackingCard: nhật ký vận chuyển từ đơn vị vận chuyển (thời gian, địa điểm, mô tả).
Nút hành động theo trạng thái: Hủy đơn (chỉ khi Pending hoặc Confirmed, theo BR-M05-04), Yêu cầu đổi trả (khi đã giao), Liên hệ CSKH (khi đang xử lý hoặc đang giao).
## 3.7. Blog và tin tức
Route: /blog, /news | Mã SRS: M09
Mục đích và CTA chính: cung cấp cẩm nang và kiến thức về đồ chơi cho phụ huynh, tạo lưu lượng tự nhiên cho SEO. CTA: đọc bài, lọc theo chủ đề, nhận ưu đãi.
Bố cục và cấu trúc thành phần:
Breadcrumb và H1 “Blog” hoặc “Cẩm nang đồ chơi”.
Sidebar trái: ô tìm kiếm bài viết; danh mục (Phát triển giáo dục, An toàn đồ chơi, Xu hướng, Câu chuyện khách hàng, Sự kiện và khuyến mãi); bài viết gần đây (3 mục); thẻ phổ biến; banner quảng bá dọc (lấy từ M09).
Lưới bài viết (ArticleCard): ảnh cover, badge ngày đăng, tiêu đề H2, tóm tắt 2 dòng, link Đọc tiếp. Desktop dùng danh sách dọc như PDF, mobile một cột.
Phân trang: số trang và Trước, Sau.
Quy tắc và lưu ý:
Tóm tắt tối đa khoảng 160 ký tự để dùng cho meta description.
Bài chưa có ảnh: dùng ảnh mặc định đúng màu thương hiệu.
Thiếu trang chi tiết bài viết trong PDF. Cần thiết kế thêm /blog/{slug} với mục lục và bài liên quan.
## 3.8. Liên hệ và FAQ
### 3.8.1. Liên hệ
Route: không có trong SRS (xem mục 0). Đề xuất /contact.
Breadcrumb và H1 “Liên hệ”.
Ba thẻ thông tin: số điện thoại, email, địa chỉ cửa hàng thật tại Việt Nam (thay cho Miami).
Bản đồ nhúng (cần kiểm tra chính sách cookie) bên trái, form liên hệ bên phải.
Form: họ tên, số điện thoại, email, nội dung, nút Gửi.
Khuyến nghị: khách đã đăng nhập thì gửi form thành ticket hỗ trợ (M10, CustomerTicket) để có lịch sử. Khách chưa đăng nhập thì gửi qua email nội bộ.
Validation: họ tên bắt buộc, SĐT đúng 10 số, email đúng định dạng, nội dung có độ dài tối thiểu (cần thống nhất).
### 3.8.2. FAQ
Route: /faq, /faqs, /help. SRS có cả ba. Nên chọn /faq và chuyển hướng các route còn lại để tránh trùng nội dung khi SEO.
H1: “Câu hỏi thường gặp”.
Thanh tìm kiếm trong FAQ (theo FaqAccordion, M10).
FaqAccordion: câu hỏi nhóm theo chủ đề (Đơn hàng, Thanh toán, Đổi trả, Tài khoản). Câu đầu tiên mở sẵn như trong PDF.
Nút phụ: “Vẫn cần hỗ trợ? Liên hệ chúng tôi”.
Dữ liệu lấy từ CMS (M10). Nội dung “Lorem ipsum” trong PDF cần thay bằng nội dung thật.
## 3.9. Header và Footer (toàn site)
Header:
Topbar (có thể đóng): thông báo ưu đãi (ví dụ miễn phí vận chuyển cho đơn từ một ngưỡng VNĐ), Đăng nhập và Đăng ký, hoặc avatar tài khoản.
Hàng chính: logo (link về trang chủ), menu (Trang chủ, Cửa hàng với mega menu, Khuyến mãi, Blog, FAQ, Liên hệ), SearchBar có autocomplete (M03), icon giỏ có badge số lượng (M04).
Mega menu Cửa hàng: danh mục cấp 1 kèm icon và banner nổi bật (M02). Bỏ mục Pages vì không có ý nghĩa nghiệp vụ.
Hành vi: sticky khi cuộn. Mobile dùng hamburger, ô tìm kiếm mở toàn màn hình.
Footer:
Cột 1: logo, slogan ngắn, icon mạng xã hội (Instagram, TikTok hoặc Facebook, Pinterest), dùng màu Rainbow Coral.
Cột 2 (Tài khoản): Theo dõi đơn hàng, Chính sách và điều khoản, Yêu thích (cần xác nhận vì SRS không nêu rõ), Góp ý.
Cột 3 (Hỗ trợ khách hàng): giờ làm việc theo giờ Việt Nam, số điện thoại, email.
Hình trang trí (minh họa đồ chơi bập bênh): dùng alt rỗng và aria-hidden vì chỉ là trang trí.
Dòng bản quyền: “© 2026 KAIDO Store. Bảo lưu mọi quyền.” (chưa có trong PDF, nên thêm).
# 4. Quy chuẩn linh kiện UI và trạng thái
## 4.1. Buttons và Controls
| Loại | Nền | Chữ | Viền | Hover | Active | Disabled | Ứng dụng |
|---|---|---|---|---|---|---|---|
| Primary | #1385B5 | #FFFFFF | Không | #0E6D96 | #0A5878 | Nền #D1D5DB, chữ #6B7280 | Thêm vào giỏ, Đăng nhập, Gửi |
| Accent (CTA) | #FFE61E | #1F2A37 | Không | #F5D90A | #E6C800 | Nền #F3F4F6 | Shop now, Tiến hành đặt hàng |
| Secondary | Trắng | #1385B5 | #1385B5, 1.5px | Nền #E3F3FA | Nền #C7E8F5 | Viền #D1D5DB | Tiếp tục mua sắm, Xem thêm |
| Ghost | Trong suốt | #1385B5 | Không | Nền #E3F3FA | Nền #C7E8F5 | Chữ #9CA3AF | Hành động phụ trong bảng |
| Danger | #F0524B | #FFFFFF | Không | #D93F39 | #B9322D | Nền #FCA5A5 | Hủy đơn, Xóa |
| Icon | Tròn 40px | #1F2A37 | Không | Nền #F3F4F6 | Nền #E5E7EB | Opacity 40% | Yêu thích, so sánh, xóa dòng |

Quy tắc chung: chiều cao tối thiểu 44px trên mobile (vùng chạm), bo góc 12px, nút chỉ có icon phải có aria-label. Focus ring 2px màu Primary, offset 2px.
## 4.2. Forms và Inputs
| Thành phần | Mô tả | Trạng thái lỗi |
|---|---|---|
| Text field | Viền #E5E7EB, bo 12px, cao 48px, label nổi hoặc phía trên | Viền đỏ #F0524B, icon cảnh báo, thông báo dưới trường |
| Dropdown (Tỉnh, Huyện, Xã) | Cascade: chọn cấp trên mới mở cấp dưới, cấp dưới reset khi cấp trên đổi | “Vui lòng chọn …” |
| Checkbox | Vuông 20px, bo 4px, dấu tích màu Primary | Viền đỏ nếu bắt buộc mà chưa tick |
| Radio | Tròn 20px, kèm icon phương thức thanh toán | Viền đỏ, thông báo dưới nhóm |
| Datepicker | Dùng khi cần chọn ngày (ví dụ lọc đơn ở admin) | Ngày không hợp lệ: thông báo dưới trường |
| File upload | Vùng kéo thả nét đứt, nút Chọn ảnh, hiện thumbnail sau khi tải | Sai định dạng hoặc quá dung lượng: thông báo đỏ, không hiện thumbnail |
| Password | Icon hiện và ẩn mật khẩu, thanh độ mạnh | Thiếu tiêu chí: liệt kê tiêu chí chưa đạt |
| Ô số lượng (stepper) | Nút – và +, ô số ở giữa | Vượt tồn: OutOfStockAlert và khóa nút + |

Quy tắc xử lý lỗi:
Hiển thị lỗi khi người dùng rời trường (on blur), không chỉ khi bấm gửi.
Lỗi form tổng: hiện banner đỏ đầu form, tự cuộn đến trường lỗi đầu tiên.
Không xóa dữ liệu người dùng đã nhập khi có lỗi.
## 4.3. Modal, Popup và Thông báo
Modal:
AuthModal: tab Đăng nhập và Đăng ký, nút Đăng nhập với Google, đóng bằng nút X hoặc phím Esc.
CancelOrderModal: chọn lý do (radio), ghi chú tùy chọn, nút Xác nhận hủy (Danger) và Quay lại.
ReviewSubmissionModal: chọn sao, nội dung, tải ảnh thực tế.
Xác nhận hành động: xóa sản phẩm khỏi giỏ, khóa tài khoản (admin), xóa địa chỉ.
GoodsReceiptModal (admin): tạo phiếu nhập kho.
Thông báo:
| Loại | Màu | Ví dụ nội dung (theo SRS) | Thời gian hiển thị |
|---|---|---|---|
| Thành công | Xanh lá | “Đã thêm sản phẩm vào giỏ hàng”, “Đặt hàng thành công” | 3 giây |
| Lỗi | Đỏ | “Tài khoản bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần” | Đến khi người dùng đóng |
| Cảnh báo | Cam | “Số lượng vượt tồn kho, vui lòng giảm số lượng” | Đến khi người dùng đóng |
| Thông tin | Xanh dương | “Đơn COD trên 3.000.000đ sẽ được gọi điện xác nhận” | Hiện cố định trong form |

Vị trí: toast ở góc trên bên phải (desktop) hoặc đáy màn hình (mobile). Không che nút hành động chính.
# 5. Ghi chú phát triển và chuẩn kỹ thuật (Dev & SEO Notes)
## 5.1. Hiệu ứng và chuyển động
| Hiệu ứng | Thông số đề xuất | Ghi chú |
|---|---|---|
| Hover card sản phẩm | Nâng lên 4px, bóng đổ nhẹ, 200ms ease | Chỉ desktop |
| Hover nút | Đổi màu nền, 150ms | Theo bảng mục 4.1 |
| Hero auto-play | 5 giây mỗi slide, dừng khi hover hoặc focus | Có nút tạm dừng |
| Flash Sale countdown | Cập nhật mỗi giây, đổi màu đỏ khi còn dưới 1 giờ | Đồng bộ với thời gian server |
| Skeleton loading | Khung xám nhấp nhẹ khi tải danh sách | Thay cho spinner toàn trang |
| Scroll reveal | Fade-in nhẹ khi section vào khung nhìn, 400ms | Tắt khi prefers-reduced-motion |
| Chuyển trang | Không dùng hiệu ứng nặng | Ưu tiên tốc độ |
| Mini-cart | Trượt từ phải, 250ms | — |

Nguyên tắc: mọi chuyển động phải tắt được qua prefers-reduced-motion. Không dùng animation lặp vô hạn ngoài slider và spinner.
## 5.2. Chuẩn SEO On-page
Cấu trúc heading: mỗi trang có đúng một H1 (tên danh mục, tên sản phẩm, tiêu đề bài viết, “Câu hỏi thường gặp”, “Giỏ hàng”). Trang chủ: H1 là headline hero, các section dùng H2, tiêu đề card dùng H3.
Alt text hình ảnh:
Sản phẩm: mô tả thật, có tên và đặc điểm. Ví dụ: “Bộ xếp hình thả khối Blocks shape-sorting cho bé từ 2 đến 5 tuổi”.
Banner: mô tả nội dung khuyến mãi, không ghi chữ “banner”.
Ảnh trang trí: alt rỗng.
Metadata và URL:
Title tối đa 60 ký tự, meta description tối đa 160 ký tự, mỗi trang có giá trị riêng.
URL dạng slug không dấu, không ID vô nghĩa: /products/bo-xep-hinh-blocks-shape-sorting.
Canonical cho các trang lọc (ví dụ /category/…?price=) để tránh trùng nội dung.
Sitemap XML tự sinh, gồm sản phẩm, danh mục, bài viết.
Structured data (JSON-LD) cho sản phẩm: Product, Offer (giá VNĐ, availability), AggregateRating. Thêm BreadcrumbList cho breadcrumb và FAQPage cho trang FAQ.
## 5.3. Hiệu năng và tốc độ tải trang
Mục tiêu theo SRS (SYS-NFR-01): FCP dưới 1.5 giây trên 4G tiêu chuẩn.
Ảnh: chuyển sang WebP hoặc AVIF, dùng srcset và sizes, nén ảnh sản phẩm xuống dưới 200KB. Ảnh trong PDF rất nặng, cần tối ưu khi lên production.
Lazy loading: loading=“lazy” cho ảnh dưới màn hình đầu. Ảnh hero dùng fetchpriority=“high” và preload.
Font: chỉ tải weight cần dùng, subset Vietnamese, font-display: swap.
JavaScript: code splitting theo route, không tải thư viện slider nặng nếu có giải pháp nhẹ hơn.
CSS: critical CSS nội tuyến cho phần trên màn hình.
Caching: cache tĩnh dài hạn cho asset có hash, cache API danh mục và sản phẩm ngắn hạn.
Skeleton thay cho spinner để giảm cảm giác chờ.
## 5.4. Trải nghiệm người dùng và khả năng truy cập (Accessibility)
Phần WCAG là đề xuất bổ sung, SRS không nêu cụ thể mức đạt.
Chuẩn đề xuất: WCAG 2.1 mức AA.
Tương phản: chữ thường tối thiểu 4.5:1, chữ lớn 3:1. Kiểm tra kỹ nút vàng, giá xanh lá và badge.
Bàn phím: mọi thành phần tương tác dùng được bằng Tab, thứ tự focus hợp lý, có focus ring rõ.
Ngữ nghĩa: dùng đúng thẻ (nav, main, footer, button), không dùng div làm nút.
Icon không có chữ: có aria-label (yêu thích, so sánh, giỏ hàng, xóa).
Form: mỗi input có label liên kết, lỗi gắn với trường qua aria-describedby, thông báo lỗi được đọc bởi screen reader (role=“alert”).
Modal: giữ focus trong modal, trả focus về nút đã mở khi đóng.
Slider: có nút tạm dừng, không tự chạy nếu người dùng bật reduce motion.
Ngôn ngữ: lang=“vi” trên thẻ html.
## 5.5. Bảo mật và tuân thủ
Mọi kết nối qua HTTPS/TLS 1.3 (SYS-NFR-04).
Không nhập số thẻ trên website. Form thẻ trong PDF phải bị loại bỏ, thanh toán chuyển sang cổng VNPAY, MoMo, ZaloPay (PCI-DSS do cổng đảm nhiệm).
Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số. Khóa 15 phút sau 5 lần sai (BR-M01-02, BR-M01-03).
Thông báo lỗi đăng nhập chung chung, không tiết lộ email có tồn tại hay không.
## 5.6. Bàn giao cho các nhóm
| Nhóm | Bàn giao |
|---|---|
| Thiết kế (UI/UX) | Bản mobile và tablet cho các màn hình trong PDF; màn hình còn thiếu (mục 2.2); design tokens (màu, font, spacing, radius, shadow); bộ component đủ trạng thái |
| Frontend | Component library theo mục 4; quy chuẩn responsive mục 1.4; spec animation mục 5.1; checklist SEO mục 5.2 |
| Backend | Danh sách API theo SRS (mỗi module có mục API dự kiến); quy tắc BR và validation để triển khai phía server |
| Tester | Bảng validation (mục 3.5) và trạng thái lỗi (mục 4) làm test case; kịch bản timeout 20 phút, khóa tài khoản, tồn kho đồng thời |
| Khách hàng | Danh sách mục 6 cần chốt |

# 6. Việc cần xác nhận trước khi thi công
Thương hiệu: xác nhận dùng KAIDO và logo chính thức.
Tiền tệ và định dạng số: VNĐ, dấu chấm phân cách nghìn.
Phương thức thanh toán: cổng nào tích hợp trước (VNPAY, MoMo, ZaloPay) và có COD không.
Guest checkout: có cho khách vãng lai đặt hàng không, hay bắt buộc đăng nhập (ảnh hưởng luồng và RBAC).
Ngưỡng freeship và phí ship mặc định.
Chính sách đổi trả: số ngày và điều kiện (ảnh hưởng nội dung dải dịch vụ và quy trình RMA).
Danh sách danh mục thật và cấu trúc độ tuổi.
Wishlist: có cần không (PDF có icon và link, SRS không nêu rõ).
Nút so sánh sản phẩm: có trong PDF nhưng không có trong SRS.
Hạn sử dụng (EXP): có áp dụng cho mặt hàng nào không.
Trang liên hệ: gửi email hay tạo ticket hỗ trợ.
Mã màu và font chính thức từ file thiết kế gốc (thay các giá trị ước lượng ở mục 1).
Bản mobile: ai thiết kế và khi nào bàn giao.