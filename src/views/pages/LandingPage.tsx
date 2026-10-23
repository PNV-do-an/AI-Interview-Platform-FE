import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

/* ------------------------------------------------------------------ */
/* Shared bits (marketing chrome, tokens from tailwind.config.js)      */
/* ------------------------------------------------------------------ */

const Logo: React.FC<{ size?: 'header' | 'footer' }> = ({ size = 'header' }) => (
  <BrandLogo
    markClass={size === 'header' ? 'h-7' : 'h-6'}
    nameClass="text-[15px] font-bold tracking-tight text-ink"
  />
);

const NAV_ITEMS: { label: string; to?: string; active?: boolean }[] = [
  { label: 'Platform' },
  { label: 'For Candidates' },
  { label: 'For Employers' },
  { label: 'Job Board', to: '/jobs' },
  { label: 'Pricing' },
];

const SiteHeader: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline/40">
    <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to="/" aria-label="AI Interview home">
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-label-md text-ink-variant hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href="#"
                className="text-label-md text-ink-variant hover:text-ink transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="hidden sm:inline-flex text-label-md text-ink-variant hover:text-ink px-3 py-2 transition-colors"
        >
          Sign In
        </Link>
        <a
          href="#"
          className="hidden xl:inline-flex items-center text-label-md text-ink bg-card border border-outline hover:bg-surface-low px-3 py-1.5 rounded-lg transition-colors"
        >
          Post a Job
        </a>
        <Link
          to="/register"
          className="inline-flex items-center text-label-md font-medium text-on-primary bg-primary-container hover:bg-primary px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          Get Started Free
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </div>
  </header>
);

const FOOTER_COLUMNS: { heading: string; links: { label: string; to?: string }[] }[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Adaptive Engine' },
      { label: 'Live Coding Sandbox' },
      { label: 'Voice & Telemetry' },
      { label: 'Deterministic Rubrics' },
      { label: 'Security & Integrity' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'Engineering Leaders' },
      { label: 'Talent Operations' },
      { label: 'Candidate Prep' },
      { label: 'Global Job Board', to: '/jobs' },
      { label: 'Enterprise' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation' },
      { label: 'API Reference' },
      { label: 'Bias Methodology' },
      { label: 'Latency Benchmarks' },
      { label: 'Pricing Models' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us' },
      { label: 'Careers' },
      { label: 'Legal & Compliance' },
      { label: 'Privacy Policy' },
      { label: 'Terms of Service' },
    ],
  },
];

