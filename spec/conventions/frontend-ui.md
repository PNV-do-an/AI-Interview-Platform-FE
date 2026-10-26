# Luật giao diện (design system "Precision Intelligence")

Áp dụng cho mọi file trong `frontend/src/views/`. Nguồn sự thật duy nhất của token: `frontend/tailwind.config.js` (trích từ `precision_intelligence/DESIGN.md`).

## 1. Màu và chữ — chỉ dùng token

Bảng dưới áp dụng cho màn candidate/employer; khu vực `/admin/*` dùng bộ token thứ hai ở §1b.

| Nhu cầu | Token |
|---|---|
| Màu chính, nút chính, link | `primary` `#3525cd`, hover `primary-hover`; nền đậm chữ trắng: `primary-container` + `on-primary` |
| Màu phụ (accent trạng thái, icon) | `secondary` `#4648d4` |
| Nền trang / card / divider nổi | `surface` `#faf8ff` / `card` / `surface-low` `#f2f3ff` / `surface-mid` `#eaedff` / `surface-high` `#e2e7ff` |
| Chữ | `ink` `#131b2e`, `ink-variant` `#464555`, `outline-strong` `#777587` (nhãn nhỏ uppercase), `outline` `#c7c4d8` (divider cũ, đừng làm tối hơn) |
| Trạng thái | `success` / `danger` / `info` — mỗi nhóm có `DEFAULT`, `-bg`, `-text`; `error` `#ba1a1a` là màu dot |
| Chữ số lớn | `text-metric-stat`; heading `text-headline-lg|md|sm`; body `text-body-lg|md|sm`; nhãn nhỏ `text-label-md|sm`; code/date `font-mono` |

- Viền hairline thống nhất `border-[#e2e8f0]`; radius: `rounded-md` cho control, `rounded-lg` cho card nhỏ, `rounded-xl` cho panel dashboard, `rounded-full` **chỉ** cho badge trạng thái/dot.
- Icon: `<span className="material-symbols-outlined">tên_icon</span>` (Material Symbols Outlined, đã load toàn app). Không dùng svg tự chế cho icon.
- Màu mockup chưa có token: được viết `bg-[#hex]` nhưng phải kèm comment ngắn chỉ tên vai trò màu trong mockup (ví dụ `// secondary-fixed-dim`). Comment nằm **ngoài** chuỗi class (`//`, `{/* */}`, hoặc bảng kê ở đầu file) — nhét `/* */` vào trong `className` thì nó lọt xuống DOM thành class rác. Ưu tiên map về token có sẵn (`primary-fixed` -> `info`) hơn là thêm hex mới. **Không** tự ý thêm token vào `tailwind.config.js` khi chỉ một trang cần.

### 1b. Từ vựng token thứ hai — khu vực `/admin/*`

Wave admin 2026-10-21 chép markup từ mockup Stitch nên dùng **đúng tên token trong design export**, không map về bảng trên:

| Nhu cầu | Token admin |
|---|---|
| Nền | `background` `#faf8ff`, `surface`, `surface-container-lowest/low/DEFAULT/high/highest`, `surface-dim`, `surface-variant` |
| Chữ | `on-surface`, `on-surface-variant`, `on-background` |
| Đường viền | `outline-variant` `#c7c4d8` (app cũ gọi `outline`), `error-container` |
| Primary | `primary`, `primary-container` `#4f46e5` + `on-primary`, `primary-fixed`/`-dim`, `on-primary-fixed`/`-variant` |
| Secondary teal | `secondary-teal` `#006b5f` + `on-secondary-teal`, `secondary-fixed`, `secondary-container` — design dùng `secondary` cho teal trong khi app này `secondary` = `#4648d4`, nên teal bắt buộc mang tên `secondary-teal` |
| Tertiary (khóa/bảo mật) | `tertiary`, `tertiary-container`, `tertiary-fixed`, `tertiary-fixed-dim`, `on-tertiary-fixed-variant` |
| Chữ | `text-ds-display-lg`, `text-ds-headline-xl/lg/md/sm`, `text-ds-body-lg/md/sm`, `text-ds-label-lg/md/sm` (bộ `ds-*` song song với `headline-*`/`body-*` ở trên) |
| Khoảng cách | `space-xs/sm/md/lg/xl/2xl`, `gutter` |

