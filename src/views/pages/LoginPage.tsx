import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/auth.service';
import { readApiErrorMessage } from '../../utils/apiError';
import logoWordmark from '../../assets/logo-wordmark.png';

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
  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const LOGIN_BENEFITS = [
  {
    title: 'Phản xạ thời gian thực',
    body: 'AI phân tích giọng nói, ngữ điệu và cấu trúc trả lời ngay trong buổi luyện.',
  },
  {
    title: 'Chuẩn hóa theo khung STAR',
    body: 'Ngân hàng câu hỏi thực chiến bám sát quy trình phỏng vấn quốc tế.',
  },
  {
    title: 'Kết nối nhà tuyển dụng',
    body: 'Hồ sơ năng lực nổi bật đến thẳng doanh nghiệp công nghệ và Mentor.',
  },
];

const COMPANY_CHIPS = ['VNG', 'FPT SOFTWARE', 'VIETTEL', 'SHOPEE', 'MOMO'];

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loading, error, errorStatus } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
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

  // Nút Google do GSI render (chuẩn FedCM) đặt trong suốt đè lên nút của thiết kế,
  // nếu không popup Google bị trình duyệt chặn (One Tap prompt() suppression).
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
      })
      .catch(() => {
        if (alive) setGoogleGsiUnavailable(true);
      });
    return () => {
      alive = false;
    };
  }, [googleClientId]);

  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

  const handleGoogleUnavailable = () => {
    setNotice('Đăng nhập với Google hiện không khả dụng. Vui lòng dùng email và mật khẩu.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    login(form, rememberMe);
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
      setResendError(readApiErrorMessage(err, 'Không gửi lại được email xác thực. Vui lòng thử lại.', ['email']));
      setResendState('idle');
    }
  };

  const inputClass =
    'h-11 w-full rounded-xl border border-outline bg-card pl-10 pr-4 text-body-md text-ink shadow-sm ' +
    'placeholder:text-outline-strong transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15';

  return (
    /* Desktop khoá đúng chiều cao màn hình, mỗi panel tự cuộn trong; mobile vẫn cuộn trang bình thường. */
    <main className="w-full lg:h-screen lg:overflow-hidden">
      <div className="w-full lg:h-full">
        <div className="grid w-full min-h-screen grid-cols-1 overflow-hidden bg-surface lg:h-screen lg:grid-cols-12">
          {/* LEFT PANEL: brand showcase (ẩn trên mobile để form login hiện ngay) */}
          <section className="relative hidden flex-col justify-between overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#0b0f19] p-6 text-[#eef0ff] sm:p-8 lg:col-span-5 lg:flex lg:h-full lg:p-8">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-36 -top-36 h-96 w-96 rounded-full bg-primary/25 blur-[130px]" />
              <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-fixed/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 items-center justify-center rounded-xl bg-white px-3 shadow-lg">
                <img alt="AI Interview Logo" className="h-4 w-auto object-contain" src={logoWordmark} />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Nền tảng phỏng vấn AI</span>
            </div>

            <div className="relative z-10 my-auto space-y-5 py-3">
              <div className="space-y-3">
                <h1 className="text-[28px] font-extrabold leading-[1.25] tracking-tight text-white lg:text-[30px]">
                  Luyện phỏng vấn cùng AI, tự tin{' '}
                  <span className="bg-gradient-to-r from-primary-fixed via-secondary-fixed-dim to-secondary-fixed bg-clip-text text-transparent">
                    bứt phá
                  </span>{' '}
                  sự nghiệp
                </h1>
                <p className="max-w-lg text-sm leading-relaxed text-slate-300/90">
                  Hơn 50.000+ ứng viên rèn luyện phản xạ thời gian thực và gia nhập các tập đoàn công nghệ lớn.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {LOGIN_BENEFITS.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-secondary-fixed/30 bg-secondary-fixed/10">
                      <span className="material-symbols-outlined text-[14px] text-secondary-fixed">check</span>
                    </span>
                    <div>
                      <h4 className="text-[13px] font-semibold leading-5 text-white">{benefit.title}</h4>
                      <p className="mt-0.5 text-[12px] leading-[18px] text-slate-400">{benefit.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-surface-highest/15 bg-card/10 p-4 text-white shadow-2xl backdrop-blur-md [@media(max-height:899px)]:hidden">
                <div className="flex items-start justify-between gap-3 border-b border-surface-highest/15 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-container text-[15px] font-bold shadow-md">
                      MA
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[15px] font-semibold leading-5 text-white">Nguyễn Minh Anh</h4>
                      <p className="text-[12px] leading-[18px] text-slate-400">Software Engineer Candidate</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-secondary-fixed/30 bg-secondary-fixed/10 px-2.5 py-1 text-[12px] font-semibold text-secondary-fixed">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> Match: 94%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-surface-highest/15 py-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] leading-[14px] text-slate-400">Kỹ thuật</span>
                    <span className="mt-0.5 text-[15px] font-bold text-white">9.2 / 10</span>
                  </div>
                  <div className="flex flex-col border-x border-surface-highest/15 px-1">
                    <span className="text-[11px] leading-[14px] text-slate-400">Phương pháp STAR</span>
                    <span className="mt-0.5 text-[15px] font-bold text-secondary-fixed">Đạt 96%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] leading-[14px] text-slate-400">Tự tin &amp; Ngữ điệu</span>
                    <span className="mt-0.5 text-[15px] font-bold text-white">Xuất sắc</span>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-surface-highest/10 bg-[#283044]/80 p-2.5 text-[12px] leading-relaxed text-slate-300">
                  <span className="font-semibold text-secondary-fixed">Nhận xét từ AI:</span> Cấu trúc trả lời rõ ràng,
                  phong thái tự tin, ví dụ thực tế mạch lạc và giải quyết trúng trọng tâm bài toán kỹ thuật.
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Được tin dùng tại các tập đoàn hàng đầu
              </p>
              <div className="flex items-center justify-between gap-2">
                {COMPANY_CHIPS.map((chip) => (
                  <span key={chip} className="rounded-lg bg-surface-highest/15 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-surface">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT PANEL: form đăng nhập */}
          <section className="flex min-h-screen flex-col justify-between overflow-x-hidden overflow-y-auto bg-surface p-6 sm:p-8 lg:col-span-7 lg:h-full lg:p-10">
            <div className="mx-auto flex w-full max-w-[440px] items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-variant transition-colors hover:text-ink"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Về trang chủ</span>
              </Link>
            </div>

            <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4 py-5">
              <div className="flex w-full items-center rounded-xl bg-surface-high/60 p-1">
                <span className="flex-1 rounded-lg bg-card py-2 text-center text-[13px] font-semibold text-primary shadow-sm">
                  Đăng nhập
                </span>
                <Link
                  to="/register"
                  className="flex-1 rounded-lg py-2 text-center text-[13px] font-semibold text-ink-variant transition-colors hover:text-ink"
                >
                  Đăng ký tài khoản
                </Link>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-[24px] font-bold leading-8 tracking-[-0.015em] text-ink">Chào mừng bạn trở lại</h2>
                <p className="text-[13px] leading-5 text-ink-variant">
                  Nhập thông tin đăng nhập để tiếp tục luyện tập và quản lý ứng tuyển
                </p>
              </div>

              <div className="relative h-11 w-full overflow-hidden rounded-xl border border-outline bg-card shadow-sm transition-colors hover:bg-surface-low">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 text-body-md font-semibold text-ink"
                >
                  <GoogleIcon />
                  <span>Đăng nhập với Google</span>
                </span>
                <div
                  ref={googleMountRef}
                  className={`absolute inset-0 flex items-start justify-center ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-11`}
                />
                {(!googleClientId || googleGsiUnavailable) && (
                  <button
                    type="button"
                    aria-label="Đăng nhập với Google"
                    className="absolute inset-0 h-11 w-full cursor-pointer rounded-xl border-0 bg-transparent text-[1px] text-transparent"
                    onClick={handleGoogleUnavailable}
                  >
                    Đăng nhập với Google
                  </button>
                )}
              </div>

              <div className="relative my-1 flex items-center justify-center">
                <div className="h-px w-full bg-outline/50" />
                <span className="absolute bg-surface px-3 text-[11px] font-semibold uppercase tracking-wider text-outline-strong">
                  hoặc tiếp tục với email
                </span>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
                    <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                    <span>{error}</span>
                  </div>
                )}
                {needsVerification && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-3 py-2 text-body-sm text-ink-variant">
                    <span>Chưa nhận được email xác thực?</span>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendState === 'sending' || resendCooldown > 0}
                      className="cursor-pointer border-0 bg-transparent p-0 text-[12px] font-semibold text-primary no-underline hover:underline disabled:cursor-not-allowed disabled:text-ink-variant disabled:no-underline"
                    >
                      {resendState === 'sending'
                        ? 'Đang gửi...'
                        : resendCooldown > 0
                          ? `Gửi lại sau ${resendCooldown}s`
                          : resendState === 'sent'
                            ? 'Đã gửi lại email xác thực'
                            : 'Gửi lại email xác thực'}
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink" htmlFor="login-email">
                    Email hoặc tên đăng nhập
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">mail</span>
                    <input
                      className={inputClass}
                      id="login-email"
                      name="email"
                      placeholder="name@example.com"
                      required
                      type="text"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-ink" htmlFor="login-password">
                      Mật khẩu
                    </label>
                    <Link to="/forgot-password" className="text-[12px] font-semibold text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">lock</span>
                    <input
                      className={`${inputClass} pr-11`}
                      id="login-password"
                      name="password"
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="current-password"
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
                </div>

                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-[12px] leading-[18px] text-ink">Ghi nhớ đăng nhập</span>
                </label>

                <button
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>

              <p className="text-center text-[12px] leading-[18px] text-ink-variant">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Đăng ký ngay miễn phí
                </Link>
              </p>
            </div>

            <div className="mx-auto w-full max-w-[440px] border-t border-surface-mid pt-3 text-center text-[12px] leading-[18px] text-ink-variant">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span>© 2026 AI Interview Platform</span>
                <span className="text-outline">·</span>
                <a href="#" className="transition-colors hover:text-ink">Điều khoản</a>
                <span className="text-outline">·</span>
                <a href="#" className="transition-colors hover:text-ink">Chính sách bảo mật</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
