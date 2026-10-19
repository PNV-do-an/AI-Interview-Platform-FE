import React, { useState } from 'react';
import { Role, ROLE_LABELS } from '../../models/User.model';
import { buttonClass, inputClass, labelClass } from './ui';

/**
 * Modal mời thành viên mới (tab User Directory, POST /admin/users).
 * BE tự sinh mật khẩu ngẫu nhiên vô dụng - người được mời đặt mật khẩu qua link email.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onInvite: (input: { fullName: string; email: string; role: Role; phone?: string }) => Promise<boolean>;
  actionLoading: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InviteMemberModal: React.FC<Props> = ({ open, onClose, onInvite, actionLoading }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ROLE_USER');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  if (!open) return null;

  const reset = () => { setFullName(''); setEmail(''); setRole('ROLE_USER'); setPhone(''); setLocalError(''); };

  const submit = async () => {
    if (!fullName.trim()) return setLocalError('Full name is required');
    if (!EMAIL_PATTERN.test(email.trim())) return setLocalError('A valid email is required');
    setLocalError('');
    const ok = await onInvite({
      fullName: fullName.trim(), email: email.trim(), role,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });
    if (ok) { reset(); onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] rounded-lg border border-[#e2e8f0] bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-headline-md text-ink">Invite Member</h3>
          <button
            type="button" onClick={onClose} aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-variant transition-colors hover:bg-surface-low hover:text-ink"
          >✕</button>
        </div>

        {localError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
            <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
            <span>{localError}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className={labelClass}>Full name</label>
            <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={role}
              onChange={e => setRole(e.target.value as Role)}
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} />
          </div>
        </div>

        <p className="mb-0 mt-3 text-body-sm text-ink-variant">
          The member receives an invitation email and sets their own password; no password is created here.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" className={buttonClass('secondary')} onClick={onClose}>Cancel</button>
          <button type="button" className={buttonClass('primary')} onClick={submit} disabled={actionLoading}>
            {actionLoading ? 'Sending...' : 'Send invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
