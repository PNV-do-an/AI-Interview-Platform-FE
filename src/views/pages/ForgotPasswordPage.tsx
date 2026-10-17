import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await AuthService.forgotPassword(email);
      setMessage(
        res.data.message ||
          "If an account exists with this email address, you'll receive a password reset link shortly.",
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface font-sans text-ink">
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

      <main className="flex w-full flex-1 items-center justify-center px-4 pt-16">
        <div className="mx-auto w-full max-w-[480px] rounded-xl border border-surface-mid bg-card p-6 shadow-md sm:p-10">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg text-info-text">
            <span className="material-symbols-outlined text-[20px]">key</span>
          </div>
          <h1 className="m-0 text-headline-lg text-ink">Reset Password</h1>
          <p className="mt-2 mb-6 text-body-md text-ink-variant">
            Enter your email to receive recovery instructions. We'll send a password reset link if the
            email exists in our system.
          </p>

          {message ? (
            <div>
              <div role="status" className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text">
                <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
                <span>{message}</span>
              </div>
              <p className="mt-4">
                <Link to="/login" className="text-body-sm font-medium text-primary no-underline hover:underline">← Back to sign in</Link>
              </p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label className="text-label-md font-medium text-ink" htmlFor="email">Email address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-ink-variant">mail</span>
                  <input
                    id="email"
                    className="h-11 w-full box-border rounded-lg border-0 bg-surface-low pl-10 pr-4 text-body-md text-ink transition-all placeholder:text-ink-variant/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-1 rounded-lg border-0 bg-primary text-label-md font-semibold text-on-primary shadow-md transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  {loading ? 'Sending...' : 'Send link'}
                </button>
              </div>
              <p>
                <Link to="/login" className="text-body-sm font-medium text-primary no-underline hover:underline">← Back to sign in</Link>
              </p>
            </form>
          )}
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
