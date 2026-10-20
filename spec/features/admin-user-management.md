# Quản lý user trong Admin (User Directory)

Trạng thái: **wave 1 + wave 2 `code xong + đo runtime xong`** (2026-10-19). Hai thứ còn mở:
(i) các action gửi email (lock/unlock/delete/reset/invite/resend) chưa bấm được đường thành công vì
container backend thiếu env Gmail API — xem mục 8; (ii) bulk action + pill health (mục 6.5, 6.8).
Phạm vi đã chốt ngày 2026-10-19 (anh Huy): **giữ toàn bộ mockup, không bỏ khối nào**;
khối nào chưa có endpoint thì ghi thành việc backend ở mục 6 và FE làm ở wave 2.
Người/phiên tạo: 2026-10-19, branch `feature/manage-user-admin`
Mockup nguồn: `admin_workspace_user_directory_job_approvals` — state "User Directory" (kèm section audit log cuối trang)

Toàn bộ API ở mục 3 **đã kiểm chứng bằng cách đọc source BE ngày 2026-10-19**
(`AdminUserController.java`, `AdminUserServiceImpl.java`, `JpaUserRepository.java`, các DTO/enums).
Chưa đo runtime bằng curl — các bước đo nằm ở mục 8, bắt buộc chạy khi implementation.

## 1. Mục tiêu

Admin tra cứu và xử lý mọi tài khoản trên hệ thống: tìm theo email/tên, lọc theo role và trạng thái,
khóa/mở khóa, bật/tắt, đổi role, gửi email đặt lại mật khẩu, xóa mềm và khôi phục tài khoản đã xóa;
đọc audit log của mọi hành động với danh tính thật của tài khoản bị tác động.
Theo mockup, admin còn xem được KPI sức khỏe hệ thống, mời thêm thành viên, và xuất danh sách.

## 2. Phạm vi / Không làm

FE chia 2 wave. **Wave 1 = API đã có, làm ngay trong branch này:**

1. `useAdminUserController` chuyển sang `readApiErrorMessage` của `src/utils/apiError.ts`
   (hiện vẫn đọc `e.response?.data?.message` thô — `spec/features/auth-flows.md` mục 2 đã ghi rõ nợ lại).
2. Bổ sung `admin.service.ts` + `models/User.model.ts`:
   `getDeletedUsers`, `setUserStatus` (PATCH `/users/{id}/status`), `restoreUser` (POST `/users/{id}/restore`),
   tham số lọc cho `getAuditLogs`; `UserSummary` thiếu `deletedAt`; `UserDetail` thiếu `phone`,
   `lockedAt`, `blockedUntil`, `failedLoginAttempts`; `AuditLog` thiếu `targetEmail`, `targetFullName`,
   `succeeded`, `reason`.
3. View "Deleted accounts" (tab mới) từ `GET /users/deleted` + nút Restore.
   **Không** nhét DELETED vào select trạng thái của list chính — BE chặn bằng 400
   ("Bộ lọc DELETED không dùng cho danh sách này", `AdminUserServiceImpl.getUsers`).
4. Audit log tab: hiện `targetFullName — targetEmail` thay vì `targetUserId` thô (fallback `#<id>` khi
   tài khoản không còn); badge cho attempt thất bại (`succeeded=false` + nguyên văn `reason`);
   thêm bộ lọc Action + khoảng ngày (`from/to`) — BE đã hỗ trợ sẵn tham số.
5. `UserDetailModal`: bật/tắt tài khoản (PATCH `/status`), hiển thị khối brute-force
   (`blockedUntil`, `failedLoginAttempts` khi đang bị chặn tạm), nút "View history" mở tab audit lọc
   theo `targetUserId`.
6. `STATUS_TONE` trong `views/components/ui.tsx` khai `LOCKED`, `DELETED` (hiện rơi về neutral).
7. KPI card **Total Users** và **Suspended/Locked**: ban đầu đếm từ `totalElements` của
   `GET /users?size=1` và `GET /users?size=1&status=LOCKED`; đã thay bằng `GET /users/stats` khi BE ship
   (wave 2) — một request, không lệch số giữa hai query.
8. **Export CSV**: ban đầu client-side, lặp `GET /users?size=100` theo trang rồi gộp; đã thay bằng
   `GET /users/export` server-side (wave 2).
9. Avatar: hiển thị **initials tính từ `fullName`** (đây là suy xuất từ số liệu thật, không phải bịa);
   dot trạng thái lấy từ `status` (không phải online-realtime).

**Wave 2 = endpoint mục 6 — BE đã ship trên `feature/mange-user`, FE đã nối cùng ngày (2026-10-19):**

