import React, { useEffect, useState } from 'react';
import { UserDetail } from '../../models/User.model';
import { ICON, adminInputClass } from './adminKit';

/**
 * Modal "Cập nhật hồ sơ" (PATCH /admin/users/{id}) — dùng shell modal của bộ mockup 2026-10-21.
 * Đổi email có hệ quả nặng: BE đưa tài khoản về trạng thái chờ mời và thu hồi phiên cũ.
 */

interface Props {
  user: UserDetail | null;
  onClose: () => void;
  onSave: (id: number, input: { fullName?: string; email?: string; phone?: string }) => Promise<boolean>;
  actionLoading: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD = 'flex flex-col gap-1';
const LABEL = 'text-ds-label-md font-semibold text-on-surface';

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
    if (!fullName.trim()) return setLocalError('Họ và tên là bắt buộc.');
    if (!EMAIL_PATTERN.test(email.trim())) return setLocalError('Email đăng nhập chưa hợp lệ.');
    setLocalError('');
    const input: { fullName?: string; email?: string; phone?: string } = { fullName: fullName.trim() };
    if (emailChanged) input.email = email.trim();
    if (phone.trim()) input.phone = phone.trim();
    else if (phoneCleared) input.phone = ''; // BE: phone = "" -> xóa số, khác "thiếu trường = giữ nguyên"
    if (!emailChanged && !phoneCleared && input.phone === undefined && fullName.trim() === user.fullName) {
      return setLocalError('Không có thay đổi nào để lưu.');
    }
    const ok = await onSave(user.id, input);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[900] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-space-xl flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-ds-headline-sm font-bold text-on-surface">Cập nhật hồ sơ</h3>
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
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-name">Họ và tên <span className="text-error">*</span></label>
            <input id="edit-name" className={adminInputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={200} />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-email">Email đăng nhập <span className="text-error">*</span></label>
            <input id="edit-email" className={adminInputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-phone">Số điện thoại</label>
            <input id="edit-phone" className={adminInputClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="Để trống để xóa số" />
          </div>
        </div>

        {emailChanged && (
          <div className="flex items-start gap-2 rounded-lg bg-tertiary-fixed px-3 py-2.5 text-ds-body-sm text-on-tertiary-fixed-variant" role="status">
            <span className={`${ICON} text-[18px] shrink-0`}>warning</span>
            <span>
              Lưu email mới sẽ đưa tài khoản về trạng thái Chờ xác thực: hệ thống gửi lại link mời
              và thu hồi mọi phiên đăng nhập hiện tại.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-space-sm pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-space-lg bg-surface-container-low text-on-surface text-ds-label-lg font-semibold rounded-xl hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => { void submit(); }}
            disabled={actionLoading}
            className="h-10 px-space-lg bg-primary-container text-on-primary text-ds-label-lg font-semibold rounded-xl shadow-sm hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
