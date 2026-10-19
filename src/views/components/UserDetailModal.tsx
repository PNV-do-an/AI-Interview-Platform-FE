import React, { useState } from 'react';
import { Role, ROLE_LABELS, UserDetail } from '../../models/User.model';
import ConfirmDialog from './ConfirmDialog';
import { Badge, StatusBadge, buttonClass } from './ui';

/**
 * Modal chi tiết người dùng (nhóm trang admin).
 * Props API giữ nguyên.
 */

// inputClass ép `w-full` nên select dùng bản riêng (bỏ w-full) để bo theo nội dung.
const selectClass =
  'h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink ' +
  'transition-all focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

interface Props {
  user: UserDetail | null;
  onClose: () => void;
  onLock: (id: number) => void;
  onUnlock: (id: number) => void;
  onSetStatus: (id: number, enabled: boolean) => void;
  onDelete: (id: number) => void;
  onResetPassword: (id: number) => void;
  onChangeRole: (id: number, role: Role) => void;
  onViewHistory: (id: number) => void;
  onEditProfile: (user: UserDetail) => void;
  onResendInvitation: (id: number) => void;
  onRevokeInvitation: (id: number) => void;
  actionLoading: boolean;
}

type SmallTone = 'success' | 'warning' | 'info' | 'danger';

const SMALL_TONE: Record<SmallTone, string> = {
  success: 'bg-success-bg text-success-text',
  warning: 'bg-[#fffbeb] text-[#92400e]',
  info: 'bg-info-bg text-info-text',
  danger: 'bg-danger-bg text-danger-text',
};

const smallBtnClass = (tone: SmallTone) =>
  `inline-flex h-9 items-center gap-1 rounded-md px-3 text-label-md font-medium transition-[filter] ` +
  `hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 ${SMALL_TONE[tone]}`;

