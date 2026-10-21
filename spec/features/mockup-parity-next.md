# Parity còn lại với mockup Stitch

Trạng thái: `ready` (chờ anh Huy chọn thứ tự)
Cập nhật: 2026-10-17, branch `feature/create-product-mvp`

Việc còn lại, xếp theo thứ tự em đề xuất. Chi tiết màn -> file -> trạng thái ở `spec/INDEX.md`.

## 1. Sửa 500 đăng nhập email (chặn mọi thứ khác)

- `backend/.../model/entity/LoginAttempt.java`: map field `timestamp` sang cột `created_at` (`@Column(name = "created_at")`), đổi `@Index` columnList theo.
- Verify: `mvn clean test` -> `docker compose up -d --build backend` -> `curl POST /api/v1/auth/login` với `ui.probe.two.1017b@example.com` / `ProbePass!23` phải 200 và trả accessToken.
- Lý do ưu tiên: mọi verify UI hiện phải đi đường OAuth; tài khoản email (kể cả `admin@aiinterview.com`) không vào được.

## 2. Dọn nhãn tiếng Việt sót về chrome tiếng Anh — XONG (2026-10-17)

Phạm vi đã chốt và áp dụng: chỉ màn có mockup sang tiếng Anh; `CvAnalyzerPage`/`CoverLettersPage` + message `useCvController` giữ tiếng Việt. Ngoài nhãn trong trang, đã dịch luôn `setError`/`setSuccessMsg` trong controller, `INTERVIEW_MODE_LABELS`, default `LoadingState`, `ConfirmDialog` (`Confirm`/`Cancel`), `UserDetailModal`. Chi tiết + lệnh scan lại: `spec/known-gaps.md` mục "Lặt vặt UI".

## 3. Màn calendar slot cho employer (`interview_booking_calendar_slots`) — XONG (2026-10-17)

- File mới: `frontend/src/views/pages/InterviewCalendarPage.tsx` (lịch tuần, Add Availability, Cancel slot — dùng `useSlotController` thật).
- Route: `/my-slots/calendar`, guard `ROLE_INTERVIEWER/ADMIN/STAFF`; sidebar "Employer Workspace > Slot Calendar".
- Khối mockup bỏ (không có field/endpoint): duration/timezone/platform, Booking Summary phía ứng viên, suggested tags, live-sync latency.

## 4. Nối thật các màn đang STATIC (chỉ làm khi có backend)

| Màn | Route hiện tại | Cần gì |
|---|---|---|
| Job approval | `/admin/job-approvals` | endpoint duyệt/từ chối + lưu lý do |
| Rubric Studio | `/admin/rubrics` | bảng rubric/prompt + API đọc/ghi |
| Hiring Analytics | `/admin/analytics` | API aggregate (funnel, calibration, bias) |
| Candidate scorecard | `/candidates/:id/evaluation` | API điểm theo tiêu chí (hiện chỉ có `score` từng câu) |
| 2FA / magic link | `/two-factor`, `/magic-link` | API 2FA + magic link |

Gắn vào sidebar **sau** khi nối thật, không gắn lúc còn số liệu bịa.

## 5. Upload CV thật (mà ứng viên sẽ gặp đầu tiên)

- Hiện `cvFileName` chỉ là text; chưa có endpoint multipart.
- Cần: `POST /api/v1/cv/upload` (file -> tên + text trích), giới hạn `.pdf,.docx`, size; và rule chặn **lúc ghi** với file sai định dạng (422).
- Tạm thời UI đã ẩn toàn bộ khối upload — không phải workaround, mà vì chưa có endpoint.

## 6. Dọn dẹp repo (không commit cùng lô tính năng)

- ~~File `backend;C` ở gốc repo~~ -> đã xoá (2026-10-17, thư mục rỗng do typo redirect).
- `tmp-sso-negative-test.mjs` ở gốc repo: script probe SSO, chưa xoá (còn dùng để test luồng Keycloak) — **không commit**.
- `frontend/src/views/pages/*.test.tsx` tạm: đã xoá hết.
- Tài khoản probe `ui.probe.two.1017b@example.com` (id 12) còn nằm trong DB local — chỉ là dữ liệu test, không commit gì liên quan.
- `spec/` vẫn untracked; chưa commit gì trong session này.

## 7. Múi giờ khi tạo slot — XONG (2026-10-17)

- `MySlotsPage.tsx` + `InterviewCalendarPage.tsx` không còn `toISOString()`, gửi chuỗi local `YYYY-MM-DDTHH:mm:00` khớp kiểu `LocalDateTime` của `SlotRequest`.
- Đã đo end-to-end trên code production: nhập 10:00–10:30 -> `select interview_slots` ra `2026-10-19 10:00:00` (trước fix ra `03:00`); ô lịch và danh sách `/my-slots` hiển thị đúng 10:00 và 14:00. Row test đã xoá, role id 8 đã trả `ROLE_USER`.
- Còn mở (quyết định riêng, không phải lỗi UI): container backend chạy đồng hồ UTC nên rule "không tạo slot quá khứ" vẫn so theo UTC -> slot chiều nay giờ VN có thể bị nhận là quá khứ. Chọn một: `TZ` cho service backend trong `docker-compose.yml`, hay bỏ/đổi rule server.
- Hệ quả dữ liệu: slot đã tạo **trước** fix (nếu có trên staging TiDB) đang lưu lệch -7h, không tự về đúng.

## 8. Việc còn lại

Theo mục 4 (nối thật màn STATIC, cần endpoint trước) và mục 5 (upload CV thật + 422 lúc ghi).
