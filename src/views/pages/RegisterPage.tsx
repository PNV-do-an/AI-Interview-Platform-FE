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
    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
  </svg>
);

// Phải khớp PASSWORD_PATTERN phía BE, nếu không strength báo "Rất tốt" mà server vẫn 400.
const SPECIAL_CHARS = '@#$%^&+=!';
const PASSWORD_RULES: ((v: string) => boolean)[] = [
  (v) => v.length >= 8,
  (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  (v) => /\d/.test(v),
  (v) => new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]/^$.|*+(){}?]/g, '\\$&')}]`).test(v),
];
const STRENGTH_LABELS = ['Yếu', 'Trung bình', 'Tốt', 'Rất tốt'];

const REGISTER_BENEFITS = [
  {
    title: 'Luyện phỏng vấn AI thông minh',
    body: 'Mô phỏng 1:1 câu hỏi thực chiến từ hơn 1,000+ vị trí công nghệ hàng đầu.',
  },
  {
    title: 'Đo lường & Phân tích chuyên sâu',
    body: 'Chấm điểm phản xạ, độ khớp JD, tư duy giải quyết vấn đề và biểu cảm.',
  },
  {
    title: 'Kết nối Mentor & Cơ hội việc làm',
    body: 'Nhận tư vấn định hướng cùng chuyên gia và đề xuất phỏng vấn tức thì.',
  },
];

const COMPANY_CHIPS = ['VNG', 'FPT SOFTWARE', 'VIETTEL', 'SHOPEE', 'MOMO'];

const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle, loading, error, errorStatus } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  // BE /auth/register không nhận trường role (luôn gán ứng viên) — selector chỉ để đúng thiết kế.
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
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

  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

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
    setNotice('Đăng ký với Google hiện không khả dụng. Vui lòng tạo tài khoản bằng email.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const passedRules = PASSWORD_RULES.filter((test) => test(form.password)).length;
  const strengthLabel = STRENGTH_LABELS[Math.min(3, Math.max(0, passedRules - 1))] ?? STRENGTH_LABELS[0];
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    if (!termsAccepted) {
      setNotice('Vui lòng đồng ý Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setNotice('Mật khẩu xác nhận chưa trùng khớp.');
      return;
    }
    register({ fullName: form.fullName, email: form.email, password: form.password });
  };

  // BE trả 409 kèm "Email này đã đăng ký nhưng chưa xác thực..." — đưa nút gửi lại để
  // người dùng không phải đăng ký lặp (mỗi lần lặp ghi thêm một failed attempt, đủ 5 là khóa 5 phút).
  const needsVerification = errorStatus === 409 && /chưa xác thực/i.test(error);

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

  const roleCardClass = (active: boolean) =>
    `relative flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${
      active ? 'border-2 border-primary bg-primary-fixed/50' : 'border border-outline bg-card hover:border-outline-strong'
    }`;

  return (
    /* Desktop khoá đúng chiều cao màn hình, mỗi panel tự cuộn trong; mobile vẫn cuộn trang bình thường. */
    <main className="w-full lg:h-screen lg:overflow-hidden">
      <div className="w-full lg:h-full">
        <div className="grid w-full min-h-screen grid-cols-1 overflow-hidden bg-surface lg:h-screen lg:grid-cols-12">
          {/* LEFT PANEL: brand showcase */}
          <section className="relative flex flex-col justify-between overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#0b0f19] p-6 text-[#eef0ff] sm:p-8 lg:col-span-5 lg:h-full lg:p-8">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-36 -top-36 h-96 w-96 rounded-full bg-primary/25 blur-[130px]" />
              <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-fixed/10 blur-[120px]" />
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 items-center justify-center rounded-xl bg-white px-3 shadow-lg">
                <img alt="AI Interview Platform Logo" className="h-4 w-auto object-contain" src={logoWordmark} />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Nền tảng phỏng vấn AI</span>
            </div>

            <div className="relative z-10 my-auto space-y-5 py-3">
              <div className="space-y-3">
                <h1 className="text-[28px] font-extrabold leading-[1.25] tracking-tight text-white lg:text-[30px]">
                  Bắt đầu hành trình phỏng vấn cùng AI, tự tin{' '}
                  <span className="bg-gradient-to-r from-primary-fixed via-secondary-fixed-dim to-secondary-fixed bg-clip-text text-transparent">
                    bứt phá
                  </span>{' '}
                  sự nghiệp
                </h1>
                <p className="max-w-lg text-sm leading-relaxed text-slate-300/90">
                  Hệ thống giả lập phỏng vấn chuyên sâu với phản hồi trực tiếp và tối ưu hóa hồ sơ ứng tuyển theo chuẩn
                  quốc tế.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {REGISTER_BENEFITS.map((benefit) => (
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

              <div className="rounded-2xl border border-surface-highest/15 bg-card/10 p-3.5 shadow-2xl backdrop-blur-md [@media(max-height:899px)]:hidden">
                <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-surface-highest/15 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/30 text-primary-fixed">
                      <span className="material-symbols-outlined text-base">psychology</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        Đánh giá phỏng vấn AI
                        <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-fixed" />
                      </div>
                      <div className="text-[11px] text-slate-400">Senior Frontend Engineer • 15 phút</div>
                    </div>
                  </div>
                  <div className="rounded-md border border-secondary-fixed/30 bg-secondary-fixed/10 px-2 py-0.5 text-xs font-bold text-secondary-fixed">
                    Xuất sắc 94/100
                  </div>
                </div>

                <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-surface-highest/10 bg-[#283044]/70 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-secondary-fixed">groups</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">50,000+ ứng viên</div>
                      <div className="text-[10px] text-slate-400">Tự tin vượt qua vòng phỏng vấn thực tế</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-md border border-secondary-fixed/30 bg-secondary-fixed/10 px-2 py-1 text-[11px] font-semibold text-secondary-fixed">
                    <span className="material-symbols-outlined text-xs">star</span> 4.9/5
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-surface-highest/10 bg-[#283044]/50 p-2.5">
                  <span className="material-symbols-outlined mt-0.5 text-sm text-primary-fixed">format_quote</span>
                  <p className="text-[11px] leading-snug text-slate-300">
                    <span className="font-medium text-primary-fixed">Nhận xét AI:</span> Ứng viên nắm vững kiến trúc
                    component, phân tích hệ thống phản xạ nhanh và trình bày tự tin.
                  </p>
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

          {/* RIGHT PANEL: form đăng ký */}
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

            <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4 py-5 short:gap-3.5 short:py-4">
              <div className="flex w-full items-center rounded-xl bg-surface-high/60 p-1">
                <Link
                  to="/login"
                  className="flex-1 rounded-lg py-2 text-center text-[13px] font-semibold text-ink-variant transition-colors hover:text-ink"
                >
                  Đăng nhập
                </Link>
                <span className="flex-1 rounded-lg bg-card py-2 text-center text-[13px] font-semibold text-primary shadow-sm">
                  Đăng ký tài khoản
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-[24px] font-bold leading-8 tracking-[-0.015em] text-ink">Tạo tài khoản mới</h2>
                <p className="text-[13px] leading-5 text-ink-variant">
                  Bắt đầu luyện phỏng vấn cùng AI thế hệ mới, hoàn toàn miễn phí.
                </p>
              </div>

              <div className="relative h-11 w-full overflow-hidden rounded-xl border border-outline bg-card shadow-sm transition-colors hover:bg-surface-low">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 text-body-md font-semibold text-ink"
                >
                  <GoogleIcon />
                  <span>Đăng ký nhanh với Google</span>
                </span>
                <div
                  ref={googleMountRef}
                  className={`absolute inset-0 flex items-start justify-center ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-11`}
                />
                {(!googleClientId || googleGsiUnavailable) && (
                  <button
                    type="button"
                    aria-label="Đăng ký nhanh với Google"
                    className="absolute inset-0 h-full w-full cursor-pointer rounded-xl border-0 bg-transparent text-[1px] text-transparent"
                    onClick={handleGoogleUnavailable}
                  >
                    Đăng ký nhanh với Google
                  </button>
                )}
              </div>

              <div className="relative my-1 flex items-center justify-center">
                <div className="h-px w-full bg-outline/50" />
                <span className="absolute bg-surface px-3 text-[11px] font-semibold uppercase tracking-wider text-outline-strong">
                  hoặc tiếp tục với email
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-ink short:hidden">Bạn tham gia với tư cách nào?</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className={roleCardClass(role === 'candidate')}>
                    <input
                      checked={role === 'candidate'}
                      className="sr-only"
                      name="userRole"
                      type="radio"
                      value="candidate"
                      onChange={() => setRole('candidate')}
                    />
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        role === 'candidate' ? 'bg-primary text-white' : 'bg-surface-mid text-ink-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                    </span>
                    <span className="min-w-0 flex-1 pr-3">
                      <span className="block text-xs font-bold leading-tight text-ink">Ứng viên</span>
                      <span className="mt-0.5 block text-[11px] leading-normal text-ink-variant short:hidden">
                        Luyện thi &amp; tìm việc
                      </span>
                    </span>
                    {role === 'candidate' && (
                      <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                      </span>
                    )}
                  </label>
                  <label className={roleCardClass(role === 'recruiter')}>
                    <input
                      checked={role === 'recruiter'}
                      className="sr-only"
                      name="userRole"
                      type="radio"
                      value="recruiter"
                      onChange={() => setRole('recruiter')}
                    />
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        role === 'recruiter' ? 'bg-primary text-white' : 'bg-surface-mid text-ink-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">work</span>
                    </span>
                    <span className="min-w-0 flex-1 pr-3">
                      <span className="block text-xs font-bold leading-tight text-ink">Nhà tuyển dụng</span>
                      <span className="mt-0.5 block text-[11px] leading-normal text-ink-variant short:hidden">
                        Đăng JD &amp; phỏng vấn
                      </span>
                    </span>
                    {role === 'recruiter' && (
                      <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
                    <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
                    <span>{error}</span>
                  </div>
                )}
                {needsVerification && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-3 py-2 text-body-sm text-ink-variant">
                    <span>Email đã đăng ký nhưng chưa xác thực?</span>
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
                {form.confirmPassword.length > 0 && !passwordsMatch && (
                  <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2 text-body-sm text-danger-text" role="alert">
                    <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
                    <span>Mật khẩu xác nhận chưa trùng khớp.</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink" htmlFor="fullName">
                    Họ và tên
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">person</span>
                    <input
                      className={inputClass}
                      id="fullName"
                      name="fullName"
                      placeholder="Nguyễn Văn A"
                      required
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink" htmlFor="email">
                    Địa chỉ email
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">mail</span>
                    <input
                      className={inputClass}
                      id="email"
                      name="email"
                      placeholder="name@company.com"
                      required
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-ink" htmlFor="password">
                      Mật khẩu
                    </label>
                    {form.password.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600">Độ mạnh: {strengthLabel}</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">lock</span>
                    <input
                      className={`${inputClass} pr-11`}
                      id="password"
                      name="password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      aria-label="Hiện/ẩn mật khẩu"
                      className="absolute right-3 flex items-center justify-center p-1 text-outline-strong transition-colors hover:text-ink"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <div className="grid h-1 w-full grid-cols-4 gap-1.5">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className={`rounded-full ${index < passedRules ? 'bg-emerald-500' : 'bg-surface-high'}`} />
                    ))}
                  </div>
                  <p className="text-[11px] leading-4 text-outline-strong short:hidden">
                    Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink" htmlFor="confirmPassword">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-outline-strong">lock_reset</span>
                    <input
                      className={inputClass}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    checked={termsAccepted}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                    id="terms"
                    type="checkbox"
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label className="select-none text-[11px] leading-relaxed text-ink-variant" htmlFor="terms">
                    Tôi đồng ý với{' '}
                    <a className="font-semibold text-primary hover:underline" href="#">
                      Điều khoản dịch vụ
                    </a>{' '}
                    và{' '}
                    <a className="font-semibold text-primary hover:underline" href="#">
                      Chính sách bảo mật
                    </a>{' '}
                    của AI Interview Platform.
                  </label>
                </div>

                <button
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-body-md font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <p className="text-center text-[12px] leading-[18px] text-ink-variant">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Đăng nhập ngay
                  </Link>
                </p>
              </form>
            </div>

            <div className="mx-auto w-full max-w-[440px] border-t border-surface-mid pt-3 text-center text-[12px] leading-[18px] text-ink-variant short:hidden">
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

export default RegisterPage;
