# Redesign chức năng Luyện phỏng vấn AI (mockup Stitch 6 — 26/10)

Trạng thái: `ready` (đã chốt mục 9 ngày 2026-10-26)
Người/phiên tạo: 2026-10-26, branch `feature/AI-interview`
Mockup nguồn: `D:\stitch_ai_interview_platform (6).zip` — 2 màn, giải nén ở `D:\tmp\stitch6\stitch_ai_interview_platform\`:
- `luy_n_ph_ng_v_n_ai_candidate_portal_ai_interview_platform` (màn hub luyện tập)
- `screen_9_ph_ng_ph_ng_v_n_video_call_ai_t_ch_h_p_to_n_di_n` (màn video call với AI)
Token: cùng `ai_interview_career_nexus/DESIGN.md` với bộ (3)/(5) → `candidateKit` + token `ds-*`.

## 1. Mục tiêu

Ứng viên (ROLE_USER) mở "/Luyện phỏng vấn AI" thấy một portal tiếng Việt đúng mockup: chọn vị trí
tuyển dụng thật + số câu rồi bắt đầu ngay 1 trong 3 chế độ — luyện theo tin JD (MOCK), luyện chủ đề
(KNOWLEDGE), hoặc **vào phòng video call với AI** (mode AVATAR, hợp đồng BE 012 đã có sẵn).
Phòng video call ghi lại từng lượt hội thoại (câu hỏi AI + transcript trả lời của ứng viên) xuống BE
bằng JWT chính chủ, kết thúc giữa chừng được, và khi finish thì ứng viên nộp rubric 5 chiều để nhận
báo cáo.

## 2. Phạm vi / Không làm

- Làm:
  1. Dựng lại `MockInterviewsPage` (`/mock-interviews`) theo mockup 1, shell `CandidateLayout`.
  2. Màn mới `AvatarInterviewSessionPage` cho phiên `mode=AVATAR` theo mockup 2 (screen 9),
     route `/mock-interviews/:id` — cùng route với `MockInterviewSessionPage`, chọn màn theo `session.mode`
     (giống cách `App.tsx` chọn shell theo role).
  3. Nối model/service/controller cho nhánh AVATAR của spec 012: `transcript[]`,
     `POST /{id}/answer {questionText, answerText, confirm, durationSec}`,
     `POST /{id}/evaluation` (rubric 5 chiều), `GET /{id}/report`, `DELETE /{id}`.
  4. Màn báo cáo AVATAR: `GET /{id}/report` (5 chiều + overall do BE tính + strengths/improvements).
  5. `MockInterviewHistoryPage` (`/mock-interviews/history`) hiển thị thêm phiên AVATAR
     (label mode, link vào phòng/Mở lại, nút xóa phiên qua `DELETE /{id}`).
- Không làm:
  - Python AI service / LiveTalking / avatar lip-sync / WebRTC / STT / TTS thật — out of scope BE 012, repo khác.
  - Phiên AVATAR gắn đơn ứng tuyển thật / slot đã hẹn — BE 012 Phạm vi 3 nói rõ là luồng riêng.
  - Employer/ADMIN xem báo cáo avatar — BE 012 Phạm vi 6 chặn 403.
  - Restyle `MockInterviewSessionPage` (MOCK/KNOWLEDGE) sang chrome mockup 2 — màn đó giữ nguyên, chỉ thêm nhánh AVATAR.

## 3. API thật dùng được

| Endpoint | Method | Response/Request liên quan | Ghi chú |
|---|---|---|---|
| `/api/v1/mock-interviews` | POST | `mode=AVATAR` + `jobId` (bắt buộc), `questionCount` bị bỏ qua | BE 012; trả session `IN_PROGRESS`, `questions` rỗng |
| `/api/v1/mock-interviews` | POST | `mode=MOCK` + `jobId` + `questionCount 3..10`; `mode=KNOWLEDGE` + `topic` | như hiện có |
| `/api/v1/mock-interviews/{id}` | GET | `session` + `answers[]` + **`transcript[]`** `{index, questionText, answerText, confirmed, durationSec, answeredAt}` | transcript là nguồn hội thoại của phòng AVATAR |
| `/api/v1/mock-interviews/{id}/answer` | POST | `{questionText, answerText, confirm, durationSec}` — `confirm=false` upsert nháp, `true` chốt lượt + nhích index | trần 40 lượt → 400 |
| `/api/v1/mock-interviews/{id}/finish` | POST | `InterviewResult` | phiên AVATAR được finish giữa chừng |
| `/api/v1/mock-interviews/{id}/evaluation` | POST | `{rubric:{chuyenMon,duAn,tuDuy,truyenDat,mucKhop} 0..100 nguyên, rubricVersion, strengths?, improvements?}` | chỉ khi COMPLETED; `overallScore` BE tự tính |
| `/api/v1/mock-interviews/{id}/report` | GET | `InterviewReportResponse` (5 chiều + overall + strengths/improvements + rubricVersion + createdAt) | chưa có → 404 message tiếng Việt |
| `/api/v1/mock-interviews/{id}` | DELETE | 200 "Đã xóa phiên luyện tập" | xóa vĩnh viễn, có ConfirmDialog |
| `/api/v1/jobs` | GET | `jobs.content[{id,title,companyName}]` | nguồn chip "vai trò chuyện môn" + select JD cho AVATAR/MOCK |
| `/api/v1/interviews/my` (GET `/mock-interviews/my`) | GET | `PagedResponse<InterviewSession>` | khối "Phiên phỏng vấn AI gần đây" |

## 4. Ánh xạ mockup -> UI (màn hub, mockup 1)

| Thành phần mockup | Nguồn | Xử lý khi trống |
|---|---|---|
| Hero "Luyện phỏng vấn thử cùng Trợ lý AI" | không số liệu động | bỏ ô "HẠN MỨC PHIÊN AI 5/5 lượt" (BE không quota) |
| 3 card "Phương thức luyện tập linh hoạt" | map đúng 3 mode thật: MOCK / KNOWLEDGE / **AVATAR** | — |
| Cấu hình 1. "Chọn vai trò chuyện môn" | `GET /jobs` — chip theo title thật | jobs rỗng -> EmptyState + link /jobs |
| Cấu hình 2. "Cấp độ kinh nghiệm" | **không có tham số API** -> thay bằng "Số câu hỏi (3–10)" thật của `StartInterviewRequest` | — |
| Cấu hình 3. checkbox phạm vi đánh giá | không có field -> **bỏ** | — |
| Cấu hình 4. chuyên gia gia (Sarah/Alex/Mai) | không có persona API -> **bỏ** (xem 9.2) | — |
| "Kiểm tra Mic & Cam" | link `/device-check` (đã có màn thật) | — |
| CTA "Vào phòng phỏng vấn Video Call ngay" | `startSession({mode:'AVATAR', jobId})` -> `/mock-interviews/{id}` | chưa chọn JD -> disable + hint |
| "Kho kịch bản phỏng vấn thịnh hành" + "Đã xác thực bởi 1,200+ NTD" | không có endpoint | xem 9.3 |
| "Phiên phỏng vấn AI gần đây của bạn" | `GET /mock-interviews/my` (mode, jobTitle/topic, overallScore, createdAt) | rỗng -> EmptyState |
| "Nhận định AI gần nhất" (số % STAR, "Cao hơn 78%") | không có endpoint | **bỏ** |

## 5. Ánh xạ mockup -> UI (phòng video call, mockup 2)

| Thành phần mockup | Nguồn | Xử lý khi trống |
|---|---|---|
| Header: tên JD + "Vòng Chuyên môn…" | `session.jobTitle` (snapshot lúc start) | — |
| REC `19:09` | timer phiên thật (như màn cũ) | — |
| "18ms (Rất ổn định)" | RTT đo bằng `performance.now()` quanh 1 ping `GET /api/v1/packages` (đã có API) | không đo được -> ẩn pill |
| Stepper 1→5 "Tổng quan/Chuyên môn/Tối ưu/STAR/Tổng kết" | **không có nguồn** -> thay bằng stepper số lượt hội thoại thật (`transcript.length`/đã chốt, trần 40) | — |
| Video AI "Sarah Nguyễn — AI Lead" | không có avatar service | xem 9.1 |
| Video ứng viên 1080p | `getUserMedia` preview thật (reuse logic `DeviceCheckPage`) | từ quyền -> khung hướng dẫn bật cam |
| "Đang lắng nghe" / sóng âm | không có STT | xem 9.1 |
| "Phụ đề AI" + "Câu 2/5" | `transcript[current].questionText` — câu hỏi do FE đưa vào từ ngân hàng câu hỏi theo JD (xem 9.1) | — |
| Transcript ứng viên đang nói | textarea/nháp: `confirm=false` upsert; bản nháp hiển thị realtime | — |
| Panel phải "Bản ghi Live" | `transcript[]` đã chốt + nháp hiện tại | — |
| Chip "Trọng tâm: SSR/ISR/LCP/INP" | **bỏ** (không có field) | — |
| Toolbar: Bật mic / Camera | toggle `MediaStreamTrack.enabled` thật | — |
| "Gợi ý STAR" | modal static khung STAR (trợ giúp viết, không phải số liệu) | — |
| "Trả lời & Tiếp" | `answer(confirm=true)` | answerText rỗng -> disable |
| "Nộp bài" | `finish` -> chuyển màn báo cáo | ConfirmDialog |
| "Kết thúc" (header) | `finish` giữa chừng, BE cho phép | ConfirmDialog |
| Ô "Ghi chú cá nhân nhanh" | state local của trang, không lưu | — |

## 6. Kết quả sau phiên AVATAR

- BE 012: `finish` cho phiên AVATAR **không tự chấm** (rule-based engine chỉ chạy MOCK/KNOWLEDGE);
  `GET /report` → 404 "Chưa có báo cáo…". Rubric 5 chiều do **chính ứng viên tự đánh** rồi
  `POST /evaluation` (BE tính overall = trung bình 5 chiều, `rubricVersion` khai một hằng số FE, vd `v1-fe-self`).
- Màn báo cáo AVATAR (`/mock-interviews/:id/report` hoặc gộp vào result page theo nhánh mode):
  5 thanh điểm + overall + strengths/improvements + transcript đầy đủ. Nếu 404 -> form tự đánh 5 slider 0–100
  + 2 ô TEXT strengths/improvements (trần 4000 ký tự theo BE) -> nộp -> hiển thị report.
- `MockInterviewResultPage` hiện tại (MOCK/KNOWLEDGE) giữ nguyên.

## 7. Việc backend cần làm (nếu có)

Không có — toàn bộ hợp đồng ở mục 3 đã có trong BE 012 (enum `AVATAR`, transcript, evaluation, report, delete).
Rủi ro ghi nhận: **không có STT/TTS/avatar** trong hệ thống; phần "AI nói + nhận diện giọng nói" của mockup 2
không có nền thật -> phải chốt ở 9.1, FE không tự chế dịch vụ.

## 8. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | Chưa chọn JD, bấm vào phòng AVATAR | nút disable + hint, không gọi API |
| 2 | Start AVATAR thành công | chuyển `/mock-interviews/{id}`, render phòng video call (không phải màn text cũ) |
| 3 | Mở lại session AVATAR `IN_PROGRESS` từ history | vào lại đúng lượt chưa chốt, nháp hiển thị nguyên văn |
| 4 | `confirm=false` 3 lần cùng lượt | 1 dòng transcript, index không đổi (BE guarantee) |
| 5 | Lượt thứ 41 | 400 "Phiên đã đạt số lượt tối đa, hãy kết thúc" -> banner + focus nút Nộp bài |
| 6 | Finish giữa chừng (còn lượt nháp) | report 404 -> form tự đánh rubric hiện ra |
| 7 | Rubric thiếu chiều / >100 | BE 400 kèm danh sách chiều sai -> hiển thị inline từng slider |
| 8 | `GET /report` hợp lệ | 5 thanh điểm + overall = trung bình 5 chiều đã làm tròn |
| 9 | Xóa phiên ở history | ConfirmDialog -> DELETE -> dòng biến mất, refresh trang |
| 10 | Session MOCK/KNOWLEDGE cũ | vẫn render `MockInterviewSessionPage`/result cũ, không đổi hành vi |
| 11 | Từ chối quyền cam/mic | khung preview hướng dẫn, các luồng ghi transcript vẫn chạy |
| 12 | 360–1920px | aside `CandidateLayout` thành drawer; phòng video call stack 1 cột dưới `lg` |

## 9. Đã chốt với anh Huy (2026-10-26, hỏi-đáp)

1. **AI trong phòng AVATAR** = TTS trình duyệt (`speechSynthesis`) + ngân hàng câu hỏi FE dẫn xuất từ JD
   (title + kỹ năng trong mô tả); mic chỉ bật/tắt + preview cam thật; **không STT** — ứng viên gõ
   transcript, nháp upsert `confirm=false` đúng hợp đồng 012.
2. **Khối persona**: bỏ hẳn.
3. **"Kho kịch bản thịnh hành"**: dựng bằng KNOWLEDGE topic thật; bỏ 3 stat không có nguồn của từng card.
4. **Phạm vi**: một lô — hub + phòng video call + report + history/xóa phiên; tách commit theo màn.

## 10. Cách sẽ verify

Theo `spec/verification.md`: `npx tsc --noEmit` → build Docker FE (cổng 3000) → browser-use DOM
(token qua localStorage) → đối chiếu 2 `screen.png` → luồng thật: start AVATAR, confirm 2 lượt,
finish, nộp rubric, đọc report, xóa phiên.
