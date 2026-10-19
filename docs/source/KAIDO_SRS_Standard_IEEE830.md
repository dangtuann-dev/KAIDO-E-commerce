TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
Hệ Thống Thương Mại Điện Tử Cửa Hàng Đồ Chơi KAIDO (KAIDO E-commerce Website)
Chuẩn cấu trúc: IEEE Std 830-1998 / ISO/IEC/IEEE 29148 | Phiên bản: v2.0 Official
Ngày hoàn thành: 18/10/2026 | Phân loại: Tài liệu kỹ thuật phân tích & thiết kế

| Mục Thông Tin | Chi Tiết Nội Dung |
|---|---|
| Tên hệ thống | KAIDO E-commerce Website — Hệ thống bán lẻ đồ chơi trẻ em trực tuyến |
| Khách hàng / Nghiệm thu | Cửa hàng đồ chơi KAIDO Store |
| Tổ chức thực hiện | Nhóm phát triển phần mềm kiến trúc & tích hợp hệ thống |
| Chuẩn tài liệu | IEEE Std 830 (Software Requirements Specification) |
| Tổng quy mô hệ thống | 10 phân hệ nghiệp vụ, 93 chức năng chi tiết, 81 quy tắc nghiệp vụ, 92 API, 53 NFRs |


1. GIỚI THIỆU TỔNG QUAN (INTRODUCTION)
1.1. Mục đích tài liệu (Purpose)
Tài liệu này xác định các yêu cầu phần mềm chính thức cho dự án xây dựng website bán hàng trực tuyến KAIDO. Tài liệu cung cấp góc nhìn toàn diện, nhất quán và có thể kiểm thử được về các chức năng, các ràng buộc kỹ thuật, quy tắc vận hành và tiêu chuẩn chất lượng. Đây là hợp đồng kỹ thuật giữa đội ngũ phát triển và chủ sở hữu cửa hàng đồ chơi KAIDO làm cơ sở cho thiết kế, thi công và nghiệm thu.
1.2. Phạm vi dự án (Project Scope)
Hệ thống KAIDO E-commerce phục vụ 2 mục tiêu song hành: (1) Cung cấp cho khách hàng kênh mua sắm đồ chơi trực quan, phân loại khoa học theo độ tuổi/thương hiệu, hỗ trợ giỏ hàng, đặt hàng và thanh toán tiện lợi; (2) Cung cấp hệ thống quản trị back-office cho nhân viên và quản lý cửa hàng để kiểm soát xuất nhập tồn kho, xử lý đơn hàng, theo dõi giao vận, vận hành marketing và chăm sóc khách hàng.
Hệ thống bao gồm 10 phân hệ chức năng tương ứng mã TOY-M01 đến TOY-M10:
| Mã Phân Hệ | Tên Phân Hệ | Phạm Vi Nghiệp Vụ Cốt Lõi | Mức Ưu Tiên |
|---|---|---|---|
| TOY-M01 | Quản lý tài khoản & người dùng | Đăng ký, đăng nhập JWT, hồ sơ cá nhân, sổ địa chỉ, phân quyền RBAC | High (Must-have) |
| TOY-M02 | Quản lý sản phẩm & danh mục | Cây danh mục đa cấp, thương hiệu, thuộc tính đồ chơi (độ tuổi, chất liệu), SKU, giá bán | High (Must-have) |
| TOY-M03 | Tìm kiếm, lọc & sắp xếp | Tìm kiếm từ khóa không dấu, gợi ý tự động (Autocomplete), bộ lọc đa diện Faceted Search | High (Must-have) |
| TOY-M04 | Quản lý giỏ hàng | Giỏ hàng nhanh Mini-cart, gộp giỏ hàng khách và thành viên, cập nhật tồn kho tức thời | High (Must-have) |
| TOY-M05 | Đặt hàng & thanh toán | Checkout One-page/Wizard, tích hợp VNPAY, MoMo, ZaloPay, COD, khóa giữ tồn kho ACID | High (Must-have) |
| TOY-M06 | Quản lý đơn hàng & giao vận | Theo dõi vòng đời đơn, tích hợp ĐVVC (GHN, GHTK), tạo vận đơn, xử lý hoàn/đổi trả hàng | High (Must-have) |
| TOY-M07 | Khuyến mãi & khách thân thiết | Tích điểm thưởng tự động, 4 hạng hội viên (Bronze, Silver, Gold, Diamond), mã voucher | High (Must-have) |
| TOY-M08 | Quản lý kho & tồn kho | Kiểm soát 3 trạng thái tồn kho (On-hand, Reserved, Available), phiếu nhập/xuất, thẻ kho | High (Must-have) |
| TOY-M09 | Quản lý nội dung & quảng bá | Banner tương tác, cẩm nang đồ chơi, chiến dịch sự kiện Flash Sale, lập lịch hiển thị | High (Must-have) |
| TOY-M10 | Hỗ trợ khách hàng & đánh giá | Đánh giá xếp hạng sao Verified Reviews, phiếu hỗ trợ CSKH (Tickets), tra cứu FAQ | High (Must-have) |


1.3. Định nghĩa, từ viết tắt (Definitions & Acronyms)
| Thuật ngữ | Ý nghĩa chi tiết trong hệ thống KAIDO |
|---|---|
| SRS | Software Requirements Specification - Tài liệu đặc tả yêu cầu phần mềm chuẩn IEEE 830. |
| SKU | Stock Keeping Unit - Mã đơn vị lưu kho duy nhất cho từng phân loại sản phẩm đồ chơi. |
| RBAC | Role-Based Access Control - Cơ chế kiểm soát truy cập dựa trên vai trò người dùng. |
| Faceted Search | Tìm kiếm đa diện cho phép người dùng chọn đồng thời nhiều bộ lọc độc lập. |
| Idempotency | Tính chất bảo đảm một API khi gọi lại nhiều lần với cùng dữ liệu không làm sai lệch trạng thái. |
| RMA | Return Merchandise Authorization - Quy trình xác nhận và tiếp nhận đổi trả sản phẩm lỗi. |
| ACID | Các thuộc tính bảo đảm tính toàn vẹn của giao dịch cơ sở dữ liệu (Atomicity, Consistency, Isolation, Durability). |


2. MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)
2.1. Bối cảnh & Mô hình luồng dữ liệu nghiệp vụ
Hệ thống vận hành theo quy trình khép kín giữa các phân hệ nghiệp vụ:
- 1. Nhập liệu Catalog & Kho: Admin tạo danh mục, sản phẩm (M02). Thủ kho lập phiếu nhập hàng (M08) làm tăng tồn kho thực tế (On-hand).
- 2. Tiếp thị & Quảng bá: Nhân viên Marketing thiết lập banner trang chủ, tin tức cẩm nang (M09) và tạo mã giảm giá voucher (M07).
- 3. Tìm kiếm & Giỏ hàng: Khách tìm kiếm (M03), xem sản phẩm (M02), thêm vào giỏ hàng (M04). Hệ thống kiểm tra số lượng khả dụng (Available = On-hand - Reserved).
- 4. Đặt hàng & Khóa kho: Khách tiến hành thanh toán (M05). Hệ thống trừ số lượng khả dụng và chuyển sang số lượng giữ chỗ (Reserved) tại M08, áp dụng voucher từ M07.
- 5. Xử lý & Giao vận: Module 6 tiếp nhận đơn. Nhân viên đóng gói, tạo vận đơn bưu tá, xuất kho thực tế (M08). ĐVVC cập nhật trạng thái qua Webhook.
- 6. Hoàn thành & Chăm sóc: Đơn giao thành công kích hoạt cộng điểm thưởng tích lũy (M07). Khách hàng gửi đánh giá và nhận hỗ trợ kỹ thuật (M10).
2.2. Phân loại người dùng & Ma trận phân quyền (User Classes & RBAC)
| Nhóm Quyền Hạn | Khách vãng lai | Khách hàng | Nhân viên kho | NV Bán hàng | NV Marketing | Admin |
|---|---|---|---|---|---|---|
| M01: Tài khoản cá nhân | Đăng ký/Login | Toàn quyền | Không | Xem thông tin đơn | Không | Quản lý toàn bộ |
| M02: Sản phẩm & Danh mục | Xem sản phẩm | Xem sản phẩm | Xem tồn kho | Xem danh sách SP | Xem danh sách SP | Toàn quyền quản trị |
| M03: Tìm kiếm & Lọc | Tra cứu | Tra cứu | Không | Tra cứu nội bộ | Xem từ khóa hot | Xem phân tích search |
| M04: Giỏ hàng | Giỏ tạm (Cookie) | Giỏ cá nhân | Không | Hỗ trợ khách | Không | Xem thống kê giỏ |
| M05: Đặt hàng & Thanh toán | Xem chính sách | Tạo đơn/Trả tiền | Không | Tạo đơn hỗ trợ | Không | Quản lý doanh thu |
| M06: Đơn hàng & Vận chuyển | Tra cứu theo mã | Xem lịch sử/Hủy | In phiếu đóng gói | Duyệt/Xử lý đơn | Không | Cấu hình đối tác ship |
| M07: Khuyến mãi & Khách thân thiết | Xem mã ưu đãi | Tích & tiêu điểm | Không | Áp mã hộ khách | Tạo mã voucher | Cấu hình cơ chế tích điểm |
| M08: Kho & Tồn kho | Không | Không | Nhập/Xuất/Kiểm kê | Xem tồn khả dụng | Không | Duyệt lệch kiểm kê |
| M09: Banner & Nội dung | Xem tin tức/banner | Xem tin tức/banner | Không | Không | Soạn bài/Up banner | Duyệt hiển thị |
| M10: Đánh giá & Hỗ trợ | Xem đánh giá | Gửi review/Ticket | Không | Trả lời ticket | Phân tích phản hồi | Kiểm duyệt đánh giá |


3. YÊU CẦU CHỨC NĂNG CHI TIẾT (SPECIFIC FUNCTIONAL REQUIREMENTS)
Mỗi phân hệ dưới đây được đặc tả theo cấu trúc tiêu chuẩn: Mục tiêu nghiệp vụ, Danh sách chức năng (FRs), Quy tắc nghiệp vụ bắt buộc (Business Rules), Quy tắc kiểm tra tính hợp lệ dữ liệu (Validation Rules), Thiết kế API giao tiếp và Thành phần giao diện (UI Components).
3.1: QUAN LY TAI KHOAN VA NGUOI DUNG (TOY-M01)
1. Tong Quan Module
- **Muc tieu**: Quan ly toan bo vong doi tai khoan nguoi dung tren he thong KAIDO E-commerce: dang ky, dang nhap, xac thuc bao mat, phan quyen (Khach hang, Nhan vien, Quan tri vien), quan ly ho so ca nhan, so dia chi giao hang va tra cuu lich su mua hang.
- **Pham vi doi tuong**: Khach hang (Guest / Registered Member), Quan tri vien (Admin), Nhan vien van hanh, Cac module noi bo can xac thuc nguoi dung (Module 4, 5, 6, 7, 10).
---
2. Danh Sach Chuc Nang Chi Tiet (Feature List)
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| **F01** | Dang ky tai khoan | Cho phep khach hang tao tai khoan moi bang Email/So dien thoai, kiem tra trung lap va kich hoat | Khach hang | Cao (Must-have) |
| **F02** | Dang nhap & Dang xuat | Dang nhap bang Email/SDT va mat khau, ho tro dang nhap Social (Google/Facebook), cap JWT Token | Khach hang, QTV | Cao (Must-have) |
| **F03** | Quan ly ho so ca nhan | Xem va cap nhat thong tin ca nhan (Ho ten, ngay sinh cua be, gioi tinh, avatar), doi mat khau | Khach hang | Cao (Must-have) |
| **F04** | Quan ly so dia chi | Them moi, chinh sua, xoa va thiet lap dia chi nhan hang mac dinh (Tinh/Huyen/Xa/So nha) | Khach hang | Cao (Must-have) |
| **F05** | Quen mat khau & Khoi phuc | Gui link hoac ma OTP qua Email/SMS de dat lai mat khau moi khi bi quen | Khach hang | Cao (Must-have) |
| **F06** | Xem lich su mua hang | Xem danh sach cac don hang da dat, loc theo thoi gian/trang thai, xem chi tiet tung don | Khach hang | Cao (Must-have) |
| **F07** | Quan ly nguoi dung (Admin) | Danh sach tai khoan, phan quyen vai tro (RBAC), khoa/mo khoa tai khoan vi pham | Quan tri vien | Cao (Must-have) |


---
3. SRS Mapping - M01
| Ma CN | SRS Ref | Ghi Chu & Dac Ta Ky Thuat |
|---|---|---|
| **F01** | M01-F01, FR01 | Kiem tra Email duy nhat (Unique), ma hoa mat khau bang Bcrypt (salt rounds >= 10). |
| **F02** | M01-F02, FR02 | Co che Access Token (JWT 15 phut) + Refresh Token (HttpOnly Cookie 7 ngay). |
| **F03** | M01-F03 | Cho phep luu thong tin ngay sinh cua con de nhan qua/voucher sinh nhat tu Module 7 & 9. |
| **F04** | M01-F04 | Moi tai khoan toi da 10 dia chi; luon co dung 1 dia chi danh dau is_default = true. |
| **F05** | M01-F05 | Ma OTP co hieu luc trong 5 phut; gioi han toi da 3 lan gui lai OTP/gio tranh spam SMS. |
| **F06** | M01-F06 | Lien ket khoa ngoai voi Module 5 & Module 6 de hien thi danh sach don va tracking code. |
| **F07** | M01-F07 | Vai tro: CUSTOMER, STAFF, WAREHOUSE_KEEPER, ADMIN. |


