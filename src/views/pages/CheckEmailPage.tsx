import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

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
    <div className="relative flex min-h-screen flex-col justify-between bg-surface font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-surface-high/60 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] h-[400px] w-[600px] rounded-full bg-secondary-fixed/20 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoWordmark} alt="AI Interview Logo" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
            <span className="text-[16px] font-bold tracking-tight text-slate-900">AI Interview</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              Trợ giúp
            </a>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:text-primary"
            >
              <span className="text-sm">🌐</span>
              <span>Tiếng Việt</span>
              <span className="material-symbols-outlined text-xs">expand_more</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto my-auto flex w-full flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[460px] rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="material-symbols-outlined text-[32px] text-primary">mark_email_read</span>
            </div>
            <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
              <span className="material-symbols-outlined text-xs font-bold">check</span>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Kiểm tra email của bạn</h1>
          <p className="mb-3 text-sm text-slate-600">Chúng tôi đã gửi liên kết xác thực tài khoản đến địa chỉ:</p>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">alternate_email</span>
            <span className="text-sm font-semibold tracking-wide text-primary">{maskEmail(email)}</span>
          </div>

          <div className="mb-6 flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-xs leading-relaxed text-slate-500">
            <span className="material-symbols-outlined shrink-0 text-lg text-amber-500">info</span>
            <span>Vui lòng kiểm tra cả mục Thư rác (Spam) nếu không thấy thư trong hộp thư chính.</span>
          </div>

          <a
            className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-hover hover:shadow-lg"
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

          <div className="mb-5 flex w-full flex-col items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row">
            <span className="text-xs text-slate-600">Chưa nhận được email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                resendState === 'sent'
                  ? 'cursor-not-allowed select-none border-slate-200/50 bg-slate-100 text-emerald-600'
                  : cooldown > 0 || resendState === 'sending'
                    ? 'cursor-not-allowed select-none border-slate-200/50 bg-slate-100 text-slate-400'
                    : 'border-slate-200 bg-white text-primary shadow-sm hover:bg-surface-low'
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

          <div>
            <Link
              to="/login"
              className="group inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white/60 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 AI Interview Platform. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-primary">Điều khoản</a>
            <span className="text-slate-300">•</span>
            <a href="#" className="transition-colors hover:text-primary">Chính sách bảo mật</a>
            <span className="text-slate-300">•</span>
            <a href="#" className="transition-colors hover:text-primary">Trung tâm trợ giúp</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheckEmailPage;
