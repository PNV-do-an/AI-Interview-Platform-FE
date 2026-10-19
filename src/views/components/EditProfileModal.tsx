import React, { useEffect, useState } from 'react';
import { UserDetail } from '../../models/User.model';
import { buttonClass, inputClass, labelClass } from './ui';

/**
 * Modal sửa hồ sơ thành viên (PATCH /admin/users/{id}).
 * Doi email = he qua nang: BE ket hop nguoi do ve trang thai cho moi va thu hoi phien cu.
 */

interface Props {
  user: UserDetail | null;
  onClose: () => void;
  onSave: (id: number, input: { fullName?: string; email?: string; phone?: string }) => Promise<boolean>;
  actionLoading: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EditProfileModal: React.FC<Props> = ({ user, onClose, onSave, actionLoading }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone ?? '');
      setLocalError('');
    }
  }, [user]);

  if (!user) return null;

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();
  const phoneCleared = phone.trim() === '' && (user.phone ?? '') !== '';

  const submit = async () => {
    if (!fullName.trim()) return setLocalError('Full name is required');
    if (!EMAIL_PATTERN.test(email.trim())) return setLocalError('A valid email is required');
    setLocalError('');
    const input: { fullName?: string; email?: string; phone?: string } = { fullName: fullName.trim() };
    if (emailChanged) input.email = email.trim();
    if (phone.trim()) input.phone = phone.trim();
    else if (phoneCleared) input.phone = ''; // BE: phone = "" -> xoa so, khac "thieu truong = giu nguyen"
    if (!emailChanged && !phoneCleared && input.phone === undefined && fullName.trim() === user.fullName) {
      return setLocalError('Nothing to update');
    }
    const ok = await onSave(user.id, input);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] rounded-lg border border-[#e2e8f0] bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-headline-md text-ink">Edit Profile</h3>
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
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} />
          </div>
        </div>

        {emailChanged && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#fffbeb] px-3 py-2.5 text-body-sm text-[#92400e]" role="status">
            <span className="material-symbols-outlined shrink-0 text-[18px]">warning</span>
            <span>
              Saving a new email puts this account back to Pending invite: a fresh invitation link is
              sent and the member&apos;s existing sessions are signed out.
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" className={buttonClass('secondary')} onClick={onClose}>Cancel</button>
          <button type="button" className={buttonClass('primary')} onClick={submit} disabled={actionLoading}>
            {actionLoading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
