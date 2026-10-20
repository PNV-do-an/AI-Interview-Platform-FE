# Tạo / sửa tin tuyển dụng (wizard "Create Job Posting")

Trạng thái: `ready` — 3 câu ở mục 9 đã kèm đáp án đề xuất; nếu anh Huy không đổi thì làm theo đề xuất.
Người/phiên tạo: 2026-10-20, branch `feature/create-job`
Mockup nguồn: `C:\Users\huy\Downloads\.stitch_extracts\latest_3\stitch_ai_interview_platform_ui_ux\create_edit_job_posting_form\` (`code.html`, `screen.png`)
Hợp đồng BE: `D:\AI-Interview-Platform-BE\specs\003-create-job\` (`spec.md`, `plan.md`, `contracts/job-api.md`) + source `JobController/JobServiceImpl/JobRequest/JobDetailResponse`.
Lưu ý thời điểm viết plan: 003 đang nằm ở working tree BE (9 file sửa + 3 enum/DTO mới, chưa commit) và container `aiinterview-backend` chưa rebuild, nên các endpoint dưới đây **mới đọc từ source, chưa đo runtime**. Runtime đã được rebuild và đo lại ngày 2026-10-20 — kết quả ở mục 11.

## 1. Mục tiêu

Employer (INTERVIEWER/ADMIN/STAFF) tạo và sửa tin tuyển dụng bằng wizard 4 bước đúng mockup: lưu nháp có auto-save, xem trước như ứng viên, gửi admin duyệt; bản nháp/chờ duyệt không lộ ra danh sách công khai; trạng thái và lý do bị trả lại hiển thị rõ ở màn quản lý tin.

## 2. Phạm vi / Không làm

**Làm:**

- Dựng lại `JobFormPage` cho `/jobs/new` và `/jobs/:id/edit` thành wizard 4 bước, thanh hành động sticky, stepper + progress, cột phải "Live Board Preview".
- Lưu nháp, auto-save, tải lại bản nháp, gửi duyệt; chặn sửa khi `PENDING_APPROVAL`.
- Rich text cho mô tả công việc, skill tag dạng chip, cấu hình AI screening (toggle/track/ngưỡng/focus areas).
- Nối thêm field mới của `JobRequest`/`JobDetailResponse`; dựng `salaryRange` từ lương cấu trúc.
- Cập nhật `MyJobsPage` để hiểu `DRAFT`/`PENDING_APPROVAL` và hiện lý do từ chối.
- Cập nhật `JobDetailPage` render mô tả rich text an toàn.
- Chặn tiêu đề không thuộc IT ở mọi lần lưu (POST/PUT) bằng allowlist từ khóa; lỗi hiện inline ở Job Title.
- Thêm `PENDING_APPROVAL` vào `STATUS_TONE`; thêm util tách/ghép comma-string và sanitize rich text.

**Không làm:**

- Màn "Job Approvals & Moderation" đầy đủ (feature 004 của BE): KPI, bảng, filter, duyệt/từ chối trong UI. Phạm vi này chỉ gọi endpoint submit; duyệt/từ chối để admin làm qua API/Postman cho tới feature 004.
- AI Job Optimizer (điểm 92, clarity, bias flags, forecast, gợi ý), nút "AI Rephrase": BE không có AI engine, không có endpoint, không chế số.
- "Need Rubric Guidance?" / "Browse 40+ benchmarks": không có route/màn cho employer, không nối.
- Org profile / danh sách công ty để chọn `companyName`: chưa có endpoint; xem mục 9 câu 1.
- Endpoint auto-save riêng: dùng `PUT` full-update, mốc thời gian là `updatedAt`.
- Upload CV/ảnh, bookmark, preview bằng endpoint: Preview render client-side.
- Không thêm role mới; không đổi route guard hiện tại (`ROLE_INTERVIEWER`, `ROLE_ADMIN`, `ROLE_STAFF`).

## 3. API thật dùng được

Đọc từ source BE và đã gọi curl runtime ngày 2026-10-20 (kết quả mục 11). Chi tiết field/rule: `specs/003-create-job/contracts/job-api.md`.

| Endpoint | Method | Dùng cho | Hành vi / lỗi cần biết |
|---|---|---|---|
| `/api/v1/jobs/{id}` | GET | Nạp form khi sửa; nạp lại sau submit | Job `!= OPEN` chỉ owner/admin xem được; người khác (kể cả anonymous) nhận 404 |
| `/api/v1/jobs` | POST | Lần lưu đầu tiên | Tạo `DRAFT` (không còn `OPEN`); bắt buộc `title`, `companyName`; message "Đã lưu bản nháp tin tuyển dụng" |
| `/api/v1/jobs/{id}` | PUT | Mỗi lần lưu/auto-save | Ghi đè toàn bộ field; `PENDING_APPROVAL` ⇒ 400 "Tin đang chờ duyệt, không thể sửa"; owner/admin |
| `/api/v1/jobs/{id}/submit` | PATCH | "Submit for Admin Review" | Chỉ từ `DRAFT` ⇒ `PENDING_APPROVAL`; trạng thái khác ⇒ 400 |
| `/api/v1/jobs/{id}/status?status=` | PATCH | Close/Reopen ở `MyJobsPage` | Chỉ `OPEN ↔ CLOSED`; từ `DRAFT`/`PENDING_APPROVAL` ⇒ 400 |
| `/api/v1/jobs/my-jobs` | GET | Danh sách tin của tôi | Trả cả `DRAFT`, `PENDING_APPROVAL`, `OPEN`, `CLOSED` |
| `/api/v1/jobs/{id}/review` | PATCH | **Không gọi từ màn employer** | ADMIN/STAFF duyệt/từ chối; feature 004 sẽ dùng. Từ chối bắt buộc `reason` ≤500, job về `DRAFT` + `reviewNote` |
| `/api/v1/jobs?page&size&search` | GET | Chỉ dùng khi verify | Public chỉ trả `OPEN` |

Field mới trong request/response (đều optional, trừ `title`/`companyName`):

- `department`, `experienceLevel`, `employmentType`, `timezoneRequirement`: String, tối đa 100.
- `workplaceModel`: `ONSITE | HYBRID | REMOTE`.
- `salaryCurrency`: String tối đa 8; `salaryMin`, `salaryMax`: Long dương; `salaryMin <= salaryMax`.
- `equityBand`, `annualBonus`: String tối đa 200.
- `aiScreeningEnabled`: Boolean; bật ⇒ bắt buộc có `aiScreeningTrack` + `aiScreeningPassScore`.
- `aiScreeningTrack`: `LIVE_CODING | SYSTEM_DESIGN | ASYNC_TECHNICAL | CULTURAL_FIT`.
- `aiScreeningPassScore`: Integer 50–95.
- `aiQuestionFocusAreas`: comma-string, tối đa 2000 ký tự.
- `reviewNote`: chỉ đọc, do endpoint review ghi.

Giữ nguyên: `position`, `location`, `salaryRange`, `description`, `requirements`, `requiredSkills`. `JobSummaryResponse` **không** có field mới.

FE đọc lỗi qua `readApiErrorMessage` (`src/utils/apiError.ts`) kèm thứ tự field để hiện message của `detail` khi BE trả "Validation failed"; message nghiệp vụ tiếng Việt của BE giữ nguyên văn.

## 4. Ánh xạ mockup -> field/UI

### 4.1 Chia bước (đúng thứ tự section trong mockup)

| Bước | Tên stepper | Section trong mockup | Field |
|---|---|---|---|
| 1 | Basic Info & Meta | Position Identity + Work Location & Regional Policy | title, companyName, department, experienceLevel, employmentType, workplaceModel, location, timezoneRequirement |
| 2 | Role & Responsibilities | Core Technical Stack & Skills + Role Summary & Key Responsibilities | requiredSkills, description |
| 3 | Compensation & Perks | Compensation & Pay Transparency | salaryCurrency, salaryMin, salaryMax, equityBand, annualBonus |
| 4 | AI Screening Setup | AI Autonomous Screening Engine | aiScreeningEnabled, aiScreeningTrack, aiScreeningPassScore, aiQuestionFocusAreas |

Chỉ render section của bước hiện tại (mockup export hiển thị cả 4 section để review thiết kế; stepper và nút Back/Continue xác nhận đây là wizard). Progress = `(bước hiện tại + 1) / 4`.

### 4.2 Từng khối

| Thành phần mockup | Nguồn | Xử lý khi trống |
|---|---|---|
| Breadcrumb + H1 | `Employer Workspace / Job Postings / Create New Position` (sửa: `Edit Job Posting`) | luôn có |
| Chip "Draft • Auto-saved 1m ago" | `status` + mốc lưu thật (`updatedAt` hoặc thời điểm PUT thành công) | chưa lưu: `Draft • Not saved yet`; có thay đổi chưa gửi: `Draft • Unsaved changes`; lỗi lưu: `Save failed` |
| `REQ-2024-884` | `REQ-{năm của createdAt}-{id}` | chưa có id: `NEW` |
| Job Title * | `title` | required, inline error |
| **Company Name \*** (không có trong mockup) | `companyName` | required; lý do thêm ở mục 9 câu 1 |
| Department | `department` | select, để trống được |
| Experience Level | `experienceLevel` | select, để trống được |
| Employment Type | `employmentType` | select, để trống được |
| Hiring Manager | `employerName` (khi sửa) / `user.fullName` (khi tạo) | readonly; avatar = initials, không có URL ảnh |
| Workplace Model | `workplaceModel` (`ONSITE/HYBRID/REMOTE`) | segmented 3 nút; mặc định `HYBRID` theo mockup |
| Primary Base Location | `location` | text |
| Timezone Requirement | `timezoneRequirement` | text, max 100 |
| Currency | `salaryCurrency` | select USD/EUR/CAD/GBP, mặc định USD |
| Minimum / Maximum Base Salary | `salaryMin`, `salaryMax` | number; chỉ gửi khi > 0; min ≤ max |
| Equity / Bonus | `equityBand`, `annualBonus` | text, max 200 |
| `N tags configured` | `requiredSkills` tách theo dấu phẩy | `0 tags configured` |
| Skill chips + Add Skill Tag | `requiredSkills` | chip editor; cấm dấu phẩy trong từng tag, trim + dedupe |
| Role Summary & Key Responsibilities | `description` (HTML đã sanitize) | placeholder + editor rỗng |
| AI Screening toggle | `aiScreeningEnabled` | mặc định tắt |
| Screening Track & Format | `aiScreeningTrack` | map label ở mục 4.3; bật screening mà chưa chọn ⇒ chặn |
| Passing Score Threshold | `aiScreeningPassScore` | range 50–95, mặc định 80; hiện `80 / 100` |
| Dynamic Question Focus Areas | `aiQuestionFocusAreas` | checklist cố định 4 mục của mockup; bật screening mà chưa chọn mục nào vẫn được (BE không bắt) |
| Save Draft | POST/PUT | disabled khi `PENDING_APPROVAL` hoặc đang lưu |
| Preview | state form hiện tại | modal client-side, ghi rõ "Preview only" |
| Submit for Admin Review | PATCH `/submit` | chỉ `DRAFT`/chưa lưu; ẩn/disable ở trạng thái khác |
| Stepper + micro progress | state `step` | không click được; đi bằng Back/Continue |
| Footer Back / Save Draft / Continue | state `step` + save | bước 4 đổi Continue thành Submit |
| Live Board Preview | title, companyName, location, workplaceModel, lương cấu trúc, equity, `aiScreeningEnabled`, excerpt `description` | thiếu field thì ẩn chip tương ứng, không hiện số 0 |
| "Posted Just now" | `createdAt` / status | chưa publish: `Not published yet`; `PENDING_APPROVAL`: `Awaiting review` |
| Quick Apply (trong preview) | — | render disabled, không gọi API |

### 4.3 Nhãn cố định

- `workplaceModel`: `ONSITE` → On-site, `HYBRID` → Hybrid, `REMOTE` → Fully Remote.
- `aiScreeningTrack`: `LIVE_CODING` → Live Coding (45 mins), `SYSTEM_DESIGN` → System Design Deep Dive (60 mins), `ASYNC_TECHNICAL` → Async Technical Assessment (90 mins), `CULTURAL_FIT` → Cultural Fit & Engineering Philosophy (30 mins).
- Focus areas (đúng 4 mục mockup): Distributed Consensus & Failure Modes; Lock-Free Concurrency & Memory; Database Partitioning & Sharding; Production Incident Debugging.
- `JOB_STATUS_LABELS`: `DRAFT` → Draft, `PENDING_APPROVAL` → Pending review, `OPEN` → Active, `CLOSED` → Closed.
- Option select dùng đúng mockup:
  - Department: Platform Infrastructure; Core Architecture & Data; AI Runtime Operations; Site Reliability Engineering; Distributed Computing Group.
  - Experience Level: Senior (5-8+ yrs); Staff / Principal (8+ yrs); Mid-Level (3-5 yrs); Director / VP Level.
  - Employment Type: Full-Time Regular; Contract (12 Months); Contract-to-Hire; Part-Time Consultant.
  - Currency: USD ($) United States; EUR (€) Eurozone; CAD ($) Canadian Dollar; GBP (£) British Pound.

## 5. Khối mockup BỎ + lý do

- **AI Job Optimizer** (điểm clarity 92, `Inclusivity & Bias Audit`, `14-Day Applicant Forecast`, `AI Suggestions`) — BE 003 C-4 không có AI engine/endpoint; hiện số là bịa.
- **AI Rephrase** — cùng lý do, không có endpoint.
- **Pill "CA & NY Compliant"** — không có dữ liệu pháp lý/compliance.
- **Need Rubric Guidance? / Browse** — không có màn rubric cho employer; `RubricStudioPage` là màn admin STATIC, không có route công khai.
- **Ảnh avatar Hiring Manager** — `User` không có `avatarUrl`; dùng initials từ tên thật.
- **Nội dung mẫu của tin demo** (Senior Distributed Systems Engineer, 7 skill, 4 focus area, mô tả) — form mới bắt đầu rỗng; focus areas dùng checklist, skill do người dùng thêm.
- **Sidebar + header của mockup** — `AppLayout` đã dựng; trang không vẽ lại.
- **"Auto-saved 1m ago" hardcode** — thay bằng trạng thái lưu thật.

## 6. Quyết định triển khai

### 6.1 Lưu nháp / auto-save

- Form mới **không tự tạo bản nháp** khi người dùng mới gõ vài ký tự. Lần lưu đầu do "Save Draft", "Continue" hoặc "Submit" kích hoạt (`POST`), sau đó URL đổi sang `/jobs/{id}/edit` bằng `replace`.
- Khi đã có `jobId`, thay đổi field sẽ auto-save bằng `PUT` sau debounce; mỗi lúc chỉ một request, thay đổi đến trong lúc request đang chạy sẽ được hẹn lưu tiếp. Không auto-save khi `PENDING_APPROVAL`, khi form không hợp lệ, khi đang submit, khi đang tải job hoặc khi form chưa khởi tạo xong từ server.
- Chuyển bước sẽ flush lưu trước khi sang bước mới; nếu bước hiện tại có lỗi validation thì giữ nguyên và hiện lỗi inline.
- Chip trạng thái lấy từ kết quả lưu thật, không hardcode; `beforeunload` cảnh báo khi còn thay đổi chưa lưu.
- `POST`/`PUT` gửi **toàn bộ** payload (BE full-update), không chỉ field của bước hiện tại.

### 6.2 Rich text + an toàn

- Dùng `contentEditable` + thanh công cụ B/I/U, bullet/number list, code, link, H2 (tương đương mockup); **không** thêm editor library.
- Thêm dependency `dompurify` (và type đi kèm nếu cần) để sanitize HTML trước khi gửi và trước khi render; allowlist tag/attr, chỉ cho link `http/https/mailto`, thêm `rel="noopener noreferrer"`. Không dùng `dangerouslySetInnerHTML` với chuỗi chưa sanitize.
- Lưu HTML đã sanitize vào `description`. Job cũ có `description` plain text vẫn render bằng `whitespace-pre-wrap`; chỉ render HTML khi chuỗi thực sự có tag.
- Preview trong wizard và `JobDetailPage` dùng cùng một hàm render/sanitize để tránh lệch.
- Link dùng `window.prompt` cho URL; huỷ prompt thì không chèn gì.

### 6.3 Giữ dữ liệu cũ

- Wizard không có ô `position` và `requirements`; khi sửa job cũ, hai field này được nạp vào state và gửi lại **nguyên văn** để `PUT` không xoá dữ liệu. Không hiển thị trong UI.
- `salaryRange` vẫn là chuỗi hiển thị:
  - Nếu người dùng nhập `salaryMin`/`salaryMax`, FE dựng `salaryRange` (ví dụ `USD 165,000 – 210,000`) trước khi gửi.
  - Nếu cả hai ô lương cấu trúc bị xoá: job vốn đã có lương cấu trúc thì `salaryRange` cũng về rỗng; job cũ chỉ có `salaryRange` (không có số cấu trúc) thì giữ nguyên chuỗi cũ để không mất dữ liệu.
- Khi tắt AI screening, gửi `aiScreeningTrack`, `aiScreeningPassScore`, `aiQuestionFocusAreas` = `null` để không lưu cấu hình dở dang; bật lại thì dùng giá trị đang có trong form.

### 6.4 Trạng thái màn hình

- `DRAFT`: sửa được; có nút Submit; nếu `reviewNote` có nội dung thì hiện banner "Changes requested" + nguyên văn lý do.
- `PENDING_APPROVAL`: toàn bộ field readonly, ẩn Save/Submit, hiện banner "Awaiting admin review"; không gọi PUT.
- `OPEN`/`CLOSED`: BE cho sửa trực tiếp; hiện banner nhắc thay đổi được lưu ngay. Chỉ `OPEN/CLOSED` mới có Close/Reopen. Nếu muốn bắt buộc duyệt lại khi sửa job đã publish thì phải đổi BE (mục 9 câu 2).
- Submit: lưu lần cuối rồi gọi `/submit`; thành công thì nạp lại job, chuyển màn hình sang readonly, hiện banner "Submitted for admin review". Không tự động rời trang.
- Sau khi POST đầu tiên, `jobId` lấy từ response; mọi lần lưu sau dùng `PUT` với id đó.

### 6.5 My Jobs và Job Detail

- `MyJobsPage`: dùng `JOB_STATUS_LABELS` + `StatusBadge` thay ternary `OPEN/CLOSED`; `PENDING_APPROVAL` tone warning. Hành động:
  - `DRAFT`: Edit, View, Delete; hiện `reviewNote` nếu có.
  - `PENDING_APPROVAL`: View; không Edit/Close.
  - `OPEN`: View, Edit, Close, Applicants, Suggested Candidates, Delete.
  - `CLOSED`: View, Edit, Reopen, Applicants, Suggested Candidates, Delete.
- `JobSummaryResponse` không trả `reviewNote`, nên `MyJobsPage` gọi `GET /jobs/{id}` cho từng job `DRAFT` để lấy lý do bị trả lại; lỗi đọc một job bị bỏ qua, không chặn danh sách.
- `JobDetailPage`: chỉ đổi phần render `description` sang rich text sanitize; `requirements`, kỹ năng, lương hiển thị như hiện tại. Các field cấu trúc mới (department/workplace/experience) chưa đưa vào trang ứng viên trong scope này vì mockup job detail không có; nếu cần hiện phải đối chiếu mockup `job_detail_application_flow` riêng.
- `STATUS_TONE` thêm `PENDING_APPROVAL: 'warning'`; `DRAFT` đã có neutral.

### 6.6 Điểm cần biết phía BE

- 003 chưa commit/merge; FE chỉ verify được sau khi rebuild backend từ working tree (container hiện tại là bản cũ) và phải merge BE trước hoặc cùng lúc với FE.
- `companyName` vẫn `@NotBlank` nhưng chưa có org profile/endpoint công ty → FE thêm ô Company (mục 9 câu 1).
- `JobSummaryResponse` không có field cấu trúc; danh sách tin vẫn dùng `salaryRange` + status, không cần sửa BE.
- `requiredSkills`/`aiQuestionFocusAreas` là comma-string, không escape dấu phẩy → FE chặn dấu phẩy trong từng tag (đúng R-3 của BE).
- 003 cho sửa job `OPEN` mà không đưa về duyệt lại; đây là hợp đồng hiện tại, không phải lỗi FE.
- Màn duyệt của admin là feature 004; trong lúc chờ, duyệt/từ chối bằng `PATCH /jobs/{id}/review` qua Postman/curl.
- DB nào còn cột `job_descriptions.status` kiểu enum cũ (`OPEN`,`CLOSED`) phải chạy tay trước khi dùng 003: `ALTER TABLE job_descriptions MODIFY status ENUM('DRAFT','PENDING_APPROVAL','OPEN','CLOSED') NOT NULL;`. Hibernate `ddl-auto: update` không mở rộng enum; bỏ qua bước này thì POST job trả 500 `Data truncated for column 'status'`.

### 6.7 Dựng UI theo design system

- Trang nằm trong `AppLayout`; không vẽ lại sidebar/header, không thêm search/notification của mockup.
- Dùng primitive sẵn có: `Card`, `Badge`, `StatusBadge`, `ErrorBanner`, `LoadingState`, `buttonClass`, `inputClass`, `labelClass`. Section card giữ radius `0.5rem` như mockup (viết `rounded-[0.5rem]`, giống `JobDetailPage`); control dùng radius của primitive.
- Icon Material Symbols, màu token trong `tailwind.config.js` (`primary`, `surface-low`, `surface-mid`, `card`, `ink`, `ink-variant`, `outline-strong`, `danger`...). Không thêm token mới cho một trang.
- Không inline style, ngoại lệ duy nhất là `width` của progress bar. Không animation/skeleton ngoài hover/focus của primitive.
- Nhãn chrome tiếng Anh; dữ liệu động (title, company, reviewNote, message lỗi BE) giữ nguyên văn.
- Component phụ (`Stepper`, `RichTextEditor`, `SkillTags`, `LivePreviewCard`, 4 step) để trong cùng `JobFormPage.tsx`; chỉ tách file khi dùng lại ở trang khác.
- Action bar sticky nằm dưới header `AppLayout` (top-16), không che header; trên mobile cột preview xuống dưới form.

### 6.8 Chặn job ngoài IT

- Nền tảng chỉ phục vụ sinh viên IT, nên `validateForm` từ chối tiêu đề không khớp allowlist từ khóa IT (`src/utils/itJob.ts`): software, developer, engineer (trừ các ngành kỹ thuật không phải IT như mechanical/civil/electrical), data, AI/ML, DevOps, cloud, security, QA/testing, network, IT support, cùng các cụm tiếng Việt (lập trình, phần mềm, dữ liệu, an ninh mạng, kiểm thử, CNTT...). Tiêu đề viết hoa `IT` luôn được nhận.
- Rule áp cho **cả tạo và sửa**: nếu chỉ chặn POST đầu tiên thì người dùng có thể đổi title sang non-IT và để auto-save ghi đè. Lỗi hiện inline ở Job Title, chặn Save Draft/Continue/Submit và auto-save (vì `isFormValid` dùng chung `validateForm`).
- Đây là kiểm tra phía client theo từ khóa, không phân loại được nội dung mô tả và vẫn có thể lách bằng gọi thẳng API. Muốn chặn tuyệt đối phải thêm validate 422 ở `JobRequest`/`JobServiceImpl` phía BE.
- Tiêu đề chỉ cần chứa một từ khóa IT; ví dụ "Platform Engineer", "Data Analyst", "Lập trình viên" qua, "Marketing Manager", "Sales Executive", "Mechanical Engineer" bị chặn.

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | Form mới, bấm Continue/Save khi chưa có title | Lỗi inline ở title (và company), không gửi request |
| 2 | Nhập title + company, Save Draft | POST 200; job `DRAFT`; URL thành `/jobs/{id}/edit`; chip chuyển "Auto-saved" |
| 3 | Sửa nhiều field, chờ auto-save | PUT đúng một request tại một thời điểm; `updatedAt` tăng; tải lại trang thấy đủ dữ liệu |
| 4 | Chuyển bước khi đang có thay đổi | Lưu xong mới sang bước; lỗi validation thì ở lại bước cũ |
| 5 | Salary min > max | Chặn client, hiện lỗi; nếu bỏ qua được thì server trả 400 và banner lỗi |
| 6 | Bật AI screening nhưng chưa chọn track | Chặn lưu/submit; tắt toggle thì track/score/focus gửi `null` |
| 7 | Nhập skill có dấu phẩy | Không tạo chip; báo lỗi; chip trùng bị loại |
| 8 | Submit bản nháp | Job `PENDING_APPROVAL`; màn hình readonly; public list không thấy; My Jobs hiện "Pending review" |
| 9 | Admin từ chối qua API kèm lý do, mở lại form | `DRAFT` + banner lý do; sửa và submit lại được; lý do biến mất sau khi duyệt |
| 10 | Admin duyệt qua API | `OPEN`; job xuất hiện ở public list; `GET /jobs/{id}` anonymous trả 200 |
| 11 | Chèn `<img src=x onerror=...>` vào mô tả | Preview và Job Detail không chạy script/không render `onerror`; nội dung an toàn |
| 12 | Sửa job cũ chỉ có `salaryRange`, `requirements`, `position` | Ba field không bị xoá sau khi lưu bằng wizard |
| 13 | Mở job `PENDING_APPROVAL` | Readonly, không có request PUT; API PUT trực tiếp trả 400 |
| 14 | ROLE_USER mở `/jobs/new` | Bị chặn bởi route guard; gọi API trực tiếp trả 403 |
| 15 | Preview modal | Hiện đúng dữ liệu đang gõ (kể cả chưa lưu); Quick Apply disabled |
| 16 | Tạo job với title "Marketing Manager" rồi Continue/Save | Lỗi inline ở Job Title, ở lại bước 1, **không** phát POST/PUT; đổi sang "Java Developer" thì lưu được |
| 17 | Sửa job đã có id, đổi title sang non-IT | Auto-save không chạy, Save Draft hiện lỗi, không phát PUT; DB giữ title cũ |

## 8. Cách đã verify (khi làm xong)

Chạy theo `spec/verification.md`; ghi số đo thật vào mục "Kết quả" của file này.

1. `npx tsc --noEmit` sạch.
2. Rebuild BE từ working tree 003: `docker compose build backend && docker compose up -d backend`; kiểm tra `docker compose ps`.
3. Build FE bằng Docker. **Bẫy local:** `.env.production` đang trỏ `https://ai-interview-backend-staging.onrender.com`; staging chưa có 003. Tạm đổi `.env.production` thành `REACT_APP_API_URL=http://localhost:3000` để đi qua nginx proxy của container, build FE, đo xong **khôi phục nguyên giá trị cũ**. `.env.production` đang untracked — không commit.
4. Mở URL kèm cache-buster (`/jobs/new?v=...`), đối chiếu hash bundle trong container nếu DOM còn nhãn cũ.
5. Đổi role tài khoản OAuth local sang `ROLE_INTERVIEWER` (hoặc `ROLE_ADMIN`) để vào màn employer; đo xong trả lại `ROLE_USER` và đăng nhập lại.
6. Đo bằng curl/Postman: POST → `DRAFT`; PUT đủ field; submit → `PENDING_APPROVAL`; review duyệt/từ chối; public list chỉ thấy `OPEN`. Ghi mã HTTP + message.
7. Kiểm tra SQL:
   `select id,title,status,workplace_model,salary_min,salary_max,ai_screening_pass_score from job_descriptions order by id desc limit 3;`
   Xoá job test sau khi đo.