const UserDetailModal: React.FC<Props> = ({
  user, onClose, onLock, onUnlock, onSetStatus, onDelete, onResetPassword, onChangeRole,
  onViewHistory, onEditProfile, onResendInvitation, onRevokeInvitation, actionLoading,
}) => {
  const [confirmState, setConfirmState] = useState<null | {
    key: 'lock' | 'unlock' | 'reset' | 'changeRole' | 'enable' | 'disable' | 'revokeInvite';
    role?: Role;
  }>(null);

  const closeConfirm = () => setConfirmState(null);

  if (!user) return null;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('vi-VN') : '—';

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // ConfirmDialog lồng bên trong overlay này; chỉ đóng khi bấm đúng nền tối.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-headline-md text-ink">User Details</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-variant transition-colors hover:bg-surface-low hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <Row label="ID" value={<span className="tabular-nums">{String(user.id)}</span>} />
          <Row label="Email" value={user.email} />
          <Row label="Full name" value={user.fullName} />
          <Row label="Role" value={<Badge tone="neutral" icon="group">{ROLE_LABELS[user.role] || user.role}</Badge>} />
          <Row label="Status" value={<StatusBadge status={user.status} />} />
          {user.pendingVerification && (
            <Row
              label="Invitation"
              value={<Badge tone="warning" icon="hourglass_top">Pending invite — link not used yet</Badge>}
            />
          )}
          {user.phone && <Row label="Phone" value={user.phone} />}
          {user.blockedUntil && (
            <Row
              label="Login blocked"
              value={
                <span className="text-body-sm text-danger-text">
                  Until {fmtDate(user.blockedUntil)} ({user.failedLoginAttempts} failed attempts)
                </span>
              }
            />
          )}
          {user.locked && user.lockedAt && <Row label="Locked by admin" value={<span className="tabular-nums">{fmtDate(user.lockedAt)}</span>} />}
          <Row label="Created" value={<span className="tabular-nums">{fmtDate(user.createdAt)}</span>} />
          <Row label="Updated" value={<span className="tabular-nums">{fmtDate(user.updatedAt)}</span>} />
          {user.deletedAt && <Row label="Deleted" value={<span className="tabular-nums">{fmtDate(user.deletedAt)}</span>} />}
        </div>

        {user.status !== 'DELETED' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#e2e8f0] pt-4">
            {user.status === 'LOCKED'
              ? <Btn label="Unlock" icon="lock_open" tone="success" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'unlock' })} />
              : <Btn label="Lock account" icon="lock" tone="warning" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'lock' })} />
            }
            {user.enabled
              ? <Btn label="Disable" icon="power_settings_new" tone="warning" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'disable' })} />
              : <Btn label="Enable" icon="power_settings_new" tone="success" disabled={actionLoading}
                  onClick={() => onSetStatus(user.id, true)} />
            }
            <Btn label="Reset password" icon="key" tone="info" disabled={actionLoading}
              onClick={() => setConfirmState({ key: 'reset' })} />

            <select
              disabled={actionLoading}
              value={user.role}
              onChange={e => setConfirmState({ key: 'changeRole', role: e.target.value as Role })}
              className={selectClass}
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>

            {user.pendingVerification && (
              <>
                <Btn label="Resend invite" icon="send" tone="info" disabled={actionLoading}
                  onClick={() => onResendInvitation(user.id)} />
                <Btn label="Revoke invite" icon="link_off" tone="warning" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'revokeInvite' })} />
              </>
            )}

            <button type="button" onClick={() => onEditProfile(user)} disabled={actionLoading}
              className={buttonClass('secondary')}>
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit profile
            </button>

            <button type="button" onClick={() => onDelete(user.id)} disabled={actionLoading}
              className={buttonClass('danger')}>
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete account
            </button>

            <button type="button" onClick={() => onViewHistory(user.id)}
              className={buttonClass('ghost')}>
              <span className="material-symbols-outlined text-[16px]">history</span>
              View history
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={
          confirmState?.key === 'lock' ? 'Confirm account lock' :
          confirmState?.key === 'unlock' ? 'Confirm account unlock' :
          confirmState?.key === 'reset' ? 'Confirm password reset email' :
          confirmState?.key === 'changeRole' ? 'Confirm role change' :
          confirmState?.key === 'disable' ? 'Confirm account disable' :
          confirmState?.key === 'revokeInvite' ? 'Confirm invitation revoke' : 'Confirm'
        }
        message={
          confirmState?.key === 'lock' ? 'Lock this account? The user will no longer be able to sign in.' :
          confirmState?.key === 'unlock' ? 'Unlock this account?' :
          confirmState?.key === 'reset' ? 'A password reset email will be sent to ' + (user?.email ?? '') + '. Continue?' :
          confirmState?.key === 'changeRole' ? 'Change the role for this user?' :
          confirmState?.key === 'disable' ? 'Disable this account? Active sessions will be logged out.' :
          confirmState?.key === 'revokeInvite'
            ? 'Revoke the invitation link? The account keeps its role and can be invited again later with "Resend invite".'
            : ''
        }
        danger={confirmState?.key === 'lock' || confirmState?.key === 'disable'}
        confirmLabel={
          confirmState?.key === 'lock' ? 'Lock' :
          confirmState?.key === 'unlock' ? 'Unlock' :
          confirmState?.key === 'reset' ? 'Send email' :
          confirmState?.key === 'changeRole' ? 'Change role' :
          confirmState?.key === 'disable' ? 'Disable' :
          confirmState?.key === 'revokeInvite' ? 'Revoke link' : 'Confirm'
        }
        onCancel={closeConfirm}
        onConfirm={() => {
          if (!user || !confirmState) return;
          const s = confirmState;
          closeConfirm();
          if (s.key === 'lock') onLock(user.id);
          else if (s.key === 'unlock') onUnlock(user.id);
          else if (s.key === 'reset') onResetPassword(user.id);
          else if (s.key === 'changeRole' && s.role) onChangeRole(user.id, s.role);
          else if (s.key === 'disable') onSetStatus(user.id, false);
          else if (s.key === 'revokeInvite') onRevokeInvitation(user.id);
        }}
      />
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center gap-3 border-b border-[#e2e8f0] py-2 last:border-b-0">
    <span className="w-[110px] shrink-0 text-label-md text-ink-variant">{label}</span>
    <span className="min-w-0 flex-1 break-all text-body-md text-ink">{value}</span>
  </div>
);

const Btn: React.FC<{
  label: string; icon: string; tone: SmallTone; disabled?: boolean; onClick: () => void;
}> = ({ label, icon, tone, disabled, onClick }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={smallBtnClass(tone)}>
    <span className="material-symbols-outlined text-[16px]">{icon}</span>
    {label}
  </button>
);

export default UserDetailModal;
