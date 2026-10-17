import React, { useCallback, useEffect, useState } from 'react';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import { Role, UserSummary } from '../../models/User.model';
import ConfirmDialog from '../components/ConfirmDialog';
import UserDetailModal from '../components/UserDetailModal';
import {
  Badge, ErrorBanner, LoadingState, PageHeader, StatusBadge,
  buttonClass, inputClass, tableClass, tdClass, thClass,
} from '../components/ui';

const ROLE_LABELS: Record<string, string> = {
  ROLE_USER: 'Candidate',
  ROLE_STAFF: 'Staff',
  ROLE_ADMIN: 'Administrator',
  ROLE_INTERVIEWER: 'Interviewer',
};

type TabType = 'users' | 'auditLogs';

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
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

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
    if (key === 'status') setStatusFilter(value);
    else setRoleFilter(value);
    ctrl.applyFilters(newFilters);
  }, [searchInput, statusFilter, roleFilter, ctrl]);

  const askConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmDialog({ open: true, title, message, onConfirm });

  const closeConfirm = () =>
    setConfirmDialog(d => ({ ...d, open: false }));

  const handleDelete = (id: number, email: string) => {
    askConfirm(
      'Delete account',
      `Are you sure you want to delete the account "${email}"? This action cannot be undone.`,
      async () => { closeConfirm(); await ctrl.deleteUser(id); },
    );
  };

  return (
    <div>
      <PageHeader title="User Directory" />

      {/* Tabs */}
      <div className="mb-6 flex border-b border-[#e2e8f0]">
        {(['users', 'auditLogs'] as TabType[]).map(t => (
          <button
            key={t}
            type="button"
            className={`-mb-px flex h-9 items-center gap-1.5 border-b-2 px-4 text-label-md transition-colors ${
              tab === t
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent text-ink-variant hover:text-ink'
            }`}
            onClick={() => {
              setTab(t);
              if (t === 'auditLogs' && !ctrl.auditLogs) ctrl.fetchAuditLogs(0);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">{t === 'users' ? 'group' : 'history'}</span>
            {t === 'users' ? 'Users' : 'Audit Log'}
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

      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#e2e8f0] bg-card p-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#94a3b8]">search</span>
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search by email or name..."
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
            </select>

            <select className={selectClass} value={roleFilter}
              onChange={e => handleFilterChange('role', e.target.value)}>
              <option value="">All roles</option>
              <option value="ROLE_USER">Candidate</option>
              <option value="ROLE_STAFF">Staff</option>
              <option value="ROLE_INTERVIEWER">Interviewer</option>
              <option value="ROLE_ADMIN">Administrator</option>
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
                      {['Email', 'Name', 'Role', 'Status', 'Registered', 'Actions'].map(h => (
                        <th key={h} className={thClass}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ctrl.users?.content.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-12 text-center text-body-sm text-ink-variant">No data</td></tr>
                    )}
                    {ctrl.users?.content.map((u: UserSummary) => (
                      <tr
                        key={u.id}
                        className={`cursor-pointer transition-colors ${
                          ctrl.selectedUser?.id === u.id ? 'bg-info-bg' : 'hover:bg-surface-low'
                        }`}
                        onClick={() => ctrl.fetchUserDetail(u.id)}
                      >
                        <td className={`${tdClass} break-all`}>{u.email}</td>
                        <td className={tdClass}>{u.fullName}</td>
                        <td className={tdClass}>
                          <Badge tone="neutral" icon="shield">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                        </td>
                        <td className={tdClass}>
                          <StatusBadge status={u.status} />
                        </td>
                        <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className={`${tdClass} whitespace-nowrap`} onClick={e => e.stopPropagation()}>
                          <ActionButtons
                            user={u}
                            loading={ctrl.actionLoading}
                            onLock={() => ctrl.lockUser(u.id)}
                            onUnlock={() => ctrl.unlockUser(u.id)}
                            onDelete={() => handleDelete(u.id, u.email)}
                            onReset={() => ctrl.resetPassword(u.id)}
                          />
                        </td>
                      </tr>
                    ))}
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

      {tab === 'auditLogs' && (
        <AuditLogTab
          logs={ctrl.auditLogs}
          page={ctrl.auditPage}
          onPageChange={ctrl.fetchAuditLogs}
        />
      )}

      {/* User detail modal */}
      <UserDetailModal
        user={ctrl.selectedUser}
        onClose={() => ctrl.setSelectedUser(null)}
        onLock={ctrl.lockUser}
        onUnlock={ctrl.unlockUser}
        onDelete={id => handleDelete(id, ctrl.selectedUser?.email ?? '')}
        onResetPassword={ctrl.resetPassword}
        onChangeRole={ctrl.changeRole}
        actionLoading={ctrl.actionLoading}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

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
  onDelete: () => void;
  onReset: () => void;
}> = ({ user, loading, onLock, onUnlock, onDelete, onReset }) => {
  if (user.status === 'DELETED') return <span className="text-body-sm text-ink-variant">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {user.status === 'LOCKED'
        ? <SmBtn label="Unlock" icon="lock_open" tone="success" disabled={loading} onClick={onUnlock} />
        : <SmBtn label="Lock" icon="lock" tone="warning" disabled={loading} onClick={onLock} />
      }
      <SmBtn label="Reset PW" icon="key" tone="info" disabled={loading} onClick={onReset} />
      <SmBtn label="Delete" icon="delete" tone="danger" disabled={loading} onClick={onDelete} />
    </div>
  );
};

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
      Total: {totalElements} users
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
  logs: any; page: number; onPageChange: (p: number) => void;
}> = ({ logs, page, onPageChange }) => {
  if (!logs) return <LoadingState />;
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
        <table className={tableClass}>
          <thead>
            <tr>
              {['Admin', 'Action', 'Target user', 'Detail', 'Time'].map(h => (
                <th key={h} className={thClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.content.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-12 text-center text-body-sm text-ink-variant">No logs yet</td></tr>
            )}
            {logs.content.map((l: any) => (
              <tr key={l.id} className="transition-colors hover:bg-surface-low">
                <td className={`${tdClass} break-all`}>{l.adminEmail}</td>
                <td className={tdClass}>
                  <Badge tone="info" icon="verified_user">{l.action}</Badge>
                </td>
                <td className={`${tdClass} tabular-nums`}>{l.targetUserId ?? '—'}</td>
                <td className={`${tdClass} max-w-[200px] truncate`}>
                  {l.detail ?? '—'}
                </td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                  {new Date(l.createdAt).toLocaleString('vi-VN')}
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