8. Soát DOM bằng browser-use: stepper, readonly khi pending, banner lý do, preview, rich text; soát XSS bằng payload ở test case 11. `take_screenshot` có thể fail do viewport ẩn — khi đó chỉ kết luận được bằng DOM/computed style, không kết luận "đẹp/vỡ layout".
9. Cập nhật `spec/INDEX.md` dòng `create_edit_job_posting_form` sau khi xong.

## 9. Câu hỏi mở cho anh Huy

1. **Ô Company Name**: mockup không có, nhưng `JobRequest.companyName` bắt buộc và chưa có org profile để lấy. Đề xuất: thêm ô "Company Name *" vào Position Identity (bước 1). Nếu sau này có org profile thì thay bằng select công ty.
2. **Sửa job đã publish**: BE hiện cho PUT job `OPEN` và thay đổi lên công khai ngay, không duyệt lại. Đề xuất: giữ theo BE, hiện banner nhắc "changes are published immediately". Nếu muốn sửa phải duyệt lại thì cần đổi BE (`OPEN` + sửa ⇒ `PENDING_APPROVAL`) — ngoài scope FE này.
3. **Danh sách focus areas**: BE không có catalog, chỉ lưu comma-string. Đề xuất: dùng đúng 4 mục của mockup. Nếu muốn danh sách rộng hơn cho mọi ngành thì cần chốt danh sách mục (và có thể phải thêm catalog phía BE sau).

