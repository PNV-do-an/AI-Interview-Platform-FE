import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await AuthService.forgotPassword(email);
      setMessage(res.data.message || 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Quên mật khẩu</h2>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Nhập email tài khoản của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu nếu email tồn tại trong hệ thống.
      </p>

      {message ? (
        <div>
          <p role="status" style={{ color: 'green', padding: '12px', border: '1px solid green', borderRadius: 4 }}>
            {message}
          </p>
          <p style={{ marginTop: 16 }}>
            <Link to="/login">← Quay lại đăng nhập</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
            />
          </div>
          {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 10, marginBottom: 16 }}
          >
            {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </button>
          <p>
            <Link to="/login">← Quay lại đăng nhập</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