- 4 KPI cards (Total / Active 30 ngày + % / Pending Invitations / Suspended-Locked) từ `GET /users/stats`.
- Tab "Pending Invites" = `GET /users?status=PENDING`; badge "Pending invite" trên row; Resend/Revoke.
- Nút "Invite Members" → modal gọi `POST /users`; "Edit profile" → modal gọi `PATCH /users/{id}`
  (hi thị nguyên văn message BE khi đổi email = tài khoản quay lại chờ mời).
- Tab "Role Permissions": ma trận STATIC dựng từ `@PreAuthorize` thật trong controller BE (6.4a).
- Cột "Last Active" từ `lastLoginAt` (null → "Never").
- Export CSV chuyển sang endpoint server-side `GET /users/export` (bỏ loop client-side của wave 1).
- Bulk action theo checkbox: **chưa làm** — mockup chưa chốt hành động bulk, BE chưa có endpoint (6.5).

**Wave 5 = sửa lỗi đo trên production build (2026-10-20):**

- Chuyển tab **Pending Invites → All Members** phải `GET /users` lại **không kèm `status`** và reset
  select Status về "All Statuses". Trước đó `switchTab` chỉ xử lý nhánh `pending`, nên tab All Members
  giữ nguyên 7 dòng pending (đo jsdom: không có request nào gửi đi).
- Phân trang: **giữ nguyên pager cũ** (số trang + mũi tên, luôn hiển thị). Chỉ đổi `size` 20 → **10**
  cho đúng mockup "Showing 1-10 of ...". Đã đo để chốt không có lỗi: BE `page=1&size=2` trả
  `number=1, totalPages=2, ids=[1]`; FE bấm trang 2/3 gửi đúng `page` và footer đổi "Showing 11-20 of 25".
  Lý do không sang được trang trên máy local: DB dev chỉ **3 tài khoản** → `totalPages=1`.

Không làm (ngoài màn này): section "Job Approval Moderation Queue" cuối mockup là màn riêng
`/admin/job-approvals`, đã có dòng trong `spec/INDEX.md` (vẫn STATIC).

## 3. API thật dùng được (đã verify bằng source BE 2026-10-19; đo runtime ở mục 8)

Controller: `/api/v1/admin/*`, `@PreAuthorize("hasRole('ADMIN')")` — FE route `/admin/users` guard
`ROLE_ADMIN` (`App.tsx:108-110`), khớp nhau.

