import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ROLE_USER: 'Người dùng',
  ROLE_STAFF: 'Nhân viên',
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_INTERVIEWER: 'Phỏng vấn viên',
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 16px' }}>Dashboard</h2>
        <p>Xin chào, <strong>{user?.fullName}</strong>!</p>
        <p style={{ color: '#6b7280' }}>Email: {user?.email}</p>
        <p style={{ color: '#6b7280' }}>Vai trò: {ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>

        <div style={styles.actions}>
          {isAdmin && (
            <Link to="/admin/users" style={styles.adminLink}>
              🛠 Quản lý người dùng
            </Link>
          )}
          <button onClick={logout} style={styles.logoutBtn}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#f9fafb',
  },
  card: {
    background: '#fff', borderRadius: 12,
    padding: '36px 40px', minWidth: 360,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  actions: { display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' },
  adminLink: {
    padding: '10px 20px', borderRadius: 8, background: '#2563eb',
    color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
  },
  logoutBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db',
    background: '#fff', cursor: 'pointer', fontSize: 14,
  },
};

export default DashboardPage;
