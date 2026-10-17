import React from 'react';

// Static candidate-side device check screen (mockup: ai_interview_prep_device_check).
// Rendered inside AppLayout, so the mockup's fixed sidebar/top header are not duplicated here.

const META_CHIPS = [
  { icon: 'schedule', iconClass: 'text-primary', label: 'Duration', value: '45 Minutes' },
  { icon: 'assignment', iconClass: 'text-secondary', label: 'Format', value: '3 Scenarios + 1 Code Task' },
  // tertiary #313ba4 has no project token
  { icon: 'record_voice_over', iconClass: 'text-[#313ba4]', label: 'Host', value: 'AI Interviewer: Aria' },
];

const WAVE_BARS = [
  'h-4 bg-primary/40', 'h-4 bg-primary/60', 'h-7 bg-primary/80', 'h-8 bg-primary',
  'h-3 bg-secondary', 'h-9 bg-secondary', 'h-9 bg-primary', 'h-5 bg-secondary',
  'h-4 bg-primary', 'h-8 bg-primary/80', 'h-6 bg-secondary', 'h-9 bg-primary/60',
  'h-2 bg-primary/40', 'h-4 bg-secondary', 'h-4 bg-primary', 'h-8 bg-secondary',
  'h-6 bg-primary/80', 'h-5 bg-primary/50', 'h-6 bg-primary/30', 'h-4 bg-primary/40',
  'h-3 bg-primary/70', 'h-4 bg-secondary', 'h-5 bg-primary', 'h-3 bg-primary/40',
];

const AGENDA = [
  {
    n: '1',
    box: 'bg-[#e2dfff] text-[#0f0069]', // primary-fixed / on-primary-fixed (no project token)
    title: 'Core Java & Concurrency',
    body: 'JVM memory model, Virtual Threads, concurrent collections & lock-free algorithms.',
  },
  {
    n: '2',
    box: 'bg-[#e1e0ff] text-[#07006c]', // secondary-fixed / on-secondary-fixed (no project token)
    title: 'System Architecture & Spring Boot',
    body: 'High-throughput REST API modeling, idempotency, event streams & transactional boundaries.',
  },
  {
    n: '3',
    box: 'bg-[#e0e0ff] text-[#000767]', // tertiary-fixed / on-tertiary-fixed (no project token)
    title: 'Live Coding & Algorithmic Task',
    body: 'Interactive Monaco browser IDE with live compilation and JUnit test execution.',
  },
];

const INSTRUCTIONS = [
  {
    icon: 'forum',
    iconClass: 'text-primary',
    strong: 'Conversational AI Interaction:',
    body: ' Aria speaks dynamically. Interrupt at any moment to elaborate or request clarification.',
  },
  {
    icon: 'terminal',
    iconClass: 'text-secondary',
    strong: 'Integrated Sandbox:',
    body: ' No local IDE configuration needed. You can run code, inspect stack traces, and write edge tests.',
  },
  {
    icon: 'headset_mic',
    iconClass: 'text-[#313ba4]', // tertiary (no project token)
    strong: 'Acoustic Clarity:',
    body: ' Use headphones to isolate audio echoes and ensure maximum conversational accuracy.',
  },
];

const selectClass =
  'h-9 w-full cursor-pointer appearance-none rounded-lg bg-surface-low pl-3 pr-8 text-body-sm text-ink focus:outline-none focus:ring-1 focus:ring-secondary';

