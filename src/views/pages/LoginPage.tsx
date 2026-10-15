import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

const css = `
.lgn-page { min-height: 100vh; background: #faf8ff; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; color: #131b2e; }
.lgn-header { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(250,248,255,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
.lgn-header-inner { height: 64px; max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
.lgn-brand { display: flex; align-items: center; gap: 16px; }
.lgn-logo-link { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.lgn-logo-box { width: 32px; height: 32px; border-radius: 8px; background: #3525cd; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.lgn-wordmark { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: #131b2e; }
.lgn-wordmark em { font-style: normal; color: #3525cd; }
.lgn-header-divider { width: 1px; height: 16px; background: #c7c4d8; }
.lgn-back { display: none; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; color: #464555; text-decoration: none; transition: color 0.15s; }
.lgn-back:hover { color: #131b2e; }
.lgn-nav { display: flex; align-items: center; gap: 16px; }
.lgn-nav-active { font-size: 13px; font-weight: 600; color: #3525cd; }
.lgn-nav-link { font-size: 13px; font-weight: 500; color: #464555; text-decoration: none; transition: color 0.15s; }
.lgn-nav-link:hover { color: #131b2e; }
.lgn-main { flex: 1; padding-top: 64px; padding-left: 16px; padding-right: 16px; display: flex; align-items: center; }
.lgn-main-inner { width: 100%; max-width: 1152px; margin: 24px auto; }
.lgn-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: center; }
.lgn-card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 16px; }
.lgn-title { font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.02em; color: #131b2e; margin: 0; }
.lgn-title em { font-style: normal; color: #3525cd; }
.lgn-sso { display: grid; grid-template-columns: 1fr; gap: 8px; }
.lgn-sso-btn { height: 40px; padding: 0 12px; border: none; border-radius: 8px; background: #f2f3ff; color: #131b2e; font-family: inherit; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: background 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.lgn-sso-btn:hover { background: #eaedff; }
.lgn-divider { position: relative; display: flex; align-items: center; justify-content: center; margin: 2px 0; }
.lgn-divider-line { width: 100%; height: 1px; background: #e2e7ff; }
.lgn-divider-label { position: absolute; background: #ffffff; padding: 0 12px; font-size: 12px; font-weight: 500; color: #464555; text-transform: uppercase; letter-spacing: 0.06em; }
.lgn-form { display: flex; flex-direction: column; gap: 12px; }
.lgn-field { display: flex; flex-direction: column; gap: 4px; }
.lgn-label-row { display: flex; align-items: center; justify-content: space-between; }
.lgn-label { font-size: 13px; font-weight: 500; color: #131b2e; }
.lgn-forgot { font-size: 12px; font-weight: 500; color: #3525cd; text-decoration: none; }
.lgn-forgot:hover { color: #3323cc; text-decoration: underline; }
.lgn-input-wrap { position: relative; display: flex; align-items: center; }
.lgn-input-icon { position: absolute; left: 12px; font-size: 18px; color: #464555; pointer-events: none; }
.lgn-input { width: 100%; height: 44px; padding: 0 16px 0 40px; background: #f2f3ff; border: none; border-radius: 8px; color: #131b2e; font-family: inherit; font-size: 14px; transition: box-shadow 0.15s, background 0.15s; box-sizing: border-box; }
.lgn-input::placeholder { color: rgba(70,69,85,0.6); }
.lgn-input:focus { outline: none; box-shadow: 0 0 0 2px #3525cd; background: #ffffff; }
.lgn-eye { position: absolute; right: 12px; border: none; background: none; padding: 0; color: #464555; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.lgn-eye:hover { color: #131b2e; }
.lgn-remember-row { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
.lgn-remember { display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; font-size: 13px; color: #131b2e; }
.lgn-checkbox { width: 16px; height: 16px; accent-color: #3525cd; cursor: pointer; }
.lgn-actions { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.lgn-submit { width: 100%; height: 44px; border: none; background: #3525cd; color: #ffffff; border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); transition: background 0.15s, transform 0.05s; }
.lgn-submit:hover { background: #3323cc; }
.lgn-submit:active { transform: scale(0.99); }
.lgn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.lgn-ghost { width: 100%; height: 40px; border: none; background: #f2f3ff; color: #131b2e; border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.15s; }
.lgn-ghost:hover { background: #eaedff; }
.lgn-register-row { display: flex; align-items: center; justify-content: center; gap: 4px; padding-top: 4px; font-size: 13px; color: #464555; }
.lgn-register-link { font-size: 13px; font-weight: 600; color: #3525cd; text-decoration: none; }
.lgn-register-link:hover { text-decoration: underline; }
.lgn-alert { display: flex; align-items: flex-start; gap: 8px; border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 18px; }
.lgn-alert .material-symbols-outlined { font-size: 18px; flex-shrink: 0; }
.lgn-alert-success { background: #ecfdf5; color: #065f46; }
.lgn-alert-error { background: #ffdad6; color: #93000a; }
.lgn-alert-info { background: #e2dfff; color: #3323cc; }
.lgn-proof { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 16px; }
.lgn-proof-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.lgn-proof-title-row { display: flex; align-items: center; gap: 8px; }
.lgn-proof-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(53,37,205,0.1); color: #3525cd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lgn-proof-title { font-size: 15px; font-weight: 600; color: #131b2e; margin: 0; }
.lgn-chip { padding: 2px 8px; border-radius: 999px; background: #eaedff; color: #3525cd; font-size: 12px; font-weight: 600; white-space: nowrap; }
.lgn-quote-box { background: #f2f3ff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.lgn-quote-person { display: flex; align-items: center; gap: 8px; }
.lgn-avatar { width: 40px; height: 40px; border-radius: 999px; background: #3525cd; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.lgn-quote-name { font-size: 13px; font-weight: 500; color: #131b2e; }
.lgn-quote-role { font-size: 13px; color: #464555; }
.lgn-quote-text { margin: 0; font-size: 13px; line-height: 18px; color: #131b2e; font-style: italic; }
.lgn-stats { display: flex; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid rgba(226,231,255,0.6); }
.lgn-stat { display: flex; flex-direction: column; }
.lgn-stat-value { font-size: 28px; line-height: 32px; font-weight: 600; color: #3525cd; letter-spacing: -0.02em; }
.lgn-stat-label { font-size: 12px; color: #464555; }
.lgn-stat-divider { height: 32px; width: 1px; background: #c7c4d8; }
.lgn-sec-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 4px; flex-wrap: wrap; }
.lgn-sec-left { display: flex; align-items: center; gap: 4px; color: #464555; font-size: 12px; font-weight: 500; }
.lgn-sec-ssl { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(70,69,85,0.7); }
.lgn-footer { background: rgba(255,255,255,0.6); box-shadow: 0 -1px 8px rgba(0,0,0,0.02); }
.lgn-footer-inner { max-width: 1280px; margin: 0 auto; padding: 16px 24px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 12px; }
.lgn-footer-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center; }
.lgn-soc-badge { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: #eaedff; color: #131b2e; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.lgn-copyright { font-size: 12px; color: #464555; }
@media (min-width: 640px) {
  .lgn-back { display: flex; }
  .lgn-sso { grid-template-columns: repeat(3, 1fr); }
  .lgn-footer-inner { flex-direction: row; }
}
@media (min-width: 1024px) {
  .lgn-grid { grid-template-columns: repeat(12, 1fr); }
  .lgn-col-left { grid-column: span 7; }
  .lgn-col-right { grid-column: span 5; }
}
`;

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

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  const registered = searchParams.get('registered');

  useEffect(() => {
    let alive = true;
    AuthService.getGoogleClientId()
      .then((res) => {
        if (alive) setGoogleClientId(res.data.data || '');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const handleGoogleLogin = async () => {
    setNotice('');
    if (!googleClientId) {
      comingSoon('Đăng nhập bằng Google');
      return;
    }
    try {
      await loadGsiScript();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: false,
        cancel_on_tap_outside: false,
        callback: (resp: { credential: string }) =>
          loginWithGoogle(resp.credential, rememberMeRef.current),
      });
      window.google.accounts.id.prompt(() => {});
    } catch {
      comingSoon('Đăng nhập bằng Google');
    }
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
    setNotice(`${feature} sắp ra mặt. Vui lòng dùng email và mật khẩu.`);
  };

  return (
    <div className="lgn-page">
      <style>{css}</style>

      <header className="lgn-header">
        <div className="lgn-header-inner">
          <div className="lgn-brand">
            <Link to="/" className="lgn-logo-link">
              <span className="lgn-logo-box">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>neurology</span>
              </span>
              <span className="lgn-wordmark">Interview<em>AI</em></span>
            </Link>
            <span className="lgn-header-divider" />
            <Link to="/" className="lgn-back">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              Và trang chủ
            </Link>
          </div>
          <nav className="lgn-nav">
            <span className="lgn-nav-active" aria-current="page">Đăng nhập</span>
            <Link to="/register" className="lgn-nav-link">Đăng ký</Link>
          </nav>
        </div>
      </header>

      <main className="lgn-main">
        <div className="lgn-main-inner">
          <div className="lgn-grid">
            <div className="lgn-col-left">
              <div className="lgn-card">
                <h1 className="lgn-title">Chào mừng trở lại Interview<em>AI</em></h1>

                <div className="lgn-sso">
                  <button type="button" className="lgn-sso-btn" onClick={() => comingSoon('Đăng nhập bằng GitHub')}>
                    <GitHubIcon /> GitHub
                  </button>
                  <button type="button" className="lgn-sso-btn" onClick={handleGoogleLogin}>
                    <GoogleIcon /> Google
                  </button>
                  <button type="button" className="lgn-sso-btn" onClick={() => comingSoon('SSO doanh nghiệp')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3525cd' }}>domain</span>
                    SSO Doanh nghiệp
                  </button>
                </div>

                <div className="lgn-divider">
                  <div className="lgn-divider-line" />
                  <span className="lgn-divider-label">Hoặc</span>
                </div>

                <form className="lgn-form" onSubmit={handleSubmit}>
                  {registered === 'true' && (
                    <div className="lgn-alert lgn-alert-success">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.</span>
                    </div>
                  )}
                  {error && (
                    <div className="lgn-alert lgn-alert-error" role="alert">
                      <span className="material-symbols-outlined">error</span>
                      <span>{error}</span>
                    </div>
                  )}
                  {notice && (
                    <div className="lgn-alert lgn-alert-info">
                      <span className="material-symbols-outlined">info</span>
                      <span>{notice}</span>
                    </div>
                  )}

                  <div className="lgn-field">
                    <label className="lgn-label-row" htmlFor="email">
                      <span className="lgn-label">Địa chỉ email</span>
                    </label>
                    <div className="lgn-input-wrap">
                      <span className="material-symbols-outlined lgn-input-icon">mail</span>
                      <input
                        className="lgn-input"
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

                  <div className="lgn-field">
                    <div className="lgn-label-row">
                      <label className="lgn-label" htmlFor="password">Mật khẩu</label>
                      <Link to="/forgot-password" className="lgn-forgot">Quên mật khẩu?</Link>
                    </div>
                    <div className="lgn-input-wrap">
                      <span className="material-symbols-outlined lgn-input-icon">lock</span>
                      <input
                        className="lgn-input"
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        value={form.password}
                        onChange={handleChange}
                        style={{ paddingRight: 40 }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="lgn-eye"
                        aria-label="Hiện/ẩn mật khẩu"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="lgn-remember-row">
                    <label className="lgn-remember">
                      <input
                        type="checkbox"
                        className="lgn-checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Ghi nhớ đăng nhập
                    </label>
                  </div>

                  <div className="lgn-actions">
                    <button type="submit" className="lgn-submit" disabled={loading}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span>
                      {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                    <button
                      type="button"
                      className="lgn-ghost"
                      onClick={() => comingSoon('Liên kết đăng nhập qua email')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3525cd' }}>mail</span>
                      Gửi liên kết đăng nhập qua email
                    </button>
                  </div>
                </form>

                <div className="lgn-register-row">
                  <span>Chưa có tài khoản InterviewAI?</span>
                  <Link to="/register" className="lgn-register-link">Đăng ký miễn phí</Link>
                </div>
              </div>
            </div>

            <div className="lgn-col-right">
              <div className="lgn-proof">
                <div className="lgn-proof-head">
                  <div className="lgn-proof-title-row">
                    <span className="lgn-proof-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>verified</span>
                    </span>
                    <h2 className="lgn-proof-title">Đánh giá công bằng, khách quan</h2>
                  </div>
                  <span className="lgn-chip">Chuẩn doanh nghiệp</span>
                </div>
                <div className="lgn-quote-box">
                  <div className="lgn-quote-person">
                    <span className="lgn-avatar">ER</span>
                    <div>
                      <div className="lgn-quote-name">Elena Rostova</div>
                      <div className="lgn-quote-role">VP Kỹ thuật tại Synthetix</div>
                    </div>
                  </div>
                  <p className="lgn-quote-text">
                    “InterviewAI giúp quy trình tuyển kỹ sư của chúng tôi rút từ hai tuần xuống chưa tới 48 giờ, đồng thời mang lại trải nghiệm nhất quán và công bằng hơn nhiều cho ứng viên.”
                  </p>
                  <div className="lgn-stats">
                    <div className="lgn-stat">
                      <span className="lgn-stat-value">92%</span>
                      <span className="lgn-stat-label">Nhanh hơn chu kỳ tuyển dụng</span>
                    </div>
                    <span className="lgn-stat-divider" />
                    <div className="lgn-stat">
                      <span className="lgn-stat-value">4.9/5</span>
                      <span className="lgn-stat-label">Điểm đánh giá của ứng viên</span>
                    </div>
                  </div>
                </div>
                <div className="lgn-sec-row">
                  <span className="lgn-sec-left">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3525cd' }}>security</span>
                    Bảo mật cấp doanh nghiệp • SOC-2 Type II
                  </span>
                  <span className="lgn-sec-ssl">256-bit SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="lgn-footer">
        <div className="lgn-footer-inner">
          <div className="lgn-footer-left">
            <span className="lgn-soc-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#3525cd' }}>verified_user</span>
              SOC-2 TYPE II COMPLIANT
            </span>
            <span className="lgn-copyright">© 2025 InterviewAI Inc. Deterministic Intelligence.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
