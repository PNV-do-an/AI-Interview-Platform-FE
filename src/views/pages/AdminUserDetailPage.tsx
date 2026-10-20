/**
 * DATA page — Hồ sơ người dùng (mockup screen_22 "Admin user detail").
 * Nguồn thật: GET /admin/users/{id} (UserDetail) + GET /admin/audit-logs?targetUserId={id}.
 * Block mockup bỏ vì BE không có endpoint/field: ảnh avatar + dot "đang kết nối", thẻ AI
 * readiness 94%, tab "Hoạt động" (số đơn/số phiên/buổi tư vấn + timeline), IP & last-login,
 * kỹ năng / CV / ngày sinh / địa điểm / mục tiêu nghề nghiệp.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #6366f1 viền focus ô chọn role,
 * #fffbeb + #92400e amber-50/800 (chip và dòng ghi chú cảnh báo).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import {
  ACCOUNT_STATUS_LABELS, AuditLog, PagedResponse, Role, ROLE_LABELS, UserDetail,
} from '../../models/User.model';
import ConfirmDialog from '../components/ConfirmDialog';
import { parseServerTimestamp } from '../../utils/date';
import {
  Badge, ErrorBanner, LoadingState, buttonClass, statusTone, tableClass, tdClass, thClass,
} from '../components/ui';

const MONO = 'font-mono text-label-sm';

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

const ROLE_PILL: Record<Role, string> = {
  ROLE_USER: 'bg-primary/10 text-primary',
  ROLE_STAFF: 'bg-info text-secondary',
  ROLE_INTERVIEWER: 'bg-surface-mid text-ink',
  ROLE_ADMIN: 'bg-info text-primary font-semibold',
};

const fmtDate = (iso: string) =>
  (parseServerTimestamp(iso) ?? new Date(NaN)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  (parseServerTimestamp(iso) ?? new Date(NaN)).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const initialsOf = (name: string): string | null => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return null;
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

const relativeOf = (iso: string | null): string => {
  if (!iso) return 'Never';
  const stamp = parseServerTimestamp(iso);
  if (!stamp) return 'Never';
  const mins = Math.floor((Date.now() - stamp.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return fmtDate(iso);
};

type TabKey = 'profile' | 'history';

const AdminUserDetailPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const validId = Number.isInteger(userId) && userId > 0;

  const [tab, setTab] = useState<TabKey>('profile');
  const [roleDraft, setRoleDraft] = useState<Role | ''>('');
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; confirmLabel: string; danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, onConfirm: () => {} });

  const user: UserDetail | null = ctrl.selectedUser?.id === userId ? ctrl.selectedUser : null;

  const ctrlRef = useRef(ctrl);
  ctrlRef.current = ctrl;

  // Chi tai tai khi doi id: `ctrl` la object moi sau moi render nen dua no vao deps
  // se tao vong lap fetch -> setState -> fetch, moi vong ghi them 1 dong VIEW_USER vao audit log.
  useEffect(() => {
    if (!validId) return;
    const c = ctrlRef.current;
    void c.fetchUserDetail(userId);
    void c.fetchAuditLogs(0, { action: '', from: '', to: '', targetUserId: userId });
  }, [validId, userId]);

  useEffect(() => {
    if (user) setRoleDraft(user.role);
  }, [user]);

  const ask = (
    title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void,
  ) => setConfirm({ open: true, title, message, confirmLabel, danger, onConfirm });

  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

  const statusLabel = useMemo(() => {
    if (!user) return '';
    if (user.locked) return ACCOUNT_STATUS_LABELS.LOCKED;
    if (user.pendingVerification) return ACCOUNT_STATUS_LABELS.PENDING;
    if (!user.enabled) return ACCOUNT_STATUS_LABELS.INACTIVE;
    return ACCOUNT_STATUS_LABELS[user.status] ?? user.status;
  }, [user]);

  const tone = !user ? 'neutral' : user.locked || user.status === 'LOCKED'
    ? 'danger' : statusTone(user.status);

  const roleChanged = !!user && roleDraft !== '' && roleDraft !== user.role;

  const metaRows: { icon: string; label: string; value: React.ReactNode }[] = user ? [
    { icon: 'calendar_today', label: 'Account created', value: fmtDateTime(user.createdAt) },
    { icon: 'schedule', label: 'Last updated', value: relativeOf(user.updatedAt) },
    {
      icon: 'verified_user',
      label: 'Email verification',
      value: user.pendingVerification ? (
        <span className="inline-flex items-center gap-1 font-semibold text-[#92400e]">
          <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
          Pending
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-semibold text-success-text">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Verified
        </span>
      ),
    },
    { icon: 'call', label: 'Phone', value: user.phone || <span className="italic text-ink-variant">Not provided</span> },
  ] : [];

  if (!validId) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorBanner message="Invalid user id in the URL." />
        <Link to="/admin/users" className={buttonClass('secondary', 'w-fit')}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to user list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1 text-body-sm text-ink-variant">
            <Link to="/admin/users" className="flex items-center gap-1 hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">group</span>
              Users
            </Link>
            <span className="material-symbols-outlined text-[14px] text-outline-strong">chevron_right</span>
            <span className="font-semibold text-ink">{user?.fullName ?? `#${userId}`}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 text-headline-lg text-ink">User profile</h1>
            <span className={`rounded-full bg-surface-mid px-2.5 py-0.5 ${MONO} text-ink-variant`}>
              #{userId}
            </span>
          </div>
        </div>
        <Link to="/admin/users" className={buttonClass('secondary')}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to list
        </Link>
      </div>

      <ErrorBanner message={ctrl.error} />
      {ctrl.successMsg && (
        <div className="-mt-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{ctrl.successMsg}</span>
        </div>
      )}

      {!user ? (
        <LoadingState label="Loading account…" />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          {/* Left column: snapshot + actions */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex flex-col items-center rounded-xl border border-[#e2e8f0] bg-card p-5 text-center shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              {(() => {
                const ini = initialsOf(user.fullName);
                return ini && (
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full text-headline-md font-bold ${
                    tone === 'danger' ? 'bg-danger-bg text-danger-text' : 'bg-info text-info-text'
                  }`}
                  >
                    {ini}
                  </div>
                );
              })()}
              <h2 className="mt-3 mb-0 text-headline-md text-ink">{user.fullName}</h2>
              <p className="mt-1 mb-0 flex items-center gap-1 text-body-md text-ink-variant">
                <span className="material-symbols-outlined text-[16px] text-outline-strong">mail</span>
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-medium ${ROLE_PILL[user.role]}`}>
                  <span className="material-symbols-outlined text-[14px]">{ROLE_ICONS[user.role]}</span>
                  {ROLE_LABELS[user.role]}
                </span>
                <Badge tone={tone} pill dot>{statusLabel}</Badge>
              </div>

              <div className="my-4 h-px w-full bg-surface-high" />

              <div className="flex w-full flex-col gap-1.5 text-left text-body-sm">
                {metaRows.map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-ink-variant">
                      <span className="material-symbols-outlined text-[16px] text-outline-strong">{r.icon}</span>
                      {r.label}
                    </span>
                    <span className="text-right text-label-md text-ink">{r.value}</span>
                  </div>
                ))}
                {user.blockedUntil && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-danger-bg/60 px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-danger-text">
                      <span className="material-symbols-outlined text-[16px]">timer_off</span>
                      Sign-in blocked until
                    </span>
                    <span className={`${MONO} text-danger-text`}>{fmtDateTime(user.blockedUntil)}</span>
                  </div>
                )}
                {user.failedLoginAttempts > 0 && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-ink-variant">
                      <span className="material-symbols-outlined text-[16px] text-outline-strong">lock_reset</span>
                      Failed sign-in attempts
                    </span>
                    <span className={`${MONO} font-semibold ${tone === 'danger' ? 'text-danger-text' : 'text-ink'}`}>
                      {user.failedLoginAttempts}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex w-full flex-col gap-1.5">
                {user.locked ? (
                  <button
                    type="button"
                    className={buttonClass('secondary', 'w-full bg-success-bg text-success-text hover:brightness-95')}
                    disabled={ctrl.actionLoading}
                    onClick={() => ask(
                      'Unlock account',
                      `Unlock "${user.email}"? The member regains sign-in access immediately.`,
                      'Unlock', false,
                      () => { closeConfirm(); void ctrl.unlockUser(user.id); },
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    Unlock account
                  </button>
                ) : (
                  <button
                    type="button"
                    className={buttonClass('secondary', 'w-full bg-danger-bg text-danger-text hover:brightness-95')}
                    disabled={ctrl.actionLoading}
                    onClick={() => ask(
                      'Lock account',
                      `Lock "${user.email}"? The member immediately loses sign-in access until an admin unlocks the account.`,
                      'Lock', true,
                      () => { closeConfirm(); void ctrl.lockUser(user.id); },
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Lock account
                  </button>
                )}
                <button
                  type="button"
                  className={buttonClass('secondary', 'w-full')}
                  disabled={ctrl.actionLoading}
                  onClick={() => ask(
                    user.enabled ? 'Disable account' : 'Enable account',
                    user.enabled
                      ? `Disable "${user.email}"? The account stays in the directory but cannot sign in.`
                      : `Enable "${user.email}"? Sign-in access is restored.`,
                    user.enabled ? 'Disable' : 'Enable', user.enabled,
                    () => { closeConfirm(); void ctrl.setUserStatus(user.id, !user.enabled); },
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {user.enabled ? 'block' : 'check_circle'}
                  </span>
                  {user.enabled ? 'Disable account' : 'Enable account'}
                </button>
                <button
                  type="button"
                  className={buttonClass('secondary', 'w-full')}
                  disabled={ctrl.actionLoading}
                  onClick={() => ask(
                    'Send password reset',
                    `Send a password-reset email to "${user.email}"? The link expires according to the security policy.`,
                    'Send email', false,
                    () => { closeConfirm(); void ctrl.resetPassword(user.id); },
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  Send password reset
                </button>
              </div>
            </div>

            {/* Change role */}
            <div className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                <h3 className="m-0 text-headline-sm text-ink">Assigned role</h3>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">
                Changing the role updates permissions across the platform immediately.
              </p>
              <select
                className="h-9 w-full box-border cursor-pointer rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                value={roleDraft === '' ? user.role : roleDraft}
                disabled={ctrl.actionLoading}
                onChange={e => setRoleDraft(e.target.value as Role)}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                className={buttonClass('primary', 'w-full')}
                disabled={!roleChanged || ctrl.actionLoading}
                onClick={() => ask(
                  'Change role',
                  `Assign the role "${ROLE_LABELS[roleDraft as Role]}" to "${user.email}"?`,
                  'Change role', false,
                  () => { closeConfirm(); void ctrl.changeRole(user.id, roleDraft as Role); },
                )}
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                {ctrl.actionLoading ? 'Applying…' : 'Apply role'}
              </button>
            </div>
          </div>

          {/* Right column: tabs */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="flex items-center gap-2 border-b border-[#e2e8f0]">
              {([
                { key: 'profile' as TabKey, label: 'Profile', icon: 'person' },
                { key: 'history' as TabKey, label: 'Audit history', icon: 'history' },
              ]).map(t => (
                <button
                  key={t.key}
                  type="button"
                  className={`-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-label-md transition-colors ${
                    tab === t.key
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-ink-variant hover:text-ink'
                  }`}
                  onClick={() => setTab(t.key)}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
                  {t.key === 'history' && ctrl.auditLogs && (
                    <span className={`rounded-full px-1.5 py-0.5 ${MONO} font-semibold tabular-nums ${
                      tab === t.key ? 'bg-primary/10 text-primary' : 'bg-surface-mid text-ink-variant'
                    }`}
                    >
                      {ctrl.auditLogs.totalElements.toLocaleString('en-US')}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'profile' ? (
              <ProfileTab user={user} />
            ) : (
              <HistoryTab
                logs={ctrl.auditLogs}
                page={ctrl.auditPage}
                onPageChange={p => void ctrl.fetchAuditLogs(p, { action: '', from: '', to: '', targetUserId: userId })}
              />
            )}
          </div>
        </div>
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
    </div>
  );
};

// ── Profile tab ─────────────────────────────────────────────────────────────

/** Mockup hiển thị thêm ngày sinh / địa điểm / kinh nghiệm / kỹ năng / CV — BE không trả các field này nên bỏ. */
const ProfileTab: React.FC<{ user: UserDetail }> = ({ user }) => (
  <div className="flex flex-col gap-4">
    <div className="rounded-xl border border-[#e2e8f0] bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <h2 className="m-0 text-headline-sm text-ink">Account information</h2>
        <Badge tone="neutral" icon="lock">Read-only</Badge>
      </div>
      <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: 'Full name', value: user.fullName },
          { label: 'Email address', value: user.email },
          { label: 'Phone number', value: user.phone || 'Not provided' },
          { label: 'Assigned role', value: ROLE_LABELS[user.role] },
          { label: 'Account status', value: ACCOUNT_STATUS_LABELS[user.status] ?? user.status },
          { label: 'Sign-in enabled', value: user.enabled ? 'Enabled' : 'Disabled' },
          { label: 'Created', value: fmtDateTime(user.createdAt) },
          { label: 'Last updated', value: fmtDateTime(user.updatedAt) },
        ].map(row => (
          <div key={row.label} className="flex flex-col gap-0.5 rounded-lg bg-surface-low px-3 py-2.5">
            <dt className="text-label-sm uppercase tracking-wider text-ink-variant">{row.label}</dt>
            <dd className="text-label-md font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>

    <div className="rounded-xl border border-[#e2e8f0] bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 pb-3">
        <span className="material-symbols-outlined text-[18px] text-primary">shield_lock</span>
        <h2 className="m-0 text-headline-sm text-ink">Security state</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SecurityCell
          label="Email verification"
          value={user.pendingVerification ? 'Pending' : 'Verified'}
          tone={user.pendingVerification ? 'warning' : 'success'}
        />
        <SecurityCell
          label="Locked by admin"
          value={user.locked ? (user.lockedAt ? fmtDateTime(user.lockedAt) : 'Locked') : 'No'}
          tone={user.locked ? 'danger' : 'neutral'}
        />
        <SecurityCell
          label="Failed sign-in attempts"
          value={String(user.failedLoginAttempts)}
          tone={user.failedLoginAttempts > 0 ? 'warning' : 'neutral'}
        />
      </div>
      {user.deletedAt && (
        <p className="m-0 pt-3 text-body-sm text-danger-text">
          This account was deleted on {fmtDateTime(user.deletedAt)} and can be restored from the Deleted tab.
        </p>
      )}
    </div>
  </div>
);

const SecurityCell: React.FC<{ label: string; value: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = ({
  label, value, tone,
}) => (
  <div className={`flex flex-col gap-1 rounded-lg px-3 py-2.5 ${
    {
      neutral: 'bg-surface-low text-ink',
      success: 'bg-success-bg text-success-text',
      warning: 'bg-[#fffbeb] text-[#92400e]',
      danger: 'bg-danger-bg text-danger-text',
    }[tone]
  }`}
  >
    <span className="text-label-sm uppercase tracking-wider opacity-80">{label}</span>
    <span className="text-label-md font-semibold">{value}</span>
  </div>
);

// ── History tab ─────────────────────────────────────────────────────────────

const HistoryTab: React.FC<{
  logs: PagedResponse<AuditLog> | null;
  page: number;
  onPageChange: (p: number) => void;
}> = ({ logs, page, onPageChange }) => {
  if (!logs) return <LoadingState label="Loading audit history…" />;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-headline-sm text-ink">Administrative actions on this account</h2>
          <p className="m-0 text-body-sm text-ink-variant">
            Every admin action recorded by the audit service, newest first.
          </p>
        </div>
        <Badge tone="info" icon="receipt_long">
          {logs.totalElements.toLocaleString('en-US')} entries
        </Badge>
      </div>
      <div className="overflow-x-auto border-t border-[#e2e8f0]">
        <table className={tableClass}>
          <thead>
            <tr>
              {['Time', 'Action', 'Detail', 'Performed by', 'Result'].map(h => (
                <th key={h} className={`${thClass} ${h === 'Result' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {logs.content.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-body-sm text-ink-variant">
                  No administrative actions recorded for this account yet.
                </td>
              </tr>
            )}
            {logs.content.map(l => (
              <tr key={l.id} className="transition-colors hover:bg-surface-low/60">
                <td className={`${tdClass} whitespace-nowrap ${MONO} text-ink-variant`} title={fmtDateTime(l.createdAt)}>
                  {relativeOf(l.createdAt)}
                </td>
                <td className={tdClass}>
                  <span className={`text-label-md font-semibold ${l.succeeded ? 'text-ink' : 'text-danger-text'}`}>
                    {AUDIT_ACTION_LABELS[l.action] ?? l.action}
                  </span>
                </td>
                <td className={`${tdClass} max-w-[22rem] text-body-sm text-ink-variant`}>
                  {l.detail || l.reason || '—'}
                </td>
                <td className={`${tdClass} whitespace-nowrap text-body-sm text-ink-variant`}>{l.adminEmail}</td>
                <td className={`${tdClass} whitespace-nowrap text-right`}>
                  <Badge tone={l.succeeded ? 'success' : 'danger'} pill icon={l.succeeded ? 'check_circle' : 'cancel'}>
                    {l.succeeded ? 'Succeeded' : 'Rejected'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] bg-surface-low px-5 py-3">
          <span className="text-body-sm tabular-nums text-ink-variant">
            Page {page + 1} of {logs.totalPages.toLocaleString('en-US')}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={buttonClass('secondary', 'h-7 px-2')}
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Previous
            </button>
            <button
              type="button"
              className={buttonClass('secondary', 'h-7 px-2')}
              disabled={page >= logs.totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;
