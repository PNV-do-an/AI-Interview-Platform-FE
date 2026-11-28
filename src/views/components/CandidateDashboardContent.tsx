import React from 'react';
import { Link } from 'react-router-dom';
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type CandidateProfile,
  type JobSummary,
} from '../../models/Program.model';
import { INTERVIEW_MODE_LABELS, type InterviewSession } from '../../models/Interview.model';
import { parseServerTimestamp } from '../../utils/date';
import { EmptyBlock, ErrorBlock, LoadingBlock, Pill } from './adminKit';
import { ICON } from './candidateKit';

export interface UpcomingInterview {
  application: Application;
  start: Date;
  end: Date | null;
}

interface CandidateDashboardContentProps {
  fullName?: string;
  applications: Application[];
  applicationsTotal: number;
  nextInterview: UpcomingInterview | null;
  upcomingInterviewsCount: number;
  sessions: InterviewSession[];
  sessionsTotal: number;
  averageScore: number | null;
  scoredSessionsCount: number;
  jobs: JobSummary[];
  profile: CandidateProfile | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const getFirstName = (name?: string) => name?.trim().split(/\s+/).filter(Boolean).at(-1) || 'bạn';

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 70) return 'Khá tốt';
  if (score >= 50) return 'Cần cải thiện';
  return 'Cần cố gắng';
};

const getMonogram = (name?: string) =>
  (name || '-')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '-';

const CardHeading: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-space-sm">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 text-ds-label-sm font-bold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
      <h2 className="m-0 text-ds-headline-md font-bold tracking-tight text-on-surface">{title}</h2>
      {description && <p className="mt-1 text-ds-body-sm text-on-surface-variant">{description}</p>}
    </div>
    {action}
  </div>
);