| Endpoint | Method | Response / hành vi liên quan | Ghi chú đã đọc trong code |
|---|---|---|---|
| `/users?page&size&search&status&role` | GET | `Page<UserSummaryResponse>`: `id,email,fullName,role,status,pendingVerification,lastLoginAt,createdAt,deletedAt` | sort `createdAt DESC`; `status` nhận `ACTIVE/INACTIVE/LOCKED/PENDING` (DELETED → 400, dùng endpoint deleted); `search` khớp email **hoặc** fullName, không phân biệt hoa thường, LIKE-escaped, >100 ký tự → 400; `size` ≤ 100 |
| `/users/deleted?page&size&search&role` | GET | như trên, chỉ tài khoản `deletedAt != null` | FE đã nối (tab Deleted) |
| `/users/stats?search&role` | GET | `{total,active,pendingVerification,locked,disabled,deleted,activeLast30Days}` | đếm cùng bộ lọc với danh sách; `activeLast30Days` = "đăng nhập thành công trong 30 ngày" từ `login_attempts` |
| `/users/export?search&status&role` | GET | `text/csv` + `Content-Disposition: attachment` | 9 cột; cap 10.000 dòng (vượt → 400 "hãy thu hẹp bộ lọc"); ghi audit `EXPORT_USERS` với `targetUserId=null`; cell bắt đầu `= + - @` được chặn prefix `'` chống CSV injection |
| `/users` | POST | `UserDetailResponse` body invite `{fullName,email,role,phone?}` | tạo tài khoản enabled=false + verification token (link 24h), mật khẩu random không ai biết; email tồn tại → 409 (nếu thuộc account đã xóa, message chỉ ra id + đường restore); mail fail → 502 rollback, **không** lưu user rác |
| `/users/{id}/invitation/resend` | POST | `UserDetailResponse` | 400 `"Tài khoản đã xác thực email"` khi enabled; rotate token + gửi mail; mail fail → 502 rollback token cũ |
| `/users/{id}/invitation` | DELETE | `UserDetailResponse` | thu hồi link (xóa token), giữ nguyên role/enabled/locked; 400 `"Tài khoản không có lời mời đang chờ xác thực"` |
| `/users/{id}` | PATCH | `{user, emailChanged}` body `{fullName?,email?,phone?}` | body rỗng → 400 `"Không có thông tin nào để cập nhật"`; fullName chuỗi trống → 400; đổi email chính mình → 400; email mới trùng → 409; đổi email ⇒ enabled=false + token mới + `tokenVersion++` (mục 9.7) |
| `/users/{id}` | GET | `UserDetailResponse`: thêm `phone,enabled,locked,lockedAt,pendingVerification,blockedUntil,failedLoginAttempts,updatedAt,deletedAt` | mỗi lần mở detail ghi 1 audit `VIEW_USER`; `blockedUntil` chỉ khác null khi đang bị chặn do nhập sai mật khẩu |
| `/users/{id}/lock` | PATCH | `UserDetailResponse` | 400 nếu đã khóa / khóa chính mình; tăng `tokenVersion` (hủy hiệu lực refresh token); gửi email thông báo; **rule bị từ chối cũng ghi audit** (`succeeded=false`) |
| `/users/{id}/unlock` | PATCH | `UserDetailResponse` | 400 nếu không ở trạng thái khóa |
| `/users/{id}/status` body `{enabled}` | PATCH | `UserDetailResponse` | 400: đổi trạng thái chính mình; **bật tài khoản chưa xác thực email** (message chỉ rõ phải bấm link verify trước); tắt → tăng `tokenVersion`. FE **chưa nối** |
| `/users/{id}` | DELETE | — | xóa mềm (`deletedAt`); 400 nếu xóa chính mình / xóa ADMIN đang sống cuối cùng; gửi email |
| `/users/{id}/restore` | POST | `UserDetailResponse` | chỉ xóa `deletedAt`; role/enabled/locked giữ nguyên giá trị trước khi xóa. FE **chưa nối** |
| `/users/{id}/reset-password` | POST | — | token sống 30 phút; gửi mail thất bại → 502 và **rollback token** (link cũ không bị âm thầm thay) |
| `/users/{id}/role` body `{role}` | PATCH | `UserDetailResponse` | 400: đổi role chính mình; hạ ROLE_ADMIN cuối cùng; đổi role → tăng `tokenVersion` |
| `/audit-logs?page&size&adminId&targetUserId&action&from&to` | GET | `Page<AuditLogResponse>`: `adminId,adminEmail,targetUserId,targetEmail,targetFullName,action,detail,succeeded,reason,createdAt` | sort `createdAt DESC`; `from/to` nhận `yyyy-MM-dd` hoặc `yyyy-MM-ddTHH:mm:ss`, date-only `to` = hết ngày; `from > to` → 400; `targetEmail/targetFullName` null khi tài khoản không còn. FE **chưa nối tham số lọc** |

`AuditAction` (enum kín, 14 giá trị): `VIEW_USER, LOCK_USER, UNLOCK_USER, ENABLE_USER, DISABLE_USER,
DELETE_USER, RESTORE_USER, RESET_PASSWORD, CHANGE_ROLE, INVITE_USER, RESEND_INVITATION,
REVOKE_INVITATION, UPDATE_PROFILE, EXPORT_USERS`.
`Role` (BE): `ROLE_USER, ROLE_STAFF, ROLE_ADMIN, ROLE_INTERVIEWER` — **không có** role "Employer"
như mockup; ánh xạ hiện tại `ROLE_LABELS`: ROLE_USER→Candidate, ROLE_INTERVIEWER→Interviewer,
ROLE_STAFF→Staff, ROLE_ADMIN→Administrator. Việc đưa "Employer" vào hệ thống là câu hỏi mở 9.3.

## 4. Ánh xạ số liệu -> UI

