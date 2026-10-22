import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useAuth } from '../../context/AuthContext';
import ProgramService from '../../services/program.service';
import { Application, ApplicationStatus, JobDetail } from '../../models/Program.model';
import { parseServerTimestamp } from '../../utils/date';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ICON,
  adminSelectClass,
  EmptyBlock,
  LoadingBlock,
  ErrorBlock,
  fmtServer,
  timeAgo,
} from '../components/adminKit';
import { Card, buttonClass } from '../components/ui';

/**
 * Màn "Đơn ứng tuyển của tôi" theo mockup Stitch 4
 * `screen_7_theo_d_i_n_ng_tuy_n_my_applications_tracker`.
 * Stat card + stepper 5 chặng dẫn xuất từ `/applications/my` thật.
 * Khối bỏ theo plan `candidate-redesign-stitch4.md` §5-S2: "Độ khớp AI %",
 * Xuất PDF/Excel, "Đồng bộ 2 phút trước", HR lead, "Vào phòng họp"/"Lưu Lịch Google",
 * lời khuyên AI Copilot bịa, claim "+42% Offer".
 */

const STATUS_VN: Record<ApplicationStatus, { label: string; icon: string; chip: string }> = {
  PENDING: {
    label: 'Chờ HR xét duyệt',
    icon: 'hourglass_empty',
    chip: 'bg-surface-container-high text-on-surface-variant',
  },
  SCHEDULED: {
    label: 'Hẹn lịch phỏng vấn',
    icon: 'calendar_today',
    chip: 'bg-primary-fixed text-on-primary-fixed',
  },
  INTERVIEWED: {
    label: 'Đã phỏng vấn',
    icon: 'task_alt',
    chip: 'bg-surface-variant text-primary',
  },
  ACCEPTED: {
    label: 'Nhận Offer chính thức',
    icon: 'celebration',
    chip: 'bg-secondary-container text-on-secondary-fixed',
  },
  REJECTED: {
    label: 'Chưa phù hợp đợt này',
    icon: 'do_not_disturb_on',
    chip: 'bg-error-container text-on-error-container',
  },
  CANCELLED: {
    label: 'Đã hủy bởi bạn',
    icon: 'remove_done',
    chip: 'bg-surface-container-high text-outline',
  },
};

const CLOSED_STATUSES: ApplicationStatus[] = ['REJECTED', 'CANCELLED'];

interface TabDef {
  key: string;
  label: string;
  statuses: ApplicationStatus[];
}

const TAB_DEFS: TabDef[] = [
  { key: 'all', label: 'Tất cả', statuses: [] },
  { key: 'pending', label: 'Chờ xét duyệt', statuses: ['PENDING'] },
  { key: 'scheduled', label: 'Hẹn lịch phỏng vấn', statuses: ['SCHEDULED'] },
  { key: 'interviewed', label: 'Đã phỏng vấn', statuses: ['INTERVIEWED'] },
  { key: 'offer', label: 'Đạt yêu cầu & Offer', statuses: ['ACCEPTED'] },
  { key: 'closed', label: 'Chưa phù hợp / Đã hủy', statuses: ['REJECTED', 'CANCELLED'] },
];

