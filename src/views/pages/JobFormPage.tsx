import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import {
  AI_SCREENING_TRACK_LABELS,
  AiScreeningTrack,
  JOB_STATUS_LABELS,
  JobDetail,
  JobRequest,
  JobStatus,
  WORKPLACE_MODEL_LABELS,
  WorkplaceModel,
} from '../../models/Program.model';
import { joinCommaList, splitCommaList } from '../../utils/commaList';
import { parseServerTimestamp } from '../../utils/date';
import { isItRelatedJobTitle } from '../../utils/itJob';
import { isRichTextHtml, richTextExcerpt, sanitizeRichText, toRichTextHtml } from '../../utils/richText';
import {
  Badge,
  ErrorBanner,
  LoadingState,
  buttonClass,
  inputClass,
  richTextContentClass,
  statusTone,
} from '../components/ui';

const AUTO_SAVE_DELAY = 900;
const MAX_SCORE = 95;
const MIN_SCORE = 50;

const STEP_TITLES = [
  'Basic Info & Meta',
  'Role & Responsibilities',
  'Compensation & Perks',
  'AI Screening Setup',
];

const DEPARTMENTS = [
  'Platform Infrastructure',
  'Core Architecture & Data',
  'AI Runtime Operations',
  'Site Reliability Engineering',
  'Distributed Computing Group',
];

const EXPERIENCE_LEVELS = [
  'Senior (5-8+ yrs)',
  'Staff / Principal (8+ yrs)',
  'Mid-Level (3-5 yrs)',
  'Director / VP Level',
];

const EMPLOYMENT_TYPES = [
  'Full-Time Regular',
  'Contract (12 Months)',
  'Contract-to-Hire',
  'Part-Time Consultant',
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($) United States' },
  { value: 'EUR', label: 'EUR (€) Eurozone' },
  { value: 'CAD', label: 'CAD ($) Canadian Dollar' },
  { value: 'GBP', label: 'GBP (£) British Pound' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CAD: 'C$',
  GBP: '£',
};

const WORKPLACE_OPTIONS: { value: WorkplaceModel; label: string; icon: string }[] = [
  { value: 'ONSITE', label: 'On-site', icon: 'apartment' },
  { value: 'HYBRID', label: 'Hybrid', icon: 'hub' },
  { value: 'REMOTE', label: 'Fully Remote', icon: 'public' },
];

const TRACK_OPTIONS = Object.keys(AI_SCREENING_TRACK_LABELS) as AiScreeningTrack[];

const FOCUS_AREAS = [
  { title: 'Distributed Consensus & Failure Modes', hint: 'Raft split-brain, partition isolation' },
  { title: 'Lock-Free Concurrency & Memory', hint: 'Channel contention, atomic pointers' },
  { title: 'Database Partitioning & Sharding', hint: 'Consistent hashing, read replicas' },
  { title: 'Production Incident Debugging', hint: 'Pprof profiling, eBPF telemetry' },
];

const RICH_TEXT_EDITOR = `min-h-[220px] px-3 py-3 text-body-md leading-relaxed text-ink focus:outline-none ${richTextContentClass}`;

const disabledInputClass = `${inputClass} disabled:cursor-not-allowed disabled:bg-surface-low disabled:text-ink-variant`;

interface JobFormState {
  title: string;
  companyName: string;
  department: string;
  experienceLevel: string;
  employmentType: string;
  workplaceModel: WorkplaceModel;
  location: string;
  timezoneRequirement: string;
  requiredSkills: string[];
  description: string;
  salaryCurrency: string;
  salaryMin: string;
  salaryMax: string;
  equityBand: string;
  annualBonus: string;
  aiScreeningEnabled: boolean;
  aiScreeningTrack: '' | AiScreeningTrack;
  aiScreeningPassScore: number;
  aiQuestionFocusAreas: string[];
  position: string;
  requirements: string;
  legacySalaryRange: string;
  hadStructuredSalary: boolean;
}

type SaveMode = 'auto' | 'explicit';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const emptyForm = (): JobFormState => ({
  title: '',
  companyName: '',
  department: '',
  experienceLevel: '',
  employmentType: '',
  workplaceModel: 'HYBRID',
  location: '',
  timezoneRequirement: '',
  requiredSkills: [],
  description: '',
  salaryCurrency: 'USD',
  salaryMin: '',
  salaryMax: '',
  equityBand: '',
  annualBonus: '',
  aiScreeningEnabled: false,
  aiScreeningTrack: '',
  aiScreeningPassScore: 80,
  aiQuestionFocusAreas: [],
  position: '',
  requirements: '',
  legacySalaryRange: '',
  hadStructuredSalary: false,
});

const jobToForm = (job: JobDetail): JobFormState => ({
  title: job.title,
  companyName: job.companyName,
  department: job.department ?? '',
  experienceLevel: job.experienceLevel ?? '',
  employmentType: job.employmentType ?? '',
  workplaceModel: job.workplaceModel ?? 'HYBRID',
  location: job.location ?? '',
  timezoneRequirement: job.timezoneRequirement ?? '',
  requiredSkills: splitCommaList(job.requiredSkills),
  description: toRichTextHtml(job.description),
  salaryCurrency: job.salaryCurrency ?? 'USD',
  salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
  salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
  equityBand: job.equityBand ?? '',
  annualBonus: job.annualBonus ?? '',
  aiScreeningEnabled: Boolean(job.aiScreeningEnabled),
  aiScreeningTrack: job.aiScreeningTrack ?? '',
  aiScreeningPassScore: job.aiScreeningPassScore ?? 80,
  aiQuestionFocusAreas: splitCommaList(job.aiQuestionFocusAreas),
  position: job.position ?? '',
  requirements: job.requirements ?? '',
  legacySalaryRange: job.salaryRange ?? '',
  hadStructuredSalary: job.salaryMin != null || job.salaryMax != null,
});

const parseSalary = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
};

const formatNumber = (value: number): string => value.toLocaleString('en-US');

const compactNumber = (value: number): string => (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value));

