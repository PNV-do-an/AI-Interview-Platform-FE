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
- Khối demo không có endpoint: gắn nhãn `<DemoTag>Khối demo — ...</DemoTag>` (`DemoTag` export từ `adminKit`, là `Pill icon="hive"`). Nhãn phải **nhìn thấy trên màn**, không thay bằng `title` hover. Đã dán nhãn ở: dashboard (4 khối), user detail (IP, chỉ số AI 94%, CV, kỹ năng, tab Hoạt động, thông tin cá nhân), JD queue (chip lọc demo, điểm tín nhiệm, 4 thẻ thẩm định AI), RBAC (mô tả role + mô tả module), settings (version, hạ tầng AI), account (avatar/2FA/phiên).

## 2. Ngôn ngữ

- Có **hai từ vựng chrome**, ranh giới là route:
  - `/admin/*` = **tiếng Việt 100%** (chốt 2026-10-21, theo đúng mockup trong `stitch_ai_interview_platform (3).zip`). Đầu trang, nhãn field, nút, menu, empty state, nhãn trạng thái admin khai trong `adminKit` (`ROLE_VN`, `STATUS_VN`, `AUDIT_ACTION_VN`).
  - Màn candidate/employer/landing = **tiếng Anh đúng theo mockup cũ**.
- **Ngoại lệ candidate (chốt 2026-10-22, bộ mockup Stitch 4 `candidate-redesign-stitch4.md`)**: shell `AppLayout`
  và 6 màn đã dựng lại theo mockup mới — `/my-profile`, `/my-applications`, `/interview-booking`,
  `/interview-history`, `/mock-interviews/:id/result`, `/account-settings` — dùng **chrome tiếng Việt**
  (đầu trang, nhãn field, nút, tab, empty state). 6 màn candidate chưa có mockup (`/dashboard`, `/jobs`,
  `/jobs/:id`, `/mock-interviews`, `/mock-interviews/:id`, `/cv-analyzer`, `/cover-letters`, `/device-check`)
  và màn employer/landing vẫn tiếng Anh như cũ, chỉ chịu shell Việt.
- Nhãn trạng thái ứng viên khai trong `models/Program.model.ts` (`APPLICATION_STATUS_LABELS`) hoặc map Việt
  nội bộ của từng màn đã dựng theo mockup 4; không dịch tay rải rác.
- Dữ liệu động giữ **nguyên văn từ API**: tên công việc, tên người, nhãn trạng thái trong `*_LABELS` của model (`APPLICATION_STATUS_LABELS`...). Không dịch tay trong từng trang; thiếu nhãn thì sửa map trong `models/*.model.ts`.
- Màn `DATA`/`UI` của admin: dữ liệu demo không có endpoint thì giữ nguyên văn mockup (tiếng Việt) nhưng phải có nhãn `Khối demo — ...`.
- Nhãn trạng thái render qua `<StatusBadge status={x} label={LABELS[x]} />` (candidate/employer) hoặc `<StatusChip status={x} />` (admin). Tone màu chỉ khai ở `STATUS_TONE` trong `views/components/ui.tsx` và `STATUS_VN` trong `adminKit.tsx`, không khai lại trong trang.

## 3. Số liệu — chỉ đồ thật

- Màn `DATA`/`UI`: thành phần nào không có endpoint hoặc không có column thì **bỏ hẳn**, không ô trống kiểu `—`, không tự chế con số (percentile, "Top 10%", "95% precision", "Match score 94%", radar, leaderboard, streak...). Ghi lại khối đã bỏ + lý do vào `spec/INDEX.md` hoặc file plan.
- Màn `STATIC`: được phép giữ số liệu demo **nguyên văn từ mockup**, tên file/route phải tự nói lên đó là màn mockup, và **không được viết số liệu mới ngoài những gì mockup đã kê**. Nguyên tắc cũ "không nối sidebar" đã bỏ (2026-10-21): mockup nào có item trên sidebar thì dựng xong phải gắn nav, nếu không anh em mở app sẽ thấy "giao diện không đổi" và không soi được màn mới. Vai trò gắn nav phải khớp guard route để không dẫn tới 403.
- Không gọi thêm API mới để "làm cho đầy". Không optimistic write giả.

## 4. Layout dùng chung

- Mọi route đăng nhập nằm trong `AppLayout` (sidebar `w-72` + header `h-16`, `main` `px-4 pt-16 lg:px-6`). Trang **không** tự vẽ lại sidebar/header, kể cả khi mockup có `<aside>`.
- Route `/admin/*` nằm trong **`AdminLayout`** (shell riêng, dựng lại theo mockup admin 2026-10-21): từ 21/10 shell responsive — aside `w-72` chỉ render từ `lg` (`hidden lg:flex`), dưới `lg` là drawer phủ màn có overlay + nút hamburger ở header; header `fixed left-0 lg:left-72`, nội dung `lg:pl-72`, drawer tự đóng khi đổi route. Hệ quả: thanh action sticky của màn admin phải là `fixed bottom-0 left-0 right-0 lg:left-72`. Thân màn admin vẫn **không** tự vẽ `<aside>`. `AppLayout` dùng đúng cơ chế drawer/hamburger này.
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
