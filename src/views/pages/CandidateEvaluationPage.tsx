import React, { useState } from 'react';

// Static screen ported from the Stitch mockup "candidate_detail_full_evaluation_scorecard".
// Token mapping (mockup -> app tokens in tailwind.config.js):
//   surface-container-lowest -> card, surface-container-low -> surface-low,
//   surface-container -> surface-mid, surface-container-high -> surface-high,
//   on-surface -> ink, on-surface-variant -> ink-variant, outline -> outline-strong,
//   outline-variant -> outline, primary-fixed -> info.
// Mockup radii (lg=0.25rem, xl=0.5rem, DEFAULT=0.125rem) are written as arbitrary values.
// Mockup font-code-inline (JetBrains Mono 12px) -> font-mono text-label-sm.

const MONO = 'font-mono text-label-sm';

type Recommendation = 'strong_hire' | 'hire' | 'neutral' | 'no_hire';

const VOICE_BARS: Array<{ h: string; tone: 'primary' | 'container' | 'muted' }> = [
  { h: 'h-3', tone: 'primary' }, { h: 'h-5', tone: 'primary' }, { h: 'h-7', tone: 'primary' }, { h: 'h-4', tone: 'primary' },
  { h: 'h-2', tone: 'primary' }, { h: 'h-6', tone: 'primary' }, { h: 'h-8', tone: 'primary' }, { h: 'h-5', tone: 'primary' },
  { h: 'h-3', tone: 'primary' }, { h: 'h-4', tone: 'primary' }, { h: 'h-7', tone: 'container' }, { h: 'h-6', tone: 'container' },
  { h: 'h-8', tone: 'container' }, { h: 'h-4', tone: 'container' }, { h: 'h-2', tone: 'muted' }, { h: 'h-5', tone: 'muted' },
  { h: 'h-7', tone: 'muted' }, { h: 'h-3', tone: 'muted' }, { h: 'h-5', tone: 'primary' }, { h: 'h-8', tone: 'primary' },
  { h: 'h-6', tone: 'primary' }, { h: 'h-4', tone: 'primary' }, { h: 'h-3', tone: 'primary' }, { h: 'h-6', tone: 'primary' },
  { h: 'h-7', tone: 'primary' }, { h: 'h-5', tone: 'primary' }, { h: 'h-3', tone: 'muted' }, { h: 'h-6', tone: 'muted' },
  { h: 'h-4', tone: 'muted' }, { h: 'h-8', tone: 'primary' }, { h: 'h-7', tone: 'primary' }, { h: 'h-5', tone: 'primary' },
  { h: 'h-2', tone: 'primary' }, { h: 'h-4', tone: 'primary' }, { h: 'h-6', tone: 'primary' },
];

const BAR_TONE: Record<'primary' | 'container' | 'muted', string> = {
  primary: 'bg-primary',
  container: 'bg-primary-container',
  muted: 'bg-outline', // outline-variant
};

const MILESTONES = [
  { t: '04:12', label: 'High-throughput ingestion model' },
  { t: '18:45', label: 'Concurrency & race condition resolve' },
  { t: '32:10', label: 'Raft consensus & quorum trade-offs' },
];

// Star fill uses the Material Symbols variable font axis (mockup inline style -> arbitrary property).
const Stars: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center text-amber-500">
    {Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(score);
      const half = !filled && i === Math.floor(score) && score % 1 !== 0;
      const icon = half ? 'star_half' : 'star';
      const cls = filled
        ? "[font-variation-settings:'FILL'_1]"
        : `[font-variation-settings:'FILL'_0]${half ? '' : ' text-[#d2d9f4]'}`; // surface-dim, no token
      return (
        <span key={i} className={`material-symbols-outlined text-[18px] ${cls}`}>
          {icon}
        </span>
      );
    })}
    <span className="ml-1 text-headline-sm text-ink">{score.toFixed(1)}</span>
  </div>
);

const RubricChips: React.FC<{ checks?: boolean; items: string[] }> = ({ checks, items }) => (
  <div className="flex flex-wrap gap-1 pt-1">
    {items.map((chip) => (
      <span key={chip} className="inline-flex items-center rounded-[0.125rem] bg-card px-2 py-0.5 text-xs text-ink">
        {checks && <span className="material-symbols-outlined mr-1 text-[14px] text-emerald-600">check</span>}
        {chip}
      </span>
    ))}
  </div>
);

