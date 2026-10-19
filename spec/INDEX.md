# INDEX — màn Stitch <-> code

Mockup nguồn (bên ngoài repo, bản export đã giải nén):
`C:\Users\huy\Downloads\.stitch_extracts\latest_3\stitch_ai_interview_platform_ui_ux\<ten-man>\{code.html, screen.png}`
Token design system: `...\precision_intelligence\DESIGN.md`.
URL Stitch (`stitch.withgoogle.com/projects/...`) không đọc được bằng tool vì chặn Google login — chỉ dùng bản export.

Trạng thái: `DATA` = dựng theo mockup + số liệu thật; `UI` = theo mockup nhưng còn khối tiếng Việt/chưa nối hết API; `STATIC` = màn tĩnh cố ý (không có backend), số liệu là bản copy từ mockup; `TODO` = chưa có file.

## Luồng ứng viên (làm trước, theo chốt của anh Huy)

| Màn mockup | Route | File | Trạng thái | Thiếu / ghi chú |
|---|---|---|---|---|
| candidate_workspace_dashboard_applications | /dashboard | `views/pages/DashboardPage.tsx` | DATA | Bỏ: "% precision", radar chart, "Targeted AI Practice Modules", nút Join Meet / Test Audio (không có endpoint). Candidate thấy layout mockup; role khác thấy `WorkspaceDashboard` (lối tắt, không có số liệu). |
| application_tracking_status | /my-applications | `views/pages/MyApplicationsPage.tsx` | DATA | Mockup không có heading trang -> file cũng không. Bỏ: Export Dossier, Track External Job, stepper 4 bước, recruiter avatar. |
| job_detail_application_flow | /jobs/:id | `views/pages/JobDetailPage.tsx` | DATA | Bỏ: Verified Employer, Profile Compatibility gauge, Benefits, Save Job, upload CV, Key Responsibilities, audio. |
| candidate_profile_cv_management | /my-profile | `views/pages/CandidateProfilePage.tsx` | DATA | Không upload file thật (`cvFileName` là text); bỏ skill %, ring 94.8%, drag-drop PDF. |
| candidate_skills_hub_practice_hub_1 / _2 | /mock-interviews | `views/pages/MockInterviewsPage.tsx` | DATA | Bỏ: Readiness Index, Top %, streak, catalog track hardcode, leaderboard, credentials. |
| ai_mock_session_live_interactive_interview | /mock-interviews/:id | `views/pages/MockInterviewSessionPage.tsx` | DATA | Bỏ: waveform/audio, persona card, tab voice/code, hint drawer, scratchpad, remaining time. |
| candidate_evaluation_ai_detailed_results_feedback | /mock-interviews/:id/result | `views/pages/MockInterviewResultPage.tsx` | DATA | Bỏ: percentile, 3 thẻ tiêu chí (chỉ có điểm từng câu), strengths/curriculum, audio replay. |
| ai_interview_prep_device_check | /device-check | `views/pages/DeviceCheckPage.tsx` | STATIC | Chưa gọi getUserMedia; sidebar chưa có link vào màn này. |
| interviewai_sign_in | /login | `views/pages/LoginPage.tsx` | DATA | OAuth Google + GitHub thật; Enterprise SSO (Keycloak) là luồng riêng. Hợp đồng thông báo lỗi: `features/auth-flows.md`. |
| interviewai_create_account | /register | `views/pages/RegisterPage.tsx` | DATA | Bản cũ inline-style đã được dựng lại theo mockup 2 cột (branch `feature/create-api-sign-up`, 2026-10-17): bỏ phone + confirm password theo mockup, thêm Google/GitHub (GitHub callback về `/login`), terms checkbox client-only. |
| — (mockup không có màn này) | /verify | `views/pages/VerifyEmailPage.tsx` | DATA | Trang nhận `?token=` từ email, gọi `GET /api/v1/auth/verify`, hiển thị message API nguyên văn + link Sign in. |
| interviewai_two_factor_authentication_2fa | /two-factor | `views/pages/TwoFactorPage.tsx` | STATIC | Không có API 2FA. |
| interviewai_magic_link_confirmation | /magic-link | `views/pages/MagicLinkPage.tsx` | STATIC | Nút "Email me a magic link" ở LoginPage đang là chỗ trống. |
| interviewai_reset_password | /forgot-password | `views/pages/ForgotPasswordPage.tsx` | DATA | Plan FE `features/auth-flows.md` + plan BE `spec/features/password-reset.md`. Nút SMS chỉ hiện notice (không có API SMS); resend có cooldown 30s. |
| interviewai_set_new_password_confirmation | /reset-password | `views/pages/ResetPasswordPage.tsx` | DATA | Plan FE `features/auth-flows.md` + plan BE `spec/features/password-reset.md`. Pill đếm thời gian + chip danh tính lấy từ `GET /reset-password?token=`; modal hiển thị `eventId` + trạng thái thu hồi thật, không đếm số phiên. |
| interviewai_public_landing_page | `/` khi chưa đăng nhập | `views/pages/LandingPage.tsx` | STATIC | `HomeRoute` trong `App.tsx` quyết định: đã đăng nhập -> /dashboard. |
| interviewai_public_job_board | /opportunities | `views/pages/PublicJobBoardPage.tsx` | STATIC | 5 job demo copy từ mockup, filter local. Route công khai. |

