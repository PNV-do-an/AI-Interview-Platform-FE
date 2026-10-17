import React, { useState } from 'react';
import { Badge } from '../components/ui';

/**
 * Static screen ported from Stitch mockups:
 *   ai_interview_engine_rubric_studio_1 + ai_interview_engine_rubric_studio_2
 * Both states of the same studio are merged into ONE page:
 *  - the mockup's own editor tabs are reused as the state switch (6 tabs = 3 prompts of state 1 + 3 of state 2);
 *  - duplicated blocks (persona selector, guardrails, rubric weights, cutoffs, playground modal) are kept once
 *    from the richer state; unique blocks (domain anchors, sandbox env, donut visual, waveform, feedback preview) all ship.
 *
 * Token mapping (mockup -> frontend/tailwind.config.js "Precision Intelligence"):
 *  surface-container-lowest->card, low->surface-low, container->surface-mid, high->surface-high,
 *  on-surface->ink, on-surface-variant->ink-variant, outline(#777587)->outline-strong, outline-variant(#c7c4d8)->outline,
 *  font-code-inline/text-code-inline -> font-mono text-[12px].
 * Mockup colors with no token (kept as hex literals):
 *  tertiary #313ba4, secondary-container #6063ee, tertiary-container #4a55be, surface-container-highest #dae2fd.
 * primary-fixed #e2dfff equals the `info` token -> bg-info.
 */

const CARD = 'flex flex-col gap-3 rounded-lg border border-surface-mid bg-card p-4 shadow-sm';

const SectionTitle: React.FC<{ icon: string; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1">
      <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      <h2 className="m-0 text-headline-sm text-ink">{title}</h2>
    </div>
    {right}
  </div>
);

// ---- prompt editor content (both studio states) ----------------------------