// Stepper 5 chặng: chặng chỉ "xong" khi có bằng chứng thật (status / score / slot).
interface Stage {
  title: string;
  icon: string;
  done: boolean;
  current: boolean;
  note: string;
}
const buildStages = (app: Application): Stage[] => {
  const passedScreening = app.status !== 'PENDING' && !CLOSED_STATUSES.includes(app.status);
  const hasScore = app.score != null;
  const hasSlot = Boolean(app.slot);
  const offered = app.status === 'ACCEPTED';
  let current = 2;
  if (offered) current = 5;
  else if (hasSlot || app.status === 'INTERVIEWED') current = 4;
  else if (passedScreening) current = 3;
  return [
    {
      title: '1. Nộp hồ sơ',
      icon: 'send',
      done: true,
      current: false,
      note: `${fmtServer(app.createdAt, 'date')} • Thành công`,
    },
    {
      title: '2. Duyệt CV & JD',
      icon: 'badge',
      done: passedScreening,
      current: current === 2,
      note: passedScreening
        ? 'Đã qua vòng hồ sơ'
        : app.status === 'PENDING'
        ? 'Doanh nghiệp đang xét'
        : 'Chưa đạt',
    },
    {
      title: '3. Phỏng vấn AI',
      icon: 'smart_toy',
      done: hasScore,
      current: current === 3,
      note: hasScore ? `Đạt ${app.score}/100 điểm` : 'Chưa có điểm',
    },
    {
      title: '4. Tech Lead Interview',
      icon: 'mic',
      done: hasSlot && app.status === 'INTERVIEWED',
      current: current === 4,
      note: app.slot ? fmtServer(app.slot.startTime, 'datetime') : 'Chưa lên lịch',
    },
    {
      title: '5. Offer & Nhận việc',
      icon: 'verified',
      done: offered,
      current: current === 5,
      note: offered ? 'Đã nhận Offer' : 'Chưa có Offer',
    },
  ];
};

const CARD_CLASS = 'rounded-xl bg-surface-container-lowest shadow-sm';
const STAT_ICON = 'w-10 h-10 rounded-xl flex items-center justify-center shrink-0';

const MyApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, fetchProfile, clearMessages,
  } = useCandidateController();

  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recent, setRecent] = useState('');
  const [sort, setSort] = useState('newest');
  const [pendingWithdraw, setPendingWithdraw] = useState<Application | null>(null);
  // location/salary cho cột "Doanh nghiệp" — enrichment từ GET /jobs/{id}
  const [jobMap, setJobMap] = useState<Record<number, JobDetail>>({});

  // useMemo để `content` giữ nguyên reference giữa các render (effect tải job bên dưới lấy nó làm dep).
  const content = useMemo(() => applications?.content ?? [], [applications]);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMyApplications(0);
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const ids = Array.from(new Set(content.map((a) => a.jobId))).slice(0, 10);
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        ProgramService.getJobDetail(id)
          .then((res) => ({ id, job: res.data.data }))
          .catch(() => ({ id, job: undefined }))
      )
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<number, JobDetail> = {};
      pairs.forEach((p) => {
        if (p.job) next[p.id] = p.job;
      });
      setJobMap(next);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  const gotoPage = (p: number) => {
    setPage(p);
    fetchMyApplications(p);
  };

  const runWithdraw = async () => {
    if (!pendingWithdraw) return;
    const id = pendingWithdraw.id;
    setPendingWithdraw(null);
    const ok = await cancelApplication(id);
    if (ok) fetchMyApplications(page);
  };

  const tabCounts = useMemo(
    () =>
      TAB_DEFS.map((t) => ({
        ...t,
        count:
          t.statuses.length === 0
            ? content.length
            : content.filter((a) => t.statuses.includes(a.status)).length,
      })),
    [content]
  );

  const visible = useMemo(() => {
    const def = TAB_DEFS.find((t) => t.key === tab) ?? TAB_DEFS[0];
    const q = query.trim().toLowerCase();
    const statuses =
      statusFilter && statusFilter !== 'all'
        ? (statusFilter.split(',') as ApplicationStatus[])
        : null;
    const cutoff = recent === '' ? null : Date.now() - Number(recent) * 86400000;
    const list = content.filter((a) => {
      const inTab = def.statuses.length === 0 || def.statuses.includes(a.status);
      const inStatus = !statuses || statuses.includes(a.status);
      const inRecent = !cutoff || (parseServerTimestamp(a.createdAt)?.getTime() ?? 0) >= cutoff;
      const job = jobMap[a.jobId];
      const haystack = [a.jobTitle, a.companyName, job?.location, job?.salaryRange]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return inTab && inStatus && inRecent && (!q || haystack.includes(q));
    });
    const ts = (a: Application) => parseServerTimestamp(a.createdAt)?.getTime() ?? 0;
    if (sort === 'oldest') return [...list].sort((a, b) => ts(a) - ts(b));
    if (sort === 'score') return [...list].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return [...list].sort((a, b) => ts(b) - ts(a));
  }, [content, tab, query, statusFilter, recent, sort, jobMap]);

  // 4 stat card — đếm từ danh sách đã tải (BE không có endpoint tổng hợp).
  const stats = useMemo(() => {
    const total = applications?.totalElements ?? content.length;
    const pending = content.filter((a) => a.status === 'PENDING').length;
    const scheduled = content.filter((a) => a.status === 'SCHEDULED').length;
    const offers = content.filter((a) => a.status === 'ACCEPTED').length;
    const decided = content.filter((a) => a.status === 'ACCEPTED' || a.status === 'REJECTED').length;
    const successRate = decided === 0 ? null : Math.round((offers / decided) * 100);
    const now = Date.now();
    const upcoming = content
      .filter((a) => a.slot && (parseServerTimestamp(a.slot.startTime)?.getTime() ?? 0) >= now)
      .sort(
        (a, b) =>
          (parseServerTimestamp(a.slot!.startTime)?.getTime() ?? 0) -
          (parseServerTimestamp(b.slot!.startTime)?.getTime() ?? 0)
      );
    return { total, pending, scheduled, offers, successRate, nextInterview: upcoming[0] ?? null };
  }, [applications, content]);

  // Card nổi bật: đơn đang mở (chưa REJECTED/CANCELLED) mới nhất.
  const featured = useMemo(() => {
    const ts = (a: Application) => parseServerTimestamp(a.createdAt)?.getTime() ?? 0;
    return (
      content
        .filter((a) => !CLOSED_STATUSES.includes(a.status))
        .sort((a, b) => ts(b) - ts(a))[0] ?? null
    );
  }, [content]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-ds-body-md text-on-surface-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </Card>
    );
  }

  const totalPages = applications?.totalPages ?? 1;
  const total = applications?.totalElements ?? 0;
  const size = applications?.size ?? 10;
  const featuredStages = featured ? buildStages(featured) : [];
  const featuredCurrent =
    featuredStages.findIndex((s) => s.current) + 1 ||
    featuredStages.filter((s) => s.done).length ||
    1;

  const renderRowActions = (app: Application) => (
    <div className="flex items-center justify-end gap-space-xs">
      <Link
        to={`/mock-interviews?jobId=${app.jobId}`}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-ds-label-sm hover:bg-surface-container-high transition-colors no-underline whitespace-nowrap"
      >
        <span className={`${ICON} text-[15px] text-primary`}>smart_toy</span>
        Luyện AI
      </Link>
      {app.status === 'PENDING' && (
        <Link
          to={`/interview-booking?applicationId=${app.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-ds-label-sm hover:bg-surface-container-high transition-colors no-underline whitespace-nowrap"
        >
          <span className={`${ICON} text-[15px] text-primary`}>event_available</span>
          Đặt lịch
        </Link>
      )}
      <Link
        to={`/jobs/${app.jobId}`}
        title="Xem tin tuyển dụng"
        className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors no-underline"
      >
        <span className={`${ICON} text-[20px]`}>visibility</span>
      </Link>
      {(app.status === 'PENDING' || app.status === 'SCHEDULED') && (
        <button
          type="button"
          title="Hủy đơn ứng tuyển"
          onClick={() => {
            clearMessages();
            setPendingWithdraw(app);
          }}
          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/40 transition-colors"
        >
          <span className={`${ICON} text-[20px]`}>do_not_disturb_on</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full gap-space-xl pb-16">
      {/* Header & Action Hub — "Xuất báo cáo (PDF/Excel)" bỏ: không có endpoint */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg pt-2">
        <div className="flex flex-col gap-space-xs">
          <span className="text-ds-label-sm text-primary uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary-teal" />
            Hệ thống quản lý ứng tuyển
          </span>
          <h1 className="m-0 text-ds-headline-xl text-on-surface tracking-tight">Đơn ứng tuyển của tôi</h1>
          <p className="m-0 max-w-2xl text-ds-body-md text-on-surface-variant">
            Theo dõi tiến độ tuyển dụng, lịch phỏng vấn và phản hồi từ các doanh nghiệp công nghệ hàng
            đầu theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-lg bg-primary text-on-primary text-ds-label-md shadow-[0_4px_12px_rgba(53,37,205,0.22)] hover:bg-primary-container transition-all"
          >
            <span className={`${ICON} text-[20px]`}>add_circle</span>
            Tìm việc làm mới
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-success-bg px-4 py-3 text-ds-body-md text-success-text" role="status">
          <span className={`${ICON} shrink-0 text-[18px]`}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      {error && <ErrorBlock message={error} />}
      {loading && !applications && <LoadingBlock />}

      {!applications || content.length === 0 ? (
        !loading && (
          <EmptyBlock
            icon="send"
            title="Chưa có đơn ứng tuyển nào."
            description="Tìm một vị trí phù hợp và nộp hồ sơ để bắt đầu theo dõi tiến độ tại đây."
            action={
              <button className={buttonClass('primary')} onClick={() => navigate('/jobs')}>
                Mở Bảng việc làm
              </button>
            }
          />
        )
      ) : (
        <>
          {/* 4 Bento stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className={`${CARD_CLASS} p-space-lg flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ds-label-md text-outline">Tổng số đơn nộp</span>
                <span className={`${STAT_ICON} bg-surface-container-high text-primary`}>
                  <span className={`${ICON} text-[22px]`}>send</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-ds-display-sm font-bold text-on-surface">{stats.total}</span>
                <span className="text-ds-body-sm text-outline">đơn hồ sơ</span>
              </div>
            </div>
            <div className={`${CARD_CLASS} p-space-lg flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ds-label-md text-outline">Đang chờ xét duyệt</span>
                <span className={`${STAT_ICON} bg-surface-container-high text-primary-container`}>
                  <span className={`${ICON} text-[22px]`}>pending_actions</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-ds-display-sm font-bold text-on-surface">{stats.pending}</span>
                <span className="text-ds-body-sm text-outline">vị trí</span>
              </div>
            </div>
            <div className={`${CARD_CLASS} p-space-lg flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ds-label-md text-outline">Đã có lịch phỏng vấn</span>
                <span className={`${STAT_ICON} bg-tertiary-fixed text-tertiary`}>
                  <span className={`${ICON} text-[22px]`}>event_available</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-ds-display-sm font-bold text-on-surface">{stats.scheduled}</span>
                <span className="text-ds-body-sm text-outline">vòng phỏng vấn</span>
              </div>
              {stats.nextInterview?.slot && (
                <div className="flex items-center gap-1.5 pt-space-xs min-w-0">
                  <span className="text-ds-label-sm text-primary flex items-center gap-0.5 shrink-0">
                    <span className={`${ICON} text-[14px]`}>alarm</span>
                    Sắp tới: {fmtServer(stats.nextInterview.slot.startTime, 'date')}
                  </span>
                  <span className="text-ds-body-sm text-outline truncate">• {stats.nextInterview.companyName}</span>
                </div>
              )}
            </div>
            <div className={`${CARD_CLASS} p-space-lg flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ds-label-md text-outline">Đã nhận Offer</span>
                <span className={`${STAT_ICON} bg-secondary-fixed text-on-secondary-fixed`}>
                  <span className={`${ICON} text-[22px]`}>verified</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-ds-display-sm font-bold text-secondary-teal">{stats.offers}</span>
                <span className="text-ds-body-sm text-secondary-teal font-semibold">Offer</span>
              </div>
              {stats.successRate != null && (
                <div className="flex items-center pt-space-xs">
                  <span className="text-ds-label-sm text-secondary-teal bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                    Tỷ lệ thành công: {stats.successRate}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spotlight + stepper 5 chặng */}
          {featured && (
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-lg relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md bg-surface-container-low/40 p-space-md rounded-xl">
                <div className="flex items-start gap-space-md min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-center p-2 shrink-0">
                    <span className="w-full h-full rounded-lg bg-primary-container text-on-primary text-ds-headline-md flex items-center justify-center font-bold">
                      {featured.companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="text-ds-label-sm text-on-secondary-fixed bg-secondary-container px-2 py-0.5 rounded-full uppercase">
                        Đang tiến hành
                      </span>
                      <span className="text-ds-label-sm text-outline">Mã đơn: #{featured.id}</span>
                    </div>
                    <h2 className="m-0 text-ds-headline-md text-on-surface">{featured.jobTitle}</h2>
                    <div className="flex items-center gap-space-md flex-wrap text-ds-body-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className={`${ICON} text-[16px] text-outline`}>apartment</span>
                        {featured.companyName}
                        {jobMap[featured.jobId]?.location ? ` • ${jobMap[featured.jobId]?.location}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`${ICON} text-[16px] text-outline`}>calendar_today</span>
                        Ngày nộp: {fmtServer(featured.createdAt, 'date')} ({timeAgo(featured.createdAt)})
                      </span>
                      {profile?.cvFileName && (
                        <span className="flex items-center gap-1">
                          <span className={`${ICON} text-[16px] text-outline`}>description</span>
                          {profile.cvFileName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-ds-label-md text-on-surface uppercase tracking-wider">
                    Tiến trình xét duyệt 5 chặng
                  </span>
                  <span className="text-ds-body-sm text-primary font-semibold">Chặng {featuredCurrent}/5</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-space-md relative pt-2">
                  {featuredStages.map((st, idx) => (
                    <div key={st.title} className={`flex flex-col gap-2 ${st.done || st.current ? '' : 'opacity-60'}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0 z-10 ${
                            st.done
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : st.current
                              ? 'bg-primary-container text-on-primary shadow-[0_0_0_4px_rgba(79,70,229,0.2)] animate-pulse'
                              : 'bg-surface-container-highest text-outline'
                          }`}
                        >
                          <span className={`${ICON} text-[18px]`}>
                            {st.done ? 'check' : st.current ? st.icon : 'lock'}
                          </span>
                        </span>
                        {idx < 4 && (
                          <span
                            className={`hidden md:block h-1 flex-1 rounded-full ${
                              st.done
                                ? 'bg-secondary-fixed'
                                : st.current
                                ? 'bg-primary-container'
                                : 'bg-surface-container-highest'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-ds-label-md ${
                            st.current && !st.done
                              ? 'text-primary font-bold'
                              : st.done
                              ? 'text-on-surface'
                              : 'text-outline'
                          }`}
                        >
                          {st.title}
                        </span>
                        <span className="text-ds-body-sm text-outline">{st.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md pt-space-xs">
                {featured.slot && (
                  <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-outline-variant/30">
                    <div className="flex items-center gap-space-md min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <span className={`${ICON} text-[24px]`}>event_note</span>
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-ds-label-md text-on-surface font-semibold truncate">
                          Buổi phỏng vấn: {fmtServer(featured.slot.startTime, 'datetime')}
                        </span>
                        <span className="text-ds-body-sm text-on-surface-variant truncate">
                          Cùng {featured.companyName}
                          {featured.slot.note ? ` • Ghi chú: ${featured.slot.note}` : ''}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/interview-booking"
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-primary text-ds-label-md hover:bg-surface-container-high transition-colors shadow-sm whitespace-nowrap no-underline"
                    >
                      <span className={`${ICON} text-[18px]`}>calendar_month</span>
                      Xem lịch đặt
                    </Link>
                  </div>
                )}
                <div className="bg-gradient-to-br from-surface-container to-surface-variant/70 rounded-xl p-space-md flex flex-col justify-between gap-space-sm relative overflow-hidden">
                  <div className="flex items-start gap-2">
                    <span className={`${ICON} text-primary text-[20px] shrink-0`}>smart_toy</span>
                    <span className="text-ds-label-md text-primary font-bold">
                      Chuẩn bị cho vòng phỏng vấn
                    </span>
                  </div>
                  <Link
                    to={`/mock-interviews?jobId=${featured.jobId}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-space-md rounded-lg bg-primary-container text-on-primary text-ds-label-sm hover:bg-primary transition-colors shadow-sm no-underline"
                  >
                    <span className={`${ICON} text-[16px]`}>smart_toy</span>
                    Mock interview 15 phút với JD này
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Controls (client-side trên trang đã tải) */}
          <div className={`${CARD_CLASS} p-space-lg flex flex-col gap-space-md`}>
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 max-w-full">
              {tabCounts.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-space-md py-2 rounded-full text-ds-label-md shadow-sm whitespace-nowrap transition-colors ${
                    tab === t.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm pt-space-xs">
              <div className="md:col-span-5 relative flex items-center">
                <span className={`${ICON} absolute left-3.5 text-outline text-[20px]`}>search</span>
                <input
                  className="w-full h-10 pl-11 pr-space-md rounded-lg bg-surface-container-low text-ds-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Tìm theo vị trí, tên công ty hoặc địa điểm..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Tìm đơn ứng tuyển"
                />
              </div>
              <div className="md:col-span-3 relative flex items-center">
                <select
                  className={`${adminSelectClass} w-full h-10 rounded-lg bg-surface-container-low`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Lọc trạng thái"
                >
                  <option value="">Trạng thái: Tất cả tiến trình</option>
                  <option value="PENDING">Hồ sơ chờ duyệt</option>
                  <option value="SCHEDULED">Đã lên lịch phỏng vấn</option>
                  <option value="INTERVIEWED">Đã có đánh giá vòng phỏng vấn</option>
                  <option value="ACCEPTED">Nhận đề nghị việc làm (Offer)</option>
                  <option value="REJECTED,CANCELLED">Đã hoàn thành / Tạm dừng</option>
                </select>
                <span className={`${ICON} absolute right-3 pointer-events-none text-outline text-[18px]`}>expand_more</span>
              </div>
              <div className="md:col-span-2 relative flex items-center">
                <select
                  className={`${adminSelectClass} w-full h-10 rounded-lg bg-surface-container-low`}
                  value={recent}
                  onChange={(e) => setRecent(e.target.value)}
                  aria-label="Lọc thời gian nộp"
                >
                  <option value="">Toàn bộ thời gian</option>
                  <option value="30">30 ngày gần đây</option>
                  <option value="60">60 ngày gần đây</option>
                  <option value="180">6 tháng qua</option>
                </select>
                <span className={`${ICON} absolute right-3 pointer-events-none text-outline text-[18px]`}>expand_more</span>
              </div>
              <div className="md:col-span-2 relative flex items-center">
                <select
                  className={`${adminSelectClass} w-full h-10 rounded-lg bg-surface-container-low`}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sắp xếp"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                  <option value="score">Điểm AI cao nhất</option>
                </select>
                <span className={`${ICON} absolute right-3 pointer-events-none text-outline text-[18px]`}>swap_vert</span>
              </div>
            </div>
          </div>

          {/* Applications Table — cột "Độ khớp AI" bỏ: MatchResponse chỉ phía employer */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            {visible.length === 0 ? (
              <div className="p-space-lg">
                <EmptyBlock icon="filter_list" title="Không có đơn khớp bộ lọc hiện tại." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/60 text-outline text-ds-label-md uppercase tracking-wider">
                      <th className="py-3.5 px-space-lg font-semibold">Vị trí &amp; Cấp bậc</th>
                      <th className="py-3.5 px-space-md font-semibold">Doanh nghiệp</th>
                      <th className="py-3.5 px-space-md font-semibold">Ngày nộp</th>
                      <th className="py-3.5 px-space-md font-semibold">Tiến trình &amp; Trạng thái</th>
                      <th className="py-3.5 px-space-lg text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low text-ds-body-md text-on-surface">
                    {visible.map((app) => {
                      const meta = STATUS_VN[app.status];
                      const job = jobMap[app.jobId];
                      return (
                        <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-space-md px-space-lg">
                            <div className="flex flex-col gap-1">
                              <Link
                                to={`/jobs/${app.jobId}`}
                                className="text-ds-headline-sm text-on-surface font-semibold hover:text-primary transition-colors no-underline w-fit"
                              >
                                {app.jobTitle}
                              </Link>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {app.score != null && (
                                  <span className="px-2 py-0.5 rounded bg-secondary-fixed/40 text-on-secondary-fixed text-[11px]">
                                    AI: {app.score}/100
                                  </span>
                                )}
                                {job?.salaryRange && (
                                  <span className="text-ds-body-sm text-outline">• {job.salaryRange}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex items-center gap-space-sm">
                              <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-primary shrink-0">
                                {app.companyName.charAt(0).toUpperCase()}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-ds-label-md text-on-surface">{app.companyName}</span>
                                {job?.location && (
                                  <span className="text-ds-body-sm text-outline truncate">{job.location}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-ds-label-md text-on-surface">
                                {fmtServer(app.createdAt, 'date')}
                              </span>
                              <span className="text-ds-body-sm text-outline">{timeAgo(app.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-ds-label-md font-semibold w-fit ${meta.chip}`}>
                                <span className={`${ICON} text-[16px]`}>{meta.icon}</span>
                                {app.status === 'SCHEDULED' && app.slot
                                  ? `Hẹn lịch: ${fmtServer(app.slot.startTime, 'date')}`
                                  : meta.label}
                              </span>
                              {app.feedback && (
                                <span className="text-ds-body-sm text-on-surface-variant line-clamp-2 max-w-[420px]">
                                  {app.feedback}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-space-md px-space-lg text-right">{renderRowActions(app)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-space-md">
                <div className="text-ds-body-sm text-outline">
                  Hiển thị{' '}
                  <span className="font-semibold text-on-surface">
                    {page * size + 1} - {Math.min((page + 1) * size, total)}
                  </span>{' '}
                  trong tổng số <span className="font-semibold text-on-surface">{total}</span> đơn ứng tuyển
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() => gotoPage(page - 1)}
                    disabled={page <= 0}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-outline hover:text-on-surface hover:bg-surface-container-high text-ds-label-md transition-colors disabled:opacity-40"
                  >
                    <span className={`${ICON} text-[18px] align-middle`}>chevron_left</span>
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => gotoPage(i)}
                      className={`w-8 h-8 rounded-lg text-ds-label-md transition-colors ${
                        i === page
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => gotoPage(page + 1)}
                    disabled={page + 1 >= totalPages}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high text-ds-label-md transition-colors disabled:opacity-40"
                  >
                    Sau
                    <span className={`${ICON} text-[18px] align-middle`}>chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA — bỏ claim "42% Offer" (số bịa), giữ lời kêu gọi luyện tập */}
          <div className="bg-gradient-to-r from-primary to-primary-container rounded-xl p-space-lg text-on-primary shadow-lg flex flex-col md:flex-row items-center justify-between gap-space-lg">
            <div className="flex items-center gap-space-md">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <span className={`${ICON} text-[32px] text-secondary-fixed`}>auto_awesome</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="m-0 text-ds-headline-md font-bold text-on-primary">
                  Tối ưu hóa khả năng trúng tuyển cùng AI Coach
                </h3>
                <p className="m-0 text-ds-body-md text-on-primary-container max-w-xl">
                  Luyện phỏng vấn thử với AI theo đúng mô tả công việc trước buổi phỏng vấn chính thức.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm shrink-0 w-full md:w-auto">
              <Link
                to="/mock-interviews"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-space-lg py-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-ds-label-lg shadow-sm hover:brightness-105 transition-all no-underline"
              >
                <span className={`${ICON} text-[20px]`}>play_circle</span>
                Bắt đầu Luyện Phỏng vấn Ngay
              </Link>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingWithdraw)}
        title="Hủy đơn ứng tuyển"
        message={
          pendingWithdraw
            ? `Hủy đơn "${pendingWithdraw.jobTitle}" tại ${pendingWithdraw.companyName}? Thao tác này không hoàn tác được.`
            : ''
        }
        confirmLabel="Hủy đơn"
        cancelLabel="Giữ lại"
        danger
        onConfirm={() => void runWithdraw()}
        onCancel={() => setPendingWithdraw(null)}
      />
    </div>
  );
};

export default MyApplicationsPage;