const CandidateEvaluationPage: React.FC = () => {
  const [recommendation, setRecommendation] = useState<Recommendation>('strong_hire');
  const [panelNotes, setPanelNotes] = useState('');
  const [nextStep, setNextStep] = useState('Advance to Official Offer Stage');
  const [scorecardSubmitted, setScorecardSubmitted] = useState(false);

  const RECOMMENDATION_OPTIONS: Array<{
    value: Recommendation; title: string; desc: string; icon: string;
    accentTitle: string; accentDesc: string; inputClass: string;
  }> = [
    {
      value: 'strong_hire', title: 'Strong Hire', desc: 'Clear bar-raiser for Platform Core', icon: 'verified',
      accentTitle: 'text-emerald-950', accentDesc: 'text-emerald-800', inputClass: 'text-emerald-600 focus:ring-emerald-500',
    },
    {
      value: 'hire', title: 'Hire', desc: 'Meets expectations across all competencies', icon: 'thumb_up',
      accentTitle: 'text-ink', accentDesc: 'text-ink-variant', inputClass: 'text-primary focus:ring-primary',
    },
    {
      value: 'neutral', title: 'Neutral / Hold', desc: 'Needs supplementary panel session', icon: 'pause_circle',
      accentTitle: 'text-ink', accentDesc: 'text-ink-variant', inputClass: 'text-amber-600 focus:ring-amber-500',
    },
    {
      value: 'no_hire', title: 'Do Not Hire', desc: 'Does not meet current team expectations', icon: 'thumb_down',
      accentTitle: 'text-ink', accentDesc: 'text-ink-variant', inputClass: 'text-error focus:ring-error',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Top Banner / Candidate Summary Bar */}
      <section className="relative w-full bg-card px-8 py-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            <div className="relative flex-shrink-0">
              <img
                alt="Alex Chen"
                className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4_C5Ja0gdW6nvGnGRInsEo1BuUqe9gg5nRq9vCeYyI2QkymtOmzWwRC_hH9tKpQBNDEA6X0Gc3eE71o-mlJD2Qslb85ZgfIteylL30hT69JC_oq_xa6xeDUQ7KQYkNUmBtf_rA-45_nKRCkv51MmBm5oa4mZw_CNxx3Z8JiJoFMZ0OWOSf1WMbtzRQgD58Qb3biR0uBIVPd8d3pLNKEXLbbSvLapmxH15w9oTeTBZ9UGED90692YT"
              />
              <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                <span className="material-symbols-outlined text-[10px] text-card">check</span>
              </span>
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="mb-1 flex flex-wrap items-center gap-1">
                <h1 className="m-0 tracking-tight text-headline-lg text-ink">Alex Chen</h1>
                <span className={`${MONO} rounded-[0.125rem] bg-surface-mid px-1 py-0.5 text-ink-variant`}>#CAND-8941</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Interview Completed
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  Pending Scorecard Submission
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-variant">
                <span className="font-medium text-ink">Senior Distributed Systems Engineer</span>
                <span className="text-outline-strong">•</span>
                <span>Platform Core Infrastructure</span>
                <span className="text-outline-strong">•</span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  Evaluated 2 hours ago
                </span>
              </div>
            </div>
          </div>
          {/* Overall Score Badge & Actions */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3 xl:w-auto xl:justify-end">
            <div className="flex items-center gap-3 rounded-[0.5rem] bg-surface-low px-3 py-1 shadow-sm">
              <div className="relative flex h-12 w-12 items-center justify-center">
                {/* Overall score ring (ported from mockup SVG) */}
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-primary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="88, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute text-headline-sm text-ink">88</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-label-sm uppercase tracking-wide text-primary">Overall Consensus</span>
                  <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
                </div>
                <span className="text-headline-sm text-ink">Strong Hire (Top 4%)</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="flex h-9 items-center gap-1.5 rounded-[0.25rem] bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid">
                <span className="material-symbols-outlined text-[17px] text-outline-strong">picture_as_pdf</span>
                <span>Export Dossier</span>
              </button>
              <button type="button" className="flex h-9 items-center gap-1.5 rounded-[0.25rem] bg-surface-low px-3 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid">
                <span className="material-symbols-outlined text-[17px] text-outline-strong">share</span>
                <span>Share Panel</span>
              </button>
              <button
                type="button"
                className={`flex h-9 items-center gap-2 rounded-[0.25rem] px-4 text-label-md shadow-sm transition-all ${
                  scorecardSubmitted ? 'bg-emerald-600 text-white' : 'bg-primary-container text-on-primary hover:bg-primary'
                }`}
                onClick={() => setScorecardSubmitted(true)}
              >
                {scorecardSubmitted ? (
                  <>
                    <span className="material-symbols-outlined text-[17px]">check_circle</span>
                    <span>Submitted &amp; Synced!</span>
                  </>
                ) : (
                  <>
                    <span>Submit Scorecard</span>
                    <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Structured Review Layout */}
      <div className="grid w-full grid-cols-1 items-start gap-6 p-8 lg:grid-cols-12">
        {/* Column 1 (Left) - Candidate Profile & Interview Assets */}
        <section className="flex flex-col gap-4 lg:col-span-4 xl:col-span-3">
          {/* Profile Metadata Card */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-outline-strong">Candidate Dossier</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-high px-2 py-0.5 text-xs text-ink-variant">
                Verified Identity
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: 'Experience', value: '6+ Years', sub: 'Ex-DoorDash (Staff)' },
                { label: 'Education', value: 'UC Berkeley', sub: "B.S. CS '18" },
                { label: 'Notice Period', value: '30 Days', sub: 'Available Oct 15' },
                { label: 'Target Comp', value: '$185k Base', sub: '+ Equity Target' },
              ].map((cell) => (
                <div key={cell.label} className="flex flex-col rounded-[0.25rem] bg-surface-low p-2">
                  <span className="text-label-sm text-outline-strong">{cell.label}</span>
                  <span className="text-headline-sm text-ink">{cell.value}</span>
                  <span className="truncate text-body-sm text-ink-variant">{cell.sub}</span>
                </div>
              ))}
            </div>
            {/* Links and CV Preview Trigger */}
            <div className="flex items-center gap-1 pt-1">
              <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-[0.25rem] bg-surface-mid px-2 py-2 text-label-md text-ink transition-colors hover:bg-surface-high">
                <span className="material-symbols-outlined text-[17px] text-primary">description</span>
                Preview Full CV (PDF)
              </button>
              <span className="cursor-pointer rounded-[0.25rem] bg-surface-mid p-2 text-ink-variant transition-colors hover:bg-surface-high hover:text-ink" title="GitHub Profile">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </span>
              <span className="cursor-pointer rounded-[0.25rem] bg-surface-mid p-2 text-ink-variant transition-colors hover:bg-surface-high hover:text-ink" title="LinkedIn Profile">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Session Recordings & Interactive Video Preview Card */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">videocam</span>
                <h2 className="m-0 text-headline-sm text-ink">Session Playback</h2>
              </div>
              <span className={`${MONO} text-outline-strong`}>00:46:18</span>
            </div>
            {/* Video Player Mockup with Image Placeholder */}
            <div className="group relative aspect-video w-full overflow-hidden rounded-[0.5rem] bg-surface-high shadow-inner">
              <img
                alt="Technical virtual system design interview recording"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzzJYnYeuEGaod1zNuXRHNeECq1fyuM2ywr3xGYgr8YABZ8lfW9ffA4oK1x2otsmgvP3Mnm09tOpophDQPvmUOrIDNyqazzeSLhWPV0D4EkMJo7SQGzwo5jXiVNOrdVzc2jLqi4t_souTZOkZkPaJZvziOe0RW7e8z23sojd4Rgraz7nZX2qTpJaCBV6QB4FXOepB4SzkE-HrRI8mXU_tDwoyGnN9XTpAc5mUH2FUFZVnnBihEA40N"
              />
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-[0.125rem] bg-black/60 px-2 py-0.5 font-mono text-xs text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> REC 1080p
                  </span>
                  <span className="rounded-[0.125rem] bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    AI Proctored Clean
                  </span>
                </div>
                <div className="flex items-center justify-between text-white">
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/30">
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined cursor-pointer text-[18px] opacity-80 hover:opacity-100">volume_up</span>
                    <span className="material-symbols-outlined cursor-pointer text-[18px] opacity-80 hover:opacity-100">fullscreen</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Audio Waveform Simulation & Speaker Breakdown */}
            <div className="flex flex-col gap-1 rounded-[0.25rem] bg-surface-low p-2">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-outline-strong">Voice Share Telemetry</span>
                <div className={`flex items-center gap-3 font-mono text-xs`}>
                  <span className="font-medium text-primary">Alex (64%)</span>
                  <span className="text-outline-strong">vs</span>
                  <span className="text-ink-variant">AI Host (36%)</span>
                </div>
              </div>
              {/* Waveform Simulation */}
              <div className="flex h-8 w-full items-center gap-[2px] overflow-hidden rounded-[0.125rem] bg-card px-1 py-1">
                {VOICE_BARS.map((bar, i) => (
                  <div key={i} className={`w-[3px] rounded-full ${bar.h} ${BAR_TONE[bar.tone]}`} />
                ))}
              </div>
            </div>
            {/* Timestamped Key Highlights */}
            <div className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-outline-strong">Key Milestones</span>
              {MILESTONES.map((m) => (
                <button key={m.t} type="button" className="group flex w-full items-center justify-between rounded-[0.25rem] p-1 text-left transition-colors hover:bg-surface-mid">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className={`${MONO} rounded-[0.125rem] bg-surface-mid px-1.5 py-0.5 font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary`}>{m.t}</span>
                    <span className="truncate text-body-sm text-ink">{m.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline-strong opacity-0 transition-opacity group-hover:opacity-100">play_circle</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Column 2 (Center) - Interactive Scoring Rubric */}
        <section className="flex flex-col gap-4 lg:col-span-8 xl:col-span-5">
          <div className="flex flex-col gap-6 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="m-0 text-headline-md text-ink">Interactive Scoring Rubric</h2>
                <p className="m-0 text-body-sm text-ink-variant">Calibrate human mentor ratings against AI telemetry baselines.</p>
              </div>
              <div className="flex items-center gap-1.5 self-start rounded-full bg-surface-mid px-2 py-1 text-label-sm text-ink-variant sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                4 of 4 Rated
              </div>
            </div>

            {/* Category 1 */}
            <div className="flex flex-col gap-2 rounded-[0.5rem] bg-surface-low p-3 transition-all hover:shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.25rem] bg-primary/10 text-xs font-semibold text-primary">01</div>
                  <span className="text-headline-sm text-ink">Algorithms &amp; Coding Execution</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${MONO} rounded-[0.125rem] bg-info/50 px-2 py-0.5 text-primary`}>AI: 92/100</span>
                  <Stars score={5} />
                </div>
              </div>
              <RubricChips checks items={['Optimal O(N log K) Time', 'Zero Memory Leaks', 'Idempotent Logic']} />
              {/* Criteria Slider */}
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-xs text-ink-variant">
                  <span>Execution Completeness</span>
                  <span className="font-mono text-primary">96% Accuracy</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
                  <div className="h-full w-[96%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            {/* Category 2 */}
            <div className="flex flex-col gap-2 rounded-[0.5rem] bg-surface-low p-3 transition-all hover:shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.25rem] bg-primary/10 text-xs font-semibold text-primary">02</div>
                  <span className="text-headline-sm text-ink">System Architecture &amp; Scalability</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${MONO} rounded-[0.125rem] bg-info/50 px-2 py-0.5 text-primary`}>AI: 85/100</span>
                  <Stars score={4.5} />
                </div>
              </div>
              <RubricChips items={['Partitioning & Sharding', 'Cache Invalidation (Two-Phase)', 'Fault Tolerance (Raft Leader Election)']} />
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-xs text-ink-variant">
                  <span>Sharding &amp; Failover Depth</span>
                  <span className="font-mono text-primary">88% Depth</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
                  <div className="h-full w-[88%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            {/* Category 3 */}
            <div className="flex flex-col gap-2 rounded-[0.5rem] bg-surface-low p-3 transition-all hover:shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.25rem] bg-primary/10 text-xs font-semibold text-primary">03</div>
                  <span className="text-headline-sm text-ink">Communication &amp; Problem Framing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${MONO} rounded-[0.125rem] bg-info/50 px-2 py-0.5 text-primary`}>AI: 90/100</span>
                  <Stars score={4.5} />
                </div>
              </div>
              <RubricChips items={['Active Trade-off Analysis', 'Requirements Disambiguation']} />
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-xs text-ink-variant">
                  <span>Verbal Articulation &amp; Conciseness</span>
                  <span className="font-mono text-primary">91% Index</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
                  <div className="h-full w-[91%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            {/* Category 4 */}
            <div className="flex flex-col gap-2 rounded-[0.5rem] bg-surface-low p-3 transition-all hover:shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.25rem] bg-primary/10 text-xs font-semibold text-primary">04</div>
                  <span className="text-headline-sm text-ink">Culture &amp; Operational Mindset</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${MONO} rounded-[0.125rem] bg-surface-mid px-2 py-0.5 text-outline-strong`}>Mentor Only</span>
                  <Stars score={4} />
                </div>
              </div>
              <RubricChips items={['Incident Post-mortem Leadership', 'On-Call Escalation Maturity']} />
            </div>

            {/* Written Interviewer Synthesis & Structured Feedback */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-headline-sm text-ink" htmlFor="panelNotes">Interviewer Qualitative Synthesis</label>
                <div className="flex items-center gap-1 text-xs text-outline-strong">
                  <span className="material-symbols-outlined text-[14px]">markdown</span> Markdown Supported
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-2 rounded-[0.5rem] bg-surface-low p-3">
                  <div className="flex items-center justify-between border-b border-surface-high pb-2 text-xs text-ink-variant">
                    <span className="font-semibold uppercase tracking-wider text-outline-strong">Sections Breakdown</span>
                    <span className="cursor-pointer text-primary hover:underline">Apply Standard Rubric Template</span>
                  </div>
                  <div>
                    <span className="text-label-sm font-semibold text-ink">### Key Strengths</span>
                    <p className="m-0 mt-0.5 text-body-sm text-ink-variant">
                      - Exceptional intuition for distributed consistency; quickly recognized the bottleneck in Raft
                      leader election under network partitions.<br />
                      - Clean, modern Go implementation. Flawlessly handled channel deadlocks on the fly with
                      idiomatic context timeouts.
                    </p>
                  </div>
                  <div>
                    <span className="text-label-sm font-semibold text-ink">### Growth Areas</span>
                    <p className="m-0 mt-0.5 text-body-sm text-ink-variant">
                      - Initial estimation of cold-storage cost implications was slightly high, but corrected
                      immediately when prompted with AWS S3 Glacier storage tier comparisons.
                    </p>
                  </div>
                  <div>
                    <span className="text-label-sm font-semibold text-ink">### Decision Justification</span>
                    <p className="m-0 mt-0.5 text-body-sm text-ink-variant">
                      Alex operates solidly at the L5 senior boundary. Demonstrates technical self-sufficiency and
                      high architectural clarity. Recommending immediate offer approval.
                    </p>
                  </div>
                </div>
                {/* Notes entry area */}
                <textarea
                  className="w-full rounded-[0.5rem] bg-card p-3 text-body-sm text-ink shadow-sm transition-all placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
                  id="panelNotes"
                  placeholder="Add personal notes or append supplemental observations for the calibration committee..."
                  rows={3}
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Column 3 (Right) - Hiring Consensus & Recommendation Panel */}
        <section className="flex flex-col gap-4 lg:col-span-12 xl:col-span-4">
          {/* Final Recommendation Decision Form */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-headline-sm text-ink">Your Recommendation</h2>
              <span className="text-label-sm font-medium text-primary">Recorded Live</span>
            </div>
            {/* Decision Radio Buttons */}
            <div className="grid grid-cols-1 gap-1">
              {RECOMMENDATION_OPTIONS.map((opt) => {
                const selected = recommendation === opt.value;
                const shell = !selected
                  ? 'bg-surface-low hover:bg-surface-mid'
                  : opt.value === 'strong_hire'
                    ? 'bg-emerald-50/80 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-surface-high shadow-sm ring-1 ring-primary/40';
                return (
                  <label key={opt.value} className={`flex cursor-pointer items-center justify-between rounded-[0.5rem] p-3 transition-all ${shell}`}>
                    <div className="flex items-center gap-2">
                      <input
                        checked={selected}
                        className={`h-4 w-4 ${opt.inputClass}`}
                        name="recommendation"
                        type="radio"
                        value={opt.value}
                        onChange={() => setRecommendation(opt.value)}
                      />
                      <div className="flex flex-col">
                        <span className={`text-headline-sm ${opt.accentTitle} ${opt.value === 'strong_hire' && selected ? 'font-bold' : ''}`}>{opt.title}</span>
                        <span className={`text-body-sm ${selected ? opt.accentDesc : 'text-ink-variant'}`}>{opt.desc}</span>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] ${opt.value === 'strong_hire' && selected ? 'text-emerald-600' : 'text-outline-strong'}`}>{opt.icon}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Team Calibrations & Peer Votes Card */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-headline-sm text-ink">Hiring Panel Calibration</h2>
              <span className="text-label-sm text-outline-strong">3 of 3 Submitted</span>
            </div>
            <div className="flex flex-col gap-2">
              {/* Sarah Jenkins */}
              <div className="flex items-center justify-between rounded-[0.25rem] bg-surface-low p-2">
                <div className="flex items-center gap-2">
                  <img
                    alt="Sarah Jenkins"
                    className="h-9 w-9 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAATQY_GbQZ9oJq51JJcZ1O4R8-BLks_gawYazR8n0tTU8nTpAQjiV3Y8Y33w0M9_hH4ZmNvG9aNn8fDu0RrM81TXDw_3WpIIU6QVX3WRHWVJ2CBGtx0ZKvRbhLUbewcZ1_gYgnuOyh95yZ5UT2nhoTx4ts3-dw0kbZSiLkTZmaKblYp0rlYRPQ-B4l4vRcZ6LpVOVMd9s5iGywYfY-OnHa_gNCpH2O7viohl8DK0Jr2JO_52TqmEpv"
                  />
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">Sarah Jenkins</span>
                    <span className="text-label-sm text-ink-variant">Staff SWE • Tech Lead</span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Strong Hire</span>
              </div>
              {/* Marcus Vance */}
              <div className="flex items-center justify-between rounded-[0.25rem] bg-surface-low p-2">
                <div className="flex items-center gap-2">
                  <img
                    alt="Marcus Vance"
                    className="h-9 w-9 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQoC_OsR9aj862ckwCIVf8S-NCjp2Qkjco8FVie2f16-S1cBRAls6rNbzfPo7IurBCLUYBVq9MRJgH-_SWlpaOe80RdkwLD1yW_somltnSKCgQRP-38yrRvKRZHPYHhVQJRPpZkjZGPLLuuF2whpG2KZm3QxiWu-NGtSfKBLaLK22GWiXtQthQmqgjNnbxx6buUbw8z3Ay3i4tBuih2KA5ggPXibG9_MNveo5EGTdYQGJSx0BuhUCw"
                  />
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">Marcus Vance</span>
                    <span className="text-label-sm text-ink-variant">Eng Manager • Platform</span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Strong Hire</span>
              </div>
              {/* AI Synthetic Rubric */}
              <div className="flex items-center justify-between rounded-[0.25rem] bg-info/30 p-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                    <span className="material-symbols-outlined text-[18px]">neurology</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">InterviewAI Engine</span>
                    <span className="text-label-sm text-primary">Predictive Model v4.2</span>
                  </div>
                </div>
                <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-semibold text-on-primary">Recommend Hire (Top 6%)</span>
              </div>
            </div>
          </div>

          {/* Offer Guidance & Next Action Panel */}
          <div className="flex flex-col gap-3 rounded-[0.5rem] bg-card p-4 shadow-sm">
            <h2 className="m-0 text-headline-sm text-ink">Offer &amp; Leveling Guidance</h2>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Target Level', value: 'L5 (Senior Distributed)', valueClass: 'text-primary font-bold' },
                { label: 'Suggested Base', value: '$180k – $190k', valueClass: 'text-ink font-bold' },
                { label: 'Stock Option Grant', value: '$90,000 / 4 yrs', valueClass: 'text-ink font-semibold' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-[0.25rem] bg-surface-low p-2">
                  <span className="text-label-md text-ink-variant">{row.label}</span>
                  <span className={`text-headline-sm ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <label className="text-label-sm font-semibold uppercase tracking-wider text-outline-strong" htmlFor="nextStep">Next Step Action Trigger</label>
              <div className="relative">
                <select
                  className="h-10 w-full cursor-pointer appearance-none rounded-[0.25rem] bg-surface-mid px-2 pr-8 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  id="nextStep"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                >
                  <option>Advance to Official Offer Stage</option>
                  <option>Request Additional System Design Round</option>
                  <option>Hold for Batch Committee Review</option>
                  <option>Issue Polite Rejection Letter</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[20px] text-outline-strong">expand_more</span>
              </div>
            </div>
            <button type="button" className="flex w-full items-center justify-center gap-2 rounded-[0.25rem] bg-ink px-3 py-2.5 text-label-md text-card shadow-sm transition-all hover:bg-slate-800">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              Lock &amp; Route to Compensation Board
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CandidateEvaluationPage;
