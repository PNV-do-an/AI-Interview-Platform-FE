import React, { useCallback, useEffect, useState } from 'react';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import {
  ACCOUNT_STATUS_LABELS, AuditLog, AUDIT_ACTIONS, PagedResponse, Role, ROLE_LABELS,
  UserDetail, UserStats, UserSummary,
} from '../../models/User.model';
import ConfirmDialog from '../components/ConfirmDialog';
import EditProfileModal from '../components/EditProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import UserDetailModal from '../components/UserDetailModal';
import {
  Badge, ErrorBanner, LoadingState, statusTone, buttonClass, tableClass, tdClass,
} from '../components/ui';

const AUDIT_ACTION_LABELS: Record<string, string> = {
  VIEW_USER: 'Viewed account', LOCK_USER: 'Locked account', UNLOCK_USER: 'Unlocked account',
  ENABLE_USER: 'Enabled account', DISABLE_USER: 'Disabled account', DELETE_USER: 'Deleted account',
  RESTORE_USER: 'Restored account', RESET_PASSWORD: 'Sent password reset', CHANGE_ROLE: 'Changed role',
  INVITE_USER: 'Invited member', RESEND_INVITATION: 'Resent invitation', REVOKE_INVITATION: 'Revoked invitation',
  UPDATE_PROFILE: 'Updated profile', EXPORT_USERS: 'Exported CSV',
};

const ROLE_ICONS: Record<Role, string> = {
  ROLE_USER: 'school', ROLE_STAFF: 'business', ROLE_ADMIN: 'admin_panel_settings', ROLE_INTERVIEWER: 'support_agent',
};

const MONO = 'font-mono text-label-sm';

// Bản local của `thClass` để cột checkbox/actions đổi padding mà không xung đột `px-3` gốc.
const thBase =
  'h-8 border-y border-[#e2e8f0] bg-surface-low text-label-sm font-semibold uppercase tracking-[0.04em] text-ink-variant';

// Vai tro cua `primary-fixed` / `secondary-fixed` trong mockup -> token `info` (#e2dfff).
const ROLE_PILL: Record<Role, string> = {
  ROLE_USER: 'bg-primary/10 text-primary',
  ROLE_STAFF: 'bg-info text-secondary',
  ROLE_INTERVIEWER: 'bg-surface-mid text-ink',
  ROLE_ADMIN: 'bg-info text-primary font-semibold',
};

const AVATAR_TONE: Record<Role, string> = {
  ROLE_USER: 'bg-info text-info-text',
  ROLE_STAFF: 'bg-info text-info-text',
  ROLE_INTERVIEWER: 'bg-surface-mid text-ink-variant',
  ROLE_ADMIN: 'bg-primary-container text-on-primary',
};

// Dot mau theo tone that cua status (khong phai online-realtime; BE khong co last_seen).
const DOT_CLASS: Record<string, string> = {
  success: 'bg-[#10b981] /* emerald-500 cham dot mockup */',
  warning: 'bg-[#f59e0b] /* amber-500 */',
  danger: 'bg-[#f43f5e] /* rose-500 */',
  info: 'bg-[#10b981] /* emerald-500 */',
  neutral: 'bg-[#94a3b8] /* slate-400 */',
};

const initialsOf = (name: string): string | null => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return null;
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

// Ding dang mockup: "Jan 10, 2025".
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/**
 * Cột "Last Active" theo mockup: "10 mins ago" / "3 days ago"; chưa từng login -> "Never".
 * `recent` = mới hơn 1 giờ -> hàng màu xanh kèm chấm dot (đúng hình thái mockup), nguồn là
 * `lastLoginAt` thật, không phải cờ realtime.
 */
const relativeOf = (iso: string | null): { text: string; recent: boolean } => {
  if (!iso) return { text: 'Never', recent: false };
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return { text: 'Just now', recent: true };
  if (mins < 60) return { text: `${mins} min${mins > 1 ? 's' : ''} ago`, recent: true };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `${hours} hour${hours > 1 ? 's' : ''} ago`, recent: false };
  const days = Math.floor(hours / 24);
  if (days < 30) return { text: `${days} day${days > 1 ? 's' : ''} ago`, recent: false };
  return { text: fmtDate(iso), recent: false };
};

type TabType = 'users' | 'pending' | 'deleted' | 'permissions' | 'auditLogs';

// inputClass ép `w-full` + `bg-card` nên ô tìm kiếm và select của ribbon lọc dùng bản riêng.
const searchInputClass =
  'h-9 w-full box-border rounded-md bg-surface-low pl-10 pr-4 text-body-md text-ink shadow-inner ' +
  'transition-colors placeholder:text-outline-strong focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary';

const filterSelectClass =
  'h-9 cursor-pointer rounded-md bg-surface-low px-2.5 text-label-md text-ink ' +
  'transition-colors focus:outline-none focus:ring-1 focus:ring-primary';