| Thành phần mockup | Nguồn | Wave | Xử lý khi trống |
|---|---|---|---|
| Cột "User / Member" (tên + email) | `UserSummary.fullName` + `email` | 1 | — |
| Avatar initials + dot | initials tính từ `fullName`; dot = `status` | 1 | fullName trống → ẩn avatar |
| "Assigned Role" badge | `role` qua `ROLE_LABELS` | 1 | role lạ → hiển thị nguyên văn |
| "Status" badge | `status` ∈ ACTIVE/INACTIVE/LOCKED/DELETED → `StatusBadge` | 1 | khai tone LOCKED/DELETED (mục 2.6) |
| "Joined Date" | `createdAt` (vi-VN, đang làm đúng) | 1 | — |
| Nút Lock / Unlock | `status === 'LOCKED' ? Unlock : Lock` | 1 | row DELETED: chỉ hiện Restore (tab Deleted) |
| "Reactivate" (row suspended) | `unlockUser` | 1 | — |
| Modal xác nhận lock/unlock | `ConfirmDialog`, message lỗi = BE nguyên văn (bỏ mã giả `USR-####`/`SIG:`) | 1 | — |
| Audit "Target user" | `targetFullName — targetEmail`; null → `#<targetUserId>` | 1 | — |
| Audit attempt thất bại | `succeeded=false` + `reason` | 1 | badge danger |
| Pagination footer "Showing x-y of N" | `totalElements`, `number`, `size` | 1 | — |
| KPI "Total Users" | `GET /users?size=1` → `totalElements` | 1 | loading → card hiện `—` transient |
| KPI "Suspended / Locked" | `GET /users?size=1&status=LOCKED` → `totalElements` | 1 | như trên |
| Export CSV | lặp `GET /users?size=100` theo tập lọc hiện tại | 1 | 0 dòng → toast "Nothing to export" |
| KPI "Active Members (30d)" + % | 6.1 counts + 6.2 last_active | 2 | ẩn card khi BE chưa có |
| KPI "Pending Invitations" | 6.1 (`pendingInvites`) | 2 | ẩn card khi BE chưa có |
| Tab "Pending Invites" + Resend/Revoke | 6.3 | 2 | tab chỉ hiện khi API mời tồn tại |
| Nút "Invite Members" / "Add User" | 6.3 | 2 | — |
| Tab "Role Permissions" | 6.4 | 2 | — |
| Cột "Last Active" (10 mins ago / Never) | 6.2 `lastActiveAt` | 2 | null → "Never" (đúng semantic mockup, nhờ field thật) |
| Checkbox + bulk | 6.5 | 2 | — |
| Online dot realtime | không có realtime layer; dot chỉ phản ánh `status` | 1 | — |

**Wave 3 (2026-10-19) — dựng lại layout đúng mockup Stitch `admin_workspace_user_directory_job_approvals`.**
Logic/state/controller giữ nguyên, chỉ đổi render. Các khối của mockup đã áp dụng:

| Khối mockup | FE render | Nguồn số liệu |
|---|---|---|
| Breadcrumb "Administration / User Directory" + hàng Export CSV / Invite Members | `AdminUserManagementPage` header | — |
| H1 display "User Management & Access Control" + subtitle | `text-display-mobile sm:text-display` | — |
| 4 KPI card (label uppercase + icon tint / metric mono / caption) | `KpiRow` + `KpiCard` | `GET /users/stats` |
| Chip dưới metric KPI | chỉ render khi tính được từ số thật | Active = `{pct}% active` |
| Tab strip có icon + count pill | `users/pending/permissions/deleted/auditLogs` | `stats`, `totalElements` |
| Filter ribbon: search `w-96 bg-surface-low shadow-inner` + label `Role:`/`Status:` + select | `searchInputClass`, `filterSelectClass` | — |
| Bảng: checkbox col, avatar initials + status dot ring, role pill, status pill có dot, joined date mono, Last Active | `MemberRow` | `UserSummary` |
| Hành động dòng: Edit + Lock/Reactivate + kebab `more_vert` | `rowBtnClass` + `RowMenu` (fixed, không bị `overflow-hidden` của card cắt) | — |
| Footer "Showing x-y of N registered members • Download CSV Export" + pager có `…` | `TableFooter` + `Pager` | `Page` của API |
| "Recent Security & Access Log" dạng icon tile | `AuditLogTab` + `AUDIT_TILE(action, succeeded)` | `GET /audit-logs` |

Kiểu só: `Badge` thêm `pill`/`dot` (rounded-full + chấm `bg-current`), `STATUS_TONE.LOCKED` đổi
`warning` → `danger` cho khớp pill "Suspended" màu rose, thêm `ACCOUNT_STATUS_LABELS` trong
`User.model.ts` (chrome tiếng Anh). Row pending invite render tone `warning` (không phải rose):
`statusTone('INACTIVE')` là `danger`, nên màu rose chỉ dành cho account `status === 'LOCKED'`.

## 5. Khối mockup cần backend mới (không bỏ — chuyển thành việc mục 6)

- **4 KPI cards** — Total + Locked đếm được bằng API hiện có (2.7); Active-in-30-days và Pending
  Invitations thiếu hoàn toàn: `User` không có `last_active` (DTO chỉ có
  `createdAt/updatedAt/deletedAt/lockedAt`), không có khái niệm invitation → 6.1, 6.2, 6.3.
- **Cột "Last Active" + "Never"** — thiếu column → 6.2.
- **"Invite Members" / "Add User" / "Resend" / "Revoke" / tab "Pending Invites"** — BE không có endpoint
  tạo mời/thu hồi invite → 6.3.
- **Tab "Role Permissions"** — không có endpoint ma trận quyền → 6.4.
- **"Export CSV" / "Download CSV Export"** — không có endpoint export; FE xử được bằng client-side
  (2.8), endpoint server-side chỉ cần nếu anh muốn export không giới hạn → 6.6.