const H: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-[#313ba4]">{children}</span>; // mockup text-tertiary
const K: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-medium text-secondary">{children}</span>;
const V: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="rounded bg-surface-high px-1 text-ink">{children}</span>;
const PR: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-medium text-primary">{children}</span>;
const IND = 'pl-6';

interface PromptTabDef {
  id: string;
  label: string;
  lines: React.ReactNode[];
}

const PROMPT_TABS: PromptTabDef[] = [
  {
    id: 'directive',
    label: 'System Prompt & Persona',
    lines: [
      <H># SYSTEM PROMPT: TECHNICAL INTERVIEW AGENT (ARIA)</H>,
      <><K>ROLE</K>: Principal Technical Interviewer evaluating candidate <V>{'{candidate_name}'}</V> for <V>{'{role_level}'}</V>.</>,
      <><K>DOMAINS</K>: High-throughput architecture, distributed concurrency, data partitioning.</>,
      '',
      <H>## 1. INTERVIEW OPENING &amp; PROBLEM FRAMING</H>,
      '- Welcome the candidate cordially, introduce yourself as Aria, and frame the 45-minute technical inquiry.',
      '- Present the core architecture prompt: "Design an globally consistent idempotency coordinator for a distributed payments platform handling 50k transactions/sec across multi-region clusters."',
      '',
      <H>## 2. SOCRATIC PROBING &amp; TRADE-OFF EVALUATION</H>,
      '- Probe deeply on data tier decisions: CAP theorem trade-offs (CP vs AP), partition isolation, and latency profiles.',
      '- If the candidate proposes single Redis lock: ask about TTL expirations during prolonged GC pauses or network partitions.',
      '- Prompt the candidate to compare Two-Phase Commit (2PC), Saga patterns, and Raft consensus for state reconciliation.',
      '- Assess how failure modes are mitigated: circuit breaking, token buckets, and jittered backoffs.',
      '',
      <H>## 3. GUARDRAILS &amp; CONCLUSION</H>,
      '- Maintain a warm, encouraging, but rigorous tone. Never provide outright solutions; nudge with probing questions.',
      '- Reserve the final 5 minutes for candidate questions regarding engineering scale and culture.',
      '- Synthesize candidate responses against the calibrated 4-tier evaluation rubric upon completion.',
    ],
  },
  {
    id: 'stages',
    label: 'Interview Stages & Topics',
    lines: [
      <H># INTERVIEW STAGES &amp; TOPIC CALIBRATION</H>,
      <K>STAGE 1: SCOPING &amp; API CONTRACTS (0-10 min)</K>,
      '- Candidate must establish write throughput (50k req/s) and latency p99 targets (&lt;20ms).',
      '- Idempotency token format and payload hashing strategy.',
      '',
      <K>STAGE 2: DATA PARTITIONING &amp; CONSISTENCY (10-25 min)</K>,
      '- Consensus protocol evaluation (Multi-Raft vs Paxos).',
      '- Handling split-brain states when Regional networks disconnect.',
      '',
      <K>STAGE 3: LIVE RECOVERY &amp; CIRCUIT BREAKING (25-40 min)</K>,
      '- Candidate designs rate limiting and backpressure mechanisms under surge load.',
      '- Validating zero double-charge guarantee during partial service failure.',
      '',
      <K>STAGE 4: CANDIDATE DEBRIEF &amp; WRAP-UP (40-45 min)</K>,
      '- Candidate Q&amp;A on engineering culture and roadmap.',
    ],
  },
  {
    id: 'rubric-guidelines',
    label: 'Evaluation Rubric Guidelines',
    lines: [
      <H># EVALUATION RUBRIC GUIDELINES</H>,
      <K>SYSTEM ARCHITECTURE (35%)</K>,
      '- Exemplary (90-100): Clear CP/AP trade-off analysis, explicit multi-region replication strategy, zero single points of failure.',
      '- Competent (70-89): Solid architecture with minor gaps in partition recovery semantics.',
      '',
      <K>ALGORITHMIC CONCURRENCY (30%)</K>,
      '- Exemplary (90-100): Lock-free data structures, O(1) auxiliary space, clean thread safety.',
      '- Needs Review (&lt;70): Unhandled race conditions or excessive lock contention under concurrency.',
      '',
      <K>TECHNICAL COMMUNICATION (20%)</K>,
      '- Articulates reasoning clearly under probing, receptive to feedback, defends architectural decisions constructively.',
      '',
      <K>OPERATIONAL RELIABILITY (15%)</K>,
      '- Proactive observability, metric telemetry, SLA degradation safeguards.',
    ],
  },
  {
    id: 'role-directives',
    label: 'Role Directives',
    lines: [
      <H>// --- DIRECTIVE BLOCK: ROLE DEFINITION ---</H>,
      <><K>YOU ARE</K>: Aria, Senior Distributed Systems Principal Assessor.</>,
      <><K>CONTEXT</K>: Evaluating L5 candidates on partitioning, consensus, and fault injection.</>,
      '',
      <H>// --- CONVERSATIONAL PROTOCOL ---</H>,
      '1. Begin with an open-ended architecture requirement: designing a global idempotency token coordinator.',
      '2. When candidate offers naive Redis locking:',
      <div className={IND}><PR>&gt; PROBE</PR>: Ask about TTL boundary violations during long GC pauses.</div>,
      <div className={IND}><PR>&gt; CONSTRAINT</PR>: Propose a split-brain scenario with node isolation in Region West.</div>,
      '3. Expect candidate to state Trade-offs: Latency vs. Strong Consistency (CAP theorem application).',
      '',
      <H>// --- LIVE CODING SANDBOX INSTRUCTIONS ---</H>,
      '- Require Go/Rust implementation of an In-Memory Ring Buffer with single-writer, multi-reader lockless semantics.',
      <>- Check algorithmic space complexity: strictly <V>O(1) auxiliary</V>.</>,
      '- If concurrency race occurs in Sandbox: do NOT flag failure immediately. Instruct candidate:',
      <div className={IND}><span className="italic text-primary">"Run with -race detector and inspect CAS loop index 4."</span></div>,
      '- Record reaction latency and debugging composure in the diagnostic rubric ledger.',
    ],
  },
  {
    id: 'probing',
    label: 'Probing Matrix',
    lines: [
      <H>// --- PROBING MATRIX &amp; ESCALATION TREE ---</H>,
      <K>TRIGGER [Consensus Mentioned]</K>,
      <div className={IND}>- If candidate suggests Paxos: request distinction between Multi-Paxos and Raft leader election.</div>,
      <div className={IND}>- If candidate mentions Cassandra: verify tuning of LOCAL_QUORUM vs ALL for read repair.</div>,
      '',
      <K>TRIGGER [Backpressure / Queue Stalls]</K>,
      <div className={IND}>- Interrogate: "Under sudden 10x ingress surge, where do you shed load to preserve p99 SLA?"</div>,
      <div className={IND}>- Require explicit definition of token bucket vs leaky bucket algorithm.</div>,
    ],
  },
  {
    id: 'sandbox',
    label: 'Sandbox Protocol',
    lines: [
      <H>// --- CODE SANDBOX RUNTIME PROTOCOL ---</H>,
      <><K>TARGET PROBLEM</K>: Lockless Single-Writer Multi-Reader Ring Buffer.</>,
      <K>CONSTRAINTS</K>,
      <div className={IND}>1. Memory: 512MB max heap.</div>,
      <div className={IND}>2. Disallow external third-party sync libraries (pure stdlib atomic primitives).</div>,
      <div className={IND}>3. Provide unit test suite with 10 concurrent reader goroutines / threads.</div>,
      '',
      <><PR>&gt; PASSING CRITERIA</PR>: Zero race detector warnings; memory throughput &gt; 250k ops/sec.</>,
    ],
  },
];

// ---- small controlled pieces -----------------------------------------------

const SliderField: React.FC<{
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  leftHint: string;
  rightHint: string;
  onChange: (v: number) => void;
}> = ({ label, display, value, min, max, leftHint, rightHint, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-label-sm">
      <span className="font-medium text-ink">{label}</span>
      <span className="font-mono font-semibold text-primary">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer rounded-lg bg-surface-mid accent-primary"
    />
    <div className="flex justify-between text-[10px] text-outline-strong">
      <span>{leftHint}</span>
      <span>{rightHint}</span>
    </div>
  </div>
);

const WeightSlider: React.FC<{
  dotClass: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ dotClass, label, hint, value, min, max, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-label-sm">
      <span className="flex items-center gap-1.5 font-medium text-ink">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="font-mono font-bold text-ink">{value}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer rounded-lg bg-surface-mid accent-primary"
    />
    <div className="flex justify-between text-[11px] text-outline-strong">
      <span>{hint}</span>
    </div>
  </div>
);

const VOICES = [
  { id: 'aria', name: 'Aria', desc: 'Natural & Socratic, collaborative cadence' },
  { id: 'nova', name: 'Nova', desc: 'Deep Analytical, rigorous architecture depth' },
  { id: 'echo', name: 'Echo', desc: 'Precise & Technical, low latency conciseness' },
];

const GUARDRAILS = [
  { title: 'Prevent Direct Answer Leakage', desc: 'Ensure AI guides candidates with Socratic hints instead of giving answers' },
  { title: 'Adaptive Difficulty Scaling', desc: 'Dynamically adjust problem complexity if candidate demonstrates mastery' },
  { title: 'Anonymize Candidate Demographic Cues', desc: 'Strip identifying personal background context from interviewer prompt' },
  { title: 'Enforce Timekeeping & Milestone Pacing', desc: 'Ensure all rubric competencies are evaluated within the session timeline' },
];

const LANG_CHIPS = ['Go 1.22', 'Python 3.12', 'Java 21', 'Rust 1.78', 'TypeScript 5.4'];

const DOMAIN_ANCHORS = ['Distributed Systems', 'Concurrency & Locks', 'Raft / Paxos Consensuses', 'gRPC / RPC Wire Protocols'];

const WAVE_BARS = [
  'h-3 bg-primary/40', 'h-5 bg-primary/60', 'h-7 bg-primary animate-pulse', 'h-4 bg-primary',
  'h-6 bg-primary/80', 'h-8 bg-primary animate-pulse', 'h-3 bg-primary/50', 'h-6 bg-primary/90',
  'h-5 bg-primary', 'h-7 bg-primary/70', 'h-2 bg-primary/40', 'h-6 bg-primary/80 animate-pulse',
  'h-7 bg-primary', 'h-4 bg-primary/60', 'h-8 bg-primary/90', 'h-3 bg-primary/40',
  'h-5 bg-primary/70', 'h-6 bg-primary', 'h-3 bg-primary/50', 'h-5 bg-primary/80',
];

const depthLabel = (v: number) => `${v >= 75 ? 'Deep Dive' : v <= 40 ? 'Surface' : 'Standard'} (${v}%)`;
const interruptLabel = (v: number) => `${v >= 70 ? 'Dynamic' : v <= 30 ? 'Patient' : 'Balanced'} (${v}%)`;
const toneLabel = (v: number) => `${v >= 70 ? 'Supportive' : v <= 30 ? 'Strict' : 'Neutral'} (${v}%)`;

const RubricStudioPage: React.FC = () => {
  const [voice, setVoice] = useState('aria');
  const [depth, setDepth] = useState(85);
  const [interrupt, setInterrupt] = useState(60);
  const [tone, setTone] = useState(75);
  const [guardrailOn, setGuardrailOn] = useState<boolean[]>([true, true, true, true]);
  const [tab, setTab] = useState('directive');
  const [preset, setPreset] = useState('Senior Distributed Systems');
  const [weights, setWeights] = useState({ design: 35, algo: 30, comm: 20, rel: 15 });
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  const total = weights.design + weights.algo + weights.comm + weights.rel;
  const activeTab = PROMPT_TABS.find((t) => t.id === tab) ?? PROMPT_TABS[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Command & Action Bar */}
      <div className="flex flex-col gap-3 border-b border-surface-mid bg-card px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-label-sm text-outline-strong">
              <span>Employer Workspace</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>AI Calibration</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-medium text-primary">Rubric &amp; Prompt Studio</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 tracking-tight text-headline-lg text-ink">AI Interview Engine &amp; Rubric Studio</h1>
              <div className="flex cursor-pointer items-center gap-1 rounded-md border border-surface-high bg-surface-mid px-2.5 py-1 text-label-sm text-ink transition-colors hover:bg-surface-high">
                <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                <span className="font-semibold">Claude 3.5 Sonnet / GPT-4o Evaluator</span>
                <span className="text-outline-strong">v4.2</span>
                <span className="material-symbols-outlined text-[16px] text-outline-strong">expand_more</span>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Published &amp; Active in Live Interviews</span>
              </div>
            </div>
            <p className="m-0 max-w-3xl text-body-md text-ink-variant">
              Configure conversational interviewer behavior, interactive coding protocols, and multi-dimensional rubric scoring applied during candidate evaluations.
            </p>
          </div>
          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button type="button" className="flex items-center gap-1 rounded-md border border-surface-high bg-card px-3 py-1.5 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid">
              <span className="material-symbols-outlined text-[16px] text-outline-strong">history</span>
              <span>Version History (v4.18.2)</span>
              <span className="material-symbols-outlined text-[16px] text-outline-strong">expand_more</span>
            </button>
            <button
              type="button"
              onClick={() => setPlaygroundOpen(true)}
              className="flex items-center gap-1 rounded-md border border-surface-high bg-surface-low px-3 py-1.5 text-label-md text-primary shadow-sm transition-colors hover:bg-info/40"
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span>Test in Playground</span>
              <kbd className="rounded bg-surface-high px-1 font-mono text-[10px] text-ink-variant">⌘P</kbd>
            </button>
            <button type="button" className="flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95">
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span className="font-semibold">Deploy Changes</span>
            </button>
          </div>
        </div>
        {/* Active Clean Metadata Strip (state 1) */}
        <div className="flex items-center gap-6 overflow-x-auto border-t border-surface-mid/60 pt-1 text-label-sm text-ink-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">tag</span>
            <span>Release Tag: <strong className="font-mono font-medium text-ink">prod-v4.18.2</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">edit_calendar</span>
            <span>Last modified: <strong className="text-ink">Today at 10:48 AM by Sarah Jenkins</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">domain_verification</span>
            <span>Target Role: <strong className="text-ink">Senior Staff Distributed Systems (L5/L6)</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            <span>All 4 Guardrails Active</span>
          </div>
        </div>
        {/* Active Metadata Pill Strip (state 2) */}
        <div className="flex items-center gap-6 overflow-x-auto text-label-sm text-ink-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
            <span>Runtime Safety: <strong className="font-semibold text-ink">Strict Anonymization</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
            <span>Sandbox Memory Cap: <strong className="font-semibold text-ink">512MB / Process</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
            <span>Timeout Envelope: <strong className="font-semibold text-ink">45m Standard</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-outline-strong">history_toggle_off</span>
            <span>Last Published: <strong className="font-semibold text-ink">Today, 09:42 UTC by Sarah K.</strong></span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="grid grid-cols-1 items-start gap-4 p-4 md:p-6 lg:grid-cols-12">
        {/* PANEL A: Persona, Tone & Agent Guardrails */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Interviewer Persona */}
          <div className={CARD}>
            <SectionTitle
              icon="record_voice_over"
              title="Interviewer Persona"
              right={<span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[11px] font-medium text-ink">Voice Mode</span>}
            />
            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-ink-variant">Voice &amp; Conversational Style</label>
              <div className="grid grid-cols-1 gap-1">
                {VOICES.map((v) => {
                  const active = voice === v.id;
                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setVoice(v.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setVoice(v.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-md p-2.5 text-left transition-colors ${
                        active ? 'border border-primary/30 bg-primary-container/10 text-primary' : 'border border-surface-mid bg-card text-ink hover:bg-surface-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          title="Preview voice sample"
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                            active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface-mid text-ink-variant hover:text-ink'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        </button>
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{v.name}</div>
                          <div className="text-[11px] text-ink-variant">{v.desc}</div>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-[18px] ${active ? 'text-primary' : 'text-outline-strong'}`}>
                        {active ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Conversational Tuning Sliders */}
            <div className="flex flex-col gap-3 border-t border-surface-mid/80 pt-1">
              <SliderField label="Follow-up Probing Depth" display={depthLabel(depth)} value={depth} min={20} max={100} leftHint="Surface Overview" rightHint="Multi-turn Deep Dive" onChange={setDepth} />
              <SliderField label="Interruption & Flow Allowance" display={interruptLabel(interrupt)} value={interrupt} min={10} max={100} leftHint="Wait for Full Silence" rightHint="Adaptive Dynamic Interjections" onChange={setInterrupt} />
              <SliderField label="Pacing &amp; Interviewer Tone" display={toneLabel(tone)} value={tone} min={10} max={100} leftHint="Strict / Neutral Stance" rightHint="Supportive Guidance" onChange={setTone} />
            </div>
            {/* Primary Domain Anchors (state 2) */}
            <div className="flex flex-col gap-1 border-t border-surface-mid/80 pt-1">
              <label className="text-label-sm text-ink-variant">Primary Domain Anchors</label>
              <div className="flex flex-wrap gap-1.5">
                {DOMAIN_ANCHORS.map((a) => (
                  <span key={a} className="flex items-center gap-1 rounded-md bg-surface-high px-2 py-1 text-[12px] text-ink">
                    {a}
                    <span className="material-symbols-outlined cursor-pointer text-[14px] hover:text-error">close</span>
                  </span>
                ))}
                <button type="button" className="flex items-center gap-0.5 rounded-md bg-primary-container/10 px-2 py-1 text-[12px] text-primary transition-colors hover:bg-primary-container/20">
                  <span className="material-symbols-outlined text-[14px]">add</span> Add Anchor
                </button>
              </div>
            </div>
          </div>

          {/* Safety & Guardrails */}
          <div className={CARD}>
            <SectionTitle
              icon="shield_check"
              title="Safety & Guardrails"
              right={<span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Enforced</span>}
            />
            <div className="flex flex-col gap-2 text-label-sm">
              {GUARDRAILS.map((g, i) => (
                <div key={g.title} className="flex items-start justify-between rounded-lg bg-surface-low/50 p-2 transition-colors hover:bg-surface-low">
                  <div className="flex flex-col pr-2">
                    <span className="font-medium text-ink">{g.title}</span>
                    <span className="text-[11px] text-ink-variant">{g.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={guardrailOn[i]}
                    onChange={(e) => setGuardrailOn(guardrailOn.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Coding Environment */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-1 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">code</span>
                <span>Candidate Coding Environment</span>
              </h3>
              <span className="rounded-md bg-primary-container/10 px-2 py-0.5 text-[11px] font-medium text-primary">Live IDE Synced</span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Runtime configurations provisioned during the interactive problem-solving stage.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase text-outline-strong">Supported Languages</span>
                <div className="flex flex-wrap gap-1">
                  {LANG_CHIPS.map((l) => (
                    <span key={l} className="rounded border border-surface-high bg-surface-mid px-2 py-0.5 font-mono text-[11px] font-medium text-ink">{l}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col rounded-lg border border-surface-mid bg-surface-low p-2">
                  <span className="text-[11px] text-outline-strong">Test Runner</span>
                  <span className="font-mono text-[12px] font-medium text-ink">JUnit / PyTest / Go Test</span>
                </div>
                <div className="flex flex-col rounded-lg border border-surface-mid bg-surface-low p-2">
                  <span className="text-[11px] text-outline-strong">Execution Timeout</span>
                  <span className="font-mono text-[12px] font-medium text-ink">10s Per Unit Run</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL B: Rubric & System Prompt Editor */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex flex-col overflow-hidden rounded-lg border border-surface-mid bg-card shadow-sm">
            {/* Editor Header & Tabs — merged tab set of both studio states */}
            <div className="flex flex-col gap-2 border-b border-surface-mid bg-surface-low px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1">
                {PROMPT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={
                      tab === t.id
                        ? 'rounded-md border border-surface-mid bg-card px-3 py-1.5 text-label-md font-semibold text-primary shadow-sm transition-all'
                        : 'rounded-md px-3 py-1.5 text-label-md text-ink-variant transition-all hover:text-ink'
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Syntax Validated</span>
                </div>
                <button type="button" className="flex items-center gap-1 rounded bg-primary-container px-2 py-1 text-[11px] text-on-primary transition-colors hover:bg-[#313ba4]">
                  <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                  <span>Optimize</span>
                </button>
              </div>
            </div>
            {/* Template Presets and Variables Toolbar (state 1) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-mid bg-card px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase text-outline-strong">Presets:</span>
                {['Senior Distributed Systems', 'Full-Stack Tech Lead', 'Site Reliability Eng'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={
                      preset === p
                        ? 'rounded bg-primary-container/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary-container/20'
                        : 'rounded bg-surface-mid px-2 py-0.5 text-xs text-ink transition-colors hover:bg-surface-high'
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-outline-strong">
                <span>Insert Variable:</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Click to insert">{'{candidate_name}'}</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Click to insert">{'{role_level}'}</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Click to insert">{'{target_skills}'}</span>
              </div>
            </div>
            {/* Section Info Bar (state 2) */}
            <div className="flex items-center justify-between bg-surface-mid/60 px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex items-center gap-1">
                <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-ink">system_prompt.jinja2</span>
                <span>Targeting: Senior L5+ Staff Evaluator</span>
              </div>
              <span className="font-mono text-[11px] text-primary">UTF-8 • Synthesizer Sync OK</span>
            </div>
            {/* Code / Markdown Prompt Area */}
            <div className="flex min-h-[440px] overflow-x-auto bg-card p-3 font-mono text-body-sm leading-relaxed">
              <div className="select-none border-r border-surface-high pr-3 text-right text-[12px] leading-6 text-outline">
                {activeTab.lines.map((_, i) => (
                  <div key={i}>{String(i + 1).padStart(2, '0')}</div>
                ))}
              </div>
              <div className="flex-1 pl-1">
                {activeTab.lines.map((ln, i) => (
                  <div key={i} className="leading-6">{ln}</div>
                ))}
              </div>
            </div>
            {/* Editor Footer Tools */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-mid bg-surface-low px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink">Tokens: <strong>1,840</strong> / 8,192</span>
                <span className="text-outline">•</span>
                <span>Temperature: <strong className="font-mono text-ink">0.20 (Deterministic)</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Revert to Default</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Export Prompt Template</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Format Template</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">View JSON Schema</button>
              </div>
            </div>
          </div>

          {/* Coding Sandbox Environment (state 2) */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-1 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
                <span>Coding Sandbox Environment</span>
              </h3>
              <span className="rounded-full bg-primary-container/10 px-2 py-0.5 font-mono text-xs text-primary">Firecracker VM isolated</span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Live execution parameters fed directly to candidate IDE during coding challenge checkpoints.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">Runtimes</span>
                <span className="font-mono text-xs font-medium text-ink">Go 1.22, Rust 1.78</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">CPU Throttling</span>
                <span className="font-mono text-xs font-medium text-ink">2 vCPU (Pinned)</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">Network Isolation</span>
                <span className="font-mono text-xs font-semibold text-emerald-600">Full Airgap (Zero egress)</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL C: Rubric Weights, Cutoffs & Previews */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {/* Evaluation Rubric Weights */}
          <div className={CARD}>
            <SectionTitle
              icon="tune"
              title="Evaluation Rubric Weights"
              right={
                <div className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold text-on-primary ${total === 100 ? 'bg-primary' : 'bg-error'}`}>
                  Total: {total}%
                </div>
              }
            />
            <p className="m-0 text-body-sm text-ink-variant">
              Adjust the weighted distribution applied across evaluation categories to compute composite scores.
            </p>
            <div className="flex flex-col gap-3 pt-1">
              <WeightSlider dotClass="bg-indigo-600" label="System Architecture & Scalability" hint="Multi-region design, data sharding, throughput" value={weights.design} min={5} max={60} onChange={(v) => setWeights({ ...weights, design: v })} />
              <WeightSlider dotClass="bg-blue-600" label="Data Structures & Algorithmic Concurrency" hint="Lock-free patterns, memory footprint, time complexity" value={weights.algo} min={5} max={60} onChange={(v) => setWeights({ ...weights, algo: v })} />
              <WeightSlider dotClass="bg-emerald-600" label="Technical Communication & Trade-offs" hint="Clarity of reasoning, defense of design decisions" value={weights.comm} min={5} max={50} onChange={(v) => setWeights({ ...weights, comm: v })} />
              <WeightSlider dotClass="bg-amber-600" label="Operational Reliability & Edge Cases" hint="Fault tolerance, observability, circuit breakers" value={weights.rel} min={5} max={40} onChange={(v) => setWeights({ ...weights, rel: v })} />
            </div>
            {/* Weight Progress Bar Visual (state 1) */}
            <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-surface-mid bg-surface-low p-2.5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-mid">
                <div className="h-full bg-indigo-600" style={{ width: `${weights.design}%` }} />
                <div className="h-full bg-blue-600" style={{ width: `${weights.algo}%` }} />
                <div className="h-full bg-emerald-600" style={{ width: `${weights.comm}%` }} />
                <div className="h-full bg-amber-600" style={{ width: `${weights.rel}%` }} />
              </div>
              <div className="flex justify-between pt-0.5 text-[11px] text-outline-strong">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Design {weights.design}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Algo {weights.algo}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Comm {weights.comm}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Ops {weights.rel}%</span>
              </div>
            </div>
            {/* Auto-Normalized Weight Matrix donut (state 2) */}
            <div className="mt-1 flex items-center gap-3 rounded-lg bg-surface-low p-2.5">
              <svg className="h-16 w-16 shrink-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#eaedff" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#4f46e5" strokeDasharray="35 65" strokeDashoffset="25" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#313ba4" strokeDasharray="30 70" strokeDashoffset="90" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#059669" strokeDasharray="20 80" strokeDashoffset="60" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#d97706" strokeDasharray="15 85" strokeDashoffset="40" strokeWidth="3.2" />
              </svg>
              <div className="flex flex-col text-xs text-ink-variant">
                <span className="font-semibold text-ink">Auto-Normalized Weight Matrix</span>
                <span>Evaluations adhere to deterministic sum policy. Any deviation is normalized at scoring runtime.</span>
              </div>
            </div>
          </div>

          {/* Score Cutoffs & Hiring Triggers */}
          <div className={CARD}>
            <SectionTitle
              icon="rule"
              title="Score Cutoffs & Hiring Triggers"
              right={<span className="font-mono text-[11px] text-outline-strong">Scale 0–100 pts</span>}
            />
            <div className="flex flex-col gap-2 text-label-sm">
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                  <div>
                    <div className="text-[13px] font-semibold text-emerald-900">Strong Recommend (≥ 85 pts)</div>
                    <div className="text-[11px] text-emerald-700">Auto-advance candidate to Partner Executive round</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-emerald-800">
                  <span>≥ 85.0</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">rate_review</span>
                  <div>
                    <div className="text-[13px] font-semibold text-amber-900">Review Required (70 – 84 pts)</div>
                    <div className="text-[11px] text-amber-700">Flag for Hiring Manager manual recording review</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-amber-800">
                  <span>70.0 – 84.9</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-rose-600">cancel</span>
                  <div>
                    <div className="text-[13px] font-semibold text-rose-900">Not Moving Forward (&lt; 70 pts)</div>
                    <div className="text-[11px] text-rose-700">Generate constructive feedback packet for candidate</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-rose-800">
                  <span>&lt; 70.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Feedback Preview (state 1) */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <SectionTitle
              icon="assignment_turned_in"
              title="Candidate Feedback Preview"
              right={<Badge>Auto-Generated</Badge>}
            />
            <p className="m-0 text-[12px] text-ink-variant">
              Preview of structured output delivered to candidates and hiring teams under this rubric:
            </p>
            <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-surface-low p-2 text-xs">
              <div className="flex items-center justify-between border-b border-surface-high pb-1.5">
                <span className="font-semibold text-ink">Evaluation Summary for Elena R.</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700">Score: 88.5 / 100</span>
              </div>
              <div className="leading-relaxed text-ink-variant">
                <strong className="text-ink">Strengths:</strong> Demonstrated master-level command of Raft consensus and split-brain recovery under simulated node failure.
              </div>
              <div className="leading-relaxed text-ink-variant">
                <strong className="text-ink">Growth Area:</strong> In-memory ring buffer space complexity breached O(1) auxiliary boundary during initial sandbox draft.
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-outline-strong">
                <span>Calibrated with v4.18.2 Prompt Matrix</span>
                <a className="flex items-center gap-0.5 font-medium text-primary hover:underline" href="#/">Full Scorecard <span className="material-symbols-outlined text-[13px]">arrow_forward</span></a>
              </div>
            </div>
          </div>

          {/* Voice Latency & Waveform (state 2) */}
          <div className={CARD}>
            <SectionTitle
              icon="mic"
              title="Voice Latency & Waveform"
              right={
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  142ms RTT
                </span>
              }
            />
            <div className="flex h-12 items-center justify-between rounded-lg bg-surface-low px-3">
              <div className="flex h-8 w-full items-end justify-center gap-[3px]">
                {WAVE_BARS.map((b, i) => (
                  <span key={i} className={`w-[3px] rounded-full ${b}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-ink-variant">
              <span className="font-medium">Candidate Speaking Simulation</span>
              <button type="button" className="flex items-center gap-1 font-semibold text-primary hover:underline">
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                <span>Simulate Probing Turn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Playground Modal (state 1) */}
      {playgroundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 backdrop-blur-sm">
          <div className="flex max-h-[870px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-surface-mid bg-card shadow-card">
            <div className="flex items-center justify-between bg-surface-mid px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-primary">terminal</span>
                <div>
                  <h3 className="m-0 text-headline-sm text-ink">Interactive Interview Playground</h3>
                  <p className="m-0 text-[12px] text-ink-variant">Test interviewer responses against your configured system prompt &amp; guardrails</p>
                </div>
              </div>
              <button type="button" onClick={() => setPlaygroundOpen(false)} className="rounded-lg p-1 text-outline-strong transition-colors hover:text-ink">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm">AI</div>
                <div className="max-w-[85%] rounded-xl border border-surface-mid bg-surface-low p-3 text-body-sm text-ink">
                  <p className="mb-1 font-semibold text-primary">Aria (AI Evaluator)</p>
                  "Welcome! To kick off the distributed systems portion: let's explore building an idempotency coordinator across three write-heavy regions. If a network partition isolates Region West, how does your leasing mechanism prevent duplicate execution?"
                </div>
              </div>
              <div className="flex items-start justify-end gap-2">
                <div className="max-w-[85%] rounded-xl bg-primary-container p-3 text-body-sm text-on-primary">
                  <p className="mb-1 font-semibold text-on-primary-container">Simulated Candidate Response</p>
                  "I'd place a Redis instance with a 15-second TTL lock in West and simply let transactions proceed if the lock acquires successfully."
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dae2fd] text-xs font-bold text-ink">You</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm">AI</div>
                <div className="max-w-[85%] rounded-xl border-l-2 border-primary border-surface-mid bg-surface-low p-3 text-body-sm text-ink">
                  <p className="mb-1 font-semibold text-primary">Aria (Socratic Probing Guardrail Triggered)</p>
                  "What happens if an unexpected GC pause of 18 seconds occurs right after lock acquisition in West, while another client in Central attempts execution after TTL expiration? How do we prevent split-brain processing without relying on synchronized wall clocks?"
                  <div className="mt-2 flex items-center gap-2 border-t border-surface-high/60 pt-2 font-mono text-[11px] text-outline-strong">
                    <span className="font-semibold text-emerald-700">✓ Guardrail Matched:</span> Prevent Direct Answer Leakage &amp; Socratic Escalation
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-surface-mid bg-surface-low p-3">
              <input
                type="text"
                placeholder="Type a mock candidate response to test AI follow-up..."
                className="flex-1 rounded-md border border-surface-mid bg-card px-3 py-2 text-body-sm text-ink shadow-sm placeholder:text-outline-strong focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="button" className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container">
                <span>Send Turn</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricStudioPage;