- Primitive riêng cho admin: `views/components/adminKit.tsx` (`adminButton`, `AdminCard`, `AdminPageHeader`, `StatCard`, `Pill`, `SearchField`, `Toggle`, `Pagination`, `ModalBackdrop`, `RoleChip`, `StatusChip`, `fmtServer`, `timeAgo`, `ROLE_VN`, `STATUS_VN`, `AUDIT_ACTION_VN`). Màn candidate/employer vẫn dùng `views/components/ui.tsx`.
- Khối demo không có endpoint: gắn nhãn `<DemoTag>Khối demo — ...</DemoTag>` (`DemoTag` export từ `adminKit`, là `Pill icon="hive"`). Nhãn phải **nhìn thấy trên màn**, không thay bằng `title` hover. Đã dán nhãn ở: user detail (ngày sinh/nơi cư trú, CV), settings (version, hạ tầng AI), dashboard admin (card "Tài nguyên AI & Hệ thống" — xem ngoại lệ dưới), và 6 màn ứng viên wave 2026-10-26 (tổng quan: gợi ý AI Copilot / Năng lực cốt lõi / Mẹo vàng; đơn ứng tuyển: các card chi số dẫn xuất + tỷ lệ thành công; hồ sơ: Open to work, lượt xem, gợi ý kỹ năng, kinh nghiệm, học vấn; lịch phỏng vấn: AI Co-Pilot, chính sách đổi lịch; cài đặt tài khoản: điểm an toàn, kênh thông báo, tài khoản liên kết, Danger Zone; kết quả phiên: "Cao hơn 78% ứng viên", bảng Năng lực cốt lõi). **Ngoại lệ**: card "Tài nguyên AI & Hệ thống" ở dashboard (uptime/độ trễ/token vẫn là số mockup) **không dán nhãn** — anh Huy bỏ 24/10 vì `Pill` có `whitespace-nowrap` làm vỡ header card; ghi chú demo nằm ở docstring đầu file. Cùng ngày anh bỏ luôn nhãn "Khối demo — BE chưa có API 2FA" ở chip "2FA Đã kích hoạt" của `/admin/account` — giá trị vẫn hardcode, nhưng BE đang làm wave 2FA/TOTP (`totp_enabled`, `/auth/verify-otp`) nên để nhãn sẽ thành sai; thẻ 2FA ở `/account` của ứng viên cũng áp theo: hiển thị "Đang tắt" + nút `disabled`, không dán nhãn.

## 2. Ngôn ngữ

- Có **hai từ vựng chrome**, ranh giới là route:
  - `/admin/*` = **tiếng Việt 100%** (chốt 2026-10-21, theo đúng mockup trong `stitch_ai_interview_platform (3).zip`). Đầu trang, nhãn field, nút, menu, empty state, nhãn trạng thái admin khai trong `adminKit` (`ROLE_VN`, `STATUS_VN`, `AUDIT_ACTION_VN`).
  - Màn ứng viên (ROLE_USER) = **tiếng Việt 100%** từ wave 2026-10-26 (mockup `stitch_ai_interview_platform (5).zip`): 6 màn Tổng quan / Hồ sơ & CV / Đơn ứng tuyển / Lịch phỏng vấn / Cài đặt tài khoản / Kết quả & Lịch sử luyện tập dùng `candidateKit` + `CandidateLayout`, còn các mục chưa có mockup mới (Tìm việc, Chi tiết JD, Bắt đầu & Diễn biến phiên luyện, Device Check) vẫn giữ chrome tiếng Anh theo mockup cũ.
  - Màn employer/landing/auth = **tiếng Anh đúng theo mockup cũ**.
- Dữ liệu động giữ **nguyên văn từ API**: tên công việc, tên người, nhãn trạng thái trong `*_LABELS` của model (`APPLICATION_STATUS_LABELS`...). Không dịch tay trong từng trang; thiếu nhãn thì sửa map trong `models/*.model.ts`.
- Màn `DATA`/`UI` của admin: dữ liệu demo không có endpoint thì giữ nguyên văn mockup (tiếng Việt) nhưng phải có nhãn `Khối demo — ...`.
- **Không in đường dẫn API lên màn** (24/10, anh Huy quét và bỏ hết): không `GET /admin/...`, `PUT /admin/settings`, `PATCH /jobs/{id}/review` trong title/description/empty state, và không nói "Endpoint chưa trả…", "Enum … phía backend". Copy chỉ diễn đạt bằng nghiệp vụ tiếng Việt; đường dẫn API và tên field nằm ở docstring đầu file + `spec/INDEX.md`, không ra tới người dùng.
- Nhãn trạng thái render qua `<StatusBadge status={x} label={LABELS[x]} />` (candidate/employer) hoặc `<StatusChip status={x} />` (admin). Tone màu chỉ khai ở `STATUS_TONE` trong `views/components/ui.tsx` và `STATUS_VN` trong `adminKit.tsx`, không khai lại trong trang.

## 3. Số liệu — chỉ đồ thật

- Màn `DATA`/`UI`: thành phần nào không có endpoint hoặc không có column thì **bỏ hẳn**, không ô trống kiểu `—`, không tự chế con số (percentile, "Top 10%", "95% precision", "Match score 94%", radar, leaderboard, streak...). Ghi lại khối đã bỏ + lý do vào `spec/INDEX.md` hoặc file plan.
- Màn `STATIC`: được phép giữ số liệu demo **nguyên văn từ mockup**, tên file/route phải tự nói lên đó là màn mockup, và **không được viết số liệu mới ngoài những gì mockup đã kê**. Nguyên tắc cũ "không nối sidebar" đã bỏ (2026-10-21): mockup nào có item trên sidebar thì dựng xong phải gắn nav, nếu không anh em mở app sẽ thấy "giao diện không đổi" và không soi được màn mới. Vai trò gắn nav phải khớp guard route để không dẫn tới 403.
- Không gọi thêm API mới để "làm cho đầy". Không optimistic write giả.