const deriveSalaryRange = (form: JobFormState): string => {
  const min = parseSalary(form.salaryMin);
  const max = parseSalary(form.salaryMax);
  const hasMin = min != null && min > 0;
  const hasMax = max != null && max > 0;
  if (hasMin && hasMax && min != null && max != null) {
    return `${form.salaryCurrency} ${formatNumber(min)} – ${formatNumber(max)}`;
  }
  if (hasMin && min != null) return `${form.salaryCurrency} ${formatNumber(min)}+`;
  if (hasMax && max != null) return `Up to ${form.salaryCurrency} ${formatNumber(max)}`;
  if (form.hadStructuredSalary) return '';
  return form.legacySalaryRange;
};

const previewSalaryChip = (form: JobFormState): string => {
  const min = parseSalary(form.salaryMin);
  const max = parseSalary(form.salaryMax);
  const symbol = CURRENCY_SYMBOLS[form.salaryCurrency] ?? '';
  if (min != null && min > 0 && max != null && max > 0) {
    return `${symbol}${compactNumber(min)} - ${symbol}${compactNumber(max)}`;
  }
  if (min != null && min > 0) return `${symbol}${compactNumber(min)}+`;
  if (max != null && max > 0) return `Up to ${symbol}${compactNumber(max)}`;
  return form.legacySalaryRange;
};

const sanitizeDescription = (raw: string): string => {
  if (!isRichTextHtml(raw)) return raw;
  const clean = sanitizeRichText(raw);
  return richTextExcerpt(clean, 1) ? clean : '';
};

const buildPayload = (form: JobFormState): JobRequest => {
  const min = parseSalary(form.salaryMin);
  const max = parseSalary(form.salaryMax);
  const hasMin = min != null && min > 0;
  const hasMax = max != null && max > 0;
  const body: JobRequest = {
    title: form.title.trim(),
    companyName: form.companyName.trim(),
    position: form.position,
    location: form.location.trim(),
    salaryRange: deriveSalaryRange(form),
    description: sanitizeDescription(form.description),
    requirements: form.requirements,
    requiredSkills: joinCommaList(form.requiredSkills),
    department: form.department,
    experienceLevel: form.experienceLevel,
    employmentType: form.employmentType,
    workplaceModel: form.workplaceModel,
    timezoneRequirement: form.timezoneRequirement.trim(),
    salaryCurrency: form.salaryCurrency,
    equityBand: form.equityBand.trim(),
    annualBonus: form.annualBonus.trim(),
    aiScreeningEnabled: form.aiScreeningEnabled,
  };

  if (hasMin && min != null) body.salaryMin = min;
  if (hasMax && max != null) body.salaryMax = max;

  if (form.aiScreeningEnabled) {
    body.aiScreeningTrack = form.aiScreeningTrack || null;
    body.aiScreeningPassScore = form.aiScreeningPassScore;
    body.aiQuestionFocusAreas = joinCommaList(form.aiQuestionFocusAreas) || null;
  } else {
    body.aiScreeningTrack = null;
    body.aiScreeningPassScore = null;
    body.aiQuestionFocusAreas = null;
  }

  return body;
};

const validateForm = (form: JobFormState, step?: number): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (step === undefined || step === 0) {
    if (!form.title.trim()) {
      errors.title = 'Job title is required.';
    } else if (!isItRelatedJobTitle(form.title)) {
      errors.title = 'This platform only lists IT roles. Use an IT job title (e.g. Developer, Data Engineer, DevOps).';
    }
    if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
    if (form.timezoneRequirement.length > 100) {
      errors.timezoneRequirement = 'Timezone requirement must be 100 characters or fewer.';
    }
  }

  if (step === undefined || step === 2) {
    const min = parseSalary(form.salaryMin);
    const max = parseSalary(form.salaryMax);
    if (form.salaryMin.trim() && (min == null || min <= 0 || !Number.isInteger(min))) {
      errors.salaryMin = 'Enter a positive whole amount.';
    }
    if (form.salaryMax.trim() && (max == null || max <= 0 || !Number.isInteger(max))) {
      errors.salaryMax = 'Enter a positive whole amount.';
    }
    if (min != null && max != null && min > max) {
      errors.salaryMin = 'Minimum cannot exceed maximum.';
    }
  }

  if (step === undefined || step === 3) {
    if (form.aiScreeningEnabled && !form.aiScreeningTrack) {
      errors.aiScreeningTrack = 'Select a screening track.';
    }
    if (
      form.aiScreeningEnabled
      && (form.aiScreeningPassScore < MIN_SCORE || form.aiScreeningPassScore > MAX_SCORE)
    ) {
      errors.aiScreeningPassScore = `Passing score must be between ${MIN_SCORE} and ${MAX_SCORE}.`;
    }
  }

  return errors;
};

const isFormValid = (form: JobFormState): boolean => Object.keys(validateForm(form)).length === 0;

const firstErrorStep = (errors: Record<string, string>): number => {
  if (errors.title || errors.companyName || errors.timezoneRequirement) return 0;
  if (errors.salaryMin || errors.salaryMax) return 2;
  if (errors.aiScreeningTrack || errors.aiScreeningPassScore) return 3;
  return 0;
};

const formatSavedAgo = (date: Date, now: number): string => {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required = false, hint, error, className = '', children }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-label-md font-medium text-ink">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {hint && <span className="text-label-sm text-outline-strong">{hint}</span>}
    </div>
    {children}
    {error && <p className="m-0 text-label-sm text-error">{error}</p>}
  </div>
);

const Section: React.FC<{
  icon: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, title, description, aside, children }) => (
  <section className="flex flex-col gap-5 rounded-[0.5rem] border border-[#e2e8f0] bg-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div>
          <h2 className="m-0 text-headline-md text-ink">{title}</h2>
          <p className="m-0 text-body-sm text-ink-variant">{description}</p>
        </div>
      </div>
      {aside}
    </div>
    {children}
  </section>
);

