import React from 'react';
import { Link } from 'react-router-dom';
import logoWordmark from '../../assets/logo-wordmark.png';

/** Khung chung cho các trang auth dạng thẻ giữa trang: blob nền, header logo, footer 1 dòng. */
const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex min-h-screen flex-col bg-surface font-sans text-ink">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-surface-high/60 blur-[120px]" />
      <div className="absolute -bottom-[20%] right-[10%] h-[400px] w-[600px] rounded-full bg-secondary-fixed/20 blur-[100px]" />
    </div>

    <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
      <Link to="/" className="inline-flex items-center no-underline">
        <img src={logoWordmark} alt="AI Interview" className="h-5 w-auto object-contain" />
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-variant transition-colors hover:text-ink"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Về trang chủ</span>
      </Link>
    </header>

    <main className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-6 sm:px-6">{children}</main>

    <footer className="relative z-10 pb-5 pt-2 text-center text-[12px] leading-[18px] text-ink-variant">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>© 2026 AI Interview Platform</span>
        <span className="text-outline">·</span>
        <a href="#" className="transition-colors hover:text-ink">Điều khoản</a>
        <span className="text-outline">·</span>
        <a href="#" className="transition-colors hover:text-ink">Chính sách bảo mật</a>
      </div>
    </footer>
  </div>
);

export default AuthShell;
