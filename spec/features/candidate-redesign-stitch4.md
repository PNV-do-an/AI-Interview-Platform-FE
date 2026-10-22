# Candidate redesign theo bộ mockup Stitch 4 (2026-10-22)

Trạng thái: `ready`
Người/phiên tạo: 2026-10-22, branch `feature/MVP-candidate-page`
Mockup nguồn: `D:\stitch_ai_interview_platform (4).zip` — giải nén ở
`C:\Users\huy\Downloads\.stitch_extracts\latest_4\stitch_ai_interview_platform\`
(5 màn `code.html` + `screen.png` + token `ai_interview_career_nexus/DESIGN.md`).

## 1. Mục tiêu

Ứng viên (ROLE_USER) dùng toàn bộ luồng chính bằng tiếng Việt theo thiết kế mới:
hồ sơ & CV, theo dõi đơn ứng tuyển, đặt lịch phỏng vấn với NTD, đọc báo cáo phỏng vấn AI +
lịch sử luyện tập, và tự đổi mật khẩu trong trang cài đặt tài khoản — mọi số liệu lấy từ API thật.

## 2. Phạm vi / Không làm

**Làm (5 màn mockup mới + shell):**
1. `h_s_cv` → dựng lại `views/pages/CandidateProfilePage.tsx` (`/my-profile`).
2. `screen_7_theo_d_i_n_ng_tuy_n` → dựng lại `views/pages/MyApplicationsPage.tsx` (`/my-applications`).
3. `t_l_ch_ph_ng_v_n` → màn MỚI `views/pages/CandidateBookingPage.tsx` (`/interview-booking`, ROLE_USER).
4. `screen_10_k_t_qu_ph_ng_v_n` → dựng lại `views/pages/MockInterviewResultPage.tsx`
   (`/mock-interviews/:id/result`) + màn MỚI `views/pages/InterviewHistoryPage.tsx`
   (`/interview-history`, ROLE_USER) chứa bảng lịch sử + tab lọc để mở được từ sidebar.
5. `c_i_t_t_i_kho_n` → màn MỚI `views/pages/CandidateAccountSettingsPage.tsx` (`/account-settings`, ROLE_USER).
6. `AppLayout`: sidebar/header tiếng Việt theo chrome mockup mới + 3 item nav mới
   (Đặt lịch phỏng vấn, Lịch sử & Đánh giá, Cài đặt tài khoản). Cập nhật `conventions/frontend-ui.md` §2
   (candidate chrome = tiếng Việt) và `spec/INDEX.md`.

**Không làm:**
- Không đổi 5 màn candidate KHÔNG có trong bộ mockup 4: Dashboard (`/dashboard`), Tìm việc (`/jobs`),
  Job detail (`/jobs/:id`), Live session (`/mock-interviews/:id`), Device check (`/device-check`),
  CV Analyzer, Cover Letters — giữ nguyên nội dung, chỉ chịu shell mới.
- Không đụng luồng employer/admin/auth.
- Không thêm endpoint giả, không bịa số liệu (luật §3 conventions).
- Không commit script probe/tạm.

## 3. API thật dùng được

Base `REACT_APP_API_URL` (Docker local: BE `:8081`). Bảng dưới là hợp đồng FE đang gọi
(`src/services/*`); cột "curl verify" chốt ngày 2026-10-22 trên stack Docker local.

| Endpoint | Method | Dùng cho | curl verify |
|---|---|---|---|
| `/api/v1/auth/me` | GET | email, fullName, role (mọi màn) | đối chiếu source BE 22/10 |
| `/api/v1/candidate-profile` | GET/PUT | skills, experienceYears, summary, careerGoal, cvFileName, updatedAt (Hồ sơ & CV) | đối chiếu source BE 22/10 |
| `/api/v1/applications/my` | GET | danh sách đơn: status, score, feedback, slot, createdAt (Đơn ứng tuyển, Đặt lịch, stat) | đối chiếu source BE 22/10 |
| `/api/v1/applications/{id}/cancel` | PATCH | hủy đơn | đối chiếu source BE 22/10 |
| `/api/v1/applications/book-slot` | POST {slotId, applicationId} | Đặt lịch phỏng vấn | đối chiếu source BE 22/10 |
| `/api/v1/slots/available?employerId=` | GET | khung trống theo tuần (Đặt lịch) | đối chiếu source BE 22/10 |
| `/api/v1/mock-interviews` | POST | "Mock interview 15 phút theo JD này" + Retake | đối chiếu source BE 22/10 |
| `/api/v1/mock-interviews/my` | GET | bảng Lịch sử & Đánh giá | đối chiếu source BE 22/10 |
| `/api/v1/mock-interviews/{id}` | GET | báo cáo: session + answers[question, answerText, durationSec, score, feedback] | đối chiếu source BE 22/10 |
| `/api/v1/cv/my` | GET | phân tích CV gần nhất (skills trích xuất) | đối chiếu source BE 22/10 |
| `/api/user/change-password` | POST | Đổi mật khẩu (base KHÔNG có /v1 — đã verify ở AdminAccountSettingsPage) | đã verify 21/10 |
| `/api/v1/jobs` / `/api/v1/jobs/{id}` | GET | job select cho form luyện theo JD | đã verify |

**Đã đối chiếu source BE `D:\AI-Interview-Platform-BE` ngày 2026-10-22** (thay cho curl vì DB local trống):
- `CandidateProfileRequest/Response`: đúng 5 field `skills, experienceYears, summary, careerGoal, cvFileName` (+`updatedAt`). Không có phone/location/salary.
- `AuthResponse.UserInfo` **có `phone`** (chỉ đọc — self-PATCH user không tồn tại, chỉ admin có `AdminUpdateProfileRequest`).
- `ApplicationStatus` = `PENDING, SCHEDULED, INTERVIEWED, ACCEPTED, REJECTED, CANCELLED` -> stepper 5 chặng derive từ enum thật (mục 4 S2).
- `MatchResponse` (matchScore 0-100) chỉ có ở `GET /jobs/{id}/suggestions` phía **employer** -> candidate không có "độ khớp AI", bỏ đúng như mục 5.
- `SlotResponse` có `note` (đọc); `BookSlotRequest` chỉ nhận `slotId + applicationId` (không có note/meetingUrl).
- `InterviewSessionResponse`: `mode, topic, jobTitle, companyName, status(IN_PROGRESS|COMPLETED), answeredCount, overallScore, createdAt, completedAt`; `InterviewAnswerResponse`: `questionIndex, question, answerText, durationSec, score, feedback`.

Không có endpoint nào mà UI cần -> mục 5 (bỏ), không bịa.

## 4. Ánh xạ số liệu -> UI

**S1 Hồ sơ & CV (`/my-profile`)**
| Thành phần mockup | Nguồn | Khi trống |
|---|---|---|
| Họ tên / Email (readonly) | `auth.user.fullName` / `email` | — |
| Tóm tắt chuyên môn (textarea) | `profile.summary` | rỗng |
| Kỹ năng + nhóm | `profile.skills` (splitCommaList); chip "đã trích xuất" = `detectedSkills` của CV analysis mới nhất (`/cv/my[0]`), nút "Thêm tất cả" gộp vào skills | ẩn khối trích xuất |
| Số năm kinh nghiệm | `profile.experienceYears` | 0 |
| Mục tiêu nghề nghiệp | `profile.careerGoal` | rỗng |
| Tên file CV đang dùng | `profile.cvFileName` (text, KHÔNG upload) | "Chưa có" |
| "Cập nhật lần cuối" | `profile.updatedAt` qua `parseServerTimestamp` | ẩn |
| CTA "Xem trước CV công khai" | link `/opportunities` | — |

**S2 Đơn ứng tuyển (`/my-applications`)**
| Thành phần | Nguồn | Khi trống |
|---|---|---|
| 4 stat card (Tổng đơn / Đang xét duyệt / Đã có lịch PV / Đã nhận Offer) | đếm từ `/applications/my` theo `status` + `slot != null` | số 0 thật |
| "Tỷ lệ thành công" | offers / total, làm tròn; total=0 -> ẩn dòng | ẩn |
| Card nổi bật "Đang tiến hành" | đơn mới nhất chưa kết thúc | ẩn cả khối |
| Stepper 5 chặng | **derive** từ `status` (SCREENING→chặng 2, INTERVIEWING→3/4, OFFER→5) + `slot` + `score`; chỉ tô chặng có bằng chứng, chặng chưa tới để trống | — |
| Bảng: Vị trí / Doanh nghiệp / Ngày nộp / Trạng thái / Hành động | `jobTitle, companyName, createdAt, status` (`APPLICATION_STATUS_LABELS` dịch VN trong model) | empty state |
| Tab lọc + tìm kiếm + "30 ngày gần đây" + sắp xếp | client-side trên danh sách đã tải (BE không nhận tham số) — ghi chú như màn history admin | — |
| "Luyện phỏng vấn 15 phút theo JD này" | `/mock-interviews?jobId=` (form start có sẵn job select) | — |
| Đặt lịch từ đơn có slot trống | link `/interview-booking?applicationId=` | — |
| Hủy đơn | ConfirmDialog + PATCH cancel (giữ logic cũ) | — |

**S3 Đặt lịch phỏng vấn (`/interview-booking`)**
| Thành phần | Nguồn | Khi trống |
|---|---|---|
| Chọn đơn ứng tuyển (thay "chọn cố vấn") | `/applications/my` chưa có slot, trạng thái đang mở | empty state "chưa có đơn" |
| Lịch tuần + ca trống | `/slots/available?employerId=` của đơn đã chọn; lọc sáng/chiều client-side | "tuần trống" |
| "Thời lượng" | `endTime - startTime` của slot | — |
| Xác nhận | POST book-slot {slotId, applicationId}; 409/422 -> banner lỗi `readApiErrorMessage` | — |
| Thành công | toast + chuyển `/my-applications` | — |

**S4 Lịch sử & Đánh giá (`/mock-interviews/:id/result`, `/interview-history`)**
| Thành phần | Nguồn | Khi trống |
|---|---|---|
| Điểm tổng hợp + nhãn (ring) | `session.overallScore`; nhãn theo scoreBand hiện có | ẩn ring |
| "Luyện lại phiên này" / Retake | POST `/mock-interviews` cùng jobId/topic | — |
| Thời lượng | `completedAt - createdAt` qua `parseServerTimestamp` | ẩn |
| 3 cột Điểm mạnh / Cần cải thiện / Lưu ý | **derive** từ `answers[]`: score ≥ 8 → tóm tắt feedback vào cột mạnh; ≤ 5 → cột cải thiện; feedback chứa gợi ý → cột còn lại; chỉ dùng text thật, không chế lời mới | ẩn cột rỗng |
| Chi tiết từng câu (accordion) | `answers[]`: question, answerText, durationSec, score, feedback | — |
| Bảng lịch sử (tab "Tất cả" + tab theo topic) | `/mock-interviews/my`, group `topic` client-side; phân trang client-side | empty state |
| Cột Đánh giá | nhãn suy từ `overallScore` (thang scoreBand) | "Chưa chấm" khi null |

**S5 Cài đặt tài khoản (`/account-settings`)**
| Thành phần | Nguồn | Khi trống |
|---|---|---|
| Email (readonly) | `auth.user.email` | — |
| Họ tên | hiển thị readonly `fullName` (BE chưa có self-PATCH) | — |
| Đổi mật khẩu: 3 ô + meter + 4 rule | POST `/api/user/change-password`; rule + đặc biệt `@#$%^&+=!` khớp `AdminAccountSettingsPage` | lỗi 422 từng rule |
| Sau khi đổi | cảnh báo "mọi phiên phải đăng nhập lại" (tokenVersion tăng — đã verify 21/10) | — |
| "Cập nhật lần cuối" | `profile.updatedAt` | ẩn |

## 5. Khối mockup BỎ + lý do

**S1:** ảnh đại diện + đổi ảnh; toggle "Sẵn sàng nhận lời mời"; "12 lượt xem hồ sơ"; "94.8% khớp thuật toán";
vòng "% hoàn thiện"; SĐT / vị trí mong muốn / địa điểm / mức lương (CandidateProfile không có field —
xem `models/Program.model.ts`); upload kéo-thả PDF/DOCX (không có `POST /cv/upload`, parity §5);
gợi ý kỹ năng theo JD (không endpoint chấm khớp); Kinh nghiệm làm việc + Học vấn & Chứng chỉ CRUD
(không bảng/endpoint — ghi ở mục 6).
**S2:** "Độ khớp AI %" từng dòng; "Xuất báo cáo PDF/Excel"; "Đồng bộ 2 phút trước"; avatar HR;
nút "Vào phòng họp" + "Lưu Lịch Google" (Slot không có platform/meetingUrl); "Lời khuyên từ AI Copilot";
claim "nhận Offer cao hơn 42%" (số bịa — bỏ số, giữ CTA luyện tập).
**S3:** ảnh + rating "4.9 (120+ buổi)" của cố vấn; "Đổi người phỏng vấn"; "Lượt phỏng vấn Pro 3/5";
chọn "Mục tiêu phỏng vấn mô phỏng"; hồ sơ CV gửi kèm + "Thay đổi"; ô ghi chú cho mentor (book-slot không nhận note);
2 checkbox AI Co-Pilot / nhắc SMS + Google Calendar; "Quyền lợi gói Pro"; 2 card "AI Co-Pilot hoạt động thế nào" /
"Chính sách đổi lịch" (chính sách chưa tồn tại trong BE).
**S4:** "Top 78% ứng viên"; "Hệ thống 10 chuyên chuẩn" + 4 thanh năng lực có điểm (BE không có score theo tiêu chí —
parity §4 đã ghi); chip "Từ vựng AI tích cực"; waveform + phát audio câu trả lời (không có file ghi âm);
chip "Chủ đề" từng câu.
**S5:** vòng "85% an toàn" + checklist; SĐT liên hệ; "Cập nhật 45 ngày trước"; cả card "Tài khoản liên kết"
(Google/GitHub/LinkedIn — không có API link/unlink, user model không có provider field); 2FA;
Active Sessions; toàn bộ "Cài đặt thông báo & Việc làm" (3 toggle); "Cho phép NTD tìm thấy hồ sơ";
Khu vực nguy hiểm (Tạm khóa / Xóa vĩnh viễn — không có self-service endpoint).

## 6. Việc backend cần làm (chỉ ghi nhận, không chặn wave này)

- `POST /api/v1/cv/upload` multipart (parity §5).
- Field mở rộng cho `candidate-profile`: fullName/phone tự sửa, location, salaryExpectation.
- Bảng + API `experiences`, `educations` cho hồ sơ.
- `applications`: matchScore/`stage` tường minh thay vì suy từ status; `meetingUrl` trên slot đã đặt.
- Scorecard theo tiêu chí cho `/candidates/{id}/evaluation` (đã có trong parity §4).
- Self-service: khóa/xóa tài khoản, danh sách phiên, link/unlink OAuth.
- Rule mới phải chặn **lúc ghi** (422), không lưu rồi lộ khi GET.

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | ROLE_USER mở app | sidebar tiếng Việt đủ 7 mục workspace + 3 mục footer; mọi item trỏ route hợp lệ, không 403 |
| 2 | Chưa có đơn ứng tuyển | `/my-applications`: stat = 0, empty state; `/interview-booking`: hướng dẫn "nộp đơn trước" |
| 3 | Có đơn SCREENING chưa slot | stepper hiện chặng 2, không chặng nào sáng phía sau |
| 4 | Đặt slot thành công | đơn chuyển trạng thái/slot hiện ở `/my-applications`; slot biến khỏi `/slots/available` |
| 5 | Slot vừa bị người khác đặt | book-slot trả lỗi -> banner tiếng Việt từ `readApiErrorMessage`, form không reset mất chọn |
| 6 | Session chưa finish (overallScore null) | result page hiện "Chưa chấm", không có `NaN` |
| 7 | Đổi mật khẩu sai rule | lỗi 422 từng dòng từ BE hiển thị đúng ô |
| 8 | Hồ sơ trống | `/my-profile` render form rỗng, không crash; lưu PUT OK rồi reload giữ dữ liệu |
| 9 | ROLE_INTERVIEWER mở `/interview-booking`, `/account-settings`, `/interview-history` | `/unauthorized` |
| 10 | Màn cũ `/dashboard`, `/jobs/:id`, `/device-check` | còn chạy được trong shell mới (không regress) |

## 8. Cách đã verify (2026-10-22)

**Type & build**: `npx tsc --noEmit` sạch. `docker compose build frontend` 3 vòng, mỗi vòng đối
chiếu hash bundle do `:3000` trả về với file trong container `aiinterview-frontend`
(... -> `main.1ae662f5.js` -> `main.25049a1a.js` -> `main.a082b811.js` = bản cuối đã push).

** DOM**: browser-use `navigate_page` + `evaluate_script` đọc `main`/`document.scripts`, tài khoản
ROLE_USER tạm tạo qua `POST /auth/register` (xóa sau khi verify). Số liệu trên các màn là data seed
DB local (3 đơn, 3 slot, 3 phiên) — **không phải data thật của anh Huy**; seed và row đã xóa sạch
`spec/verification.md` mục 4).

| # | Kết quả đo |
|---|---|
| 1 | Sidebar 7 mục workspace (Tổng quan, Hồ sơ & CV, Đơn ứng tuyển [badge 3], Lịch phỏng vấn, Luyện phỏng vấn AI, Lịch sử & Đánh giá, Tìm việc) + Cài đặt tài khoản + Trợ giúp & Hỗ trợ; badge đếm đúng từ `totalElements`. 6 route candidate + `/dashboard`, `/jobs/10`, `/device-check` đều render, không 403. |
| 2 | Empty: `/my-applications` -> "Chưa có đơn ứng tuyển nào." + CTA "Mở Bảng việc làm"; `/interview-booking` -> "Chưa có đơn nào cần đặt lịch...". **Lệch plan**: 4 stat card bị ẩn luôn khi 0 đơn thay vì hiện số 0 (tránh 4 ô toàn 0 + empty state trùng nội dung). |
| 3 | Đơn PENDING chưa score/chưa slot -> "Chặng 2/5", chặng 3 "Chưa có điểm", các chặng sau `lock`. Sau khi đặt lịch -> "Chặng 4/5" + "4. Tech Lead Interview 24/10/2026 16:03". |
| 4 | Đặt slot 24/10 từ UI: banner thành công, slot biến khỏi `GET /slots/available`, `/my-applications` hiện "Hẹn lịch: 24/10/2026" + card buổi phỏng vấn (ghi chú NTD). |
| 5 | Tranh chấp slot: chọn slot -> `UPDATE interview_slots SET booked_by=1` (giả NTD khác) -> bấm xác nhận -> BE trả "Khung giờ này đã có người đặt" hiển thị dạng banner, **không** mất lựa chọn; đếm ca tự cập nhật 2 -> 1 trống. |
| 6 | Phiên `IN_PROGRESS` (id 4): "Chưa hoàn thành phiên", "CHƯA CHẤM", "Đang diễn ra", accordion 0/2 câu; `innerText` không chứa `NaN`/`undefined`. |
| 7 | BE 400 "Mật khẩu hiện tại không đúng" gắn đúng ô *Mật khẩu hiện tại*, 2 ô kia sạch. Mật khẩu không khớp -> FE chặn trước khi gọi API ("Mật khẩu không khớp" + submit disabled). Ghi chú trung thực: vi phạm rule đơn thuần bị FE gate (meter 4/4) chặn **trước** nên nhánh 422 per-field của BE không tới được từ màn này — map `detail.currentPassword/newPassword` giữ làm defensive path, chưa đo bằng 422 thật. |
| 8 | Xóa `candidate_profiles` -> form rỗng ("Chưa ghi nhận kinh nghiệm", 0 kỹ năng, 0/600 ký tự), không crash. Sửa summary + thêm skill "Node.js" -> `PUT` OK -> reload vẫn giữ dữ liệu, chip "Lần lưu gần nhất: vừa xong". |
| 9 | `UPDATE users SET role='ROLE_INTERVIEWER'` + đăng nhập lại: `/interview-booking`, `/account-settings`, `/interview-history` đều rơi `/unauthorized` (403 tiếng Việt). Đã trả lại `ROLE_USER`. |
| 10 | `/dashboard` (cv-ui-verify.pdf, pipeline 2, AI score 82), `/jobs/10`, `/device-check` (2/5 checks) render trong shell mới, không `NaN`. `/device-check` tới được bằng nút "Check camera & mic" ở `/mock-interviews` (đã rời sidebar). |

**Lỗi tìm ra khi verify và đã sửa trong wave này**
1. Ô "Thời gian đã chọn" ở `/interview-booking` parse `LocalDateTime` naive bằng `new Date()` ->
   lệch 7h so với chính ô lịch bên trái (09:03 vs 16:03). Nay dùng `parseServerTimestamp`
   (`chosenStart`/`chosenEnd`).
2. `ErrorBlock` đặt trần (không `{error && ...}`) ở 4 màn -> thanh đỏ rỗng + nút "Thử lại" hiện ngay
   cả khi tải thành công. Đã guard: `MyApplicationsPage`, `CandidateBookingPage`,
   `InterviewHistoryPage`, `MockInterviewResultPage`.
3. Phiên COMPLETED mà thiếu `completedAt` (data lỗi) bị gọi là "Đang diễn ra"/"Chưa hoàn thành" ->
   nay ra "Chưa ghi nhận" (đo với phiên seed id 5).
4. `font-ds-*` (68 lần) là class chết vì `tailwind.config.js` không khai báo fontFamily đó -> đã gỡ.
5. Hai lỗi TS có sẵn ở `AppLayout.tsx` chặn build: `PagedResponse.total` -> `totalElements`;
   footer "Trợ giúp & Hỗ trợ" dùng `<Link>` với `className` là function -> `<NavLink>`.

**Chưa verify bằng mắt**: layout/đẹp vỡ ở >=1024px (viewport browser-use ẩn, chỉ đọc DOM).

## 9. Chốt phạm vi (đã hỏi anh Huy 2026-10-22)

- Màn không có trong bộ 4 (dashboard, tìm việc, job detail, live session, device check, CV analyzer,
  cover letters): **giữ nguyên nội dung cũ, chỉ chịu shell Việt** — chờ mockup mới cho từng màn.
- Sidebar candidate theo ĐÚNG mockup: 7 mục workspace + footer (Cài đặt tài khoản, Trợ giúp & Hỗ trợ,
  Đăng xuất). **Bỏ** 3 item CV Analysis / Cover Letters / Device Check khỏi sidebar; các màn đó vẫn
  reachable qua link nội bộ (DeviceCheck đã có CTA từ màn kết quả; CV Analyzer/Cover Letters giữ link
  từ trang Hồ sơ & CV nếu mockup có chỗ, không thì để route tay).