const Stepper: React.FC<{ step: number }> = ({ step }) => (
  <div className="rounded-[0.5rem] border border-[#e2e8f0] bg-card px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {STEP_TITLES.map((title, index) => {
        const isCurrent = index === step;
        const isDone = index < step;
        return (
          <div
            key={title}
            className={`flex items-center gap-2 rounded-lg p-2 ${isCurrent ? 'bg-surface-low' : ''} ${index > step ? 'opacity-70' : ''}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm ${
                isDone
                  ? 'bg-primary-container text-on-primary'
                  : isCurrent
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-mid text-outline-strong'
              }`}
            >
              {isDone ? <span className="material-symbols-outlined text-[16px]">check</span> : index + 1}
            </span>
            <div className="flex min-w-0 flex-col">
              <span
                className={`text-label-sm uppercase tracking-wider ${
                  isCurrent ? 'font-semibold text-primary' : 'text-outline-strong'
                }`}
              >
                Step {String(index + 1).padStart(2, '0')}
                {isCurrent ? ' (Current)' : ''}
              </span>
              <span
                className={`truncate text-headline-sm ${
                  isCurrent ? 'text-primary' : index < step ? 'text-ink' : 'text-ink-variant'
                }`}
              >
                {title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-mid">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
      />
    </div>
  </div>
);

const ToolButton: React.FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className="flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-body-sm text-ink-variant transition-colors hover:bg-surface-mid hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </button>
);

const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkError, setLinkError] = useState('');
  const isEmpty = !richTextExcerpt(value, 1);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const apply = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    editor.focus();
    document.execCommand(command, false, commandValue);
    onChange(editor.innerHTML);
    setLinkError('');
  };

  const addLink = () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) {
      setLinkError('Select the text you want to link first.');
      return;
    }
    const url = window.prompt('Link URL (http, https, or mailto)', 'https://');
    if (url == null) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^(https?:\/\/|mailto:)/i.test(trimmed)) {
      setLinkError('Only http, https, or mailto links are allowed.');
      return;
    }
    apply('createLink', trimmed);
  };

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-card focus-within:border-[#6366f1] focus-within:ring-1 focus-within:ring-[#6366f1]">
        {!disabled && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e2e8f0] bg-surface-low/60 px-2 py-1">
            <ToolButton title="Bold" onClick={() => apply('bold')}><span className="font-bold">B</span></ToolButton>
            <ToolButton title="Italic" onClick={() => apply('italic')}><span className="italic">I</span></ToolButton>
            <ToolButton title="Underline" onClick={() => apply('underline')}><span className="underline">U</span></ToolButton>
            <span className="mx-1 h-4 w-px bg-[#e2e8f0]" />
            <ToolButton title="Heading" onClick={() => apply('formatBlock', 'h2')}><span className="font-semibold">H2</span></ToolButton>
            <ToolButton title="Bulleted list" onClick={() => apply('insertUnorderedList')}>
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </ToolButton>
            <ToolButton title="Numbered list" onClick={() => apply('insertOrderedList')}>
              <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
            </ToolButton>
            <ToolButton title="Code block" onClick={() => apply('formatBlock', 'pre')}>
              <span className="material-symbols-outlined text-[18px]">code</span>
            </ToolButton>
            <ToolButton title="Link" onClick={addLink}>
              <span className="material-symbols-outlined text-[18px]">link</span>
            </ToolButton>
          </div>
        )}
        <div className="relative">
          <div
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            aria-label="Job description"
            aria-disabled={disabled}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={(event) => onChange(event.currentTarget.innerHTML)}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData?.getData('text/plain') ?? '';
              document.execCommand('insertText', false, text);
            }}
            className={`${RICH_TEXT_EDITOR} ${disabled ? 'bg-surface-low' : ''}`}
          />
          {isEmpty && !disabled && (
            <span className="pointer-events-none absolute left-3 top-3 text-body-md text-[#94a3b8]">
              Describe the role, responsibilities, and what success looks like...
            </span>
          )}
        </div>
      </div>
      {linkError && <p className="m-0 mt-1 text-label-sm text-error">{linkError}</p>}
    </div>
  );
};

const SkillTags: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}> = ({ values, onChange, disabled = false }) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const addSkill = () => {
    const skill = draft.trim();
    if (!skill) return;
    if (skill.includes(',')) {
      setError('Commas are not allowed. Add one skill per tag.');
      return;
    }
    if (values.some((value) => value.toLowerCase() === skill.toLowerCase())) {
      setError('That skill is already added.');
      return;
    }
    onChange([...values, skill]);
    setDraft('');
    setError('');
  };

  const close = () => {
    setAdding(false);
    setDraft('');
    setError('');
  };

  return (
    <div className="rounded-xl bg-surface-low p-3">
      <div className="flex flex-wrap items-center gap-2">
        {values.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-label-md text-ink shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {skill}
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                onClick={() => onChange(values.filter((value) => value !== skill))}
                className="text-outline-strong transition-colors hover:text-error"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </span>
        ))}
        {!disabled && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full bg-surface-mid px-3 py-1 text-label-md text-primary transition-colors hover:bg-surface-high"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Skill Tag
          </button>
        )}
      </div>

      {!disabled && adding && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setError(''); }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSkill();
              }
              if (event.key === 'Escape') close();
            }}
            placeholder="e.g. Go / Golang"
            aria-label="New skill"
            className={`${inputClass} h-8 w-56`}
          />
          <button type="button" onClick={addSkill} className={buttonClass('primary')}>Add</button>
          <button type="button" onClick={close} className={buttonClass('ghost')}>Done</button>
        </div>
      )}

      {error && <p className="m-0 mt-1 text-label-sm text-error">{error}</p>}
    </div>
  );
};

