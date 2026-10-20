# Luật giao diện (design system "Precision Intelligence")

Áp dụng cho mọi file trong `frontend/src/views/`. Nguồn sự thật duy nhất của token: `frontend/tailwind.config.js` (trích từ `precision_intelligence/DESIGN.md`).

## 1. Màu và chữ — chỉ dùng token

| Nhu cầu | Token |
|---|---|
| Màu chính, nút chính, link | `primary` `#3525cd`, hover `primary-hover`; nền đậm chữ trắng: `primary-container` + `on-primary` |
| Màu phụ (accent trạng thái, icon) | `secondary` `#4648d4` |
| Nền trang / card / divider nổi | `surface` `#faf8ff` / `card` / `surface-low` `#f2f3ff` / `surface-mid` `#eaedff` / `surface-high` `#e2e7ff` |
| Chữ | `ink` `#131b2e`, `ink-variant` `#464555`, `outline-strong` `#777587` (nhãn nhỏ uppercase), `outline` `#c7c4d8` (divider cũ, đừng làm tối hơn) |
| Trạng thái | `success` / `danger` / `info` — mỗi nhóm có `DEFAULT`, `-bg`, `-text`; `error` `#ba1a1a` là màu dot |
| Chữ số lớn | `text-metric-stat`; heading `text-headline-lg|md|sm`; body `text-body-lg|md|sm`; nhãn nhỏ `text-label-md|sm`; code/date `font-mono` |

- Viềnhairline thống nhất `border-[#e2e8f0]`; radius: `rounded-md` cho control, `rounded-lg` cho card nhỏ, `rounded-xl` cho panel dashboard, `rounded-full` **chỉ** cho badge trạng thái/dot.
- Icon: `<span className="material-symbols-outlined">tên_icon</span>` (Material Symbols Outlined, đã load toàn app). Không dùng svg tự chế cho icon.
- Màu mockup chưa có token: được viết `bg-[#hex]` nhưng phải kèm comment ngắn chỉ tên vai trò màu trong mockup (ví dụ `// secondary-fixed-dim`). Ưu tiên map về token có sẵn (`primary-fixed` -> `info`) hơn là thêm hex mới. **Không** tự ý thêm token vào `tailwind.config.js` khi chỉ một trang cần.

## 2. Ngôn ngữ

- Chrome (đầu trang, nhãn field, nút, menu, empty state) = **tiếng Anh đúng theo mockup**.
- Dữ liệu động giữ **nguyên văn từ API**: tên công việc, tên người, nhãn trạng thái trong `*_LABELS` của model (`APPLICATION_STATUS_LABELS`...). Không dịch tay trong từng trang; thiếu nhãn thì sửa map trong `models/*.model.ts`.
- Nhãn trạng thái render qua `<StatusBadge status={x} label={LABELS[x]} />`. Tone màu chỉ khai ở `STATUS_TONE` trong `views/components/ui.tsx`, không khai lại trong trang.

## 3. Số liệu — chỉ đồ thật

- Màn `DATA`/`UI`: thành phần nào không có endpoint hoặc không có column thì **bỏ hẳn**, không ô trống kiểu `—`, không tự chế con số (percentile, "Top 10%", "95% precision", "Match score 94%", radar, leaderboard, streak...). Ghi lại khối đã bỏ + lý do vào `spec/INDEX.md` hoặc file plan.
- Màn `STATIC`: được phép giữ số liệu demo **nguyên văn từ mockup**, nhưng không nối vào sidebar, và tên file/route phải tự nói lên đó là màn mockup.
- Không gọi thêm API mới để "làm cho đầy". Không optimistic write giả.

## 4. Layout dùng chung

- Mọi route đăng nhập nằm trong `AppLayout` (sidebar `w-72` + header `h-16`, `main` `px-4 pt-16 lg:px-6`). Trang **không** tự vẽ lại sidebar/header, kể cả khi mockup có `<aside>`.
- Sidebar lọc theo role: candidate / employer / admin. Thêm route mới thì quyết định có hiện trong sidebar hay không; route màn tĩnh thì không gắn sidebar.
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
- Script probe/test dùng một lần: tạo rồi xoá trong phiên, không commit.

## 6. Trước khi báo xong

`cd frontend && npx tsc --noEmit` + `grep -rn "style={{" src/views/pages/<file>` + đối chiếu `screen.png` + các bước trong `spec/verification.md`.
