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
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
    body: 'Mô phỏng 1:1 câu hỏi thực chiến sát thực tế từ hơn 1,000+ vị trí công nghệ hàng đầu.',
  },
  {
    title: 'Đo lường & Phân tích chuyên sâu',
    body: 'Chấm điểm phản xạ, độ khớp JD, tư duy giải quyết vấn đề và biểu cảm thuyết trình.',
  },
  {
    title: 'Kết nối Mentor & Cơ hội việc làm',
    body: 'Đặt lịch tư vấn định hướng cùng chuyên gia công nghệ và nhận đề xuất phỏng vấn tức thì.',
  },
];

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
    'w-full h-10 box-border rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-xs text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

  return (
    <div className="relative min-h-screen bg-surface font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-surface-high/60 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] h-[400px] w-[600px] rounded-full bg-secondary-fixed/20 blur-[100px]" />
      </div>

      {/* Desktop khoá đúng chiều cao màn hình, mỗi panel tự cuộn trong; mobile vẫn cuộn trang bình thường. */}
      <main className="w-full lg:h-screen lg:overflow-hidden">
        <div className="w-full lg:h-full">
          <div className="grid w-full min-h-screen grid-cols-1 overflow-hidden bg-surface lg:h-screen lg:grid-cols-12">
            {/* LEFT PANEL */}
            <section className="relative flex flex-col justify-between overflow-x-hidden overflow-y-auto border-r border-slate-800/80 bg-[#0b0f19] p-6 text-white sm:p-8 lg:col-span-5 lg:h-full lg:p-8">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-36 -top-36 h-96 w-96 rounded-full bg-primary-container/20 blur-[130px]" />
                <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 items-center justify-center rounded-xl bg-white px-3 shadow-lg">
                    <img alt="AI Interview Platform Logo" className="h-4 w-auto object-contain" src={logoWordmark} />
                  </div>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-[19px] font-bold tracking-tight text-white">AI Interview</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Nền tảng phỏng vấn AI</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 my-auto space-y-4 py-2">
                <div className="space-y-3">
                  <h1 className="text-3xl font-extrabold leading-[1.25] tracking-tight text-white lg:text-[30px]">
                    Bắt đầu hành trình phỏng vấn cùng AI, tự tin{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">bứt phá</span>{' '}
                    sự nghiệp
                  </h1>
                  <p className="max-w-lg text-sm leading-relaxed text-slate-300/90">
                    Hệ thống giả lập phỏng vấn chuyên sâu với phản hồi trực tiếp, phân tích biểu cảm, giọng điệu và tối
                    ưu hóa hồ sơ ứng tuyển theo chuẩn quốc tế.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {REGISTER_BENEFITS.map((benefit) => (
                    <div key={benefit.title} className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{benefit.title}</h4>
                        <p className="mt-0.5 text-xs leading-normal text-slate-400">{benefit.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl short:hidden">
                  <div className="mb-2.5 flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <span className="material-symbols-outlined text-base">psychology</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          Đánh giá phỏng vấn AI
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[11px] text-slate-400">Senior Frontend Engineer • 15 phút</div>
                      </div>
                    </div>
                    <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      Xuất sắc 94/100
                    </div>
                  </div>

                  <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/60 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-emerald-400">groups</span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">50,000+ ứng viên</div>
                        <div className="text-[10px] text-slate-400">Tự tin vượt qua vòng phỏng vấn thực tế</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                      <span className="material-symbols-outlined text-xs">star</span> 4.9/5
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-slate-700/40 bg-slate-800/40 p-2.5">
                    <span className="material-symbols-outlined mt-0.5 text-sm text-indigo-400">format_quote</span>
                    <p className="text-[11px] leading-snug text-slate-300">
                      <span className="font-medium text-indigo-300">Nhận xét AI:</span> Ứng viên nắm vững kiến trúc
                      component, khả năng phân tích hệ thống phản xạ nhanh và trình bày tự tin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-slate-800/80 pt-3">
                <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Được tin dùng bởi các tập đoàn hàng đầu
                </p>
                <div className="flex items-center justify-between px-2 text-xs font-bold tracking-wider text-slate-300/80 opacity-80">
                  <span className="transition-colors hover:text-white">VNG</span>
                  <span className="text-slate-600">•</span>
                  <span className="transition-colors hover:text-white">FPT Software</span>
                  <span className="text-slate-600">•</span>
                  <span className="transition-colors hover:text-white">Viettel</span>
                  <span className="text-slate-600">•</span>
                  <span className="transition-colors hover:text-white">Shopee</span>
                  <span className="text-slate-600">•</span>
                  <span className="transition-colors hover:text-white">MoMo</span>
                </div>
              </div>
            </section>

            {/* RIGHT PANEL */}
            <section className="flex min-h-screen flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#faf8ff] p-6 sm:p-8 lg:col-span-7 lg:h-full lg:p-10">
              <div className="mx-auto flex w-full max-w-[480px] items-center justify-between pb-4">
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-primary">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Về trang chủ</span>
                </Link>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 shadow-sm transition-colors hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-sm">language</span>
                    <span>Tiếng Việt</span>
                    <span className="material-symbols-outlined text-xs">expand_more</span>
                  </button>
                  <a href="#" className="inline-flex items-center gap-0.5 transition-colors hover:text-primary">
                    <span className="material-symbols-outlined text-sm">help_outline</span>
                    <span>Trợ giúp</span>
                  </a>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[480px] py-2">
                <div className="mb-6 flex items-center rounded-xl bg-slate-200/60 p-1">
                  <Link to="/login" className="flex-1 rounded-lg py-2 text-center text-xs font-semibold text-slate-600 transition-all hover:text-slate-900">
                    Đăng nhập
                  </Link>
                  <span className="flex-1 rounded-lg bg-white py-2 text-center text-xs font-bold text-primary shadow-sm">
                    Đăng ký tài khoản
                  </span>
                </div>

                <div className="mb-6 text-left">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-[28px]">Tạo tài khoản mới</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Bắt đầu trải nghiệm luyện phỏng vấn cùng trí tuệ nhân tạo thế hệ mới hoàn toàn miễn phí.
                  </p>
                </div>

                <div className="relative mb-5 h-11 w-full overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm transition-all hover:bg-slate-50">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 text-xs font-semibold text-slate-700"
                  >
                    <GoogleIcon />
                    <span>Đăng ký nhanh với Google</span>
                  </span>
                  <div ref={googleMountRef} className={`absolute inset-0 ${googleClientId ? 'opacity-0' : 'hidden'} [&_iframe]:h-11`} />
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

                <div className="relative mb-5 flex items-center">
                  <div className="h-px flex-grow bg-slate-200" />
                  <span className="mx-3 flex-shrink text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    hoặc tiếp tục với email
                  </span>
                  <div className="h-px flex-grow bg-slate-200" />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Bạn tham gia với tư cách nào?</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <label
                      className={`relative flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all ${
                        role === 'candidate' ? 'border-2 border-primary bg-indigo-50/50' : 'border border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        checked={role === 'candidate'}
                        className="sr-only"
                        name="userRole"
                        type="radio"
                        value="candidate"
                        onChange={() => setRole('candidate')}
                      />
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${role === 'candidate' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <span className="material-symbols-outlined text-lg">person</span>
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="text-xs font-bold leading-tight text-slate-900">Ứng viên</div>
                        <div className="mt-0.5 text-[11px] leading-normal text-slate-500">Luyện thi &amp; tìm việc</div>
                      </div>
                      {role === 'candidate' && (
                        <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                          <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                        </div>
                      )}
                    </label>
                    <label
                      className={`relative flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all ${
                        role === 'recruiter' ? 'border-2 border-primary bg-indigo-50/50' : 'border border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        checked={role === 'recruiter'}
                        className="sr-only"
                        name="userRole"
                        type="radio"
                        value="recruiter"
                        onChange={() => setRole('recruiter')}
                      />
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${role === 'recruiter' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <span className="material-symbols-outlined text-lg">work</span>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold leading-tight text-slate-900">Nhà tuyển dụng</div>
                        <div className="mt-0.5 text-[11px] leading-normal text-slate-500">Đăng JD &amp; phỏng vấn</div>
                      </div>
                      {role === 'recruiter' && (
                        <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                          <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                        </div>
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

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="fullName">
                      Họ và tên
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-lg text-slate-400">person</span>
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

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="email">
                      Địa chỉ Email
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-lg text-slate-400">mail</span>
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

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                        Mật khẩu
                      </label>
                      {form.password.length > 0 && (
                        <span className="text-[11px] font-bold text-emerald-600">Độ mạnh: {strengthLabel}</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-lg text-slate-400">lock</span>
                      <input
                        className={`${inputClass} pr-9`}
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
                        className="absolute right-3 flex items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    <div className="mt-1.5 grid h-1 w-full grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className={`rounded-full ${index < passedRules ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="confirmPassword">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 text-lg text-slate-400">lock_reset</span>
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

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      checked={termsAccepted}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-primary"
                      id="terms"
                      type="checkbox"
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label className="select-none text-[11px] leading-relaxed text-slate-600" htmlFor="terms">
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
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                  <p className="pt-1 text-center text-xs text-slate-500">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      Đăng nhập ngay
                    </Link>
                  </p>
                </form>
              </div>

              <div className="mx-auto w-full max-w-[480px] border-t border-slate-200/80 pt-4 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500">
                  <p className="text-[11px] font-medium text-slate-500">© 2026 AI Interview Platform. Bảo lưu mọi quyền.</p>
                  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                    <a href="#" className="transition-colors hover:text-primary">Điều khoản sử dụng</a>
                    <span>•</span>
                    <a href="#" className="transition-colors hover:text-primary">Chính sách bảo mật</a>
                    <span>•</span>
                    <a href="#" className="transition-colors hover:text-primary">Trợ giúp</a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
