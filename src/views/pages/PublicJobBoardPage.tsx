import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Marketing chrome (header / footer), same as public landing design   */
/* ------------------------------------------------------------------ */

const Logo: React.FC<{ size?: 'header' | 'footer' }> = ({ size = 'header' }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={
        size === 'header'
          ? 'w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm shadow-primary/20'
          : 'w-6 h-6 rounded-md bg-primary flex items-center justify-center text-on-primary'
      }
    >
      <span className={`material-symbols-outlined ${size === 'header' ? 'text-[18px]' : 'text-[15px]'}`}>
        psychology
      </span>
    </div>
    <span
      className={
        size === 'header'
          ? 'text-headline-md font-bold tracking-tight text-ink'
          : 'text-headline-sm font-bold tracking-tight text-ink'
      }
    >
      Interview<span className="text-primary">AI</span>
    </span>
  </div>
);

const NAV_ITEMS: { label: string; to?: string; active?: boolean }[] = [
  { label: 'Platform' },
  { label: 'For Candidates' },
  { label: 'For Employers' },
  { label: 'Job Board', to: '/jobs', active: true },
  { label: 'Pricing' },
];

const SiteHeader: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline/40">
    <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to="/" aria-label="InterviewAI home">
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={
                  item.active
                    ? 'text-label-md text-primary font-medium transition-colors'
                    : 'text-label-md text-ink-variant hover:text-ink transition-colors'
                }
              >
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href="#" className="text-label-md text-ink-variant hover:text-ink transition-colors">
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