## Luồng employer / admin

| Màn mockup | Route | File | Trạng thái | Thiếu / ghi chú |
|---|---|---|---|---|
| create_edit_job_posting_form | /jobs/new, /jobs/:id/edit | `views/pages/JobFormPage.tsx` | DATA | Nhãn + tiêu đề đã tiếng Anh theo mockup. |
| employer_workspace_applicant_pipeline_evaluations | /my-jobs | `views/pages/MyJobsPage.tsx` | DATA | Pipeline ứng viên trong modal (Accept & Schedule / Interviewed / Accept / Reject + Score 0-100). Nhãn tiếng Anh. |
| employer_mentor_availability_management | /my-slots | `views/pages/MySlotsPage.tsx` | DATA | "Interviewer Availability"; nhãn tiếng Anh. |
| interview_booking_calendar_slots | /my-slots/calendar | `views/pages/InterviewCalendarPage.tsx` | DATA | Lịch tuần + Add Availability + Cancel slot (API slot thật). Bỏ: duration/timezone/platform pill, Booking Summary ứng viên, suggested tags, live-sync latency. Có link sidebar "Slot Calendar" cho role employer. |
| organization_billing_settings | /packages, /my-orders | `PackagesPage.tsx`, `MyOrdersPage.tsx` | DATA | Thanh toán giả lập; `PackagesPage` vẫn gọi `payOrder` ngay sau `createOrder`. |
| admin_workspace_user_directory_job_approvals | /admin/users | `views/pages/AdminUserManagementPage.tsx` | DATA | Plan FE `features/admin-user-management.md` (2026-10-19). **Wave 1 + wave 2 xong**: tab Deleted + Restore, PATCH /status, audit target `fullname — email` + badge `succeeded/reason` + filter action/date, 4 KPI từ `GET /users/stats`, Export CSV server-side `GET /users/export`, tab Pending Invites (`status=PENDING`) + Invite/Resend/Revoke, Edit profile `PATCH /users/{id}`, tab Role Permissions (static từ `@PreAuthorize` BE), cột Last Active từ `lastLoginAt`. **Còn mở**: action gửi email (lock/unlock/delete/reset/invite/resend) chưa bấm được đường thành công vì container backend thiếu env Gmail API; bulk action + pill health chưa làm. |
| admin_job_approval_moderation_review | /admin/job-approvals | `views/pages/JobApprovalPage.tsx` | STATIC | Không có endpoint duyệt tin. |
| ai_interview_engine_rubric_studio_1 + _2 | /admin/rubrics | `views/pages/RubricStudioPage.tsx` | STATIC | Gộp 2 state vào một trang qua tab. |
| hiring_analytics_ai_talent_insights | /admin/analytics | `views/pages/HiringAnalyticsPage.tsx` | STATIC | Không có aggregate endpoint. |
| candidate_detail_full_evaluation_scorecard | /candidates/:id/evaluation | `views/pages/CandidateEvaluationPage.tsx` | STATIC | Employer-facing, route guard ROLE_INTERVIEWER/ADMIN/STAFF. |

4 màn STATIC employer/admin + 3 màn STATIC auth + landing/public board **có route nhưng chưa gắn vào sidebar** (trong sidebar mà dẫn tới số liệu bịa thì dễ hiểu nhầm là thật). Muốn mở: vào thẳng URL, hoặc dùng account đúng role.

## Trang trong app mà mockup không có

`CvAnalyzerPage`, `CoverLettersPage`, `BugReportsPage`, `EmployerReviewsPage`, `PackageManagementPage`, `AdminFeedbackPage`, `UnauthorizedPage`, `JobsPage` (in-app board). Nhóm này mockup không có -> dùng primitive + token Stitch. Nhãn đã sang tiếng Anh, trừ `CvAnalyzerPage`/`CoverLettersPage` và message trong `useCvController` (chưa có thiết kế nào khác, giữ nguyên).
