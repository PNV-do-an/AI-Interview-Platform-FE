import React, { useCallback, useEffect, useState } from 'react';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import {
  AuditLog, AUDIT_ACTIONS, PagedResponse, Role, ROLE_LABELS, UserDetail, UserSummary,
} from '../../models/User.model';
import ConfirmDialog from '../components/ConfirmDialog';
import EditProfileModal from '../components/EditProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import UserDetailModal from '../components/UserDetailModal';
import {
  Badge, ErrorBanner, LoadingState, PageHeader, StatusBadge, statusTone,
  buttonClass, inputClass, tableClass, tdClass, thClass,
} from '../components/ui';

const AUDIT_ACTION_LABELS: Record<string, string> = {
  VIEW_USER: 'Viewed account', LOCK_USER: 'Locked account', UNLOCK_USER: 'Unlocked account',
  ENABLE_USER: 'Enabled account', DISABLE_USER: 'Disabled account', DELETE_USER: 'Deleted account',
  RESTORE_USER: 'Restored account', RESET_PASSWORD: 'Sent password reset', CHANGE_ROLE: 'Changed role',
  INVITE_USER: 'Invited member', RESEND_INVITATION: 'Resent invitation', REVOKE_INVITATION: 'Revoked invitation',
  UPDATE_PROFILE: 'Updated profile', EXPORT_USERS: 'Exported CSV',
};

