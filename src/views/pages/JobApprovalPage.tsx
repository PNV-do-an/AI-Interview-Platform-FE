import React, { useState } from 'react';

// Static screen ported from the Stitch mockup "admin_job_approval_moderation_review".
// Token mapping used throughout (mockup -> app tokens in tailwind.config.js):
//   surface-container-lowest -> card, surface-container-low -> surface-low,
//   surface-container -> surface-mid, surface-container-high -> surface-high,
//   on-surface -> ink, on-surface-variant -> ink-variant, outline -> outline-strong,
//   outline-variant -> outline, primary-fixed -> info, #ECFDF5/#065F46 -> success-bg/-text,
//   error-container/on-error-container -> danger/danger-text.
// Mockup radii (lg=0.25rem, xl=0.5rem, DEFAULT=0.125rem) differ from Tailwind defaults,
// so they are written as arbitrary values to stay pixel-faithful.
// Mockup font-code-inline (JetBrains Mono 12px) -> font-mono text-label-sm.

const MONO = 'font-mono text-label-sm';

type Decision = 'approve' | 'changes' | 'reject';
type Toast = { tone: 'success' | 'danger'; message: string } | null;

const RUBRIC_CHIPS = [
  'High Concurrency & Thread Safety (Weight: 35%)',
  'Fault Tolerance & Partitioning (Weight: 35%)',
  'Raft Consensus & Vector Clocks (Weight: 30%)',
];

const WAVE_BARS: Array<{ h: string; filled: boolean }> = [
  { h: 'h-3', filled: true }, { h: 'h-5', filled: true }, { h: 'h-2', filled: true }, { h: 'h-6', filled: true },
  { h: 'h-4', filled: true }, { h: 'h-5', filled: true }, { h: 'h-3', filled: true }, { h: 'h-6', filled: true },
  { h: 'h-2', filled: false }, { h: 'h-4', filled: false }, { h: 'h-3', filled: false }, { h: 'h-1', filled: false },
];

const SCAN_ITEMS = [
  {
    icon: 'check_circle',
    title: 'Equal Opportunity & Anti-Bias',
    result: 'PASSED',
    detail: 'Zero exclusionary language, ageist terminology, or gendered phrasing detected across 1,124 tokens.',
  },
  {
    icon: 'check_circle',
    title: 'Salary Benchmarking Scan',
    result: 'PASSED',
    detail: '$165k-$210k lands precisely in the 88th percentile for US-based Senior Distributed Systems roles. No predatory wage floor.',
  },
  {
    icon: 'check_circle',
    title: 'Spam & Scammer Prevention Filter',
    result: 'PASSED',
    detail: 'Domain cloudscale.io established 6+ years. Valid SSL, DNS SPF/DKIM validated. No outbound redirect traps.',
  },
];

const RESPONSIBILITIES = [
  'Design, deploy, and benchmark distributed consensus protocols (Raft/Paxos variants) across geographically dispersed data centers.',
  'Optimize zero-copy IPC and network pipelines utilizing eBPF and kernel bypass architectures.',
  'Implement deterministic Jepsen and chaos testing frameworks to audit replication integrity during partition scenarios.',
  'Mentor senior staff engineers and define company-wide SLA metrics for storage durability and tail latency (<5ms p99).',
];

const TIMELINE = [
  { dot: 'bg-primary', title: 'Job Submitted by Sarah Jenkins', meta: 'Today at 10:24 AM • via Employer Portal' },
  { dot: 'bg-[#065f46]', title: 'Automated AI Compliance Engine Executed', meta: 'Today at 10:25 AM • Scored 4/4 Passed' }, // success-text, no bg token
  { dot: 'bg-outline', title: 'Assigned to Admin Reviewer Queue', meta: 'Today at 10:26 AM • Assigned to Sarah J.' },
];

const DECISION_OPTIONS: Array<{ value: Decision; title: string; desc: string; danger?: boolean }> = [
  { value: 'approve', title: 'Approve & Publish to Public Board', desc: 'Listings become discoverable immediately across candidate search channels.' },
  { value: 'changes', title: 'Request Employer Revision', desc: 'Return to CloudScale Systems draft queue with feedback notes.' },
  { value: 'reject', title: 'Reject with Reason', desc: 'Permanent dismissal for policy violations or spam classification.', danger: true },
];

