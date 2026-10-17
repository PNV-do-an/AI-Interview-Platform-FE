import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface font-sans text-ink">
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
              <Link to="/register" className="text-label-md text-ink-variant no-underline transition-colors hover:text-ink">Sign Up</Link>
            </div>
            <Link to="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary no-underline">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex w-full flex-1 items-center justify-center px-4 pt-16">
        <div className="mx-auto w-full max-w-[480px] rounded-xl border border-surface-mid bg-card p-6 text-center shadow-md sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-danger-bg text-danger-text">
            <span className="material-symbols-outlined text-[24px]">block</span>
          </span>
          <div className="mt-3 text-display tabular-nums text-danger-text">403</div>
          <h1 className="mt-1 text-headline-md text-ink">Access Denied</h1>
          <p className="mx-auto mt-2 mb-6 max-w-[400px] text-body-md leading-relaxed text-ink-variant">
            You do not have permission to view this page. Contact an administrator if you think this is a mistake.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border-0 bg-primary px-5 text-label-md font-semibold text-on-primary shadow-md transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Dashboard
          </button>
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

export default UnauthorizedPage;