const LivePreviewCard: React.FC<{
  form: JobFormState;
  status: JobStatus;
  createdAt: string | null;
  now: number;
}> = ({ form, status, createdAt, now }) => {
  const salary = previewSalaryChip(form);
  const excerpt = richTextExcerpt(form.description);
  const companyInitials = initialsOf(form.companyName);
  const locationLabel = form.location.trim()
    ? `${form.location.trim()} • ${WORKPLACE_MODEL_LABELS[form.workplaceModel]}`
    : WORKPLACE_MODEL_LABELS[form.workplaceModel];

  const createdDate = parseServerTimestamp(createdAt);
  const postedLabel = status === 'OPEN'
    ? `Posted ${createdDate ? formatSavedAgo(createdDate, now) : 'just now'}`
    : status === 'PENDING_APPROVAL'
      ? 'Awaiting review'
      : status === 'CLOSED'
        ? 'Closed'
        : 'Not published yet';

  return (
    <div className="flex flex-col gap-3 rounded-[0.5rem] border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-ink-variant">
          <span className="material-symbols-outlined text-[18px]">devices</span>
          <h2 className="m-0 text-headline-sm text-ink">Live Board Preview</h2>
        </div>
        <span className="text-label-sm text-outline-strong">Candidate View</span>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-low p-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-headline-sm text-on-primary shadow-sm">
            {companyInitials || <span className="material-symbols-outlined text-[20px]">business</span>}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-headline-sm text-ink">
              {form.title.trim() || 'Untitled position'}
            </span>
            <span className="block truncate text-label-sm text-ink-variant">
              {form.companyName.trim() || 'Company name'} • {locationLabel}
            </span>
          </div>
        </div>

        {(salary || form.equityBand.trim() || form.aiScreeningEnabled) && (
          <div className="flex flex-wrap gap-1.5">
            {salary && (
              <span className="rounded-full bg-card px-2 py-0.5 font-mono text-label-sm text-ink shadow-sm">{salary}</span>
            )}
            {form.equityBand.trim() && (
              <span className="rounded-full bg-card px-2 py-0.5 font-mono text-label-sm text-ink shadow-sm">
                {form.equityBand.trim()}
              </span>
            )}
            {form.aiScreeningEnabled && (
              <span className="rounded-full bg-info px-2 py-0.5 text-label-sm text-info-text">AI Screening</span>
            )}
          </div>
        )}

        <p className="m-0 line-clamp-3 text-body-sm text-ink-variant">
          {excerpt || 'No role summary yet.'}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1 text-label-sm text-ink-variant">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {postedLabel}
          </span>
          <button type="button" disabled className={buttonClass('primary')}>Quick Apply</button>
        </div>
      </div>

      <p className="m-0 text-label-sm text-outline-strong">
        {status === 'OPEN'
          ? 'This posting is live. Preview shows the current form state.'
          : status === 'PENDING_APPROVAL'
            ? 'Preview only - the posting is awaiting admin review.'
            : status === 'CLOSED'
              ? 'Preview only - this posting is closed.'
              : 'Preview only - nothing is published until an admin approves the posting.'}
      </p>
    </div>
  );
};