- **Checkbox chọn nhiều dòng** — không có bulk endpoint → 6.5.
- **Avatar ảnh thật + online dot realtime** — không có field avatar/last-seen; wave 1 dùng initials +
  dot trạng thái; ảnh avatar cần endpoint upload riêng, chưa nằm trong các việc 6.1–6.6 (ghi để đó).
- **"Employer / Recruiter" role** — enum `Role` BE không có giá trị tương ứng → câu hỏi mở 9.3.
- **"All services operational" pill** — health-check endpoint không thuộc màn admin user; nếu giữ thì
  map vào `GET /actuator/health` (BE Spring Boot mặc định có actuator — **chưa verify**, phải đo trước
  khi nối). Tạm render từ status API health thật, không hard-code "operational".

**Wave 3 — khối mockup chủ động bỏ (không bịa số liệu, không phải chỗ trống trang trí):**

- Chip delta "+12% so với tháng trước" dưới KPI — `GET /users/stats` không có time-series → bỏ hẳn.
- Pill "All services operational" ở tab strip — 6.8 chưa nối → tab strip không có pill.
- Role "Employer" — enum `Role` BE không có giá trị đó (9.3) → `ROLE_PILL` chỉ map các role thật.
- Ảnh avatar — không có endpoint upload avatar → giữ initials + dot `status` (đã ghi ở mục trên).
- **Nút Search trong ribbon lọc All Members/Pending — gỡ (20/10)**: ribbon chỉ còn ô search (Enter để áp)
  + 2 select Role/Status áp ngay khi đổi. Nút Search của tab Deleted giữ nguyên vì tab đó không có select.
- Context chip `{Workspace · Page}` ở header app (wave 4) — **gỡ 20/10**, xem `conventions/frontend-ui.md` mục 4.

## 6. Việc backend cần làm (repo BE — contract FE mong muốn)

**Trạng thái 2026-10-19 (branch BE `feature/mange-user`, đo runtime `:8081`): 1, 2, 3, 4, 6, 7 đã xong**;
FE đã nối ở wave 2. Còn mở: 5 (bulk) và 8 (actuator). Tên endpoint thật BE chọn:

- 1 → `GET /api/v1/admin/users/stats` trả `{total, active, pendingVerification, locked, disabled, deleted, activeLast30Days}`
  (cùng bộ lọc `search`/`role` với danh sách, nên badge không thể lệch table).
- 2 → BE **không** thêm column `last_active_at`; `lastLoginAt` trong `UserSummaryResponse` suy từ bảng
  `login_attempts` (lần đăng nhập thành công gần nhất, null = chưa từng vào) — đủ cho cột "Last Active"
  và KPI active-30-days. `UserDetailResponse` không có `lastLoginAt` (chỉ list).
- 3 → `POST /api/v1/admin/users` (invite, không có field mật khẩu — người được mời tự đặt qua link),
  `POST /api/v1/admin/users/{id}/invitation/resend`, `DELETE /api/v1/admin/users/{id}/invitation`
  (thu hồi chỉ giết link, giữ tài khoản), `PATCH /api/v1/admin/users/{id}` sửa fullName/email/phone
  (response có cờ `emailChanged`: đổi email = tài khoản quay lại chờ mời + thu hồi phiên cũ).
  Audit mở rộng: `INVITE_USER, RESEND_INVITATION, REVOKE_INVITATION, UPDATE_PROFILE, EXPORT_USERS`.
- 4 → BE không có endpoint ma trận quyền; FE dựng tab STATIC từ `@PreAuthorize` thật (mục 6.4a).
- 6 → `GET /api/v1/admin/users/export?search=&status=&role=` trả CSV server-side, cap 10.000 dòng
  (vượt → 400 "hãy thu hẹp bộ lọc"), ghi audit `EXPORT_USERS`, `fullName` được escape chống CSV injection.
- 7 → `pendingVerification` (boolean) có trong `UserSummaryResponse` + `UserDetailResponse`;
  `UserStatusFilter` thêm giá trị `PENDING` cho `GET /users?status=` (vẫn chặn `DELETED` ở list này).

Chi tiết contract FE từng đề xuất (giữ lại để đối chiếu tên gọi):

1. **`GET /api/v1/admin/users/counts`** → `{total, active, inactive, locked, deleted, pendingVerification, activeLast30Days}`.
  FE dùng cho 4 KPI cards một request thay vì 5+ query đếm.
2. **`users.last_active_at`** (column + cập nhật ở login/refresh token) và thêm `lastActiveAt` vào
   `UserSummaryResponse`/`UserDetailResponse`. FE render cột "Last Active" + KPI active-30-days.
   Rule phải chắc: giá trị do server ghi lúc xác thực token, không tin client gửi lên.
