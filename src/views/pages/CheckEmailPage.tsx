import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import AuthShell from '../components/AuthShell';

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const keep = local.length > 2 ? 2 : 1;
  return `${local.slice(0, keep)}***@${domain}`;
};

const CheckEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleResend = async () => {
    if (resendState === 'sending' || cooldown > 0 || resendState === 'sent') return;
    setError('');
    setResendState('sending');
    try {
      await AuthService.resendVerification(email);
      setResendState('sent');
    } catch (err: any) {
      setError(readApiErrorMessage(err, 'Không gửi lại được email xác thực. Vui lòng thử lại.', ['email']));
      setResendState('idle');
    }
  };

  const resendDisabled = resendState !== 'idle' || cooldown > 0;

  return (
    <AuthShell>
      <div className="w-full max-w-[440px] rounded-2xl border border-outline/60 bg-card p-6 text-center shadow-card sm:p-8">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/15 bg-primary-fixed">
          <span className="material-symbols-outlined text-[30px] text-primary">mark_email_read</span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-card">
            <span className="material-symbols-outlined text-xs font-bold">check</span>
          </span>
        </div>

        <h1 className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-ink">Kiểm tra email của bạn</h1>
        <p className="mb-4 text-body-sm leading-relaxed text-ink-variant">
          Chúng tôi đã gửi liên kết xác thực tài khoản đến địa chỉ:
        </p>

        <div className="mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-fixed/60 px-4 py-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">alternate_email</span>
            <span className="select-all text-body-sm font-semibold tracking-wide text-primary">{maskEmail(email)}</span>
          </span>
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-surface-high bg-surface-low p-3 text-left">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-amber-500">info</span>
          <span className="text-xs leading-relaxed text-ink-variant">
            Vui lòng kiểm tra cả mục Thư rác (Spam) nếu không thấy thư trong hộp thư chính.
          </span>
        </div>

        <a
          className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
          href="https://mail.google.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
          <span>Mở ứng dụng Email</span>
        </a>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-left text-body-sm text-danger-text">
            <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4 flex flex-col items-center justify-between gap-2 rounded-xl border border-surface-high bg-surface-low p-3 sm:flex-row">
          <span className="text-xs text-ink-variant">Chưa nhận được email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              resendState === 'sent'
                ? 'cursor-not-allowed select-none border-surface-high bg-surface-mid text-emerald-600'
                : cooldown > 0 || resendState === 'sending'
                  ? 'cursor-not-allowed select-none border-surface-high bg-surface-mid text-outline-strong'
                  : 'border-outline bg-card text-primary shadow-sm hover:bg-surface-low'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {resendState === 'sent' ? 'done' : cooldown > 0 ? 'update' : 'refresh'}
            </span>
            <span>
              {resendState === 'sending'
                ? 'Đang gửi...'
                : resendState === 'sent'
                  ? 'Đã gửi lại thành công!'
                  : cooldown > 0
                    ? `Gửi lại sau (${cooldown}s)`
                    : 'Gửi lại mã ngay'}
            </span>
          </button>
        </div>

        <Link
          to="/login"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Quay lại đăng nhập</span>
        </Link>
      </div>
    </AuthShell>
  );
};

export default CheckEmailPage;
