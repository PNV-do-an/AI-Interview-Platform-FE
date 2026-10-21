import React, { useState } from 'react';
import { Role } from '../../models/User.model';
import { ICON, ROLE_VN, adminInputClass } from './adminKit';

/**
 * Modal #modal-add-user (screen_17) — POST /admin/users.
 * BE sinh mật khẩu ngẫu nhiên vô dụng; người được mời tự đặt mật khẩu qua link trong email.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onInvite: (input: { fullName: string; email: string; role: Role; phone?: string }) => Promise<boolean>;
  actionLoading: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_VALUES: Role[] = ['ROLE_USER', 'ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'];

const InviteMemberModal: React.FC<Props> = ({ open, onClose, onInvite, actionLoading }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ROLE_USER');
  const [localError, setLocalError] = useState('');

  if (!open) return null;

  const reset = () => { setFullName(''); setEmail(''); setRole('ROLE_USER'); setLocalError(''); };

  const submit = async () => {
    if (!fullName.trim()) return setLocalError('Họ và tên là bắt buộc.');
    if (!EMAIL_PATTERN.test(email.trim())) return setLocalError('Email đăng nhập chưa hợp lệ.');
    setLocalError('');
    const ok = await onInvite({ fullName: fullName.trim(), email: email.trim(), role });
    if (ok) { reset(); onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[900] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-space-xl flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-ds-headline-sm font-bold text-on-surface">Thêm tài khoản mới</h3>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface bg-transparent border-0 cursor-pointer"
          >
            <span className={`${ICON} text-[20px]`}>close</span>
          </button>
        </div>

        {localError && (
          <div className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2.5 text-ds-body-sm text-on-error-container" role="alert">
            <span className={`${ICON} text-[18px] shrink-0`}>error</span>
            <span>{localError}</span>
          </div>
        )}

        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1">
            <label className="text-ds-label-md font-semibold text-on-surface" htmlFor="invite-name">
              Họ và tên <span className="text-error">*</span>
            </label>
            <input
              id="invite-name"
              className={adminInputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={200}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-ds-label-md font-semibold text-on-surface" htmlFor="invite-email">
              Email đăng nhập <span className="text-error">*</span>
            </label>
            <input
              id="invite-email"
              className={adminInputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              placeholder="email@congty.vn"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-ds-label-md font-semibold text-on-surface" htmlFor="invite-role">Vai trò chỉ định</label>
            <div className="relative">
              <select
                id="invite-role"
                className={`${adminInputClass} appearance-none pr-9 cursor-pointer`}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLE_VALUES.map((r) => <option key={r} value={r}>{ROLE_VN[r]}</option>)}
              </select>
              <span className={`${ICON} absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]`}>expand_more</span>
            </div>
          </div>
        </div>

        <p className="m-0 text-ds-body-sm text-on-surface-variant">
          Hệ thống gửi email mời kích hoạt; người dùng tự đặt mật khẩu qua link trong email.
        </p>

        <div className="flex items-center justify-end gap-space-sm pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-space-lg bg-surface-container-low text-on-surface text-ds-label-lg font-semibold rounded-xl hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => { void submit(); }}
            disabled={actionLoading}
            className="h-10 px-space-lg bg-primary-container text-on-primary text-ds-label-lg font-semibold rounded-xl shadow-sm hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
