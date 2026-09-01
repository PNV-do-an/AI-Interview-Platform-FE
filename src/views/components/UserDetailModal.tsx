import React, { useState } from 'react';
import { Role, UserDetail } from '../../models/User.model';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  user: UserDetail | null;
  onClose: () => void;
  onLock: (id: number) => void;
  onUnlock: (id: number) => void;
  onDelete: (id: number) => void;
  onResetPassword: (id: number) => void;
  onChangeRole: (id: number, role: Role) => void;
  actionLoading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_USER: 'Khách hàng',
  ROLE_STAFF: 'Nhân viên',
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_INTERVIEWER: 'Phỏng vấn viên',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#16a34a', INACTIVE: '#6b7280', LOCKED: '#dc2626', DELETED: '#9ca3af',
};

const UserDetailModal: React.FC<Props> = ({
  user, onClose, onLock, onUnlock, onDelete, onResetPassword, onChangeRole, actionLoading,
}) => {
  const [confirmState, setConfirmState] = useState<null | {
    key: 'lock' | 'unlock' | 'reset' | 'changeRole';
    role?: Role;
  }>(null);

  const closeConfirm = () => setConfirmState(null);

  if (!user) return null;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('vi-VN') : '—';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Chi tiết người dùng</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          <Row label="ID" value={String(user.id)} />
          <Row label="Email" value={user.email} />
          <Row label="Họ tên" value={user.fullName} />
          <Row label="Vai trò" value={ROLE_LABELS[user.role] || user.role} />
          <Row label="Trạng thái" value={
            <span style={{ color: STATUS_COLORS[user.status] ?? '#333', fontWeight: 600 }}>
              {user.status}
            </span>
          } />
          <Row label="Ngày tạo" value={fmtDate(user.createdAt)} />
          <Row label="Cập nhật" value={fmtDate(user.updatedAt)} />
          {user.deletedAt && <Row label="Xóa lúc" value={fmtDate(user.deletedAt)} />}
        </div>

        {user.status !== 'DELETED' && (
          <div style={styles.footer}>
            {user.status === 'LOCKED'
              ? <Btn label="Mở khóa" color="#16a34a" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'unlock' })} />
              : <Btn label="Khóa TK" color="#f59e0b" disabled={actionLoading}
                  onClick={() => setConfirmState({ key: 'lock' })} />
            }
            <Btn label="Reset mật khẩu" color="#6366f1" disabled={actionLoading}
              onClick={() => setConfirmState({ key: 'reset' })} />

            <select
              disabled={actionLoading}
              value={user.role}
              onChange={e => setConfirmState({ key: 'changeRole', role: e.target.value as Role })}
              style={styles.select}
            >
              <option value="ROLE_USER">Khách hàng</option>
              <option value="ROLE_STAFF">Nhân viên</option>
              <option value="ROLE_INTERVIEWER">Phỏng vấn viên</option>
              <option value="ROLE_ADMIN">Quản trị viên</option>
            </select>

            <Btn label="Xóa TK" color="#ef4444" disabled={actionLoading}
              onClick={() => onDelete(user.id)} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={
          confirmState?.key === 'lock' ? 'Xác nhận khóa tài khoản' :
          confirmState?.key === 'unlock' ? 'Xác nhận mở khóa tài khoản' :
          confirmState?.key === 'reset' ? 'Xác nhận gửi email đặt lại mật khẩu' :
          confirmState?.key === 'changeRole' ? 'Xác nhận thay đổi vai trò' : 'Xác nhận'
        }
        message={
          confirmState?.key === 'lock' ? 'Bạn có chắc muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập.' :
          confirmState?.key === 'unlock' ? 'Bạn có chắc muốn mở khóa tài khoản này?' :
          confirmState?.key === 'reset' ? 'Một email đặt lại mật khẩu sẽ được gửi đến ' + (user?.email ?? '') + '. Tiếp tục?' :
          confirmState?.key === 'changeRole' ? 'Bạn có chắc muốn thay đổi vai trò của người dùng này?' : ''
        }
        danger={confirmState?.key === 'lock'}
        confirmLabel={
          confirmState?.key === 'lock' ? 'Khóa' :
          confirmState?.key === 'unlock' ? 'Mở khóa' :
          confirmState?.key === 'reset' ? 'Gửi email' :
          confirmState?.key === 'changeRole' ? 'Đổi vai trò' : 'Xác nhận'
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
        }}
      />
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ minWidth: 110, color: '#6b7280', fontSize: 13 }}>{label}</span>
    <span style={{ flex: 1, fontSize: 14, wordBreak: 'break-all' }}>{value}</span>
  </div>
);

const Btn: React.FC<{
  label: string; color: string; disabled?: boolean; onClick: () => void;
}> = ({ label, color, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '7px 14px', borderRadius: 6, border: 'none',
      background: color, color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, fontSize: 13,
    }}
  >
    {label}
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900,
  },
  modal: {
    background: '#fff', borderRadius: 12, width: 480, maxWidth: '95vw',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
  },
  body: { padding: '16px 24px' },
  footer: {
    display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280',
  },
  select: {
    padding: '7px 10px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 13, cursor: 'pointer',
  },
};

export default UserDetailModal;
