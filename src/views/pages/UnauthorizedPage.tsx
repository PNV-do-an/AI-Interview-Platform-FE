import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', padding: 24,
    }}>
      <div style={{
        background: '#fff', padding: '48px 56px', borderRadius: 16, textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)', maxWidth: 480,
      }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>403</div>
        <h2 style={{ marginTop: 0, marginBottom: 12, color: '#111827' }}>Truy cập bị từ chối</h2>
        <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          Quay lại Trang chủ
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
