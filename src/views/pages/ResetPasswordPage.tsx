import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { PasswordResetResult, ResetTokenInfo } from '../../models/Api.model';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

/** Phải khớp đúng ký tự mà PASSWORD_PATTERN ở backend chấp nhận, nếu không client báo "Rất mạnh" mà server vẫn 400. */
const SPECIAL_CHARS = '@#$%^&+=!';

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { label: 'Chữ hoa & chữ thường', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'Chứa ít nhất 1 chữ số', test: (v) => /\d/.test(v) },
  {
    label: 'Ký tự đặc biệt (@, #, $)',
    test: (v) => new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]/^$.|?*+()]/g, '\\$&')}]`).test(v),
  },
];

const STRENGTH_LEVELS = [
  { label: 'Yếu', textClass: 'text-rose-500' },
  { label: 'Trung bình', textClass: 'text-amber-500' },
  { label: 'Tốt', textClass: 'text-emerald-500' },
  { label: 'Rất mạnh', textClass: 'text-emerald-600' },
];

// BE 400 đẩy thông báo từng field vào map `detail`, nên phải đọc cả `message` lẫn `detail`.
const messageFrom = (err: any, fallback: string) =>
  readApiErrorMessage(err, err?.message || fallback, ['token', 'password', 'confirmPassword']);

const formatDoneTime = (at: number) => {
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(at));
  return `Vừa xong (${time} UTC+7)`;
};

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>(token ? 'checking' : 'invalid');
  const [account, setAccount] = useState<ResetTokenInfo | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<PasswordResetResult | null>(null);
  const [resultAt, setResultAt] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    AuthService.getResetTokenInfo(token)
      .then((res) => {
        if (!alive) return;
        const info = res.data.data;
        if (!info) throw new Error('Empty response');
        setAccount(info);
        setExpiresAt(Date.now() + info.remainingSeconds * 1000);
        setStatus('valid');
      })
      .catch((err) => {
        if (!alive) return;
        setTokenError(messageFrom(err, 'Link đặt lại mật khẩu không hợp lệ.'));
        setStatus('invalid');
      });
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (status !== 'valid') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [status]);

  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const linkExpired = status === 'valid' && remainingSeconds <= 0;

  const passedRules = RULES.filter((rule) => rule.test(form.password)).length;
  const strength = STRENGTH_LEVELS[Math.min(3, Math.max(0, passedRules - 1))];
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const canSubmit = status === 'valid' && !linkExpired && !submitting && passedRules === RULES.length && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await AuthService.resetPassword(token, form.password, form.confirmPassword, true);
      if (res.data.data) {
        setResult(res.data.data);
        setResultAt(Date.now());
      }
    } catch (err: any) {
      setSubmitError(messageFrom(err, 'Đã xảy ra lỗi. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const expiredView = (errorDetail: string) => (
    <div id="view-expired" className="relative z-10 flex flex-col items-center py-2 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
        Liên kết hết hạn
      </span>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Liên kết đã hết hiệu lực</h2>
      <p className="mb-6 max-w-[340px] text-xs leading-relaxed text-slate-500">
        {errorDetail || 'Liên kết đặt lại mật khẩu đã quá thời hạn 15 phút hoặc đã được sử dụng. Vui lòng tạo yêu cầu mới.'}
      </p>
      <button
        type="button"
        onClick={() => navigate('/forgot-password')}
        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
      >
        <span>Gửi lại liên kết mới</span>
      </button>
      <Link to="/" className="mt-4 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700">
        Quay lại trang chủ
      </Link>
    </div>
  );

  const inputView = (
    <div id="view-input" className="relative z-10 flex flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đặt lại mật khẩu mới</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Vui lòng thiết lập mật khẩu mới có độ bảo mật cao để bảo vệ tài khoản của bạn.
        </p>
      </div>

      {status === 'checking' && <p className="-mt-3 mb-4 text-center text-body-sm text-slate-500">Đang kiểm tra liên kết...</p>}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {account && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">person</span>
            <span className="truncate font-semibold text-slate-800">{account.fullName}</span>
            <span className="truncate text-slate-400">· {account.email}</span>
          </div>
        )}

        {submitError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
            <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label htmlFor="password-input" className="text-slate-800">
              Mật khẩu mới
            </label>
            {form.password.length > 0 && (
              <span className={`flex items-center gap-1 font-medium ${strength.textClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />• Độ mạnh: {strength.label}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3.5 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              required
              disabled={status !== 'valid' || linkExpired}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className="absolute right-3.5 text-slate-400 transition-colors hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <div className="mt-1 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`h-1.5 rounded-full ${index < passedRules ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            {RULES.map((rule) => {
              const pass = rule.test(form.password);
              return (
                <div key={rule.label} className="flex items-center gap-2">
                  {pass ? (
                    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined shrink-0 text-[16px] text-slate-300">radio_button_unchecked</span>
                  )}
                  <span>{rule.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password-input" className="text-xs font-semibold text-slate-800">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3.5 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="confirm-password-input"
              type="password"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              required
              disabled={status !== 'valid' || linkExpired}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            {passwordsMatch && (
              <div className="absolute right-3.5 flex items-center text-emerald-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {passwordsMatch && (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Mật khẩu trùng khớp</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới →'}</span>
        </button>
        <Link
          to="/login"
          className="mt-4 block text-center text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          ← Hủy và quay lại đăng nhập
        </Link>
      </form>
    </div>
  );

  const successView = result ? (
    <div id="view-success" className="relative z-10 flex flex-col items-center py-2 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Đã xác thực bảo mật
      </span>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Đổi mật khẩu thành công!</h2>
      <p className="mb-6 max-w-[340px] text-xs leading-relaxed text-slate-500">
        Mật khẩu mới đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới này để đăng nhập vào tài khoản ngay bây
        giờ.
      </p>
      <div className="mb-6 flex w-full flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-left text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Thời gian cập nhật:</span>
          <span className="font-semibold text-slate-900">{formatDoneTime(resultAt)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Phiên đăng nhập khác:</span>
          <span className={`font-semibold ${result.signedOutEverywhere ? 'text-emerald-600' : 'text-slate-900'}`}>
            {result.signedOutEverywhere ? 'Tự động đăng xuất' : 'Giữ phiên hiện tại'}
          </span>
        </div>
      </div>
      <Link
        to="/login"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
      >
        <span>Đăng nhập ngay</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      </Link>
      <button
        type="button"
        onClick={() => setResult(null)}
        className="mt-4 flex items-center gap-1 border-0 bg-transparent text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <span>Quay lại biểu mẫu</span>
      </button>
    </div>
  ) : null;

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-surface font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-fixed opacity-60 blur-3xl" />
        <div className="absolute -right-28 top-1/4 h-80 w-80 rounded-full bg-[#6df5e1] opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-surface-high opacity-50 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3 no-underline focus:outline-none">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <img src={logoWordmark} alt="AI Interview Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold leading-tight tracking-tight text-slate-900 transition-colors hover:text-indigo-600">
              AI Interview
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:text-slate-900"
          >
            <span className="text-xs">🌐</span>
            <span>Tiếng Việt</span>
          </button>
          <a href="#" className="hidden text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 sm:inline-block">
            Trợ giúp
          </a>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-50 opacity-80 blur-2xl" />

          {status === 'invalid' || linkExpired
            ? expiredView(tokenError)
            : result
              ? successView
              : inputView}
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row">
        <p>© 2026 AI Interview Platform. Bảo lưu mọi quyền.</p>
        <div className="flex items-center gap-4 font-medium">
          <a href="#" className="transition-colors hover:text-slate-700">Điều khoản</a>
          <span>•</span>
          <a href="#" className="transition-colors hover:text-slate-700">Chính sách bảo mật</a>
          <span>•</span>
          <a href="#" className="transition-colors hover:text-slate-700">Trung tâm trợ giúp</a>
        </div>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
