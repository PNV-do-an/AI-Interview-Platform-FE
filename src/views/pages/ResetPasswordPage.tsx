import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';

const PASSWORD_HINT =
  'Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!).';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(token, form.password);
      setSuccess(true);
      // Tự động chuyển về login sau 3 giây
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h2>Đặt lại mật khẩu</h2>
        <p role="alert" style={{ color: 'red' }}>
          Link không hợp lệ. Vui lòng yêu cầu lại từ trang{' '}
          <Link to="/forgot-password">quên mật khẩu</Link>.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h2>Đặt lại mật khẩu</h2>
        <p role="status" style={{ color: 'green', padding: '12px', border: '1px solid green', borderRadius: 4 }}>
          ✓ Mật khẩu đã được đặt lại thành công! Đang chuyển về trang đăng nhập...
        </p>
        <p style={{ marginTop: 16 }}>
          <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Đặt lại mật khẩu</h2>
      <p style={{ color: '#555', marginBottom: 24 }}>{PASSWORD_HINT}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">Mật khẩu mới</label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
          />
        </div>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10, marginBottom: 16 }}
        >
          {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
        <p>
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