## 10. Chia wave + file

| Wave | Việc | File |
|---|---|---|
| 1 | Type + nhãn trạng thái/enum; service submit; controller lưu nháp/nạp job/submit; util rich text + comma list; tone `PENDING_APPROVAL`; dependency sanitize | `src/models/Program.model.ts`, `src/services/program.service.ts`, `src/controllers/useEmployerJobController.ts`, `src/utils/richText.ts` (mới), `src/views/components/ui.tsx`, `package.json` + `package-lock.json` |
| 2 | Dựng lại wizard: action bar, stepper, 4 bước, skill chip, rich editor, preview modal, auto-save, readonly theo trạng thái, submit | `src/views/pages/JobFormPage.tsx` |
| 3 | Nối trạng thái cuộc đời vào danh sách + render mô tả an toàn ở trang chi tiết | `src/views/pages/MyJobsPage.tsx`, `src/views/pages/JobDetailPage.tsx` |
| 4 | Build/đo thật, soát XSS, khôi phục env + role, cập nhật INDEX và mục Kết quả | `spec/INDEX.md`, file này |
| 5 | Chặn job ngoài IT theo tiêu đề | `src/utils/itJob.ts` (mới), `src/views/pages/JobFormPage.tsx` |

Không sửa `App.tsx`: hai route `/jobs/new`, `/jobs/:id/edit` đã có và guard đúng role. Không thêm dependency editor; chỉ thêm `dompurify` cho sanitize.

