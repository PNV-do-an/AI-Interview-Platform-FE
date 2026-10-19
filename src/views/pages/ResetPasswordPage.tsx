import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { PasswordResetResult, ResetTokenInfo } from '../../models/Api.model';
import { readApiErrorMessage } from '../../utils/apiError';

/** Phải khớp đúng ký tự mà PASSWORD_PATTERN ở backend chấp nhận, nếu không client báo "Strong" mà server vẫn 400. */
const SPECIAL_CHARS = '@#$%^&+=!';

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Upper & lowercase letters', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'At least one number (0-9)', test: (v) => /\d/.test(v) },
  { label: `Special character (${SPECIAL_CHARS})`, test: (v) => new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]/^$.|?*+()]/g, '\\$&')}]`).test(v) },
];

const STRENGTH_LEVELS = [
  { label: 'Weak', textClass: 'text-error' },
  { label: 'Fair', textClass: 'text-outline-strong' },
  { label: 'Good', textClass: 'text-secondary' },
  { label: 'Strong', textClass: 'text-primary' },
];

const SECURITY_TIPS = [
  {
    icon: 'shield',
    title: 'End-to-end Encryption',
    body: 'Your password is encrypted with modern industry standards and never stored in plain text.',
  },
  {
    icon: 'devices',
    title: 'Automatic Session Refresh',
    body: 'Setting a new password immediately invalidates expired tokens and unrecognized devices.',
  },
  {
    icon: 'key',
    title: 'Use a Password Manager',
    body: 'We recommend storing unique passwords with trusted tools like 1Password, Bitwarden, or Apple Keychain.',
  },
];

const TRUST_BADGES = [
  { icon: 'lock', label: 'End-to-End Encrypted' },
  { icon: 'verified_user', label: 'Industry Standard Protection' },
  { icon: 'fingerprint', label: 'Two-Factor Authentication Ready' },
];

const initialsOf = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'AC';

const roleLabel = (role: string) => {
  const clean = role.replace(/^ROLE_/i, '');
  return clean.charAt(0) + clean.slice(1).toLowerCase();
};

// BE 400 đẩy thông báo từng field vào map `detail`, nên phải đọc cả `message` lẫn `detail`.
// err.message giữ làm fallback cho lỗi network (không có response).
const messageFrom = (err: any, fallback: string) =>
  readApiErrorMessage(err, err?.message || fallback, ['token', 'password', 'confirmPassword']);

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>(token ? 'checking' : 'invalid');
  const [account, setAccount] = useState<ResetTokenInfo | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signOutEverywhere, setSignOutEverywhere] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<PasswordResetResult | null>(null);

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
        setTokenError(messageFrom(err, 'This reset link is not valid. Please request a new one.'));
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
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const linkExpired = status === 'valid' && remainingSeconds <= 0;

  const passedRules = RULES.filter((rule) => rule.test(form.password)).length;
  const strength = STRENGTH_LEVELS[Math.min(3, Math.max(0, passedRules - 1))];
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const canSubmit =
    status === 'valid' &&
    !linkExpired &&
    !submitting &&
    passedRules === RULES.length &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await AuthService.resetPassword(
        token,
        form.password,
        form.confirmPassword,
        signOutEverywhere
      );
      if (res.data.data) setResult(res.data.data);
    } catch (err: any) {
      setSubmitError(messageFrom(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleClass =
    'absolute inset-y-0 right-0 flex cursor-pointer items-center border-0 bg-transparent pr-3.5 text-ink-variant transition-colors hover:text-ink';

  const inputClass =
    'h-11 w-full box-border rounded-lg border border-outline/30 bg-surface pl-10 pr-12 text-body-md text-ink shadow-sm ' +
    'transition-all placeholder:text-ink-variant/50 focus:border-primary focus:bg-card focus:outline-none';

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-ink">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">neurology</span>
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                Interview<em className="not-italic text-primary">AI</em>
              </span>
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

      <main className="w-full flex-1 px-4 pb-16 pt-24 sm:px-6">
        <div className="mx-auto w-full max-w-[1024px]">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 pb-6">
            <Link to="/login" className="group inline-flex items-center gap-1.5 text-label-md text-ink-variant no-underline transition-colors hover:text-ink">
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
              Back to sign in
            </Link>
            {status === 'valid' && !linkExpired && (
              <span className="inline-flex items-center gap-2 rounded-full border border-outline/30 bg-surface-low px-3 py-1 text-label-sm font-medium text-ink">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-medium text-primary">
                  {account ? `Verified Session • ${remainingMinutes}m remaining` : 'Verified Session'}
                </span>
              </span>
            )}
          </div>

          {status === 'invalid' ? (
            <div className="mx-auto w-full max-w-[560px] rounded-xl border border-outline/30 bg-card p-6 shadow-sm sm:p-8">
              <h1 className="text-headline-lg text-ink">Reset password</h1>
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
                <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                <p className="m-0">
                  {tokenError || 'This link is missing or no longer valid. Please request a new one.'}{' '}
                  <Link to="/forgot-password" className="font-medium text-primary no-underline hover:underline">
                    Request a new reset link
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div className="flex flex-col gap-6 lg:col-span-7">
                <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl border border-outline/30 bg-card p-6 shadow-sm sm:p-8">
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-mid px-3 py-1 text-label-sm font-medium tracking-wide text-primary">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      Security &amp; Credentials
                      <span className="text-outline">•</span>
                      <span className="text-ink-variant">Encrypted</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-headline-lg font-semibold tracking-[-0.02em] text-ink">Set a new password</h1>
                    <p className="m-0 text-body-md text-ink-variant">
                      Create a strong, memorable password to secure your InterviewAI account.
                    </p>
                  </div>

                  {account && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-outline/30 bg-surface-low p-3.5 sm:p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-headline-sm font-semibold text-on-primary shadow-sm">
                          {initialsOf(account.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-headline-sm font-semibold text-ink">{account.fullName}</span>
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-mid px-2 py-0.5 text-label-sm font-medium text-primary">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Verified Account
                            </span>
                          </div>
                          <span className="block truncate text-body-sm text-ink-variant">{account.email}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface-mid px-2.5 py-1 text-label-sm font-medium text-ink-variant">
                        {roleLabel(account.role)}
                      </span>
                    </div>
                  )}

                  {status === 'checking' && (
                    <p className="m-0 text-body-sm text-ink-variant">Verifying your reset link...</p>
                  )}

                  {linkExpired && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">timer_off</span>
                      <p className="m-0">
                        This link has expired.{' '}
                        <Link to="/forgot-password" className="font-medium text-primary no-underline hover:underline">
                          Request a new reset link
                        </Link>
                      </p>
                    </div>
                  )}

                  <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-label-md font-medium text-ink" htmlFor="new-password">New Password</label>
                        <span className="font-mono text-[12px] text-ink-variant">Min. 8 characters</span>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[18px] text-ink-variant">lock</span>
                        <input
                          className={inputClass}
                          id="new-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter strong password"
                          autoComplete="new-password"
                          required
                          disabled={status !== 'valid' || linkExpired}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className={toggleClass}
                          aria-label="Toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>

                      <div className="mt-1 flex flex-col gap-2 rounded-lg border border-outline/30 bg-surface-low p-3">
                        <div className="flex items-center justify-between text-label-sm">
                          <span className="flex items-center gap-1.5 text-ink-variant">
                            <span className="material-symbols-outlined text-[14px] text-primary">speed</span>
                            Password strength:
                          </span>
                          <span className={`font-mono text-[12px] font-semibold ${strength.textClass}`}>{strength.label}</span>
                        </div>
                        <div className="grid h-1.5 w-full grid-cols-4 gap-1.5">
                          {[0, 1, 2, 3].map((index) => (
                            <span
                              key={index}
                              className={`rounded-full transition-all duration-300 ${index < passedRules ? 'bg-primary' : 'bg-surface-high'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1 text-body-sm sm:grid-cols-2">
                        {RULES.map((rule) => {
                          const pass = rule.test(form.password);
                          return (
                            <span
                              key={rule.label}
                              className={`flex items-center gap-2 transition-colors ${pass ? 'text-primary' : 'text-ink-variant/60'}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {pass ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              {rule.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-label-md font-medium text-ink" htmlFor="confirm-password">Confirm New Password</label>
                        {form.confirmPassword.length > 0 && (
                          passwordsMatch ? (
                            <span className="inline-flex items-center gap-1 text-label-sm font-medium text-primary">
                              <span className="material-symbols-outlined text-[14px]">done_all</span>
                              Passwords match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-label-sm font-medium text-error">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                              Passwords do not match
                            </span>
                          )
                        )}
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[18px] text-ink-variant">lock_reset</span>
                        <input
                          className={inputClass}
                          id="confirm-password"
                          name="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          required
                          disabled={status !== 'valid' || linkExpired}
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          className={toggleClass}
                          aria-label="Toggle password confirmation visibility"
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          <span className="material-symbols-outlined text-[18px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 rounded-xl border border-outline/30 bg-surface-low p-4">
                      <input
                        id="revoke-sessions"
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
                        checked={signOutEverywhere}
                        disabled={status !== 'valid' || linkExpired}
                        onChange={(e) => setSignOutEverywhere(e.target.checked)}
                      />
                      <div className="flex flex-col gap-1">
                        <label className="flex cursor-pointer items-center gap-2 text-label-md font-semibold text-ink" htmlFor="revoke-sessions">
                          Sign out of all other sessions
                          <span className="rounded-full bg-info px-2 py-0.5 text-label-sm font-medium text-primary">Recommended</span>
                        </label>
                        <p className="m-0 text-body-sm text-ink-variant">
                          Recommended if you suspect unauthorized access or used a public computer.
                        </p>
                      </div>
                    </div>

                    {submitError && (
                      <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
                        <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-primary-container text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving...' : 'Save New Password & Continue'}
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </button>
                      <div className="flex items-center justify-center">
                        <Link to="/login" className="inline-flex items-center gap-1.5 py-1 text-label-md text-ink-variant no-underline transition-colors hover:text-ink">
                          Cancel and return to sign in
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-1 text-label-sm text-ink-variant">
                  {TRUST_BADGES.map((badge) => (
                    <span key={badge.label} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">{badge.icon}</span>
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:col-span-5">
                <div className="flex flex-col gap-5 rounded-xl border border-outline/30 bg-card p-6 shadow-sm sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-mid text-primary">
                        <span className="material-symbols-outlined text-[18px]">shield</span>
                      </span>
                      <h2 className="text-headline-sm font-semibold text-ink">Password Security Tips</h2>
                    </div>
                    <span className="rounded bg-info px-2 py-0.5 text-label-sm font-medium text-primary">Best Practices</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {SECURITY_TIPS.map((tip) => (
                      <div key={tip.title} className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-mid text-primary">
                          <span className="material-symbols-outlined text-[14px]">{tip.icon}</span>
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-label-md font-semibold text-ink">{tip.title}</span>
                          <p className="m-0 text-body-sm text-ink-variant">{tip.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-xl border border-outline/30 bg-surface-low p-5">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-primary">help_outline</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-label-md font-semibold text-ink">Didn't request this reset?</span>
                    <p className="m-0 text-body-sm text-ink-variant">
                      If you did not initiate this change, your account may be at risk. Please contact our
                      security support team immediately.
                    </p>
                    <a
                      href="mailto:support@interviewai.com"
                      className="mt-1 inline-flex items-center gap-1 text-label-sm font-semibold text-primary no-underline hover:underline"
                    >
                      Contact Support
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-surface-low">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <p className="m-0 text-label-sm text-ink-variant">© 2025 InterviewAI Inc. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-6 text-label-sm text-ink-variant">
            <a href="#" className="no-underline transition-colors hover:text-ink">Privacy Policy</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Terms of Service</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Security</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Support</a>
          </nav>
        </div>
      </footer>

      {result && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-done-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
        >
          <div className="relative flex w-full max-w-[448px] flex-col gap-5 overflow-hidden rounded-xl border border-outline/30 bg-card p-6 text-center shadow-card sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-info text-primary shadow-sm">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </span>
            <div className="flex flex-col gap-2">
              <h2 id="reset-done-title" className="text-headline-lg text-ink">Password Updated Successfully</h2>
              <p className="m-0 text-body-md text-ink-variant">
                Your credentials have been securely updated. You can now sign in to your interview workspace.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border border-outline/30 bg-surface-low p-3 text-left font-mono text-[12px] text-ink-variant">
              <div className="flex justify-between">
                <span>REVOCATION_STATUS:</span>
                <span className="font-medium text-primary">
                  {result.signedOutEverywhere ? 'COMPLETED (ALL SESSIONS)' : 'SKIPPED (THIS DEVICE ONLY)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EVENT_ID:</span>
                <span className="text-ink">{result.eventId}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-label-md font-semibold text-on-primary no-underline shadow-sm transition-colors hover:bg-primary"
              >
                Continue to sign in
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent py-2 text-label-md text-ink-variant transition-colors hover:text-ink"
                onClick={() => setResult(null)}
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;
