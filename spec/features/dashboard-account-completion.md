# Hoàn thành Tổng quan ứng viên + Cài đặt tài khoản (2FA)

Trạng thái: `done` — đã verify 16/11 bằng browser + probe user `cv.probe.20261115` (kết quả ở mục 8).
Người/phiên tạo: 2026-11-15, branch `feature/update-profile`
Mockup nguồn: `t_ng_quan_ng_vi_n` + `c_i_t_t_i_kho_n_ng_vi_n` (bộ Stitch `(5).zip` 2026-10-26). Zip và bản giải nén đã không còn trên máy — nguồn chân lý hiện tại là `spec/INDEX.md` + code FE đã dựng.

## 1. Mục tiêu

Ứng viên bật/tắt được xác thực 2 lớp (TOTP) thật ngay trong màn Cài đặt tài khoản, và màn Tổng quan được chốt hiện trạng: mọi số đã là dữ liệu thật, hai khối còn demo giữ nguyên nhãn vì backend chưa có endpoint.

## 2. Phạm vi / Không làm

- Làm:
  - `/account` — thẻ "Xác thực 2 yếu tố (2FA)" thành luồng thật: xem trạng thái, bật (QR + OTP + mã dự phòng), tắt (OTP hoặc mã dự phòng). BE wave 010 đã đóng đủ 4 endpoint, service FE đã có sẵn 4 hàm (`auth.service.ts` dòng 100–111) — chỉ còn controller + UI.
  - Sửa copy thẻ 2FA: bỏ "hoặc SMS" — BE chỉ có TOTP qua ứng dụng xác thực.
  - Thêm dependency `qrcode.react` để render QR từ `otpauthUri`.
- Không làm (kỳ này):
  - `/dashboard` — không còn việc nối số; 2 khối demo ("Năng lực cốt lõi AI", "Mẹo vàng") giữ `DemoTag` vì không có API (xem mục 6).
  - Các khối demo còn lại của `/account`: điểm an toàn 85%, kênh nhận thông báo, 4 công tắc thông báo, tài khoản liên kết, Danger Zone, "Mẹo từ trợ lý AI" — không có endpoint.
  - `PATCH /api/v1/applications/{id}/unschedule|reschedule` — endpoint mới nhưng thuộc màn `/my-interviews` (đổi lịch), ngoài phạm vi 2 màn này.
  - Bắt buộc 2FA theo chính sách, WebAuthn/passkey (BE spec 010 đã ghi out of scope).

## 3. API thật dùng được

| Endpoint | Method | Request | Response | Ghi chú |
|---|---|---|---|---|
| `/api/v1/auth/2fa` | GET | — | `data.enabled: boolean` | Trạng thái cho pill + nút. BE `TwoFactorController.status`, commit `34939ce` (spec `010-two-factor-auth`). |
| `/api/v1/auth/2fa/setup` | POST | — | `data.{secret, otpauthUri, accountName, issuer}` | Gọi lại sẽ thay secret cũ — luôn render QR từ response mới nhất. FE tự render QR từ `otpauthUri`. |
| `/api/v1/auth/2fa/enable` | POST | `{code: "123456"}` | `data.recoveryCodes: string[8]` | Chỉ trả đúng một lần; BE giữ hash. OTP sai → 4xx + message BE, hiện nguyên văn. |
| `/api/v1/auth/2fa/disable` | POST | `{code: "123456" \| "XXXXX-XXXXX"}` | `success: true` | Nhận OTP hiện tại HOẶC recovery code. Pattern BE chặn lúc ghi: `^([0-9]{6}\|[A-Za-z0-9]{5}-[A-Za-z0-9]{5})$`. |
| `/api/v1/auth/verify-otp` | POST | `{challengeToken, code}` | `AuthResponse` như login | **Đã nối**: `useAuthController.verifyOtp` + màn `/two-factor`. Không đụng kỳ này trừ câu 9.1. |
| `/api/v1/auth/login` | POST | email/password | `mfaRequired + challengeToken` khi bật 2FA | **Đã nối**: `useAuthController` dòng 86–88 lưu challengeToken, điều hướng `/two-factor`. |

Đang dùng sẵn ở `/dashboard` (liệt kê để đủ bức tranh, không đổi): `GET /api/v1/applications/my`, `GET /api/v1/mock-interviews/my`, `GET /api/v1/jobs`.