const DeviceCheckPage: React.FC = () => (
  <div className="flex w-full flex-col pb-4">
    {/* Top progress & meta header */}
    <div className="flex flex-col justify-between gap-3 pb-4 md:flex-row md:items-end">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#e1e0ff] px-2 py-0.5 text-label-sm font-medium tracking-wide text-[#2f2ebe]">
            {/* secondary-fixed / on-secondary-fixed-variant (no project token) */}
            Interview Preparation
          </span>
        </div>
        <h1 className="m-0 text-display tracking-tight text-ink">AI Technical Interview Preparation</h1>
        <p className="m-0 text-body-md text-ink-variant">
          Role Evaluation: <span className="font-semibold text-ink">Java Backend Engineering Track</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {META_CHIPS.map((c) => (
          <div key={c.label} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-sm">
            <span className={`material-symbols-outlined text-[18px] ${c.iconClass}`}>{c.icon}</span>
            <div className="flex flex-col">
              <span className="text-label-sm uppercase tracking-wider text-outline-strong">{c.label}</span>
              <span className="text-headline-sm font-semibold text-ink">{c.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* LEFT: hardware & telemetry diagnostics */}
      <section className="flex flex-col gap-4 lg:col-span-7">
        {/* 1. Camera calibration */}
        <div className="flex flex-col overflow-hidden rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">videocam</span>
              <span className="text-headline-sm text-ink">1. Optical &amp; Camera Calibration</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-label-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              ✓ Camera Ready (1080p)
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {/* Video frame sandbox */}
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[#283044] shadow-inner">
              {/* inverse-surface (no project token) */}
              <img
                className="h-full w-full object-cover brightness-95 contrast-105"
                alt="Candidate framed within the AI interview video stream preview"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7_2adluTHk7PVJZ6cuyHmr7QjwPsGIIrl1xyPjtnGAOxk-iJU8iitIJ0bYou74BQQbxfC69jopf-x3c9vQB-5qdcpCiv8KhQb6VWwflPrYtEp7soDJE_EUaAHWrlkRl7wfwsp-qcPft_ItQD8loMD5nnu3LPslTW3JfBsNknGx9Apjy72ThpsJFrrytNWziREAv_vaTCyl-BB4-6Qzp0SU1UZfLnnYAO_iWtDP5aXbI-MR8t6JQ_J"
              />
              {/* Facial alignment HUD overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="relative flex h-56 w-44 items-center justify-center rounded-full border border-dashed border-[#c3c0ff]/70">
                  {/* primary-fixed-dim (no project token) */}
                  <div className="absolute left-0 top-2 h-3 w-3 border-l-2 border-t-2 border-[#e2dfff]" />
                  <div className="absolute right-0 top-2 h-3 w-3 border-r-2 border-t-2 border-[#e2dfff]" />
                  <div className="absolute bottom-2 left-0 h-3 w-3 border-b-2 border-l-2 border-[#e2dfff]" />
                  <div className="absolute bottom-2 right-0 h-3 w-3 border-b-2 border-r-2 border-[#e2dfff]" />
                  {/* primary-fixed corners + label (no project token) */}
                  <span className="-mt-32 rounded-full bg-[#283044]/80 px-2 py-0.5 font-mono text-[12px] text-[#e2dfff] backdrop-blur-md">
                    Face Aligned
                  </span>
                </div>
              </div>
              {/* On-screen telemetry bar */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#283044]/90 via-[#283044]/50 to-transparent p-3 text-on-primary">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-2 py-0.5 font-mono text-[12px] font-medium">LIVE PREVIEW</span>
                  <span className="flex items-center gap-1 text-body-sm text-[#dae2fd]">
                    {/* surface-variant (no project token) */}
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Camera Connected
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#e1e0ff]">
                  {/* secondary-fixed (no project token) */}
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span className="text-label-sm">Lighting: Optimal</span>
                </div>
              </div>
            </div>
            {/* Camera select control */}
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <div className="relative w-full">
                <select className={selectClass} defaultValue="FaceTime HD Camera (Built-in 1080p)">
                  <option>FaceTime HD Camera (Built-in 1080p)</option>
                  <option>Logitech Brio 4K Stream Edition</option>
                  <option>Elgato Cam Link 4K (External)</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
                  expand_more
                </span>
              </div>
              <button
                type="button"
                className="flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-surface-mid px-3 text-label-md text-ink transition-colors hover:bg-surface-high sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Re-center</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Microphone level */}
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">mic</span>
              <span className="text-headline-sm text-ink">2. Acoustic &amp; Microphone Level</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-label-sm text-secondary">
              ✓ Mic Level Optimal
            </span>
          </div>
          <div className="relative w-full">
            <select className={selectClass} defaultValue="MacBook Pro Microphone (Built-in Audio Studio)">
              <option>MacBook Pro Microphone (Built-in Audio Studio)</option>
              <option>Shure MV7 USB Dynamic Microphone</option>
              <option>Default System Audio Input</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
              expand_more
            </span>
          </div>
          {/* Audio waveform visualizer (static snapshot of the mockup bars) */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface-low p-4">
            <div className="flex items-center justify-between text-label-sm text-ink-variant">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Speak now to test decibel response:
              </span>
              <span className="font-mono text-[12px] font-semibold text-primary">Microphone Level: Good</span>
            </div>
            <div className="flex h-10 items-center justify-between gap-1 overflow-hidden rounded-lg bg-card px-2">
              {WAVE_BARS.map((bar, i) => (
                <div key={i} className={`w-1.5 rounded-full ${bar}`} />
              ))}
            </div>
          </div>
        </div>

        {/* 3 & 4: speaker + latency grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-3 rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-headline-sm text-ink">
                  <span className="material-symbols-outlined text-[18px] text-[#313ba4]">volume_up</span>
                  3. Speaker Test
                </span>
                <span className="text-label-sm font-medium text-secondary">✓ Verified</span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">Confirm you can clearly hear AI prompts through your headphones.</p>
            </div>
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-surface-mid text-label-md text-ink transition-all hover:bg-surface-high active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">play_arrow</span>
              <span>Test Audio Chime</span>
            </button>
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-headline-sm text-ink">
                  <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
                  4. Network Latency
                </span>
                <span className="text-label-sm font-medium text-secondary">✓ Low Latency</span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">Connection Quality: Excellent • Latency: Low</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-low px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                <span className="text-label-md font-medium text-ink">Fast &amp; Stable Connection</span>
              </div>
              <span className="text-label-sm font-semibold text-ink">Ready</span>
            </div>
          </div>
        </div>

        {/* 5. Browser runtime strip */}
        <div className="flex flex-col items-center justify-between gap-2 rounded-xl bg-card p-4 shadow-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-mid text-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-md font-semibold text-ink">5. Browser Runtime &amp; WebRTC</span>
              <span className="text-body-sm text-ink-variant">Browser &amp; Audio Compatible</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Full Compliance</span>
          </div>
        </div>
      </section>

      {/* RIGHT: readiness, agenda, instructions & launch */}
      <section className="flex flex-col gap-4 lg:col-span-5">
        <div className="flex items-center justify-between rounded-xl bg-primary-container p-4 text-on-primary shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-primary/20">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-semibold">Ready for Live Session</span>
              <span className="text-body-sm text-on-primary-container">All System Checks Passed (5/5)</span>
            </div>
          </div>
          <span className="rounded bg-on-primary/10 px-2 py-1 font-mono text-[12px]">STAGE 1/1</span>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-headline-sm text-ink">Curriculum &amp; Agenda</span>
            <span className="text-label-sm text-outline-strong">Total: 45m</span>
          </div>
          <div className="flex flex-col gap-2">
            {AGENDA.map((item) => (
              <div key={item.n} className="flex items-start gap-2 rounded-lg bg-surface-low p-3 transition-colors hover:bg-surface-mid">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[12px] font-bold ${item.box}`}>
                  {item.n}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-label-md font-semibold text-ink">{item.title}</span>
                    <span className="shrink-0 font-mono text-[12px] text-outline-strong">15 mins</span>
                  </div>
                  <p className="mt-0.5 text-body-sm text-ink-variant">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm">
          <span className="text-headline-sm text-ink">Candidate Instructions</span>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {INSTRUCTIONS.map((ins) => (
              <li key={ins.strong} className="flex items-start gap-2 text-body-sm text-ink-variant">
                <span className={`material-symbols-outlined mt-0.5 shrink-0 text-[18px] ${ins.iconClass}`}>{ins.icon}</span>
                <span>
                  <strong className="text-ink">{ins.strong}</strong>
                  {ins.body}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm">
          <button
            type="button"
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-sm text-on-primary shadow-md transition-all hover:bg-[#313ba4]"
            /* hover:bg-tertiary in mockup (#313ba4, no project token) */
          >
            <span>Start Interview Now</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-surface-low text-label-md text-ink-variant transition-colors hover:bg-surface-mid hover:text-ink"
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Practice Mode</span>
            </button>
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-surface-low text-label-md text-ink-variant transition-colors hover:bg-surface-mid hover:text-ink"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Reschedule</span>
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1 text-label-sm text-outline-strong">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>End-to-end encrypted session • Recorded for evaluation review</span>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default DeviceCheckPage;
