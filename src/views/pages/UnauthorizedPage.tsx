import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoWordmark from '../../assets/logo-wordmark.png';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../models/User.model';
import { buttonClass } from '../components/ui';

/**
 * Màn 403 theo mockup `l_i_403_kh_ng_c_quy_n_truy_c_p_ai_interview_platform`.
 * Bỏ theo luật `spec/conventions/frontend-ui.md` mục 3: art khoá svg + ambient glow/animation,
 * ảnh logo hosting của Stitch, email support + hotline 1900 8888 (không có nguồn dữ liệu thật).
 * Dòng phiên thay bằng email + role thật từ AuthContext.
 */
const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col bg-surface font-sans text-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-surface-high/60 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] h-[400px] w-[600px] rounded-full bg-secondary-fixed/20 blur-[100px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="inline-flex items-center no-underline">
          <img src={logoWordmark} alt="AI Interview" className="h-8 w-auto object-contain" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-variant transition-colors hover:text-ink"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to home</span>
        </Link>
      </header>

      <main className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <section className="w-full max-w-[560px] rounded-xl border border-[#e2e8f0] bg-card px-6 py-8 text-center shadow-card sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-danger-bg text-danger-text">
            <span className="material-symbols-outlined text-[24px]">block</span>
          </span>

          <div className="mt-3 text-display tabular-nums text-ink">403</div>
          <h1 className="mt-1 text-headline-md text-ink">You don&apos;t have access to this page</h1>
          <p className="mx-auto mt-2 mb-6 max-w-[420px] text-body-md leading-relaxed text-ink-variant">
            This area is restricted to authorized roles. Check that you are signed in with the right
            account, or contact an administrator if you think this is a mistake.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/dashboard" className={`${buttonClass('primary')} w-full px-5 no-underline sm:w-auto`}>
              <span className="material-symbols-outlined text-[18px]">home</span>
              Go to dashboard
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`${buttonClass('secondary')} w-full px-5 sm:w-auto`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Go back
            </button>
          </div>

          <div className="mt-7 flex flex-col items-start gap-3 rounded-lg bg-surface-low px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-label-sm uppercase tracking-[0.04em] text-ink-variant">Error code</span>
              <span className="font-mono text-label-md text-ink">403_ACCESS_DENIED</span>
            </div>
            <span className="hidden h-6 w-px bg-[#e2e8f0] sm:block" />
            <div className="flex flex-col gap-0.5">
              <span className="text-label-sm uppercase tracking-[0.04em] text-ink-variant">Current session</span>
              <span className="text-label-md text-ink">
                {user ? `${user.email} · ${ROLE_LABELS[user.role] ?? user.role}` : 'Not signed in'}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 pb-5 pt-2 text-center text-[12px] leading-[18px] text-ink-variant">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© 2026 AI Interview Platform</span>
          <span className="text-outline">·</span>
          <a href="#" className="transition-colors hover:text-ink">Terms</a>
          <span className="text-outline">·</span>
          <a href="#" className="transition-colors hover:text-ink">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

export default UnauthorizedPage;
