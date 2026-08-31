import React from 'react';
import { Role, UserDetail } from '../../models/User.model';

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
  ROLE_USER: 'Người dùng',
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
                  onClick={() => onUnlock(user.id)} />
              : <Btn label="Khóa TK" color="#f59e0b" disabled={actionLoading}
                  onClick={() => onLock(user.id)} />
            }
            <Btn label="Reset mật khẩu" color="#6366f1" disabled={actionLoading}
              onClick={() => onResetPassword(user.id)} />

            <select
              disabled={actionLoading}
              value={user.role}
              onChange={e => onChangeRole(user.id, e.target.value as Role)}
              style={styles.select}
            >
              <option value="ROLE_USER">Người dùng</option>
              <option value="ROLE_INTERVIEWER">Phỏng vấn viên</option>
              <option value="ROLE_ADMIN">Quản trị viên</option>
            </select>

            <Btn label="Xóa TK" color="#ef4444" disabled={actionLoading}
              onClick={() => onDelete(user.id)} />
          </div>
        )}
      </div>
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