---
4. Quy Tac Nghiep Vu (Business Rules) - M01
| Ma BR | Tinh Huong / Dieu Kien | Hanh Vi Mong Muon & Rang Buoc |
|---|---|---|
| **BR-M01-01** | Dang ky tai khoan | Email va So dien thoai phai la duy nhat trong he thong; khong cho phep 2 tai khoan dung chung Email. |
| **BR-M01-02** | Khoa tai khoan khi dang nhap sai | Neu nhap sai mat khau lien tiep 5 lan, tai khoan bi tam khoa trong 15 phut de chong brute-force. |
| **BR-M01-03** | Bao mat mat khau | Mat khau phai dai toi thieu 8 ky tu, bao gom it nhat 1 chu hoa, 1 chu thuong, 1 chu so; khong luu plaintext. |
| **BR-M01-04** | Xoa dia chi mac dinh | Khong the xoa dia chi dang duoc dat lam mac dinh tru khi da chi dinh mot dia chi khac lam mac dinh. |
| **BR-M01-05** | Phan quyen truy cap API | Cac endpoint /api/v1/admin/* bat buoc co token chua role ADMIN hoac STAFF; tu choi (403 Forbidden) voi User thuong. |


---
5. Validation Rules - M01
| Truong Du Lieu | Kieu | Rang Buoc & Kiem Tra |
|---|---|---|
| email | string | Dinh dang email hop le (RFC 5322), do dai <= 100 ky tu |
| phone | string | 10 chu so chuan Viet Nam (bat dau bang 03, 05, 07, 08, 09) |
| password | string | 8 - 32 ky tu, chua it nhat 1 chu hoa, 1 chu thuong, 1 so |


ull_name | string | 2 - 50 ky tu, khong chua ky tu dac biet |
---
6. Danh Sach API Du Kien - M01
| Ma API | Phuong Thuc | Endpoint | Du Lieu Dau Vao | Dau Ra Du Kien |
|---|---|---|---|---|
| **API-M01-01** | POST | /api/v1/auth/register | { email, password, full_name, phone } | { user_id, email, access_token } |
| **API-M01-02** | POST | /api/v1/auth/login | { email, password } | { access_token, user_info, expires_in } |
| **API-M01-03** | GET | /api/v1/user/profile | Header Bearer Token | { id, email, full_name, phone, child_birthdate } |
| **API-M01-04** | PUT | /api/v1/user/profile | { full_name, phone, child_birthdate } | { success: true, updated_at } |
| **API-M01-05** | GET | /api/v1/user/addresses | Header Bearer Token | [{ id, recipient_name, phone, address, is_default }] |
| **API-M01-06** | POST | /api/v1/auth/forgot-password | { email } | { message: 'OTP_SENT', expired_in: 300 } |
| **API-M01-07** | GET | /api/v1/admin/users | ?page=1&role=customer | { total, users: [UserInfo] } |


---
7. UI Components - M01
| Thanh Phan UI | Mo Ta Chuc Nang | Vi Tri Ap Dung |
|---|---|---|
| AuthModal | Modal pop-up tich hop 2 tab Dang nhap va Dang ky kem nut Login Google | Toan website (khi bam icon User) |
| UserProfileCard | Khung thong tin ca nhan, avatar va nut chinh sua ho so | /account/profile |
| AddressBookManager | Danh sach cac the dia chi giao hang, nut Them dia chi moi va danh dau Mac dinh | /account/addresses |
| PasswordChangeForm | Form nhap mat khau cu, mat khau moi va xac nhan mat khau kem chi bao do manh | /account/security |
| AdminUserTable | Bang danh sach tai khoan nguoi dung cho phep loc theo vai tro va nut khoa tai khoan | /admin/users |


---
8. Yeu Cau Phi Chuc Nang (NFR) - M01
| Ma NFR | Phan Loai | Tieu Chi Do Luong |
|---|---|---|
| **NFR-M01-01** | Bao mat tuyet doi | Mat khau ma hoa Bcrypt; Access Token JWT ky bang thuat toan RS256/HS256; chong tan cong XSS & CSRF. |
| **NFR-M01-02** | Hieu nang xac thuc | Thoi gian xac thuc token tren moi request API < 30ms thong qua JWT verify hoac cache Redis session. |
| **NFR-M01-03** | Tinh san sang | Ho tro toi thieu 10.000 phien dang nhap dong thoi (Concurrent Sessions) ma khong bi nghen he thong. |


---
3.2: QUAN LY SAN PHAM VA DANH MUC (TOY-M02)
1. Tong Quan Module
- **Muc tieu**: La phan he loi (Core Catalog) quan ly toan bo du lieu danh muc phan cap da tang (Category Tree), thuong hieu do choi (Brand), thuoc tinh dac thu (nhom tuoi, gioi tinh, chat lieu, xuat xu), danh sach san pham & bien the, gia ban, hinh anh va cung cap du lieu nen tang cho toan bo cac module Tim kiem (M03), Gio hang (M04), Don hang (M05/M06) va Kho hang (M08).
- **Pham vi doi tuong**: Khach hang (Storefront), Nhan vien quan ly san pham, Quan tri vien (Admin), Cac module he thong noi bo.
---
2. Danh Sach Chuc Nang Chi Tiet (Feature List)
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| **F01** | Xem menu cay danh muc | Hien thi phan cap danh muc da tang (Cha - Con) tren Header & Navigation menu | Khach hang, QTV | Cao (Must-have) |
| **F02** | Quan ly danh muc | Them, sua, an/hien, xoa mem, keo tha sap xep thu tu danh muc do choi | Quan tri vien | Cao (Must-have) |
| **F03** | Quan ly thuong hieu | Them, sua, an/hien, xoa thuong hieu san xuat do choi (Lego, Bandai, Fisher-Price...) | Quan tri vien | Trung binh |
| **F04** | Them san pham moi | Nhap thong tin, SKU, gia niem yet, phan loai do tuoi, xuat xu, hinh anh, thong so ky thuat | QTV, Nhan vien | Cao (Must-have) |
| **F05** | Cap nhat thong tin san pham | Sua ten, mo ta chi tiet, danh muc, thuong hieu, nhom tuoi, gioi tinh phu hop, thuoc tinh | QTV, Nhan vien | Cao (Must-have) |
| **F06** | An, ngung kinh doanh & Xoa SP | Doi trang thai hien thi (Ban nhap / Dang ban / Ngung ban) hoac xoa mem san pham | Quan tri vien | Cao (Must-have) |
| **F07** | Quan ly hinh anh san pham | Tai len nhieu anh (Gallery), chon anh dai dien (Thumbnail), cat/nen anh chuan WebP | QTV, Nhan vien | Trung binh |
| **F08** | Quan ly gia & Khuyen mai san pham | Cap nhat gia niem yet, gia khuyen mai dac biet va thoi han ap dung giam gia | Quan tri vien | Cao (Must-have) |
| **F09** | Quan ly ton kho co ban | Nhap/dieu chinh so luong ton ban le, ghi nhat ky, tu dong chuyen co 'Het hang' khi ton = 0 | QTV, Nhan vien | Cao (Must-have) |
| **F10** | Xem danh sach san pham theo danh muc | Trang danh sach san pham (PLP) co phan trang, loc co ban theo tieu chi danh muc | Khach hang, QTV | Cao (Must-have) |
| **F11** | Xem chi tiet san pham (PDP) | Trang chi tiet hien thi day du thong tin, thu vien anh phong to, thong so an toan do choi, SP lien quan | Khach hang | Cao (Must-have) |
| **F12** | Cung cap API Catalog noi bo | Cung cap du lieu san pham, danh muc cho Module 3 (Tim kiem), Module 4/5 (Checkout) | He thong noi bo | Cao (Must-have) |
| **F13** | Canh bao san pham sap het hang | Bang thong bao va highlight do trong trang quan tri khi so luong ton kho cham nguong toi thieu | QTV, Nhan vien | Thap |


---
3. SRS Mapping - M02
| Ma CN | SRS Ref | Ghi Chu & Dac Ta Ky Thuat |
|---|---|---|
| **F01** | M02-F01, FR03 | Cay danh muc 2 - 3 cap: Danh muc chinh (Do choi lap rap) -> Danh muc con (Lego City, Lego Technic). |
| **F02** | M02-F02 | Slug tu dong tao tu ten tieng Viet khong dau (VD: /danh-muc/do-choi-giao-duc). Khong duoc xoa danh muc dang chua san pham active. |
| **F03** | M02-F03 | Logo thuong hieu ty le 1:1 hoac 16:9, co lien ket loc san pham theo Brand. |
| **F04** | M02-F04 | Ma SKU sinh tu dong theo quy tac: [BRAND]-[CAT]-[ID] hoac do nguoi dung tu nhap tuy bien. |
| **F05** | M02-F05 | Thuoc tinh dac thu do choi: Do tuoi (0-12m, 1-3y, 3-6y, 6-12y, 12y+), Gioi tinh (Be trai, Be gai, Unisex), Chat lieu (Nhua nguyen sinh, Go tu nhien). |
| **F06** | M02-F06 | Trang thai: DRAFT, ACTIVE, INACTIVE, DISCONTINUED. |
| **F07** | M02-F07 | Toi da 10 anh/san pham; tu dong nen kich thuoc toi uu 800x800px. |
| **F08** | M02-F08 | Rang buoc: price_sale <= price_original. Tu tinh ty le % giam gia de gan badge Sale. |
| **F09** | M02-F09 | Dong bo du lieu so luong kha dung 2 chieu voi Module 8 (Kho). |
| **F10** | M02-F10 | URL phan trang chuan SEO: /category/{slug}?page=1&sort=newest. |
| **F11** | M02-F11 | Rich Snippets Schema.org Product markup (Price, Currency, Availability, Review Rating) chuan Google Search. |
| **F12** | M02-F12 | Cung cap gRPC hoac Internal REST API voi toc do cuc nhanh phuc vu Search indexing. |
| **F13** | M02-F13 | Cau hinh nguong canh bao rieng cho tung san pham (mac dinh <= 5 mon). |


---
4. Quy Tac Nghiep Vu (Business Rules) - M02
| Ma BR | Tinh Huong / Dieu Kien | Hanh Vi Mong Muon & Rang Buoc |
|---|---|---|
| **BR-M02-01** | Tinh duy nhat cua SKU & Barcode | Moi san pham hoac bien the phai co mot SKU duy nhat tren toan he thong; khong duoc trung lap. |
| **BR-M02-02** | Xoa danh muc cha | Neu danh muc co chua danh muc con hoac san pham dang hoat dong, he thong tu choi xoa va yeu cau di doi san pham truoc. |
| **BR-M02-03** | Quy tac gia ban | Gia ban thuc te (Sale Price) khong bao gio duoc lon hon Gia niem yet (Regular Price). Neu co khuyen mai, hien thi ca 2 gia gach ngang. |
| **BR-M02-04** | Hien thi san pham ra Storefront | San pham chi xuat hien tren trang nguoi dung khi thoa man dong thoi: Trang thai la ACTIVE, danh muc cha dang ACTIVE, va khong bi gan co an. |
| **BR-M02-05** | Bien dong trang thai ton kho | Khi ton kho bang 0, co hien thi chuyen sang Het hang nhung van giu nguyen trang chi tiet de khach hang tham khao hoac dang ky nhan thong bao khi co hang lai. |


---
5. Validation Rules - M02
| Truong Du Lieu | Kieu | Rang Buoc & Kiem Tra |
|---|---|---|
| product_name | string | 5 - 200 ky tu, khong chua ma doc XSS |
| sku | string | 3 - 30 ky tu, chu hoa/so/gach ngang |
| price_regular | decimal | Bat buoc, > 0 (VND) |
| price_sale | decimal/null | Neu co: 0 <= price_sale <= price_regular |
| category_id | integer | Bat buoc chon it nhat 1 danh muc truc thuoc |
| ge_group | enum | 0-12M, 1-3Y, 3-6Y, 6-12Y, 12Y_PLUS |
| images | array[url] | Toi thieu 1 anh dai dien chinh |


---
6. Danh Sach API Du Kien - M02
| Ma API | Phuong Thuc | Endpoint | Du Lieu Dau Vao | Dau Ra Du Kien |
|---|---|---|---|---|
| **API-M02-01** | GET | /api/v1/categories/tree | Khong | [{ id, name, slug, icon, children: [...] }] |
| **API-M02-02** | GET | /api/v1/products | ?category_slug=lego&page=1&limit=24 | { total, page, limit, items: [ProductSummary] } |
| **API-M02-03** | GET | /api/v1/products/{slug} | slug | { product_details, images, brand, specs, related_products } |
| **API-M02-04** | POST | /api/v1/admin/products | { name, sku, price, category_id, brand_id, age_group, images, stock } | { product_id, sku, status } |
| **API-M02-05** | PUT | /api/v1/admin/products/{id} | { name, price, stock, status, ... } | { product_id, updated_at } |
| **API-M02-06** | DELETE | /api/v1/admin/products/{id} | id | { success: true, message: 'Da xoa mem san pham' } |
| **API-M02-07** | GET | /api/v1/internal/products/catalog-sync | ?since_timestamp=1700000000 | [{ sku, name, price, stock, status, updated_at }] |


---
7. UI Components - M02
| Thanh Phan UI | Mo Ta Chuc Nang | Vi Tri Ap Dung |
|---|---|---|
| MegaMenuCategory | Menu danh muc xo xuong da cap hien thi bieu tuong cac dong do choi va banner noi bat | Header (Storefront) |
| ProductCard | The san pham chuan thuong mai dien tu: Anh dai dien, nhan Giam gia/Moi, Ten, Gia, Danh gia sao, Nut them gio | Trang chu, Trang danh muc |
| ProductGallery | Bo anh phong to (Zoom viewer), anh thumbnail co the cuon, ho tro vuot cham tren di dong | Chi tiet san pham (PDP) |
| AgeBadge | Huy hieu gan nhan lua tuoi mau sac than thien cho be (VD: 3+ Tuoi, 6-12 Tuoi) | Tren the san pham & PDP |
| AdminProductForm | Bieu mau nhap lieu quan tri voi trinh soan thao mo ta, upload anh keo tha va cau hinh bien the | /admin/products/create |


---
8. Yeu Cau Phi Chuc Nang (NFR) - M02
| Ma NFR | Phan Loai | Tieu Chi Do Luong |
|---|---|---|
| **NFR-M02-01** | Chuan SEO & OpenGraph | 100% trang chi tiet san pham va danh muc co the Meta Title, Description, Canonical URL va Schema JSON-LD. |
| **NFR-M02-02** | Hieu nang Catalog Cache | Cay danh muc va thong tin chi tiet san pham duoc luu dem (Redis Cache), phan hoi trang chi tiet PDP < 150ms. |
| **NFR-M02-03** | Kha nang quan ly anh | Ho tro CDN phan tan hinh anh, thoi gian tai anh thumbnail san pham < 200ms tren mang 4G di dong. |


---
## MODULE 3: TIM KIEM, LOC VA SAP XEP (TOY-M03)
*(Tiep noi tu F02)*
5. Danh Sach Chuc Nang Chi Tiet
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| F01 | Tim kiem san pham theo tu khoa | Tim theo ten, thuong hieu, SKU, mo ta; ho tro khong dau | Khach hang, Quan tri vien | Cao |
| F02 | Goi y tu khoa tu dong | Hien thi goi y khi khach nhap tu 2 ky tu tro len | Khach hang | Trung binh |
| F03 | Loc theo danh muc va thuong hieu | Thu hep ket qua theo mot hoac nhieu danh muc/thuong hieu | Khach hang | Cao |
| F04 | Loc theo khoang gia | Loc theo muc gia thap nhat - cao nhat hoac khoang gia dinh san | Khach hang | Cao |
| F05 | Loc theo do tuoi va gioi tinh | Loc theo nhom tuoi va doi tuong (be trai, be gai, unisex) | Khach hang | Cao |
| F06 | Loc theo tinh trang | Loc san pham con hang hoac dang khuyen mai | Khach hang | Trung binh |
| F07 | Sap xep ket qua | Sap xep theo gia tang/giam, moi nhat, ban chay, ten A-Z | Khach hang | Cao |
| F08 | Phan trang ket qua | Chia ket qua thanh nhieu trang; hien thi tong so ket qua | Khach hang | Cao |
| F09 | So luong ket qua theo bo loc va xoa bo loc | Hien thi so luong theo tung gia tri loc; cho phep bo mot/tat ca bo loc | Khach hang | Trung binh |
| F10 | Xu ly khong co ket qua | Thong bao va goi y khi khong tim thay san pham | Khach hang | Trung binh |
| F11 | Luu lich su tim kiem | Ghi tu khoa, bo loc, so ket qua cua moi lan tim | He thong | Thap |
| F12 | Tu khoa pho bien va thong ke | Hien thi tu khoa pho bien cho khach; thong ke tu khoa cho QTV | Khach hang, QTV | Thap |


---
6. SRS Mapping - M03
| Ma CN | SRS Ref | Ghi Chu |
|---|---|---|
| F01 | M03-F01, FR04 | Must have - da xac nhan |
| F02 | M03-F02 | Autocomplete >= 2 ky tu, toi da 8 ket qua, debounce 300ms |
| F03 | M03-F03 | Multi-select danh muc/thuong hieu |
| F04 | M03-F04 | Slider gia hoac nhap tay; chuan hoa thanh so nguyen VND |
| F05 | M03-F05 | Nhom tuoi: 0-12 thang, 1-3, 3-6, 6-12, 12+ tuoi |
| F06 | M03-F06 | Checkbox "Con hang" + "Dang khuyen mai" |
| F07 | M03-F07 | Mac dinh: Phu hop; Tuy chon: Gia up/down / Moi nhat / Ban chay / Ten A-Z |
| F08 | M03-F08 | Mac dinh 12 SP/trang; URL phan anh trang hien tai (?page=) |
| F09 | M03-F09 | Hien thi facet count ben canh moi gia tri loc |
| F10 | M03-F10 | Khong co ket qua -> hien thi tu khoa pho bien + nut "Xoa bo loc" |
| F11 | M03-F11 | Ghi vao bang search_history; khong ghi neu tu khoa rong |
| F12 | M03-F12 | Dashboard Admin: top-N tu khoa + tu khoa khong co ket qua |


---
7. Quy Tac Nghiep Vu (Business Rules) - M03
| Ma BR | Dieu Kien | Hanh Vi Mong Muon |
|---|---|---|
| BR-M03-01 | Khach nhap tu khoa | Chuan hoa: bo khoang trang thua, chuyen chu thuong, bo dau tieng Viet truoc khi truy van |
| BR-M03-02 | Tu khoa > 100 ky tu | Cat bo / tu choi va thong bao loi |
| BR-M03-03 | Thay doi bo loc | Dat lai ve trang 1 cua ket qua |
| BR-M03-04 | Ket qua = 0 | Hien thi "Khong tim thay san pham phu hop" + goi y tu khoa pho bien |
| BR-M03-05 | Chi muc tim kiem | Chi lap chi muc SP o trang thai "Dang ban" va "Het hang"; khong lap "Ngung kinh doanh" |
| BR-M03-06 | Xep hang do phu hop | Khop ten > khop thuong hieu > khop mo ta |
| BR-M03-07 | Module 2 thay doi du lieu | Chi muc tim kiem duoc cap nhat dong bo (hoac gan thoi gian thuc) |


---
8. Validation Rules - M03
| Truong | Kieu | Rang Buoc |
|---|---|---|
| keyword | string | Min 1 ky tu, Max 100 ky tu; loai bo HTML tags |
| price_min | integer >= 0 | Phai <= price_max neu ca hai duoc chi dinh |
| price_max | integer > 0 | Phai >= price_min |
| page | integer >= 1 | Mac dinh = 1; neu vuot tong trang -> trang cuoi |
| sort | enum | relevance, price_asc, price_desc, newest, bestselling, name_asc |
| age_group | enum[] | 0-12m, 1-3y, 3-6y, 6-12y, 12y+ |


---
9. API Du Kien - M03
| Ma API | Phuong Thuc | Endpoint | Dau Vao Chinh | Dau Ra Du Kien |
|---|---|---|---|---|
| API-M03-01 | GET | /api/v1/search/products | keyword, category_id[], brand_id[], price_min, price_max, age_group[], gender, in_stock, on_sale, sort, page, limit | {total, page, limit, results: [Product], facets: {}} |
| API-M03-02 | GET | /api/v1/search/autocomplete | keyword (>=2 ky tu) | {suggestions: [{text, type}]} - toi da 8 |
| API-M03-03 | GET | /api/v1/search/popular-keywords | limit (tuy chon) | [{keyword, count}] |
| API-M03-04 | GET | /api/v1/search/statistics (Admin) | date_from, date_to | {top_keywords, zero_result_keywords, total_searches} |


**Ghi chu tich hop:** Module 3 **chi DOC** du lieu tu Module 2 qua API noi bo; khong ghi truc tiep vao bang san pham.
---
10. UI Components - M03
| Component | Mo Ta | Trang Ap Dung |
|---|---|---|
| SearchBar | O nhap tu khoa + nut tim; ho tro autocomplete dropdown | Header (toan trang) |
| FilterPanel | Sidebar hoac drawer bo loc da tieu chi | /search, /category/:slug |
| SortDropdown | Dropdown chon thu tu sap xep | /search, /category/:slug |
| ProductGrid | Luoi san pham + the "Het hang" / "Dang giam gia" | /search, /category/:slug |
| Pagination | Phan trang so + "Trang truoc / Trang sau" | /search, /category/:slug |
| NoResult | Thong bao khong co ket qua + goi y tu khoa pho bien | /search |
| SearchKeywordStats (Admin) | Bang tu khoa pho bien va tu khoa khong co ket qua | /admin/analytics/search |


---
11. NFR Module - M03
| Ma NFR | Loai | Noi Dung | Tieu Chi Danh Gia |
|---|---|---|---|
| NFR-M03-01 | Hieu nang | Thoi gian phan hoi tim kiem | < 1 giay voi du lieu <= 10.000 san pham |
| NFR-M03-02 | Hieu nang | Autocomplete response | < 300ms (debounce 300ms + xu ly) |
| NFR-M03-03 | Kha dung | Module phu thuoc Module 2 | Neu Module 2 loi, hien thi "He thong dang ban" thay vi loi 500 |
| NFR-M03-04 | Bao mat | Tham so URL tim kiem | Sanitize input; khong cho phep SQL/NoSQL injection qua query params |


---
3.4: QUẢN LÝ GIỎ HÀNG (TOY-M04)
1. Tổng Quan Module
- **Mục tiêu**: Cung cấp cho khách hàng trải nghiệm quản lý giỏ hàng trực quan, linh hoạt, hỗ trợ lưu trữ trạng thái giỏ hàng giữa các phiên đăng nhập/vãng lai và đồng bộ dữ liệu tồn kho, giá cả tức thời với Module 2 (Sản phẩm) & Module 8 (Kho).
- **Phạm vi đối tượng**: Khách vãng lai (Guest - lưu LocalStorage/Cookie hoặc Guest Session Redis), Khách hàng đã đăng nhập (Member/Customer - lưu Database/Account Session).
---
2. Danh Sách Chức Năng Chi Tiết (Feature List)
| Mã CN | Tên Chức Năng | Mô Tả | Người Dùng | Độ Ưu Tiên |
|---|---|---|---|---|
| **F01** | Thêm sản phẩm vào giỏ hàng | Thêm sản phẩm từ trang chi tiết (PDP) hoặc danh sách (PLP) với số lượng chỉ định; kiểm tra tồn kho tức thời | Khách hàng | Cao (Must-have) |
| **F02** | Xem giỏ hàng & Giỏ hàng nhanh (Mini-Cart) | Hiển thị danh sách sản phẩm, hình ảnh, biến thể, đơn giá, tổng tiền; hỗ trợ xem drawer mini-cart và trang chi tiết giỏ hàng | Khách hàng | Cao (Must-have) |
| **F03** | Cập nhật số lượng sản phẩm | Tăng/giảm số lượng hoặc nhập số trực tiếp; tự động tính lại tổng tiền; cảnh báo nếu vượt tồn kho khả dụng | Khách hàng | Cao (Must-have) |
| **F04** | Xóa sản phẩm khỏi giỏ hàng | Xóa từng sản phẩm đơn lẻ hoặc chọn xóa nhiều sản phẩm cùng lúc; có thông báo xác nhận | Khách hàng | Cao (Must-have) |
| **F05** | Xóa toàn bộ giỏ hàng (Clear Cart) | Làm rỗng toàn bộ giỏ hàng với 1 thao tác sau khi xác nhận | Khách hàng | Trung bình |
| **F06** | Chọn sản phẩm thanh toán | Checkbox chọn một phần hoặc toàn bộ sản phẩm trong giỏ để tiếp tục sang bước Đặt hàng & Thanh toán (Module 5) | Khách hàng | Cao |
| **F07** | Nhập mã giảm giá / Khuyến mãi sơ bộ | Áp dụng coupon/voucher cấp giỏ hàng để ước tính mức giảm giá và phí vận chuyển tạm tính | Khách hàng | Trung bình |
| **F08** | Đồng bộ giỏ hàng Guest & Member | Tự động gộp (merge) giỏ hàng tạm của khách vãng lai vào tài khoản cá nhân ngay sau khi đăng nhập thành công | Hệ thống, Khách hàng | Cao |
| **F09** | Cảnh báo biến động giá và tồn kho | Thông báo cho khách hàng khi sản phẩm trong giỏ bị đổi giá, hết hàng hoặc tồn kho khả dụng thấp hơn số lượng yêu cầu | Hệ thống, Khách hàng | Cao |
| **F10** | Lưu lại mua sau (Save for Later) | Chuyển sản phẩm từ giỏ hàng sang danh sách lưu tạm để không tính vào tổng tiền thanh toán hiện tại | Khách hàng | Thấp |


---
3. SRS Mapping - M04
| Mã CN | SRS Ref | Ghi Chú & Đặc Tả Kỹ Thuật |
|---|---|---|
| **F01** | M04-F01, FR06 | Hỗ trợ thêm cả sản phẩm đơn và biến thể (màu sắc/kích thước). Giới hạn tối đa per SKU theo chính sách kho. |
| **F02** | M04-F02 | Mini-cart hiển thị dạng Drawer slide-out bên phải màn hình hoặc dropdown khi hover icon Cart ở Header. |
| **F03** | M04-F03 | Debounce 400ms khi người dùng bấm tăng/giảm liên tục trước khi gọi API cập nhật server. |
| **F04** | M04-F04 | Cho phép Undo trong vòng 5 giây (Toast notification có nút 'Hoàn tác'). |
| **F05** | M04-F05 | Modal xác nhận: 'Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?'. |
| **F06** | M04-F06 | Cho phép select-all hoặc select từng item. Tính lại subtotal động chỉ dựa trên các item được tích chọn. |
| **F07** | M04-F07 | Liên kết với Module 9 (Khuyến mãi); hiển thị số tiền tạm tính được giảm và điều kiện áp dụng. |
| **F08** | M04-F08 | Xử lý xung đột merge: Nếu cùng 1 SKU tồn tại ở cả 2 giỏ, cộng dồn số lượng nhưng không vượt quá tồn kho khả dụng. |
| **F09** | M04-F09 | Kiểm tra tính hợp lệ tại thời điểm mở giỏ hàng và ngay trước khi bấm 'Tiến hành thanh toán'. |
| **F10** | M04-F10 | Lưu trữ tại bảng cart_saved_items liên kết với customer_id. |


---
4. Quy Tắc Nghiệp Vụ (Business Rules) - M04
| Mã BR | Tình Huống / Điều Kiện | Hành Vi Mong Muốn & Ràng Buộc |
|---|---|---|
| **BR-M04-01** | Khách thêm số lượng N | Phải kiểm tra N + current_qty <= available_stock. Nếu vượt, chỉ cho thêm tối đa số lượng còn lại và báo lỗi 'Số lượng sản phẩm trong kho không đủ'. |
| **BR-M04-02** | Sản phẩm thay đổi giá | Nếu giá sản phẩm thay đổi trong hệ thống khi đã nằm trong giỏ, cập nhật giá mới nhất và hiển thị banner cảnh báo: 'Giá của sản phẩm [Tên] đã thay đổi từ [Giá cũ] sang [Giá mới]'. |
| **BR-M04-03** | Sản phẩm chuyển trạng thái 'Hết hàng' hoặc 'Ngừng bán' | Vô hiệu hóa checkbox chọn thanh toán của sản phẩm đó, đổi trạng thái item sang disabled và hiển thị nhãn 'Hết hàng/Tạm ngưng'. |
| **BR-M04-04** | Hết hạn giỏ hàng (Expiration) | Giỏ hàng của khách vãng lai lưu trữ trong 30 ngày (Cookie/LocalStorage/Redis). Giỏ hàng của thành viên lưu vĩnh viễn cho đến khi bị xóa hoặc hoàn tất đơn. |
| **BR-M04-05** | Giới hạn số lượng mua tối đa | Số lượng mua của 1 sản phẩm không được vượt quá 20 đơn vị/lần đặt (hoặc theo hạn mức quy định riêng của từng dòng sản phẩm đồ chơi đặc thù/sưu tầm). |
| **BR-M04-06** | Hủy hoặc giảm số lượng | Khi số lượng giảm về 0, kích hoạt luồng xác nhận xóa sản phẩm khỏi giỏ. |


---
5. Validation Rules - M04
| Trường Dữ Liệu | Kiểu | Ràng Buộc & Kiểm Tra |
|---|---|---|
| product_id | integer | Bắt buộc, ID sản phẩm hợp lệ và đang hoạt động |


ariant_id | integer / null | Bắt buộc nếu sản phẩm có nhiều phân loại đồ chơi |
| quantity | integer | Bắt buộc, 1 <= quantity <= min(20, available_stock) |
|---|---|---|
| selected_items | array[id] | Tối thiểu 1 sản phẩm được chọn khi chuyển sang checkout |
| coupon_code | string | Chuỗi 3-20 ký tự, chữ hoa/số, không chứa ký tự đặc biệt |


---
6. Danh Sách API Dự Kiến - M04
| Mã API | Phương Thức | Endpoint | Dữ Liệu Đầu Vào | Đầu Ra Dự Kiến |
|---|---|---|---|---|
| **API-M04-01** | GET | /api/v1/cart | Header Token (hoặc Guest Session ID) | { cart_id, items: [...], total_items, selected_subtotal, total_discount, estimated_total } |
| **API-M04-02** | POST | /api/v1/cart/items | { product_id, variant_id, quantity } | { success: true, cart_summary: {...} } |
| **API-M04-03** | PUT | /api/v1/cart/items/{item_id} | { quantity } | { item_id, quantity, line_total, cart_subtotal } |
| **API-M04-04** | DELETE | /api/v1/cart/items/{item_id} | item_id | { success: true, message: 'Đã xóa sản phẩm' } |
| **API-M04-05** | POST | /api/v1/cart/items/bulk-delete | { item_ids: [...] } | { success: true, removed_count } |
| **API-M04-06** | POST | /api/v1/cart/merge | { guest_session_id } | { merged_cart_id, total_items } |
| **API-M04-07** | POST | /api/v1/cart/apply-coupon | { coupon_code } | { discount_amount, new_total, message } |


---
7. UI Components - M04
| Thành Phần UI | Mô Tả Chức Năng | Vị Trí Áp Dụng |
|---|---|---|
| CartBadge | Icon giỏ hàng hiển thị badge số lượng sản phẩm | Header (Toàn website) |
| MiniCartDrawer | Drawer trượt từ cạnh phải khi bấm icon giỏ, cho phép xem nhanh và bấm nút 'Thanh toán ngay' | Toàn website |
| CartItemRow | Dòng sản phẩm gồm ảnh thumbnail, tên, biến thể, bộ nút tăng giảm +/- số lượng, giá và nút Xóa | /cart & MiniCartDrawer |
| CartSummaryCard | Card tóm tắt: Tạm tính, Giảm giá, Ước tính phí ship, Tổng thanh toán và nút Call-to-Action 'Tiến hành đặt hàng' | /cart (Cột phải trang giỏ hàng) |
| OutOfStockAlert | Banner / Tag thông báo đỏ cảnh báo sản phẩm hết hàng hoặc số lượng trong giỏ vượt quá tồn kho | Trong dòng item sản phẩm |
| CouponInputBox | Ô nhập mã voucher ưu đãi kèm nút 'Áp dụng' | CartSummaryCard |


---
8. Yêu Cầu Phi Chức Năng (NFR) - M04
| Mã NFR | Phân Loại | Tiêu Chí Đo Lường |
|---|---|---|
| **NFR-M04-01** | Hiệu năng | Thao tác thêm/sửa giỏ hàng phản hồi UI ngay lập tức (Optimistic UI update), đồng bộ server phản hồi trong < 400ms. |
| **NFR-M04-02** | Tính toàn vẹn | Đảm bảo tính nhất quán (Consistent data) giữa số lượng giỏ hàng và dữ liệu tồn kho thực tế của Module 8 trước khi chuyển đơn sang Module 5. |
| **NFR-M04-03** | Khả dụng | Cơ chế Fallback giỏ hàng offline lưu trữ trên LocalStorage khi mạng chập chờn và tự động retry đồng bộ khi có kết nối trở lại. |


---
3.5: ĐẶT HÀNG VÀ THANH TOÁN (TOY-M05)
1. Tổng Quan Module
- **Mục tiêu**: Cung cấp quy trình đặt hàng (Checkout) khép kín, an toàn và thuận tiện; tích hợp các cổng thanh toán phổ biến tại Việt Nam (VNPAY, MoMo, ZaloPay, COD) và quản lý trạng thái vòng đời đơn hàng (Order Lifecycle).
- **Phạm vi tương tác**: Nhận dữ liệu sản phẩm từ Module 4 (Giỏ hàng), tính phí ship từ Module 6 (Giao hàng), trừ tồn kho giữ chỗ ở Module 8 (Kho), kích hoạt hóa đơn và thông báo cho khách hàng.
---
2. Danh Sách Chức Năng Chi Tiết (Feature List)
| Mã CN | Tên Chức Năng | Mô Tả | Người Dùng | Độ Ưu Tiên |
|---|---|---|---|---|
| **F01** | Khởi tạo quy trình Checkout | Chuyển các mặt hàng được chọn từ giỏ hàng sang trang thanh toán; hỗ trợ cả tài khoản khách và thành viên | Khách hàng | Cao (Must-have) |
| **F02** | Quản lý thông tin giao hàng | Nhập/chọn sổ địa chỉ nhận hàng (Họ tên, SĐT, Tỉnh/Thành, Quận/Huyện, Phường/Xã, địa chỉ cụ thể) | Khách hàng | Cao (Must-have) |
| **F03** | Lựa chọn phương thức vận chuyển | Hiển thị các gói vận chuyển (Giao tiêu chuẩn, Giao hỏa tốc 2H) kèm thời gian dự kiến và phí ship tương ứng | Khách hàng | Cao (Must-have) |
| **F04** | Lựa chọn phương thức thanh toán | Hỗ trợ: COD (Thanh toán khi nhận hàng), VNPAY (ATM/QR/Visa), MoMo, ZaloPay | Khách hàng | Cao (Must-have) |
| **F05** | Áp dụng mã giảm giá & Điểm thưởng | Nhập coupon vận chuyển/đơn hàng hoặc tiêu điểm thưởng tích lũy của thành viên | Khách hàng | Cao |
| **F06** | Xác nhận và Đặt hàng (Place Order) | Kiểm tra tồn kho cuối cùng, tạo bản ghi đơn hàng ở trạng thái Pending, trừ số lượng khả dụng | Khách hàng | Cao (Must-have) |
| **F07** | Xử lý thanh toán trực tuyến | Điều hướng sang Gateway thanh toán, nhận Webhook/IPN xác thực giao dịch, cập nhật đơn sang Paid | Hệ thống, Gateway | Cao (Must-have) |
| **F08** | Trang xác nhận đơn hàng (Thank You Page) | Hiển thị mã đơn hàng, tóm tắt thông tin thanh toán, thời gian giao hàng dự kiến và hướng dẫn tiếp theo | Khách hàng | Cao (Must-have) |
| **F09** | Hủy đơn hàng tự động (Timeout) | Tự động hủy đơn hàng và hoàn lại tồn kho nếu khách hàng không thanh toán online sau 15-30 phút | Hệ thống | Cao |
| **F10** | Quản lý & Tra cứu đơn hàng của khách | Xem lịch sử đơn hàng, tiến trình xử lý đơn, chi tiết đơn và nút Yêu cầu hủy đơn (nếu chưa giao) | Khách hàng | Cao |
| **F11** | Quản lý đơn hàng (Admin/Staff) | Danh sách đơn hàng, lọc theo trạng thái, cập nhật trạng thái (Confirmed, Processing, Delivering, Completed, Cancelled), in phiếu đóng gói | Quản trị viên, Nhân viên | Cao (Must-have) |


---
3. SRS Mapping - M05
| Mã CN | SRS Ref | Ghi Chú & Đặc Tả Kỹ Thuật |
|---|---|---|
| **F01** | M05-F01, FR07 | One-page Checkout hoặc 3-step Wizard (Địa chỉ -> Vận chuyển & Thanh toán -> Xác nhận). |
| **F02** | M05-F02 | Tích hợp dữ liệu chuẩn 63 Tỉnh/Thành theo Tổng cục Thống kê / GHN API. |
| **F03** | M05-F03 | Đồng bộ API tính cước vận chuyển thời gian thực từ Module 6. |
| **F04** | M05-F04 | Tích hợp VNPAY SDK / MoMo Open API. Bảo mật HMAC-SHA512 checksum. |
| **F05** | M05-F05 | Giới hạn: Mỗi đơn áp dụng tối đa 1 mã giảm giá tiền hàng + 1 mã miễn phí vận chuyển (Freeship). |
| **F06** | M05-F06 | Sử dụng Database Transaction (ACID) và cơ chế Khóa bi quan/lạc quan (Pessimistic/Optimistic Lock) để chống overselling. |
| **F07** | M05-F07 | Endpoint IPN xử lý Idempotency, lưu trữ log giao dịch thanh toán độc lập. |
| **F08** | M05-F08 | Gửi email thông báo đơn hàng tự động kèm mã QR tra cứu đơn. |
| **F09** | M05-F09 | Chạy Job/Worker định kỳ mỗi phút quét các đơn Pending_Payment quá thời gian quy định. |
| **F10** | M05-F10 | URL tra cứu đơn nhanh cho khách vãng lai thông qua Mã đơn hàng + Số điện thoại. |
| **F11** | M05-F11 | Quyền RBAC: Chỉ nhân viên được phân quyền mới có thể đổi trạng thái thanh toán thủ công. |


---
4. Quy Tắc Nghiệp Vụ (Business Rules) - M05
| Mã BR | Tình Huống / Điều Kiện | Hành Vi Mong Muốn & Ràng Buộc |
|---|---|---|
| **BR-M05-01** | Tạo đơn hàng (Lock Stock) | Ngay khi bấm Đặt hàng, số lượng tồn kho khả dụng (available_stock) của các SKU bị trừ tương ứng, chuyển sang trạng thái reserved_stock. |
| **BR-M05-02** | Timeout thanh toán Online | Nếu sau 20 phút kể từ lúc tạo đơn thanh toán trực tuyến mà hệ thống không nhận được tín hiệu thành công từ Gateway, đơn tự động hủy (Cancelled_Timeout), giải phóng reserved_stock. |
| **BR-M05-03** | Thanh toán COD | Đơn COD chuyển thẳng sang trạng thái Confirmed (hoặc Pending_Approval nếu đơn hàng có giá trị cao > 3.000.000 VNĐ cần gọi điện xác nhận). |
| **BR-M05-04** | Khách hàng hủy đơn | Khách chỉ được tự hủy đơn khi đơn ở trạng thái Pending hoặc Confirmed. Khi đơn đã sang Processing hoặc Delivering, bắt buộc liên hệ CSKH. |
| **BR-M05-05** | Bất biến dữ liệu đơn hàng | Toàn bộ thông tin giá bán, tên sản phẩm, tỷ lệ thuế, phí ship tại thời điểm đặt hàng phải được snapshot lưu cố định vào bảng order_items, không bị ảnh hưởng bởi biến động giá tương lai của catalog. |


---
5. Validation Rules - M05
ecipient_name| string | 2 - 50 ký tự, không chứa ký tự đặc biệt hoặc số vô nghĩa |
| phone_number | string | Chuẩn định dạng SĐT Việt Nam: 10 chữ số, bắt đầu bằng đầu số hợp lệ (03, 05, 07, 08, 09) |
|---|---|---|
| province_id, district_id, ward_code | string/int | Bắt buộc chọn đúng trong danh mục hành chính |
| street_address | string | Tối thiểu 5 ký tự (số nhà, tên đường/ấp/thôn) |
| payment_method | enum | COD, VNPAY, MOMO, ZALOPAY |
| shipping_method | enum | STANDARD, EXPRESS |


---
6. Danh Sách API Dự Kiến - M05
| Mã API | Phương Thức | Endpoint | Dữ Liệu Đầu Vào | Đầu Ra Dự Kiến |
|---|---|---|---|---|
| **API-M05-01** | POST | /api/v1/orders/checkout-summary | { item_ids: [...], address_id, coupon_code } | { subtotal, shipping_fee, discount, final_amount } |
| **API-M05-02** | POST | /api/v1/orders | { shipping_address, payment_method, shipping_method, note, items } | { order_id, order_code, payment_url, status } |
| **API-M05-03** | GET | /api/v1/orders/{order_code} | order_code | { order_details, tracking_history, payment_info } |
| **API-M05-04** | POST | /api/v1/payments/vnpay/ipn | Dữ liệu Webhook mã hóa từ VNPAY | { RspCode, Message } |
| **API-M05-05** | POST | /api/v1/orders/{order_code}/cancel | { reason } | { success: true, new_status: 'Cancelled' } |
| **API-M05-06** | GET | /api/v1/admin/orders | { page, status, search, from_date, to_date } | { total, items: [OrderSummary] } |
| **API-M05-07** | PUT | /api/v1/admin/orders/{order_id}/status | { new_status, note } | { order_id, status, updated_at } |


---
7. UI Components - M05
| Thành Phần UI | Mô Tả Chức Năng | Vị Trí Áp Dụng |
|---|---|---|
| CheckoutShippingForm | Biểu mẫu nhập họ tên, điện thoại và dropdown chọn Tỉnh - Huyện - Xã cascade | /checkout |
| PaymentMethodSelector | Nhóm Radio button lựa chọn phương thức thanh toán kèm icon nhận diện (COD, VNPAY, MoMo) | /checkout |
| OrderSummarySidebar | Box hiển thị danh sách sản phẩm mua, mã voucher, chi tiết tiền và nút Đặt hàng | /checkout (Cột phải) |
| OrderSuccessCard | Khung thông báo đặt hàng thành công, hiển thị mã đơn, số tiền, nút Tiếp tục mua hàng / Theo dõi đơn | /order-success/{code} |
| OrderTrackingTimeline | Thanh timeline các trạng thái đơn: Chờ xử lý -> Đã duyệt -> Đang đóng gói -> Đang giao -> Đã giao | /account/orders/{code} |
| AdminOrderTable | Bảng quản lý đơn hàng chuyên sâu cho QTV có lọc màu theo trạng thái và thanh tìm kiếm nhanh | /admin/orders |


---
8. Yêu Cầu Phi Chức Năng (NFR) - M05
| Mã NFR | Phân Loại | Tiêu Chí Đo Lường |
|---|---|---|
| **NFR-M05-01** | Tính toàn vẹn giao dịch | Bảo đảm nguyên tắc ACID khi tạo đơn và khóa tồn kho; tỷ lệ xung đột tồn kho (overselling) bằng 0. |
| **NFR-M05-02** | Bảo mật | Mã hóa chữ ký thanh toán (Checksum/Signature); không lưu trữ thông tin thẻ ngân hàng của khách hàng trên hệ thống KAIDO (Tuân thủ PCI-DSS qua cổng trung gian). |
| **NFR-M05-03** | Tốc độ phản hồi | Thời gian tạo đơn và trả về URL thanh toán Gateway < 800ms. |


---
3.6: QUẢN LÝ ĐƠN HÀNG VÀ GIAO HÀNG (TOY-M06)
1. Tổng Quan Module
- **Mục tiêu**: Quản lý toàn bộ vòng đời của đơn hàng sau khi khách đặt hàng thành công trên website: tiếp nhận đơn, xác nhận, đóng gói, tạo vận đơn, bàn giao cho đơn vị vận chuyển (ĐVVC: GHN, GHTK, Viettel Post), theo dõi hành trình giao hàng, xử lý hủy đơn, giao thất bại, hoàn hàng và đổi trả/hoàn tiền.
- **Phạm vi đối tượng**: Khách hàng, Nhân viên xử lý đơn (Order Fulfillment Staff), Quản trị viên (Admin), Đơn vị vận chuyển (External Carrier API / Webhook), Hệ thống nội bộ (Module 5 - Thanh toán, Module 8 - Kho & Tồn kho).
---
2. Danh Sách Chức Năng Chi Tiết (Feature List)
| Mã CN | Tên Chức Năng | Mô Tả | Người Dùng | Độ Ưu Tiên |
|---|---|---|---|---|
| **F01** | Tiếp nhận & Tạo đơn hàng | Nhận payload checkout từ Module 5, xác thực dữ liệu, giữ hàng và lưu đơn vào CSDL | Module 5, Hệ thống | Cao (Must-have) |
| **F02** | Xem danh sách & Chi tiết đơn hàng | Khách hàng xem lịch sử mua sắm và chi tiết từng đơn hàng kèm trạng thái | Khách hàng | Cao (Must-have) |
| **F03** | Theo dõi đơn hàng (Tracking) | Hiển thị trạng thái tiến trình và timeline hành trình giao hàng chi tiết thời gian thực | Khách hàng | Cao (Must-have) |
| **F04** | Hủy đơn hàng | Khách hàng hoặc nhân viên hủy đơn khi đủ điều kiện; tự động hoàn lại tồn kho và kích hoạt hoàn tiền | Khách hàng, Nhân viên | Cao (Must-have) |
| **F05** | Quản lý & Tra cứu đơn (Admin) | Tìm kiếm, lọc đơn hàng đa tiêu chí (mã đơn, ngày đặt, trạng thái, khách hàng); in phiếu giao/packing list | Nhân viên, Quản trị | Cao (Must-have) |
| **F06** | Xác nhận đơn hàng | Kiểm tra thông tin đơn; gọi điện xác nhận đơn COD giá trị cao (> 3.000.000 VNĐ) | Nhân viên | Cao (Must-have) |
| **F07** | Cập nhật tiến trình đóng gói | Chuyển đơn sang trạng thái đóng gói (PACKING), in nhãn dán bưu kiện | Nhân viên | Cao (Must-have) |
| **F08** | Tính phí vận chuyển tự động | Tính cước ship theo khu vực, khối lượng quy đổi, gói giao (Tiêu chuẩn/Hỏa tốc) và ngưỡng miễn phí ship | Module 5, Khách hàng | Cao (Must-have) |
| **F09** | Tạo vận đơn & Bàn giao ĐVVC | Tích hợp API ĐVVC để sinh mã vận đơn (Tracking Code), yêu cầu xuất kho Module 8, chuyển sang SHIPPING | Nhân viên, Hệ thống | Cao (Must-have) |
| **F10** | Nhận cập nhật hành trình từ ĐVVC | Xử lý Webhook từ ĐVVC, ánh xạ trạng thái sang hệ thống KAIDO (DELIVERING, DELIVERED, FAILED) | ĐVVC, Hệ thống | Cao (Must-have) |
| **F11** | Xử lý giao thất bại & Hoàn hàng | Ghi nhận đơn giao không thành công sau 3 lần giao, cập nhật hoàn về kho và tự động nhập lại tồn kho Module 8 | Nhân viên, Hệ thống | Trung bình |
| **F12** | Đổi trả & Hoàn tiền (RMA) | Khách gửi yêu cầu đổi/trả sản phẩm trong vòng 7 ngày, nhân viên duyệt/từ chối, kích hoạt hoàn tiền | Khách hàng, Nhân viên | Trung bình |
| **F13** | Thông báo trạng thái đơn tự động | Gửi Email / SMS / Thông báo đẩy khi đơn hàng chuyển các trạng thái quan trọng | Hệ thống | Trung bình |
| **F14** | Báo cáo & Thống kê đơn hàng | Thống kê số lượng đơn, doanh thu theo trạng thái, tỷ lệ hủy đơn và tỷ lệ hoàn hàng (Return Rate) | Quản trị viên | Thấp |


---
3. SRS Mapping - M06
| Mã CN | SRS Ref | Ghi Chú & Đặc Tả Kỹ Thuật |
|---|---|---|
| **F01** | M06-F01, FR08 | Trạng thái ban đầu: PENDING (chờ thanh toán/duyệt) hoặc CONFIRMED. |
| **F02** | M06-F02 | Khách xem được: Mã đơn, ngày đặt, danh sách SP, giá tiền, ĐVVC, mã vận đơn, địa chỉ nhận. |
| **F03** | M06-F03 | Tích hợp API Tracking GHN/GHTK: Hiển thị nhật ký thời gian và vị trí bưu kiện. |
| **F04** | M04-F04 | Chỉ cho phép hủy tự động khi trạng thái ở PENDING hoặc CONFIRMED. |
| **F05** | M06-F05 | Bộ lọc: Khoảng ngày, trạng thái, phương thức thanh toán, đơn vị vận chuyển. Hỗ trợ xuất Excel. |
| **F06** | M06-F06 | Nút Xác nhận đơn chuyển trạng thái CONFIRMED -> sẵn sàng chuẩn bị hàng. |
| **F07** | M06-F07 | Trạng thái PACKING: Xuất phiếu đóng gói gồm vị trí kệ hàng từ Module 8. |
| **F08** | M06-F08 | Bảng biểu phí ship: Nội thành (25k), Ngoại thành/Tỉnh (35k-50k), Đơn >= 500k miễn phí ship. |
| **F09** | M06-F09 | Gọi API GHN/GHTK sinh mã bưu kiện, in phiếu gửi hàng khổ A6/A7. |
| **F10** | M06-F10 | Webhook receiver bảo mật bằng HMAC Token; tự động đổi trạng thái đơn sang COMPLETED khi ĐVVC báo DELIVERED. |
| **F11** | M06-F11 | Khi trạng thái là RETURNING -> RETURNED, gọi Module 8 thực hiện nhập kho bù tồn. |
| **F12** | M06-F12 | Quy trình 7 ngày: Đính kèm hình ảnh lỗi đồ chơi, lý do đổi trả; nhân viên duyệt trước khi thu hồi. |
| **F13** | M06-F13 | Trigger tự động gửi template email: Đặt hàng thành công, Đã gửi hàng, Đang giao, Đã giao. |
| **F14** | M06-F14 | Biểu đồ đường & cột hiển thị tỷ lệ giao thành công (Success Delivery Rate). |


---
4. Quy Tắc Nghiệp Vụ (Business Rules) - M06
| Mã BR | Tình Huống / Điều Kiện | Hành Vi Mong Muốn & Ràng Buộc |
|---|---|---|
| **BR-M06-01** | Vòng đời trạng thái đơn | Trạng thái chuyển dịch tuần tự: PENDING -> CONFIRMED -> PACKING -> SHIPPING -> DELIVERED -> COMPLETED. Không được nhảy cóc bước đóng gói. |
| **BR-M06-02** | Khách hủy đơn hàng | Khách hàng chỉ được tự bấm hủy khi đơn chưa chuyển sang PACKING. Nếu đã ở PACKING hoặc SHIPPING, khách phải liên hệ tổng đài để xử lý ngoại lệ. |
| **BR-M06-03** | Giao hàng thất bại 3 lần | Sau 3 lần giao không thành công từ ĐVVC, đơn hàng tự động chuyển sang DELIVERY_FAILED, kích hoạt thủ tục hoàn hàng RETURNING. |
| **BR-M06-04** | Trừ kho và xuất kho | Tại PENDING chỉ giữ chỗ (Reserve); tại thời điểm tạo vận đơn SHIPPING, hệ thống chính thức trừ tồn kho thực tế (actual_stock) tại Module 8. |
| **BR-M06-05** | Điều kiện đổi trả | Chỉ áp dụng cho đơn COMPLETED trong vòng 7 ngày kể từ lúc nhận; sản phẩm còn nguyên tem mác hoặc lỗi do nhà sản xuất/vận chuyển móp méo. |


---
5. Validation Rules - M06
| Trường Dữ Liệu | Kiểu | Ràng Buộc & Kiểm Tra |
|---|---|---|
| order_id | integer/UUID | Bắt buộc, tồn tại trong bảng orders |
| cancel_reason | string | Bắt buộc khi hủy đơn, tối thiểu 10 ký tự hoặc chọn lý do từ danh mục định sẵn |
| racking_code | string | Chuỗi mã vận đơn từ ĐVVC (độ dài 8 - 25 ký tự) |
| carrier_code | enum | GHN, GHTK, VIETTELPOST |


eturn_reason| enum | DAMAGED_IN_TRANSIT, DEFECTIVE, WRONG_ITEM, OTHER |
eturn_images| array[url] | Tối thiểu 1 ảnh minh chứng sản phẩm lỗi |
---
6. Danh Sách API Dự Kiến - M06
| Mã API | Phương Thức | Endpoint | Dữ Liệu Đầu Vào | Đầu Ra Dự Kiến |
|---|---|---|---|---|
| **API-M06-01** | POST | /api/v1/shipping/calculate-fee | { address, weight, total_amount } | { shipping_fee, estimated_delivery_days, carrier_options } |
| **API-M06-02** | POST | /api/v1/orders/{order_id}/fulfillment | { carrier_code, pickup_time } | { tracking_code, label_url, status: 'SHIPPING' } |
| **API-M06-03** | GET | /api/v1/orders/{order_code}/tracking | order_code | { tracking_code, carrier, current_status, timeline: [...] } |
| **API-M06-04** | POST | /api/v1/shipping/webhook/carrier | Webhook payload từ ĐVVC kèm Secret Signature | { success: true, processed: true } |
| **API-M06-05** | POST | /api/v1/orders/{order_id}/cancel | { reason } | { success: true, new_status: 'CANCELLED' } |
| **API-M06-06** | POST | /api/v1/orders/{order_id}/returns | { item_ids, reason, images, note } | { return_request_id, status: 'PENDING_APPROVAL' } |
| **API-M06-07** | PUT | /api/v1/admin/returns/{id}/approve | { action: 'APPROVE' / 'REJECT', note } | { return_request_id, status, refund_amount } |


---
7. UI Components - M06
| Thành Phần UI | Mô Tả Chức Năng | Vị Trí Áp Dụng |
|---|---|---|
| OrderTrackingStepper | Thanh chỉ báo bước tiến trình đơn hàng (Chờ xác nhận -> Đang đóng gói -> Đang giao -> Đã giao) | /account/orders/{id} |
| CarrierTrackingCard | Khung hiển thị chi tiết nhật ký di chuyển của kiện hàng từ nhà xe/shipper ĐVVC | /account/orders/{id} |
| CancelOrderModal | Modal chọn lý do hủy đơn và xác nhận hủy | /account/orders/{id} |
| ReturnRequestForm | Biểu mẫu upload ảnh và điền lý do đổi trả hàng | /account/orders/{id}/return |
| FulfillmentActions | Bộ nút thao tác nhanh cho nhân viên: Duyệt đơn, In phiếu gửi, Giao cho ĐVVC | /admin/orders/{id} |
| DeliveryDashboard | Bảng điều khiển phân loại đơn theo ĐVVC và trạng thái giao hàng trễ hạn | /admin/shipping |


---
8. Yêu Cầu Phi Chức Năng (NFR) - M06
| Mã NFR | Phân Loại | Tiêu Chí Đo Lường |
|---|---|---|
| **NFR-M06-01** | Tính sẵn sàng của Webhook | Tỷ lệ xử lý thành công Webhook cập nhật trạng thái từ ĐVVC đạt >= 99.9%, có hàng đợi retry (Retry Queue) khi server bận. |
| **NFR-M06-02** | Đồng bộ trạng thái tức thời | Khi ĐVVC quét giao hàng thành công, trạng thái hiển thị trên giao diện khách hàng cập nhật trong vòng < 60 giây. |
| **NFR-M06-03** | Khả năng kiểm toán (Audit Trail) | Mọi thay đổi trạng thái đơn hàng và người thực hiện (khách hàng, nhân viên, webhook) phải được ghi log bất biến (immutable log) phục vụ đối soát. |


---
---
3.7: QUAN LY KHUYEN MAI VA KHACH HANG THAN THIET (TOY-M07)
1. Tong Quan Module
- **Muc tieu**: Thiet lap cac chuong trinh uu dai, ma giam gia (Voucher/Coupon), he thong tich diem thuong (Loyalty Points) va phan cap hang thanh vien (Membership Tiers: Bronze, Silver, Gold, Diamond) nham giu chan khach hang, gia tang ty le mua lai va tri an khach hang than thiet cua cua hang do choi KAIDO.
- **Pham vi doi tuong**: Khach hang thanh vien (tich diem, tieu diem, huong dac quyen hang), Quan tri vien / Nhan vien Marketing (cau hinh ma, quy che tich diem), He thong noi bo (Module 4 - Gio hang, Module 5/6 - Don hang & Thanh toan).
---
2. Danh Sach Chuc Nang Chi Tiet (Feature List)
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| **F01** | Quan ly ma khuyen mai | Tao, sua, xoa, cau hinh dieu kien ap dung ma giam gia (theo so tien, %, danh muc, thoi han) | Quan tri vien | Cao (Must-have) |
| **F02** | Ap dung ma khuyen mai | Kiem tra tinh hop le, dieu kien don toi thieu va tu dong tinh so tien duoc chiet khau | Khach hang, He thong | Cao (Must-have) |
| **F03** | Tich diem thuong tu dong | Tu dong cong diem thuong theo ty le quy doi ngay khi don hang chuyen sang trang thai Hoan thanh | He thong, Khach hang | Cao (Must-have) |
| **F04** | Tieu diem thuong khi mua hang | Cho phep khach hang doi diem thuong thanh tien tru truc tiep vao gia tri don hang khi thanh toan | Khach hang | Cao (Must-have) |
| **F05** | Quan ly hang thanh vien | Tu dong xep hang hoi vien (Dong, Bac, Vang, Kim cuong) dua tren tong chi tieu tich luy | He thong, QTV | Cao (Must-have) |
| **F06** | Dac quyen hang hoi vien | Ap dung ty le giam gia co dinh, voucher sinh nhat rieng va tang he so tich diem theo tung cap hang | Khach hang | Trung binh |
| **F07** | Lich su bien dong diem | Xem chi tiet nhat ky cong/tru diem thuong, ly do bien dong va ngay het han cua diem | Khach hang, QTV | Trung binh |


---
3. SRS Mapping - M07
| Ma CN | SRS Ref | Ghi Chu & Dac Ta Ky Thuat |
|---|---|---|
| **F01** | M07-F01, FR09 | Ma giam gia ho tro: Giam tien truc tiep (Fixed Amount), Giam phan tram (kem muc giam toi da). |
| **F02** | M07-F02 | API verify voucher phan hoi trong < 1 giay; kiem tra so luot con lai va gia tri gio hang hop le. |
| **F03** | M07-F03 | Quy che mac dinh: Moi 100.000 VND chi tieu tich luy 1 diem (Tuong duong 1.000 VND tien thuong = 1%). |
| **F04** | M07-F04 | Ranh gioi tieu diem: So diem duoc tieu toi da khong qua 50% tong gia tri hoa don. |
| **F05** | M07-F05 | Cap bac: Dong (0-2tr), Bac (2-5tr, tich diem x1.2), Vang (5-15tr, tich x1.5), Kim cuong (>15tr, tich x2.0). |
| **F06** | M07-F06 | Trigger tu dong tang voucher 100k/200k vao vi voucher cua hoi vien vao thang sinh nhat cua be. |
| **F07** | M07-F07 | Diem thuong co han su dung 365 ngay ke tu ngay duoc cong; worker quet het han dinh ky. |


---
4. Quy Tac Nghiep Vu (Business Rules) - M07
| Ma BR | Tinh Huong / Dieu Kien | Hanh Vi Mong Muon & Rang Buoc |
|---|---|---|
| **BR-M07-01** | Thoi diem cong diem | Chi cong diem thuong khi don hang chuyen sang COMPLETED (Giao thanh cong). Neu don bi huy/tra hang, thu hoi diem tuong ung. |
| **BR-M07-02** | Tru diem khi thanh toan | Khi khach dung diem de tru tien, he thong tru diem ngay o trang thai Pending; neu don hang bi huy, hoan lai 100% so diem da dung. |
| **BR-M07-03** | Ranh gioi giam gia toi da | Tong so tien giam tu Voucher + Diem thuong khong bao gio vuot qua tong gia tri tien hang truoc thue. |
| **BR-M07-04** | Xet hang thanh vien | Hang thanh vien duoc tinh toan dua tren tong chi tieu thuc te trong vong 12 thang gan nhat (Rolling Year). |
| **BR-M07-05** | Tinh toan ven cua ma uu dai | Khi so luot su dung ma giam gia cham nguong gioi han (Max Usage), he thong lap tuc vo hieu hoa ma trong vong giao dich ACID. |


---
5. Validation Rules - M07
oucher_code | string | 4 - 20 ky tu, in hoa, khong khoang trang, khong chua ky tu dac biet |
| points_to_redeem | integer | So nguyen >= 0, boi so cua 10 diem, <= so du diem hien co cua khach |
|---|---|---|
| discount_percent | decimal | 1 <= percent <= 100 |
| ier_name | enum | BRONZE, SILVER, GOLD, DIAMOND |


alid_from /
alid_to | datetime | valid_to phai sau valid_from |
---
6. Danh Sach API Du Kien - M07
| Ma API | Phuong Thuc | Endpoint | Du Lieu Dau Vao | Dau Ra Du Kien |
|---|---|---|---|---|
| **API-M07-01** | POST | /api/v1/loyalty/validate-voucher | { code, order_subtotal, customer_id } | { is_valid, discount_amount, message } |
| **API-M07-02** | GET | /api/v1/loyalty/my-points | Header Bearer Token | { total_points, current_tier, points_expiring, value_vnd } |
| **API-M07-03** | GET | /api/v1/loyalty/point-history | ?page=1&limit=20 | { total, history: [{ id, change, reason, created_at }] } |
| **API-M07-04** | POST | /api/v1/loyalty/calculate-discount | { points_redeemed, voucher_code, subtotal } | { total_discount, final_subtotal } |
| **API-M07-05** | POST | /api/v1/admin/loyalty/vouchers | { code, type, value, max_discount, min_order, usage_limit } | { voucher_id, code, status } |
| **API-M07-06** | GET | /api/v1/admin/loyalty/tiers-summary | Khong | [{ tier: 'GOLD', member_count: 1420, min_spent: 5000000 }] |


---
7. UI Components - M07
| Thanh Phan UI | Mo Ta Chuc Nang | Vi Tri Ap Dung |
|---|---|---|
| MembershipCard | The hoi vien sang trong hien thi ten khach, hang the (Vang/Kim cuong), tien trinh thap hang tiep theo | /account/loyalty |
| PointRedemptionSlider | Thanh keo hoac o nhap so diem muon tieu tai buoc thanh toan, tu dong quy doi thanh so tien VND giam | /checkout |
| VoucherWalletModal | Danh sach voucher kha dung cua toi voi nut 'Dung ngay' truc tiep tai trang gio hang | /cart & /checkout |
| LoyaltyHistoryTable | Bang lich su nhat ky cong/tru diem thuong minh bach kem ma hoa don tuong ung | /account/loyalty/history |
| AdminVoucherForm | Form tao ma giam gia chuyen sau voi lua chon danh muc ap dung va gioi han so luot dung | /admin/loyalty/vouchers |


---
8. Yeu Cau Phi Chuc Nang (NFR) - M07
| Ma NFR | Phan Loai | Tieu Chi Do Luong |
|---|---|---|
| **NFR-M07-01** | Toc do tinh toan | API xac thuc voucher va quy doi diem thuong phan hoi trong vong < 200ms de giu checkout muot ma. |
| **NFR-M07-02** | Tinh toan ven so du | Giao dich cong/tru diem thuong bat buoc thuc hien trong Database Transaction, dam bao so du khong bao gio bi am hay lech. |
| **NFR-M07-03** | Chong gian lan (Anti-fraud) | He thong tu dong ghi nhan IP va canh bao neu 1 tai khoan thu nhap voucher qua 5 lan that bai lien tiep trong 1 phut. |


---
3.8: QUẢN LÝ KHO VÀ TỒN KHO (TOY-M08)
1. Tổng Quan Module
- **Mục tiêu**: Quản lý tập trung toàn bộ danh mục kho bãi, quy trình nhập kho từ nhà cung cấp, kiểm soát số lượng tồn kho khả dụng (available), tồn kho thực tế (on_hand), tồn kho giữ chỗ đơn hàng (reserved), thực hiện xuất kho, kiểm kê, điều chỉnh và cảnh báo tồn thấp tự động.
- **Phạm vi đối tượng**: Thủ kho (Warehouse Keeper), Quản lý kho/Quản trị viên (Admin/Manager), Hệ thống nội bộ (Module 2 - Sản phẩm, Module 3 - Tìm kiếm, Module 4 - Giỏ hàng, Module 5/6 - Đơn hàng & Giao hàng).
---
2. Danh Sách Chức Năng Chi Tiết (Feature List)
| Mã CN | Tên Chức Năng | Mô Tả | Người Dùng | Độ Ưu Tiên |
|---|---|---|---|---|
| **F01** | Quản lý kho | Tạo, sửa, vô hiệu hóa kho/điểm chứa hàng; thiết lập kho mặc định cho các đơn hàng online | Quản lý kho | Trung bình |
| **F02** | Nhập kho | Lập và xác nhận phiếu nhập hàng từ nhà cung cấp (PO); cập nhật tăng tồn kho thực tế | Thủ kho | Cao (Must-have) |
| **F03** | Xem & Tra cứu tồn kho | Tra cứu số lượng tồn theo SKU, biến thể, kho hàng; lọc theo danh mục, sắp hết hoặc hết hàng | Thủ kho, Quản lý | Cao (Must-have) |
| **F04** | Cung cấp tình trạng tồn kho (API) | Cung cấp API truy vấn tồn kho khả dụng theo SKU (đơn lẻ hoặc theo lô) phục vụ kiểm tra giỏ hàng | Module 2, 3, 4 | Cao (Must-have) |
| **F05** | Giữ hàng (Reserve Stock) | Khóa tạm thời số lượng tồn khả dụng cho nhiều SKU theo order_ref ngay khi khách đặt hàng | Module 5, 6 | Cao (Must-have) |
| **F06** | Xuất kho thực tế | Chuyển hàng từ trạng thái giữ chỗ sang xuất kho thực tế khi đơn hàng chuyển sang SHIPPING | Module 6 | Cao (Must-have) |
| **F07** | Giải phóng hàng giữ (Release Stock) | Trả lại hàng đã giữ về tồn kho khả dụng khi đơn hàng bị hủy hoặc thanh toán trực tuyến timeout | Module 6, Hệ thống | Cao (Must-have) |
| **F08** | Nhập lại hàng hoàn / Đổi trả | Nhập lại hàng do khách đổi trả hoặc giao thất bại; phân loại hàng nguyên vẹn (bán lại) hoặc hàng lỗi | Module 6, Thủ kho | Trung bình |
| **F09** | Kiểm kê & Điều chỉnh tồn kho | Đối chiếu số đếm thực tế với sổ sách; lập phiếu điều chỉnh; quản lý phê duyệt nếu vượt ngưỡng lệch | Thủ kho, Quản lý | Trung bình |
| **F10** | Chuyển kho nội bộ | Điều chuyển hàng hóa giữa các chi nhánh kho kèm trạng thái đang chuyển (In-transit) | Thủ kho | Thấp |
| **F11** | Cảnh báo tồn kho thấp | Quét định kỳ ngưỡng an toàn (Safety Stock); tự động gửi cảnh báo và đồng bộ cờ hết hàng sang Module 2 | Hệ thống | Trung bình |
| **F12** | Quản lý nhà cung cấp (Suppliers) | Quản lý danh mục đối tác phân phối đồ chơi (thông tin liên hệ, mã số thuế, công nợ) | Quản lý kho | Thấp |
| **F13** | Sổ biến động kho & Báo cáo tồn | Xem lịch sử thẻ kho (Audit trail: Nhập/Xuất/Điều chỉnh), báo cáo tỷ lệ luân chuyển hàng tồn | Quản lý, Thủ kho | Trung bình |


---
3. SRS Mapping - M08
| Mã CN | SRS Ref | Ghi Chú & Đặc Tả Kỹ Thuật |
|---|---|---|
| **F01** | M08-F01 | Mô hình đa kho (Multi-warehouse) hoặc kho đơn trung tâm (Central Fulfillment Center). |
| **F02** | M08-F02 | Phiếu nhập kho: Mã phiếu, ngày nhập, NCC, danh sách SKU, số lượng, giá nhập, VAT. |
| **F03** | M08-F03 | Hiển thị 3 chỉ số then chốt: On-hand (Thực tế), Reserved (Đang giữ chỗ), Available = On-hand - Reserved. |
| **F04** | M08-F04 | Cache Redis cho số lượng tồn kho khả dụng; tự động invalidate cache khi có biến động kho. |
| **F05** | M08-F05 | Cơ chế Atomic Lock: Trừ tồn khả dụng trong 1 giao dịch đơn nhất, timeout giữ chỗ tối đa 20 phút. |
| **F06** | M08-F06 | Trừ trực tiếp on_hand_stock và giảm reserved_stock. Ghi nhận mã phiếu xuất kho. |
| **F07** | M08-F07 | Worker tự động quét đơn timeout mỗi phút để trả kho; hỗ trợ API mở khóa thủ công. |
| **F08** | M08-F08 | Nếu đồ chơi bị móp hộp/hỏng hóc: Phân loại vào 'Kho hàng lỗi/Thanh lý' thay vì kho bán online. |
| **F09** | M08-F09 | Phiếu kiểm kê: Chênh lệch > 5.000.000 VNĐ hoặc > 10 sản phẩm bắt buộc Quản trị viên duyệt mới có hiệu lực. |
| **F10** | M08-F10 | Phiếu luân chuyển 2 bước: Xuất kho A -> Đang trên đường -> Nhập kho B. |
| **F11** | M08-F11 | Trigger event gửi sang Message Queue thông báo Module 2 chuyển cờ in_stock = false. |
| **F12** | M08-F12 | Liên kết mã nhà cung cấp vào từng dòng phiếu nhập kho để theo dõi nguồn gốc đồ chơi. |
| **F13** | M08-F13 | Bảng stock_movement_logs: Bất biến, ghi nhận rõ User ID, Thời gian, Loại giao dịch (+/-), Số dư trước và sau. |


---
4. Quy Tắc Nghiệp Vụ (Business Rules) - M08
| Mã BR | Tình Huống / Điều Kiện | Hành Vi Mong Muốn & Ràng Buộc |
|---|---|---|
| **BR-M08-01** | Công thức tính tồn khả dụng | Luôn bảo đảm Available = On_hand - Reserved >= 0. Không cho phép Available < 0 trong bất kỳ tình huống đặt hàng thông thường nào. |
| **BR-M08-02** | Khóa giao dịch đồng thời | Khi nhiều khách hàng cùng đặt 1 món đồ chơi Hot số lượng ít, sử dụng Database Row Locking hoặc Redis Distributed Lock để giải quyết xung đột theo thứ tự FIFO. |
| **BR-M08-03** | Tự động cập nhật trạng thái hiển thị | Khi Available = 0, hệ thống tự động phát tín hiệu sang Module 2/3 để hiển thị nhãn Hết hàng và vô hiệu hóa nút Thêm vào giỏ. |
| **BR-M08-04** | Nhập kho tăng giá trị | Đơn giá nhập của sản phẩm tính theo phương pháp Bình quân gia quyền (Weighted Average Cost) hoặc FIFO để phục vụ tính giá vốn hàng bán (COGS). |
| **BR-M08-05** | Tính bất biến của Thẻ kho | Phiếu nhập/xuất/kiểm kê khi đã ở trạng thái COMPLETED sẽ bị khóa vĩnh viễn, không được phép xóa hoặc chỉnh sửa trực tiếp mà phải tạo phiếu điều chỉnh đối ứng. |


---
5. Validation Rules - M08
| Trường Dữ Liệu | Kiểu | Ràng Buộc & Kiểm Tra |
|---|---|---|
| warehouse_id | integer | Bắt buộc, ID kho hoạt động |
| sku | string | Chuỗi 3 - 30 ký tự, định dạng chuẩn chữ hoa và số, duy nhất trên toàn hệ thống |
| quantity | integer | Số nguyên dương > 0 cho các giao dịch nhập/xuất; số nguyên có thể âm/dương khi điều chỉnh |
| unit_cost | decimal | Đơn giá nhập >= 0 (VNĐ) |


eason | string | Bắt buộc khi điều chỉnh kiểm kê, tối thiểu 10 ký tự |
---
6. Danh Sách API Dự Kiến - M08
| Mã API | Phương Thức | Endpoint | Dữ Liệu Đầu Vào | Đầu Ra Dự Kiến |
|---|---|---|---|---|
| **API-M08-01** | GET | /api/v1/inventory/stock-check | ?skus=SKU1,SKU2 | { items: [{ sku, available, in_stock }] } |
| **API-M08-02** | POST | /api/v1/inventory/reserve | { order_ref, items: [{ sku, quantity }] } | { success: true, reservation_id, expires_at } |
| **API-M08-03** | POST | /api/v1/inventory/release | { order_ref, reservation_id } | { success: true, released_items: [...] } |
| **API-M08-04** | POST | /api/v1/inventory/fulfill | { order_ref, reservation_id } | { success: true, export_note_id } |
| **API-M08-05** | POST | /api/v1/admin/inventory/goods-receipt | { supplier_id, warehouse_id, items: [...] } | { receipt_id, total_quantity, total_cost } |
| **API-M08-06** | POST | /api/v1/admin/inventory/adjustments | { warehouse_id, items: [{ sku, diff_quantity, reason }] } | { adjustment_id, status: 'PENDING_APPROVAL' / 'APPROVED' } |
| **API-M08-07** | GET | /api/v1/admin/inventory/stock-card | { sku, warehouse_id, from_date, to_date } | { sku, opening_stock, closing_stock, movements: [...] } |


---
7. UI Components - M08
| Thành Phần UI | Mô Tả Chức Năng | Vị Trí Áp Dụng |
|---|---|---|
| StockLevelBadge | Huy hiệu trạng thái tồn: Còn hàng (Xanh), Sắp hết hàng (Cam), Hết hàng (Đỏ) | /admin/inventory & /products |
| GoodsReceiptModal | Form tạo phiếu nhập kho gồm chọn NCC, quét barcode/nhập SKU và giá vốn | /admin/inventory/receipts/new |
| StockAuditTable | Bảng kiểm kê hỗ trợ nhập số lượng thực tế, tự tính độ chênh lệch và hiển thị cảnh báo đỏ | /admin/inventory/audit |
| InventoryHistoryLog | Bảng nhật ký biến động thẻ kho hiển thị chi tiết người thực hiện, thời gian và số phiếu tham chiếu | /admin/inventory/stock-cards |
| LowStockAlertBanner | Thanh cảnh báo xuất hiện trên Dashboard quản trị khi có sản phẩm chạm ngưỡng tồn tối thiểu | /admin/dashboard |


---
8. Yêu Cầu Phi Chức Năng (NFR) - M08
| Mã NFR | Phân Loại | Tiêu Chí Đo Lường |
|---|---|---|
| **NFR-M08-01** | Độ chính xác tuyệt đối | Tồn kho khả dụng và giữ chỗ phải chính xác 100%, không xảy ra race condition khi chịu tải > 500 req/s. |
| **NFR-M08-02** | Tốc độ API kiểm tra tồn | API /inventory/stock-check trả lời < 100ms thông qua caching Redis. |
| **NFR-M08-03** | Khả năng truy vết (Auditability) | 100% các biến động tăng/giảm tồn kho đều phải được ghi vết bằng Thẻ kho và gắn với một chứng từ cụ thể. |


---
3.9: QUAN LY NOI DUNG VA CHIEN DICH QUANG BA (TOY-M09)
1. Tong Quan Module
- **Muc tieu**: Quan ly tap trung he thong noi dung truyen thong, banner quang cao, bai viet/tin tuc do choi, chien dich khuyen mai (Voucher/Coupon, Giam gia theo % hoac so tien, Flash Sale) va dieu phoi trang thai hien thi tren toan bo website KAIDO.
- **Pham vi doi tuong**: Khach hang (nguoi tiep nhan noi dung, ap dung ma uu dai), Nhan vien Marketing, Quan tri vien (Admin), He thong noi bo (Module 4 - Gio hang, Module 5 - Dat hang).
---
2. Danh Sach Chuc Nang Chi Tiet (Feature List)
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| **F01** | Quan ly banner quang cao | Them, sua, xoa, sap xep thu tu va quan ly vi tri hien thi (Trang chu Carousel, Top Bar, Pop-up, Sidebar) | QTV, NV Marketing | Cao (Must-have) |
| **F02** | Quan ly noi dung quang ba | Tao, bien tap bai viet gioi thieu do choi moi, thong bao khuyen mai, cam nang chon do choi an toan | QTV, NV Marketing | Cao (Must-have) |
| **F03** | Quan ly chien dich quang ba | Thiet lap chien dich tong the: Ten, banner chu dao, mo ta, khoang thoi gian ap dung va ngan sach | QTV, NV Marketing | Cao (Must-have) |
| **F04** | Quan ly chuong trinh khuyen mai | Tao ma giam gia (Voucher/Coupon), Flash Sale do choi, cau hinh muc giam, dieu kien ap dung | QTV, NV Marketing | Cao (Must-have) |
| **F05** | Quan ly trang thai hien thi | Bat/tat, tam ngung hoac len lich tu dong hien thi/ha banner va noi dung theo khung gio dinh san | QTV, NV Marketing | Cao (Must-have) |
| **F06** | Tim kiem va loc noi dung | Tim kiem va loc banner, bai viet, chien dich theo loai noi dung, trang thai, thoi gian ap dung | QTV, NV Marketing | Trung binh |
| **F07** | Hien thi noi dung cho khach hang | Hien thi Banner tuong tac, tin tuc noi bat va danh muc khuyen mai tren giao dien Storefront | Khach hang | Cao (Must-have) |
| **F08** | Ap dung & Xac thuc ma khuyen mai | Cung cap API kiem tra tinh hop le va tinh muc tien chiet khau cho Module 4 & Module 5 | Module 4, 5, Khach | Cao (Must-have) |


---
3. SRS Mapping - M09
| Ma CN | SRS Ref | Ghi Chu & Dac Ta Ky Thuat |
|---|---|---|
| **F01** | M09-F01, FR11 | Banner ho tro responsive (Desktop 1920x600, Mobile 800x600), dinh dang WebP/PNG, link dieu huong sau. |
| **F02** | M09-F02 | Trinh soan thao WYSIWYG (Rich Text Editor: TinyMCE/CKEditor), tu dong sinh slug chuan SEO, ho tro OpenGraph tag. |
| **F03** | M09-F03 | Chien dich (Campaign): Nhom nhieu voucher, banner va danh sach SKU do choi vao cung 1 su kien (VD: Trung Thu, Quoc Te Thieu Nhi 1/6). |
| **F04** | M04-F04 | Loai uu dai: Giam theo % (co tran max giam), giam so tien co dinh, mien phi ship (Freeship), Mua X tang Y. |
| **F05** | M09-F05 | Cronjob Scheduler: Tu dong kich hoat luc 00:00 va tu dong ket thuc khi het han ma khong can can thiep thu cong. |
| **F06** | M09-F06 | Phan trang bang noi dung quan tri, loc theo trang thai (Ban nhap, Dang chay, Da ket thuc). |
| **F07** | M09-F07 | Tich hop Swiper.js cho slider banner trang chu; Lazy-loading hinh anh de toi uu diem PageSpeed. |
| **F08** | M09-F08 | Kiem tra rang buoc: Gia tri don toi thieu, so luot dung toi da toan he thong, so luot dung/khach hang. |


---
4. Quy Tac Nghiep Vu (Business Rules) - M09
| Ma BR | Tinh Huong / Dieu Kien | Hanh Vi Mong Muon & Rang Buoc |
|---|---|---|
| **BR-M09-01** | Kiem tra thoi gian hieu luc | Chi cho phep ap dung ma khuyen mai khi thoi gian hien tai nam trong khoang [start_time, end_time]. |
| **BR-M09-02** | Gioi han ngan sach / Luot dung | Khi voucher dat nguong usage_limit (hoac ngan sach can kiet), ma tu dong chuyen sang trang thai Het luot va tu choi ap dung tiep. |
| **BR-M09-03** | Khong cong don ma giam gia | Moi don hang chi ap dung toi da 1 coupon giam tien hang (tru truong hop ma Freeship duoc phep ap dung song song). |
| **BR-M09-04** | Thu tu uu tien hien thi banner | Banner co trong so display_order nho hon se hien thi truoc; chi hien thi toi da 5 banner lon tren trang chu. |
| **BR-M09-05** | Thu hoi ma khi huy don | Khi don hang bi huy hop le (chua xuat kho), so luot su dung voucher cua khach hang duoc hoan tra lai tai khoan. |


---
5. Validation Rules - M09
| Truong Du Lieu | Kieu | Rang Buoc & Kiem Tra |
|---|---|---|
| coupon_code | string | 4 - 20 ky tu, in hoa, chi gom chu cai va so (A-Z, 0-9) |
| discount_value | decimal | Neu discount_type = PERCENT thi 1 <= value <= 100; neu FIXED thi value > 0 |
| min_order_value | decimal | So tien toi thieu >= 0 (VND) |
| max_discount | decimal | Muc tran giam gia khi dung % (>= 0) |
| start_time / end_time | datetime | end_time phai sau start_time |
| anner_image | url | Bat buoc, dinh dang hop le (jpg, png, webp), dung luong <= 2MB |


---
6. Danh Sach API Du Kien - M09
| Ma API | Phuong Thuc | Endpoint | Du Lieu Dau Vao | Dau Ra Du Kien |
|---|---|---|---|---|
| **API-M09-01** | GET | /api/v1/content/banners | ?position=home_main | [{ id, title, image_url, target_url, display_order }] |
| **API-M09-02** | GET | /api/v1/content/promotions/active | Khong | [{ campaign_id, title, banner_url, start_date, end_date }] |
| **API-M09-03** | POST | /api/v1/promotions/verify-coupon | { code, order_amount, customer_id, items } | { is_valid, discount_amount, message } |
| **API-M09-04** | POST | /api/v1/admin/marketing/banners | { title, image_url, target_url, position, start_time, end_time } | { id, created_at, status } |
| **API-M09-05** | POST | /api/v1/admin/marketing/coupons | { code, type, value, min_order, usage_limit, start_time, end_time } | { coupon_id, code, status } |
| **API-M09-06** | GET | /api/v1/content/articles | ?category=news&page=1 | { total, articles: [{ id, title, slug, thumbnail, excerpt, published_at }] } |


---
7. UI Components - M09
| Thanh Phan UI | Mo Ta Chuc Nang | Vi Tri Ap Dung |
|---|---|---|
| HomeHeroSlider | Slider banner chinh trang chu ho tro auto-play, swipe cam ung va cham pagination | / (Trang chu) |
| FlashSaleCountdownBar | Thanh dong ho dem nguoc gio Flash Sale kem badge giam soc | Trang chu & Chi tiet san pham |
| PromoCodeBadgeList | Danh sach the voucher dang luon song co nut Luu ma hoac Sao chep ma | /promotions & Gio hang |
| ArticleCard | Card hien thi bai viet tin tuc do choi (anh cover, tieu de, ngay dang, tom tat) | /blog, /news |
| AdminCampaignEditor | Bieu mau quan tri thiet lap thong so chien dich va chon danh sach do choi ap dung | /admin/marketing/campaigns |


---
8. Yeu Cau Phi Chuc Nang (NFR) - M09
| Ma NFR | Phan Loai | Tieu Chi Do Luong |
|---|---|---|
| **NFR-M09-01** | Toc do tai trang & Caching | Du lieu Banner va Coupon active duoc cache tai Edge CDN / Redis, thoi gian phan hoi API < 50ms. |
| **NFR-M09-02** | Chong gian lan ma (Anti-abuse) | Rate-limiting toi da 10 lan thu ma/phut/IP de phong ngua tan cong brute-force quet ma voucher. |
| **NFR-M09-03** | Kha nang mo rong noi dung | He thong luu tru media (S3/Cloudinary) toi uu hoa dinh dang anh tu dong theo thiet bi nguoi dung. |


---
3.10: QUAN LY HO TRO KHACH HANG VA DANH GIA SAN PHAM (TOY-M10)
1. Tong Quan Module
- **Muc tieu**: Cung cap kenh tuong tac 2 chieu giua khach hang va cua hang KAIDO: cho phep khach hang da mua do choi gui danh gia, xep hang sao (Review & Rating), tao yeu cau tro giup/khieu nai (Support Ticket), tra cuu cau hoi thuong gap (FAQ) va cho phep nhan vien CSKH/Admin kiem duyet, giai dap kip thoi.
- **Pham vi doi tuong**: Khach hang (da mua hang / khach tim hieu), Nhan vien ho tro CSKH, Quan tri vien (Admin).
---
2. Danh Sach Chuc Nang Chi Tiet (Feature List)
| Ma CN | Ten Chuc Nang | Mo Ta | Nguoi Dung | Do Uu Tien |
|---|---|---|---|---|
| **F01** | Gui danh gia san pham | Cham diem 1 - 5 sao, viet nhan xet cam nhan, dinh kem hinh anh/video thuc te cua mon do choi | Khach hang da mua | Cao (Must-have) |
| **F02** | Sua / Xoa danh gia | Khach hang chinh sua noi dung hoac thu hoi danh gia do chinh minh gui trong thoi han cho phep | Khach hang | Trung binh |
| **F03** | Xem danh gia & Diem sao | Hien thi diem sao trung binh, phan bo ty le danh gia (1-5 sao), loc theo so sao hoac co hinh anh | Khach hang | Cao (Must-have) |
| **F04** | Kiem duyet danh gia | Duyet, tu choi (kem ly do) hoac an cac danh gia chua tu ngu phan cam, spam hoac sai lech | QTV, Nhan vien CSKH | Cao (Must-have) |
| **F05** | Phan hoi danh gia | Cua hang phan hoi cong khai y kien danh gia cua khach hang voi tu cach Phan hoi tu KAIDO Store | QTV, Nhan vien CSKH | Trung binh |
| **F06** | Gui yeu cau ho tro (Ticket) | Khach tao yeu cau tro giup: phan loai chu de (don hang, bao hanh do choi, tu van), dinh kem tep | Khach hang | Cao (Must-have) |
| **F07** | Theo doi tien trinh yeu cau | Xem lich su trao doi, cap nhat tin nhan bo sung va xac nhan da giai quyet yeu cau | Khach hang | Cao (Must-have) |
| **F08** | Tiep nhan & Xu ly Ticket | Nhan vien tiep nhan, dat muc do uu tien, phan cong xu ly, gui tin nhan tra loi va dong ticket | QTV, Nhan vien CSKH | Cao (Must-have) |
| **F09** | Quan ly cau hoi thuong gap (FAQ) | Them, sua, xoa, sap xep danh muc cac cau hoi giai dap ve chinh sach mua hang, doi tra, ship do choi | QTV, Nhan vien CSKH | Trung binh |
| **F10** | Tra cuu cau hoi thuong gap | Khach hang tim kiem tu khoa va tra cuu cau tra loi tu dong trong muc Tro giup | Khach hang | Trung binh |
| **F11** | Tim kiem va loc CSKH | Loc danh gia theo so sao/trang thai duyet; loc ticket theo muc do khan cap, trang thai xu ly | QTV, Nhan vien CSKH | Trung binh |


---
3. SRS Mapping - M10
| Ma CN | SRS Ref | Ghi Chu & Dac Ta Ky Thuat |
|---|---|---|
| **F01** | M10-F01, FR12 | Rang buoc Verified Purchase: Chi tai khoan da mua san pham va don hang o trang thai COMPLETED moi duoc danh gia. |
| **F02** | M10-F02 | Cho phep chinh sua 1 lan duy nhat trong vong 30 ngay ke tu ngay danh gia ban dau. |
| **F03** | M10-F03 | Tinh toan diem trung binh (Weighted Average) tu dong; phan trang 10 danh gia/trang. |
| **F04** | M10-F04 | Tich hop bo loc tu khoa cam (Profanity Filter blacklist) tu dong gan co PENDING_REVIEW neu co nghi van. |
| **F05** | M10-F05 | Hien thi noi bat nhan Quan tri vien / Phan hoi tu nguoi ban ben duoi comment cua khach. |
| **F06** | M10-F06 | Sinh ma ticket dinh dang #TK-XXXXX; gui email xac nhan da tiep nhan yeu cau cho khach. |
| **F07** | M10-F07 | Giao dien hoi thoai tuong tu chat luong tin nhan; thong bao khi co phan hoi moi tu CSKH. |
| **F08** | M10-F08 | Trang thai Ticket: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED. Cam ket SLA phan hoi trong 24h. |
| **F09** | M10-F09 | Phan loai FAQ: Giao hang, Doi tra do choi, Thanh toan, Bao hanh & Ky thuat. |
| **F10** | M10-F10 | Giao dien Accordion dong/mo noi dung cau tra loi; thanh tim kiem instant search. |
| **F11** | M10-F11 | Dashboard tong hop: Thoi gian phan hoi trung binh (First Response Time) va ty le hai long CSAT. |


---
4. Quy Tac Nghiep Vu (Business Rules) - M10
| Ma BR | Tinh Huong / Dieu Kien | Hanh Vi Mong Muon & Rang Buoc |
|---|---|---|
| **BR-M10-01** | Quyen danh gia do choi | Chi khach hang da mua san pham do voi don hang COMPLETED moi duoc phep cham sao va viet nhan xet (tranh danh gia ao). |
| **BR-M10-02** | Duyet danh gia cong khai | Danh gia hop le khong chua tu cam se duoc hien thi cong khai ngay (hoac qua hang doi kiem duyet tuy cau hinh he thong). |
| **BR-M10-03** | Diem trung binh san pham | Khi mot danh gia moi duoc duyet hoac cap nhat, diem trung binh rating_avg va tong luot rating_count cua san pham tai Module 2 duoc dong bo tinh lai. |
| **BR-M10-04** | Dong Ticket ho tro tu dong | Sau khi nhan vien cap nhat RESOLVED, neu khach hang khong phan hoi them trong vong 72 gio, he thong tu dong chuyen sang CLOSED. |
| **BR-M10-05** | Gioi han tep dinh kem | Moi danh gia/ticket chi duoc dinh kem toi da 5 hinh anh hoac 1 video ngan (dung luong moi tep <= 5MB). |


---
5. Validation Rules - M10
ating | integer | Bat buoc, gia tri nguyen tu 1 den 5 sao |
eview_text | string | Toi thieu 10 ky tu, toi da 1000 ky tu |
| icket_subject | string | Bat buoc, 5 - 100 ky tu |
|---|---|---|
| icket_category | enum | ORDER_ISSUE, WARRANTY_RETURN, PRODUCT_INQUIRY, PAYMENT, OTHER |
| ttachments | array[url] | Toi da 5 file, dinh dang hop le (jpg, png, mp4) |


---
6. Danh Sach API Du Kien - M10
| Ma API | Phuong Thuc | Endpoint | Du Lieu Dau Vao | Dau Ra Du Kien |
|---|---|---|---|---|
| **API-M10-01** | GET | /api/v1/products/{id}/reviews | ?page=1&stars=5 | { rating_avg, rating_breakdown, total, reviews: [...] } |
| **API-M10-02** | POST | /api/v1/products/{id}/reviews | { order_id, rating, comment, images } | { review_id, status: 'APPROVED', created_at } |
| **API-M10-03** | POST | /api/v1/support/tickets | { category, subject, message, order_id, files } | { ticket_id, ticket_code, status: 'OPEN' } |
| **API-M10-04** | GET | /api/v1/support/tickets/{code} | icket_code | { ticket_details, conversation_messages: [...] } |
| **API-M10-05** | POST | /api/v1/support/tickets/{id}/reply | { message, files } | { message_id, sender_type, sent_at } |
| **API-M10-06** | GET | /api/v1/support/faqs | ?keyword=doi tra | [{ category, questions: [{ q, a }] }] |
| **API-M10-07** | PUT | /api/v1/admin/reviews/{id}/moderate | { action: 'APPROVE' / 'REJECT' / 'HIDE', reason } | { review_id, status } |


---
7. UI Components - M10
| Thanh Phan UI | Mo Ta Chuc Nang | Vi Tri Ap Dung |
|---|---|---|
| ProductRatingSummary | Khung tong quan diem sao lon (VD: 4.8/5 sao) kem thanh progress bar the hien ty le 5 sao den 1 sao | Trang chi tiet san pham (PDP) |
| ReviewSubmissionModal | Form pop-up chon sao tuong tac, go van ban va vung keo tha upload anh that cua do choi | Trang PDP / Lich su don hang |
| StoreReplyBox | Khung hien thi cau tra loi chinh thuc cua cua hang voi nen xam/xanh nhat | Duoi moi bai review |
| CustomerTicketList | Bang danh sach cac yeu cau ho tro cua khach hang kem tag mau the hien trang thai | /account/support |
| TicketChatBox | Cua so hoi thoai trao doi 2 chieu giua khach va tu van vien co ho tro dinh kem tep | /account/support/{ticket_id} |
| FaqAccordion | Danh sach cau hoi bam de xa/thu gon noi dung tra loi kem thanh tim kiem | /faq, /help |


---
8. Yeu Cau Phi Chuc Nang (NFR) - M10
| Ma NFR | Phan Loai | Tieu Chi Do Luong |
|---|---|---|
| **NFR-M10-01** | Trai nghiem tai nhanh | Danh gia san pham tai khong dong bo (Asynchronous Loading), khong lam cham First Contentful Paint (FCP) cua trang san pham. |
| **NFR-M10-02** | Bao mat thong tin | Khach hang chi co the xem va tuong tac voi cac Ticket ho tro do chinh tai khoan minh tao ra (Strict Tenant Isolation). |
| **NFR-M10-03** | Kha nang phan hoi ho tro | Dam bao he thong gui thong bao tu dong (Notification) tuc thi cho nhan vien CSKH khi co Ticket moi o muc do HIGH_PRIORITY. |


4. YÊU CẦU PHI CHỨC NĂNG CẤP HỆ THỐNG (SYSTEM NON-FUNCTIONAL REQUIREMENTS)
Bên cạnh các yêu cầu phi chức năng cụ thể của từng phân hệ, hệ thống KAIDO E-commerce bắt buộc phải tuân thủ các chỉ số phi chức năng cấp toàn hệ thống sau đây:
| Mã NFR | Nhóm Thuộc Tính | Nội Dung Yêu Cầu Kỹ Thuật | Tiêu Chí Đánh Giá |
|---|---|---|---|
| SYS-NFR-01 | Hiệu năng & Tốc độ | Thời gian tải trang ban đầu (FCP) trên giao diện khách hàng | < 1.5 giây trên kết nối 4G tiêu chuẩn. |
| SYS-NFR-02 | Khả năng mở rộng | Tải trọng đồng thời (Concurrency) | Chịu tải tối thiểu 1.000 người dùng hoạt động đồng thời (CCU) và 100 giao dịch/giây. |
| SYS-NFR-03 | Tính khả dụng (Uptime) | Mức độ sẵn sàng vận hành của hệ thống | Đạt tỷ lệ khả dụng tối thiểu 99.9% (cho phép gián đoạn tối đa 8.7 giờ/năm). |
| SYS-NFR-04 | Bảo mật thông tin | Mã hóa dữ liệu nhạy cảm và truyền thông mạng | 100% kết nối qua HTTPS/TLS 1.3; mật khẩu băm Bcrypt salt >= 10; tuân thủ PCI-DSS qua cổng thanh toán. |
| SYS-NFR-05 | Sao lưu & Khôi phục | Sao lưu dữ liệu định kỳ (Disaster Recovery) | Tự động sao lưu Database mỗi 6 giờ; mục tiêu RPO < 6 giờ, RTO < 30 phút khi có sự cố. |
| SYS-NFR-06 | Khả năng tương thích | Độ thích ứng thiết bị và trình duyệt (Responsive) | Hoạt động hoàn hảo trên 100% trình duyệt hiện đại (Chrome, Safari, Edge, Firefox) và đa dạng kích thước màn hình Mobile/Tablet/Desktop. |
| SYS-NFR-07 | Tính kiểm toán (Audit) | Ghi log lịch sử biến động dữ liệu nhạy cảm | Toàn bộ thao tác thay đổi giá, xuất nhập tồn kho, chuyển trạng thái đơn hàng phải ghi vết bất biến (Immutable Audit Log). |

