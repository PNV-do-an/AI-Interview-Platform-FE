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
          {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_STAFF') && (
            <Link to="/admin/packages" style={styles.menuItem}>Quản lý gói dịch vụ</Link>
          )}
          {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_STAFF') && (
            <Link to="/admin/feedback" style={styles.menuItem}>Đánh giá &amp; báo cáo</Link>
          )}
          <button onClick={logout} style={styles.logoutBtn}>Đăng xuất</button>
        </div>

        <div style={styles.menuGrid}>
          <Link to="/jobs" style={styles.menuItem}>Tìm việc làm</Link>
          <Link to="/bug-reports" style={styles.menuItem}>Báo cáo lỗi &amp; góp ý</Link>

          {(user?.role === 'ROLE_INTERVIEWER' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_STAFF') && (
            <>
              <Link to="/my-jobs" style={styles.menuItem}>Tin tuyển dụng của tôi</Link>
              <Link to="/jobs/new" style={styles.menuItem}>Đăng tin tuyển dụng</Link>
              <Link to="/my-slots" style={styles.menuItem}>Quản lý lịch phỏng vấn</Link>
              <Link to="/packages" style={styles.menuItem}>Gói dịch vụ</Link>
              <Link to="/my-orders" style={styles.menuItem}>Đơn hàng của tôi</Link>
            </>
          )}

          {user?.role === 'ROLE_USER' && (
            <>
              <Link to="/my-applications" style={styles.menuItem}>Đơn ứng tuyển của tôi</Link>
              <Link to="/my-profile" style={styles.menuItem}>Hồ sơ ứng viên</Link>
              <Link to="/mock-interviews" style={styles.menuItem}>Luyện phỏng vấn với AI</Link>
              <Link to="/cv-analyzer" style={styles.menuItem}>Quét & phân tích CV</Link>
              <Link to="/cover-letters" style={styles.menuItem}>Thư xin việc AI</Link>
            </>
          )}
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
  menuGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24,
  },
  menuItem: {
    display: 'block', padding: '14px 16px', borderRadius: 8,
    background: '#F0F3FA', color: '#395886', textDecoration: 'none',
    fontSize: 14, fontWeight: 600, border: '1px solid #D5DEEF',
  },
};

export default DashboardPage;
