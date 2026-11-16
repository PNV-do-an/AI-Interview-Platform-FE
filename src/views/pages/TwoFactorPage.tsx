import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';

/** Khớp pattern BE chặn lúc ghi cho recovery code (verify-otp nhận cả OTP lẫn XXXXX-XXXXX). */
const RECOVERY_CODE = /^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/;

type Mode = 'otp' | 'recovery';

/**
 * Màn nhập mã 2FA sau đăng nhập (challenge token lưu ở storage khi login trả `mfaRequired`).
 * BE chỉ có một kênh TOTP qua ứng dụng xác thực nên không còn tab "Khóa bảo mật"/"SMS" của
 * mockup; ô nhập chuyển chế độ sang mã dự phòng XXXXX-XXXXX khi bấm "Dùng mã khôi phục".
 */
const TwoFactorPage: React.FC = () => {
  const { verifyOtp, loading, error } = useAuth();
  const [mode, setMode] = useState<Mode>('otp');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [recovery, setRecovery] = useState('');

  const handleVerify = () => {
    if (mode === 'otp') {
      const code = digits.join('');
      if (code.length !== 6) return;
      void verifyOtp(code, false);
    } else {
      const code = recovery.trim();
      if (!RECOVERY_CODE.test(code)) return;
      void verifyOtp(code, false);
    }
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits((prev) => prev.map((d, i) => (i === index ? clean : d)));
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-ink">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center no-underline">
              <BrandLogo markClass="h-6" />
            </Link>
            <Link to="/" className="hidden text-label-md text-ink-variant no-underline transition-colors hover:text-ink sm:block">
              Về trang chủ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1 rounded-lg border border-outline/30 bg-surface-low px-2.5 py-1 text-label-sm text-ink-variant md:flex">
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span>EN</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </div>
            <button type="button" aria-label="Đổi giao diện" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-variant transition-colors hover:bg-surface-high hover:text-ink">
              <span className="material-symbols-outlined text-[20px]">light_mode</span>
            </button>
            <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-container px-4 text-label-md text-on-primary shadow-sm no-underline transition-colors hover:bg-primary">
              Đăng nhập
            </Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center w-full max-w-[1280px] px-6 pt-16 mx-auto">
        <div className="flex w-full flex-col py-6 md:py-8">
          {/* Sub-header: back link + security status pill */}
          <div className="mx-auto mb-6 flex w-full max-w-[1152px] flex-col justify-between gap-4 px-1 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login" className="group inline-flex items-center gap-1.5 text-label-md text-ink-variant no-underline transition-colors hover:text-ink">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-label-sm text-ink shadow-sm">
              {/* emerald status dot/label from mockup ribbon */}
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-800">Xác minh bảo mật</span>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[1152px] grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* LEFT: 2FA verification card */}
            <div className="flex flex-col gap-4 lg:col-span-7">
              <div className="relative overflow-hidden rounded-xl bg-card p-6 shadow-sm sm:p-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

                <h1 className="mb-2 text-headline-lg tracking-tight text-ink">Xác thực hai lớp</h1>
                <p className="mb-6 text-body-md leading-relaxed text-ink-variant">
                  {mode === 'otp'
                    ? 'Nhập mã 6 số do ứng dụng xác thực (Google Authenticator / Authy) tạo ra.'
                    : 'Nhập một mã dự phòng (dạng XXXXX-XXXXX) đã lưu khi bật 2FA.'}
                </p>

                {mode === 'otp' ? (
                  /* 6-digit code inputs */
                  <div className="mb-6">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-label-sm font-semibold uppercase tracking-wide text-ink">Mã xác thực</span>
                      <span className="text-[12px] text-ink-variant">Mã bảo mật 6 số</span>
                    </div>
                    <div className="mb-3 grid grid-cols-6 gap-2 sm:gap-3">
                      {digits.map((d, i) => (
                        <input
                          key={i}
                          className={`h-14 w-full rounded-lg text-center text-metric-stat font-bold transition-all caret-primary sm:h-16 ${
                            i === 3 && !d
                              ? 'bg-info/30 ring-2 ring-primary' // primary-fixed/30 active cell in mockup (info token shares that hex)
                              : 'bg-card text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-primary'
                          }`}
                          inputMode="numeric"
                          maxLength={1}
                          type="text"
                          value={d}
                          onChange={(e) => setDigit(i, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-label-sm font-semibold uppercase tracking-wide text-ink">Mã dự phòng</span>
                      <span className="text-[12px] text-ink-variant">Dùng một lần</span>
                    </div>
                    <input
                      className="h-16 w-full rounded-lg bg-card text-center text-headline-sm font-bold tracking-[0.2em] text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      value={recovery}
                      onChange={(e) => setRecovery(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 11))}
                      placeholder="XXXXX-XXXXX"
                      autoComplete="off"
                    />
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading || (mode === 'otp' ? digits.join('').length !== 6 : !RECOVERY_CODE.test(recovery.trim()))}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-sm text-on-primary shadow-md transition-all hover:bg-secondary active:scale-[0.99] disabled:opacity-60"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Xác thực & tiếp tục'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                {/* Chuyển chế độ nhập: ứng dụng xác thực <-> mã dự phòng */}
                <div className="mt-6 flex items-center justify-center border-t border-outline/20 pt-5">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'otp' ? 'recovery' : 'otp')}
                    className="inline-flex items-center gap-1 text-label-md font-medium text-primary transition-colors hover:text-secondary"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {mode === 'otp' ? 'key_off' : 'smartphone'}
                    </span>
                    <span>{mode === 'otp' ? 'Dùng mã khôi phục khẩn cấp' : 'Nhập mã từ ứng dụng xác thực'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: support dock */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-low p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info text-primary">
                    {/* primary-fixed box from mockup (info token shares that hex) */}
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  </span>
                  <div>
                    <p className="m-0 text-label-md font-semibold text-ink">Cần trợ giúp?</p>
                    <p className="m-0 text-[12px] text-ink-variant">
                      {mode === 'otp'
                        ? 'Mất thiết bị? Bấm "Dùng mã khôi phục khẩn cấp" phía trên.'
                        : 'Mã dự phòng đã hết? Liên hệ quản trị viên để tắt 2FA.'}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] text-ink-variant">Mỗi mã dự phòng chỉ dùng được một lần</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-surface-low">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 text-label-sm text-ink-variant md:flex-row">
          <span>© 2025 AI Interview Inc. Bảo lưu mọi quyền.</span>
          <nav className="flex flex-wrap items-center gap-6">
            <a href="#" className="no-underline transition-colors hover:text-ink">Chính sách bảo mật</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Điều khoản sử dụng</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Bảo mật</a>
            <a href="#" className="no-underline transition-colors hover:text-ink">Hỗ trợ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default TwoFactorPage;
