import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'Verification link is missing a token. Register again or sign in.'
  );
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;
    AuthService.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Account verified! You can sign in now.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans text-ink">
      <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[20px]">neurology</span>
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Interview<em className="not-italic text-primary">AI</em>
          </span>
        </div>

        <h1 className="m-0 mb-3 text-headline-lg text-ink">Email verification</h1>

        {status === 'loading' && (
          <div className="flex items-center gap-2 text-body-md text-ink-variant">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            <span>Verifying your account...</span>
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
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-label-md font-semibold text-on-primary no-underline shadow-md transition-colors hover:bg-primary-hover"
          >
            <span>Sign in</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
