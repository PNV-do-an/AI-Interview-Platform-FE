import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import ProgramService from '../../services/program.service';
import { Application, JobSummary } from '../../models/Program.model';
import { InterviewSession } from '../../models/Interview.model';
import { parseServerTimestamp } from '../../utils/date';
import CandidateDashboardContent from '../components/CandidateDashboardContent';
import { LoadingBlock, Pill } from '../components/adminKit';
import { ICON } from '../components/candidateKit';
import { Card } from '../components/ui';

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const candidate = useCandidateController();
  const mock = useMockInterviewController();
  const [jobs, setJobs] = useState<JobSummary[]>([]);

  useEffect(() => {
    candidate.fetchMyApplications(0);
    candidate.fetchProfile();
    mock.fetchMySessions(0);
    ProgramService.searchJobs({ page: 0, size: 5 })
      .then((res) => setJobs(res.data.data?.content ?? []))
      .catch(() => setJobs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applications = candidate.applications?.content ?? [];
  const sessions = mock.sessions?.content ?? [];
  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return applications
      .filter((application) => application.slot && !application.slot.cancelled)
      .map((application) => ({
        application,
        start: parseServerTimestamp(application.slot!.startTime) ?? new Date(application.slot!.startTime),
        end: parseServerTimestamp(application.slot!.endTime),
      }))
      .filter((interview) => interview.start.getTime() >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [applications]);

  const scoredSessions = useMemo(
    () => sessions.filter((session: InterviewSession) => session.status === 'COMPLETED' && session.overallScore != null),
    [sessions],
  );
  const averageScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((total, session) => total + (session.overallScore ?? 0), 0) / scoredSessions.length)
    : null;
  const loading = candidate.loading || mock.loading;

  return (
    <CandidateDashboardContent
      fullName={user?.fullName}
      applications={applications}
      applicationsTotal={candidate.applications?.totalElements ?? applications.length}
      nextInterview={upcomingInterviews[0] ?? null}
      upcomingInterviewsCount={upcomingInterviews.length}
      sessions={sessions}
      sessionsTotal={mock.sessions?.totalElements ?? sessions.length}
      averageScore={averageScore}
      scoredSessionsCount={scoredSessions.length}
      jobs={jobs}
      profile={candidate.profile}
      loading={loading}
      error={candidate.error || mock.error}
      onRetry={() => {
        candidate.fetchMyApplications(0);
        candidate.fetchProfile();
        mock.fetchMySessions(0);
      }}
    />
  );
};

const ROLE_LINKS: Record<string, { to: string; label: string; description: string; icon: string }[]> = {
  employer: [
    { to: '/my-jobs', label: 'Tin đã đăng', description: 'Quản lý các tin đang tuyển', icon: 'work' },
    { to: '/jobs/new', label: 'Đăng tin mới', description: 'Tạo tin tuyển dụng mới', icon: 'add' },
    { to: '/my-slots', label: 'Lịch trống', description: 'Khung giờ phỏng vấn bạn mở cho ứng viên', icon: 'event' },
    { to: '/packages', label: 'Gói dịch vụ', description: 'Mua lượt đăng tin và lượt phỏng vấn', icon: 'deployed_code' },
    { to: '/my-orders', label: 'Đơn hàng', description: 'Lịch sử thanh toán các gói dịch vụ', icon: 'receipt_long' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Trang quản trị', description: 'Mở khu vực quản trị', icon: 'dashboard' },
  ],
  staff: [
    { to: '/admin/job-approvals', label: 'Trang quản trị', description: 'Mở khu vực quản trị', icon: 'dashboard' },
  ],
};

const WorkspaceDashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const links = [
    ...(role === 'ROLE_ADMIN'
      ? [...ROLE_LINKS.admin, ...ROLE_LINKS.employer]
      : role === 'ROLE_STAFF'
        ? [...ROLE_LINKS.staff, ...ROLE_LINKS.employer]
        : ROLE_LINKS.employer),
  ].filter((item) => role !== 'ROLE_INTERVIEWER' || !item.to.startsWith('/admin'));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h1 className="m-0 text-headline-lg tracking-tight text-ink">
          Chào mừng {user?.fullName} trở lại!
        </h1>
        <p className="m-0 mt-1 text-body-md text-ink-variant">Các công cụ dành cho vai trò của bạn.</p>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="no-underline">
            <Card className="flex h-full items-start gap-3 transition-colors hover:bg-surface-low">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-mid text-primary">
                <span className={`${ICON} text-[18px]`}>{item.icon}</span>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-headline-sm text-ink">{item.label}</span>
                <span className="text-body-sm text-ink-variant">{item.description}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'ROLE_USER' ? <CandidateDashboard /> : <WorkspaceDashboard />;
};

export default DashboardPage;
