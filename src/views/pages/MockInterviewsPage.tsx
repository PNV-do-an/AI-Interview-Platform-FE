import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';
import { INTERVIEW_MODE_LABELS, InterviewMode, InterviewSession } from '../../models/Interview.model';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

// "Completed N days ago" dẫn xuất từ completedAt/createdAt thật (không hardcode).
const relativeDays = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'Completed today';
  if (days === 1) return 'Completed 1 day ago';
  return `Completed ${days} days ago`;
};

const sessionTitle = (s: InterviewSession): string =>
  s.mode === 'MOCK' ? (s.jobTitle ?? 'Mock interview') : (s.topic ?? 'Knowledge practice');

// Link "Luyện AI theo JD" từ màn Đơn ứng tuyển gửi ?jobId= -> prefill form.
const toPositiveInt = (raw: string | null): number | '' => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : '';
};

const MockInterviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessions, loading, error, successMsg, startSession, fetchMySessions } = useMockInterviewController();
  const { jobs, fetchJobs, jobDetail, fetchJobDetail } = useJobController();

  const [mode, setMode] = useState<InterviewMode>('MOCK');
  const [jobId, setJobId] = useState<number | ''>(() => toPositiveInt(searchParams.get('jobId')));
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMySessions(0);
      fetchJobs(0, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // jobId từ query có thể nằm ngoài trang 1 của danh sách -> tải riêng để hiện nhãn.
  const jobInList = (jobs?.content ?? []).some((j) => j.id === jobId);
  useEffect(() => {
    if (jobId !== '' && jobs && !jobInList) fetchJobDetail(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, jobs]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = await startSession({
      mode,
      jobId: mode === 'MOCK' && jobId !== '' ? Number(jobId) : undefined,
      topic: mode === 'KNOWLEDGE' ? topic : undefined,
      questionCount,
    });
    if (session) navigate(`/mock-interviews/${session.id}`);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className="p-10 text-body-md text-ink-variant">
        Please sign in with a candidate account.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
      {/* Header: breadcrumb + title + description (nguyên văn nhãn tiếng Anh của mockup) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-label-sm text-outline-strong">
          <span>Candidate Core</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Growth &amp; Preparation</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-medium text-primary">Skills Hub &amp; Practice</span>
        </div>
        <h1 className="m-0 text-display-mobile text-ink sm:text-display">Skills Hub &amp; Interactive AI Practice</h1>
        <p className="m-0 max-w-3xl text-body-md text-ink-variant">
          Sharpen your technical interview readiness with simulated live coding challenges, system design
          architectural whiteboards, and sub-second synthesized AI feedback.
        </p>
      </div>

      {/* Start new session (giữ 100% logic cũ) */}
      <Card className="bg-surface-low">
        <h3 className="m-0 mb-4 text-headline-md text-ink">Start a New Session</h3>
        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Practice Mode</label>
            <select
              className={inputClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
            >
              {Object.entries(INTERVIEW_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {mode === 'MOCK' && (
            <div>
              <label className={labelClass}>Job Posting</label>
              <select className={inputClass} value={jobId} onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Select a job posting —</option>
                {jobId !== '' && !jobInList && jobDetail?.id === jobId && (
                  <option value={jobId}>{jobDetail.title} — {jobDetail.companyName}</option>
                )}
                {jobs?.content.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.companyName}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'KNOWLEDGE' && (
            <div>
              <label className={labelClass}>Practice Topic</label>
              <input
                className={inputClass}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Java Spring Boot, React, SQL..."
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Number of Questions (3-10)</label>
            <input
              className={`${inputClass} max-w-[120px] tabular-nums`}
              type="number"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={buttonClass('primary', 'gap-1')}>
              <span>Launch Live Simulation</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            {/* Device check đã rời sidebar theo chốt 22/10 -> giữ đường vào thật từ đây. */}
            <Link
              to="/device-check"
              className={`${buttonClass('secondary', 'gap-1 no-underline')}`}
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>Check camera &amp; mic</span>
            </Link>
          </div>
        </form>
        <div className="mt-3">
          <ErrorBanner message={error} />
          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text">
              <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Mock Sessions & Diagnostic History — chỉ field có trong model */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="m-0 text-headline-md text-ink">Recent Mock Sessions &amp; Diagnostic History</h3>
            <p className="m-0 text-body-sm text-ink-variant">Deep-dive telemetry transcripts and synthetic proctor scorecards.</p>
          </div>
          {sessions && sessions.totalElements > 0 && (
            <span className="text-label-sm text-ink-variant tabular-nums">
              Showing {sessions.content.length} of {sessions.totalElements} sessions
            </span>
          )}
        </div>

        {loading && <LoadingState />}
        {!sessions || sessions.content.length === 0 ? (
          <EmptyState icon="smart_toy" title="No mock sessions yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.content.map((s) => {
              const done = s.status === 'COMPLETED';
              return (
                <Card key={s.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        {s.mode === 'MOCK' ? 'code_blocks' : 'psychology'}
                      </span>
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[12px] font-medium text-primary">#{s.mode === 'MOCK' ? 'MOCK' : 'KNOW'}-{s.id}</span>
                        <span className="text-outline-strong">•</span>
                        <span className="text-label-sm text-ink-variant">
                          {done ? relativeDays(s.completedAt ?? s.createdAt) : `In progress · ${s.answeredCount}/${s.questions.length} answered`}
                        </span>
                      </div>
                      <h5 className="m-0 mt-0.5 truncate text-headline-sm text-ink">{sessionTitle(s)}</h5>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 self-end md:self-center">
                    {s.overallScore != null ? (
                      <div className="flex flex-col items-end">
                        <span className="text-headline-md font-semibold text-primary tabular-nums">{s.overallScore} / 100</span>
                        {done && <Badge tone="success">Completed</Badge>}
                      </div>
                    ) : (
                      <Badge tone={done ? 'success' : 'info'}>{done ? 'Completed' : 'In progress'}</Badge>
                    )}
                    <Link
                      to={done ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                      className={buttonClass(done ? 'secondary' : 'primary', 'no-underline whitespace-nowrap')}
                    >
                      {done ? 'View Detailed Feedback' : 'Continue'}
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewsPage;
