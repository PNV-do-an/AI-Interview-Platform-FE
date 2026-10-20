import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoWordmark from '../../assets/logo-wordmark.png';

const NEXT_STEPS = [
  { icon: 'mail', title: '1. Check your inbox', body: 'Open the email sent from InterviewAI in your mail client.' },
  { icon: 'touch_app', title: '2. Click link or enter code', body: 'Click the authorization link or enter the 6-digit backup code.' },
  { icon: 'dashboard', title: "3. You'll be redirected", body: 'Once confirmed, you will be automatically redirected to your dashboard.' },
];

const MagicLinkPage: React.FC = () => {
  // Demo backup code from the mockup (842...) kept as initial state; typing updates locally only.
  const [digits, setDigits] = useState<string[]>(['8', '4', '2', '', '', '']);

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits((prev) => prev.map((d, i) => (i === index ? clean : d)));
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-ink">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center no-underline">
              <img src={logoWordmark} alt="AI Interview" className="h-5 w-auto" />
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

      <main className="flex w-full flex-1 flex-col items-center justify-center bg-surface px-4 pt-16">
        <div className="mx-auto w-full max-w-[1152px] px-2 py-6 sm:px-6">
          {/* Sub-header back link */}
          <div className="mb-4 flex items-center justify-between">
            <Link to="/login" className="group inline-flex items-center gap-1 text-label-md text-ink-variant no-underline transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to sign in</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* LEFT: magic link verification card */}
            <div className="relative overflow-hidden rounded-xl bg-card p-6 shadow-md sm:p-8 lg:col-span-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container" />

              {/* Hero + email identity */}
              <div className="mb-6 flex items-start gap-5">
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-high text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[30px]">forward_to_inbox</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="mb-1 text-headline-lg tracking-tight text-ink">Check your inbox</h1>
                  <p className="m-0 text-body-md text-ink-variant">We sent a secure, one-click sign in link to:</p>
                  <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-surface-mid px-3 py-1.5 text-ink">
                    <span className="material-symbols-outlined text-[16px] text-primary">alternate_email</span>
                    <span className="text-headline-sm font-semibold tracking-tight text-ink">elena@kernel.dev</span>
                    <button type="button" className="ml-2 text-label-sm text-primary underline transition-colors focus:outline-none">
                      Change email
                    </button>
                  </div>
                </div>
              </div>

              {/* Security token & expiry banner */}
              <div className="mb-8 flex flex-col justify-between gap-3 rounded-lg bg-surface-low p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dae2fd] text-primary">
                    {/* surface-container-highest in mockup (no project token) */}
                    <span className="material-symbols-outlined text-[18px]">timer</span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 text-label-md font-medium text-ink">
                      <span>Link expires in</span>
                      <span className="rounded bg-surface-high px-1.5 py-0.5 font-mono text-[12px] font-semibold text-primary">14:20</span>
                    </div>
                    <p className="mt-0.5 text-body-sm text-ink-variant">
                      We sent a temporary login link to your email. Click the link in your email or enter the 6-digit backup code below.
                    </p>
                  </div>
                </div>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-card px-3 py-1.5 text-label-sm text-ink shadow-sm transition-colors hover:bg-surface no-underline"
                >
                  <span>Open Email</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>

              {/* 6-digit backup code */}
              <div className="relative mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-surface-high" />
                  <span className="px-1 text-label-sm font-medium uppercase tracking-wider text-outline-strong">Or enter 6-digit backup code</span>
                  <div className="h-px flex-1 bg-surface-high" />
                </div>
                <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 sm:gap-3">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      className={`h-14 w-11 rounded-lg text-center text-metric-stat shadow-sm transition-all placeholder:text-ink focus:outline-none sm:w-14 ${
                        i === 3 && !d
                          ? 'bg-surface-high font-semibold text-primary'
                          : 'bg-card font-semibold text-ink focus:bg-surface-low'
                      }`}
                      inputMode="numeric"
                      maxLength={1}
                      placeholder="•"
                      type="text"
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-sm text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-[0.99]"
                >
                  <span>Verify &amp; Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>

              {/* Resend & fallback row */}
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-surface-mid pt-5 text-center sm:flex-row sm:text-left">
                <div className="flex items-center gap-1.5 text-body-sm text-ink-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline-strong">help</span>
                  <span>Didn't get the email?</span>
                  <button type="button" className="font-medium text-primary hover:underline">Resend email</button>
                </div>
                <Link to="/login" className="text-label-sm text-ink-variant underline no-underline-offset-2 transition-colors hover:text-ink">
                  Return to password login
                </Link>
              </div>

              {/* Trust note */}
              <div className="mt-6 flex items-center justify-center gap-2 pt-3 text-center text-body-sm text-ink-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                <span>Your information is safe and securely encrypted.</span>
              </div>
            </div>

            {/* RIGHT: context panel */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-high text-primary">
                    <span className="material-symbols-outlined text-[22px]">shield_lock</span>
                  </div>
                  <div>
                    <h3 className="m-0 text-headline-sm font-semibold text-ink">Quick &amp; Secure Sign-in</h3>
                    <p className="mt-0.5 text-body-sm text-ink-variant">
                      Magic links let you access your account instantly without typing a password. Safe, encrypted, and simple.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-md">
                <div className="flex items-center gap-2 border-b border-surface-mid pb-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">checklist</span>
                  <h4 className="m-0 text-headline-sm font-semibold text-ink">Next steps</h4>
                </div>
                <div className="flex flex-col gap-3 text-body-sm text-ink-variant">
                  {NEXT_STEPS.map((s) => (
                    <div key={s.title} className="flex items-start gap-3 rounded-lg bg-surface-low p-3">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">{s.icon}</span>
                      <div>
                        <span className="block text-label-md font-semibold text-ink">{s.title}</span>
                        <span>{s.body}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2.5 rounded-lg bg-surface-mid p-3">
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-outline-strong">info</span>
                  <p className="m-0 text-body-sm text-ink-variant">
                    Didn't get the email? Check your spam folder or click <strong>Resend email</strong>.
                  </p>
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
            <a href="#" className="no-underline transition-colors hover:text-ink">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MagicLinkPage;