const SiteFooter: React.FC<{ tagline: string }> = ({ tagline }) => (
  <footer className="w-full bg-card border-t border-outline/40 pt-16 pb-12">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6 pb-16 border-b border-outline/30">
        <div className="col-span-2">
          <div className="mb-4">
            <Logo size="footer" />
          </div>
          <p className="text-body-sm text-ink-variant max-w-sm mb-6">
            Autonomous real-time computational interviews and deterministic technical rubrics. Built for
            engineering teams, talent leaders, and fair candidate evaluation.
          </p>
          <div className="inline-flex items-center gap-4 text-ink-variant text-[13px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
              SOC 2 Certified
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">security</span>
              Enterprise Secure
            </span>
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-label-sm uppercase tracking-wider text-ink-variant mb-4 font-semibold">
              {col.heading}
            </h4>
            <ul className="space-y-2.5 text-body-sm">
              {col.links.map((link) => (
                <li key={link.label} className="flex">
                  {link.to ? (
                    <Link to={link.to} className="text-ink-variant hover:text-ink transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href="#" className="text-ink-variant hover:text-ink transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-body-sm text-ink-variant">{tagline}</p>
        <div className="flex items-center gap-4 text-body-sm text-ink-variant">
          <a href="#" className="hover:text-ink transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-ink transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-ink transition-colors">
            Security
          </a>
          <div className="flex items-center gap-3 pl-3">
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              terminal
            </span>
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              code
            </span>
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              share
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

/* Dynamic-width progress bar (the only allowed inline style) */
const MeterBar: React.FC<{ pct: number; trackClass?: string }> = ({ pct, trackClass = 'bg-surface-mid' }) => (
  <div className={`w-full h-1.5 rounded-full ${trackClass}`}>
    <div className="h-1.5 rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
  </div>
);

/* ------------------------------------------------------------------ */
/* Hero: interactive simulation preview                                */
/* ------------------------------------------------------------------ */

const WAVEFORM: string[] = [
  'h-3 bg-primary',
  'h-5 bg-primary animate-pulse',
  'h-7 bg-primary-container',
  'h-4 bg-primary',
  'h-6 bg-[#6063ee]', // secondary-container
  'h-2 bg-outline',
  'h-5 bg-primary',
  'h-7 bg-primary-container',
  'h-3 bg-outline',
  'h-6 bg-secondary',
  'h-4 bg-primary',
  'h-2 bg-outline',
  'h-5 bg-primary-container',
  'h-7 bg-primary',
  'h-3 bg-outline',
  'h-6 bg-[#6063ee]', // secondary-container
  'h-4 bg-primary',
  'h-2 bg-outline',
];

const SCORECARD_ROWS: { label: string; pct: number }[] = [
  { label: 'System Architecture & Design', pct: 94 },
  { label: 'Scalability & Fault Tolerance', pct: 86 },
  { label: 'Clean Code & Problem Solving', pct: 84 },
];

const HeroSimulation: React.FC = () => (
  <div className="relative max-w-5xl mx-auto mb-16">
    {/* Frame glow */}
    <div className="absolute -inset-1.5 bg-gradient-to-r from-[#c3c0ff]/50 via-primary-container/20 to-[#e1e0ff]/50 rounded-2xl blur-md opacity-40"/>
    <div className="relative rounded-xl bg-card shadow-xl overflow-hidden">
      {/* Terminal-like titlebar */}
      <div className="h-10 px-4 bg-surface-low flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c0c1ff]" /> {/* secondary-fixed-dim */}
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container/40" />
          </div>
          <div className="h-4 w-px bg-[#dae2fd] mx-1" /> {/* surface-variant */}
          <span className="text-label-md text-ink font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
            Interactive Mock Interview • Senior Backend Architect
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-mid text-primary text-label-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Live Session
          </span>
          <span className="font-mono text-[12px] leading-4 text-ink-variant">24 mins elapsed</span>
        </div>
      </div>
      {/* Split-pane canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Left pane: AI persona & voice stream */}
        <div className="lg:col-span-7 p-6 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-headline-sm text-ink font-semibold">Staff AI Architect (Elena)</span>
                    <span className="px-2 py-0.5 rounded bg-surface-mid text-primary text-label-sm">Host</span>
                  </div>
                  <p className="text-body-sm text-ink-variant">
                    Focus: Distributed consensus, failover guarantees, locking primitives
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-high text-primary text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Turn 4/8
              </span>
            </div>
            {/* Prompt card */}
            <div className="p-4 rounded-lg bg-surface-low mb-4 shadow-sm">
              <p className="text-label-sm text-primary uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">record_voice_over</span> AI Prompt Question
              </p>
              <p className="text-body-md text-ink leading-snug">
                "Explain distributed locking with Redis (Redlock) vs PostgreSQL advisory locks. Under network
                partitions and GC pauses, how do you prevent split-brain dual writes in your consensus layer?"
              </p>
            </div>
            {/* Audio waveform */}
            <div className="p-3 rounded-lg bg-card shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                </div>
                <span className="text-label-sm text-ink font-medium">Elena Speaking</span>
              </div>
              <div className="flex-1 flex items-center gap-1 h-7 px-2">
                {WAVEFORM.map((bar, i) => (
                  <span key={i} className={`w-1 rounded-full ${bar}`} />
                ))}
              </div>
              <span className="font-mono text-[12px] leading-4 text-ink-variant">Real-time STT Active</span>
            </div>
          </div>
          {/* Candidate transcript */}
          <div className="mt-4 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              <span className="text-body-sm text-ink-variant">
                Candidate transcript:{' '}
                <span className="italic text-ink">
                  "Fencing tokens paired with monotonic version keys mitigate out-of-order storage updates..."
                </span>
              </span>
            </div>
            <span className="text-label-sm text-primary font-semibold">Live Audio Transcription</span>
          </div>
        </div>
        {/* Right pane: benchmark scorecard */}
        <div className="lg:col-span-5 p-6 bg-surface-mid flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-sm uppercase tracking-wider text-ink-variant font-semibold">
                Performance Scorecard
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-card text-primary text-label-sm shadow-sm font-medium">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Certified Ready
              </span>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-body-sm text-ink-variant">Overall Match Score</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-display font-bold text-primary">88%</span>
                    <span className="text-headline-sm text-ink-variant">Strong Hire</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-surface-high text-primary text-label-sm font-semibold">
                    Top 8% Candidate
                  </span>
                  <p className="text-body-sm text-ink-variant mt-1">Staff &amp; Senior Level</p>
                </div>
              </div>
              <div className="space-y-2.5 pt-2">
                {SCORECARD_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-label-sm mb-1">
                      <span className="text-ink">{row.label}</span>
                      <span className="font-mono text-[12px] leading-4 font-medium text-primary">{row.pct}%</span>
                    </div>
                    <MeterBar pct={row.pct} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-high shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="min-w-0">
                <p className="text-label-sm font-semibold text-ink truncate">Verified Interview Credential</p>
                <p className="text-body-sm text-ink-variant truncate">
                  Eligible for fast-track screening at 18 partner companies
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-body-sm text-ink-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
              Encrypted &amp; Private
            </span>
            <span className="text-label-sm text-primary font-medium hover:underline cursor-pointer flex items-center gap-0.5">
              View Full Feedback Report <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const LOGOS: { name: string; icon: string }[] = [
  { name: 'CloudScale', icon: 'cloud_queue' },
  { name: 'Synthetix', icon: 'hub' },
  { name: 'DataPulse', icon: 'data_thresholding' },
  { name: 'Voxel Labs', icon: 'view_in_ar' },
  { name: 'FinTech Labs', icon: 'account_balance' },
];

const HeroSection: React.FC = () => (
  <section className="relative w-full overflow-hidden bg-surface py-12 md:py-20 lg:py-24">
    {/* Ambient backdrop glows */}
    <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#c3c0ff]/35 via-primary-container/10 to-transparent blur-3xl opacity-70" />
    <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 bg-[#6063ee]/10 rounded-full blur-2xl" />
    <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
      {/* Eyebrow pill */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-high shadow-sm">
          <span className="inline-flex w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="text-label-sm text-primary font-medium tracking-wide">
            AI-Powered Technical Interview Platform
          </span>
        </div>
      </div>
      {/* Heading & copy */}
      <div className="text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-display font-bold text-ink tracking-tight mb-5 leading-tight">
          The AI-Powered Simulation Platform Where{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#6063ee]">
            Top Engineers Prove Their Craft.
          </span>
        </h1>
        <p className="text-body-lg text-ink-variant max-w-2xl mx-auto leading-relaxed">
          Prepare with realistic, voice-interactive technical simulations trained on tier-1 engineering rubrics.
          Get vetted once, skip repetitive screening loops, and match directly with top tech teams.
        </p>
      </div>
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
        <Link
          to="/register"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-container text-on-primary text-label-md shadow-md shadow-primary-container/20 hover:bg-primary transition-all group"
        >
          <span>Start Free AI Mock Interview</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </Link>
        <a
          href="#"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-card text-ink text-label-md shadow-sm hover:bg-surface-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">play_circle</span>
          <span>Explore Hiring Platform / Post Job</span>
        </a>
      </div>
      <HeroSimulation />
      {/* Trust & social proof logos */}
      <div className="text-center pt-2">
        <p className="text-label-sm uppercase tracking-wider text-ink-variant font-semibold mb-6">
          Trusted by hiring teams &amp; 15,000+ engineers from high-growth tech companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75">
          {LOGOS.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 text-ink text-headline-sm font-bold tracking-tight">
              <span className="material-symbols-outlined text-primary text-[20px]">{logo.icon}</span>
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const METRICS: {
  label: string;
  value: string;
  valueClass: string;
  icon?: string;
  iconColor?: string;
  suffix?: string;
  note: string;
}[] = [
  {
    label: 'Evaluations Finished',
    value: '14,500+',
    valueClass: 'text-ink',
    icon: 'trending_up',
    iconColor: 'text-primary',
    note: 'Simulations conducted across 42 technical tracks',
  },
  {
    label: 'Recruiting Velocity',
    value: '3.8x',
    valueClass: 'text-primary',
    suffix: 'FASTER',
    note: 'Average reduction in time-to-offer for verified engineers',
  },
  {
    label: 'Engineering Consensus',
    value: '94%',
    valueClass: 'text-ink',
    icon: 'handshake',
    iconColor: 'text-primary',
    note: 'Engineering manager agreement with AI rubric recommendations',
  },
  {
    label: 'Screening Threshold',
    value: '62%',
    valueClass: 'text-ink',
    icon: 'target',
    iconColor: 'text-outline-strong',
    note: 'First-attempt candidate baseline pass threshold',
  },
];

const MetricsRibbon: React.FC = () => (
  <section className="w-full bg-surface-low py-10">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {METRICS.map((metric) => (
          <div key={metric.label} className="p-5 rounded-xl bg-card shadow-sm flex flex-col justify-between">
            <span className="text-body-sm text-ink-variant font-medium">{metric.label}</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className={`text-metric-stat font-bold ${metric.valueClass}`}>{metric.value}</span>
              {metric.icon && (
                <span className={`material-symbols-outlined text-[20px] ${metric.iconColor}`}>{metric.icon}</span>
              )}
              {metric.suffix && <span className="text-label-sm font-semibold text-primary">{metric.suffix}</span>}
            </div>
            <p className="text-label-sm text-ink-variant m-0">{metric.note}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeatureVoiceWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-label-sm font-semibold text-ink">Voice Response Speed</span>
      <span className="font-mono text-[12px] leading-4 text-primary">Real-Time Audio</span>
    </div>
    <div className="flex items-center gap-2">
      <MeterBar pct={95} />
      <span className="text-label-sm text-ink-variant font-medium whitespace-nowrap">Natural Flow</span>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Staff Architect</span>
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Tech Lead</span>
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Engineering Manager</span>
    </div>
  </div>
);

const FeatureRubricWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Fair &amp; Impartial Evaluation</span>
      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Blind Review Mode</span>
      <span className="text-label-sm text-primary font-medium">Active</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Consistent Scoring Criteria</span>
      <span className="text-label-sm text-primary font-medium">Standardized</span>
    </div>
  </div>
);

const FeaturePipelineWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
        <span className="material-symbols-outlined text-[18px]">bolt</span>
      </div>
      <div>
        <p className="text-label-sm font-semibold text-ink m-0">Fast-Track Pipeline</p>
        <p className="text-body-sm text-ink-variant m-0">Skip generic recruiter screens</p>
      </div>
    </div>
    <div className="mt-2 text-center py-1.5 rounded bg-card text-label-sm text-primary font-medium">
      4.2 Average Employer Interview Invites
    </div>
  </div>
);

const PILLARS: { icon: string; title: string; body: string; widget: React.ReactNode }[] = [
  {
    icon: 'mic_double',
    title: 'Zero-Latency Voice & Code Simulations',
    body: 'Practice with adaptive technical personas (Staff Engineers, Directors, Engineering Managers). Multi-turn follow-ups, dynamic edge-case probes, and real-time audio transcriptions that interrupt when you wander off-scope.',
    widget: <FeatureVoiceWidget />,
  },
  {
    icon: 'balance',
    title: 'Objective, Unbiased Scoring & Rubrics',
    body: 'Evaluated on concrete software engineering competencies—System Design, Concurrency, Algorithmic Rigor, and Clean Architecture. Eliminates human interview fatigue, brand prestige bias, and non-technical noise.',
    widget: <FeatureRubricWidget />,
  },
  {
    icon: 'forward_media',
    title: 'Direct Verified Hiring Pipeline',
    body: 'Skip endless initial HR telephone screens and repetitive LeetCode filters. Top simulation scores earn cryptographic verified credential badges shared automatically with hiring employers for immediate final rounds.',
    widget: <FeaturePipelineWidget />,
  },
];

const FeatureSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="max-w-3xl mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Core Technological Advantage
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          Architected for Technical Depth, Not Canned Script Reading.
        </h2>
        <p className="text-body-lg text-ink-variant">
          Generic chat prompts fail in real engineering loops. InterviewAI uses conversational state machines and
          dynamic code execution sandboxes to stress-test architecture under actual pressure.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl bg-card shadow-sm p-8 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-mid flex items-center justify-center text-primary mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[26px]">{pillar.icon}</span>
              </div>
              <h3 className="text-headline-md font-bold text-ink mb-3">{pillar.title}</h3>
              <p className="text-body-md text-ink-variant mb-6 leading-relaxed">{pillar.body}</p>
            </div>
            {pillar.widget}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const STEPS: {
  num: string;
  tag: string;
  title: string;
  body: string;
  footer: React.ReactNode;
}[] = [
  {
    num: '1',
    tag: '01 / SETUP',
    title: 'Select Your Target Stack',
    body: 'Tailor role expectations for Java/Spring Boot backend, React/Next.js frontend, Distributed Systems, or ML Infrastructure.',
    footer: (
      <div className="space-y-1.5 pt-2">
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          Distributed Systems
        </span>
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          React/Next.js
        </span>
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          Java / Go
        </span>
      </div>
    ),
  },
  {
    num: '2',
    tag: '02 / SIMULATE',
    title: 'Interactive Voice Simulation',
    body: 'Engage directly with our Staff AI Persona in a 45-minute live audio and coding session with dynamic complexity pivots.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-ink font-mono text-[12px] leading-4">
        <div className="flex items-center gap-1.5 text-primary mb-1">
          <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Active Voice Sandbox
        </div>
        <span>Adaptive code execution</span>
      </div>
    ),
  },
  {
    num: '3',
    tag: '03 / DIAGNOSE',
    title: 'Diagnostic Scorecard',
    body: 'Receive deep feedback detailing edge-case blind spots, algorithmic runtime tradeoffs, and a hyper-targeted review path.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-ink font-mono text-[12px] leading-4 flex items-center justify-between">
        <span>Scorecard #DIAG-82</span>
        <span className="text-primary font-semibold">92.4 Pts</span>
      </div>
    ),
  },
  {
    num: '4',
    tag: '04 / MATCH',
    title: '1-Click Fast-Track Match',
    body: 'Verified scores bypass round-1 recruiter gatekeepers directly into final hiring team interview rounds.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-primary text-label-sm font-semibold text-center shadow-sm">
        Bypass Initial Phone Screens →
      </div>
    ),
  },
];

const HowItWorksSection: React.FC = () => (
  <section className="w-full bg-surface-low py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Deterministic Hiring Pipeline
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          How InterviewAI Gets You Hired in 4 Simple Steps
        </h2>
        <p className="text-body-lg text-ink-variant">
          From target technology track selection to real-time simulation, diagnostic scoring, and verified final
          round routing.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.num} className="rounded-xl bg-card p-6 shadow-sm flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-headline-sm flex items-center justify-center shadow-sm">
                  {step.num}
                </span>
                <span className="font-mono text-[12px] leading-4 text-ink-variant">{step.tag}</span>
              </div>
              <h4 className="text-headline-sm font-bold text-ink mb-2">{step.title}</h4>
              <p className="text-body-sm text-ink-variant mb-6">{step.body}</p>
            </div>
            {step.footer}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const AUDIENCE_CARDS: {
  badge: string;
  badgeClass: string;
  cardClass: string;
  icon: string;
  title: string;
  body: string;
  bulletIcon: string;
  bullets: React.ReactNode[];
  cta: string;
}[] = [
  {
    badge: 'For Technical Candidates',
    badgeClass: 'bg-surface-mid text-primary',
    cardClass: 'bg-card',
    icon: 'person_celebrate',
    title: 'Level up under authentic pressure, then prove it.',
    body: 'Stop guessing why you were rejected with generic template emails. Get deterministic, granular machine rubrics on your architecture answers and earn certified credentials that companies take seriously.',
    bulletIcon: 'check_circle',
    bullets: [
      <>
        <strong>Unlimited voice practice sessions</strong> tailored to L4-L7 software competencies.
      </>,
      <>
        <strong>Real-time code scratchpad &amp; AST analysis</strong> with syntax guidance and time-complexity
        breakdowns.
      </>,
      <>
        <strong>Actionable architecture curriculum</strong> pointing out concurrency hazards and data drift errors.
      </>,
      <>
        <strong>Cryptographically verifiable certificate badge</strong> recognized by partner engineering
        organizations.
      </>,
    ],
    cta: 'View Candidate Simulation Tracks',
  },
  {
    badge: 'For Modern Engineering Teams',
    badgeClass: 'bg-card text-primary shadow-sm',
    cardClass: 'bg-surface-high',
    icon: 'apartment',
    title: 'Recover 15+ weekly senior engineering hours.',
    body: 'Eliminate repetitive first-round coding screens without compromising technical rigor. Receive full candidate code recordings, architectural tradeoffs, and EEOC-audited decision logs.',
    bulletIcon: 'verified',
    bullets: [
      <>
        <strong>Automated 1st-round technical screening</strong> custom-calibrated to your production tech stack.
      </>,
      <>
        <strong>Deterministic rubric scoring</strong> benchmarked directly against Staff/Principal criteria.
      </>,
      <>
        <strong>SOC-2 Type II compliant audit logs</strong> and EEOC adverse impact avoidance telemetry.
      </>,
      <>
        <strong>Direct ATS integration</strong> with Greenhouse, Lever, Ashby, and Workday.
      </>,
    ],
    cta: 'Schedule Engineering Platform Demo',
  },
];

const DualAudienceSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Symmetric Calibration
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          Built for High-Performing Candidates and Modern Engineering Teams Alike
        </h2>
        <p className="text-body-lg text-ink-variant">
          Engineers want realistic prep without wasted time. Hiring managers want deterministic technical certainty
          without 12-hour weekly interview burdens.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {AUDIENCE_CARDS.map((card) => (
          <div key={card.badge} className={`rounded-2xl p-8 lg:p-10 shadow-sm flex flex-col justify-between ${card.cardClass}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-label-sm font-semibold ${card.badgeClass}`}>
                  {card.badge}
                </span>
                <span className="material-symbols-outlined text-[24px] text-primary">{card.icon}</span>
              </div>
              <h3 className="text-headline-lg font-bold text-ink mb-4">{card.title}</h3>
              <p className="text-body-md text-ink-variant mb-8 leading-relaxed">{card.body}</p>
              <ul className="space-y-4 mb-8">
                {card.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                      {card.bulletIcon}
                    </span>
                    <span className="text-body-md text-ink">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6">
              <a href="#" className="inline-flex items-center gap-2 text-label-md text-primary font-medium hover:underline">
                <span>{card.cta}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SANDBOX_LANGS = ['Go 1.22', 'Rust 1.78', 'Java 21', 'TypeScript 5.4', 'Python 3.12'];

const CodeSandboxSection: React.FC = () => (
  <section className="w-full bg-surface-low py-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="rounded-2xl bg-card p-8 lg:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
              Interactive Code Sandbox
            </span>
            <h3 className="text-headline-lg font-bold text-ink mb-3">Live Polyglot Execution</h3>
            <p className="text-body-md text-ink-variant mb-6 leading-relaxed">
              Interactive live code editor with instant test feedback. Write and test real code against dynamic edge
              cases and unit tests while talking through your architectural assumptions.
            </p>
            <div className="flex items-center gap-2 font-mono text-[12px] leading-4 text-ink-variant mb-6 flex-wrap">
              {SANDBOX_LANGS.map((lang) => (
                <span key={lang} className="px-2 py-1 rounded bg-surface-mid">
                  {lang}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-label-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-primary" /> Memory leak detection
              </span>
              <span className="flex items-center gap-1.5 text-label-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-primary" /> Thread contention logs
              </span>
            </div>
          </div>
          {/* Code sandbox preview window */}
          <div className="lg:col-span-7 rounded-xl bg-surface-mid shadow-md overflow-hidden">
            <div className="h-9 px-4 bg-surface-high flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-mono text-[12px] leading-4 text-ink">Ready to Run</span>
              </div>
              <span className="font-mono text-[12px] leading-4 text-ink-variant">Ready to Run</span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-4 text-ink overflow-x-auto">
              <pre className="leading-relaxed m-0">
                <code>
                  <span className="text-secondary font-semibold">public class</span>{' '}
                  <span className="text-primary font-semibold">DistributedLeaseManager</span>
                  {' {\n'}
                  {'    '}
                  <span className="text-ink-variant">
                    // AI Probe: Check TTL expiration edge cases during stop-the-world GC
                  </span>
                  {'\n    '}
                  <span className="text-secondary font-semibold">public boolean</span> acquireLock(String
                  resourceId, <span className="text-secondary">long</span> ttlMillis) {'{\n'}
                  {'        '}String token = UUID.randomUUID().toString();{'\n        '}
                  <span className="text-secondary font-semibold">boolean</span> locked =
                  redisClient.setIfAbsent(resourceId, token, ttlMillis);{'\n        '}
                  <span className="text-secondary font-semibold">if</span> (!locked) {'{\n'}
                  {'            '}
                  <span className="text-secondary font-semibold">throw new</span> LockContentionException(
                  <span className="text-ink-variant">"Active lease holder exists"</span>);{'\n        }\n'}
                  {'        '}
                  <span className="text-secondary font-semibold">return</span> scheduleFencingHeartbeat(resourceId,
                  token);{'\n    }\n}'}
                </code>
              </pre>
            </div>
            <div className="px-4 py-2.5 bg-surface-high flex items-center justify-between">
              <span className="text-label-sm text-primary font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                All Automated Tests Passing
              </span>
              <span className="text-label-sm text-ink-variant">Clean Solution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCtaSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-24 relative overflow-hidden">
    <div className="max-w-5xl mx-auto px-6 lg:px-12 relative">
      <div className="rounded-3xl bg-surface-high p-8 md:p-14 text-center shadow-lg relative overflow-hidden">
        {/* Accent glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#c3c0ff]/60 blur-3xl rounded-full" />
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-3">
          Instant Evaluation Available
        </span>
        <h2 className="text-display font-bold text-ink mb-4 max-w-2xl mx-auto">
          Ready to Benchmark Your Technical Readiness?
        </h2>
        <p className="text-body-lg text-ink-variant max-w-xl mx-auto mb-8">
          Join thousands of engineers who test their skills under real interview conditions and connect directly
          with high-caliber tech companies.
        </p>
        <div className="max-w-md mx-auto mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-4 py-3 rounded-lg bg-card text-ink text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-ink-variant/70"
              placeholder="Enter your work or personal email"
              type="email"
            />
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary shadow-md shadow-primary-container/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Practicing</span>
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-ink-variant text-body-sm flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">credit_card_off</span> No credit
            card required
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span> Instant AI feedback
            in &lt;60s
          </span>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const LandingPage: React.FC = () => (
  <div className="bg-surface min-h-screen">
    <SiteHeader />
    <main className="w-full pt-16 bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        <HeroSection />
        <MetricsRibbon />
        <FeatureSection />
        <HowItWorksSection />
        <DualAudienceSection />
        <CodeSandboxSection />
        <FinalCtaSection />
      </div>
    </main>
    <SiteFooter tagline="© 2025 InterviewAI Inc. All rights reserved." />
  </div>
);

export default LandingPage;
