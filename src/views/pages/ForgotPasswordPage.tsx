import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

/** Cửa sổ chờ giữa hai lần gửi link, tính từ lúc client bấm Send/Resend. */
const RESEND_COOLDOWN_SECONDS = 30;

// Nút Resend gọi thẳng sendResetLink, không đi qua validate của form, nên phải tự chặn ở đây.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RECOVERY_TIPS = [
  {
    icon: 'mark_email_unread',
    title: 'Instant Delivery',
    body: 'Reset emails typically arrive within a minute. Make sure to check your spam or promotional folders.',
  },
  {
    icon: 'domain_verification',
    title: 'Organization Accounts',
    body: 'If your company uses Okta, Google Workspace, or Azure AD, try signing in through your organization portal directly.',
  },
  {
    icon: 'security',
    title: 'Secure Verification',
    body: 'InterviewAI will never ask for your password or credentials via email, phone, or chat.',
  },
];

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
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
    // thì màn hình hiện ngay card "Check your inbox" trong khi chẳng có mail nào được gửi.
    const checkedEmail = email.trim();
    if (!EMAIL_PATTERN.test(checkedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await AuthService.forgotPassword(checkedEmail);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(readApiErrorMessage(err, 'Something went wrong. Please try again.', ['email']));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendResetLink();
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface font-sans text-ink">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center no-underline">
              <img src={logoWordmark} alt="AI Interview" className="h-5 w-auto" />
            </Link>
            <span className="hidden h-4 w-px bg-outline sm:block" />
            <Link to="/" className="hidden items-center gap-1 text-label-sm text-ink-variant no-underline transition-colors hover:text-ink sm:flex">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to home
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-1 rounded-lg px-2 py-1 text-label-sm text-ink-variant transition-colors hover:text-ink">
                <span className="material-symbols-outlined text-[18px]">language</span>
                <span>EN</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
              <button type="button" aria-label="Theme indicator" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-variant transition-colors hover:text-ink">
                <span className="material-symbols-outlined text-[18px]">light_mode</span>
              </button>
            </div>
            <span className="h-4 w-px bg-outline" />
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-label-md text-ink-variant no-underline transition-colors hover:text-ink">Sign In</Link>
              <Link to="/register" className="text-label-md text-ink-variant no-underline transition-colors hover:text-ink">Sign Up</Link>
            </div>
            <Link to="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary no-underline">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center bg-surface px-4 pt-16">
        <div className="mx-auto flex w-full max-w-[1152px] flex-col py-8 md:py-12">
          <div className="mb-6 flex w-full items-center justify-between px-2">
            <Link to="/login" className="group flex items-center gap-1.5 text-label-sm font-medium text-ink-variant no-underline transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
              Back to sign in
            </Link>
          </div>

          <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="flex flex-col lg:col-span-7">
              <div className="flex h-full flex-col justify-between rounded-xl border border-outline/30 bg-card p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6">
                  <div>
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-label-sm font-medium text-primary">
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                      Password Recovery
                    </span>
                    <h1 className="mb-1.5 text-headline-lg tracking-[-0.02em] text-ink">Reset your password</h1>
                    <p className="m-0 text-body-md text-ink-variant">
                      Enter the email address linked to your account and we will send you a secure
                      verification link to reset your password.
                    </p>
                  </div>

                  <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-md font-medium text-ink" htmlFor="work-email">
                        Work or Personal Email
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-ink-variant">mail</span>
                        <input
                          className="h-11 w-full box-border rounded-lg border border-outline/30 bg-card pl-10 pr-4 text-body-md text-ink shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                          id="work-email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
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
                      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-primary text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>

                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-outline/30 bg-surface-low p-3 text-label-sm text-ink-variant">
                      <span className="material-symbols-outlined shrink-0 text-[16px] text-primary">info</span>
                      <span>Reset link expires in 30 minutes. If you do not see it, check your spam folder.</span>
                    </div>
                  </form>

                  {sent && (
                    <div role="status" className="flex items-start gap-3 rounded-lg border border-outline/30 bg-surface-low p-4">
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[22px] text-primary">mark_email_read</span>
                      <div className="flex-1">
                        <h2 className="mb-0.5 text-headline-sm text-ink">Check your inbox</h2>
                        <p className="mb-2 text-body-sm text-ink-variant">
                          If an account exists with this email address, you'll receive a password reset link shortly.
                        </p>
                        <button
                          type="button"
                          className="cursor-pointer border-0 bg-transparent p-0 text-label-sm font-medium text-primary no-underline hover:underline disabled:cursor-not-allowed disabled:text-ink-variant disabled:no-underline"
                          onClick={sendResetLink}
                          disabled={cooldown > 0 || loading}
                        >
                          {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend email'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-px w-full bg-surface-high" />
                    </div>
                    <div className="relative flex justify-center text-center">
                      <span className="bg-card px-3 text-label-sm text-ink-variant">Need another option?</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline/30 bg-surface-low px-4 text-label-md font-medium text-ink transition-colors hover:bg-surface-mid"
                      onClick={() => navigate('/login')}
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">vpn_key</span>
                      Log in with Single Sign-On (SSO)
                    </button>
                    <button
                      type="button"
                      className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline/30 bg-surface-low px-4 text-label-md font-medium text-ink transition-colors hover:bg-surface-mid"
                      onClick={() => setNotice('Verify via SMS code is not available yet. Use the reset link or Single Sign-On.')}
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">sms</span>
                      Verify via SMS code
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center border-t border-outline/30 pt-6">
                  <p className="m-0 flex items-center gap-1.5 text-label-md text-ink-variant">
                    Remember your password?{' '}
                    <Link to="/login" className="group inline-flex items-center gap-0.5 font-medium text-primary no-underline hover:underline">
                      Sign in
                      <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:col-span-5">
              <div className="flex h-full flex-col justify-between rounded-xl border border-outline/30 bg-card p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary">
                        <span className="material-symbols-outlined text-[20px]">shield_person</span>
                      </span>
                      <div>
                        <h2 className="text-headline-sm leading-tight text-ink">Help &amp; Security</h2>
                        <p className="m-0 text-label-sm text-ink-variant">Common solutions for account access</p>
                      </div>
                    </div>
                    <p className="m-0 text-body-sm text-ink-variant">
                      Review quick troubleshooting steps below or reach out to our support team if you
                      cannot access your account.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {RECOVERY_TIPS.map((tip) => (
                      <div key={tip.title} className="rounded-lg border border-outline/30 bg-surface-low/50 p-3.5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[16px]">{tip.icon}</span>
                          </span>
                          <div>
                            <h3 className="mb-0.5 text-label-md font-semibold text-ink">{tip.title}</h3>
                            <p className="m-0 text-label-sm text-ink-variant">{tip.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-outline/30 pt-4">
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-ink-variant">Still having trouble?</span>
                      <a href="#" className="flex items-center gap-1 text-label-sm text-ink-variant no-underline transition-colors hover:text-ink">
                        <span className="material-symbols-outlined text-[14px]">help</span>
                        Help Center
                      </a>
                    </div>
                    <a
                      href="mailto:support@interviewai.com"
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-outline/30 bg-surface-low px-3 text-label-md font-medium text-primary no-underline transition-colors hover:bg-surface-mid"
                    >
                      <span className="material-symbols-outlined text-[16px]">support_agent</span>
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card/60 shadow-footer">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
          <span className="text-label-sm text-ink-variant">© 2025 InterviewAI Inc. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-6 text-label-sm text-ink-variant">
            <a href="#" className="no-underline transition-colors hover:text-ink">Privacy Policy</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Terms of Service</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Security</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
