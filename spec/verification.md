# Cách verify trước khi báo "xong"

## 1. Type

```
cd frontend && npx tsc --noEmit
```

## 2. Chạy bằng code production thật (không phải dev server)

App Huy chạy qua `docker compose` ở gốc repo; `:3000` là **nginx serve bản build trong image**, sửa code trên host không tự hiện ra:

```
docker compose build frontend && docker compose up -d frontend
docker compose ps
```

Backend: `:8080`, API auth ở `/api/v1/auth/*`. DB: container `mysqljava` ở host `:3307`, schema do Hibernate `ddl-auto: update` (Flyway đang `enabled: false`). DB bật nhưng backend lỗi DB -> `docker start mysqljava` rồi `docker compose up -d --force-recreate backend` (env chỉ đọc lúc tạo container).

## 3. Bẫy cache trình duyệt

nginx + browser giữ bundle cũ (`/static/js/main.<hash>.js`). Dấu hiệu: DOM trả về nhãn của bản code cũ dù image mới. Cách xử lý: mở URL có query-buster, ví dụ `http://localhost:3000/jobs?v=20261017a`, và đối chiếu hash bundle trong `<script src>` với file trong container:

```
curl -s http://localhost:3000/jobs | grep -o "main\.[a-z0-9]*\.js"
docker exec ai_interview_frontend ls /usr/share/nginx/html/static/js
```

## 4. Soát DOM bằng browser-use

- Phiên browser-use là phiên **đã đăng nhập OAuth của anh Huy**; đừng thoát đăng xuất.
- `take_screenshot` fail `NATIVE_BROWSER_UNAVAILABLE`/viewport ẩn -> chỉ verify bằng `take_snapshot` + `evaluate_script` đọc `getComputedStyle`, số node, tiêu đề. nghĩa là **không thể** kết luận "đẹp hay vỡ layout desktop"; phần đó anh mắt thường xem ở >=1024px.
- Đọc `localStorage`/token bị classifier chặn -> verify qua DOM, không lấy token.
- Muốn sang route khác trong cùng trang: `history.pushState({},'',p); dispatchEvent(new PopStateEvent('popstate',{state:{}}))` rồi đọc `main` — react-router v6 nghe popstate, khỏi reload mất session.
- Overlay SPA (modal) có thể không mở được bằng click trong phiên shared -> nhờ anh mở tay bước đó. **Ngoại lệ đã đo 2026-10-17**: `evaluate_script` gọi `.click()` trực tiếp trên node (không qua MCP click) mở được modal thật, ví dụ `UserDetailModal` bằng `document.querySelector('tbody tr').cells[0].click()`.
- Mẹo set giá trị input React từ `evaluate_script`: dùng `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set` rồi dispatch `Event('input',{bubbles:true})`. Hai cái bẫy đã gặp: (1) ô search trên header cũng nằm trong `<form>` -> `document.querySelector('form')` là form sai, phải lấy `querySelectorAll('form')[1]`; (2) selector `[type=text]` KHÔNG khớp input không ghi thuộc tính `type`, và gán `HH:mm` vào `input[type=date]` bị im lặng bỏ qua (kết quả là submit thiếu data chứ không báo lỗi).
- Kiểm tra dữ liệu ghi thật: sau khi tạo slot thì `select id, start_time, end_time, note from interview_slots` (bảng không có cột `booked`, trạng thái là `cancelled` bit + `booked_by`). Xoá row test khi xong.

## 5. Soát màn theo role

Tài khoản OAuth local (id 8, `levanhuy06042003@gmail.com`) là `ROLE_USER`, nên `/my-jobs`, `/admin/*`, `/candidates/:id/evaluation` trả /unauthorized. Cách xem:

1. `docker exec mysqljava sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "update ai_interview_db.users set role=\"ROLE_ADMIN\" where id=8;"'`
2. Vào `/login` bấm nút GitHub để lấy token + snapshot user mới (user lưu trong sessionStorage nên reload không đổi role).
3. Soát các route employer/admin.
4. **Đổi lại** `ROLE_USER` và đăng nhập OAuth lại một lần. Ghi rõ đã đổi/đã trả lại trong báo cáo.

## 6. Màn render được nhưng chưa mở được bằng URL

Dùng smoke test jsdom một lần rồi xoá file:

