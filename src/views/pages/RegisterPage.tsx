import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/auth.service';

declare global {
  interface Window {
    google?: any;
  }
}

let gsiScript: Promise<void> | null = null;
const loadGsiScript = () => {
  if (!gsiScript) {
    gsiScript = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gsiScript = null;
        reject(new Error('GSI load failed'));
      };
      document.head.appendChild(s);
    });
  }
  return gsiScript;
};

const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const GitHubIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path clipRule="evenodd" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const OAUTH_PROVIDER_KEY = 'oauth_provider';
const OAUTH_STATE_KEY = 'oauth_state';

const randomToken = () =>
  window.crypto && 'randomUUID' in window.crypto
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle, loading, error } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [notice, setNotice] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [githubClientId, setGithubClientId] = useState('');

  // GitHub chỉ nhận callback đã đăng ký ở /login nên lượt về từ GitHub luôn về màn Sign In.
  const githubRedirectUri = window.location.origin + '/login';

  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

  useEffect(() => {
    let alive = true;
    AuthService.getGoogleClientId()
      .then((res) => {
        if (alive) setGoogleClientId(res.data.data || '');
      })
      .catch(() => {});
    AuthService.getGithubClientId()
      .then((res) => {
        if (alive) setGithubClientId(res.data.data || '');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const googleMountRef = useRef<HTMLDivElement>(null);
  const [googleGsiUnavailable, setGoogleGsiUnavailable] = useState(false);

  useEffect(() => {
    if (!googleClientId) return;
    let alive = true;
    loadGsiScript()
      .then(() => {
        if (!alive || !googleMountRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          callback: (resp: { credential: string }) => loginWithGoogleRef.current(resp.credential, true),
        });
        const hostWidth = googleMountRef.current.parentElement?.offsetWidth || 200;
        window.google.accounts.id.renderButton(googleMountRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(400, Math.max(50, hostWidth)),
        });
      })
      .catch(() => {
        if (alive) setGoogleGsiUnavailable(true);
      });
    return () => {
      alive = false;
    };
  }, [googleClientId]);

  const handleGoogleUnavailable = () => {
    setNotice('Sign up with Google is unavailable right now. Please create your account with email.');
  };

  const handleGithubSignup = () => {
    setNotice('');
    if (!githubClientId) {
      setNotice('Sign up with GitHub is unavailable right now. Please create your account with email.');
      return;
    }
    const state = randomToken();
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, 'github');
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    const params = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: githubRedirectUri,
      scope: 'read:user user:email',
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${params.toString()}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    if (!termsAccepted) {
      setNotice('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    register(form);
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
              <span className="text-[13px] font-semibold text-primary" aria-current="page">Sign Up</span>
            </div>
            <Link to="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary no-underline">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center bg-surface px-4 pt-16">
        <div className="mx-auto flex w-full max-w-[1024px] flex-1 items-center justify-center px-2 py-6">
          <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-xl border border-surface-mid bg-card p-6 shadow-md sm:p-10 lg:col-span-7">
              <div className="flex flex-col">
                <h1 className="mb-1 text-headline-lg text-ink sm:text-display">Create your account</h1>
                <p className="mb-4 text-body-md text-ink-variant">Get started with AI-driven interview practice and hiring.</p>

                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="relative h-10 overflow-hidden rounded-lg bg-surface-low shadow-sm transition-colors hover:bg-surface-mid">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 px-3 text-label-md text-ink">
                      <GoogleIcon /> Continue with Google
                    </span>
                    <div
                      ref={googleMountRef}
                      className={`absolute inset-0 ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-10`}
                    />
                    {(!googleClientId || googleGsiUnavailable) && (
                      <button
                        type="button"
                        aria-label="Continue with Google"
                        className="absolute inset-0 h-full w-full cursor-pointer rounded-lg border-0 bg-transparent text-[1px] text-transparent"
                        onClick={handleGoogleUnavailable}
                      >
                        Continue with Google
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-2.5 rounded-lg border-0 bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid"
                    onClick={handleGithubSignup}
                  >
                    <GitHubIcon /> Continue with GitHub
                  </button>
                </div>

                <div className="relative mb-4 flex items-center py-2">
                  <div className="h-px flex-1 bg-surface-mid" />
                  <span className="mx-3 text-label-sm uppercase tracking-[0.06em] text-ink-variant">OR</span>
                  <div className="h-px flex-1 bg-surface-mid" />
                </div>

                <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                      <span>{error}</span>
                    </div>
                  )}
                  {notice && (
                    <div className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-body-sm text-info-text">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">info</span>
                      <span>{notice}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-ink" htmlFor="full-name">Full Name</label>
                    <input
                      className="h-10 rounded-lg border border-surface-mid bg-surface-low px-3 text-body-md text-ink shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                      id="full-name"
                      name="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      required
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-ink" htmlFor="work-email">Work/Personal Email</label>
                    <input
                      className="h-10 rounded-lg border border-surface-mid bg-surface-low px-3 text-body-md text-ink shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                      id="work-email"
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-ink" htmlFor="password-input">Password</label>
                    <div className="relative">
                      <input
                        className="h-10 w-full box-border rounded-lg border border-surface-mid bg-surface-low px-3 pr-10 text-body-md text-ink shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                        id="password-input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 flex items-center justify-center border-0 bg-transparent p-0 text-outline transition-colors hover:text-ink"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      className="h-4 w-4 cursor-pointer rounded accent-primary"
                      id="terms-consent"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label className="cursor-pointer text-body-sm text-ink-variant" htmlFor="terms-consent">
                      I agree to the{' '}
                      <a href="#" className="font-medium text-primary no-underline hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="font-medium text-primary no-underline hover:underline">Privacy Policy</a>.
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-primary text-label-md font-semibold tracking-wide text-on-primary shadow-md transition-all hover:bg-secondary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loading}
                    >
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1 border-t border-surface-mid pt-6">
                <span className="text-body-sm text-ink-variant">Already have an account?</span>
                <Link to="/login" className="flex items-center gap-0.5 text-label-md font-semibold text-primary no-underline hover:underline">
                  Sign in <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-8 shadow-md sm:p-10 lg:col-span-5">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-label-sm text-on-primary backdrop-blur-md">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>AI-Powered Technical Assessment</span>
                </div>
                <h2 className="m-0 text-headline-lg tracking-tight text-white">
                  Join 50,000+ candidates and companies streamlining technical interviews.
                </h2>
                <p className="m-0 text-body-md leading-relaxed text-white/80">
                  Get realistic interview simulations with real-time feedback, deep codebase analysis, and objective
                  multi-dimensional candidate evaluation.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { icon: 'verified', label: 'Fair AI evaluations' },
                    { icon: 'checklist', label: 'Automated rubrics' },
                    { icon: 'bolt', label: 'Instant feedback' },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-label-sm text-white backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                      <span>{chip.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 pt-6">
                <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-white">
                    ER
                  </span>
                  <div className="flex flex-col">
                    <p className="m-0 text-body-sm italic text-white">
                      “InterviewAI identified my system architecture gaps in minutes. Landed my L5 role in two weeks!”
                    </p>
                    <span className="mt-1 text-label-sm font-semibold text-white/90">
                      Elena R. · Senior Backend Engineer
                    </span>
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

export default RegisterPage;