const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  note: string;
  icon: string;
  accent: string;
}> = ({ label, value, note, icon, accent }) => (
  <section className="flex min-h-36 flex-col justify-between rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
    <div className="flex items-center justify-between gap-2">
      <span className="text-ds-label-md font-semibold text-on-surface-variant">{label}</span>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`} aria-hidden="true">
        <span className={`${ICON} text-[20px]`}>{icon}</span>
      </span>
    </div>
    <div>
      <p className="m-0 text-ds-headline-xl font-bold tracking-tight text-on-surface tabular-nums">{value}</p>
      <p className="mt-1 text-ds-body-sm text-on-surface-variant">{note}</p>
    </div>
  </section>
);

const ProfileReadiness: React.FC<{ profile: CandidateProfile | null }> = ({ profile }) => {
  const fields = [
    { label: 'CV đã tải lên', complete: Boolean(profile?.cvFileName) },
    { label: 'Mục tiêu nghề nghiệp', complete: Boolean(profile?.careerGoal?.trim()) },
    { label: 'Tóm tắt hồ sơ', complete: Boolean(profile?.summary?.trim()) },
    { label: 'Kỹ năng', complete: Boolean(profile?.skills?.trim()) },
    { label: 'Kinh nghiệm', complete: typeof profile?.experienceYears === 'number' },
  ];
  const completed = fields.filter((field) => field.complete).length;
  const progress = Math.round((completed / fields.length) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-space-md sm:p-space-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-ds-label-sm font-bold uppercase tracking-[0.12em] text-secondary-container">Hồ sơ của bạn</p>
          <p className="mt-2 text-ds-headline-sm font-bold text-inverse-on-surface">{completed}/{fields.length} mục thông tin</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-secondary-container" aria-hidden="true">
          <span className={`${ICON} text-[21px]`}>assignment_ind</span>
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-label="Thông tin hồ sơ đã bổ sung"
        aria-valuemin={0}
        aria-valuemax={fields.length}
        aria-valuenow={completed}
      >
        <div className="h-full rounded-full bg-secondary-container transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <span key={field.label} className="flex items-center gap-2 text-ds-body-sm text-inverse-on-surface/85">
            <span className={`${ICON} text-[16px] ${field.complete ? 'text-secondary-container' : 'text-inverse-on-surface/40'}`} aria-hidden="true">
              {field.complete ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {field.label}
          </span>
        ))}
      </div>
      <Link
        to="/my-profile"
        className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-surface-container-lowest px-4 text-ds-label-md font-bold text-primary no-underline transition-colors hover:bg-primary-fixed"
      >
        {completed === fields.length ? 'Xem hồ sơ' : 'Hoàn thiện hồ sơ'}
        <span className={`${ICON} text-[17px]`} aria-hidden="true">arrow_forward</span>
      </Link>
    </div>
  );
};

const InterviewSpotlight: React.FC<{ interview: UpcomingInterview }> = ({ interview }) => {
  const { application, start, end } = interview;
  const minutesUntil = Math.max(0, Math.round((start.getTime() - Date.now()) / 60000));
  const countdown = minutesUntil === 0
    ? 'Đang diễn ra'
    : minutesUntil < 60
      ? `Còn ${minutesUntil} phút`
    : minutesUntil < 1440
      ? `Còn ${Math.floor(minutesUntil / 60)} giờ ${minutesUntil % 60} phút`
      : `Còn ${Math.floor(minutesUntil / 1440)} ngày`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-space-md sm:p-space-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-ds-label-sm font-bold uppercase tracking-[0.12em] text-secondary-container">Lịch tiếp theo</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-ds-label-sm font-semibold text-inverse-on-surface">
          <span className="size-1.5 rounded-full bg-secondary-container" aria-hidden="true" />
          {countdown}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-ds-headline-sm font-bold text-secondary-container" aria-hidden="true">
          {getMonogram(application.companyName)}
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-ds-label-lg font-bold text-inverse-on-surface">{application.companyName}</p>
          <p className="mt-0.5 truncate text-ds-body-sm text-inverse-on-surface/70">{application.jobTitle}</p>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-ds-body-sm text-inverse-on-surface/85">
        <span className={`${ICON} text-[18px] text-secondary-container`} aria-hidden="true">schedule</span>
        {timeFormat.format(start)}{end ? ` – ${timeFormat.format(end)}` : ''} · {dateFormat.format(start)}
      </p>
      <Link
        to="/my-interviews"
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 px-4 text-ds-label-md font-semibold text-inverse-on-surface no-underline transition-colors hover:bg-white/10"
      >
        Chuẩn bị cho buổi phỏng vấn
        <span className={`${ICON} text-[17px]`} aria-hidden="true">arrow_forward</span>
      </Link>
    </div>
  );
};

const DashboardHero: React.FC<{
  fullName?: string;
  nextInterview: UpcomingInterview | null;
  profile: CandidateProfile | null;
}> = ({ fullName, nextInterview, profile }) => (
  <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-inverse-surface via-inverse-surface to-primary-container p-space-md text-inverse-on-surface shadow-sm sm:p-space-xl">
    <div className="relative grid gap-space-lg lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)] lg:items-center">
      <div className="max-w-2xl py-1">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-ds-label-sm font-semibold text-inverse-on-surface/90">
          <span className={`${ICON} text-[16px] text-secondary-container`} aria-hidden="true">auto_awesome</span>
          AI Interview · Hành trình nghề nghiệp
        </span>
        <h2 className="mt-4 max-w-xl text-ds-headline-xl font-bold leading-tight tracking-tight text-inverse-on-surface sm:text-ds-display-sm">
          {nextInterview ? 'Tỏa sáng trong buổi phỏng vấn sắp tới' : 'Sẵn sàng cho bước tiếp theo?'}
        </h2>
        <p className="mt-3 max-w-xl text-ds-body-md text-inverse-on-surface/75 sm:text-ds-body-lg">
          {nextInterview
            ? `Bạn đã có lịch với ${nextInterview.application.companyName}. Ôn tập trước để bước vào buổi gặp thật tự tin.`
            : `Xin chào ${getFirstName(fullName)}. Hoàn thiện hồ sơ, khám phá việc làm và luyện tập để tiến gần hơn đến cơ hội phù hợp.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/mock-interviews" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary-container px-4 text-ds-label-md font-bold text-on-secondary-container no-underline transition-colors hover:brightness-95">
            <span className={`${ICON} text-[19px]`} aria-hidden="true">smart_toy</span>
            Luyện phỏng vấn AI
          </Link>
          <Link to="/jobs" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-ds-label-md font-semibold text-inverse-on-surface no-underline transition-colors hover:bg-white/10">
            Khám phá việc làm
            <span className={`${ICON} text-[18px]`} aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      </div>
      {nextInterview ? <InterviewSpotlight interview={nextInterview} /> : <ProfileReadiness profile={profile} />}
    </div>
  </section>
);

const StatusBadge: React.FC<{ application: Application }> = ({ application }) => {
  const tone = application.status === 'ACCEPTED'
    ? 'success'
    : application.status === 'REJECTED' || application.status === 'CANCELLED'
      ? 'danger'
      : application.status === 'SCHEDULED'
        ? 'primary'
        : 'warning';
  return <Pill tone={tone}>{APPLICATION_STATUS_LABELS[application.status]}</Pill>;
};