## 11. Kết quả

Đo ngày 2026-10-20 trên stack Docker local: MySQL `aiinterview-mysql` (host 3307), backend `aiinterview-backend` (8081, rebuild từ working tree 003), FE image `aiinterview-stack-frontend:latest` (bundle cuối sau rule IT `main.fd2bf41f.js`, `REACT_APP_API_URL=http://localhost:3000`) chạy tại `http://localhost:3000`. Container cũ `ai-fe-prod` (bundle `main.bc4fadfb.js`) đã được stop để nhường cổng, không xoá. Lúc đo lần đầu cổng 3000 còn là bundle cũ nên UI được đo tạm ở 3001 với bundle `main.2f12529b.js`; sau đó build bản cuối và chuyển hẳn 3000 sang bản mới.

- Static: `npx tsc --noEmit` và `npx eslint` trên các file đã sửa đều sạch. `docker compose build frontend` pass; các warning eslint còn lại là warning có sẵn ở file ngoài phạm vi (Cv/CoverLetter/Login/Landing...).
- API (curl, tài khoản admin seed): POST → `DRAFT`; PUT giữ đủ field cấu trúc + `position`/`requirements`/`salaryRange` cũ; submit → `PENDING_APPROVAL`; PUT khi pending → 400; my-jobs trả `PENDING_APPROVAL`; reject kèm lý do tiếng Việt → `DRAFT` + `reviewNote`; submit lại + approve → `OPEN`, `reviewNote` = null; public search thấy tin; GET anonymous → 200; close/reopen OK; chuyển trạng thái sai → 400; DELETE → 200.
- Phân quyền: tạm đổi role user seed sang `ROLE_USER`, login lấy token mới rồi POST `/api/v1/jobs` → **403**; sau đó trả role về `ROLE_ADMIN` ngay trong cùng script.
- Wizard (browser-use, DOM): Continue khi thiếu title/company hiện lỗi và ở lại bước 1; Continue sau khi đủ title/company phát đúng **1 POST**, URL replace sang `/jobs/{id}/edit`; gõ tiếp phát các PUT tuần tự, không chồng request. Min > max bị chặn tại bước 3; skill có dấu phẩy bị chặn, tag trùng báo "That skill is already added"; bật AI screening mà chưa chọn track bị chặn submit; preview cập nhật đúng và Quick Apply disabled.
- Reload: tải lại `/jobs/{id}/edit` sau khi lưu vẫn thấy title/company, 2 tag, lương 165000/210000, AI `SYSTEM_DESIGN`; job cũ chỉ có `position`/`requirements`/`salaryRange` được giữ nguyên cả 3 field sau khi sửa bằng wizard.
- Submit/readonly: submit → `PENDING_APPROVAL`; màn hình chỉ còn Preview, toàn bộ input disabled, không còn Save/Submit, banner "Submitted for admin review...", preview "Awaiting review"; DB xác nhận status + field AI.
- My Jobs: pending hiện badge "Pending review" + chỉ nút View. Admin từ chối qua API → tải lại thấy badge "Draft", banner "Changes requested" + nguyên văn lý do, nút View/Edit/Delete.
- XSS: tạo job qua API với `img onerror`, `script`, `iframe`, link `javascript:` và link ngoài `target=_self rel=opener`, duyệt `OPEN`, mở trang chi tiết thật. DOM mô tả chỉ còn `<p>` + 2 `<a>`; `window.__xss` null; `main` không có `img`/`script`/`iframe`; link `javascript:` bị bỏ href; link ngoài thành `target=_blank rel="noopener noreferrer"`.
- Sửa lỗi phát hiện khi reload: BE trả `LocalDateTime` không kèm offset (giá trị UTC), FE parse trực tiếp nên hiện "Auto-saved 7h ago" ngay sau reload. Thêm `src/utils/date.ts` (`parseServerTimestamp` coi timestamp không offset là UTC) và dùng ở `JobFormPage`/`JobDetailPage`; đo lại hiện "2m ago" đúng thời điểm lưu.
- Rule IT (wave 5): ma trận 9 tiêu đề non-IT bị chặn (Marketing Manager, Sales Executive, Senior Accountant, HR Specialist, Mechanical Engineer, Head Chef, Graphic Designer, Customer Support, Digital Marketing Lead) và 14 tiêu đề IT qua (Java Developer, Data Engineer, DevOps Engineer, QA Engineer, IT Support Specialist, Lập trình viên, Kỹ sư phần mềm, Chuyên viên an ninh mạng, Platform Engineer, Software Engineer, Cybersecurity Analyst, Mobile Developer, AI Engineer, Kiểm thử viên). Browser-use trên `/jobs/new`: title "Marketing Manager" + company "Acme Corp" → Continue ở lại bước 1, lỗi inline ở Job Title, mạng **0 request**; đổi sang "Java Developer" → đúng **1 POST**, URL replace `/jobs/8/edit`, sang bước 2. Trên `/jobs/8/edit`: đổi title lại "Marketing Manager" → Save Draft hiện lỗi, mạng chỉ có POST cũ, **không PUT**, DB giữ title "Java Developer". Build cuối thêm từ khóa `CNTT`: "Marketing Manager" vẫn bị chặn 0 request; "Nhân viên CNTT" → 1 POST, sang `/jobs/9/edit`, DB lưu đúng UTF-8.
- Dọn dẹp: job test 8 và 9 của lần đo rule IT đã `DELETE` → 200 (BE soft-delete, `deleted_at` có giá trị); job 7 "test" còn trong DB không do lần đo này tạo nên giữ nguyên. `.env.production` khôi phục byte-identical với backup (`REACT_APP_API_URL=https://ai-interview-backend-staging.onrender.com`); backend/mysql/frontend đều chạy. Các job test 3/4/5/6 và audit `job #1..#6` của các wave trước đã xoá ở lần dọn trước.

