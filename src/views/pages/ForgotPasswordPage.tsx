import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

/** Cửa sổ chờ giữa hai lần gửi link, tính từ lúc client bấm Gửi/Gửi lại. */
const RESEND_COOLDOWN_SECONDS = 30;

// Nút Resend gọi thẳng sendResetLink, không đi qua validate của form, nên phải tự chặn ở đây.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
};

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const sendResetLink = async () => {
    setError('');
    setNotice('');
    // BE trả lời 200 cho mọi trường hợp (chống dò email), nên nếu client gửi đi ô trống
    // thì màn hình hiện ngay "Kiểm tra email" trong khi chẳng có mail nào được gửi.
    const checkedEmail = email.trim();
    if (!EMAIL_PATTERN.test(checkedEmail)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      await AuthService.forgotPassword(checkedEmail);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(readApiErrorMessage(err, 'Đã xảy ra lỗi. Vui lòng thử lại.', ['email']));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendResetLink();
  };

  if (sent) {
    return (
      <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-surface font-sans text-ink">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-fixed opacity-60 blur-3xl" />
          <div className="absolute -right-28 top-1/4 h-80 w-80 rounded-full bg-[#6df5e1] opacity-40 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-surface-high opacity-50 blur-3xl" />
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <img src={logoWordmark} alt="AI Interview Logo" className="h-9 w-9 rounded-xl object-contain shadow-md" />
            <span className="text-xl font-bold tracking-tight text-slate-900">AI Interview</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
              <span className="material-symbols-outlined text-[18px]">language</span>
              Tiếng Việt
            </button>
            <a href="#" className="hidden transition-colors hover:text-slate-900 sm:inline-block">
              Trợ giúp
            </a>
          </div>
        </header>

        <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <span className="material-symbols-outlined text-[32px] text-indigo-600">mark_email_read</span>
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-white">
                  <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Kiểm tra email của bạn</h1>
              <p className="mx-auto mb-4 max-w-xs text-sm leading-relaxed text-slate-600">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ email:
              </p>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100/80 bg-indigo-50/70 px-4 py-1.5 text-indigo-700 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                  <span className="select-all text-sm font-semibold text-slate-800">{maskEmail(email.trim())}</span>
                </div>
              </div>
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100/80 text-indigo-600">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </div>
                <p className="flex-1 text-xs leading-relaxed text-slate-600">
                  Nếu không thấy email trong hộp thư chính, vui lòng kiểm tra thêm mục Thư rác (Spam).
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <a
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
                  href="https://mail.google.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  <span>Mở ứng dụng Email</span>
                  <span className="material-symbols-outlined text-[16px] transition-transform duration-150 group-hover:translate-x-0.5">open_in_new</span>
                </a>
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-left text-body-sm text-danger-text">
                    <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                    <span>{error}</span>
                  </div>
                )}
                {notice && (
                  <div role="status" className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-left text-body-sm text-info-text">
                    <span className="material-symbols-outlined shrink-0 text-[18px]">info</span>
                    <span>{notice}</span>
                  </div>
                )}
                <div className="pt-1 text-center">
                  <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-600">
                    <span>Chưa nhận được email?</span>
                    {cooldown > 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <span className="mr-0.5 inline-block h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                        Gửi lại sau ({cooldown}s)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendResetLink}
                        disabled={loading}
                        className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold text-indigo-600 underline-offset-2 transition-colors hover:text-indigo-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {loading ? 'Đang gửi...' : 'Gửi lại ngay'}
                      </button>
                    )}
                  </p>
                </div>
                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="group inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-indigo-600"
                  >
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-150 group-hover:-translate-x-1">arrow_back</span>
                    <span>Quay lại đăng nhập</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 AI Interview Platform. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-slate-800">Điều khoản</a>
            <a href="#" className="transition-colors hover:text-slate-800">Chính sách bảo mật</a>
            <a href="#" className="transition-colors hover:text-slate-800">Trung tâm trợ giúp</a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-surface font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-indigo-50/60 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl" />
      </div>

      <header className="relative z-20 w-full border-b border-slate-200/70 bg-white/80 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3 no-underline">
            <img src={logoWordmark} alt="AI Interview Logo" className="h-9 w-9 rounded-xl border border-slate-100 object-contain shadow-sm" />
            <span className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">AI Interview</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition-colors hover:text-indigo-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trợ giúp
            </a>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
            >
              <span>🌐</span>
              <span>Tiếng Việt</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-[460px]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quên mật khẩu?</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Đừng lo lắng! Nhập email tài khoản của bạn, chúng tôi sẽ gửi liên kết hướng dẫn đặt lại mật khẩu trong
                giây lát.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email đăng ký <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="block w-full rounded-xl border border-slate-300 py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.</span>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại →'}</span>
              </button>
              <div className="pt-4 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600">
                  <span>← Quay lại đăng nhập</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-slate-200/60 bg-white/50 px-4 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 AI Interview Platform. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition-colors hover:text-indigo-600">Điều khoản</a>
            <span className="text-slate-300">•</span>
            <a href="#" className="transition-colors hover:text-indigo-600">Chính sách bảo mật</a>
            <span className="text-slate-300">•</span>
            <a href="#" className="transition-colors hover:text-indigo-600">Trung tâm trợ giúp</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
