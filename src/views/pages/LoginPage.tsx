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
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const LOGIN_PROOF_POINTS = [
  'Phân tích giọng nói & phản xạ thời gian thực',
  'Khung đánh giá STAR & ngân hàng câu hỏi chuẩn quốc tế',
  'Kết nối trực tiếp nhà tuyển dụng & chuyên gia Mentor',
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

  return (
    <main className="flex w-full min-h-screen flex-col bg-surface font-sans text-ink lg:grid lg:grid-cols-2">
      {/* LEFT COLUMN: Brand Storytelling & AI Assessment Proof */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-surface-high/10 bg-[#0b0f19] p-8 text-[#eef0ff] lg:flex xl:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-[30rem] w-[30rem] rounded-full bg-[#6df5e1]/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center justify-center rounded-xl bg-white px-2.5 shadow-md">
              <img src={logoWordmark} alt="AI Interview Logo" className="h-4 w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-tight text-white">AI Interview</span>
              </div>
              <span className="text-[12px] leading-[18px] text-surface-high/70">Platform tuyển dụng thông minh</span>
            </div>
          </div>

          <div className="flex max-w-xl flex-col gap-2">
            <h1 className="text-[36px] font-extrabold leading-[44px] tracking-[-0.025em] text-white">
              Luyện phỏng vấn cùng AI, <br />
              <span className="bg-gradient-to-r from-primary-fixed via-secondary-fixed-dim to-secondary-fixed bg-clip-text text-transparent">
                tự tin bứt phá
              </span>{' '}
              sự nghiệp
            </h1>
            <p className="text-[14px] leading-[22px] text-surface-high/90">
              Hơn 50.000+ ứng viên rèn luyện phản xạ thời gian thực, chuẩn hóa kỹ năng phỏng vấn theo phương pháp STAR
              và gia nhập các tập đoàn công nghệ lớn.
            </p>
          </div>

          <div className="flex max-w-lg flex-col gap-2.5">
            {LOGIN_PROOF_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-2.5 text-[12px] leading-[18px] text-surface">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">check_circle</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="max-w-xl rounded-2xl border border-surface-highest/15 bg-card/10 p-4 text-white shadow-2xl backdrop-blur-md short:hidden">
            <div className="flex items-start justify-between gap-3 border-b border-surface-highest/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-container text-[15px] font-bold shadow-md">
                  MA
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[16px] font-semibold leading-6 text-white">Nguyễn Minh Anh</h4>
                  <p className="text-[12px] leading-[18px] text-surface-high/80">Software Engineer Candidate</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-[#006b5f]/40 bg-[#006b5f]/30 px-2.5 py-1 text-[12px] font-semibold text-secondary-fixed">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> Match: 94%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-surface-highest/15 py-3 text-center">
              <div className="flex flex-col">
                <span className="text-[11px] leading-[14px] text-surface-high/70">Kỹ thuật</span>
                <span className="mt-0.5 text-[15px] font-bold text-white">9.2 / 10</span>
              </div>
              <div className="flex flex-col border-x border-surface-highest/15 px-1">
                <span className="text-[11px] leading-[14px] text-surface-high/70">Phương pháp STAR</span>
                <span className="mt-0.5 text-[15px] font-bold text-secondary-fixed">Đạt 96%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] leading-[14px] text-surface-high/70">Tự tin &amp; Ngữ điệu</span>
                <span className="mt-0.5 text-[15px] font-bold text-white">Xuất sắc</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-surface-highest/10 bg-[#283044]/80 p-2.5 text-[12px] leading-relaxed text-surface-high/90">
              <span className="font-semibold text-secondary-fixed">Nhận xét từ AI:</span> Cấu trúc trả lời rõ ràng, phong
              thái tự tin, ví dụ thực tế mạch lạc và giải quyết trúng trọng tâm bài toán kỹ thuật.
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-surface-high/70">
            ĐƯỢC TIN DÙNG BỞI ỨNG VIÊN TỪ CÁC TẬP ĐOÀN HÀNG ĐẦU
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {COMPANY_CHIPS.map((chip) => (
              <div key={chip} className="rounded-lg bg-surface-highest/15 px-3 py-1.5 text-[13px] font-bold tracking-wider text-surface">
                {chip}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: Clean Light Auth Column */}
      <section className="flex min-h-screen flex-col justify-between bg-surface p-4 sm:p-8">
        <div className="flex w-full items-center justify-between pb-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[14px] font-semibold text-ink-variant transition-colors hover:text-ink"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex cursor-pointer items-center gap-1 rounded-full bg-surface-low px-2 py-1 text-[13px] text-ink transition-colors hover:bg-surface-mid">
              <span className="material-symbols-outlined text-[16px] text-ink-variant">language</span>
              <span className="text-[14px] font-semibold">Tiếng Việt</span>
              <span className="material-symbols-outlined text-[16px] text-ink-variant">arrow_drop_down</span>
            </div>
            <a href="#" className="flex items-center gap-1 text-[14px] font-semibold text-ink-variant transition-colors hover:text-ink">
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              <span>Trợ giúp</span>
            </a>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4 py-6">
          <div className="flex w-full items-center gap-1 rounded-xl bg-surface-low p-1 shadow-inner">
            <button
              className="flex-1 rounded-lg bg-card py-2 text-center text-[14px] leading-5 font-semibold text-primary shadow-sm transition-all duration-200"
              type="button"
            >
              Đăng nhập
            </button>
            <Link
              to="/register"
              className="flex-1 rounded-lg py-2 text-center text-[14px] leading-5 font-medium text-ink-variant transition-all duration-200 hover:text-ink"
            >
              Đăng ký tài khoản
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-[24px] font-bold leading-8 tracking-[-0.015em] text-ink">Chào mừng bạn trở lại</h2>
            <p className="text-[12px] leading-[18px] text-ink-variant">
              Nhập thông tin đăng nhập để tiếp tục luyện tập và quản lý ứng tuyển
            </p>
          </div>

          <div className="relative h-11 w-full overflow-hidden rounded-xl border border-surface-high bg-card shadow-sm transition-colors hover:bg-surface-low">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 text-[14px] font-semibold text-ink"
            >
              <GoogleIcon />
              <span>Đăng nhập với Google</span>
            </span>
            <div ref={googleMountRef} className={`absolute inset-0 ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-11`} />
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
            <div className="h-[1px] w-full bg-surface-mid" />
            <span className="absolute bg-surface px-3 text-[11px] font-bold uppercase tracking-wider text-ink-variant">
              HOẶC TIẾP TỤC VỚI EMAIL
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
              <label className="text-[12px] font-semibold leading-4 tracking-[0.02em] text-ink" htmlFor="login-email">
                Email hoặc tên đăng nhập
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[20px] text-ink-variant">mail</span>
                <input
                  className="w-full rounded-xl border border-surface-high bg-card pl-10 pr-4 text-[14px] leading-[22px] text-ink shadow-sm placeholder:text-outline-strong focus:border-primary focus:outline-none"
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
                <label className="text-[12px] font-semibold leading-4 tracking-[0.02em] text-ink" htmlFor="login-password">
                  Mật khẩu
                </label>
                <Link to="/forgot-password" className="text-[13px] text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[20px] text-ink-variant">lock</span>
                <input
                  className="w-full rounded-xl border border-surface-high bg-card pl-10 pr-11 text-[14px] leading-[22px] text-ink shadow-sm placeholder:text-outline-strong focus:border-primary focus:outline-none"
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
                  aria-label="Toggle password visibility"
                  className="absolute right-3 p-1 text-ink-variant transition-colors hover:text-ink"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-body-sm">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  className="h-4 w-4 accent-primary"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-[12px] leading-[18px] text-ink">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <div className="pt-2 text-center text-[12px] leading-[18px] text-ink-variant">
            <span>Chưa có tài khoản? </span>
            <Link to="/register" className="text-[12px] font-semibold leading-4 text-primary hover:underline">
              Đăng ký ngay miễn phí
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-2 border-t border-surface-mid pt-4 text-[12px] text-ink-variant sm:flex-row">
          <span>© 2026 AI Interview Platform. Bảo lưu mọi quyền.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-ink">Điều khoản</a>
            <a href="#" className="transition-colors hover:text-ink">Chính sách bảo mật</a>
            <a href="#" className="transition-colors hover:text-ink">Trợ giúp</a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
