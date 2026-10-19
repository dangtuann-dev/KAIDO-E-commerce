## Module

- [ ] Đúng một module chính (TOY-Mxx) và đã cập nhật `README.md` của module
- [ ] Không import sâu vào module khác (chỉ dùng `public.server.js` / `public.client.js`)
- [ ] Không import `src/server/**` từ code client

## Thay đổi

<!-- Mô tả ngắn gọn, liên kết mã FR/BR/API/NFR liên quan -->

- SRS: `Mxx-Fxx`, `BR-Mxx-xx`, `API-Mxx-xx`
- Hành vi trước / sau:

## Kiểm thử

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run check:modules`
- [ ] `npm run build`
- [ ] Đã thử trên giao diện (nếu có thay đổi UI)

## Checklist bảo mật

- [ ] Không có bí mật/khóa thật trong diff
- [ ] Không log dữ liệu nhạy cảm
- [ ] Endpoint mới đã khai báo trong `src/shared/api-endpoints.js` (nếu thuộc SRS)