const PreviewModal: React.FC<{
  form: JobFormState;
  status: JobStatus;
  onClose: () => void;
}> = ({ form, status, onClose }) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const description = sanitizeDescription(form.description);
  const salary = deriveSalaryRange(form);
  const meta = [
    WORKPLACE_MODEL_LABELS[form.workplaceModel],
    form.experienceLevel,
    form.employmentType,
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label="Job posting preview"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col gap-5 rounded-xl border border-[#e2e8f0] bg-card p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="info">Preview only</Badge>
            <Badge tone={statusTone(status)}>{JOB_STATUS_LABELS[status]}</Badge>
          </div>
          <button type="button" aria-label="Close preview" onClick={onClose} className={buttonClass('ghost')}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div>
          <h2 className="m-0 text-headline-lg text-ink">{form.title.trim() || 'Untitled position'}</h2>
          <p className="m-0 mt-1 text-body-md text-ink-variant">
            {form.companyName.trim() || 'Company name'}
            {form.location.trim() ? ` • ${form.location.trim()}` : ''}
          </p>
          {meta.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meta.map((item) => (
                <span key={item} className="rounded-full bg-surface-low px-2.5 py-0.5 text-label-sm text-ink-variant">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {salary && (
            <span className="rounded-full bg-surface-low px-2.5 py-0.5 font-mono text-label-sm text-ink">{salary}</span>
          )}
          {form.equityBand.trim() && (
            <span className="rounded-full bg-surface-low px-2.5 py-0.5 font-mono text-label-sm text-ink">
              {form.equityBand.trim()}
            </span>
          )}
          {form.annualBonus.trim() && (
            <span className="rounded-full bg-surface-low px-2.5 py-0.5 font-mono text-label-sm text-ink">
              {form.annualBonus.trim()}
            </span>
          )}
          {form.aiScreeningEnabled && (
            <span className="rounded-full bg-info px-2.5 py-0.5 text-label-sm text-info-text">AI Screening</span>
          )}
        </div>

        <div>
          <h3 className="m-0 text-headline-sm text-ink">Role Summary & Key Responsibilities</h3>
          {description ? (
            isRichTextHtml(description) ? (
              <div
                className={`mt-2 text-body-md leading-relaxed text-ink ${richTextContentClass}`}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="m-0 mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-ink">{description}</p>
            )
          ) : (
            <p className="m-0 mt-2 text-body-sm text-ink-variant">No role summary yet.</p>
          )}
        </div>

        {form.requiredSkills.length > 0 && (
          <div>
            <h3 className="m-0 text-headline-sm text-ink">Required Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.requiredSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-surface-low px-2.5 py-0.5 text-label-md text-ink">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-4">
          <span className="text-label-sm text-outline-strong">Preview only - Quick Apply is disabled.</span>
          <button type="button" disabled className={buttonClass('primary')}>Quick Apply</button>
        </div>
      </div>
    </div>
  );
};

const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveJob, fetchJobDetail, submitJob, error } = useEmployerJobController();

  const parsedId = id != null && id !== '' ? Number(id) : null;
  const routeJobId = parsedId != null && Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  const invalidRouteId = Boolean(id) && routeJobId == null;
  const isEdit = Boolean(id);

  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<JobStatus>('DRAFT');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [employerName, setEmployerName] = useState('');
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const formRef = useRef<JobFormState>(form);
  const jobIdRef = useRef<number | null>(null);
  const statusRef = useRef<JobStatus>('DRAFT');
  const hydratedRef = useRef(!isEdit);
  const submittingRef = useRef(false);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const createdIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const enqueueSaveRef = useRef<(mode: SaveMode) => Promise<boolean>>(() => Promise.resolve(false));
  const stepFlowRef = useRef(false);
  const submitFlowRef = useRef(false);

  const readOnly = status === 'PENDING_APPROVAL';
  const formLocked = readOnly || submitting;
  const canSubmit = status === 'DRAFT';

  const patch = (changes: Partial<JobFormState>) => {
    const next = { ...formRef.current, ...changes };
    formRef.current = next;
    setForm(next);
    versionRef.current += 1;
    dirtyRef.current = true;
    setDirty(true);
    setSaveState('idle');
    setErrors((previous) => {
      const cleared = { ...previous };
      Object.keys(changes).forEach((key) => delete cleared[key]);
      if ('salaryMin' in changes || 'salaryMax' in changes) {
        delete cleared.salaryMin;
        delete cleared.salaryMax;
      }
      if ('aiScreeningEnabled' in changes) {
        delete cleared.aiScreeningTrack;
        delete cleared.aiScreeningPassScore;
      }
      return cleared;
    });
  };

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    patch({ [key]: value } as Partial<JobFormState>);
  };

  const performSave = useCallback(async (mode: SaveMode): Promise<boolean> => {
    if (
      !mountedRef.current
      || !hydratedRef.current
      || statusRef.current === 'PENDING_APPROVAL'
      || submittingRef.current
      || savingRef.current
    ) {
      return false;
    }

    const targetJobId = jobIdRef.current;
    if (mode === 'auto') {
      if (targetJobId == null) return false;
      if (versionRef.current === savedVersionRef.current) return false;
    } else if (targetJobId != null && versionRef.current === savedVersionRef.current) {
      return true;
    }

    if (!isFormValid(formRef.current)) return false;

    const payloadVersion = versionRef.current;
    savingRef.current = true;
    setSaving(true);
    setSaveState('saving');

    const saved = await saveJob(targetJobId, buildPayload(formRef.current));

    savingRef.current = false;
    if (!mountedRef.current) return false;
    setSaving(false);

    if (!saved) {
      setSaveState('error');
      return false;
    }

    if (targetJobId == null) {
      jobIdRef.current = saved.id;
      createdIdRef.current = saved.id;
      setJobId(saved.id);
      navigate(`/jobs/${saved.id}/edit`, { replace: true });
    }

    statusRef.current = saved.status;
    setStatus(saved.status);
    if (saved.createdAt) setCreatedAt(saved.createdAt);
    if (saved.employerName) setEmployerName(saved.employerName);
    setReviewNote(saved.reviewNote ?? null);
    savedVersionRef.current = payloadVersion;
    setLastSavedAt(new Date());
    setSaveState('saved');

    const stillDirty = versionRef.current !== savedVersionRef.current;
    dirtyRef.current = stillDirty;
    setDirty(stillDirty);

    if (stillDirty && mode === 'auto') {
      void enqueueSaveRef.current('auto');
    }

    return true;
  }, [navigate, saveJob]);

  const enqueueSave = useCallback((mode: SaveMode): Promise<boolean> => {
    const run = () => performSave(mode);
    const next = saveQueueRef.current.then(run, run);
    saveQueueRef.current = next.then(() => undefined, () => undefined);
    return next;
  }, [performSave]);

  useEffect(() => {
    enqueueSaveRef.current = enqueueSave;
  }, [enqueueSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (invalidRouteId) {
      setLoadError('Invalid job posting id.');
      setLoadFailed(true);
      return;
    }

    if (routeJobId == null) {
      createdIdRef.current = null;
      if (jobIdRef.current !== null) {
        const fresh = emptyForm();
        formRef.current = fresh;
        setForm(fresh);
        jobIdRef.current = null;
        setJobId(null);
        statusRef.current = 'DRAFT';
        setStatus('DRAFT');
        setCreatedAt(null);
        setEmployerName('');
        setReviewNote(null);
        setLastSavedAt(null);
        versionRef.current = 0;
        savedVersionRef.current = 0;
        dirtyRef.current = false;
        setDirty(false);
        setSaveState('idle');
        setErrors({});
        setJustSubmitted(false);
        setStep(0);
      }
      hydratedRef.current = true;
      setHydrated(true);
      return;
    }

    if (createdIdRef.current === routeJobId) {
      createdIdRef.current = null;
      hydratedRef.current = true;
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setLoadFailed(false);
    setLoadError('');
    setHydrated(false);
    hydratedRef.current = false;

    fetchJobDetail(routeJobId).then((job) => {
      if (cancelled) return;
      if (!job) {
        setLoadFailed(true);
        return;
      }

      const mapped = jobToForm(job);
      formRef.current = mapped;
      setForm(mapped);
      jobIdRef.current = job.id;
      setJobId(job.id);
      statusRef.current = job.status;
      setStatus(job.status);
      setCreatedAt(job.createdAt);
      setEmployerName(job.employerName);
      setReviewNote(job.reviewNote ?? null);
      setLastSavedAt(parseServerTimestamp(job.updatedAt) ?? parseServerTimestamp(job.createdAt));
      versionRef.current = 0;
      savedVersionRef.current = 0;
      dirtyRef.current = false;
      setDirty(false);
      setSaveState('idle');
      setErrors({});
      setJustSubmitted(false);
      setStep(0);
      hydratedRef.current = true;
      setHydrated(true);
    });

    return () => { cancelled = true; };
  }, [routeJobId, invalidRouteId, fetchJobDetail]);

  useEffect(() => {
    if (!hydrated || readOnly || submitting || !jobId || !dirty) return;
    if (!isFormValid(form)) return;
    const timer = window.setTimeout(() => { void enqueueSaveRef.current('auto'); }, AUTO_SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [form, hydrated, readOnly, submitting, jobId, dirty]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSave = async () => {
    if (readOnly) return;
    const nextErrors = validateForm(formRef.current);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(firstErrorStep(nextErrors));
      return;
    }
    await enqueueSave('explicit');
  };

  const handleContinue = async () => {
    if (readOnly || stepFlowRef.current) return;
    stepFlowRef.current = true;
    try {
      const stepErrors = validateForm(formRef.current, step);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;

      if (!jobIdRef.current || dirtyRef.current) {
        const allErrors = validateForm(formRef.current);
        if (Object.keys(allErrors).length > 0) {
          setErrors(allErrors);
          setStep(firstErrorStep(allErrors));
          return;
        }
        const saved = await enqueueSave('explicit');
        if (!saved) return;
      }
      setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
    } finally {
      stepFlowRef.current = false;
    }
  };

  const handleBack = async () => {
    if (step === 0 || stepFlowRef.current || submitting) return;
    stepFlowRef.current = true;
    try {
      if (jobIdRef.current && dirtyRef.current) {
        await enqueueSave('explicit');
      }
      setStep((current) => Math.max(current - 1, 0));
    } finally {
      stepFlowRef.current = false;
    }
  };

  const handleSubmit = async () => {
    if (readOnly || submitFlowRef.current) return;
    const nextErrors = validateForm(formRef.current);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(firstErrorStep(nextErrors));
      return;
    }

    const confirmed = window.confirm(
      'Submit this posting for admin review? Editing will be locked until an admin reviews it.',
    );
    if (!confirmed) return;

    submitFlowRef.current = true;
    setSubmitting(true);
    try {
      if (dirtyRef.current || !jobIdRef.current) {
        const saved = await enqueueSave('explicit');
        if (!saved) return;
      }

      const targetJobId = jobIdRef.current;
      if (!targetJobId) return;

      submittingRef.current = true;
      const submitted = await submitJob(targetJobId);
      submittingRef.current = false;
      if (!mountedRef.current) return;

      if (!submitted) return;

      statusRef.current = submitted.status;
      setStatus(submitted.status);
      setReviewNote(submitted.reviewNote ?? null);
      setJustSubmitted(true);
      setLastSavedAt(parseServerTimestamp(submitted.updatedAt) ?? new Date());
      versionRef.current = 0;
      savedVersionRef.current = 0;
      dirtyRef.current = false;
      setDirty(false);
      setSaveState('idle');
    } finally {
      submitFlowRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const saveLabel = status === 'PENDING_APPROVAL'
    ? justSubmitted
      ? 'Submitted for review'
      : 'Locked for review'
    : saving
      ? 'Saving...'
      : saveState === 'error'
        ? 'Save failed'
        : dirty
          ? 'Unsaved changes'
          : lastSavedAt
            ? `Auto-saved ${formatSavedAgo(lastSavedAt, now)}`
            : 'Not saved yet';

  const reqCode = jobId
    ? `REQ-${(parseServerTimestamp(createdAt) ?? new Date()).getFullYear()}-${jobId}`
    : 'NEW';

  const hiringManager = employerName || user?.fullName || 'Hiring team';
  const focusOptions = [
    ...FOCUS_AREAS,
    ...form.aiQuestionFocusAreas
      .filter((area) => !FOCUS_AREAS.some((fixed) => fixed.title === area))
      .map((title) => ({ title, hint: '' })),
  ];

  const toggleFocusArea = (title: string) => {
    const current = form.aiQuestionFocusAreas;
    updateField(
      'aiQuestionFocusAreas',
      current.includes(title) ? current.filter((area) => area !== title) : [...current, title],
    );
  };

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-[#e2e8f0] bg-surface/95 px-4 py-2.5 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <nav className="flex flex-wrap items-center gap-1.5 text-label-sm text-ink-variant">
              <Link to="/dashboard" className="text-ink-variant no-underline transition-colors hover:text-primary">
                Employer Workspace
              </Link>
              <span>/</span>
              <Link to="/my-jobs" className="text-ink-variant no-underline transition-colors hover:text-primary">
                Job Postings
              </Link>
              <span>/</span>
              <span className="text-ink">{isEdit ? 'Edit Job Posting' : 'Create New Position'}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-headline-lg text-ink">
                {isEdit ? 'Edit Job Posting' : 'Create Job Posting'}
              </h1>
              <Badge tone={saveState === 'error' ? 'danger' : statusTone(status)} dot pill>
                {JOB_STATUS_LABELS[status]} • {saveLabel}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPreviewOpen(true)} className={buttonClass('secondary')}>
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Preview
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => { void handleSave(); }}
                disabled={saving || submitting}
                className={buttonClass('secondary')}
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Save Draft
              </button>
            )}
            {!readOnly && canSubmit && (
              <button
                type="button"
                onClick={() => { void handleSubmit(); }}
                disabled={saving || submitting}
                className={buttonClass('primary')}
              >
                {submitting ? 'Submitting...' : 'Submit for Admin Review'}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl pt-4">
        {!hydrated && !loadFailed && <LoadingState label="Loading job posting..." />}

        {loadFailed && (
          <div className="flex flex-col gap-3 py-8">
            <ErrorBanner message={loadError || error || 'Failed to load the job posting'} />
            <Link to="/my-jobs" className="self-start text-label-md text-primary no-underline hover:underline">
              ← Back to My Job Postings
            </Link>
          </div>
        )}

        {hydrated && !loadFailed && (
          <>
            <Stepper step={step} />

            <div className="pt-4">
              <ErrorBanner message={error} />

              {reviewNote && status === 'DRAFT' && (
                <div
                  className="mb-4 flex items-start gap-2 rounded-lg bg-[#fffbeb] px-3 py-2.5 text-body-sm text-[#92400e]"
                  role="status"
                >
                  {/* amber-50 / amber-800: mockup warning tone, no token yet */}
                  <span className="material-symbols-outlined shrink-0 text-[18px]">rate_review</span>
                  <div>
                    <strong className="block">Changes requested</strong>
                    <span className="whitespace-pre-wrap">{reviewNote}</span>
                  </div>
                </div>
              )}

              {status === 'PENDING_APPROVAL' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-[#fffbeb] px-3 py-2.5 text-body-sm text-[#92400e]" role="status">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">hourglass_top</span>
                  <span>
                    {justSubmitted
                      ? 'Submitted for admin review. This posting is now read-only until an admin reviews it.'
                      : 'Awaiting admin review. This posting is read-only until an admin approves or returns it.'}
                  </span>
                </div>
              )}

              {status === 'OPEN' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-info px-3 py-2.5 text-body-sm text-info-text" role="status">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">public</span>
                  <span>This posting is live. Changes are saved immediately and visible to candidates.</span>
                </div>
              )}

              {status === 'CLOSED' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-low px-3 py-2.5 text-body-sm text-ink-variant" role="status">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">lock</span>
                  <span>This posting is closed. Edits are saved to the posting; reopen it from My Job Postings.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 items-start gap-6 pt-2 lg:grid-cols-12">
              <form
                onSubmit={(event) => event.preventDefault()}
                className="flex flex-col gap-6 lg:col-span-8"
              >
                {step === 0 && (
                  <>
                    <Section
                      icon="badge"
                      title="Position Identity"
                      description="Primary job nomenclature and organizational alignment."
                      aside={<span className="rounded bg-surface-low px-2 py-0.5 font-mono text-label-sm text-ink-variant">{reqCode}</span>}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label="Job Title"
                          required
                          hint="High visibility title recommended"
                          error={errors.title}
                          className="md:col-span-2"
                        >
                          <input
                            value={form.title}
                            onChange={(event) => updateField('title', event.target.value)}
                            disabled={formLocked}
                            placeholder="e.g. Lead SRE / Infrastructure Architect"
                            aria-invalid={Boolean(errors.title)}
                            className={`${disabledInputClass} ${errors.title ? 'border-error' : ''}`}
                          />
                        </Field>

                        <Field label="Company Name" required error={errors.companyName}>
                          <input
                            value={form.companyName}
                            onChange={(event) => updateField('companyName', event.target.value)}
                            disabled={formLocked}
                            placeholder="Company shown on the posting"
                            aria-invalid={Boolean(errors.companyName)}
                            className={`${disabledInputClass} ${errors.companyName ? 'border-error' : ''}`}
                          />
                        </Field>

                        <Field label="Department">
                          <select
                            value={form.department}
                            onChange={(event) => updateField('department', event.target.value)}
                            disabled={formLocked}
                            className={disabledInputClass}
                          >
                            <option value="">Select department</option>
                            {form.department && !DEPARTMENTS.includes(form.department) && (
                              <option value={form.department}>{form.department}</option>
                            )}
                            {DEPARTMENTS.map((department) => (
                              <option key={department} value={department}>{department}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Experience Level">
                          <select
                            value={form.experienceLevel}
                            onChange={(event) => updateField('experienceLevel', event.target.value)}
                            disabled={formLocked}
                            className={disabledInputClass}
                          >
                            <option value="">Select experience level</option>
                            {form.experienceLevel && !EXPERIENCE_LEVELS.includes(form.experienceLevel) && (
                              <option value={form.experienceLevel}>{form.experienceLevel}</option>
                            )}
                            {EXPERIENCE_LEVELS.map((level) => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Employment Type">
                          <select
                            value={form.employmentType}
                            onChange={(event) => updateField('employmentType', event.target.value)}
                            disabled={formLocked}
                            className={disabledInputClass}
                          >
                            <option value="">Select employment type</option>
                            {form.employmentType && !EMPLOYMENT_TYPES.includes(form.employmentType) && (
                              <option value={form.employmentType}>{form.employmentType}</option>
                            )}
                            {EMPLOYMENT_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Hiring Manager">
                          <div className="flex h-9 items-center gap-2 rounded-md bg-surface-low px-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-on-primary">
                              {initialsOf(hiringManager) || 'HR'}
                            </span>
                            <span className="truncate text-body-md text-ink">{hiringManager}</span>
                          </div>
                        </Field>
                      </div>
                    </Section>

                    <Section
                      icon="location_on"
                      title="Work Location & Regional Policy"
                      description="Define physical presence requirements and permissible time zones."
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-label-md font-medium text-ink">Workplace Model</span>
                        <div className="grid grid-cols-1 gap-1 rounded-xl bg-surface-low p-1 sm:grid-cols-3">
                          {WORKPLACE_OPTIONS.map((option) => {
                            const active = form.workplaceModel === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled={formLocked}
                                onClick={() => updateField('workplaceModel', option.value)}
                                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-label-md transition-colors disabled:cursor-not-allowed ${
                                  active
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-ink-variant hover:text-ink'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Primary Base Location">
                          <input
                            value={form.location}
                            onChange={(event) => updateField('location', event.target.value)}
                            disabled={formLocked}
                            placeholder="e.g. San Francisco, CA (or Remote US/Canada)"
                            className={disabledInputClass}
                          />
                        </Field>
                        <Field
                          label="Timezone Requirement"
                          error={errors.timezoneRequirement}
                          hint={`${form.timezoneRequirement.length}/100`}
                        >
                          <input
                            value={form.timezoneRequirement}
                            onChange={(event) => updateField('timezoneRequirement', event.target.value)}
                            disabled={formLocked}
                            maxLength={100}
                            placeholder="e.g. PST / EST core overlap +/- 3 hrs"
                            className={`${disabledInputClass} ${errors.timezoneRequirement ? 'border-error' : ''}`}
                          />
                        </Field>
                      </div>
                    </Section>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Section
                      icon="terminal"
                      title="Core Technical Stack & Skills"
                      description="These tags drive candidate matching and screening topics."
                      aside={<span className="text-label-sm text-outline-strong">{form.requiredSkills.length} tags configured</span>}
                    >
                      <SkillTags
                        values={form.requiredSkills}
                        onChange={(values) => updateField('requiredSkills', values)}
                        disabled={formLocked}
                      />
                    </Section>

                    <Section
                      icon="edit_document"
                      title="Role Summary & Key Responsibilities"
                      description="Describe the role, responsibilities, and what success looks like."
                    >
                      <RichTextEditor
                        value={form.description}
                        onChange={(value) => updateField('description', value)}
                        disabled={formLocked}
                      />
                    </Section>
                  </>
                )}

                {step === 2 && (
                  <Section
                    icon="payments"
                    title="Compensation & Pay Transparency"
                    description="Set a transparent salary band and incentive details."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Currency">
                        <select
                          value={form.salaryCurrency}
                          onChange={(event) => updateField('salaryCurrency', event.target.value)}
                          disabled={formLocked}
                          className={disabledInputClass}
                        >
                          {form.salaryCurrency && !CURRENCIES.some((currency) => currency.value === form.salaryCurrency) && (
                            <option value={form.salaryCurrency}>{form.salaryCurrency}</option>
                          )}
                          {CURRENCIES.map((currency) => (
                            <option key={currency.value} value={currency.value}>{currency.label}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Minimum Base Salary" error={errors.salaryMin}>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={form.salaryMin}
                          onChange={(event) => updateField('salaryMin', event.target.value)}
                          disabled={formLocked}
                          placeholder="e.g. 165000"
                          aria-invalid={Boolean(errors.salaryMin)}
                          className={`${disabledInputClass} ${errors.salaryMin ? 'border-error' : ''}`}
                        />
                      </Field>

                      <Field label="Maximum Base Salary" error={errors.salaryMax}>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={form.salaryMax}
                          onChange={(event) => updateField('salaryMax', event.target.value)}
                          disabled={formLocked}
                          placeholder="e.g. 210000"
                          aria-invalid={Boolean(errors.salaryMax)}
                          className={`${disabledInputClass} ${errors.salaryMax ? 'border-error' : ''}`}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Equity / Stock Grant Band">
                        <input
                          value={form.equityBand}
                          onChange={(event) => updateField('equityBand', event.target.value)}
                          disabled={formLocked}
                          maxLength={200}
                          placeholder="e.g. 0.05% - 0.15% (RSUs or ISOs)"
                          className={disabledInputClass}
                        />
                      </Field>
                      <Field label="Annual Incentive Bonus">
                        <input
                          value={form.annualBonus}
                          onChange={(event) => updateField('annualBonus', event.target.value)}
                          disabled={formLocked}
                          maxLength={200}
                          placeholder="e.g. 15% Performance Target"
                          className={disabledInputClass}
                        />
                      </Field>
                    </div>
                  </Section>
                )}

                {step === 3 && (
                  <Section
                    icon="neurology"
                    title="AI Autonomous Screening Engine"
                    description="Configure the screening track and evaluation focus areas."
                    aside={
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm text-ink-variant">
                          {form.aiScreeningEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.aiScreeningEnabled}
                          aria-label="Enable AI screening"
                          disabled={formLocked}
                          onClick={() => updateField('aiScreeningEnabled', !form.aiScreeningEnabled)}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
                            form.aiScreeningEnabled ? 'bg-primary' : 'bg-surface-high'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                              form.aiScreeningEnabled ? 'left-[22px]' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    }
                  >
                    <div className={`flex flex-col gap-5 ${form.aiScreeningEnabled ? '' : 'opacity-60'}`}>
                      <div className="flex flex-col gap-2">
                        <span className="text-label-md font-medium text-ink">Screening Track & Format</span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {TRACK_OPTIONS.map((track) => {
                            const selected = form.aiScreeningTrack === track;
                            return (
                              <label
                                key={track}
                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                                  selected ? 'border-primary bg-surface-low' : 'border-[#e2e8f0] bg-card'
                                } ${!form.aiScreeningEnabled || formLocked ? 'cursor-not-allowed' : 'hover:bg-surface-low'}`}
                              >
                                <input
                                  type="radio"
                                  name="screeningTrack"
                                  className="mt-0.5 accent-primary"
                                  checked={selected}
                                  disabled={!form.aiScreeningEnabled || formLocked}
                                  onChange={() => updateField('aiScreeningTrack', track)}
                                />
                                <span className="text-body-sm text-ink">{AI_SCREENING_TRACK_LABELS[track]}</span>
                              </label>
                            );
                          })}
                        </div>
                        {errors.aiScreeningTrack && (
                          <p className="m-0 text-label-sm text-error">{errors.aiScreeningTrack}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-label-md font-medium text-ink">Passing Score Threshold</span>
                          <span className="rounded bg-surface-low px-2 py-0.5 font-mono text-label-md font-semibold text-primary">
                            {form.aiScreeningPassScore} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min={MIN_SCORE}
                          max={MAX_SCORE}
                          step={1}
                          value={form.aiScreeningPassScore}
                          onChange={(event) => updateField('aiScreeningPassScore', Number(event.target.value))}
                          disabled={!form.aiScreeningEnabled || formLocked}
                          className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-high accent-primary disabled:cursor-not-allowed"
                          aria-label="Passing score threshold"
                        />
                        <div className="flex justify-between px-0.5 text-label-sm text-outline-strong">
                          <span>{MIN_SCORE} (Permissive)</span>
                          <span>80 (Recommended)</span>
                          <span>{MAX_SCORE} (Strict)</span>
                        </div>
                        {errors.aiScreeningPassScore && (
                          <p className="m-0 text-label-sm text-error">{errors.aiScreeningPassScore}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-label-md font-medium text-ink">
                          Dynamic Question Focus Areas (Multi-select)
                        </span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {focusOptions.map((area) => (
                            <label
                              key={area.title}
                              className={`flex items-start gap-2.5 rounded-lg bg-surface-low p-3 ${
                                !form.aiScreeningEnabled || formLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface-mid'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 accent-primary"
                                checked={form.aiQuestionFocusAreas.includes(area.title)}
                                disabled={!form.aiScreeningEnabled || formLocked}
                                onChange={() => toggleFocusArea(area.title)}
                              />
                              <div className="flex flex-col">
                                <span className="text-body-md font-medium text-ink">{area.title}</span>
                                {area.hint && <span className="text-label-sm text-outline-strong">{area.hint}</span>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[0.5rem] border border-[#e2e8f0] bg-card px-6 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                  <button
                    type="button"
                    onClick={() => { void handleBack(); }}
                    disabled={step === 0 || submitting}
                    className={buttonClass('ghost')}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    {step === 0 ? 'Back' : `Back to Step ${step}`}
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {readOnly ? (
                      <span className="text-label-sm text-ink-variant">Locked while awaiting admin review.</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { void handleSave(); }}
                          disabled={saving || submitting}
                          className={buttonClass('secondary')}
                        >
                          Save Draft
                        </button>
                        {step < STEP_TITLES.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => { void handleContinue(); }}
                            disabled={saving || submitting}
                            className={buttonClass('primary')}
                          >
                            Continue to Step {step + 2}
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        ) : canSubmit ? (
                          <button
                            type="button"
                            onClick={() => { void handleSubmit(); }}
                            disabled={saving || submitting}
                            className={buttonClass('primary')}
                          >
                            {submitting ? 'Submitting...' : 'Submit for Admin Review'}
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </form>

              <aside className="lg:col-span-4 lg:sticky lg:top-36">
                <LivePreviewCard form={form} status={status} createdAt={createdAt} now={now} />
              </aside>
            </div>
          </>
        )}
      </div>

      {previewOpen && (
        <PreviewModal form={form} status={status} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
};

export default JobFormPage;
