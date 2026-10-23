import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { APPLICATION_STATUS_LABELS, Application } from '../../models/Program.model';
import {
  ErrorBanner,
  LoadingState,
  StatusBadge,
  buttonClass,
  tdClass,
  thClass,
} from '../components/ui';

const PANEL = 'rounded-xl bg-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]';
const STAT_LABEL = 'text-label-sm font-semibold uppercase tracking-wider text-outline-strong';
const ICON_BOX = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-mid text-primary';

const fmtDate = new Intl.DateTimeFormat('vi-VN', { month: 'numeric', day: 'numeric' });
const fmtTime = new Intl.DateTimeFormat('vi-VN', { hour: 'numeric', minute: '2-digit' });
const fmtMonth = new Intl.DateTimeFormat('vi-VN', { month: 'short' });
const fmtWeekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' });

/** Nhãn thứ gọn cho dải lịch 7 ô (vi-VN short cho ra "Thứ 2" – quá dài). */
const WEEKDAY_COMPACT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);

const dayLabel = (d: Date) => {
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Ngày mai';
  if (diffDays === -1) return 'Hôm qua';
  return fmtWeekday.format(d);
};

const monogram = (name?: string) =>
  (name || '-')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '-';

interface Interview {
  app: Application;
  start: Date;
  end: Date | null;
}

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const candidate = useCandidateController();
  const mock = useMockInterviewController();

  useEffect(() => {
    candidate.fetchMyApplications(0);
    candidate.fetchProfile();
    mock.fetchMySessions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apps = candidate.applications?.content ?? [];

  const interviews = useMemo<Interview[]>(() => {
    const now = Date.now();
    return apps
      .filter((a) => a.slot && !a.slot.cancelled)
      .map((a) => ({ app: a, start: new Date(a.slot!.startTime), end: new Date(a.slot!.endTime) }))
      .filter((i) => i.start.getTime() >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [apps]);

  const nextInterview = interviews[0];

  const counts = useMemo(() => {
    const by = (s: string) => apps.filter((a) => a.status === s).length;
    return {
      pending: by('PENDING'),
      scheduled: by('SCHEDULED'),
      interviewed: by('INTERVIEWED'),
      inProgress: by('PENDING') + by('SCHEDULED') + by('INTERVIEWED'),
    };
  }, [apps]);

  const latestScore = useMemo(
    () => (mock.sessions?.content ?? []).find((s) => s.status === 'COMPLETED' && s.overallScore != null) ?? null,
    [mock.sessions],
  );

  const week = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return {
        day,
        label: WEEKDAY_COMPACT[day.getDay()],
        hasInterview: interviews.some((it) => sameDay(it.start, day)),
        isToday: sameDay(day, today),
      };
    });
  }, [interviews]);

  const loading = candidate.loading || mock.loading;
  const error = candidate.error || mock.error;
  const cvFileName = candidate.profile?.cvFileName;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting banner */}
      <section className={`${PANEL} relative overflow-hidden`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-info/30 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-1">
            <h1 className="m-0 text-headline-lg tracking-tight text-ink">Chào mừng {user?.fullName} trở lại!</h1>
            <p className="m-0 text-body-md text-ink-variant">
              Chuẩn bị cho các buổi phỏng vấn kỹ thuật sắp tới và theo dõi tiến trình ứng tuyển.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/my-profile" className={`${buttonClass('secondary')} no-underline`}>
              <span className="material-symbols-outlined text-[18px]">description</span>
              Hồ sơ &amp; CV
            </Link>
            <Link to="/mock-interviews" className={`${buttonClass('primary')} no-underline`}>
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              Luyện phỏng vấn cùng AI
            </Link>
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}
      {loading && !candidate.applications && <LoadingState label="Đang tải…" />}

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={PANEL}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className={STAT_LABEL}>CV của bạn</span>
              <span className="mt-1 text-headline-md text-ink">{cvFileName ? 'Đã có file' : 'Chưa tải lên'}</span>
            </div>
            <span className={ICON_BOX}>
              <span className="material-symbols-outlined text-[20px]">insert_drive_file</span>
            </span>
          </div>
          <div className="mt-4 flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-low p-2.5">
            <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary">
              {cvFileName ? 'check_circle' : 'error'}
            </span>
            <span className="truncate font-mono text-body-sm text-ink-variant">{cvFileName ?? 'Chưa có CV nào'}</span>
          </div>
        </div>

        <div className={PANEL}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className={STAT_LABEL}>Đơn đang mở</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-metric-stat text-ink">{counts.inProgress}</span>
                <span className="text-label-sm text-ink-variant">đang xử lý</span>
              </div>
            </div>
            <span className={ICON_BOX}>
              <span className="material-symbols-outlined text-[20px]">view_kanban</span>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1 text-center font-label-sm">
            {[
              { n: counts.pending, t: 'Đang xét' },
              { n: counts.scheduled, t: 'Đã đặt lịch' },
              { n: counts.interviewed, t: 'Đã phỏng vấn' },
            ].map((cell) => (
              <div key={cell.t} className="flex flex-col rounded bg-surface-low py-1">
                <span className="font-semibold text-ink">{cell.n}</span>
                <span className="text-[10px] text-outline-strong">{cell.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${PANEL} relative overflow-hidden`}>
          <div className="absolute left-0 right-0 top-0 h-1 bg-secondary" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className={STAT_LABEL}>Phỏng vấn kế tiếp</span>
              <span className="mt-1 text-headline-md text-ink">
                {nextInterview
                  ? `${dayLabel(nextInterview.start)}, ${fmtTime.format(nextInterview.start)}`
                  : 'Chưa có lịch'}
              </span>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info text-secondary">
              <span className="material-symbols-outlined text-[20px]">alarm</span>
            </span>
          </div>
          {nextInterview && (
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-secondary" />
              <span className="truncate text-body-sm text-ink-variant">
                {nextInterview.app.jobTitle} · {nextInterview.app.companyName}
              </span>
            </div>
          )}
        </div>

        <div className={PANEL}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className={STAT_LABEL}>Điểm AI gần nhất</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-metric-stat text-primary">
                  {latestScore?.overallScore != null ? Math.round(latestScore.overallScore) : '—'}
                </span>
                <span className="text-label-sm text-outline-strong">/ 100</span>
              </div>
            </div>
            <span className={ICON_BOX}>
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </span>
          </div>
          <div className="mt-4 truncate text-body-sm text-ink-variant">
            {latestScore ? (latestScore.jobTitle || latestScore.topic || 'Phiên luyện tập') : 'Chưa có phiên nào được chấm'}
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className={PANEL}>
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">assignment_turned_in</span>
                <h2 className="m-0 text-headline-md text-ink">Quy trình ứng tuyển</h2>
                <span className="rounded-full bg-surface-mid px-2 py-0.5 text-label-sm text-ink-variant">
                  {apps.length} tin
                </span>
              </div>
              <Link to="/my-applications" className={`${buttonClass('ghost')} no-underline`}>
                Xem tất cả
              </Link>
            </div>

            {apps.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-2 border border-dashed border-[#cbd5e1] rounded-lg px-6 py-10 text-center">
                <span className="material-symbols-outlined text-[28px] text-ink-variant">inbox</span>
                <p className="m-0 text-headline-sm text-ink">Chưa có đơn ứng tuyển</p>
                <p className="m-0 text-body-sm text-ink-variant">Xem bảng tin tuyển dụng để gửi đơn ứng tuyển đầu tiên.</p>
                <Link to="/jobs" className={`${buttonClass('primary')} mt-2 no-underline`}>
                  Xem tin tuyển dụng
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-body-md text-ink">
                  <thead>
                    <tr>
                      <th className={thClass}>Vị trí &amp; Công ty</th>
                      <th className={thClass}>Nộp ngày</th>
                      <th className={thClass}>Trạng thái</th>
                      <th className={thClass}>Bước tiếp theo</th>
                      <th className={`${thClass} text-right`}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.id} className="transition-colors hover:bg-surface-low/60">
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-mid text-label-md font-bold text-primary">
                              {monogram(app.companyName)}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-headline-sm text-ink">{app.jobTitle}</span>
                              <span className="truncate text-body-sm text-ink-variant">{app.companyName}</span>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdClass} font-mono text-body-sm text-ink-variant`}>
                          {fmtDate.format(new Date(app.createdAt))}
                        </td>
                        <td className={tdClass}>
                          <StatusBadge status={app.status} label={APPLICATION_STATUS_LABELS[app.status]} />
                        </td>
                        <td className={tdClass}>
                          {app.slot && !app.slot.cancelled ? (
                            <div className="flex flex-col">
                              <span className="text-label-md font-medium text-ink">
                                {dayLabel(new Date(app.slot.startTime))}, {fmtTime.format(new Date(app.slot.startTime))}
                              </span>
                              <span className="text-body-sm text-outline-strong">{app.slot.employerName}</span>
                            </div>
                          ) : app.score != null ? (
                            <span className="text-body-sm text-ink-variant">Điểm {Math.round(app.score)}/100</span>
                          ) : (
                            <span className="text-body-sm text-outline-strong">—</span>
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <Link
                            to={`/jobs/${app.jobId}`}
                            className={`${buttonClass('secondary')} no-underline`}
                          >
                            Xem tin
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Scheduled session */}
          <section className={PANEL}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">calendar_clock</span>
                <h3 className="m-0 text-headline-md text-ink">Lịch phỏng vấn đã đặt</h3>
              </div>
              {nextInterview && (
                <span className="rounded bg-info px-2 py-0.5 text-label-sm font-semibold text-secondary">
                  {dayLabel(nextInterview.start)}
                </span>
              )}
            </div>

            {nextInterview ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-3 rounded-xl bg-surface-low p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-mid">
                      <span className="text-label-sm uppercase text-secondary">{fmtMonth.format(nextInterview.start)}</span>
                      <span className="text-headline-md leading-none text-ink">{nextInterview.start.getDate()}</span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-headline-sm leading-tight text-ink">
                        {fmtTime.format(nextInterview.start)}
                        {nextInterview.end && !Number.isNaN(nextInterview.end.getTime())
                          ? ` – ${fmtTime.format(nextInterview.end)}`
                          : ''}
                      </span>
                      <span className="truncate text-body-sm text-outline-strong">{nextInterview.app.jobTitle}</span>
                      <Link
                        to={`/jobs/${nextInterview.app.jobId}`}
                        className="mt-0.5 truncate text-label-md font-semibold text-primary no-underline hover:underline"
                      >
                        {nextInterview.app.companyName}
                      </Link>
                    </div>
                  </div>
                  {nextInterview.app.slot?.employerName && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-mid text-label-md font-semibold text-primary">
                        {monogram(nextInterview.app.slot.employerName)}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-label-md font-semibold text-ink">
                          {nextInterview.app.slot.employerName}
                        </span>
                        <span className="truncate text-body-sm text-ink-variant">Người phỏng vấn</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-center">
                  {week.map((d, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 ${
                        d.isToday ? 'bg-primary-container font-bold text-on-primary shadow-sm' : ''
                      }`}
                    >
                      <span className={`text-[11px] ${d.isToday ? 'text-on-primary/80' : 'text-outline-strong'}`}>
                        {d.label}
                      </span>
                      <span className={`text-label-sm font-semibold ${d.isToday ? '' : 'text-ink'}`}>
                        {d.day.getDate()}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          d.hasInterview ? (d.isToday ? 'bg-on-primary' : 'bg-secondary') : 'bg-transparent'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 rounded-xl bg-surface-low p-4">
                <p className="m-0 text-body-md text-ink-variant">Chưa đặt lịch phỏng vấn nào.</p>
                <p className="m-0 text-body-sm text-outline-strong">
                  Các khung giờ đã đặt sẽ hiện ở đây kèm thời gian, công ty và người phỏng vấn.
                </p>
                <Link to="/my-applications" className={`${buttonClass('secondary')} mt-1 self-start no-underline`}>
                  Theo dõi đơn ứng tuyển
                </Link>
              </div>
            )}
          </section>

          {/* Recent AI sessions */}
          <section className={PANEL}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">insights</span>
                <h3 className="m-0 text-headline-md text-ink">Phiên luyện tập AI gần đây</h3>
              </div>
              <Link to="/mock-interviews" className={`${buttonClass('ghost')} no-underline`}>
                Tất cả
              </Link>
            </div>
            {(mock.sessions?.content ?? []).length === 0 ? (
              <p className="m-0 mt-4 text-body-md text-ink-variant">Chưa có phiên luyện tập nào.</p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {(mock.sessions?.content ?? []).slice(0, 4).map((s) => {
                  const answered = `${s.answeredCount}/${s.questions?.length ?? 0}`;
                  const to =
                    s.status === 'COMPLETED' ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`;
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-headline-sm text-ink">
                          {s.jobTitle || s.topic || `Phiên ${s.mode}`}
                        </span>
                        <span className="font-mono text-body-sm text-outline-strong">
                          {s.mode} · đã trả lời {answered}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {s.overallScore != null ? (
                          <span className="text-headline-sm text-primary">{Math.round(s.overallScore)}</span>
                        ) : (
                          <StatusBadge status={s.status} label="Đang làm" />
                        )}
                        <Link to={to} className={`${buttonClass('secondary')} no-underline`}>
                          {s.status === 'COMPLETED' ? 'Xem báo cáo' : 'Tiếp tục'}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
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
    // Admin chỉ còn 1 cửa vào: shell AdminLayout (mockup Stitch) tự lo phần điều hướng.
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
      <section className={`${PANEL} relative overflow-hidden`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-info/30 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="m-0 text-headline-lg tracking-tight text-ink">Chào mừng {user?.fullName} trở lại!</h1>
          <p className="m-0 text-body-md text-ink-variant">Các công cụ dành cho vai trò của bạn.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`${PANEL} flex items-start gap-3 no-underline transition-colors hover:bg-surface-low`}
          >
            <span className={ICON_BOX}>
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-headline-sm text-ink">{item.label}</span>
              <span className="text-body-sm text-ink-variant">{item.description}</span>
            </span>
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
