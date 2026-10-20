import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { PasswordResetResult, ResetTokenInfo } from '../../models/Api.model';
import { readApiErrorMessage } from '../../utils/apiError';
import AuthShell from '../components/AuthShell';

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
    <div id="view-expired" className="flex flex-col items-center py-2 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-danger/20 bg-danger-bg text-danger-text">
        <span className="material-symbols-outlined text-[26px]">schedule</span>
      </div>
      <span className="mb-3 inline-flex items-center rounded-full border border-danger/20 bg-danger-bg px-3 py-1 text-xs font-semibold text-danger-text">
        Liên kết hết hạn
      </span>
      <h2 className="mb-2 text-xl font-bold text-ink">Liên kết đã hết hiệu lực</h2>
      <p className="mb-6 max-w-[340px] text-xs leading-relaxed text-ink-variant">
        {errorDetail || 'Liên kết đặt lại mật khẩu đã quá thời hạn 15 phút hoặc đã được sử dụng. Vui lòng tạo yêu cầu mới.'}
      </p>
      <button
        type="button"
        onClick={() => navigate('/forgot-password')}
        className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
      >
        <span>Gửi lại liên kết mới</span>
      </button>
      <Link to="/" className="mt-4 text-xs font-medium text-ink-variant transition-colors hover:text-ink">
        Quay lại trang chủ
      </Link>
    </div>
  );

  const inputView = (
    <div id="view-input" className="flex flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 bg-primary-fixed">
          <span className="material-symbols-outlined text-[26px] text-primary">lock_reset</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-ink">Đặt lại mật khẩu mới</h1>
        <p className="mt-2 max-w-xs text-body-sm leading-relaxed text-ink-variant">
          Thiết lập mật khẩu mới có độ bảo mật cao để bảo vệ tài khoản của bạn.
        </p>
      </div>

      {status === 'checking' && <p className="-mt-3 mb-4 text-center text-body-sm text-ink-variant">Đang kiểm tra liên kết...</p>}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {account && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-surface-high bg-surface-low px-3 py-2 text-xs text-ink-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
            <span className="truncate font-semibold text-ink">{account.fullName}</span>
            <span className="truncate text-outline-strong">· {account.email}</span>
          </div>
        )}

        {submitError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
            <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="text-[12px] font-semibold text-ink">
              Mật khẩu mới
            </label>
            {form.password.length > 0 && (
              <span className={`flex items-center gap-1 text-[11px] font-bold ${strength.textClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />Độ mạnh: {strength.label}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">lock</span>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              className="h-11 w-full rounded-xl border border-outline bg-card pl-10 pr-11 text-body-md text-ink shadow-sm placeholder:text-outline-strong transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              required
              disabled={status !== 'valid' || linkExpired}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              aria-label="Hiện/ẩn mật khẩu"
              className="absolute right-3 p-1 text-outline-strong transition-colors hover:text-ink"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          <div className="mt-1 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`h-1 rounded-full ${index < passedRules ? 'bg-emerald-500' : 'bg-surface-high'}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-surface-high bg-surface-low p-3 text-xs text-ink-variant">
            {RULES.map((rule) => {
              const pass = rule.test(form.password);
              return (
                <div key={rule.label} className="flex items-center gap-2">
                  {pass ? (
                    <span className="material-symbols-outlined shrink-0 text-[16px] text-emerald-500">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined shrink-0 text-[16px] text-surface-highest">radio_button_unchecked</span>
                  )}
                  <span>{rule.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password-input" className="text-[12px] font-semibold text-ink">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">lock_reset</span>
            <input
              id="confirm-password-input"
              type="password"
              className="h-11 w-full rounded-xl border border-outline bg-card pl-10 pr-11 text-body-md text-ink shadow-sm placeholder:text-outline-strong transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              required
              disabled={status !== 'valid' || linkExpired}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            {passwordsMatch && (
              <span className="absolute right-3.5 flex items-center text-emerald-500">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </span>
            )}
          </div>
          {passwordsMatch && (
            <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">check</span>
              <span>Mật khẩu trùng khớp</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
        <Link to="/login" className="text-center text-xs font-medium text-ink-variant transition-colors hover:text-primary">
          Hủy và quay lại đăng nhập
        </Link>
      </form>
    </div>
  );

  const successView = result ? (
    <div id="view-success" className="flex flex-col items-center py-2 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-50 text-emerald-600">
        <span className="material-symbols-outlined text-[26px]">check_circle</span>
      </div>
      <span className="mb-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Đã xác thực bảo mật
      </span>
      <h2 className="mb-2 text-xl font-bold text-ink">Đổi mật khẩu thành công!</h2>
      <p className="mb-6 max-w-[340px] text-xs leading-relaxed text-ink-variant">
        Mật khẩu mới đã được cập nhật an toàn. Bạn có thể dùng mật khẩu mới này để đăng nhập ngay bây giờ.
      </p>
      <div className="mb-6 flex w-full flex-col gap-2 rounded-xl border border-surface-high bg-surface-low p-3.5 text-left text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-ink-variant">Thời gian cập nhật:</span>
          <span className="font-semibold text-ink">{formatDoneTime(resultAt)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-variant">Phiên đăng nhập khác:</span>
          <span className={`font-semibold ${result.signedOutEverywhere ? 'text-emerald-600' : 'text-ink'}`}>
            {result.signedOutEverywhere ? 'Tự động đăng xuất' : 'Giữ phiên hiện tại'}
          </span>
        </div>
      </div>
      <Link
        to="/login"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
      >
        <span>Đăng nhập ngay</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
      <button
        type="button"
        onClick={() => setResult(null)}
        className="mt-4 flex items-center gap-1 border-0 bg-transparent text-xs font-medium text-ink-variant transition-colors hover:text-primary"
      >
        <span>Quay lại biểu mẫu</span>
      </button>
    </div>
  ) : null;

  return (
    <AuthShell>
      <div className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-outline/60 bg-card p-6 shadow-card sm:p-8">
        {status === 'invalid' || linkExpired ? expiredView(tokenError) : result ? successView : inputView}
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
