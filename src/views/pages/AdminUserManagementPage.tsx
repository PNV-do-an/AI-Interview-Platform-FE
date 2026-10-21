import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import { Role, UserDetail, UserSummary } from '../../models/User.model';
import { DashboardResponse } from '../../models/AdminConsole.model';
import { parseServerTimestamp } from '../../utils/date';
import ConfirmDialog from '../components/ConfirmDialog';
import EditProfileModal from '../components/EditProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import {
  AdminPageHeader, EmptyBlock, ErrorBlock, ICON, LoadingBlock, ModalBackdrop, ROLE_CHIP,
  ROLE_DESCRIPTION, ROLE_ICON, ROLE_OPTIONS, ROLE_VN, StatusChip, fmtServer, initialsOf,
  modalCancelClass as MODAL_CANCEL, modalDangerClass as MODAL_DANGER, modalPrimaryClass as MODAL_PRIMARY,
} from '../components/adminKit';

/**
 * Màn "Quản lý người dùng" (screen_17 trong bộ Stitch 2026-10-21) — DATA page.
 * Số thật: GET /admin/users + /users/stats (cùng bộ lọc với danh sách) + /admin/dashboard?days=30
 * cho phân bổ vai trò; mọi thao tác ghi đi qua PATCH/POST/DELETE /admin/users/*.
 *
 * Hai điểm lệch thiết kế bắt buộc (chép vào spec/INDEX.md):
 *  - Bỏ select "Ngày tạo: 30 ngày qua" vì GET /admin/users không nhận tham số mốc thời gian.
 *  - Icon sắp xếp chỉ sắp các dòng đang tải; BE không nhận tham số sort nên không sắp toàn bộ.
 */

const PAGE_SIZES = [10, 25, 50];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'LOCKED', label: 'Bị khóa' },
  { value: 'PENDING', label: 'Chờ xác thực' },
  { value: 'INACTIVE', label: 'Vô hiệu hóa' },
  // DELETED bị BE chặn ở /users (400) -> chọn giá trị này là chuyển sang /users/deleted.
  { value: 'DELETED', label: 'Đã xóa' },
];

const TR_CLASS = 'py-space-md px-space-md text-left text-ds-label-md font-semibold text-on-surface-variant whitespace-nowrap';
const TD_CLASS = 'py-space-md px-space-md text-ds-body-md text-on-surface align-middle';
const FILTER_SELECT =
  'h-10 pl-3 pr-9 bg-surface-container-low border border-surface-container-high text-on-surface ' +
  'text-ds-body-sm rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container transition-all cursor-pointer';
interface MenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

type SortKey = 'id' | 'name' | 'createdAt';

const AdminUserManagementPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlSearch = params.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [dash, setDash] = useState<DashboardResponse | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
  const [lockIds, setLockIds] = useState<number[] | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [roleIds, setRoleIds] = useState<number[] | null>(null);
  const [pendingRole, setPendingRole] = useState<Role>('ROLE_USER');
  const [menu, setMenu] = useState<{ top: number; right: number; items: MenuItem[] } | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Xác nhận', danger: false, onConfirm: () => {} });

  const isDeletedView = statusFilter === 'DELETED';

  // Ô tìm kiếm trên header sidebar điều hướng bằng ?search= -> đổi tham số là phải nạp lại danh sách.
  useEffect(() => {
    setSearchInput(urlSearch);
    void ctrl.fetchUsers(0, { search: urlSearch.trim(), status: '', role: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // byRole cho thẻ "Ứng viên" / "Nhà tuyển dụng": endpoint dashboard là ADMIN-only (route này cũng vậy).
  useEffect(() => {
    let alive = true;
    AdminService.getDashboard(30)
      .then((res) => { if (alive) setDash(res.data.data ?? null); })
      .catch(() => { if (alive) setDash(null); });
    return () => { alive = false; };
  }, []);

  const load = useCallback((page: number, over: { search?: string; status?: string; role?: string; size?: number } = {}) => {
    const search = (over.search ?? searchInput).trim();
    const status = over.status ?? statusFilter;
    const role = over.role ?? roleFilter;
    setSelectedIds([]);
    if (status === 'DELETED') {
      void ctrl.fetchDeletedUsers(page, search);
      return;
    }
    void ctrl.fetchUsers(page, { search, status, role }, over.size ?? ctrl.pageSize);
  }, [ctrl, searchInput, statusFilter, roleFilter]);

  const askConfirm = (title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) =>
    setConfirm({ open: true, title, message, confirmLabel, danger, onConfirm });

  const closeConfirm = () => setConfirm((d) => ({ ...d, open: false }));

  const submitLock = async () => {
    if (!lockIds || !lockReason.trim()) return;
    const ids = lockIds;
    const reason = lockReason.trim();
    setLockIds(null);
    setLockReason('');
    setSelectedIds([]);
    if (ids.length === 1) {
      // BE vẫn ghi audit cả attempt thất bại -> luôn refresh để bảng đúng trạng thái thật.
      try {
        await AdminService.lockUserWithReason(ids[0], { reason });
      } finally {
        await ctrl.fetchUsers(ctrl.currentPage);
      }
      return;
    }
    await ctrl.runBulkAction('lock', ids, { reason });
  };

  const submitRole = async () => {
    if (!roleIds) return;
    const ids = roleIds;
    setRoleIds(null);
    setSelectedIds([]);
    if (ids.length === 1) {
      await ctrl.changeRole(ids[0], pendingRole);
      return;
    }
    await ctrl.runBulkAction('role', ids, { role: pendingRole });
  };

  const baseRows: UserSummary[] = isDeletedView
    ? (ctrl.deletedUsers?.content ?? [])
    : (ctrl.users?.content ?? []);

  const rows = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...baseRows].sort((a, b) => {
      if (sort.key === 'id') return (a.id - b.id) * dir;
      if (sort.key === 'name') return a.fullName.localeCompare(b.fullName, 'vi') * dir;
      return ((parseServerTimestamp(a.createdAt)?.getTime() ?? 0) - (parseServerTimestamp(b.createdAt)?.getTime() ?? 0)) * dir;
    });
  }, [baseRows, sort]);

  const paged = isDeletedView ? ctrl.deletedUsers : ctrl.users;
  const pageIds = baseRows.map((u) => u.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleRow = (id: number) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const clearFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setStatusFilter('');
    setSelectedIds([]);
    void ctrl.fetchUsers(0, { search: '', status: '', role: '' });
  };

  const openEdit = (id: number) => {
    void ctrl.loadProfileForEdit(id).then((p) => p && setEditUser(p));
  };

  const total = ctrl.stats?.total ?? 0;
  const pct = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—');
  const partners = dash ? dash.users.byRole.ROLE_INTERVIEWER + dash.users.byRole.ROLE_STAFF : 0;

  const rowMenu = (u: UserSummary): MenuItem[] => {
    const base: MenuItem[] = [
      { label: 'Xem chi tiết', icon: 'visibility', onClick: () => navigate(`/admin/users/${u.id}`) },
      { label: 'Cập nhật hồ sơ', icon: 'edit_note', onClick: () => openEdit(u.id) },
    ];
    if (u.pendingVerification) {
      return [
        ...base,
        { label: 'Gửi lại lời mời', icon: 'forward_to_inbox', onClick: () => ctrl.resendInvitation(u.id) },
        {
          label: 'Thu hồi lời mời',
          icon: 'inbox',
          onClick: () => askConfirm(
            'Thu hồi lời mời',
            `Thu hồi link mời đang chờ xác thực của "${u.email}"? Tài khoản giữ nguyên vai trò và có thể được mời lại.`,
            'Thu hồi link', false,
            () => { closeConfirm(); void ctrl.revokeInvitation(u.id); },
          ),
        },
      ];
    }
    return [
      ...base,
      { label: 'Đổi vai trò', icon: 'manage_accounts', onClick: () => setRoleIds([u.id]) },
      u.status === 'LOCKED'
        ? { label: 'Mở khóa tài khoản', icon: 'lock_open', onClick: () => ctrl.unlockUser(u.id) }
        : { label: 'Khóa tài khoản', icon: 'lock', onClick: () => { setLockReason(''); setLockIds([u.id]); }, danger: true },
      { label: 'Gửi mail đặt lại mật khẩu', icon: 'key', onClick: () => ctrl.resetPassword(u.id) },
      u.status === 'INACTIVE'
        ? { label: 'Kích hoạt tài khoản', icon: 'how_to_reg', onClick: () => ctrl.setUserStatus(u.id, true) }
        : { label: 'Vô hiệu hóa tài khoản', icon: 'person_off', onClick: () => ctrl.setUserStatus(u.id, false) },
      {
        label: 'Xóa tài khoản',
        icon: 'delete',
        danger: true,
        onClick: () => askConfirm(
          'Xóa tài khoản',
          `Xóa mềm tài khoản "${u.email}"? Tài khoản chuyển vào danh sách "Đã xóa" và khôi phục được.`,
          'Xóa', true,
          () => { closeConfirm(); setSelectedIds([]); void ctrl.deleteUser(u.id); },
        ),
      },
    ];
  };

  const showMenu = (e: React.MouseEvent<HTMLButtonElement>, items: MenuItem[]) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ top: r.bottom + 4, right: window.innerWidth - r.right, items });
  };

  return (
    <div className="px-space-lg py-space-lg bg-background min-h-screen">
      <AdminPageHeader
        crumbs={[{ label: 'Trang chủ', to: '/admin/dashboard' }, { label: 'Quản lý người dùng' }]}
        title="Quản lý người dùng"
        subtitle="Xem, tìm kiếm, phân quyền và giám sát tài khoản hệ sinh thái phỏng vấn AI"
        actions={(
          <>
            <button
              type="button"
              onClick={() => { void ctrl.exportUsersCsv(); }}
              disabled={ctrl.exporting}
              className="h-10 px-space-md bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-ds-label-lg font-semibold rounded-xl shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-space-xs cursor-pointer disabled:opacity-60"
            >
              <span className={`${ICON} text-[18px] text-on-surface-variant`}>download</span>
              <span>{ctrl.exporting ? 'Đang xuất...' : 'Xuất file CSV / Excel'}</span>
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="h-10 px-space-md bg-primary-container text-on-primary text-ds-label-lg font-semibold rounded-xl shadow-sm hover:shadow-md hover:bg-primary transition-all flex items-center gap-space-xs border-0 cursor-pointer"
            >
              <span className={`${ICON} text-[18px]`}>add</span>
              <span>Thêm người dùng mới</span>
            </button>
          </>
        )}
      />

      {/* 4 thẻ chỉ số: total/locked từ /users/stats, phân bổ vai trò từ /dashboard?days=30. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg mb-space-xl">
        <MetricCard
          label="Tổng người dùng"
          value={ctrl.stats ? total.toLocaleString('vi-VN') : '—'}
          icon="group"
          iconClass="bg-primary-fixed text-primary"
          pill={dash ? `+${dash.users.newInPeriod}` : undefined}
          pillClass="bg-secondary-container text-on-secondary-container"
          pillIcon="trending_up"
          note="tài khoản mới 30 ngày qua"
        />
        <MetricCard
          label="Ứng viên"
          value={dash ? dash.users.byRole.ROLE_USER.toLocaleString('vi-VN') : '—'}
          icon="school"
          iconClass="bg-tertiary-fixed text-tertiary"
          pill={dash ? pct(dash.users.byRole.ROLE_USER) : undefined}
          pillClass="bg-tertiary-fixed text-on-tertiary-fixed-variant"
          note="trên tổng tài khoản"
        />
        <MetricCard
          label="Nhà tuyển dụng / Cố vấn"
          value={dash ? partners.toLocaleString('vi-VN') : '—'}
          icon="work"
          iconClass="bg-secondary-fixed text-secondary-teal"
          pill={dash ? pct(partners) : undefined}
          pillClass="bg-secondary-container text-on-secondary-container"
          note="hoạt động đánh giá"
        />
        <MetricCard
          label="Tài khoản bị khóa"
          value={ctrl.stats ? ctrl.stats.locked.toLocaleString('vi-VN') : '—'}
          valueClass="text-error"
          icon="lock_person"
          iconClass="bg-error-container text-error"
          pill={ctrl.stats && ctrl.stats.locked > 0 ? 'Cần xử lý' : undefined}
          pillClass="bg-error-container text-on-error-container"
          note={ctrl.stats ? `${ctrl.stats.pendingVerification} chờ xác thực · ${ctrl.stats.deleted} đã xóa` : 'vi phạm tiêu chuẩn'}
        />
      </div>

      {ctrl.error && (
        <div className="mb-space-md">
          <ErrorBlock message={ctrl.error} onRetry={() => load(ctrl.currentPage)} />
        </div>
      )}
      {ctrl.successMsg && (
        <div className="mb-space-md flex items-center gap-2 rounded-xl bg-secondary-container px-4 py-3 text-ds-body-md text-on-secondary-container" role="status">
          <span className={`${ICON} text-[20px]`}>check_circle</span>
          <span>{ctrl.successMsg}</span>
        </div>
      )}

      {/* #bulk-action-bar: chi hien khi co dong duoc chon */}
      {selectedIds.length > 0 && (
        <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-md bg-surface-container-high px-space-lg py-3 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-primary-container text-on-primary text-ds-label-md font-semibold shadow-sm">
              <span className={`${ICON} text-[16px]`}>check_circle</span>
              Đã chọn {selectedIds.length} tài khoản
            </span>
            <span className="hidden md:inline text-ds-body-sm text-on-surface-variant">
              Áp dụng thao tác đồng loạt trên các bản ghi đang chọn
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              disabled={ctrl.actionLoading}
              onClick={() => { setLockReason(''); setLockIds(selectedIds); }}
              className="h-9 px-space-md bg-surface-container-lowest text-error text-ds-label-md font-semibold rounded-lg shadow-sm hover:bg-error-container hover:text-on-error-container transition-all flex items-center gap-space-xs border border-surface-container-high cursor-pointer disabled:opacity-60"
            >
              <span className={`${ICON} text-[16px]`}>lock</span>Khóa tài khoản
            </button>
            <button
              type="button"
              disabled={ctrl.actionLoading}
              onClick={() => { void ctrl.runBulkAction('unlock', selectedIds); setSelectedIds([]); }}
              className="h-9 px-space-md bg-surface-container-lowest text-secondary-teal text-ds-label-md font-semibold rounded-lg shadow-sm hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center gap-space-xs border border-surface-container-high cursor-pointer disabled:opacity-60"
            >
              <span className={`${ICON} text-[16px]`}>lock_open</span>Mở khóa
            </button>
            <button
              type="button"
              disabled={ctrl.actionLoading}
              onClick={() => setRoleIds(selectedIds)}
              className="h-9 px-space-md bg-surface-container-lowest text-primary text-ds-label-md font-semibold rounded-lg shadow-sm hover:bg-primary-fixed hover:text-on-primary-fixed transition-all flex items-center gap-space-xs border border-surface-container-high cursor-pointer disabled:opacity-60"
            >
              <span className={`${ICON} text-[16px]`}>manage_accounts</span>Đổi vai trò
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-9 px-space-sm text-on-surface-variant hover:text-on-surface text-ds-label-md font-semibold rounded-lg transition-colors flex items-center gap-1 ml-1 bg-transparent border-0 cursor-pointer"
            >
              <span className={`${ICON} text-[16px]`}>close</span>Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-space-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          <form
            className="relative flex-1 min-w-[280px]"
            onSubmit={(e) => { e.preventDefault(); load(0); }}
          >
            <span className={`${ICON} absolute left-3 top-1/2 -translate-y-1/2 text-outline-strong text-[20px] pointer-events-none`}>search</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo họ tên, email hoặc mã người dùng..."
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface text-ds-body-sm placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </form>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative">
              <select
                aria-label="Lọc theo vai trò"
                className={FILTER_SELECT}
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); load(0, { role: e.target.value }); }}
              >
                <option value="">Vai trò: Tất cả</option>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <span className={`${ICON} absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]`}>expand_more</span>
            </div>
            <div className="relative">
              <select
                aria-label="Lọc theo trạng thái"
                className={FILTER_SELECT}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); load(0, { status: e.target.value }); }}
              >
                <option value="">Trạng thái: Tất cả</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <span className={`${ICON} absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]`}>expand_more</span>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 px-3 text-on-surface-variant hover:text-error hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1 text-ds-label-md font-semibold bg-transparent border-0 cursor-pointer"
            >
              <span className={`${ICON} text-[16px]`}>restart_alt</span>
              <span className="hidden sm:inline">Xóa bộ lọc</span>
            </button>
          </div>
        </div>

        {ctrl.loading || ctrl.loadingDeleted ? (
          <LoadingBlock label="Đang tải danh sách người dùng..." />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon="group_off"
            title="Không có tài khoản nào khớp bộ lọc"
            description={isDeletedView
              ? 'Chưa có tài khoản nào bị xóa mềm trong hệ thống.'
              : 'Thử xóa bớt bộ lọc hoặc đổi từ khóa tìm kiếm.'}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className={`${TR_CLASS} w-12 text-center`}>
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả tài khoản trong trang"
                      className="h-4 w-4 cursor-pointer accent-primary-container"
                      checked={allChecked}
                      onChange={() => setSelectedIds(allChecked ? [] : pageIds)}
                    />
                  </th>
                  <SortableTh
                    label="Mã ID"
                    dir={sort.key === 'id' ? sort.dir : null}
                    onClick={() => setSort((s) => ({ key: 'id', dir: s.key === 'id' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                    className="w-24"
                  />
                  <SortableTh
                    label="Người dùng"
                    dir={sort.key === 'name' ? sort.dir : null}
                    onClick={() => setSort((s) => ({ key: 'name', dir: s.key === 'name' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                    className="min-w-[240px]"
                  />
                  <th className={`${TR_CLASS} min-w-[190px]`}>Vai trò</th>
                  <th className={`${TR_CLASS} min-w-[130px]`}>Trạng thái</th>
                  <SortableTh
                    label="Ngày tạo"
                    dir={sort.key === 'createdAt' ? sort.dir : null}
                    onClick={() => setSort((s) => ({ key: 'createdAt', dir: s.key === 'createdAt' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                    className="min-w-[120px]"
                  />
                  <th className={`${TR_CLASS} text-right min-w-[100px]`}>Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {rows.map((u) => {
                  const locked = u.status === 'LOCKED';
                  return (
                    <tr key={u.id} className="bg-surface-container-lowest/80 hover:bg-surface-container-low/60 transition-colors">
                      <td className={`${TD_CLASS} w-12 text-center`}>
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${u.email}`}
                          className="h-4 w-4 cursor-pointer accent-primary-container"
                          checked={selectedIds.includes(u.id)}
                          disabled={ctrl.actionLoading}
                          onChange={() => toggleRow(u.id)}
                        />
                      </td>
                      <td className={`${TD_CLASS} font-mono font-semibold text-primary whitespace-nowrap`}>
                        {`#U${String(u.id).padStart(4, '0')}`}
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex items-center gap-space-sm">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[14px] shadow-sm shrink-0 ${
                            locked ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'
                          }`}
                          >
                            {initialsOf(u.fullName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-on-surface truncate">{u.fullName}</span>
                            <span className="text-ds-body-sm text-on-surface-variant truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-ds-label-sm font-bold whitespace-nowrap ${ROLE_CHIP[u.role] ?? ROLE_CHIP.ROLE_USER}`}>
                          <span className={`${ICON} text-[14px]`}>{ROLE_ICON[u.role] ?? 'shield'}</span>
                          {ROLE_VN[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className={TD_CLASS}>
                        <StatusChip status={u.pendingVerification && u.status === 'INACTIVE' ? 'PENDING' : u.status} />
                      </td>
                      <td className={`${TD_CLASS} text-ds-body-sm text-on-surface-variant whitespace-nowrap`}>
                        {fmtServer(u.createdAt, 'date')}
                      </td>
                      <td className={`${TD_CLASS} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label="Xem chi tiết"
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            <span className={`${ICON} text-[18px]`}>visibility</span>
                          </button>
                          {isDeletedView ? (
                            <button
                              type="button"
                              aria-label="Khôi phục tài khoản"
                              disabled={ctrl.actionLoading}
                              onClick={() => askConfirm(
                                'Khôi phục tài khoản',
                                `Khôi phục "${u.email}"? Vai trò và trạng thái trở lại đúng như trước khi xóa.`,
                                'Khôi phục', false,
                                () => { closeConfirm(); void ctrl.restoreUser(u.id); },
                              )}
                              className="p-1.5 text-secondary-teal hover:bg-secondary-container rounded-lg transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-60"
                            >
                              <span className={`${ICON} text-[18px]`}>restore</span>
                            </button>
                          ) : (
                            <>
                              {locked && (
                                <button
                                  type="button"
                                  aria-label="Mở khóa tài khoản"
                                  disabled={ctrl.actionLoading}
                                  onClick={() => ctrl.unlockUser(u.id)}
                                  className="p-1.5 text-secondary-teal hover:bg-secondary-container rounded-lg transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-60"
                                >
                                  <span className={`${ICON} text-[18px]`}>lock_open</span>
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label="Thao tác khác"
                                disabled={ctrl.actionLoading}
                                onClick={(e) => showMenu(e, rowMenu(u))}
                                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-60"
                              >
                                <span className={`${ICON} text-[18px]`}>more_vert</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paged && (
          <div className="p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <span className="text-ds-body-sm text-on-surface-variant">
                Hiển thị <strong className="text-on-surface">{paged.content.length === 0 ? 0 : paged.number * paged.size + 1} - {paged.number * paged.size + paged.content.length}</strong>{' '}
                trong tổng số <strong className="text-on-surface">{paged.totalElements.toLocaleString('vi-VN')}</strong> người dùng
              </span>
              {!isDeletedView && (
                <div className="relative">
                  <select
                    aria-label="Số bản ghi mỗi trang"
                    className="h-8 pl-2 pr-6 bg-surface-container-low text-on-surface text-ds-label-sm font-semibold rounded-lg appearance-none cursor-pointer focus:outline-none border-0"
                    value={ctrl.pageSize}
                    onChange={(e) => load(0, { size: Number(e.target.value) })}
                  >
                    {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} bản ghi / trang</option>)}
                  </select>
                  <span className={`${ICON} absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px] pointer-events-none`}>expand_more</span>
                </div>
              )}
            </div>
            <PageNumbers page={paged.number} totalPages={paged.totalPages} onPage={(p) => load(p)} />
          </div>
        )}
      </div>

      {/* Menu hành động của dòng định vị theo rect của nút vì thẻ bảng có `overflow-hidden`. */}
      {menu && (
        <>
          <span className="fixed inset-0 z-[940]" onClick={() => setMenu(null)} />
          <div
            className="fixed z-[950] w-48 bg-surface-container-lowest rounded-xl shadow-xl py-1 text-left flex flex-col"
            style={{ top: menu.top, right: menu.right }}
          >
            {menu.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { setMenu(null); item.onClick(); }}
                className={`px-space-md py-2 text-left text-ds-body-sm hover:bg-surface-container-low flex items-center gap-space-xs cursor-pointer bg-transparent border-0 ${
                  item.danger ? 'text-error' : 'text-on-surface'
                }`}
              >
                <span className={`${ICON} text-[16px]`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* #modal-lock-user: BE yêu cầu lý do, nút xác nhận chặn tới khi có lý do. */}
      {lockIds && (
        <ModalBackdrop onClose={() => setLockIds(null)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
                <span className={`${ICON} text-[24px]`}>warning</span>
              </div>
              <div className="flex flex-col">
                <h3 className="m-0 text-ds-headline-sm font-bold text-on-surface">
                  Khóa {lockIds.length > 1 ? `${lockIds.length} tài khoản` : 'tài khoản người dùng'}?
                </h3>
                <p className="mt-1 mb-0 text-ds-body-md text-on-surface-variant">
                  Người dùng sẽ không thể đăng nhập, thực hiện bài kiểm tra phỏng vấn hoặc kết nối tuyển dụng cho đến khi được mở khóa.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-ds-label-md font-semibold text-on-surface" htmlFor="lock-reason">
                Lý do khóa tài khoản <span className="text-error">*</span>
              </label>
              <textarea
                id="lock-reason"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="VD: Nhiều lần đoán mật khẩu bất thường, nghi vấn gian lận bài thi..."
                className="w-full p-3 bg-surface-container-low rounded-lg text-on-surface text-ds-body-sm placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-error transition-all resize-none border-0"
              />
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button type="button" className={MODAL_CANCEL} onClick={() => setLockIds(null)}>Hủy bỏ</button>
              <button
                type="button"
                className={MODAL_DANGER}
                disabled={!lockReason.trim()}
                onClick={() => { void submitLock(); }}
              >
                Xác nhận khóa
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* #modal-change-role */}
      {roleIds && (
        <ModalBackdrop onClose={() => setRoleIds(null)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-lg overflow-hidden p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className={`${ICON} text-[24px]`}>manage_accounts</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="m-0 text-ds-headline-sm font-bold text-on-surface">Thay đổi vai trò người dùng</h3>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Áp dụng cho {roleIds.length > 1 ? `${roleIds.length} người dùng đã chọn` : 'người dùng đã chọn'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setRoleIds(null)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-0 cursor-pointer"
              >
                <span className={`${ICON} text-[20px]`}>close</span>
              </button>
            </div>
            <div className="flex flex-col gap-space-sm">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-space-md rounded-xl cursor-pointer transition-all border ${
                    pendingRole === opt.value ? 'bg-surface-container-high border-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-container-high/60'
                  }`}
                >
                  <span className="flex items-center gap-space-md">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      opt.value === 'ROLE_ADMIN'
                        ? 'bg-primary-fixed-dim text-primary'
                        : opt.value === 'ROLE_INTERVIEWER'
                          ? 'bg-secondary-fixed text-secondary-teal'
                          : opt.value === 'ROLE_STAFF'
                            ? 'bg-surface-container-highest text-on-surface-variant'
                            : 'bg-tertiary-fixed text-tertiary'
                    }`}
                    >
                      <span className={`${ICON} text-[18px]`}>{ROLE_ICON[opt.value]}</span>
                    </span>
                    <span className="flex flex-col">
                      <span className="text-ds-label-lg text-on-surface">{opt.label}</span>
                      <span className="text-ds-body-sm text-on-surface-variant">{ROLE_DESCRIPTION[opt.value]}</span>
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="pending-role"
                    className="accent-primary-container"
                    checked={pendingRole === opt.value}
                    onChange={() => setPendingRole(opt.value)}
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button type="button" className={MODAL_CANCEL} onClick={() => setRoleIds(null)}>Hủy</button>
              <button type="button" className={MODAL_PRIMARY} onClick={() => { void submitRole(); }}>Lưu thay đổi</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={ctrl.inviteUser}
        actionLoading={ctrl.actionLoading}
      />

      <EditProfileModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={ctrl.updateProfile}
        actionLoading={ctrl.actionLoading}
      />
    </div>
  );
};

const SortableTh: React.FC<{
  label: string;
  dir: 'asc' | 'desc' | null;
  onClick: () => void;
  className?: string;
}> = ({ label, dir, onClick, className = '' }) => (
  <th className={`${TR_CLASS} p-0 ${className}`}>
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 py-space-md px-space-md text-ds-label-md font-semibold uppercase tracking-wider hover:text-on-surface cursor-pointer bg-transparent border-0 text-inherit"
    >
      <span>{label}</span>
      <span className={`${ICON} text-[12px]`}>{dir ? (dir === 'asc' ? 'arrow_upwards' : 'arrow_downward') : 'unfold_more'}</span>
    </button>
  </th>
);

const MetricCard: React.FC<{
  label: string; value: string; icon: string; iconClass: string;
  pill?: string; pillClass?: string; pillIcon?: string; note: string; valueClass?: string;
}> = ({ label, value, icon, iconClass, pill, pillClass = '', pillIcon, note, valueClass = 'text-on-surface' }) => (
  <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-low flex flex-col justify-between gap-space-md relative overflow-hidden hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        <span className="text-ds-label-md text-on-surface-variant">{label}</span>
        <span className={`text-ds-display-sm font-bold mt-space-xs ${valueClass}`}>{value}</span>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconClass}`}>
        <span className={`${ICON} text-[24px]`}>{icon}</span>
      </div>
    </div>
    <div className="flex items-center gap-space-xs">
      {pill && (
        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-ds-label-sm font-semibold ${pillClass}`}>
          {pillIcon && <span className={`${ICON} text-[12px]`}>{pillIcon}</span>}
          {pill}
        </span>
      )}
      <span className="text-ds-body-sm text-on-surface-variant">{note}</span>
    </div>
  </div>
);

const PageNumbers: React.FC<{ page: number; totalPages: number; onPage: (p: number) => void }> = ({
  page, totalPages, onPage,
}) => {
  const cells = useMemo(() => {
    const seen = new Set<number>([0, 1, 2, page - 1, page, page + 1, totalPages - 1]);
    const list = Array.from(seen).filter((p) => p >= 0 && p < totalPages).sort((a, b) => a - b);
    const out: (number | 'gap')[] = [];
    list.forEach((p, i) => {
      if (i > 0 && p - list[i - 1] > 1) out.push('gap');
      out.push(p);
    });
    return out;
  }, [page, totalPages]);

  const btn = (active: boolean) => `w-9 h-9 rounded-lg flex items-center justify-center transition-colors border-0 cursor-pointer ${
    active
      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
  }`;

  return (
    <div className="flex items-center gap-1 text-ds-label-md">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
        className={`${btn(false)} disabled:opacity-40`}
      >
        <span className={`${ICON} text-[16px]`}>chevron_left</span>
      </button>
      {cells.map((c, i) => c === 'gap'
        ? <span key={`gap-${i}`} className="px-1 text-on-surface-variant font-bold">...</span>
        : (
          <button key={c} type="button" className={btn(c === page)} onClick={() => onPage(c)}>
            {c + 1}
          </button>
        ))}
      <button
        type="button"
        aria-label="Trang sau"
        disabled={page + 1 >= totalPages}
        onClick={() => onPage(page + 1)}
        className={`${btn(false)} disabled:opacity-40`}
      >
        <span className={`${ICON} text-[16px]`}>chevron_right</span>
      </button>
    </div>
  );
};

export default AdminUserManagementPage;