3. **Invitation / tạo user từ admin**:
   - `POST /api/v1/admin/users` body `{fullName, email, role}` → tạo tài khoản INACTIVE-chưa-verify,
     gửi email verify (tái dụng luồng register hiện có); 409 khi email tồn tại.
   - `POST /api/v1/admin/users/{id}/resend-verification` (bản admin của `/auth/resend-verification`).
   - `POST /api/v1/admin/users/{id}/revoke-invitation` → xóa mềm tài khoản chưa verify.
   - Đếm `pendingInvites` = `emailVerified=false AND deletedAt IS NULL` (cần 6.7 bên dưới: field
     `emailVerified`).
   - Mọi action ghi audit `ADMIN_CREATE_USER`, `RESEND_VERIFICATION`, `REVOKE_INVITATION` (mở rộng enum).
4. **Role Permissions**: chọn 1 trong 2 — (a) không có endpoint, FE dựng tab **STATIC** mô tả 4 role
   theo đúng guard thật đã đọc trong code (Employer Workspace screens, Admin-only routes...), ghi rõ
   "derived from current access rules"; (b) `GET /api/v1/admin/role-permissions` trả ma trận
   `role -> [screen keys]` do BE khai. **Đề xuất (a)** vì nguồn sự thật hiện nằm trong annotation
   `@PreAuthorize` rải rác, làm (b) là thêm chỗ phải đồng bộ.
5. **Bulk**: `POST /api/v1/admin/users/bulk` body `{ids: [...], action: "LOCK"|"UNLOCK"|"DELETE"}`
   → `{succeeded: n, failed: [{id, reason}]}`; mỗi item vẫn ghi audit riêng. FE fallback loop từng
   request hiện có cũng chấp nhận được (request ít, ids chọn tay) — chốt ở 9.4.
6. **`GET /api/v1/admin/users/export?search=&status=&role=`** (CSV server-side, giới hạn ví dụ 50k dòng)
   — chỉ cần nếu anh muốn export toàn hệ thống không qua lặp trang; nếu không, 2.8 đủ.
7. **`emailVerified` (boolean)** thêm vào `UserSummaryResponse`/`UserDetailResponse` — BE đã biết qua
   `hasPendingEmailVerification` nhưng không export; có nó mới phân biệt INACTIVE-chưa-verify với
   INACTIVE-admin-tắt, và tab "Pending Invites" mới đúng nghĩa.
8. **Actuator health**: xác nhận `GET /actuator/health` có bật và có thể cho FE admin gọi (hoặc thêm
   `GET /api/v1/admin/system-status` trả `{services: [...]}`) cho pill "All services operational".

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | Lọc status=LOCKED | chỉ dòng locked; không dòng nào status DELETED trong list này |
| 2 | Lock tài khoản của chính admin đang đăng nhập | banner nguyên văn `"Không thể khóa tài khoản của chính mình"` |
| 3 | Hạ role / xóa ADMIN đang sống cuối cùng | banner nguyên văn message `"phải luôn có ít nhất một tài khoản Quản trị viên"` |
| 4 | Bật (`enabled=true`) tài khoản INACTIVE chưa verify email | 400 message "chưa xác thực email…", tài khoản vẫn INACTIVE |
| 5 | Delete → mở tab Deleted → Restore | user về đúng trạng thái trước xóa (role/enabled/locked y nguyên), list chính xuất hiện lại |
| 6 | Lock 2 lần liên tiếp | lần 2 banner 400 `"Tài khoản đã bị khóa"`; audit có thêm dòng `LOCK_USER` `succeeded=false` + reason |
| 7 | Mở user detail | audit có dòng `VIEW_USER`, Target hiển thị `fullname — email`, không phải id thô |
| 8 | Tìm kiếm `100%` (kí tự LIKE) | không lỗi, khớp chữ `100%` trong email/tên; search >100 ký tự → banner 400 nguyên văn |
| 9 | Audit `from > to` | banner 400 `"from không được lớn hơn to"` |
| 10 | ROLE_STAFF vào `/admin/users` | `ProtectedRoute` → `/unauthorized` (route chỉ ROLE_ADMIN) |
| 11 | `changeRole` body role rác → 400 Validation failed | banner nối từ `detail` qua `readApiErrorMessage`, không còn `"Validation failed"` thô |
| 12 | Restore user chưa từng bị xóa | 400 `"Tài khoản không ở trạng thái đã xóa"` |
| 13 | Export CSV khi đang lọc | file ra đúng tập lọc (số dòng = `totalElements` của filter), không export nhầm trang đang xem |
| 14 | KPI Total/Locked | bằng đúng `totalElements` đo bằng curl cùng thời điểm (sai số chỉ do dữ liệu thay đổi giữa 2 lần đọc) |
| 15 | (wave 2) Invite email đã tồn tại | 409 nguyên văn, không tạo user |
| 16 | (wave 2) Revoke invite của user đã verify | 400 — chỉ thu hồi được tài khoản chưa verify |