const ApplicationJourney: React.FC<{ application: Application }> = ({ application }) => {
  const labels = ['Đã nộp', 'Sơ loại', 'Phỏng vấn', 'Đánh giá', 'Kết quả'];
  const currentStepByStatus: Record<Application['status'], number> = {
    PENDING: 1,
    SCHEDULED: 2,
    INTERVIEWED: 3,
    ACCEPTED: 5,
    REJECTED: 4,
    CANCELLED: 4,
  };
  const currentStep = currentStepByStatus[application.status];
  const failed = application.status === 'REJECTED' || application.status === 'CANCELLED';

  return (
    <div className="grid grid-cols-5 gap-1.5" aria-label={`Tiến độ tuyển dụng: ${APPLICATION_STATUS_LABELS[application.status]}`}>
      {labels.map((label, index) => {
        const step = index + 1;
        const complete = step < currentStep || application.status === 'ACCEPTED';
        const isFailed = failed && step === currentStep;
        const active = !complete && !isFailed && step === currentStep;
        const color = complete ? 'bg-secondary-teal' : isFailed ? 'bg-error' : active ? 'bg-primary' : 'bg-surface-container-highest';
        const textColor = isFailed ? 'text-error' : active ? 'font-bold text-primary' : complete ? 'text-on-surface-variant' : 'text-outline';
        return (
          <div key={label} className="min-w-0 text-center">
            <div className={`h-1.5 rounded-full ${color}`} />
            <span className={`mt-1 block truncate text-[10px] leading-4 sm:text-ds-label-sm ${textColor}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

const ApplicationsPanel: React.FC<{
  applications: Application[];
  total: number;
  loading: boolean;
}> = ({ applications, total, loading }) => (
  <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
    <CardHeading
      eyebrow="Tiến độ tuyển dụng"
      title="Đơn ứng tuyển gần đây"
      description="Theo dõi trạng thái các cơ hội bạn đã ứng tuyển."
      action={<Link to="/my-applications" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-ds-label-md font-semibold text-primary no-underline hover:bg-primary-fixed">Tất cả {total}<span className={`${ICON} text-[16px]`} aria-hidden="true">arrow_forward</span></Link>}
    />
    <div className="mt-space-md flex flex-col gap-3">
      {loading && applications.length === 0 ? (
        <LoadingBlock label="Đang tải đơn ứng tuyển..." />
      ) : applications.length === 0 ? (
        <EmptyBlock
          icon="send"
          title="Bắt đầu hành trình ứng tuyển"
          description="Lưu lại những cơ hội phù hợp và theo dõi tiến độ ngay tại đây."
          action={<Link to="/jobs" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-ds-label-md font-bold text-on-primary no-underline hover:bg-primary-hover">Tìm việc làm</Link>}
        />
      ) : applications.slice(0, 4).map((application) => (
        <article key={application.id} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-ds-label-lg font-bold text-primary" aria-hidden="true">{getMonogram(application.companyName)}</span>
              <div className="min-w-0">
                <h3 className="m-0 truncate text-ds-label-lg font-bold text-on-surface">{application.jobTitle}</h3>
                <p className="mt-0.5 truncate text-ds-body-sm text-on-surface-variant">{application.companyName}</p>
              </div>
            </div>
            <StatusBadge application={application} />
          </div>
          <div className="mt-4">
            <ApplicationJourney application={application} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-ds-body-sm text-on-surface-variant">
            <span>Ứng tuyển {dateTimeFormat.format(parseServerTimestamp(application.createdAt) ?? new Date(application.createdAt))}</span>
            <Link to={`/jobs/${application.jobId}`} className="font-semibold text-primary no-underline hover:underline">Xem công việc</Link>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const PracticePanel: React.FC<{
  sessions: InterviewSession[];
  total: number;
  loading: boolean;
}> = ({ sessions, total, loading }) => (
  <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
    <CardHeading
      eyebrow="Luyện tập cùng AI"
      title="Phiên gần đây"
      description={`${total} phiên luyện tập`}
      action={<Link to="/mock-interviews/history" aria-label="Xem tất cả phiên luyện tập" className="flex size-9 items-center justify-center rounded-lg text-primary no-underline hover:bg-primary-fixed"><span className={`${ICON} text-[20px]`} aria-hidden="true">arrow_forward</span></Link>}
    />
    <div className="mt-space-md flex flex-col gap-2">
      {loading && sessions.length === 0 ? (
        <LoadingBlock label="Đang tải phiên luyện tập..." />
      ) : sessions.length === 0 ? (
        <EmptyBlock
          icon="smart_toy"
          title="Chưa có phiên luyện tập"
          description="Thử một buổi phỏng vấn mô phỏng để làm quen với câu hỏi thực tế."
          action={<Link to="/mock-interviews" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-ds-label-md font-bold text-on-primary no-underline hover:bg-primary-hover">Bắt đầu luyện tập</Link>}
        />
      ) : sessions.slice(0, 4).map((session) => {
        const completed = session.status === 'COMPLETED';
        const at = parseServerTimestamp(session.completedAt ?? session.createdAt);
        const to = completed ? `/mock-interviews/${session.id}/result` : `/mock-interviews/${session.id}`;
        return (
          <Link key={session.id} to={to} className="group flex items-center gap-3 rounded-xl border border-outline-variant/40 p-3 no-underline transition-colors hover:bg-surface-container-low/60">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container/40 text-secondary-teal" aria-hidden="true">
              <span className={`${ICON} text-[20px]`}>{session.mode === 'AVATAR' ? 'videocam' : 'psychology'}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ds-label-md font-bold text-on-surface group-hover:text-primary">{session.jobTitle || session.topic || INTERVIEW_MODE_LABELS[session.mode]}</span>
              <span className="mt-0.5 block text-ds-body-sm text-on-surface-variant">{at ? dateTimeFormat.format(at) : INTERVIEW_MODE_LABELS[session.mode]}</span>
            </span>
            <span className="shrink-0 text-right">
              {session.overallScore != null ? (
                <>
                  <span className="block text-ds-label-lg font-bold text-primary tabular-nums">{Math.round(session.overallScore)}<span className="text-ds-body-sm font-medium text-on-surface-variant">/100</span></span>
                  <span className="text-ds-label-sm text-on-surface-variant">{getScoreLabel(session.overallScore)}</span>
                </>
              ) : (
                <span className="text-ds-label-sm font-semibold text-on-surface-variant">{completed ? 'Hoàn tất' : 'Tiếp tục'}</span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
    <Link to="/mock-interviews" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-ds-label-md font-bold text-on-surface no-underline transition-colors hover:bg-surface-container-high">
      Luyện một phiên mới
      <span className={`${ICON} text-[17px]`} aria-hidden="true">add</span>
    </Link>
  </section>
);

const JobsPanel: React.FC<{ jobs: JobSummary[] }> = ({ jobs }) => (
  <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
    <CardHeading
      eyebrow="Cơ hội dành cho bạn"
      title="Việc làm mới"
      description="Khám phá các vị trí đang mở trên bảng tin."
      action={<Link to="/jobs" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-ds-label-md font-semibold text-primary no-underline hover:bg-primary-fixed">Mở bảng tin<span className={`${ICON} text-[16px]`} aria-hidden="true">arrow_forward</span></Link>}
    />
    {jobs.length === 0 ? (
      <div className="mt-space-md rounded-xl bg-surface-container-low px-4 py-6 text-center">
        <span className={`${ICON} text-[28px] text-on-surface-variant`} aria-hidden="true">work_outline</span>
        <p className="mt-2 text-ds-label-lg font-semibold text-on-surface">Chưa có gợi ý việc làm</p>
        <p className="mt-1 text-ds-body-sm text-on-surface-variant">Mở bảng tin để xem các vị trí mới nhất.</p>
        <Link to="/jobs" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-ds-label-md font-bold text-on-primary no-underline hover:bg-primary-hover">Tìm việc làm</Link>
      </div>
    ) : (
      <div className="mt-space-md grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {jobs.slice(0, 3).map((job) => (
          <article key={job.id} className="flex min-w-0 flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 transition-colors hover:border-primary/40 hover:bg-surface-container-low/40">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary" aria-hidden="true"><span className={`${ICON} text-[20px]`}>business_center</span></span>
              <div className="min-w-0">
                <h3 className="m-0 line-clamp-2 text-ds-label-lg font-bold text-on-surface">{job.title}</h3>
                <p className="mt-1 truncate text-ds-body-sm text-on-surface-variant">{job.companyName}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-ds-body-sm text-on-surface-variant">
              {job.location && <span className="inline-flex items-center gap-1"><span className={`${ICON} text-[16px]`} aria-hidden="true">location_on</span>{job.location}</span>}
              <span className="inline-flex items-center gap-1"><span className={`${ICON} text-[16px]`} aria-hidden="true">payments</span>{job.salaryRange || 'Mức lương thỏa thuận'}</span>
            </div>
            <Link to={`/jobs/${job.id}`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-fixed px-4 text-ds-label-md font-bold text-primary no-underline transition-colors hover:bg-primary hover:text-on-primary">
              Xem chi tiết
              <span className={`${ICON} text-[17px]`} aria-hidden="true">arrow_outward</span>
            </Link>
          </article>
        ))}
      </div>
    )}
  </section>
);

const CandidateDashboardContent: React.FC<CandidateDashboardContentProps> = ({
  fullName,
  applications,
  applicationsTotal,
  nextInterview,
  upcomingInterviewsCount,
  sessions,
  sessionsTotal,
  averageScore,
  scoredSessionsCount,
  jobs,
  profile,
  loading,
  error,
  onRetry,
}) => {
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-space-lg py-space-lg sm:gap-space-xl sm:py-space-xl">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-ds-label-sm font-bold uppercase tracking-[0.14em] text-primary">Không gian ứng viên</p>
          <h1 className="m-0 text-ds-headline-xl font-bold tracking-tight text-on-surface sm:text-ds-display-sm">{getGreeting()}, {getFirstName(fullName)}!</h1>
          <p className="mt-2 max-w-2xl text-ds-body-md text-on-surface-variant">Theo dõi hồ sơ, luyện tập và khám phá cơ hội tiếp theo của bạn.</p>
        </div>
        <p className="m-0 flex items-center gap-2 text-ds-label-md font-semibold capitalize text-on-surface-variant">
          <span className={`${ICON} text-[18px] text-primary`} aria-hidden="true">calendar_today</span>
          {dateFormat.format(now)}
        </p>
      </header>

      {error && <ErrorBlock message={error} onRetry={onRetry} />}

      <DashboardHero fullName={fullName} nextInterview={nextInterview} profile={profile} />

      <section aria-label="Tóm tắt hoạt động" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Đơn ứng tuyển" value={applicationsTotal} note="Tổng số hồ sơ đã gửi" icon="send" accent="bg-primary-fixed text-primary" />
        <StatTile label="Lịch sắp tới" value={upcomingInterviewsCount} note="Từ các đơn gần đây" icon="event_available" accent="bg-secondary-container/40 text-secondary-teal" />
        <StatTile label="Phiên luyện AI" value={sessionsTotal} note="Tổng số phiên đã tạo" icon="smart_toy" accent="bg-tertiary-fixed text-on-tertiary-fixed-variant" />
        <StatTile label="Điểm luyện tập" value={averageScore ?? '—'} note={averageScore == null ? 'Chưa có phiên được chấm' : `Trung bình ${scoredSessionsCount} phiên có điểm`} icon="monitoring" accent="bg-surface-container-high text-on-primary-fixed-variant" />
      </section>

      <div className="grid items-start gap-space-md xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-md xl:col-span-7">
          <ApplicationsPanel applications={applications} total={applicationsTotal} loading={loading} />
          <JobsPanel jobs={jobs} />
        </div>
        <div className="flex min-w-0 flex-col gap-space-md xl:col-span-5">
          <PracticePanel sessions={sessions} total={sessionsTotal} loading={loading} />
          {nextInterview && (
            <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
              <CardHeading eyebrow="Chuẩn bị trước" title="Checklist phỏng vấn" description="Một vài bước hữu ích trước giờ hẹn." />
              <ul className="mt-4 flex flex-col gap-3 p-0 text-ds-body-sm text-on-surface-variant">
                {[
                  { icon: 'mic', text: 'Kiểm tra micro và camera', to: '/device-check' },
                  { icon: 'calendar_month', text: 'Xem lại thông tin lịch hẹn', to: '/my-interviews' },
                  { icon: 'smart_toy', text: 'Luyện thử với AI', to: '/mock-interviews' },
                ].map((item) => (
                  <li key={item.text} className="list-none">
                    <Link to={item.to} className="flex items-center gap-3 rounded-xl px-2 py-2 no-underline transition-colors hover:bg-surface-container-low">
                      <span className={`${ICON} text-[19px] text-primary`} aria-hidden="true">{item.icon}</span>
                      <span className="flex-1 font-medium text-on-surface">{item.text}</span>
                      <span className={`${ICON} text-[17px] text-outline`} aria-hidden="true">arrow_forward</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <p className="m-0 text-center text-ds-body-sm text-on-surface-variant">Dữ liệu được đồng bộ từ hồ sơ, đơn ứng tuyển và các phiên luyện tập của bạn.</p>
    </div>
  );
};

export default CandidateDashboardContent;
