import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'Liên kết xác thực thiếu token. Vui lòng đăng ký lại hoặc đăng nhập.'
  );
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;
    AuthService.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Tài khoản đã được xác thực! Bạn có thể đăng nhập ngay.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(readApiErrorMessage(err, 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.', ['token']));
      });
  }, [token]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface px-4 font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-surface-high/60 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] h-[400px] w-[600px] rounded-full bg-secondary-fixed/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center no-underline">
          <img src={logoWordmark} alt="AI Interview" className="h-8 w-auto object-contain" />
        </Link>

        <div className="rounded-2xl border border-outline/60 bg-card p-6 shadow-card sm:p-8">
          <h1 className="m-0 mb-3 text-[22px] font-bold tracking-[-0.015em] text-ink">Xác thực email</h1>

          {status === 'loading' && (
            <div className="flex items-center gap-2 text-body-md text-ink-variant">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              <span>Đang xác thực tài khoản...</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-md text-success-text">
              <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
              <span>{message}</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-md text-danger-text" role="alert">
              <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
              <span>{message}</span>
            </div>
          )}

          <div className="mt-6">
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-on-primary no-underline shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
            >
              <span>Đăng nhập</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