Chưa ai dùng trong FE (ghi nhận, không làm kỳ này): `PATCH /api/v1/applications/{id}/unschedule`, `PATCH /api/v1/applications/{id}/reschedule`, `GET /api/v1/applications/{id}` (inventory BE dòng 105–108).

## 4. Ánh xạ số liệu -> UI (thẻ 2FA, `/account`)

| Thành phần | Nguồn | Xử lý khi trống/lỗi |
|---|---|---|
| Pill "Đang tắt" / "Đang bật" | `GET /api/v1/auth/2fa` → `enabled` | Lỗi mạng: hiện message + nút thử lại, KHÔNG hiện giá trị mặc định đoán |
| Nút "Kích hoạt 2FA" (khi tắt) | mở flow bật | Bấm → `POST /setup` → modal QR (`otpauthUri`) + secret nhóm 4 ký tự + ô nhập OTP 6 số → `POST /enable` |
| 8 mã dự phòng | `enable.recoveryCodes` | Modal hiện đúng một lần sau khi bật (nút copy); đóng là mất — copy phải nói rõ "chỉ hiển thị một lần" |
| Nút "Tắt 2FA" (khi bật) | mở flow tắt | Ô nhập chấp nhận cả OTP 6 số lẫn `XXXXX-XXXXX` → `POST /disable` → pill về "Đang tắt" |
| Copy "hoặc SMS" | — | Bỏ; chỉ "ứng dụng xác thực (Google Authenticator / Authy…)" |
| QR | `otpauthUri` | Render bằng `qrcode.react` (React 18.3.1, dùng v4). Phương án dự phòng nếu anh không muốn thêm lib: hiện secret dạng chữ + link `otpauth://` |

Lưu ý hệ quả thật (đừng viết sai copy): bật 2FA **không** thu hồi phiên đang đăng nhập (khác đổi mật khẩu) — chỉ chặn từ lần đăng nhập sau.

## 5. Khối mockup BỎ + lý do

- `/account` — "điểm an toàn 85%", "Kênh nhận thông báo", 4 công tắc thông báo, "Tài khoản liên kết" (Google/GitHub/LinkedIn), "Danger Zone", "Mẹo từ trợ lý AI 40%": inventory BE không có endpoint/field nào (không có NotificationController, không có trường security score). Giữ nguyên chữ mockup + `DemoTag` như hiện tại.
- `/dashboard` — "Năng lực cốt lõi AI" (4 thanh % theo từng năng lực): BE chỉ có `overallScore` tổng của mỗi phiên, không có điểm từng chiều. "Mẹo vàng 40% tỷ lệ đỗ": không có dữ liệu tỷ lệ đỗ. Cả hai đã dán nhãn "Khối demo" + chữ giải thích, giữ nguyên.
- `/two-factor` — tab "Khóa bảo mật" và "Tin nhắn dự phòng": BE chỉ có một kênh TOTP. (Xử lý theo chốt câu 9.4.)

## 6. Việc backend cần làm (nếu có)

Kỳ này **không cần BE** — wave 010 đã đóng đủ. Nếu sau này anh muốn 2 khối demo của dashboard thành thật, cần endpoint mới, ví dụ:

- `GET /api/v1/mock-interviews/my/skills-summary` → `{skills: [{label, pct}]}` gộp điểm theo chiều năng lực từ các phiên đã chấm (hiện rubric 5 chiều chỉ nằm trong từng phiên AVATAR, chưa có tổng hợp).
- Tỷ lệ đỗ vòng phỏng vấn → đếm từ bảng `applications` (status ACCEPTED / tổng SCHEDULED+INTERVIEWED) — chưa có endpoint aggregate cho role USER.

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | Mở `/account` khi chưa bật 2FA | Pill "Đang tắt", nút "Kích hoạt 2FA" hoạt động (hết `disabled`) |
| 2 | Bấm Kích hoạt → nhập OTP sai | Message lỗi BE hiện nguyên văn, vẫn ở bước nhập OTP |
| 3 | Nhập OTP đúng | Modal 8 mã dự phòng dạng `XXXXX-XXXXX`, đóng modal không xem lại được; pill "Đang bật" |
| 4 | Đăng xuất → đăng nhập lại | Nhận `mfaRequired` → sang `/two-factor` → OTP app vào được (luồng cũ vẫn chạy) |
| 5 | Bấm Tắt 2FA → nhập OTP đúng | Pill về "Đang tắt"; đăng nhập lại không bị challenge |
| 6 | Tắt bằng recovery code | Thành công; dùng lại đúng code đó lần nữa → lỗi (code một lần) |
| 7 | Gọi setup 2 lần liên tiếp | QR render từ `otpauthUri` của lần gọi sau (secret cũ hết hiệu lực) |
| 8 | Mở `/dashboard` sau wave | Không đổi hành vi: 4 thẻ số, lịch sắp tới, tiến độ đơn, lịch sử luyện tập vẫn số thật; 2 khối demo vẫn có nhãn |