## 8. Cách đã verify / cách verify khi làm

**Đã đo runtime ngày 2026-10-19 (wave 1)** — các bước dưới đây có dấu `[x]` là đã chạy và ghi số liệu:

- [x] `node node_modules/typescript/bin/tsc --noEmit` sạch (lưu ý: `npx tsc` không hoạt động ở repo CRA này,
  `node_modules/.bin/*.cmd` gọi thẳng từ Git Bash bị MODULE_NOT_FOUND — phải chạy `node <đường-dẫn-module>`).
- [x] `docker compose build backend && up -d backend` (image cũ chưa có các endpoint `/users/deleted`,
  `/status`, `/restore` — lần gọi đầu trả 500 "Failed to convert 'deleted' to Long" vì router cũ hiểu
  `/users/deleted` là `/users/{id}`). Sau khi build lại: endpoint trả 401 khi vô danh = đã đăng ký route.
- [x] `docker compose build frontend && up -d frontend`, kiểm tra bundle `main.*.js` khớp trong container + cache-buster.
- [x] Smoke test jsdom một lần theo verification.md §6 (render `AdminUserManagementPage` với controller mock:
  KPI, 2 dòng users, chuyển tab audit thấy `reason` nguyên văn + nhãn action) → **PASS**, rồi **đã xoá file test**.
- [x] Đo API bằng token admin seed (`admin@aiinterview.com` theo quickstart BE — không đụng phiên OAuth
  của anh trong browser, không nâng role tài khoản id 8):
  - `GET /users?size=1` → `totalElements=3`; `status=LOCKED` → `0` (KPI Total=3, Locked=0 là số thật).
  - `GET /users/deleted` → 200, page rỗng đúng shape (`content:[], totalElements:0`).
  - `GET /users/{id}` → `UserDetailResponse` có đủ `phone, lockedAt, blockedUntil, failedLoginAttempts`.
  - `status=FOO` → 400 liệt kê giá trị cho phép; `status=DELETED` → 400 hướng dẫn dùng `/users/deleted`
    (xác nhận ghi chú mục 3).
  - `GET /audit-logs` → `targetEmail/targetFullName/succeeded/reason` có giá trị; filter `action` OK;
    `from>to` → 400; `action` rác → 400 liệt kê enum.
  - `PATCH /users/{id}/status` bật/tắt → 200, đối chiếu DB (`enabled` đổi, `token_version` tăng), đã trả về
    `enabled=0` như cũ.
  - `PATCH /users/{id}/role` round-trip → 200.
  - `PATCH /users/{id}/lock` → **502 "Không gửi được email"** và rollback toàn bộ (`locked` vẫn 0,
    `token_version` không đổi, không có dòng audit) — đúng hành vi đã ghi trong plan; chặn vì mail local hỏng.