```
# frontend/src/smoke-new-pages.test.tsx  (render từng trang trong <MemoryRouter>)
cd frontend && CI=true npx react-scripts test --watchAll=false --testPathPattern=smoke-new-pages
rm src/smoke-new-pages.test.tsx
```

Bắt được crash runtime (SVG attribute, map undefined) mà không cần đăng nhập bằng role khác. Cảnh báo chấp nhận được: `ReactDOMTestUtils.act deprecated`, `React Router Future Flag`. Không chấp nhận: `validateDOMNesting`.

## 7. Kiểm tra số liệu thật

```
docker exec mysqljava sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N --default-character-set=utf8mb4 -e "select table_name, table_rows from information_schema.tables where table_schema=\"ai_interview_db\" order by table_name;"'
```

Bảng rỗng -> màn `DATA` chỉ verify được empty state, phải nói rõ là chưa verify được trạng thái có dòng (đừng suy ra "UI đúng" từ trang trống).

## 8. Backend

Test local bắt buộc `mvn clean test` (cache cũ làm fail âm). Commit/push chỉ sau khi `docker compose build` + chạy thật; kiểm tra `git rev-parse --abbrev-ref HEAD` vì anh đổi branch giữa phiên. Không commit: `spec/` khi chưa chốt, script tạm, file probe, secret (`staging.env.local`, OAuth secret).

## 9. Bẫy cache Docker (đo 2026-10-20)

Sửa `.tsx` xong `docker compose build frontend` có thể báo `COPY . .  CACHED` -> image vẫn là bundle cũ, bằng chứng là hash bundle không đổi (`main.<hash>.js` giữ nguyên sau `up -d`). Lần này phải `docker compose build --no-cache frontend` (~20 phút, chạy nền) mới thực sự vào image. **Luôn đối chiếu hash bundle serve từ `:3000` với lần build trước**: hash không đổi = code chưa được build, đừng kết luận "fix không ăn".

## 10. Bẫy `ctrl` trong deps của useEffect (đo 2026-10-20)

Mọi controller (`useAdminUserController`, `useAuthController`, ...) trả object mới sau mỗi render. Viết `useEffect(..., [validId, userId, ctrl])` thành vòng lặp fetch -> setState -> render -> fetch. Ở `AdminUserDetailPage` vòng này sinh **10.521 dòng `VIEW_USER` trong `admin_audit_log` chỉ vì mở trang 1 lần trong ~8 phút** (BE ghi audit cho mỗi `GET /admin/users/{id}`), nên bug không lộ ra bằng mắt thường — nó lộ bằng số dòng audit. Cách chống: deps chỉ để giá trị nguyên thủy (`validId`, `userId`), gọi controller qua `useRef` (`ctrlRef.current`); cách đo nhanh = test jsdom đếm số lần `getUserDetail` được gọi (kỳ vọng 1, không quá 2 kể cả rerender 20 lần).

## 11. Bẫy comment nhét trong chuỗi `className` (đo 2026-10-20)

Rule "hex phải kèm comment chỉ vai trò màu mockup" dễ bị hiểu sai thành viết comment **bên trong** chuỗi class: `className="... text-[#004598] /* tertiary mockup */"`. Tailwind vẫn sinh utility (nó tách theo khoảng trắng) nên nhìn qua CSS không thấy gì sai, nhưng `/*`, `mockup`, `*/` rơi xuống DOM thành class rác. Wave admin có **46 chỗ** như vậy ở 8 trang (`AdminAccountSettingsPage`, `AdminDashboardPage`, `AdminSystemSettingsPage`, `AdminRolePermissionPage`, `AdminUserManagementPage`, `AdminUserDetailPage`, `JobApprovalPage`, `JobReviewDetailPage`); đã chuyển hết sang bảng kê vai trò màu ở comment đầu file.
Cách quét: duyệt từng dòng, với mỗi `/* ... */` một dòng, đếm số dấu nháy `'`/`"`/`` ` `` đứng trước — lẻ nghĩa là comment nằm trong chuỗi. Sau khi sửa phải quét lại toàn `src` (kết quả 0), chạy `tsc --noEmit`, rồi đối chiếu bundle: `main.31141b95.js` -> `main.0abfeaaf.js`, `grep -F 'mockup */' ` trong JS serve ra = 0, các utility hex (`10b981`, `004598`, `e2e8f0`, ...) vẫn còn trong `main.7e87c453.css`.