## 8. Kết quả verify (16/11)

Dựng Docker local (BE 8081 + FE 3000), probe user `cv.probe.20261115@example.com`, đo bằng browser-use DOM. Kết quả:

| # | Test case | Kết quả |
|---|---|---|
| 1 | `/account` chưa bật 2FA | Pill "Đang tắt" + nút "Kích hoạt 2FA" hoạt động ✓ |
| 2 | OTP sai khi bật | Message BE "Mã OTP không đúng. Hãy kiểm tra lại ứng dụng xác thực." hiện nguyên văn ✓ |
| 3 | OTP đúng khi bật | Modal 8 mã `XXXXX-XXXXX` + "Sao chép tất cả"; pill "Đang bật", chip "Đã bật 2FA" ✓ |
| 4 | Đăng nhập lại → challenge | Vào `/two-factor`, OTP app vào được dashboard ✓ |
| 5 | Tắt bằng OTP | Pill về "Đang tắt" + message thành công; BE `enabled:false` ✓ |
| 6 | Tắt/recovery code | Curl: tắt bằng recovery code thành công; dùng lại code đó → bị chặn. UI `/two-factor` chế độ recovery: đăng nhập bằng code mới thành công; dùng lại đúng code đó → "Mã xác thực không đúng" ✓ |
| 7 | Setup 2 lần | QR render từ `otpauthUri` response mới ✓ (cùng cơ chế, đã chạy lại vòng bật) |
| 8 | `/dashboard` sau wave | Không đổi: số thật giữ nguyên, 2 khối demo giữ nhãn ✓ |

**Bug tìm thấy khi verify và đã sửa:** `TwoFactorPage` dùng instance `useAuthController` riêng nên `ProtectedRoute` (đọc state từ `AuthProvider`) không biết phiên mới sau `verifyOtp` → đăng nhập 2FA xong bị đá về `/login`. Sửa: thêm `verifyOtp` vào `AuthContext` và `TwoFactorPage` dùng `useAuth()` như `LoginPage`.

Lưu ý khi build local: `.env.production` trỏ staging nên phải build kèm `--build-arg REACT_APP_API_URL=http://localhost:8081` (Dockerfile đã nhận ARG này). Browser-use đang viewport ẩn nên bấm nút bằng `evaluate_script` (bấm đúng nút submit trong `form`, tránh nút "Đăng nhập với Google").

## 9. Câu hỏi mở cho anh Huy (đã chốt 16/11)

1. **Ô nhập recovery code ở màn `/two-factor` (login challenge) có làm luôn không?** Hiện ô chỉ nhận 6 chữ số, nút "Dùng mã khôi phục khẩn cấp" là nút chết — không sửa thì 8 mã dự phòng trả ra ở bước bật không dùng được ở đâu. Đề xuất: có — cùng một ô, thêm chế độ nhập `XXXXX-XXXXX`, không thêm màn mới.
2. **Thêm dependency `qrcode.react` (~30KB, dùng React 18) hay chỉ hiện secret dạng chữ + link otpauth?** Đề xuất: thêm lib cho đúng mockup vẽ QR.
3. **Hai khối demo của `/dashboard` giữ hay bỏ hẳn?** Đề xuất: giữ nguyên `DemoTag` (đã có chữ giải thích, không bịa số).
4. **Hai tab giả ở `/two-factor` ("Khóa bảo mật", "Tin nhắn dự phòng")?** Đề xuất: bỏ tab giả, chỉ còn kênh "Ứng dụng xác thực" + nút "Dùng mã dự phòng" thật (nếu câu 1 = có).