- [ ] Các case phụ thuộc email (lock/unlock/delete/reset-password/invite/resend đổi email): **vẫn 502**
  sáng 2026-10-19 sau khi build lại BE — container `aiinterview-backend` **không có env** `GMAIL_CLIENT_ID`,
  `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `MAIL_FROM` (đọc `docker exec … env` chỉ thấy `MAIL_TEST_CONNECTION`).
  Đã đo và ghi nhận hành vi rollback đúng hợp đồng: `PATCH /users/{id}` đổi email → 502, email trong DB
  **không đổi**; `POST /users` invite → 502, DB **không có row mới**; `POST /users/{id}/invitation/resend` → 502.
  Chờ anh bổ sung 4 env Gmail API vào service `backend` (docker-compose) rồi bấm lại các case thành công.
- [x] **Wave 2 đo runtime sau khi build lại BE** (image cũ chưa có các endpoint mới — lần đầu gọi
  `/users/stats` bị 400 vì router cũ hiểu `stats` là `{id}`):
  - `GET /users/stats` → `{total:3, active:1, pendingVerification:1, locked:0, disabled:2, deleted:0, activeLast30Days:1}`.
  - `GET /users` → mỗi row có `pendingVerification` + `lastLoginAt` (null với account chưa từng login;
    admin vừa login thì có timestamp).
  - `GET /users?status=PENDING` → 200, đúng 1 row (`weakpw2@example.com`, `pendingVerification=true`).
  - `GET /users/export` → 200 `text/csv;charset=UTF-8` + `Content-Disposition: attachment; filename="users-export.csv"`,
    header `id,email,fullName,role,status,pendingVerification,lastLoginAt,createdAt,deletedAt`, 3 dòng dữ liệu.
  - `PATCH /users/{id}` sửa phone → 200 message "Hồ sơ đã được cập nhật"; body `{}` → 400
    `"Không có thông tin nào để cập nhật"` và **vẫn ghi audit** `UPDATE_PROFILE` `succeeded=false` + reason.
  - `DELETE /users/{id}/invitation` (tài khoản đang chờ mời) → 200 message "Đã thu hồi link mời",
    DB `verification_token` = NULL, audit `REVOKE_INVITATION` `succeeded=true`.
    **Đã restore `verification_token` cho row đo sau khi xong.**
  - Case **không cần mail** đo được: invite email đã tồn tại → `409 "Email đã tồn tại trong hệ thống"`
    (test case 15); resend + revoke trên tài khoản đã verify → `400 "Tài khoản đã xác thực email"` /
    `400 "Tài khoản không có lời mời đang chờ xác thực"` (test case 16);
    body invite có `role` ngoài enum → `400 "Dữ liệu gửi lên không đúng định dạng"` (BE báo lỗi cấu trúc
    request, **không** phải "Validation failed" — FE hiển thị nguyên văn qua `readApiErrorMessage`).
  - Audit tab: `action=REVOKE_INVITATION` filter → total 1; `EXPORT_USERS` có row `targetUserId=null`
    (FE hiển thị `—`), `detail` ghi rõ số dòng + bộ lọc.
- [x] Actuator: chưa nối pill "All services operational" (mục 6.8 vẫn mở).
- [x] **Wave 3 (restyle theo mockup) — đo 2026-10-19:**
  - `node node_modules/typescript/bin/tsc --noEmit` sạch.
  - Không vào được `/admin/users` bằng browser dùng chung (đang là phiên OAuth của anh Huy + `.env.production` baked
    trỏ staging chưa có endpoint mới) → verify ảnh bằng đường **render component thật**: jsdom dump DOM của
    `AdminUserManagementPage` với controller mock, style bằng Tailwind CSS generate từ chính app
    (`tailwind.config.js`), chụp bằng headless Chrome (`--virtual-time-budget=8000` để font + Material Symbols
    load kịp — lần chụp đầu không có flag này bị font dự phòng). Không viết UI giả.
  - Probe 3/3 PASS: (1) dump DOM screen User Directory, (2) kebab dòng cuối mở menu và wire đủ 4 item,
    (3) chọn nhiều dòng hiện bulk bar và hỏi xác nhận.
  - `docker compose build frontend` exit 0 → `up -d frontend` recreate → `localhost:3000` serve
    `main.4e9c91a8.js`; grep trong bundle chứa chuỗi mới: "Access Control", "registered members",
    "Pending invite", "Reactivate", "Recent Security".
  - Artefact tạm đã xoá sạch trước commit: `src/views/pages/probe-render.test.tsx` + thư mục
    `/d/tmp/stitchadm/harness` (serve.js, html, png) — không commit.
- [x] Ghi lại mục này + cập nhật dòng `/admin/users` trong `spec/INDEX.md`.

## 9. Câu hỏi mở cho anh Huy

1. **`apiError.ts` cho `useAdminUserController`** (2.1): hiểu "bổ sung tất cả" là chốt làm — xác nhận lại
   một dòng nếu sai.
2. **Export CSV**: client-side lặp trang qua API hiện có (2.8, làm được ngay, phụ thuộc tổng user không
   quá lớn) hay chờ endpoint server-side 6.6? **Đề xuất: 2.8 trước.**
3. **"Employer" role**: mockup tách Employer/Candidate nhưng `Role` BE chỉ có 4 giá trị (không có
   employer). Chọn: (a) gán employer = `ROLE_INTERVIEWER` và đổi label thành "Employer / Interviewer";
   (b) BE thêm `ROLE_EMPLOYER`. **Đề xuất: hỏi BE trước khi động enum**, vì enum đụng sang auth/DB/staging.
4. **Bulk action**: FE loop từng request (không cần BE) hay chờ bulk endpoint 6.5? **Đề xuất: loop**,
   vì BE đã audit từng action và rule "ADMIN cuối cùng" tự được áp dụng đúng.
5. **Role Permissions tab**: ma trận static dựng từ guard thật (6.4a) hay endpoint BE (6.4b)?
   **Đề xuất: 6.4a.**
6. **Pill "All services operational"**: nối actuator health sau khi đo (6.8) hay ẩn cho tới khi BE có
   system-status chính thức? **Đề xuất: đo actuator, có thì nối, không thì ẩn tạm.**