const INITIAL_NOTES =
  'Complies with all technical screening guidelines. Compensation and rubric configurations are verified against Silicon Valley and remote tech market bands.';

const APPEND_CHIPS = ['Salary transparent', 'Requirements well-defined', 'Approved by Admin #04'];

const JobApprovalPage: React.FC = () => {
  const [decision, setDecision] = useState<Decision>('approve');
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [channels, setChannels] = useState([true, true, true]);
  const [toast, setToast] = useState<Toast>(null);

  const appendNote = (tag: string) =>
    setNotes((cur) => (cur.trim().length > 0 ? `${cur}\n[Audit Note: ${tag}]` : `[Audit Note: ${tag}]`));

  const approveAndPublish = () => {
    setDecision('approve');
    setToast({ tone: 'success', message: 'Success! Job listing #JOB-REQ-2025-8891 is now LIVE on public channels.' });
  };

  const rejectListing = () => {
    setDecision('reject');
    setToast({ tone: 'danger', message: 'Posting #JOB-REQ-2025-8891 marked for rejection. Notice dispatched to employer.' });
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-4">
      {/* Breadcrumb & Status Navigation Header */}
      <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-1 text-label-sm text-outline-strong`}>
            <span className="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[15px]">shield_person</span>
              Admin Console
            </span>
            <span>/</span>
            <span className="cursor-pointer transition-colors hover:text-primary">Job Moderation Queue</span>
            <span>/</span>
            <span className={`${MONO} rounded-[0.125rem] bg-surface-mid px-1 py-0.5 text-ink`}>#JOB-REQ-2025-8891</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="m-0 text-headline-lg text-ink">Senior Distributed Systems Engineer</h1>
            {/* Pending pill: #d97706 dot has no token */}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fffbeb] px-2 py-0.5 text-label-sm text-[#92400e]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d97706]" />
              Pending Review • Submitted 2 hours ago
            </span>
          </div>
        </div>
        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="flex items-center gap-1 rounded-[0.25rem] bg-surface-low px-3 py-1.5 text-label-md text-ink transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Queue
          </button>
          <button type="button" className="flex items-center gap-1 rounded-[0.25rem] bg-surface-low px-3 py-1.5 text-label-md text-ink transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[16px] text-outline-strong">policy</span>
            Flag Compliance
          </button>
          <button type="button" onClick={() => setDecision('changes')} className="flex items-center gap-1 rounded-[0.25rem] bg-surface-low px-3 py-1.5 text-label-md text-ink transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[16px] text-outline-strong">edit_note</span>
            Request Changes
          </button>
          <button type="button" onClick={approveAndPublish} className="flex items-center gap-1.5 rounded-[0.25rem] bg-primary px-4 py-1.5 text-label-md text-on-primary shadow-sm transition-all hover:bg-primary/90">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Approve &amp; Publish Listing →
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout: 8 cols left deep audit, 4 cols right verification panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Deep Job Posting Audit (8-col) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Organization & Trust Dossier */}
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-[0.5rem] bg-card p-6 shadow-sm">
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 -translate-y-8 translate-x-8 rounded-full bg-primary/5 blur-2xl" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[0.5rem] bg-surface-mid p-1 text-headline-md font-bold text-primary shadow-sm">
                  CS
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-headline-sm text-ink">CloudScale Systems Inc.</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-label-sm text-success-text">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Verified Employer
                    </span>
                    <span className="rounded-[0.125rem] bg-surface-high px-2 py-0.5 text-label-sm text-ink-variant">Enterprise Partner</span>
                  </div>
                  <span className="mt-0.5 text-body-sm text-outline-strong">SaaS Infrastructure &amp; Edge Compute • San Francisco, CA (Hybrid / Remote)</span>
                </div>
              </div>
              {/* Trust Metrics Pill */}
              <div className="flex items-center gap-3 rounded-[0.5rem] bg-surface-low px-3 py-2">
                <div className="flex flex-col text-right">
                  <span className="text-label-sm text-outline-strong">Employer Trust Score</span>
                  <span className="text-headline-sm text-primary">98% Validated</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-primary">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
              </div>
            </div>
            {/* Representative & Entity Meta Strip */}
            <div className="grid grid-cols-1 gap-3 rounded-[0.25rem] bg-surface-low/50 p-3 pt-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <img
                  alt="Sarah Jenkins"
                  className="h-8 w-8 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVqpcMQhSOmp80wmlGpAV_souLbDCoEAf2FGd3HaSnLc-r4Wd0dItPHUS7yOO-3tfc9IvLj-AZzOkpI8wqjFMPlk-8ihUhJ417qoKTEWqOEbOs2EEc9GsLw8_ZWr5EY2FN5Xz9HVZ3I6tXhMTvX9QYMZqPn0yle130FpQDogncz48h0F2BeWR1ydcGiC26hL6WEZZl8F7qqOSxt7SgjkdVEqGelOPtzizQbyEiMnWuQ18_6K908j6R"
                />
                <div className="flex flex-col">
                  <span className="text-label-sm text-ink">Sarah Jenkins</span>
                  <span className={`${MONO} truncate text-outline-strong`}>@cloudscale.io</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-outline-strong">flag</span>
                <div className="flex flex-col">
                  <span className="text-label-sm text-ink">Incident History</span>
                  <span className="text-body-sm font-medium text-success-text">0 Flagged Reports</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-outline-strong">credit_card</span>
                <div className="flex flex-col">
                  <span className="text-label-sm text-ink">Billing Record</span>
                  <span className="text-body-sm text-ink-variant">Active Stripe • Tier A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Position Compensation & Compliance Ribbon */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.25rem] bg-surface-high text-primary">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm uppercase tracking-wider text-outline-strong">Verified Total Compensation</span>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-metric-stat text-ink">$165,000 – $210,000</span>
                  <span className="text-body-sm text-outline-strong">/ year</span>
                  <span className="ml-2 text-label-md text-ink-variant">+ Equity (0.05% - 0.15%)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-[0.25rem] bg-success-bg px-3 py-2 text-success-text">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-label-sm">Complies with CA &amp; NY Pay Transparency Laws</span>
            </div>
          </div>

          {/* Configured AI Screening Protocol Dossier */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 animate-ping rounded-full bg-primary" />
                <h2 className="m-0 text-headline-md text-ink">Configured AI Interview Protocol</h2>
              </div>
              <span className={`rounded-full bg-surface-mid px-2 py-0.5 ${MONO} text-primary`}>Engine: Aria-v4-Distributed</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                <span className="text-label-sm text-outline-strong">Synthesizer &amp; Mode</span>
                <span className="text-body-md font-semibold text-ink">Aria Voice + Code Sandbox</span>
                <span className={`mt-1 ${MONO} text-ink-variant`}>Python / Go / Rust Sandbox</span>
              </div>
              <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                <span className="text-label-sm text-outline-strong">Target Assessment Duration</span>
                <span className="text-body-md font-semibold text-ink">45 Minutes Dynamic</span>
                <span className="mt-1 text-body-sm text-outline-strong">4 Problem Sets + Code Execution</span>
              </div>
              <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                <span className="text-label-sm text-outline-strong">AI Pass Threshold</span>
                <span className="text-body-md font-semibold text-primary">80% Benchmark Score</span>
                <span className="mt-1 text-body-sm text-outline-strong">Top 20th Percentile Candidate Cutoff</span>
              </div>
            </div>
            {/* Active Rubric Chips */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-label-sm uppercase text-outline-strong">Active Evaluation Rubrics</span>
              <div className="flex flex-wrap gap-1">
                {RUBRIC_CHIPS.map((chip) => (
                  <div key={chip} className="flex items-center gap-1.5 rounded-[0.125rem] bg-surface-mid px-3 py-1 text-label-md text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {chip}
                  </div>
                ))}
              </div>
            </div>
            {/* Interactive Latency & Voice Audio Simulation Waveform */}
            <div className="flex items-center justify-between gap-3 rounded-[0.25rem] bg-surface-mid p-3">
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary transition-all hover:bg-primary/90">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-label-sm text-ink">Voice Probe Calibration Sample</span>
                  <span className={`${MONO} text-outline-strong`}>Latency: 280ms • Bitrate: 48kHz</span>
                </div>
              </div>
              {/* Simulated Waveform */}
              <div className="flex h-6 items-center gap-0.5">
                {WAVE_BARS.map((bar, i) => (
                  <span key={i} className={`w-1 rounded-full ${bar.h} ${bar.filled ? 'bg-primary' : 'bg-outline'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Full Job Description & Scope Inspection */}
          <div className="flex flex-col gap-4 rounded-[0.5rem] bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between rounded-[0.25rem] bg-surface-low px-3 py-1">
              <span className="text-label-sm uppercase text-outline-strong">Posting Content Inspection</span>
              <div className="flex items-center gap-3">
                <span className={`${MONO} text-outline-strong`}>Parsed 1,124 words • Markdown OK</span>
                <button type="button" className="text-label-sm text-primary hover:underline">View Raw JSON</button>
              </div>
            </div>
            {/* Role Scope & Context */}
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-headline-sm text-ink">Role Overview &amp; Infrastructure Context</h3>
              <p className="m-0 text-body-md leading-relaxed text-ink-variant">
                CloudScale Systems is seeking a Senior Distributed Systems Engineer to scale our globally replicated
                transactional storage layer. You will architect and maintain high-throughput, low-latency micro-clusters
                executing millions of synchronous queries per second with multi-region consistency guarantees.
              </p>
            </div>
            {/* Responsibilities */}
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-headline-sm text-ink">Key Responsibilities</h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {RESPONSIBILITIES.map((line) => (
                  <li key={line} className="flex items-start gap-1 text-body-md text-ink-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">check_circle</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Technical Requirements */}
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-headline-sm text-ink">Candidate Prerequisites &amp; Technical Stacks</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                  <span className="text-label-sm text-primary">Required Experience</span>
                  <p className="m-0 text-body-sm text-ink-variant">
                    6+ years building carrier-grade backend infrastructure in Rust, Go, or C++ with demonstrable
                    knowledge of lock-free memory constructs.
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                  <span className="text-label-sm text-primary">Consensus &amp; Storage</span>
                  <p className="m-0 text-body-sm text-ink-variant">
                    Deep operational exposure to LSM-tree databases (RocksDB), KV engines, distributed logs
                    (Kafka/Redpanda), and Raft state machines.
                  </p>
                </div>
              </div>
            </div>
            {/* Benefits & Remote Setup */}
            <div className="flex items-center justify-between rounded-[0.25rem] bg-surface-low p-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">beach_access</span>
                <div className="flex flex-col">
                  <span className="text-label-sm text-ink">Comprehensive Benefits Package</span>
                  <span className="text-body-sm text-outline-strong">Comprehensive Medical, Unlimited PTO, 401(k) Match, Home Office Stipend</span>
                </div>
              </div>
              <span className={`rounded-[0.125rem] bg-success-bg px-1 py-0.5 ${MONO} text-success-text`}>Standard Tech Package</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Automated Moderation Checks & Admin Decision Console (4-col) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Automated Moderation & Compliance Radar Card */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
                <h2 className="m-0 text-headline-sm text-ink">Automated AI Compliance Scan</h2>
              </div>
              <span className="rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-semibold text-success-text">ALL CLEAR (4/4)</span>
            </div>
            {SCAN_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-label-md text-ink">
                    <span className="material-symbols-outlined text-[16px] text-success-text">{item.icon}</span>
                    {item.title}
                  </span>
                  <span className={`rounded-[0.125rem] bg-success-bg px-1.5 py-0.5 ${MONO} text-success-text`}>{item.result}</span>
                </div>
                <p className="m-0 mt-1 text-body-sm text-ink-variant">{item.detail}</p>
              </div>
            ))}
            {/* Scan Item 4 & Authenticity Meter */}
            <div className="flex flex-col gap-2 rounded-[0.25rem] bg-surface-low p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-label-md text-ink">
                  <span className="material-symbols-outlined text-[16px] text-success-text">verified</span>
                  Role Authenticity Index
                </span>
                <span className="text-headline-sm font-bold text-primary">100% Genuine</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-high">
                <div className="h-full w-full rounded-full bg-primary" />
              </div>
              <span className="text-label-sm text-outline-strong">Verified engineering hiring manager credentials match LinkedIn Graph.</span>
            </div>
          </div>

          {/* Moderation Decision Console Panel */}
          <div className="flex flex-col gap-4 rounded-[0.5rem] bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-headline-sm text-ink">Moderator Final Determination</h2>
              <span className={`${MONO} text-outline-strong`}>Session #ADMIN-882</span>
            </div>
            {/* Decision Segment Options */}
            <div className="flex flex-col gap-1">
              {DECISION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-[0.25rem] p-3 transition-colors ${
                    decision === opt.value ? 'bg-surface-mid' : 'bg-surface-low hover:bg-surface-high'
                  }`}
                >
                  <input
                    checked={decision === opt.value}
                    className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                    name="moderation_decision"
                    type="radio"
                    value={opt.value}
                    onChange={() => setDecision(opt.value)}
                  />
                  <div className="flex flex-col">
                    <span className={`text-label-md font-semibold ${opt.danger ? 'text-error' : 'text-ink'}`}>{opt.title}</span>
                    <span className="text-body-sm text-outline-strong">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {/* Feedback & Moderator Notes Field */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-label-sm font-semibold text-ink" htmlFor="moderatorNotes">Internal Reviewer Notes &amp; Audit Log</label>
                <span className="text-label-sm text-outline-strong">Visible to admins</span>
              </div>
              <textarea
                className="w-full resize-none rounded-[0.25rem] bg-surface-low p-3 text-body-sm text-ink transition-all placeholder:text-outline-strong focus:bg-surface-mid focus:outline-none"
                id="moderatorNotes"
                placeholder="Add specific approval or rejection notes here..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {/* Quick Append Chips */}
              <div className="mt-1 flex flex-wrap gap-1">
                {APPEND_CHIPS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-[0.125rem] bg-surface-mid px-2 py-0.5 text-label-sm text-ink-variant transition-colors hover:bg-surface-high hover:text-ink"
                    onClick={() => appendNote(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            {/* Target Distribution Channels Checkboxes */}
            <div className="flex flex-col gap-1">
              <span className="text-label-sm uppercase text-outline-strong">Target Distribution Networks</span>
              <div className="flex flex-col gap-2 pt-1">
                {['Public Job Board (Global Directory)', 'University Partner Network (Top Tier CS Grads)', 'AI Candidate Recommendation & Talent Engine'].map((label, i) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={channels[i]}
                      className="h-4 w-4 cursor-pointer rounded accent-primary"
                      type="checkbox"
                      onChange={() => setChannels((cur) => cur.map((v, j) => (j === i ? !v : v)))}
                    />
                    <span className="text-body-sm text-ink">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Final Confirmation Action Buttons */}
            <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row">
              <button type="button" className="flex w-full items-center justify-center gap-1 rounded-[0.25rem] bg-danger px-3 py-2.5 text-label-md text-danger-text transition-all hover:bg-error/20 sm:w-auto" onClick={rejectListing}>
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Reject Listing
              </button>
              <button type="button" className="flex w-full flex-1 items-center justify-center gap-2 rounded-[0.25rem] bg-primary py-2.5 text-label-md text-on-primary shadow transition-all hover:bg-primary/90 sm:w-auto" onClick={approveAndPublish}>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Confirm &amp; Publish Now
              </button>
            </div>
            {/* Toast Notification (local state only) */}
            {toast && (
              <div
                className={`flex items-center gap-2 rounded-[0.25rem] p-3 text-label-sm ${
                  toast.tone === 'success' ? 'bg-success-bg text-success-text' : 'bg-danger text-danger-text'
                }`}
                role="status"
              >
                {toast.message}
              </div>
            )}
          </div>

          {/* Activity History & Audit Log Summary */}
          <div className="flex flex-col gap-2 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase text-outline-strong">Submission Timeline</span>
              <span className="material-symbols-outlined text-[16px] text-outline-strong">history</span>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {TIMELINE.map((evt) => (
                <div key={evt.title} className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${evt.dot}`} />
                  <div className="flex flex-col">
                    <span className="font-medium text-ink">{evt.title}</span>
                    <span className="text-label-sm text-outline-strong">{evt.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApprovalPage;
