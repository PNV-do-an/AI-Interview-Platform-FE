import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import AuthShell from '../components/AuthShell';

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
      <AuthShell>
        <div className="w-full max-w-[440px] rounded-2xl border border-outline/60 bg-card p-6 text-center shadow-card sm:p-8">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/15 bg-primary-fixed">
            <span className="material-symbols-outlined text-[30px] text-primary">mark_email_read</span>
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-card">
              <span className="material-symbols-outlined text-[15px] font-bold">check</span>
            </span>
          </div>

          <h1 className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-ink">Kiểm tra email của bạn</h1>
          <p className="mx-auto mb-4 max-w-xs text-body-sm leading-relaxed text-ink-variant">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ email:
          </p>

          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-fixed/60 px-4 py-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">alternate_email</span>
              <span className="select-all text-body-sm font-semibold text-ink">{maskEmail(email.trim())}</span>
            </span>
          </div>

          <div className="mb-5 flex items-start gap-3 rounded-xl border border-surface-high bg-surface-low p-3 text-left">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">info</span>
            <p className="text-xs leading-relaxed text-ink-variant">
              Nếu không thấy email trong hộp thư chính, vui lòng kiểm tra thêm mục Thư rác (Spam).
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <a
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
              href="https://mail.google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Mở ứng dụng Email</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
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

            <p className="flex flex-wrap items-center justify-center gap-1.5 text-body-sm text-ink-variant">
              <span>Chưa nhận được email?</span>
              {cooldown > 0 ? (
                <span className="font-semibold text-ink">Gửi lại sau ({cooldown}s)</span>
              ) : (
                <button
                  type="button"
                  onClick={sendResetLink}
                  disabled={loading}
                  className="cursor-pointer border-0 bg-transparent p-0 text-body-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-outline-strong disabled:no-underline"
                >
                  {loading ? 'Đang gửi...' : 'Gửi lại ngay'}
                </button>
              )}
            </p>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 text-body-sm font-medium text-ink-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="w-full max-w-[440px] rounded-2xl border border-outline/60 bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 bg-primary-fixed">
            <span className="material-symbols-outlined text-[26px] text-primary">key</span>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-ink">Quên mật khẩu?</h1>
          <p className="mt-2 max-w-xs text-body-sm leading-relaxed text-ink-variant">
            Nhập email tài khoản của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu trong giây lát.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[12px] font-semibold text-ink">
              Email đăng ký
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">mail</span>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="h-11 w-full rounded-xl border border-outline bg-card pl-10 pr-4 text-body-md text-ink shadow-sm placeholder:text-outline-strong transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <p className="text-[11px] leading-4 text-outline-strong">Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.</p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
              <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div role="status" className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-body-sm text-info-text">
              <span className="material-symbols-outlined shrink-0 text-[18px]">info</span>
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 pt-1 text-body-sm font-medium text-ink-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Quay lại đăng nhập</span>
          </Link>
        </form>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