const ROLE_ICONS: Record<Role, string> = {
  ROLE_USER: 'school', ROLE_STAFF: 'badge', ROLE_ADMIN: 'admin_panel_settings', ROLE_INTERVIEWER: 'support_agent',
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

// Cot "Last Active" theo mockup: "10 mins ago" / "3 days ago"; chua tung login -> "Never".
const fmtLastActive = (iso: string | null): string => {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return fmtDate(iso);
};

type TabType = 'users' | 'pending' | 'deleted' | 'permissions' | 'auditLogs';

// inputClass ép `w-full` nên select dùng bản riêng (bỏ w-full) để bo theo nội dung.
const selectClass =
  'h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink ' +
  'transition-all focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const AdminUserManagementPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const [tab, setTab] = useState<TabType>('users');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deletedSearchInput, setDeletedSearchInput] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
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
      async () => { closeConfirm(); await ctrl.deleteUser(id); },
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

  const switchTab = (t: TabType) => {
    setTab(t);
    if (t === 'auditLogs' && !ctrl.auditLogs) ctrl.fetchAuditLogs(0);
    if (t === 'deleted' && !ctrl.deletedUsers) ctrl.fetchDeletedUsers(0);
    // Tab "Pending Invites" = danh sách thật với bộ lọc status=PENDING (BE UserStatusFilter.PENDING),
    // nen dong bo chon vao select trang thai de user thay dung phan dang xem.
    if (t === 'pending') {
      setStatusFilter('PENDING');
      ctrl.applyFilters({ search: searchInput, status: 'PENDING', role: roleFilter });
    }
  };

  const handleViewHistory = (id: number) => {
    ctrl.setSelectedUser(null);
    setTab('auditLogs');
    ctrl.applyAuditFilters({ action: '', from: '', to: '', targetUserId: id });
  };

  const handleExport = () => { void ctrl.exportUsersCsv(); };

  return (
    <div>
      <PageHeader
        title="User Directory"
        description="Every account on the platform, with the audit trail of admin actions."
        actions={
          <>
            <button
              type="button"
              className={buttonClass('secondary')}
              onClick={handleExport}
              disabled={ctrl.exporting}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {ctrl.exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => setInviteOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Invite Members
            </button>
          </>
        }
      />

      {/* KPI cards - GET /users/stats dem bang that trong DB, cung bo loc search/role voi danh sach. */}
      {ctrl.stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            label="Total Members" icon="group" value={ctrl.stats.total}
            sub={`${ctrl.stats.active.toLocaleString('en-US')} active`}
          />
          <KpiCard
            label="Active (30 days)" icon="bolt" value={ctrl.stats.activeLast30Days}
            sub={ctrl.stats.total > 0
              ? `${Math.round((ctrl.stats.activeLast30Days / ctrl.stats.total) * 100)}% signed in recently`
              : 'No accounts yet'}
          />
          <KpiCard
            label="Pending Invitations" icon="hourglass_top" value={ctrl.stats.pendingVerification}
            sub="Invitation link not used yet"
          />
          <KpiCard
            label="Suspended / Locked" icon="lock" value={ctrl.stats.locked}
            sub={`${ctrl.stats.disabled.toLocaleString('en-US')} disabled · ${ctrl.stats.deleted.toLocaleString('en-US')} deleted`}
            danger={ctrl.stats.locked > 0}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex border-b border-[#e2e8f0]">
        {([
          { key: 'users', label: 'All Members', icon: 'group' },
          { key: 'pending', label: 'Pending Invites', icon: 'hourglass_top' },
          { key: 'permissions', label: 'Role Permissions', icon: 'key' },
          { key: 'deleted', label: 'Deleted', icon: 'person_off' },
          { key: 'auditLogs', label: 'Audit Log', icon: 'history' },
        ] as const).map(t => (
          <button
            key={t.key}
            type="button"
            className={`-mb-px flex h-9 items-center gap-1.5 border-b-2 px-4 text-label-md transition-colors ${
              tab === t.key
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent text-ink-variant hover:text-ink'
            }`}
            onClick={() => switchTab(t.key)}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
            {(t.key === 'users' || t.key === 'pending') && ctrl.stats && (
              <span className="rounded-full bg-surface-mid px-1.5 text-label-sm tabular-nums text-ink-variant">
                {(t.key === 'users' ? ctrl.stats.total : ctrl.stats.pendingVerification)
                  .toLocaleString('en-US')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      <ErrorBanner message={ctrl.error} />
      {ctrl.successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{ctrl.successMsg}</span>
        </div>
      )}

      {(tab === 'users' || tab === 'pending') && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-card p-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#94a3b8]">search</span>
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search by name, email, or user ID..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button type="button" className={buttonClass('primary', 'shrink-0')} onClick={handleSearch}>Search</button>

            <span className="material-symbols-outlined text-[18px] text-ink-variant">filter_list</span>
            <select className={selectClass} value={statusFilter}
              onChange={e => handleFilterChange('status', e.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
              <option value="PENDING">Pending invite</option>
              {/* DELETED bi BE chan o list nay (400) - xem tab "Deleted" */}
            </select>

            <select className={selectClass} value={roleFilter}
              onChange={e => handleFilterChange('role', e.target.value)}>
              <option value="">All roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {ctrl.loading ? (
            <LoadingState />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      {['User / Member', 'Assigned Role', 'Status', 'Joined Date', 'Last Active', 'Actions'].map(h => (
                        <th key={h} className={thClass}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ctrl.users?.content.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-12 text-center text-body-sm text-ink-variant">No data</td></tr>
                    )}
                    {ctrl.users?.content.map((u: UserSummary) => {
                      const ini = initialsOf(u.fullName);
                      return (
                        <tr
                          key={u.id}
                          className={`cursor-pointer transition-colors ${
                            ctrl.selectedUser?.id === u.id ? 'bg-info-bg' : 'hover:bg-surface-low'
                          }`}
                          onClick={() => ctrl.fetchUserDetail(u.id)}
                        >
                          <td className={tdClass}>
                            <div className="flex min-w-0 items-center gap-3">
                              {ini && (
                                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info text-label-sm font-bold text-info-text">
                                  {ini}
                                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${DOT_CLASS[statusTone(u.status)]}`} />
                                </div>
                              )}
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-headline-sm text-ink">{u.fullName}</span>
                                <span className="truncate text-body-sm text-ink-variant">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <Badge tone={u.role === 'ROLE_ADMIN' ? 'info' : 'neutral'} icon={ROLE_ICONS[u.role] ?? 'shield'}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </Badge>
                          </td>
                          <td className={tdClass}>
                            {u.pendingVerification
                              ? <Badge tone="warning" icon="hourglass_top">Pending invite</Badge>
                              : <StatusBadge status={u.status} />}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap font-mono tabular-nums text-ink-variant`}>
                            {fmtDate(u.createdAt)}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap tabular-nums text-ink-variant`}>
                            {fmtLastActive(u.lastLoginAt)}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`} onClick={e => e.stopPropagation()}>
                            <ActionButtons
                              user={u}
                              loading={ctrl.actionLoading}
                              onLock={() => ctrl.lockUser(u.id)}
                              onUnlock={() => ctrl.unlockUser(u.id)}
                              onEdit={() => void ctrl.loadProfileForEdit(u.id).then(p => p && setEditUser(p))}
                              onDelete={() => handleDelete(u.id, u.email)}
                              onReset={() => ctrl.resetPassword(u.id)}
                              onResendInvite={() => ctrl.resendInvitation(u.id)}
                              onRevokeInvite={() => askConfirm(
                                'Revoke invitation',
                                `Revoke the pending invitation link for "${u.email}"? The account keeps its role and can be invited again later.`,
                                async () => { closeConfirm(); await ctrl.revokeInvitation(u.id); },
                                { confirmLabel: 'Revoke link', danger: false },
                              )}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ctrl.users && ctrl.users.totalPages > 1 && (
                <Pagination
                  currentPage={ctrl.currentPage}
                  totalPages={ctrl.users.totalPages}
                  totalElements={ctrl.users.totalElements}
                  onPageChange={p => ctrl.fetchUsers(p)}
                />
              )}
            </>
          )}
        </>
      )}

      {tab === 'deleted' && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-card p-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#94a3b8]">search</span>
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search deleted accounts by name or email..."
                value={deletedSearchInput}
                onChange={e => setDeletedSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ctrl.fetchDeletedUsers(0, deletedSearchInput)}
              />
            </div>
            <button
              type="button"
              className={buttonClass('primary', 'shrink-0')}
              onClick={() => ctrl.fetchDeletedUsers(0, deletedSearchInput)}
            >
              Search
            </button>
          </div>

          {ctrl.loadingDeleted ? (
            <LoadingState />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      {['User / Member', 'Assigned Role', 'Joined Date', 'Deleted Date', 'Actions'].map(h => (
                        <th key={h} className={thClass}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ctrl.deletedUsers?.content.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-12 text-center text-body-sm text-ink-variant">No deleted accounts</td></tr>
                    )}
                    {ctrl.deletedUsers?.content.map((u: UserSummary) => {
                      const ini = initialsOf(u.fullName);
                      return (
                        <tr key={u.id} className="transition-colors hover:bg-surface-low">
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
                            <Badge tone="neutral" icon={ROLE_ICONS[u.role] ?? 'shield'}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </Badge>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap font-mono tabular-nums text-ink-variant`}>
                            {fmtDate(u.createdAt)}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap font-mono tabular-nums text-ink-variant`}>
                            {u.deletedAt ? fmtDate(u.deletedAt) : '—'}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`}>
                            <SmBtn
                              label="Restore" icon="restore" tone="success"
                              disabled={ctrl.actionLoading}
                              onClick={() => handleRestore(u.id, u.email)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {ctrl.deletedUsers && ctrl.deletedUsers.totalPages > 1 && (
                <Pagination
                  currentPage={ctrl.deletedPage}
                  totalPages={ctrl.deletedUsers.totalPages}
                  totalElements={ctrl.deletedUsers.totalElements}
                  onPageChange={p => ctrl.fetchDeletedUsers(p)}
                />
              )}
            </>
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

const KpiCard: React.FC<{
  label: string; icon: string; value: number; sub: string; danger?: boolean;
}> = ({ label, icon, value, sub, danger }) => (
  <div className="rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
    <div className="flex items-center justify-between gap-2">
      <p className="m-0 text-label-sm uppercase tracking-wider text-ink-variant">{label}</p>
      <span className={`material-symbols-outlined text-[18px] ${danger ? 'text-danger-text' : 'text-ink-variant'}`}>
        {icon}
      </span>
    </div>
    <p className={`mt-1 mb-0 text-metric-stat tabular-nums ${danger ? 'text-danger-text' : 'text-ink'}`}>
      {value.toLocaleString('en-US')}
    </p>
    <p className="mt-1 mb-0 text-body-sm text-ink-variant">{sub}</p>
  </div>
);

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
  <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
    <table className={tableClass}>
      <thead>
        <tr>
          <th className={thClass}>Capability</th>
          {ALL_ROLES.map(r => (
            <th key={r} className={`${thClass} text-center`}>{ROLE_LABELS[r]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PERMISSION_MATRIX.map(row => (
          <tr key={row.capability}>
            <td className={tdClass}>{row.capability}</td>
            {ALL_ROLES.map(r => (
              <td key={r} className={`${tdClass} text-center`}>
                {row.roles.includes(r)
                  ? <span className="material-symbols-outlined text-[18px] text-success-text">check_circle</span>
                  : <span className="material-symbols-outlined text-[18px] text-[#cbd5e1]">remove</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <p className="m-0 px-3 py-2 text-body-sm text-ink-variant">
      Source: Spring `@PreAuthorize` rules in the backend controllers. There is no role-permission API yet.
    </p>
  </div>
);

type ActionTone = 'success' | 'warning' | 'info' | 'danger';

const ACTION_TONE: Record<ActionTone, string> = {
  success: 'bg-success-bg text-success-text',
  warning: 'bg-[#fffbeb] text-[#92400e]',
  info: 'bg-info-bg text-info-text',
  danger: 'bg-danger-bg text-danger-text',
};

const ActionButtons: React.FC<{
  user: UserSummary;
  loading: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReset: () => void;
  onResendInvite: () => void;
  onRevokeInvite: () => void;
}> = ({ user, loading, onLock, onUnlock, onEdit, onDelete, onReset, onResendInvite, onRevokeInvite }) => {
  if (user.status === 'DELETED') return <span className="text-body-sm text-ink-variant">—</span>;

  // Tài khoản chờ mời chưa đặt mật khẩu nên Lock/Reset PW chưa có nghĩa - chỉ Resend/Revoke.
  if (user.pendingVerification) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <SmBtn label="Resend" icon="send" tone="info" disabled={loading} onClick={onResendInvite} />
        <SmBtn label="Revoke" icon="link_off" tone="warning" disabled={loading} onClick={onRevokeInvite} />
        <IconBtn label="Edit profile" icon="edit" disabled={loading} onClick={onEdit} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {user.status === 'LOCKED'
        ? <SmBtn label="Unlock" icon="lock_open" tone="success" disabled={loading} onClick={onUnlock} />
        : <SmBtn label="Lock" icon="lock" tone="warning" disabled={loading} onClick={onLock} />
      }
      <SmBtn label="Reset PW" icon="key" tone="info" disabled={loading} onClick={onReset} />
      <IconBtn label="Edit profile" icon="edit" disabled={loading} onClick={onEdit} />
      <SmBtn label="Delete" icon="delete" tone="danger" disabled={loading} onClick={onDelete} />
    </div>
  );
};

const IconBtn: React.FC<{ label: string; icon: string; disabled?: boolean; onClick: () => void }> = ({
  label, icon, disabled, onClick,
}) => (
  <button
    type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-variant transition-colors hover:bg-surface-low hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span className="material-symbols-outlined text-[16px]">{icon}</span>
  </button>
);

const SmBtn: React.FC<{
  label: string; icon: string; tone: ActionTone; disabled?: boolean; onClick: () => void;
}> = ({ label, icon, tone, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick} disabled={disabled}
    className={`inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-label-sm font-medium transition-[filter] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 ${ACTION_TONE[tone]}`}
  >
    <span className="material-symbols-outlined text-[16px]">{icon}</span>
    {label}
  </button>
);

const Pagination: React.FC<{
  currentPage: number; totalPages: number; totalElements: number;
  onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, totalElements, onPageChange }) => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
    <span className="text-body-sm tabular-nums text-ink-variant">
      Total: {totalElements.toLocaleString('en-US')} users
    </span>
    <div className="flex items-center gap-1">
      <button type="button" className={pageBtnClass(false)} disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => i)
        .filter(p => Math.abs(p - currentPage) <= 2)
        .map(p => (
          <button
            key={p}
            type="button"
            className={pageBtnClass(p === currentPage)}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
      <button type="button" className={pageBtnClass(false)} disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}>›</button>
    </div>
  </div>
);

const pageBtnClass = (active: boolean) =>
  `inline-flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 text-label-sm tabular-nums ` +
  `transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    active
      ? 'border-primary bg-primary text-on-primary'
      : 'border-[#e2e8f0] bg-card text-ink hover:bg-surface-low'
  }`;

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
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-card p-3">
        <span className="material-symbols-outlined text-[18px] text-ink-variant">filter_list</span>
        <select className={selectClass} value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{AUDIT_ACTION_LABELS[a] ?? a}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-label-md text-ink-variant">
          From
          <input type="date" className={`${inputClass} w-auto`} value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-1.5 text-label-md text-ink-variant">
          To
          <input type="date" className={`${inputClass} w-auto`} value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <button type="button" className={buttonClass('primary')}
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

      <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
        <table className={tableClass}>
          <thead>
            <tr>
              {['Admin', 'Action', 'Target user', 'Detail', 'Result', 'Time'].map(h => (
                <th key={h} className={thClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.content.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-body-sm text-ink-variant">No logs yet</td></tr>
            )}
            {logs.content.map(l => (
              <tr key={l.id} className="transition-colors hover:bg-surface-low">
                <td className={`${tdClass} break-all`}>{l.adminEmail}</td>
                <td className={tdClass}>
                  <Badge tone={l.succeeded ? 'info' : 'danger'} icon={l.succeeded ? 'verified_user' : 'error'}>
                    {AUDIT_ACTION_LABELS[l.action] ?? l.action}
                  </Badge>
                </td>
                <td className={`${tdClass} min-w-0`}>
                  {l.targetUserId == null ? '—' : (
                    l.targetEmail ? (
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-body-sm text-ink">{l.targetFullName ?? ''}</span>
                        <span className="truncate text-body-sm text-ink-variant">{l.targetEmail}</span>
                      </div>
                    ) : <span className="tabular-nums text-body-sm text-ink-variant">#{l.targetUserId}</span>
                  )}
                </td>
                <td className={`${tdClass} max-w-[240px] truncate`}>{l.detail ?? '—'}</td>
                <td className={tdClass}>
                  {l.succeeded
                    ? <span className="text-body-sm text-success-text">OK</span>
                    : <span className="text-body-sm text-danger-text" title={l.reason ?? ''}>{l.reason ?? 'Rejected'}</span>}
                </td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                  {fmtDateTime(l.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.totalPages > 1 && (
        <Pagination
          currentPage={page} totalPages={logs.totalPages}
          totalElements={logs.totalElements} onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default AdminUserManagementPage;
