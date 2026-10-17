import React, { useState, useEffect } from 'react';
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

const GitHubIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path clipRule="evenodd" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" fill="#34A853" />
    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
  </svg>
);

const inputClass =
  'h-10 w-full box-border rounded-lg border-0 bg-surface-low px-3 text-body-md text-ink transition-all placeholder:text-ink-variant/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary';

const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle, loading, error } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [githubClientId, setGithubClientId] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const comingSoon = (feature: string) => {
    setNotice(`${feature} is coming soon. Please use email and password.`);
  };

  const handleGithubSignup = () => {
    setNotice('');
    if (!githubClientId) {
      comingSoon('Sign up with GitHub');
      return;
    }
    // OAuth app chi cho phep callback ve /login -> bao mat luu o day de LoginPage xu ly ?code=
    const state =
      window.crypto && 'randomUUID' in window.crypto
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('github_oauth_state', state);
    const params = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: window.location.origin + '/login',
      scope: 'read:user user:email',
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${params.toString()}`);
  };

  const handleGoogleSignup = async () => {
    setNotice('');
    if (!googleClientId) {
      comingSoon('Sign up with Google');
      return;
    }
    try {
      await loadGsiScript();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: false,
        cancel_on_tap_outside: false,
        callback: (resp: { credential: string }) => loginWithGoogle(resp.credential, false),
      });
      window.google.accounts.id.prompt(() => {});
    } catch {
      comingSoon('Sign up with Google');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    const checks = [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /[a-z]/.test(form.password),
      /\d/.test(form.password),
      /[@#$%^&+=!]/.test(form.password),
    ];
    if (!checks.every(Boolean)) {
      errs.password = 'Min 8 chars with uppercase, lowercase, number & special char (@#$%^&+=!)';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0 || !acceptedTerms) return;
    register({ fullName: form.fullName, email: form.email, password: form.password });
  };

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
              <span className="text-[13px] font-semibold text-primary" aria-current="page">Sign Up</span>
            </div>
            <Link to="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary no-underline">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 pt-16">
        <div className="mx-auto my-6 w-full max-w-[1152px]">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-xl bg-card p-6 shadow-card sm:p-10 lg:col-span-7">
              <div className="flex flex-col">
                <h1 className="m-0 mb-1 text-headline-lg text-ink">Create your account</h1>
                <p className="m-0 mb-6 text-body-md text-ink-variant">
                  Get started with AI-driven interview practice and hiring.
                </p>

                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid"
                    onClick={handleGoogleSignup}
                  >
                    <GoogleIcon /> Continue with Google
                  </button>
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid"
                    onClick={handleGithubSignup}
                  >
                    <GitHubIcon /> Continue with GitHub
                  </button>
                </div>

                <div className="relative my-2 flex items-center justify-center">
                  <div className="h-px w-full bg-surface-mid" />
                  <span className="absolute bg-card px-3 text-label-sm uppercase tracking-[0.06em] text-ink-variant">OR</span>
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
                      className={inputClass}
                      id="full-name"
                      name="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                    {fieldErrors.fullName && <small className="text-body-sm text-danger-text">{fieldErrors.fullName}</small>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-ink" htmlFor="work-email">Work/Personal Email</label>
                    <input
                      className={inputClass}
                      id="work-email"
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      required
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    {fieldErrors.email && <small className="text-body-sm text-danger-text">{fieldErrors.email}</small>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-label-md font-medium text-ink" htmlFor="password-input">Password</label>
                    <div className="relative flex items-center">
                      <input
                        className="h-10 w-full box-border rounded-lg border-0 bg-surface-low px-3 pr-10 text-body-md text-ink transition-all placeholder:text-ink-variant/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        id="password-input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 flex items-center justify-center border-0 bg-transparent p-0 text-ink-variant transition-colors hover:text-ink"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {fieldErrors.password && <small className="text-body-sm text-danger-text">{fieldErrors.password}</small>}
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                      id="terms-consent"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <label className="cursor-pointer text-body-sm text-ink-variant" htmlFor="terms-consent">
                      I agree to the <a href="#" className="font-medium text-primary hover:underline">Terms of Service</a> and{' '}
                      <a href="#" className="font-medium text-primary hover:underline">Privacy Policy</a>.
                    </label>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-primary text-label-md font-semibold text-on-primary shadow-md transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loading || !acceptedTerms}
                    >
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1 border-t border-surface-mid pt-6 text-body-sm text-ink-variant">
                <span>Already have an account?</span>
                <Link to="/login" className="flex items-center gap-0.5 text-label-md font-semibold text-primary no-underline hover:underline">
                  Sign in <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-8 text-on-primary shadow-card sm:p-10 lg:col-span-5">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-label-sm backdrop-blur-md">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>AI-Powered Technical Assessment</span>
                </div>
                <h2 className="m-0 text-headline-lg tracking-[-0.02em] text-white">
                  Join 50,000+ candidates and companies streamlining technical interviews.
                </h2>
                <p className="m-0 leading-relaxed text-white/80 text-body-md">
                  Get realistic interview simulations with real-time feedback, deep codebase analysis,
                  and objective multi-dimensional candidate evaluation.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-label-sm text-white backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Fair AI evaluations</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-label-sm text-white backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[16px]">checklist</span>
                    <span>Automated rubrics</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-label-sm text-white backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Instant feedback</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-6 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-white">ER</div>
                  <div className="flex flex-col">
                    <p className="m-0 text-body-sm italic text-white">
                      “InterviewAI identified my system architecture gaps in minutes. Landed my L5 role in two weeks!”
                    </p>
                    <span className="mt-1 text-label-sm font-semibold text-white/90">Elena R. · Senior Backend Engineer</span>
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