**Lưu ý triển khai**

- DB có cột `job_descriptions.status` kiểu enum cũ phải chạy tay trước khi dùng 003: `ALTER TABLE job_descriptions MODIFY status ENUM('DRAFT','PENDING_APPROVAL','OPEN','CLOSED') NOT NULL;`. Hibernate `ddl-auto: update` không mở rộng enum; bỏ qua bước này thì POST job trả 500 `Data truncated for column 'status'`.
- `JobSummaryResponse` không có `reviewNote`, nên MyJobs gọi chi tiết cho từng job `DRAFT` để lấy lý do (N request với N bản nháp); lỗi đọc chi tiết bị bỏ qua, không chặn danh sách.
- `parseServerTimestamp` đang coi mọi timestamp BE không kèm offset là UTC (đúng với container/Render hiện tại). Nếu BE đổi timezone hoặc trả offset, sửa helper này; các màn khác vẫn parse trực tiếp nên vẫn có thể lệch giờ, ngoài phạm vi feature này.
- Container cũ `ai-fe-prod` đang stop. Muốn quay lại bản cũ: `docker compose stop frontend && docker start ai-fe-prod`.
- Khi build local phải tạm đổi `.env.production` thành `http://localhost:3000` rồi khôi phục; lần này đã `cmp` với backup sau khi build.
- Rule IT chỉ nằm ở FE. Gọi thẳng `POST/PUT /api/v1/jobs` với title non-IT vẫn được BE chấp nhận; nếu cần chặn tuyệt đối thì thêm validate 422 ở BE (ngoài repo này).
- Không có screenshot: viewport browser-use bị ẩn; kết luận UI dựa trên DOM/computed style, không kết luận về thẩm mỹ/vỡ layout.
