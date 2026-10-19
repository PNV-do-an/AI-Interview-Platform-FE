import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/auth.service';
import { SsoConfig } from '../../models/Api.model';

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

const OAUTH_PROVIDER_KEY = 'oauth_provider';
const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_NONCE_KEY = 'oauth_nonce';

const randomToken = () =>
  window.crypto && 'randomUUID' in window.crypto
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loginWithGithub, loginWithSso, loading, error, errorStatus } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [githubClientId, setGithubClientId] = useState('');
  const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = window.setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  const registered = searchParams.get('registered');

  const redirectUri = window.location.origin + window.location.pathname;

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
    AuthService.getSsoConfig()
      .then((res) => {
        if (alive) setSsoConfig(res.data.data || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Callback OAuth chung: /login?code=...&state=... — provider (github|sso) nhớ trong sessionStorage
  const oauthHandledRef = useRef(false);
  useEffect(() => {
    if (oauthHandledRef.current) return;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    if (!code && !oauthError) return;
    oauthHandledRef.current = true;

    const provider = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
    const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    const nonce = sessionStorage.getItem(OAUTH_NONCE_KEY) || '';
    sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_NONCE_KEY);
    setSearchParams({}, { replace: true });

    if (oauthError) {
      setNotice(oauthError === 'access_denied' ? 'Sign-in was cancelled.' : 'Sign-in failed. Please try again.');
      return;
    }
    if (!provider || !savedState || savedState !== searchParams.get('state')) {
      setNotice('Sign-in link expired. Please try again.');
      return;
    }
    if (provider === 'github') {
      loginWithGithub(code!, redirectUri, rememberMeRef.current);
    } else {
      loginWithSso(code!, redirectUri, nonce, rememberMeRef.current);
    }
  }, [searchParams, setSearchParams, loginWithGithub, loginWithSso, redirectUri]);

  const handleGithubLogin = () => {
    setNotice('');
    if (!githubClientId) {
      comingSoon('Sign in with GitHub');
      return;
    }
    const state = randomToken();
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, 'github');
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    const params = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${params.toString()}`);
  };

  const handleSsoLogin = () => {
    setNotice('');
    if (!ssoConfig?.enabled || !ssoConfig.authorizationEndpoint) {
      comingSoon('Enterprise SSO');
      return;
    }
    const state = randomToken();
    const nonce = randomToken();
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, 'sso');
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);
    const params = new URLSearchParams({
      client_id: ssoConfig.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: ssoConfig.scopes || 'openid email profile',
      state,
      nonce,
    });
    window.location.assign(`${ssoConfig.authorizationEndpoint}?${params.toString()}`);
  };

  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

  // Nút Google do GSI render (chuẩn FedCM). One Tap prompt() cũ bị suppression nên bấm không ra popup.
  const googleMountRef = useRef<HTMLDivElement>(null);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
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
          callback: (resp: { credential: string }) =>
            loginWithGoogleRef.current(resp.credential, rememberMeRef.current),
        });
        const hostWidth = googleMountRef.current.parentElement?.offsetWidth || 200;
        window.google.accounts.id.renderButton(googleMountRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(400, Math.max(50, hostWidth)),
        });
        setGoogleButtonReady(true);
      })
      .catch(() => {
        if (alive) setGoogleGsiUnavailable(true);
      });
    return () => {
      alive = false;
    };
  }, [googleClientId]);

  const handleGoogleUnavailable = () => {
    setNotice('Sign in with Google is unavailable right now. Please use email and password.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    login(form, rememberMe);
  };

  const comingSoon = (feature: string) => {
    setNotice(`${feature} is coming soon. Please use email and password.`);
  };

  // BE trả 401 + "Tài khoản chưa được kích hoạt..." khi user chưa bấm link verify.
  const needsVerification = errorStatus === 401 && /chưa được kích hoạt/i.test(error);

  const handleResendVerification = async () => {
    if (!form.email || resendState === 'sending' || resendCooldown > 0) return;
    setResendError('');
    setResendState('sending');
    try {
      await AuthService.resendVerification(form.email);
      setResendState('sent');
      setResendCooldown(60);
    } catch (err: any) {
      setResendError(err.response?.data?.message || 'Could not resend the verification email. Please try again.');
      setResendState('idle');
    }
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
              <span className="text-[13px] font-semibold text-primary" aria-current="page">Sign In</span>
              <Link to="/register" className="text-label-md text-ink-variant no-underline transition-colors hover:text-ink">Sign Up</Link>
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
            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="flex h-full flex-col justify-between gap-4 rounded-xl bg-card p-6 shadow-card">
                <div className="flex flex-col gap-1">
                  <h1 className="m-0 text-headline-lg text-ink">
                    Welcome back to Interview<em className="not-italic text-primary">AI</em>
                  </h1>
                  <p className="m-0 text-body-sm text-ink-variant">
                    Sign in to access your technical interviews, benchmarks, and candidate analytics.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-1 rounded-lg border-0 bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid"
                    onClick={handleGithubLogin}
                  >
                    <GitHubIcon /> GitHub
                  </button>
                  <div className="relative h-10 overflow-hidden rounded-lg bg-surface-low shadow-sm transition-colors hover:bg-surface-mid">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-label-md text-ink">
                      <GoogleIcon /> Google
                    </span>
                    <div
                      ref={googleMountRef}
                      className={`absolute inset-0 ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-10`}
                    />
                    {(!googleClientId || googleGsiUnavailable) && (
                      <button
                        type="button"
                        aria-label="Sign in with Google"
                        className="absolute inset-0 h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent text-[1px] text-transparent"
                        onClick={handleGoogleUnavailable}
                      >
                        Sign in with Google
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center gap-1 rounded-lg border-0 bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid"
                    onClick={handleSsoLogin}
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
                    Enterprise SSO
                  </button>
                </div>

                <div className="relative my-1 flex items-center justify-center">
                  <div className="h-px w-full bg-surface-high" />
                  <span className="absolute bg-card px-3 text-label-sm uppercase tracking-[0.06em] text-ink-variant">OR</span>
                </div>

                <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                  {registered === 'true' && (
                    <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">mark_email_unread</span>
                      <span>Account created! Check your inbox and click the verification link before signing in.</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                      <span>{error}</span>
                    </div>
                  )}
                  {needsVerification && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-3 py-2 text-body-sm text-ink-variant">
                      <span>Didn't get the email?</span>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendState === 'sending' || resendCooldown > 0}
                        className="cursor-pointer border-0 bg-transparent p-0 text-label-sm font-medium text-primary no-underline hover:underline disabled:cursor-not-allowed disabled:text-ink-variant disabled:no-underline"
                      >
                        {resendState === 'sending'
                          ? 'Sending...'
                          : resendCooldown > 0
                            ? `Resend available in ${resendCooldown}s`
                            : resendState === 'sent'
                              ? 'Verification email sent'
                              : 'Resend verification email'}
                      </button>
                    </div>
                  )}
                  {resendError && (
                    <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                      <span>{resendError}</span>
                    </div>
                  )}
                  {notice && (
                    <div className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-body-sm text-info-text">
                      <span className="material-symbols-outlined shrink-0 text-[18px]">info</span>
                      <span>{notice}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="flex items-center justify-between" htmlFor="email">
                      <span className="text-label-md text-ink">Email Address</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-ink-variant">mail</span>
                      <input
                        className="h-11 w-full box-border rounded-lg border-0 bg-surface-low pl-10 pr-4 text-body-md text-ink transition-all placeholder:text-ink-variant/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        required
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-label-md text-ink" htmlFor="password">Password</label>
                      <Link to="/forgot-password" className="text-label-sm text-primary no-underline transition-colors hover:text-primary-hover hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-ink-variant">lock</span>
                      <input
                        className="h-11 w-full box-border rounded-lg border-0 bg-surface-low pl-10 pr-10 text-body-md text-ink transition-all placeholder:text-ink-variant/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
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
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer select-none items-center gap-1 text-body-sm text-ink">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex h-11 w-full items-center justify-center gap-1 rounded-lg border-0 bg-primary text-label-md text-on-primary shadow-md transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-center gap-1 border-t border-surface-high/60 pt-1 text-body-sm text-ink-variant">
                  <span>Don't have an InterviewAI account?</span>
                  <Link to="/register" className="text-[13px] font-semibold text-primary no-underline hover:underline">Sign up for free</Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-5">
              <div className="flex h-full flex-col justify-between gap-4 rounded-xl bg-card p-6 shadow-proof">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </span>
                      <h2 className="m-0 text-headline-sm text-ink">Fair, Objective Evaluations</h2>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-surface-mid px-2 py-0.5 text-label-sm font-semibold text-primary">Enterprise Ready</span>
                  </div>
                  <p className="m-0 text-body-sm text-ink-variant">
                    Calibrated AI technical interviews designed to eliminate bias and accelerate your hiring cycles.
                  </p>
                </div>
                <div className="flex flex-col gap-3 rounded-lg bg-surface-low p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-label-md font-semibold text-on-primary">ER</span>
                    <div>
                      <div className="text-label-md text-ink">Elena Rostova</div>
                      <div className="text-body-sm text-ink-variant">VP of Engineering at Synthetix</div>
                    </div>
                  </div>
                  <p className="m-0 text-body-sm italic text-ink">
                    “InterviewAI reduced our engineering loop from two weeks to under 48 hours while creating a far more consistent, fair experience for candidates.”
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-surface-high/60 pt-2">
                  <div className="flex flex-col">
                    <span className="text-metric-stat text-primary">92%</span>
                    <span className="text-label-sm text-ink-variant">Faster hiring cycles</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-metric-stat text-primary">4.9/5</span>
                    <span className="text-label-sm text-ink-variant">Candidate rating</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-metric-stat text-primary">10k+</span>
                    <span className="text-label-sm text-ink-variant">AI interviews</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-label-sm text-ink-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                  <span>Trusted by over 400+ engineering teams globally</span>
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
            <a href="#" className="no-underline transition-colors hover:text-ink">Status</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
