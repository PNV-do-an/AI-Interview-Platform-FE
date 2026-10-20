# Luồng đăng nhập / đăng ký / quên mật khẩu

Trạng thái: `code xong + đã verify`, chờ anh chốt mục 9 để commit.
Người/phiên tạo: 2026-10-19, branch `fix/login-gg` (đã merge vào `dev` qua PR #2 `dd8d5a4`; phần bổ sung hôm nay đang nằm ở working tree của `dev`).
Mockup nguồn: `interviewai_sign_in`, `interviewai_create_account`, `interviewai_reset_password`, `interviewai_set_new_password_confirmation` (màn đăng ký đã dựng lại theo mockup 2 cột, xem `spec/INDEX.md`).

Bổ sung phía FE cho `spec/features/password-reset.md` (**repo BE**, trạng thái `done`) — phần quên/đặt lại mật khẩu. File này chỉ mô tả những gì FE phải làm đúng; test case BE (#1-#15 trong doc kia) không lặp lại ở đây.

## 1. Mục tiêu

Ứng viên chưa có tài khoản vào được hệ thống bằng email hoặc Google/GitHub; vào được lại khi quên mật khẩu; và mọi lần thất bại đều cho biết **thiếu/sai chỗ nào**, không hiện nhãn chung.

## 2. Phạm vi / Không làm

- Làm: hợp đồng thông báo lỗi cho 4 route `/login`, `/register`, `/forgot-password`, `/reset-password` (+ `/verify` vì email verification là bước bắt buộc của luồng đăng ký).
- Không làm: 2FA (`/two-factor`), magic link (`/magic-link`), "Verify via SMS code" — backend không có endpoint nào cho ba thứ này; giữ nguyên dạng notice theo mockup, không gọi thêm API mới để "làm cho đầy".
- Không làm: không thêm validate từng field phía client cho form login/register. Chốt đã chốt: **BE chặn, FE hiển thị nguyên văn message của BE** (kể cả map `detail`). Client-side rule từng được thử và đã bị gỡ.
- Ngoại lệ duy nhất: ô email của `/forgot-password` có chặn ở client (`EMAIL_PATTERN`), vì endpoint đó không bao giờ trả lỗi (mục 6) — không chặn thì người dùng nhận card "Check your inbox" giả.
- Không sửa controller ngoài 3 luồng (`useAdminUserController`, `useCandidateController` vẫn đọc `data.message` thô — cùng họ lỗi này, chưa nằm trong phạm vi).

## 3. API thật dùng được (đo ngày 2026-10-19 trên backend local `:8081` và staging)

| Endpoint | Method | Kết quả đã đo | Ghi chú |
|---|---|---|---|
| `/api/v1/auth/login` | POST | 200 `{accessToken, refreshToken, user}`; 401 `"Email không tồn tại"`; 423 `"Tài khoản đã bị khóa do nhập sai quá nhiều lần..."` + `detail.lockedUntil` | `LoginRequest` không có ràng buộc bean-validation nên không có 400. 423 đo bằng 5 lần sai mật khẩu. |
| `/api/v1/auth/register` | POST | 201 khi tạo được tài khoản (FE không dùng body, chuyển thẳng sang `/login?registered=true`); 400 `"Validation failed"` + `detail {fullName, email, password}` (message **tiếng Anh**); 409 `"Email đã tồn tại trong hệ thống"` | 400 sinh ra ở `@Valid` trước khi xuống service, nên lượt bị 400 **không** ghi `register_attempts`. |
| `/api/v1/auth/resend-verification` | POST | 200; 401 `"Email không tồn tại trong hệ thống"` | FE chỉ hiện nút resend khi 401 login có `"chưa được kích hoạt"`. |
| `/api/v1/auth/verify?token=` | GET | 200 message kích hoạt thành công; 401 `"Token xác thực không hợp lệ"` / `"Link xác thực đã hết hạn (quá 24 giờ)"` | `VerifyEmailPage` hiển thị `message` nguyên văn. |
| `/api/v1/auth/google/client-id`, `/github/client-id` | GET | 200 client-id thật (staging đã bật cả hai) | rỗng = chưa bật -> FE ẩn/notice. |
| `/api/v1/auth/sso/config` | GET | 200 `{enabled:false}` trên staging | chưa bật Keycloak. |
| `/api/v1/auth/forgot-password` | POST | **200 cho mọi case**: email trống, email không tồn tại, bị chặn rate-limit — đều trả `"Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu."` | Chủ ý không tố giác email. System có ghi `password_reset_attempt` **trước** khi kiểm tra email tồn tại hay không. |
| `/api/v1/auth/reset-password?token=` | GET | 200 `ResetTokenInfo` (danh tính + `remainingSeconds`); 401 `"Link đặt lại mật khẩu không hợp lệ"` |  |
| `/api/v1/auth/reset-password` | POST | 200 `{signedOutEverywhere, eventId}`; 400 `"Validation failed"` + `detail {token, password, confirmPassword}` | 400 đo bằng body ba field rỗng. |

## 4. Ánh xạ thông báo lỗi -> UI (hợp đồng FE)

`ErrorModel` của BE có 5 field: `status, message, path, timestamp, detail`. Quy tắc đọc:

| Tình huống | Nguồn hiển thị |
|---|---|
| 400 + `message == "Validation failed"` | nối các giá trị trong `detail` bằng `"; "`, sắp theo thứ tự field xuất hiện trên form |
| 400 nhưng `message` có nghĩa thật (BadRequestException) | `message` nguyên văn |
| 401 / 409 / 502 | `message` nguyên văn (tiếng Việt do BE viết) |
| 423 | `message` + `" Unlocks at: <giờ địa phương vi-VN>"` lấy từ `detail.lockedUntil` |
| Mạng/API không trả payload | fallback tiếng Anh của từng form |

Hai lý do từng khiến hợp đồng này bị vỡ, đã sửa:

1. FE chỉ đọc `message` -> mọi lỗi bean-validation hiện đúng chuỗi `"Validation failed"` (không nói thiếu gì).
2. FE đọc `data.extra.lockedUntil` trong khi `ErrorModel` đặt tên field là `detail` -> giờ mở khoá của tài khoản bị khóa không bao giờ hiện.

`detail` phía BE là `HashMap` nên thứ tự key lật khật giữa hai lần gọi (đo được: `"Password is required; Full name is required; Email is required"` rồi `"Full name is required; Email is required; Password is required"`). FE phải tự sắp theo `fieldOrder`, không tin thứ tự của BE.

Key kỹ thuật không được đưa vào banner: `lockedUntil` (đã có nhánh 423 riêng).

## 5. Khối mockup giữ nhưng không có endpoint

- `ForgotPasswordPage.tsx:218` — nút "Verify via SMS code": set notice hard-code, backend không có API SMS.
- `LoginPage` -> `/magic-link`, `/two-factor`: hai màn STATIC, `spec/INDEX.md` đã ghi "không có API".
- Link `href="#"` (Terms of Service, Privacy Policy, Help Center, footer 4 link) trên 4 màn: giữ theo mockup, chưa có trang nội dung.
- `RECOVERY_TIPS` / `SECURITY_TIPS` / `TRUST_BADGES`: nội dung tĩnh copy từ mockup, không nối số liệu.

## 6. Việc backend cần làm (nếu anh đi tiếp)

- `POST /forgot-password` nhận `Map<String,String>` nên không có `@Valid`, và **đây là chủ ý đã ghi trong doc BE** (test case #15: email rỗng trả 200 message chung, không ghi lượt đếm; email không tồn tại vẫn ghi để đếm theo IP, chống dò email). Vì BE không bao giờ trả lỗi cho input xấu, **toàn bộ trách nhiệm chặn nằm ở FE** — xem mục 7 case 7.
- Rate-limit đăng ký/đăng nhập trả **401** (`InvalidPasswordException`, `InvalidAccountException`) thay vì 429, nên FE không phân biệt được "sai mật khẩu" với "đừng thử lại bây giờ"; 423 lock thì lại có status riêng. Đề xuất: `429` + `detail.retryAfterSeconds`.
- Message 400 của register là tiếng Anh (`RegisterRequest.java:10-19`) trong khi rule mật khẩu yếu ở service là tiếng Việt (`RegisterInterfaceImpl.java:68-70`, trả 401) — cùng một form, hai ngôn ngữ. Cần anh chốt một bên.
- Lần sai mật khẩu thứ 5 (lần sinh ra lock) BE trả `message` cụt: `"Tài khoản đã bị khóa do nhập sai quá nhiều lần. Khóa đến: "` — chuỗi nối với `lockUntil` nhưng ra rỗng, trong khi `detail.lockedUntil` vẫn có giá trị. Lần thứ 6 trở đi message đã đủ. FE bù bằng `" Unlocks at: ..."`, nên banner case 5 chỉ hơi lặp từ; muốn sạch thì BE bỏ luôn cụm "Khóa đến: " khỏi message, để FE hiển thị giờ.

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | `/register` submit form trống | banner `"Full name is required; Email is required; Password is required"`, không có request nào ghi user |
| 2 | `/register` email sai định dạng | banner có `"Invalid email format"` đúng vị trí field email |
| 3 | `/register` email đã tồn tại | banner `"Email đã tồn tại trong hệ thống"` nguyên văn |
| 4 | `/login` mật khẩu sai 5 lần rồi lần 6 | banner khóa + `" Unlocks at: ..."` có giờ, không còn là `"..."` cụt |
| 5 | `/login` email chưa verify | banner nguyên văn + block "Didn't get the email? / Resend verification email" |
| 6 | Nút resend khi email chưa nhập | không gửi request |
| 7 | `/forgot-password` email trống | **không gửi request**, nói rõ cần nhập email; không hiện card "Check your inbox" giả |
| 8 | `/forgot-password` email không tồn tại | card "Check your inbox" (generic 200), chủ ý không báo "không tìm thấy" |
| 9 | `/reset-password?token=rác` | trạng thái invalid + `"Link đặt lại mật khẩu không hợp lệ"` nguyên văn |
| 10 | `/reset-password` body thiếu field | banner detail, không phải `"Validation failed"` |
| 11 | Từng có banner lỗi API, rồi submit bị client chặn | banner cũ biến mất, không treo nhầm lỗi cũ |

Case 3 chưa đo live (đăng ký email trùng là một lượt **ghi** vào DB, không làm trên staging chung; muốn đo thì dựng lại container trỏ BE local như mục 8.5). Đường hiển thị của nó giống hệt case 401/502 đã đo, và message 409 đã nằm trong unit test ở mục 8.3. Case 11 suy ra từ `setError('')` đứng đầu mỗi handler, chưa bấm tay.

## 8. Cách đã verify (đo lại 2026-10-19 với code hiện tại)

Host không chạy được `npm start` (`node_modules/.bin` là symlink hỏng, `react-scripts` không resolve), nên đường verify là Docker:

1. `node node_modules/typescript/bin/tsc --noEmit` -> sạch, không lỗi type.
2. `docker compose build frontend` lúc đầu **chết ở bước gửi context** (`invalid file request node_modules/.bin/acorn`) vì repo chưa có `.dockerignore`. Đã thêm `.dockerignore` (`node_modules`, `build`, `coverage`, `.git`, `*.log`) -> build `EXIT=0`, CRA "Compiled with warnings" chỉ là warning cũ của file khác, bundle `main.edca7f16.js` được container `:3000` phục vụ (kiểm tra bằng `grep` trong image, không tin cache).
3. Hợp đồng đọc lỗi test ở mức đơn vị: tách `apiError.ts` bằng `tsc` ra JS Temp rồi chạy 8 case với payload **đo thật** từ BE (400 nhiều field, 400 thứ tự đảo, 423 `detail.lockedUntil`, 401 thường, lỗi mạng, 400 `detail` rỗng, 400 chỉ 2 field password, `detail` không phải object) -> 8/8 đạt.
4. Live trên `http://localhost:3000` (bundle trỏ backend staging, nên chỉ đo các case 400 ngắn ở `@Valid` — không xuống service, không ghi DB): case 1 banner `"Full name is required; Email is required; Password is required"`; case 2 `"Invalid email format"`; case 7 email trống/sai -> **0 request**, banner `"Enter a valid email address."`, không hiện card "Check your inbox"; case 9 `"Link đặt lại mật khẩu không hợp lệ"` nguyên văn.
5. Live trên `http://localhost:3002` bằng container tạm (build từ bản copy repo trong Temp, `.env.production` của bản copy trỏ `http://localhost:8081`, gắn `--network aiinterview-stack_default` để nginx resolve upstream `backend`) — đây là chỗ duy nhất được ghi, vì là DB local: case 4 login sai 4 lần -> 401 `"Mật khẩu sai"`, lần 5 -> 423, lần 6 -> banner `"Tài khoản đã bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút. Unlocks at: 07:45:45 19/10/2026"`, không lọt chuỗi ISO; case 5 login email chưa verify -> 401 nguyên văn + nút resend hiện, bấm resend -> 502 `"Không gửi được email. Vui lòng thử lại hoặc liên hệ hỗ trợ."`; case 10 POST `/reset-password` field rỗng -> `"New password is required; Confirmation password is required"`, và 401 mismatch -> message tiếng Việt nguyên văn của BE.
6. Dọn sau đo: xoá container + ảnh tạm + thư mục Temp, xóa `reset_token` đã gài cho user 4, mở khoá admin local (`lock_until=NULL`, `login_attempts=0`, xoá row `login_attempts`) rồi đăng nhập lại -> 200. Container `:3000` của stack vẫn chạy để anh test tay.

## 9. Câu hỏi mở cho anh Huy

- Case 7 (chặn email trống ở quên mật khẩu) có làm ở client không, hay để BE trả 200 generic rồi UX hiện "Check your inbox"? **Đã làm ở client** theo đề xuất này (`EMAIL_PATTERN` chặn trước khi gọi API, đã đo mục 8.4). Nếu anh muốn ngược lại thì chỉ cần bỏ đoạn chặn trong `ForgotPasswordPage.sendResetLink`.
- Có sửa luôn `useAdminUserController` / `useCandidateController` (cùng họ lỗi đọc `message` thô) không? **Đề xuất: chưa**, ngoài phạm vi 3 luồng.
- `.env.production` commit hay cho vào `.gitignore`? **Đề xuất: `.gitignore`**, vì build Docker local trỏ browser vào backend staging dùng chung.

## 10. Wave restyle 6 màn auth theo thiết kế Stitch (2026-10-20)

Nguồn chân lý là ZIP Stitch (`stitch_ai_interview_platform`) — 6 màn: login, register, forgot-password (form + sent), reset-password (input + success + expired), check-email sau đăng ký. Làm trên nhánh `feature/create-job`, không đụng trang ngoài auth.

**File sửa/tạo:**

- Viết lại 4 trang: `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`; tạo mới `CheckEmailPage.tsx` + route `/check-email` trong `App.tsx`.
- `useAuthController.ts`: sau register điều hướng `/login?registered=true` -> `/check-email?email=...` (1 dòng).
- `tailwind.config.js`: thêm 4 token không trùng `surface-highest`, `primary-fixed`, `secondary-fixed`, `secondary-fixed-dim`; các token còn lại map sang token sẵn có (`surface-container-lowest`->`card`, `on-surface`->`ink`, v.v.), màu one-off dùng giá trị arbitrary.

**Quyết định theo anh Huy và theo thiết kế:**

- Bỏ nút GitHub + Enterprise SSO ở Login/Register (**"Bỏ, đúng thiết kế"**) — service layer `google/github/sso` giữ nguyên, chỉ gỡ UI; nút Google giữ pattern GSI overlay cũ.
- Selector role Ứng viên/Nhà tuyển dụng ở Register chỉ là UI — BE `/auth/register` không nhận role; radio mặc định Ứng viên.
- Đồ demo của Stitch thay bằng state thật: tab preview reset-password bỏ, "Gửi lại liên kết mới" điều hướng `/forgot-password` thay alert giả, countdown cứng 51s thay bằng cooldown thật (forgot 30s, resend verification 60s giữ nguyên).
- Giữ quyết định cũ: remember-me mặc định checked; chữ "15 phút" ở forgot/reset lấy theo thiết kế.
- Sau register success view bỏ EventId (thiết kế không có); `signOutEverywhere` gửi cứng `true` (checkbox bị thiết kế bỏ).

**Đã verify (Docker local, bundle `main.57781e51.js`):**

- `tsc --noEmit` sạch; build `EXIT=0`; `.env.production` backup/restore so `cmp` trùng byte.
- DOM snapshot 6 màn khớp cấu trúc Stitch; browser-use không chụp được ảnh (viewport ẩn) nên so theo DOM, không so pixel.
- Register: bấm radio Nhà tuyển dụng -> checked; gõ `TechTalent2026!` -> label `"Độ mạnh: Rất tốt"` (4/4 rule).
- Forgot: submit email sai format -> form không gửi đi, **0 request API** (native `type="email"` chặn trước cả `EMAIL_PATTERN`); submit `@example.com` -> sent view với email che `v***@example.com`, cooldown đếm `"Gửi lại sau (29s)"`.
- Reset không token / token sai -> expired view nguyên văn; `/check-email` thiếu email -> redirect `/login`.
- Console sạch trên các màn đã đo. Chưa đo được: input view reset-password (cần token thật còn hạn) và success view (cần reset thật -> ghi DB).

**Còn mở:**

- TTL "15 phút" trên UI chưa đối chiếu với giá trị thật của BE (FE không thấy hằng số nào).
- Logo đang dùng asset wordmark có sẵn của app, không phải đúng file PNG trong ZIP (ZIP dùng ảnh Google-hosted).
- Màn `/verify?token=` (trang kết quả verify) không có nguồn Stitch -> giữ nguyên.

**Sửa sau khi anh Huy test (cùng ngày):**

- Register dựng lại theo bản HTML mới anh gửi: bỏ khung padding + `min-h-screen`, thay bằng khoá `h-screen overflow-hidden` ở desktop (>=1024px) và cho 2 panel `h-full` **tự cuộn bên trong**; mobile giữ cuộn trang thường. Hết tràn ngang.
- Panel trái còn cuộn trên màn laptop -> nén khoảng cách dọc (padding `lg:p-8`, gap giảm) và thêm breakpoint theo chiều cao `short` (`max-height: 819px`, khai báo trong `tailwind.config.js`) để ẩn card demo "Đánh giá phỏng vấn AI"/"Nguyễn Minh Anh" ở màn thấp; màn cao >=820px hiện đủ thiết kế.
- Logo wordmark (chữ navy nền trong suốt) chìm trên nền tối -> đặt lên chip trắng bo góc ở cả login + register.
- Bỏ chữ "30 ngày" ở checkbox "Ghi nhớ đăng nhập" (login), giữ nguyên hành vi remember 30 ngày phía code.

**Wave redesign bố cục theo flow (20/10):**

Làm lại bố cục cả 6 màn auth theo một hệ thống chung, bỏ trạng thái "mỗi trang một kiểu":

- Login + Register: cùng khung `lg:grid-cols-12` (trái showcase tối 5/12, phải form 7/12), cùng anatomy: logo chip trắng -> hero chữ gradient -> 3 benefit (icon + tiêu đề + mô tả) -> card proof (chỉ hiện ở màn cao >=900px, dùng arbitrary variant `[@media(max-height:899px)]:hidden` thay cho `short`) -> dải company chips; panel phải cùng nhịp: topbar chỉ còn "Về trang chủ" (bỏ language switcher + Trợ giúp trang trí), tab switcher, nút Google GSI, divider, form, footer 1 dòng.
- Thống nhất token: register bỏ slate/cyan/indigo/purple/emerald trang trí, chuyển sang surface/ink/outline/secondary-fixed; hero 2 trang dùng cùng gradient `primary-fixed -> secondary-fixed-dim -> secondary-fixed`; input/label/button chung một bộ class (`h-11`, `border-outline`, ring `primary/15`; nút `h-12 bg-primary`).
- Forgot + Check-email + Reset: gom chung shell `AuthShell` mới (`src/views/components/AuthShell.tsx`) — blob nền, header logo wordmark + "Về trang chủ", footer 1 dòng; thay toàn bộ indigo-600 (sai màu thương hiệu) bằng `primary`; card `border-outline/60 shadow-card`; bỏ header dính (sticky) và nút language emoji.
- VerifyEmail: đổi lockup "InterviewAI" lạc quỹ sang wordmark chung, Việt hóa nhãn tĩnh.
- Chống tràn chiều cao: card proof ẩn dưới 900px; register rút `gap`/`py` và ẩn footer + label role selector ở màn ngắn (`short:*`) — panel form còn tự cuộn trong ở màn thấp (đúng kiến trúc 2 panel tự cuộn đã chốt), panel trái không cuộn.
- GSI mount thêm `flex justify-center` để iframe nút Google (rộng tối đa 400px) căn giữa trong host 440px.

**Đã verify (Docker local, bundle `main.2000c4a8.js`, viewport 534x554):** `tsc` sạch; 6 màn không tràn ngang (`scrollWidth == clientWidth`); login panel phải 643px, register trái 481 / phải 853; toggle mật khẩu flip `password -> text`; tab switcher điều hướng `/login <-> /register`; radio role 2 chiều; gõ `Abc12345!` -> 4/4 bar + "Độ mạnh: Rất tốt"; reset token sai -> expired view; `/check-email` che email `te***@example.com`; `/verify` thiếu token -> alert lỗi tiếng Việt. `.env.production` backup/restore so `cmp` trùng byte. Chưa đo được: login/register ở đúng viewport desktop >=1024px (browser-use chỉ có 534px) — bố cục lg dùng cùng cấu trúc đã verify bằng đo chiều cao nội dung.