const SiteFooter: React.FC = () => (
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
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-ink-variant text-[12px]">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              Verified Hiring Standards
            </div>
            <span className="text-outline">•</span>
            <div className="inline-flex items-center gap-1.5 text-ink-variant text-[12px]">
              <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
              Protected Data Privacy
            </div>
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
        <p className="text-body-sm text-ink-variant">
          © 2025 InterviewAI Inc. All rights reserved. Connecting engineers with verified opportunities.
        </p>
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

const VerifiedIcon: React.FC<{ size?: string }> = ({ size = 'text-[16px]' }) => (
  <span
    className={`material-symbols-outlined ${size} text-primary [font-variation-settings:'FILL'_1]`}
    title="Verified Hiring Partner"
  >
    verified
  </span>
);

/* ------------------------------------------------------------------ */
/* Demo job data (copied from the mockup)                              */
/* ------------------------------------------------------------------ */

type BadgeKind = 'fasttrack-strong' | 'fasttrack' | 'posted' | 'alignment' | 'verified';

interface DemoJob {
  id: number;
  initials: string;
  logoClass: string;
  company: string;
  verified: boolean;
  req: string;
  title: string;
  badgeKind: BadgeKind;
  badgeText: string;
  badgeSub?: string;
  hourly: number;
  pay: string;
  locationIcon: string;
  location: string;
  schedule: string;
  role: 'backend' | 'frontend' | 'fullstack' | 'systems';
  level: 'intern' | 'newgrad' | 'junior' | 'mid';
  mode: 'remote' | 'hybrid' | 'onsite';
  stack: string[];
  moreCount?: number;
  footDot?: string;
  footNote: string;
  cta: 'apply' | 'inspect';
  tags: string[];
}

const DEMO_JOBS: DemoJob[] = [
  {
    id: 1,
    initials: 'CS',
    logoClass: 'bg-primary/10 text-primary',
    company: 'CloudScale Tech',
    verified: true,
    req: 'REQ-8492',
    title: 'Java Backend Developer Intern',
    badgeKind: 'fasttrack-strong',
    badgeText: 'Fast-Track (Score ≥ 80)',
    badgeSub: 'Your Score: 88 ✓',
    hourly: 45,
    pay: '$45.00/hr',
    locationIcon: 'public',
    location: 'Remote (US Only)',
    schedule: 'Full-time / Summer 2025',
    role: 'backend',
    level: 'intern',
    mode: 'remote',
    stack: ['Spring Boot 3', 'PostgreSQL', 'Docker', 'Kafka'],
    moreCount: 2,
    footDot: 'bg-[#10b981]', // emerald-500
    footNote: '12 candidates fast-tracked this week',
    cta: 'apply',
    tags: ['java', 'spring', 'remote-us', 'internship'],
  },
  {
    id: 2,
    initials: 'SX',
    logoClass: 'bg-secondary/10 text-secondary',
    company: 'Synthetix AI',
    verified: true,
    req: 'REQ-8310',
    title: 'Frontend Developer Intern (React/Next.js)',
    badgeKind: 'fasttrack',
    badgeText: 'Fast-Track (Score ≥ 85)',
    badgeSub: 'Eligible (88 > 85)',
    hourly: 50,
    pay: '$50.00/hr',
    locationIcon: 'location_on',
    location: 'Hybrid (San Francisco, CA)',
    schedule: 'Full-time / 16 weeks',
    role: 'frontend',
    level: 'intern',
    mode: 'hybrid',
    stack: ['TypeScript 5', 'Next.js 15', 'Tailwind CSS', 'WebGL'],
    footDot: 'bg-secondary',
    footNote: 'Autonomous UI Canvas team • 2 openings',
    cta: 'inspect',
    tags: ['react', 'internship'],
  },
  {
    id: 3,
    initials: 'DP',
    logoClass: 'bg-[#313ba4]/10 text-[#313ba4]', // tertiary
    company: 'DataPulse Systems',
    verified: false,
    req: 'REQ-7901',
    title: 'Fullstack Systems Engineer Intern',
    badgeKind: 'posted',
    badgeText: 'Posted 2d ago',
    hourly: 42,
    pay: '$42.00/hr',
    locationIcon: 'public',
    location: 'Remote (Global CET/EST)',
    schedule: 'Internship / Fall 2025',
    role: 'fullstack',
    level: 'intern',
    mode: 'remote',
    stack: ['Go (Golang)', 'React', 'Redis', 'Kubernetes'],
    footNote: 'Standard screening path • Takes ~35 mins',
    cta: 'inspect',
    tags: ['react', 'internship'],
  },
  {
    id: 4,
    initials: 'VX',
    logoClass: 'bg-[#dae2fd] text-ink', // surface-container-highest
    company: 'Voxel Labs',
    verified: true,
    req: 'REQ-8109',
    title: 'Distributed Systems Engineering Intern',
    badgeKind: 'alignment',
    badgeText: '92% Alignment',
    hourly: 48,
    pay: '$48.00/hr',
    locationIcon: 'location_on',
    location: 'Hybrid (New York, NY)',
    schedule: 'Summer Internship',
    role: 'systems',
    level: 'intern',
    mode: 'hybrid',
    stack: ['Rust', 'C++', 'gRPC', 'Raft Consensus'],
    footDot: 'bg-primary',
    footNote: 'Requires custom systems memory benchmark',
    cta: 'inspect',
    tags: ['internship'],
  },
  {
    id: 5,
    initials: 'FT',
    logoClass: 'bg-[#d1fae5] text-[#064e3b]', // emerald-100 / emerald-800
    company: 'FinTech Labs',
    verified: true,
    req: 'REQ-7612',
    title: 'Cloud Infrastructure & DevOps Intern',
    badgeKind: 'verified',
    badgeText: 'Verified Employer',
    hourly: 46,
    pay: '$46.00/hr',
    locationIcon: 'public',
    location: 'Remote (US/Canada)',
    schedule: 'Full-time / 12 weeks',
    role: 'backend',
    level: 'intern',
    mode: 'remote',
    stack: ['AWS', 'Terraform', 'Python', 'Docker CI/CD'],
    footNote: 'Security clearable preferred • 4 rounds max',
    cta: 'inspect',
    tags: ['remote-us', 'internship'],
  },
];

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

const QUICK_CHIPS: { id: string; label: string; dot?: boolean }[] = [
  { id: 'fasttrack', label: '🔥 Fast-Track Enabled' },
  { id: 'java', label: 'Java / Spring Boot', dot: true },
  { id: 'react', label: 'React 19' },
  { id: 'remote-us', label: 'Remote US' },
  { id: 'internship', label: 'Internships 2025' },
];

const chipMatches = (chipId: string, job: DemoJob): boolean => {
  if (chipId === 'fasttrack') return job.badgeKind === 'fasttrack-strong' || job.badgeKind === 'fasttrack';
  return job.tags.includes(chipId);
};

/* ------------------------------------------------------------------ */
/* Job card                                                            */
/* ------------------------------------------------------------------ */

const BADGE_STYLES: Record<BadgeKind, { pill: string; icon?: string; iconClass?: string }> = {
  'fasttrack-strong': {
    pill: 'bg-success-bg text-success-text', // emerald-50 / emerald-800
    icon: 'bolt',
    iconClass: 'text-[#059669]', // emerald-600
  },
  fasttrack: { pill: 'bg-primary-container/10 text-primary', icon: 'bolt' },
  posted: { pill: 'bg-surface-mid text-ink-variant', icon: 'fiber_new', iconClass: 'text-primary' },
  alignment: { pill: 'bg-[#faf5ff] text-[#6b21a8]', icon: 'psychology', iconClass: 'text-[#9333ea]' }, // purple-50/800/600
  verified: { pill: 'bg-surface-mid text-ink-variant' },
};

const JobCard: React.FC<{ job: DemoJob; selected: boolean; onSelect: () => void }> = ({
  job,
  selected,
  onSelect,
}) => {
  const badge = BADGE_STYLES[job.badgeKind];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      className={`cursor-pointer group bg-card rounded-xl p-5 shadow-sm transition-all duration-150 ${
        selected ? 'ring-2 ring-primary/60' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-lg ${job.logoClass} flex items-center justify-center font-bold text-headline-sm shrink-0`}
          >
            {job.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-label-md font-semibold text-ink">{job.company}</span>
              {job.verified && <VerifiedIcon />}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-mid font-mono text-ink-variant">
                {job.req}
              </span>
            </div>
            <h3 className="text-headline-md font-bold text-ink mt-0.5 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-label-sm shadow-sm ${badge.pill}`}
          >
            {badge.icon && (
              <span className={`material-symbols-outlined text-[13px] ${badge.iconClass || ''}`}>{badge.icon}</span>
            )}
            {job.badgeText}
          </span>
          {job.badgeSub && (
            <span
              className={`font-mono text-[11px] font-semibold ${
                job.badgeKind === 'fasttrack-strong' ? 'text-[#047857]' : 'text-primary'
              }`}
            >
              {job.badgeSub}
            </span>
          )}
        </div>
      </div>
      {/* Metadata tags */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-ink-variant text-body-sm mb-3.5">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">payments</span>
          <strong className="text-ink font-semibold">{job.pay}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">{job.locationIcon}</span>
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          {job.schedule}
        </span>
      </div>
      {/* Stack badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {job.stack.map((tech) => (
          <span key={tech} className="px-2 py-0.5 rounded bg-surface-high font-mono text-[11px] text-ink">
            {tech}
          </span>
        ))}
        {job.moreCount !== undefined && (
          <span className="px-2 py-0.5 rounded bg-surface-mid font-mono text-[11px] text-ink-variant">
            +{job.moreCount} more
          </span>
        )}
      </div>
      {/* Direct actions inside card */}
      <div className="flex items-center justify-between pt-3">
        <div className="text-[12px] text-ink-variant flex items-center gap-1.5">
          {job.footDot && <span className={`w-2 h-2 rounded-full ${job.footDot}`} />}
          <span>{job.footNote}</span>
        </div>
        <div className="flex items-center gap-2">
          {job.cta === 'apply' ? (
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-label-md font-medium hover:bg-primary shadow-sm transition-colors"
            >
              Apply with AI Score
            </Link>
          ) : (
            <span className="text-label-sm text-primary font-medium group-hover:translate-x-0.5 transition-transform">
              Inspect Details →
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sticky inspector pane (featured requisition, per mockup)            */
/* ------------------------------------------------------------------ */

const INSPECTOR_STACK: { icon: string; name: string; note: string }[] = [
  { icon: 'terminal', name: 'Java 21 LTS', note: 'Virtual Threads & Core' },
  { icon: 'dns', name: 'Spring Boot 3', note: 'WebMVC & Data JPA' },
  { icon: 'database', name: 'PostgreSQL', note: 'B-tree indexing & Locks' },
  { icon: 'hub', name: 'Apache Kafka', note: 'Partitions & Offsets' },
];

const INSPECTOR_SKILLS: { name: string; level: string }[] = [
  { name: 'Memory Management & Concurrency', level: 'Advanced' },
  { name: 'Query Optimization & Schema Design', level: 'Advanced' },
  { name: 'RESTful API Architecture & Security', level: 'Proficient' },
  { name: 'System Scalability & Reliability', level: 'Proficient' },
];

const InspectorPane: React.FC = () => (
  <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {/* Job header profile */}
      <div className="flex items-start justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-headline-md shadow-md shadow-primary/20">
            CS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-label-md font-semibold text-ink">CloudScale Tech</span>
              <VerifiedIcon />
            </div>
            <div className="text-body-sm text-ink-variant">Austin, TX (HQ) • Series B • 140 Engineers</div>
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg text-ink-variant hover:text-ink hover:bg-surface-low transition-colors"
          title="Bookmark Job"
          aria-label="Bookmark Job"
        >
          <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
        </button>
      </div>
      <div className="pt-2 pb-4">
        <h2 className="text-headline-lg font-bold text-ink">Java Backend Developer Intern</h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="px-2.5 py-1 rounded-md bg-success-bg text-[#064e3b] text-label-sm font-semibold">
            $45.00/hr ($93,600 annualized)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-mid text-label-sm text-ink-variant">
            Remote (US Only)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-mid text-label-sm text-ink-variant">
            Internship / 14 wks
          </span>
        </div>
      </div>
      {/* Fast-track callout banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-info/40 via-surface-high/60 to-surface-low mb-5 relative overflow-hidden">
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-label-md font-bold text-primary">Fast-Track Status: Qualified</h4>
              <span className="font-mono text-[12px] leading-4 font-bold text-primary">Score: 88 / 100</span>
            </div>
            <p className="text-body-sm text-ink mt-1 leading-snug">
              Employer set a threshold of <strong>≥ 80/100</strong>. Your verified benchmark qualifies you to bypass
              recruiter phone screens and move straight to System Architecture!
            </p>
            <div className="flex items-center gap-2 mt-2 font-mono text-[11px] leading-4 text-ink-variant">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981]" /> {/* emerald-500 */}
              <span>Verified candidate • Direct interview invite ready</span>
            </div>
          </div>
        </div>
      </div>
      {/* CTA buttons */}
      <div className="flex items-center gap-2.5 mb-6">
        <Link
          to="/register"
          className="flex-1 py-2.5 px-4 rounded-lg bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          <span>Apply with Verified Score</span>
        </Link>
        <button
          type="button"
          aria-label="Share"
          className="py-2.5 px-3 rounded-lg bg-surface-low text-ink text-label-md hover:bg-surface-mid transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
      </div>
      {/* Deep-dive details */}
      <div className="space-y-5">
        <div>
          <h4 className="text-label-sm uppercase tracking-wider font-semibold text-ink-variant mb-2">
            Role Overview &amp; Mandate
          </h4>
          <p className="text-body-sm text-ink leading-relaxed">
            As a Java Backend Developer Intern on CloudScale’s Core Telemetry team, you will build and scale
            distributed transaction pipelines handling 450k events/sec. You'll partner closely with Principal
            Engineers to deploy performant microservices across our multi-region Kubernetes clusters.
          </p>
          <ul className="mt-2 space-y-1.5 text-body-sm text-ink-variant">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Optimize high-throughput PostgreSQL connection pooling &amp; transaction isolation levels.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Build event-driven consumers using Apache Kafka and Spring Cloud Stream.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Maintain 99.99% reliability SLA with automated canary deployments and metrics.</span>
            </li>
          </ul>
        </div>
        <div className="pt-2">
          <h4 className="text-label-sm uppercase tracking-wider font-semibold text-ink-variant mb-2.5">
            Evaluated Technology Stack
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {INSPECTOR_STACK.map((item) => (
              <div key={item.name} className="p-2 rounded-lg bg-surface-low flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-label-sm font-semibold text-ink truncate">{item.name}</div>
                  <div className="text-[11px] text-ink-variant">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-label-sm uppercase tracking-wider font-semibold text-ink-variant">
              Core Skills Evaluated
            </h4>
            <span className="text-label-sm text-[12px] text-[#047857] font-medium">All Requirements Met</span>
          </div>
          <div className="space-y-2 p-3 bg-surface-low rounded-lg">
            {INSPECTOR_SKILLS.map((skill, i) => (
              <div
                key={skill.name}
                className={`flex items-center justify-between text-label-sm py-1 ${
                  i > 0 ? 'border-t border-outline/30' : ''
                }`}
              >
                <span className="text-ink font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#059669] text-[16px]">check</span>
                  {skill.name}
                </span>
                <span className="text-ink-variant text-label-sm">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-2">
          <h4 className="text-label-sm uppercase tracking-wider font-semibold text-ink-variant mb-2.5">
            Fast-Track Hiring Pipeline
          </h4>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-high">
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#10b981] text-on-primary flex items-center justify-center text-[10px]">
                ✓
              </div>
              <div className="text-label-md font-semibold text-ink">Stage 1: AI Technical Benchmark</div>
              <p className="text-body-sm text-ink-variant">Completed (Score: 88/100). Recruiter screen waived.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">
                2
              </div>
              <div className="text-label-md font-semibold text-ink">Stage 2: Live Architecture Deep-Dive</div>
              <p className="text-body-sm text-ink-variant">
                45-minute interactive session with Staff Platform Architect.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-surface-high text-ink-variant flex items-center justify-center text-[10px] font-bold">
                3
              </div>
              <div className="text-label-md font-semibold text-ink">Stage 3: Executive Sync &amp; Formal Offer</div>
              <p className="text-body-sm text-ink-variant">Direct placement review with VP of Engineering.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Governance assurance micro-widget */}
    <div className="bg-surface-low rounded-xl p-4 flex items-center justify-between text-ink-variant text-body-sm">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
        <span>Fair &amp; transparent evaluation for every candidate</span>
      </div>
      <a href="#" className="text-primary font-medium hover:underline text-label-sm">
        Learn More →
      </a>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Filter controls                                                     */
/* ------------------------------------------------------------------ */

const selectClass =
  'w-full h-10 pl-3 pr-7 bg-surface-mid rounded-lg text-label-md text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer';

const SelectWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    {children}
    <span className="material-symbols-outlined absolute right-2 top-2.5 text-[18px] text-ink-variant pointer-events-none">
      expand_more
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const PublicJobBoardPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [mode, setMode] = useState('');
  const [comp, setComp] = useState('');
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Cmd/Ctrl + K) focuses the search box, per mockup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleChip = (id: string) =>
    setActiveChips((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const filtered = useMemo(
    () =>
      DEMO_JOBS.filter((job) => {
        const q = search.trim().toLowerCase();
        if (
          q &&
          ![job.title, job.company, ...job.stack].some((field) => field.toLowerCase().includes(q))
        ) {
          return false;
        }
        if (role && job.role !== role) return false;
        if (level && job.level !== level) return false;
        if (mode && job.mode !== mode) return false;
        if (comp && job.hourly < Number(comp)) return false;
        if (!activeChips.every((chip) => chipMatches(chip, job))) return false;
        return true;
      }),
    [search, role, level, mode, comp, activeChips]
  );

  const activeFilterCount =
    [role, level, mode, comp].filter(Boolean).length + activeChips.length;

  const resetFilters = () => {
    setSearch('');
    setRole('');
    setLevel('');
    setMode('');
    setComp('');
    setActiveChips([]);
  };

  return (
    <div className="bg-surface min-h-screen">
      <SiteHeader />
      <main className="w-full pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          {/* Ambient header underlay */}
          <div className="relative w-full bg-surface-low/70 overflow-hidden">
            <div className="absolute -top-32 left-1/3 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-12 right-10 w-72 h-72 bg-[#6063ee]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-7">
              {/* Breadcrumb & verification pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 text-body-sm text-ink-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">explore</span>
                  <span>Engineering Job Board</span>
                  <span>/</span>
                  <span className="text-ink font-medium">Open Roles</span>
                  <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-card text-primary text-label-sm shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    86 Available Roles
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card text-ink-variant text-label-sm shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span>
                  <span className="text-ink font-medium">Elena Rostova</span>
                  <span className="w-1 h-1 rounded-full bg-outline" />
                  <span className="text-primary font-medium">Profile Verified</span>
                </div>
              </div>
              {/* Title & value prop */}
              <div className="max-w-3xl mb-6">
                <h1 className="text-headline-lg font-bold tracking-tight text-ink mb-2">
                  Explore Verified Engineering Roles
                </h1>
                <p className="text-body-md text-ink-variant leading-relaxed">
                  All listings are pre-approved by our platform governance team with clear compensation, tech stack
                  requirements, and direct AI benchmark fast-tracks.
                </p>
              </div>
              {/* Search & multi-filter card */}
              <div className="bg-card rounded-xl p-3.5 shadow-sm">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-variant">
                      <span className="material-symbols-outlined text-[20px]">search</span>
                    </div>
                    <input
                      ref={searchRef}
                      className="w-full h-10 pl-10 pr-16 bg-surface-low rounded-lg text-body-md text-ink placeholder:text-outline-strong focus:outline-none focus:bg-card focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Search by title, skills (e.g. Java, React, Docker), or company..."
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-mid font-mono text-[11px] text-ink-variant shadow-inner">
                        ⌘K
                      </kbd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <SelectWrap>
                      <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role category">
                        <option value="">Role: All</option>
                        <option value="backend">Backend</option>
                        <option value="frontend">Frontend</option>
                        <option value="fullstack">Fullstack</option>
                        <option value="systems">Systems</option>
                      </select>
                    </SelectWrap>
                    <SelectWrap>
                      <select className={selectClass} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Experience level">
                        <option value="">Level: All</option>
                        <option value="intern">Intern (2025)</option>
                        <option value="newgrad">New Grad</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-Level</option>
                      </select>
                    </SelectWrap>
                    <SelectWrap>
                      <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Work mode">
                        <option value="">Mode: All</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site</option>
                      </select>
                    </SelectWrap>
                    <SelectWrap>
                      <select className={selectClass} value={comp} onChange={(e) => setComp(e.target.value)} aria-label="Minimum compensation">
                        <option value="">Comp: Any</option>
                        <option value="40">$40/hr+ ($83k+)</option>
                        <option value="50">$50/hr+ ($104k+)</option>
                        <option value="60">$60/hr+ ($125k+)</option>
                      </select>
                    </SelectWrap>
                  </div>
                </div>
                {/* Quick filter badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3">
                  <span className="text-label-sm text-ink-variant uppercase tracking-wider font-semibold mr-1">
                    Quick:
                  </span>
                  {QUICK_CHIPS.map((chip) => {
                    const active = activeChips.includes(chip.id);
                    if (chip.id === 'fasttrack') {
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleChip(chip.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm shadow-sm transition-colors ${
                            active
                              ? 'bg-primary-container text-on-primary hover:bg-primary'
                              : 'bg-surface-low text-ink hover:bg-surface-mid'
                          }`}
                        >
                          <span>{chip.label}</span>
                          <span className="text-[11px] opacity-80">(18)</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleChip(chip.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm transition-colors ${
                          active
                            ? 'bg-surface-high text-primary font-semibold'
                            : 'bg-surface-low text-ink hover:bg-surface-mid'
                        }`}
                      >
                        {chip.dot && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                  <div className="ml-auto text-ink-variant text-label-sm hidden sm:inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>{activeFilterCount} filters active</span>
                    <button type="button" className="text-primary hover:underline ml-1" onClick={resetFilters}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Master-detail work area */}
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 w-full">
            {/* Results metadata bar */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-headline-sm font-bold text-ink">Verified Open Requisitions</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-high font-mono text-[11px] leading-4 text-ink-variant">
                  {filtered.length} of 86
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-body-sm text-ink-variant">
                  Sorted by: <span className="font-medium text-ink">AI Score Fast-Track Eligibility</span>
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-low text-ink hover:bg-surface-mid text-label-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                  <span>Sort</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left column: requisition cards */}
              <div className="lg:col-span-7 flex flex-col gap-3.5">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedId === job.id}
                    onSelect={() => setSelectedId(job.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-card px-6 py-12 text-center shadow-sm">
                    <span className="material-symbols-outlined text-[28px] text-ink-variant">search_off</span>
                    <p className="m-0 text-headline-sm text-ink">No matching requisitions</p>
                    <p className="m-0 text-body-sm text-ink-variant">
                      Adjust the search or filters to see more verified open roles.
                    </p>
                  </div>
                )}
                {/* Pagination & realtime status footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card rounded-xl shadow-sm mt-2">
                  <div className="flex items-center gap-2 text-body-sm text-ink-variant">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                    <span>
                      Showing 1-{filtered.length} of 86 verified open requisitions • Auto-updated live
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-surface-low text-ink-variant hover:text-ink text-label-sm disabled:opacity-50"
                      disabled
                    >
                      Previous
                    </button>
                    <button type="button" className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm">
                      1
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-surface-low text-ink hover:bg-surface-mid text-label-sm"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-surface-low text-ink hover:bg-surface-mid text-label-sm"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-surface-low text-ink hover:bg-surface-mid text-label-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              {/* Right column: sticky inspector */}
              <InspectorPane />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default PublicJobBoardPage;