## 4. Layout dùng chung

- Mọi route đăng nhập nằm trong `AppLayout` (sidebar `w-72` + header `h-16`, `main` `px-4 pt-16 lg:px-6`). Trang **không** tự vẽ lại sidebar/header, kể cả khi mockup có `<aside>`.
- Route `/admin/*` nằm trong **`AdminLayout`** (shell riêng, dựng lại theo mockup admin 2026-10-21): từ 21/10 shell responsive — aside `w-72` chỉ render từ `lg` (`hidden lg:flex`), dưới `lg` là drawer phủ màn có overlay + nút hamburger ở header; header `fixed left-0 lg:left-72`, nội dung `lg:pl-72`, drawer tự đóng khi đổi route. Hệ quả: thanh action sticky của màn admin phải là `fixed bottom-0 left-0 right-0 lg:left-72`. Thân màn admin vẫn **không** tự vẽ `<aside>`. `AppLayout` dùng đúng cơ chế drawer/hamburger này.
- Route ROLE_USER nằm trong **`CandidateLayout`** (shell "AI Interview / CANDIDATE PORTAL" theo mockup 2026-10-26): aside `w-64` (nội dung `lg:pl-64`, header `lg:left-64`), drawer + hamburger dưới `lg` y như cơ chế của `AdminLayout`. `App.tsx` chọn shell theo vai trò trong `RoleLayout` — ROLE_USER -> `CandidateLayout`, các role khác vẫn `AppLayout`. Thân màn ứng viên **không** tự vẽ `<aside>`; nav thật hiện có: Tổng quan, Hồ sơ & CV, Tìm việc làm, Đơn ứng tuyển, Lịch phỏng vấn, Luyện phỏng vấn AI, Báo cáo & Đánh giá + footer Cài đặt tài khoản, Trợ giúp & Hỗ trợ.
- Sidebar lọc theo role: candidate / employer (sidebar `AppLayout`) và 7 mục "Quản trị hệ thống" (sidebar `AdminLayout`). Thêm route mới thì chọn vai trò nav khớp với guard route để không dẫn tới 403; mockup đã vẽ item nav thì phải gắn item đó — xem §3.
- Trang đăng nhập/đăng ký/khôi phục mật khẩu là trang standalone 2 cột với panel gradient `from-primary to-secondary`, có header/footer riêng.
- Bảng mật độ cao: header `thClass` (cao 32px, uppercase, tracking 0.04em), row `tdClass` (cao 40px), hover `bg-surface-low/60`, border dưới `#e2e8f0`.
- Không thêm animation/chrome ngoài mockup: không skeleton tự chế, không transition thừa, không shadow to hơn `shadow-[0_1px_3px_rgba(15,23,42,0.04)]` cho card nội dung.
- **Brand mark**: chỉ một nguồn `src/assets/logo-wordmark.png` (wordmark "AI Interview", đã cắt nền trắng ra trong suốt, 491×80). Render `h-5 w-auto` trong sidebar + header `AppLayout` và các trang standalone (login/register/forgot/reset/magic-link/2FA), `h-6` ở header landing & job board. Không dựng lại kiểu cũ "tile icon `neurology`/`psychology` + chữ InterviewAI".
- **Không có context chip trong header app**: mockup Stitch vẽ chip "[👑 ADMIN] ..." cạnh ô search nhưng đã bị yêu cầu gỡ (20/10). Header `AppLayout` chỉ gồm ô search + cụm thông báo/avatar; ngữ cảnh màn đọc ở breadcrumb của chính màn đó.

## 5. Code

- Primitive dùng chung ở `views/components/ui.tsx`. Trước khi tạo component mới, kiểm tra `Card/Badge/PageHeader/EmptyState/ErrorBanner/buttonClass/inputClass/labelClass/tableClass` đã đủ chưa.
- **Không** `style={{...}}`, ngoại trừ giá trị động thật sự (`width: ${pct}%`).
- Một màn = một file `views/pages/<Name>Page.tsx`, default export. Component phụ để trong cùng file, không tách unless dùng lại.
- State/handler/controller của trang cũ giữ nguyên khi restyle; chỉ đổi phần render. Restyle không được làm mất logic (fetch, phân trang, guard role, banner).
- Màn dựng xong phải **mở được bằng đường có thật trong app** (item sidebar mà mockup đã vẽ, hoặc link từ màn khác). Route chỉ soi bằng URL tay thì coi như chưa xong: người xem mở app sẽ thấy "giao diện không đổi".
- Script probe/test dùng một lần: tạo rồi xoá trong phiên, không commit.

## 6. Trước khi báo xong

`cd frontend && npx tsc --noEmit` + `grep -rn "style={{" src/views/pages/<file>` + đối chiếu `screen.png` + các bước trong `spec/verification.md`.