// Nút hành động dạng chữ trong bảng (mockup: Edit / Lock / Resend / Reactivate).
const rowBtnClass = (tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' = 'neutral') =>
  'inline-flex h-7 items-center gap-1 rounded px-2 text-label-sm font-medium transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  ({
    neutral: 'bg-surface-mid text-ink hover:bg-surface-high',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
    success: 'bg-success-bg text-success-text hover:brightness-95',
    warning: 'bg-[#fef3c7] text-[#78350f] /* amber-100/900 nut reactivate mockup */ hover:brightness-95',
    danger: 'bg-danger-bg text-danger-text hover:brightness-95',
  }[tone]);

const AdminUserManagementPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const [tab, setTab] = useState<TabType>('users');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deletedSearchInput, setDeletedSearchInput] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, onConfirm: () => {} });

  useEffect(() => { ctrl.fetchUsers(0); }, []); // eslint-disable-line

  const handleSearch = useCallback(() => {
    ctrl.applyFilters({ search: searchInput, status: statusFilter, role: roleFilter });
  }, [searchInput, statusFilter, roleFilter, ctrl]);

  const handleFilterChange = useCallback((
    key: 'status' | 'role', value: string,
  ) => {
    const newFilters = {
      search: searchInput,
      status: key === 'status' ? value : statusFilter,
      role:   key === 'role'   ? value : roleFilter,
    };
    if (key === 'status') {
      setStatusFilter(value);
      // Bo tay status khong con la "pending" thi quay ve tab All Members de khong lech nhan.
      if (tab === 'pending' && value !== 'PENDING') setTab('users');
      if (value === 'PENDING') setTab('pending');
    } else {
      setRoleFilter(value);
    }
    ctrl.applyFilters(newFilters);
  }, [searchInput, statusFilter, roleFilter, tab, ctrl]);

  const askConfirm = (
    title: string, message: string, onConfirm: () => void,
    opts: { confirmLabel: string; danger: boolean },
  ) => setConfirmDialog({ open: true, title, message, ...opts, onConfirm });

  const closeConfirm = () =>
    setConfirmDialog(d => ({ ...d, open: false }));

  const handleDelete = (id: number, email: string) => {
    askConfirm(
      'Delete account',
      `Are you sure you want to delete the account "${email}"? The account can be restored later from the Deleted tab.`,
      async () => { closeConfirm(); setSelectedIds([]); await ctrl.deleteUser(id); },
      { confirmLabel: 'Delete', danger: true },
    );
  };

  const handleRestore = (id: number, email: string) => {
    askConfirm(
      'Restore account',
      `Restore the deleted account "${email}"? Role and enabled state return exactly as before deletion.`,
      async () => { closeConfirm(); await ctrl.restoreUser(id); },
      { confirmLabel: 'Restore', danger: false },
    );
  };

  const runBulk = (action: 'lock' | 'unlock' | 'delete') => {
    const labels = {
      lock: ['Lock selected accounts', `Lock ${selectedIds.length} selected account(s)? Each of them loses sign-in access.`, 'Lock'],
      unlock: ['Unlock selected accounts', `Unlock ${selectedIds.length} selected account(s)?`, 'Unlock'],
      delete: ['Delete selected accounts', `Soft-delete ${selectedIds.length} selected account(s)? They return from the Deleted tab.`, 'Delete'],
    }[action];
    askConfirm(
      labels[0], labels[1],
      async () => { closeConfirm(); await ctrl.runBulkAction(action, selectedIds); setSelectedIds([]); },
      { confirmLabel: labels[2], danger: action === 'delete' || action === 'lock' },
    );
  };

  const switchTab = (t: TabType) => {
    setTab(t);
    setSelectedIds([]);
    if (t === 'auditLogs' && !ctrl.auditLogs) ctrl.fetchAuditLogs(0);
    if (t === 'deleted' && !ctrl.deletedUsers) ctrl.fetchDeletedUsers(0);
    // Tab "Pending Invites" = danh sách thật với bộ lọc status=PENDING (BE UserStatusFilter.PENDING),
    // nen dong bo chon vao select trang thai de user thay dung phan dang xem.
    if (t === 'pending') {
      setStatusFilter('PENDING');
      ctrl.applyFilters({ search: searchInput, status: 'PENDING', role: roleFilter });
    }
    // nguoc lai quay ve All Members phai xoa bo loc PENDING va goi lai list, neu khong
    // bang van giu 7 dong pending trong khi tab bao "All Members".
    if (t === 'users') {
      setStatusFilter('');
      ctrl.applyFilters({ search: searchInput, status: '', role: roleFilter });
    }
  };

  const handleViewHistory = (id: number) => {
    ctrl.setSelectedUser(null);
    setTab('auditLogs');
    ctrl.applyAuditFilters({ action: '', from: '', to: '', targetUserId: id });
  };

  const handleExport = () => { void ctrl.exportUsersCsv(); };

  const openEdit = (id: number) => {
    void ctrl.loadProfileForEdit(id).then(p => p && setEditUser(p));
  };

  const rows = ctrl.users?.content ?? [];
  const pageIds = rows.map(u => u.id);
  const allChecked = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  const toggleRow = (id: number) =>
    setSelectedIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + hành động cấp trang (mockup: Administration / User Directory) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-body-sm">
          <span className="text-ink-variant">Administration</span>
          <span className="text-[11px] text-outline-strong">/</span>
          <span className="font-semibold text-ink">User Directory</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass('secondary')} onClick={handleExport} disabled={ctrl.exporting}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            {ctrl.exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button type="button" className={buttonClass('primary')} onClick={() => setInviteOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Invite Members
          </button>
        </div>
      </div>

      <div className="-mt-2 flex flex-col gap-1">
        <h1 className="m-0 text-display-mobile text-ink sm:text-display">User Management &amp; Access Control</h1>
        <p className="m-0 text-body-md text-ink-variant">
          Manage member accounts, permissions, roles, and security policies across your organization.
        </p>
      </div>

      {/* KPI cards - GET /users/stats đếm thật trong DB, cùng bộ lọc search/role với danh sách. */}
      {ctrl.stats && <KpiRow stats={ctrl.stats} />}

      {/* Tabs */}
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0]">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'users' as TabType, label: 'All Members', icon: 'group', count: ctrl.stats?.total },
            { key: 'pending' as TabType, label: 'Pending Invites', icon: 'pending_actions', count: ctrl.stats?.pendingVerification },
            { key: 'permissions' as TabType, label: 'Role Permissions', icon: 'admin_panel_settings', count: undefined },
            { key: 'deleted' as TabType, label: 'Deleted', icon: 'person_off', count: ctrl.deletedUsers?.totalElements },
            { key: 'auditLogs' as TabType, label: 'Audit Log', icon: 'security', count: ctrl.auditLogs?.totalElements },
          ]).map(t => (
            <button
              key={t.key}
              type="button"
              className={`-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-label-md transition-colors ${
                tab === t.key
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-ink-variant hover:text-ink'
              }`}
              onClick={() => switchTab(t.key)}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
              {t.count != null && (
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                  tab === t.key ? 'bg-primary/10 text-primary' : 'bg-surface-mid text-ink-variant'
                }`}
                >
                  {t.count.toLocaleString('en-US')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ErrorBanner message={ctrl.error} />
      {ctrl.successMsg && (
        <div className="-mt-3 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{ctrl.successMsg}</span>
        </div>
      )}

      {(tab === 'users' || tab === 'pending') && (
        <>
          {/* Filter ribbon */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-card p-3 lg:flex-row">
            <div className="relative flex w-full items-center lg:w-96">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">search</span>
              <input
                className={searchInputClass}
                placeholder="Search by name, email, or user ID..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
              <label className="flex items-center gap-2">
                <span className="text-label-sm uppercase tracking-wider text-ink-variant">Role:</span>
                <select className={filterSelectClass} value={roleFilter}
                  onChange={e => handleFilterChange('role', e.target.value)}>
                  <option value="">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-label-sm uppercase tracking-wider text-ink-variant">Status:</span>
                <select className={filterSelectClass} value={statusFilter}
                  onChange={e => handleFilterChange('status', e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOCKED">Locked</option>
                  <option value="PENDING">Pending Invite</option>
                  {/* DELETED bị BE chặn ở list này (400) - xem tab "Deleted" */}
                </select>
              </label>
            </div>
          </div>

          {/* Bulk bar — BE chưa có /users/bulk nên mỗi tick gọi endpoint đơn của từng tài khoản. */}
          {selectedIds.length > 0 && (
            <div className="-mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-surface-low px-3 py-2">
              <span className="text-label-md font-medium text-ink tabular-nums">
                {selectedIds.length} selected
              </span>
              <button type="button" className={rowBtnClass('warning')} disabled={ctrl.actionLoading}
                onClick={() => runBulk('lock')}>
                <span className="material-symbols-outlined text-[16px]">lock</span>Lock
              </button>
              <button type="button" className={rowBtnClass('success')} disabled={ctrl.actionLoading}
                onClick={() => runBulk('unlock')}>
                <span className="material-symbols-outlined text-[16px]">lock_open</span>Unlock
              </button>
              <button type="button" className={rowBtnClass('danger')} disabled={ctrl.actionLoading}
                onClick={() => runBulk('delete')}>
                <span className="material-symbols-outlined text-[16px]">delete</span>Delete
              </button>
              <button type="button" className={buttonClass('ghost', 'ml-auto h-7')}
                onClick={() => setSelectedIds([])}>
                <span className="material-symbols-outlined text-[16px]">close</span>Clear
              </button>
            </div>
          )}

          {/* Table */}
          {ctrl.loading ? (
            <LoadingState />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-card">
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={`${thBase} w-12 px-4 text-center`}>
                        <input
                          type="checkbox"
                          aria-label="Select all accounts on this page"
                          className="h-4 w-4 cursor-pointer rounded accent-primary"
                          checked={allChecked}
                          disabled={rows.length === 0}
                          onChange={() => setSelectedIds(allChecked ? [] : pageIds)}
                        />
                      </th>
                      {['User / Member', 'Assigned Role', 'Status', 'Joined Date', 'Last Active'].map(h => (
                        <th key={h} className={`${thBase} px-3 text-left`}>{h}</th>
                      ))}
                      <th className={`${thBase} px-4 text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {rows.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-12 text-center text-body-sm text-ink-variant">No data</td></tr>
                    )}
                    {rows.map((u: UserSummary) => (
                      <MemberRow
                        key={u.id}
                        user={u}
                        loading={ctrl.actionLoading}
                        checked={selectedIds.includes(u.id)}
                        onToggle={() => toggleRow(u.id)}
                        onOpen={() => ctrl.fetchUserDetail(u.id)}
                        onLock={() => ctrl.lockUser(u.id)}
                        onUnlock={() => ctrl.unlockUser(u.id)}
                        onEdit={() => openEdit(u.id)}
                        onDelete={() => handleDelete(u.id, u.email)}
                        onReset={() => ctrl.resetPassword(u.id)}
                        onResendInvite={() => ctrl.resendInvitation(u.id)}
                        onRevokeInvite={() => askConfirm(
                          'Revoke invitation',
                          `Revoke the pending invitation link for "${u.email}"? The account keeps its role and can be invited again later.`,
                          async () => { closeConfirm(); await ctrl.revokeInvitation(u.id); },
                          { confirmLabel: 'Revoke link', danger: false },
                        )}
                        onHistory={() => handleViewHistory(u.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {ctrl.users && (
                <TableFooter
                  paged={ctrl.users}
                  currentPage={ctrl.currentPage}
                  exporting={ctrl.exporting}
                  onExport={handleExport}
                  onPageChange={p => ctrl.fetchUsers(p)}
                />
              )}
            </div>
          )}
        </>
      )}

      {tab === 'deleted' && (
        <>
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-card p-3 lg:flex-row">
            <div className="relative flex w-full items-center lg:w-96">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">search</span>
              <input
                className={searchInputClass}
                placeholder="Search deleted accounts by name or email..."
                value={deletedSearchInput}
                onChange={e => setDeletedSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ctrl.fetchDeletedUsers(0, deletedSearchInput)}
              />
            </div>
            <button
              type="button"
              className={buttonClass('secondary', 'w-full shrink-0 lg:w-auto')}
              onClick={() => ctrl.fetchDeletedUsers(0, deletedSearchInput)}
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Search
            </button>
          </div>

          {ctrl.loadingDeleted ? (
            <LoadingState />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-card">
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      {['User / Member', 'Assigned Role', 'Joined Date', 'Deleted Date'].map(h => (
                        <th key={h} className={`${thBase} px-3 text-left`}>{h}</th>
                      ))}
                      <th className={`${thBase} px-4 text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {ctrl.deletedUsers?.content.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-12 text-center text-body-sm text-ink-variant">No deleted accounts</td></tr>
                    )}
                    {ctrl.deletedUsers?.content.map((u: UserSummary) => {
                      const ini = initialsOf(u.fullName);
                      return (
                        <tr key={u.id} className="transition-colors hover:bg-surface-low/60">
                          <td className={tdClass}>
                            <div className="flex min-w-0 items-center gap-3">
                              {ini && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-mid text-label-sm font-bold text-ink-variant">
                                  {ini}
                                </div>
                              )}
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-headline-sm text-ink">{u.fullName}</span>
                                <span className="truncate text-body-sm text-ink-variant">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <RolePill role={u.role} />
                          </td>
                          <td className={`${tdClass} whitespace-nowrap ${MONO} text-ink-variant`}>
                            {fmtDate(u.createdAt)}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap ${MONO} text-ink-variant`}>
                            {u.deletedAt ? fmtDate(u.deletedAt) : '—'}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap text-right`}>
                            <button type="button" className={rowBtnClass('success')} disabled={ctrl.actionLoading}
                              onClick={() => handleRestore(u.id, u.email)}>
                              <span className="material-symbols-outlined text-[16px]">restore</span>Reactivate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {ctrl.deletedUsers && (
                <TableFooter
                  paged={ctrl.deletedUsers}
                  currentPage={ctrl.deletedPage}
                  onPageChange={p => ctrl.fetchDeletedUsers(p)}
                />
              )}
            </div>
          )}
        </>
      )}

      {tab === 'permissions' && <RolePermissionsTab />}

      {tab === 'auditLogs' && (
        <AuditLogTab
          logs={ctrl.auditLogs}
          filters={ctrl.auditFilters}
          page={ctrl.auditPage}
          onPageChange={p => ctrl.fetchAuditLogs(p)}
          onApplyFilters={ctrl.applyAuditFilters}
        />
      )}

      {/* User detail modal */}
      <UserDetailModal
        user={ctrl.selectedUser}
        onClose={() => ctrl.setSelectedUser(null)}
        onLock={ctrl.lockUser}
        onUnlock={ctrl.unlockUser}
        onSetStatus={ctrl.setUserStatus}
        onDelete={id => handleDelete(id, ctrl.selectedUser?.email ?? '')}
        onResetPassword={ctrl.resetPassword}
        onChangeRole={ctrl.changeRole}
        onViewHistory={handleViewHistory}
        onEditProfile={setEditUser}
        onResendInvitation={ctrl.resendInvitation}
        onRevokeInvitation={ctrl.revokeInvitation}
        actionLoading={ctrl.actionLoading}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
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

// ── Sub-components ──────────────────────────────────────────────────────────

/** 4 thẻ KPI theo đúng hình thái mockup: nhãn uppercase + icon màu, số lớn + chip, caption. */
const KpiRow: React.FC<{ stats: UserStats }> = ({ stats }) => {
  const activePct = stats.total > 0
    ? `${Math.round((stats.activeLast30Days / stats.total) * 100)}% active`
    : 'No accounts yet';

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard
        label="Total Users" icon="group" iconClass="text-primary"
        value={stats.total} caption="All registered profiles"
      />
      <KpiCard
        label="Active Members" icon="verified_user" iconClass="text-success-text"
        value={stats.activeLast30Days} chip={stats.total > 0 ? activePct : undefined}
        chipClass="bg-success-bg text-success-text"
        caption="Signed in within the last 30 days"
      />
      <KpiCard
        label="Pending Invitations" icon="mail" iconClass="text-secondary"
        value={stats.pendingVerification}
        chip={stats.pendingVerification > 0 ? 'Awaiting' : undefined}
        chipClass="bg-[#fffbeb] text-[#92400e] /* amber pending */"
        caption="Awaiting email verification"
      />
      <KpiCard
        label="Suspended / Locked" icon="gpp_bad" iconClass="text-danger-text"
        value={stats.locked}
        chip={stats.locked > 0 ? 'Flagged' : undefined}
        chipClass="bg-danger-bg text-danger-text"
        danger={stats.locked > 0}
        caption={`${stats.disabled.toLocaleString('en-US')} disabled · ${stats.deleted.toLocaleString('en-US')} deleted`}
      />
    </div>
  );
};

const KpiCard: React.FC<{
  label: string; icon: string; iconClass: string; value: number; caption: string;
  chip?: string; chipClass?: string; danger?: boolean;
}> = ({ label, icon, iconClass, value, caption, chip, chipClass, danger }) => (
  <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
    <div className="flex items-center justify-between gap-2 text-ink-variant">
      <span className="text-label-sm uppercase tracking-wider">{label}</span>
      <span className={`material-symbols-outlined text-[18px] ${iconClass}`}>{icon}</span>
    </div>
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <span className={`text-metric-stat tabular-nums ${danger ? 'text-danger-text' : 'text-ink'}`}>
        {value.toLocaleString('en-US')}
      </span>
      {chip && (
        <span className={`shrink-0 rounded px-1.5 py-0.5 ${MONO} font-medium ${chipClass}`}>{chip}</span>
      )}
    </div>
    <p className="mt-1 mb-0 text-body-sm text-ink-variant">{caption}</p>
  </div>
);

const RolePill: React.FC<{ role: Role }> = ({ role }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-label-sm font-medium ${ROLE_PILL[role]}`}>
    <span className="material-symbols-outlined text-[14px]">{ROLE_ICONS[role] ?? 'shield'}</span>
    {ROLE_LABELS[role] ?? role}
  </span>
);

const MemberRow: React.FC<{
  user: UserSummary;
  loading: boolean;
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReset: () => void;
  onResendInvite: () => void;
  onRevokeInvite: () => void;
  onHistory: () => void;
}> = ({
  user, loading, checked, onToggle, onOpen, onLock, onUnlock, onEdit, onDelete,
  onReset, onResendInvite, onRevokeInvite, onHistory,
}) => {
  const ini = initialsOf(user.fullName);
  const last = relativeOf(user.lastLoginAt);
  // Pending invite = INACTIVE-chua-verify: chấm amber nhưng KHÔNG là dòng bị khóa.
  const tone = user.pendingVerification ? 'warning' : statusTone(user.status);
  const suspended = user.status === 'LOCKED';
  const pillLabel = user.pendingVerification
    ? ACCOUNT_STATUS_LABELS.PENDING
    : ACCOUNT_STATUS_LABELS[user.status] ?? user.status;

  return (
    <tr
      className={`cursor-pointer transition-colors ${
        suspended ? 'bg-[#fff1f2]/50 hover:bg-[#fff1f2] /* rose-50 dong bi suspend */' : 'hover:bg-surface-low/60'
      }`}
      onClick={onOpen}
    >
      <td className={`${tdClass} w-12 px-4 text-center`} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          aria-label={`Select ${user.email}`}
          className="h-4 w-4 cursor-pointer rounded accent-primary"
          checked={checked}
          disabled={loading}
          onChange={onToggle}
        />
      </td>
      <td className={tdClass}>
        <div className="flex min-w-0 items-center gap-3">
          {ini && (
            <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label-sm font-bold ${
              user.status === 'LOCKED' ? 'bg-danger-bg text-danger-text' : AVATAR_TONE[user.role]
            }`}
            >
              {ini}
              <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${DOT_CLASS[tone]}`} />
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-headline-sm text-ink">{user.fullName}</span>
            <span className={`truncate text-body-sm ${suspended ? 'text-danger-text' : 'text-ink-variant'}`}>
              {user.email}
            </span>
          </div>
        </div>
      </td>
      <td className={tdClass}>
        <RolePill role={user.role} />
      </td>
      <td className={tdClass}>
        <Badge tone={tone} pill dot icon={suspended ? 'block' : undefined}>{pillLabel}</Badge>
      </td>
      <td className={`${tdClass} whitespace-nowrap ${MONO} text-ink-variant`}>{fmtDate(user.createdAt)}</td>
      <td className={`${tdClass} whitespace-nowrap`}>
        {last.text === 'Never' ? (
          <span className="text-body-sm italic text-ink-variant">Never</span>
        ) : last.recent ? (
          <span className="inline-flex items-center gap-1 text-label-sm font-medium text-[#047857] /* emerald-700 mockup */">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            {last.text}
          </span>
        ) : (
          <span className="text-body-sm tabular-nums text-ink-variant">{last.text}</span>
        )}
      </td>
      <td className={`${tdClass} whitespace-nowrap px-4 text-right`} onClick={e => e.stopPropagation()}>
        {user.pendingVerification ? (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button type="button" className={rowBtnClass('primary')} disabled={loading} onClick={onResendInvite}>Resend</button>
            <button type="button" className={rowBtnClass()} disabled={loading} onClick={onRevokeInvite}>Revoke</button>
            <RowMenu
              disabled={loading}
              items={[
                { label: 'View details', icon: 'visibility', onClick: onOpen },
                { label: 'Edit profile', icon: 'edit_note', onClick: onEdit },
                { label: 'View history', icon: 'history', onClick: onHistory },
              ]}
            />
          </div>
        ) : (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button type="button" className={rowBtnClass()} disabled={loading} onClick={onEdit}>Edit</button>
            {user.status === 'LOCKED'
              ? <button type="button" className={rowBtnClass('warning')} disabled={loading} onClick={onUnlock}>Reactivate</button>
              : <button type="button" className={rowBtnClass()} disabled={loading} onClick={onLock}>Lock</button>
            }
            <RowMenu
              disabled={loading}
              items={[
                { label: 'View details', icon: 'visibility', onClick: onOpen },
                { label: 'Send password reset', icon: 'key', onClick: onReset },
                { label: 'View history', icon: 'history', onClick: onHistory },
                { label: 'Delete account', icon: 'delete', onClick: onDelete, danger: true },
              ]}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

/**
 * Menu kebab của dòng. Dropdown đặt `fixed` theo rect của nút (giá trị động duy nhất được phép
 * dùng `style`) vì thẻ bảng có `overflow-hidden` + `overflow-x-auto` -> menu absolute sẽ bị
 * cắt mất vài item ở những dòng cuối trang.
 */
const RowMenu: React.FC<{
  disabled?: boolean;
  items: { label: string; icon: string; onClick: () => void; danger?: boolean }[];
}> = ({ disabled, items }) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pos) { setPos(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={pos !== null}
        title="More actions"
        disabled={disabled}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-outline-strong transition-colors hover:bg-surface-mid hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        onClick={toggle}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {pos && (
        <>
          <span className="fixed inset-0 z-[940]" onClick={() => setPos(null)} />
          <span
            className="fixed z-[950] flex w-56 flex-col rounded-lg border border-[#e2e8f0] bg-card py-1 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08)]"
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map(it => (
              <button
                key={it.label}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 text-left text-label-md transition-colors hover:bg-surface-low ${
                  it.danger ? 'text-danger-text' : 'text-ink'
                }`}
                onClick={() => { setPos(null); it.onClick(); }}
              >
                <span className="material-symbols-outlined text-[16px]">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
};

/** Chân bảng trong mockup: "Showing 1-10 of 3,420 registered members" + link CSV + pager số trang. */
const TableFooter: React.FC<{
  paged: PagedResponse<unknown>;
  currentPage: number;
  exporting?: boolean;
  onExport?: () => void;
  onPageChange: (p: number) => void;
}> = ({ paged, currentPage, exporting, onExport, onPageChange }) => {
  const from = paged.content.length === 0 ? 0 : currentPage * paged.size + 1;
  const to = currentPage * paged.size + paged.content.length;

  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-[#e2e8f0] bg-surface-low p-3 sm:flex-row">
      <div className="flex flex-wrap items-center gap-2 text-body-sm text-ink-variant">
        <span className="tabular-nums">
          Showing {from.toLocaleString('en-US')}-{to.toLocaleString('en-US')} of{' '}
          {paged.totalElements.toLocaleString('en-US')} registered members
        </span>
        {onExport && (
          <>
            <span className="text-outline-strong">•</span>
            <button type="button" className="text-label-sm font-medium text-primary hover:underline"
              onClick={onExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Download CSV Export'}
            </button>
          </>
        )}
      </div>
      <Pager currentPage={currentPage} totalPages={paged.totalPages} onPageChange={onPageChange} />
    </div>
  );
};

const Pager: React.FC<{
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  // Cửa sổ trang lân cận + trang đầu/cuối, chỗ nào nhảy cóc thì thắn "…".
  const pages = Array.from(new Set([
    0, 1, currentPage - 1, currentPage, currentPage + 1, totalPages - 2, totalPages - 1,
  ])).filter(p => p >= 0 && p < totalPages).sort((a, b) => a - b);

  const cells: (number | 'gap')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) cells.push('gap');
    cells.push(p);
  });

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={pageBtnClass(false)} disabled={currentPage === 0}
        aria-label="Previous page" onClick={() => onPageChange(currentPage - 1)}>
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>
      {cells.map((c, i) => c === 'gap'
        ? <span key={`gap-${i}`} className="px-1 text-outline-strong">…</span>
        : (
          <button
            key={c}
            type="button"
            className={pageBtnClass(c === currentPage)}
            onClick={() => onPageChange(c)}
          >
            <span className={MONO}>{c + 1}</span>
          </button>
        ))}
      <button type="button" className={pageBtnClass(false)} disabled={currentPage >= totalPages - 1}
        aria-label="Next page" onClick={() => onPageChange(currentPage + 1)}>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
};

const pageBtnClass = (active: boolean) =>
  'inline-flex h-7 min-w-[30px] items-center justify-center rounded px-2.5 py-1 transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  (active ? 'bg-primary font-bold text-on-primary' : 'bg-card text-ink hover:bg-surface-mid');

/**
 * Ma tran quyen: dong = kha nang That cua BE, lay tu chu thich `@PreAuthorize`
 * trong cac controller (doc source BE ngay 2026-10-19). Khong co endpoint "role permissions"
 * tren BE nen bang nay la tinh static - them dong moi phai tra loi source BE, khong tu nghi.
 */
const PERMISSION_MATRIX: { capability: string; roles: Role[] }[] = [
  { capability: 'Sign in and browse available interview slots', roles: ['ROLE_USER', 'ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Own profile, CV, cover letter, mock interviews', roles: ['ROLE_USER'] },
  { capability: 'Apply to job postings and track own applications', roles: ['ROLE_USER'] },
  { capability: 'Create and manage job postings', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Review and evaluate applications on jobs', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Cross-job application overview', roles: ['ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Manage own availability (interview slot calendar)', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Create, pay and cancel service-package orders', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'View all orders across the platform', roles: ['ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Configure service packages and pricing', roles: ['ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'Moderate reviews and handle bug reports', roles: ['ROLE_STAFF', 'ROLE_ADMIN'] },
  { capability: 'User directory: lock, enable, change role, invite, delete, audit log', roles: ['ROLE_ADMIN'] },
];

const ALL_ROLES: Role[] = ['ROLE_USER', 'ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'];

const RolePermissionsTab: React.FC = () => (
  <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-card">
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={`${thBase} px-3 text-left`}>Capability</th>
            {ALL_ROLES.map(r => (
              <th key={r} className={`${thBase} px-3 text-center`}>{ROLE_LABELS[r]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {PERMISSION_MATRIX.map(row => (
            <tr key={row.capability} className="transition-colors hover:bg-surface-low/60">
              <td className={tdClass}>{row.capability}</td>
              {ALL_ROLES.map(r => (
                <td key={r} className={`${tdClass} text-center`}>
                  {row.roles.includes(r)
                    ? <span className="material-symbols-outlined text-[18px] text-success-text">check_circle</span>
                    : <span className="material-symbols-outlined text-[18px] text-outline">remove</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="m-0 border-t border-[#e2e8f0] bg-surface-low px-3 py-2 text-body-sm text-ink-variant">
      Source: Spring `@PreAuthorize` rules in the backend controllers. There is no role-permission API yet.
    </p>
  </div>
);

// Icon + nền cho từng nhóm audit action (mockup: "Recent Security & Access Log" dạng tile).
const AUDIT_TILE = (action: string, succeeded: boolean): { cls: string; icon: string } => {
  if (!succeeded) return { cls: 'bg-danger-bg text-danger-text', icon: 'error' };
  if (['LOCK_USER', 'DISABLE_USER', 'DELETE_USER', 'REVOKE_INVITATION'].includes(action)) {
    return { cls: 'bg-danger-bg text-danger-text', icon: 'lock' };
  }
  if (['UNLOCK_USER', 'ENABLE_USER', 'RESTORE_USER', 'INVITE_USER', 'RESEND_INVITATION'].includes(action)) {
    return { cls: 'bg-success-bg text-success-text', icon: action.startsWith('INVITE') || action === 'RESEND_INVITATION' ? 'person_add' : 'lock_open' };
  }
  if (['CHANGE_ROLE', 'UPDATE_PROFILE', 'RESET_PASSWORD'].includes(action)) {
    return { cls: 'bg-info text-info-text', icon: action === 'RESET_PASSWORD' ? 'key' : 'shield' };
  }
  return { cls: 'bg-surface-mid text-ink-variant', icon: 'history' };
};

const AuditLogTab: React.FC<{
  logs: PagedResponse<AuditLog> | null;
  filters: { action: string; from: string; to: string; targetUserId?: number };
  page: number;
  onPageChange: (p: number) => void;
  onApplyFilters: (f: { action: string; from: string; to: string; targetUserId?: number }) => void;
}> = ({ logs, filters, page, onPageChange, onApplyFilters }) => {
  const [action, setAction] = useState(filters.action);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  if (!logs) return <LoadingState />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-headline-md text-ink">Recent Security &amp; Access Log</h2>
        <p className="m-0 text-body-sm text-ink-variant">
          Audit trail of administrative role changes, invitation actions, and account state changes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e2e8f0] bg-card p-3">
        <span className="material-symbols-outlined text-[18px] text-ink-variant">filter_list</span>
        <select className={filterSelectClass} value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{AUDIT_ACTION_LABELS[a] ?? a}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-label-md text-ink-variant">
          From
          <input type="date" className={`${filterSelectClass} tabular-nums`} value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-1.5 text-label-md text-ink-variant">
          To
          <input type="date" className={`${filterSelectClass} tabular-nums`} value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <button type="button" className={buttonClass('secondary')}
          onClick={() => onApplyFilters({ action, from, to, targetUserId: filters.targetUserId })}>
          Apply
        </button>
        {filters.targetUserId && (
          <button type="button" className={buttonClass('ghost')}
            onClick={() => { setAction(''); setFrom(''); setTo(''); onApplyFilters({ action: '', from: '', to: '' }); }}>
            <span className="material-symbols-outlined text-[16px]">close</span>
            Clear user filter (#{filters.targetUserId})
          </button>
        )}
      </div>

      <div className="divide-y divide-[#e2e8f0] overflow-hidden rounded-xl border border-[#e2e8f0] bg-card">
        {logs.content.length === 0 && (
          <p className="px-3 py-12 text-center text-body-sm text-ink-variant">No logs yet</p>
        )}
        {logs.content.map(l => {
          const tile = AUDIT_TILE(l.action, l.succeeded);
          const target = l.targetUserId == null
            ? null
            : (l.targetEmail ? `${l.targetFullName ?? ''} — ${l.targetEmail}` : `#${l.targetUserId}`);
          return (
            <div key={l.id} className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-surface-low/60">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tile.cls}`}>
                  <span className="material-symbols-outlined text-[18px]">{tile.icon}</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-label-md font-semibold text-ink">
                      {AUDIT_ACTION_LABELS[l.action] ?? l.action}
                    </span>
                    {target && <span className="truncate text-body-sm text-ink-variant">{target}</span>}
                    {!l.succeeded && (
                      <span className="text-body-sm text-danger-text">{l.reason ?? 'Rejected'}</span>
                    )}
                  </div>
                  <span className="text-body-sm text-ink-variant">
                    by {l.adminEmail}
                    {l.detail ? ` · ${l.detail}` : ''}
                  </span>
                </div>
              </div>
              <span
                className="shrink-0 text-body-sm tabular-nums text-ink-variant"
                title={fmtDateTime(l.createdAt)}
              >
                {relativeOf(l.createdAt).text}
              </span>
            </div>
          );
        })}
      </div>
      {logs.totalPages > 1 && (
        <div className="flex justify-center rounded-xl border border-[#e2e8f0] bg-card p-2">
          <Pager currentPage={page} totalPages={logs.totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
