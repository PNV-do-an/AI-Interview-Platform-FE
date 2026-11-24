import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import ProgramService from '../../services/program.service';
import PaymentService from '../../services/payment.service';
import OrderService from '../../services/order.service';
import { APPLICATION_STATUS_LABELS, Application, JobSummary } from '../../models/Program.model';
import { Wallet } from '../../models/Payment.model';
import { Order, formatVnd } from '../../models/Order.model';
import { InterviewSession } from '../../models/Interview.model';
import { parseServerTimestamp } from '../../utils/date';
import {
  CARD,
  CandidatePageHeader,
  CandidateStat,
  ICON,
  SOFT,
  StatusChip,
  Stepper,
  Step,
} from '../components/candidateKit';
import { LoadingBlock, Pill, ErrorBlock } from '../components/adminKit';

/**
 * Tổng quan ứng viên — mockup `t_ng_quan_ng_vi_n_ai_interview_platform` (2026-10-26).
 *
 * Số thật: đơn ứng tuyển (`GET /applications/my`), lịch phỏng vấn (slot trên đơn), phiên luyện
 * AI (`GET /interviews/my`), điểm AI (`overallScore`), tin tuyển dụng (`GET /jobs`).
 * Khối demo có dán nhãn: gợi ý trọng tâm của "AI Copilot" cho vòng kế tiếp, "Năng lực cốt lõi AI"
 * (radar/bars theo từng năng lực) và "Mẹo vàng" — BE chưa có endpoint nào trả các chỉ số này.
 * Bỏ hẳn so với mockup: "Lượt NTD xem hồ sơ" (không có column đếm view), nút "Vào phòng Google
 * Meet" (không có meeting URL), "Chỉ số sẵn sàng tuyển dụng + Top 5% Frontend" (percentile).
 */

const fmtTime = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
const fmtShort = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

/** Nhãn dải điểm — dẫn xuất từ điểm thật, cùng thang với màn Báo cáo. */
const scoreBand = (score: number) =>
  score >= 90 ? 'Xuất sắc' : score >= 80 ? 'Tốt' : score >= 70 ? 'Khá tốt' : score >= 50 ? 'Cần cải thiện' : 'Cần cố gắng';

/** Countdown "còn X giờ Y phút" từ mốc giờ thật của slot. */
const untilLabel = (start: Date) => {
  const mins = Math.round((start.getTime() - Date.now()) / 60000);
  if (mins <= 0) return 'Đang diễn ra';
  if (mins < 60) return `Còn ${mins} phút`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Còn ${h} giờ ${mins % 60} phút`;
  return `Còn ${Math.floor(h / 24)} ngày ${h % 24} giờ`;
};

/**
 * Ánh xạ `Application.status` thành 5 chặng tuyển dụng của mockup. Đây là cách trình bày
 * lại đúng trạng thái thật từ BE, không phải dữ liệu mới.
 */
const stagesOf = (app: Application): Step[] => {
  const order: Record<Application['status'], number> = {
    PENDING: 1, SCHEDULED: 2, INTERVIEWED: 3, ACCEPTED: 4, REJECTED: 3, CANCELLED: 3,
  };
  const at = order[app.status];
  const failed = app.status === 'REJECTED' || app.status === 'CANCELLED';
  const state = (i: number): Step['state'] => {
    if (failed && i >= at) return i === at ? 'failed' : 'todo';
    if (i < at) return 'done';
    if (i === at) return 'current';
    return 'todo';
  };
  return [
    { label: 'Nộp CV', state: 'done' },
    { label: 'Sơ loại HR', state: state(1) },
    { label: 'Phỏng vấn', meta: app.slot ? fmtShort.format(parseServerTimestamp(app.slot.startTime) ?? new Date()) : undefined, state: state(2) },
    { label: 'Đánh giá', state: state(3) },
    { label: app.status === 'ACCEPTED' ? 'Trúng tuyển' : 'Kết quả', state: state(4) },
  ];
};

const monogram = (name?: string) =>
  (name || '-')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '-';

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const candidate = useCandidateController();
  const mock = useMockInterviewController();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    candidate.fetchMyApplications(0);
    candidate.fetchProfile();
    mock.fetchMySessions(0);
    PaymentService.getWallet()
      .then((res) => setWallet(res.data.data ?? null))
      .catch(() => { /* khối ví vẫn hiển thị nút nạp/thanh toán khi API lỗi */ });
    ProgramService.searchJobs({ page: 0, size: 5 })
      .then((res) => setJobs(res.data.data?.content ?? []))
      .catch(() => { /* khối việc làm tự ẩn khi không tải được, không chặn phần còn lại */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apps = candidate.applications?.content ?? [];

  const interviews = useMemo(() => {
    const now = Date.now();
    return apps
      .filter((a) => a.slot && !a.slot.cancelled)
      .map((a) => ({
        app: a,
        start: parseServerTimestamp(a.slot!.startTime) ?? new Date(a.slot!.startTime),
        end: parseServerTimestamp(a.slot!.endTime),
      }))
      .filter((i) => i.start.getTime() >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [apps]);

  const nextInterview = interviews[0];

  const counts = useMemo(() => {
    const by = (s: Application['status']) => apps.filter((a) => a.status === s).length;
    return {
      total: candidate.applications?.totalElements ?? apps.length,
      pending: by('PENDING'),
      scheduled: by('SCHEDULED'),
      interviewed: by('INTERVIEWED'),
      accepted: by('ACCEPTED'),
    };
  }, [apps, candidate.applications]);

  const sessions = mock.sessions?.content ?? [];

  const scored = useMemo(
    () => sessions.filter((s: InterviewSession) => s.status === 'COMPLETED' && s.overallScore != null),
    [sessions],
  );
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / scored.length)
    : null;

  const loading = candidate.loading || mock.loading;
  const error = candidate.error || mock.error;
  const cvFileName = candidate.profile?.cvFileName;

  return (
    <div className="flex flex-col gap-space-lg">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Tổng quan' }]}
        status={<StatusChip label="AI Copilot: Đang theo dõi tiến trình tuyển dụng" />}
        title={`${greeting()}, ${user?.fullName ?? 'bạn'}! 👋`}
        subtitle={
          nextInterview
            ? `Bạn có 1 buổi phỏng vấn vào ${fmtTime.format(nextInterview.start)} ${fmtDate.format(nextInterview.start)} và ${counts.pending} hồ sơ đang chờ phản hồi.`
            : `Bạn có ${counts.pending + counts.scheduled + counts.interviewed} hồ sơ đang trong quy trình tuyển dụng.`
        }
        actions={
          <>
            <Link to="/mock-interviews" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-ds-label-lg font-semibold text-on-primary shadow-sm transition-colors hover:bg-indigo-700 no-underline">
              <span className={`${ICON} text-[18px] text-secondary-container`}>smart_toy</span>
              Luyện phỏng vấn AI ngay
            </Link>
            <Link to="/my-profile" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-200 px-4 text-ds-label-lg text-slate-900 transition-colors hover:bg-slate-200est no-underline">
              <span className={`${ICON} text-[18px] text-slate-600`}>edit_document</span>
              Cập nhật CV &amp; Hồ sơ
            </Link>
          </>
        }
      />

      {error && <ErrorBlock message={error} />}
      {loading && !candidate.applications && <LoadingBlock />}

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        <CandidateStat
          label="Điểm AI trung bình"
          value={avgScore ?? '—'}
          unit={avgScore != null ? '/100' : undefined}
          icon="analytics"
          tone="primary"
          barPct={avgScore ?? 0}
          sub={
            avgScore != null ? (
              <>
                <span className="font-semibold text-teal-600">{scoreBand(avgScore)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{scored.length} phiên đã chấm</span>
              </>
            ) : (
              <span className="text-slate-600">Chưa có phiên nào được chấm</span>
            )
          }
        />
        <CandidateStat
          label="Đơn theo dõi"
          value={counts.total}
          unit="hồ sơ"
          icon="send"
          tone="teal"
          barPct={counts.total ? Math.round(((counts.scheduled + counts.interviewed + counts.accepted) / counts.total) * 100) : 0}
          sub={
            <>
              <span className="font-semibold text-on-tertiary-fixed-variant">{counts.pending} chờ phỏng vấn</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-teal-600">{counts.accepted} có Offer</span>
            </>
          }
        />
        <CandidateStat
          label="Lịch phỏng vấn sắp tới"
          value={interviews.length}
          unit="phiên"
          icon="event"
          tone="tertiary"
          barPct={Math.min(100, interviews.length * 25)}
          sub={
            nextInterview ? (
              <span className="truncate text-slate-600">
                <span className="font-semibold text-primary">{nextInterview.app.companyName}</span> • {fmtTime.format(nextInterview.start)} {fmtShort.format(nextInterview.start)}
              </span>
            ) : (
              <span className="text-slate-600">Chưa có lịch đặt trước</span>
            )
          }
        />
        <CandidateStat
          label="Hồ sơ & CV"
          value={cvFileName ? 'Đã có CV' : 'Chưa tải lên'}
          icon="description"
          tone="neutral"
          barPct={cvFileName ? 100 : 30}
          sub={<span className="truncate font-mono text-slate-600">{cvFileName ?? 'Cập nhật CV để tăng độ khớp'}</span>}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* ============ CỘT TRÁI (8 cột) ============ */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {/* Phỏng vấn sắp diễn ra */}
          <section className={`${CARD} relative overflow-hidden p-space-lg`}>
            <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
                </span>
                <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">
                  Phỏng vấn sắp diễn ra trong 24h
                </h2>
              </div>
              {nextInterview && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-ds-label-md font-bold text-red-700">
                  <span className={`${ICON} text-[16px]`}>timer</span>
                  {untilLabel(nextInterview.start)}
                </span>
              )}
            </div>

            {nextInterview ? (
              <>
                <div className={`${SOFT} flex flex-col items-start justify-between gap-space-md p-space-md md:flex-row md:items-center`}>
                  <div className="flex min-w-0 items-start gap-space-md">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-ds-headline-md font-bold text-primary shadow-sm">
                      {monogram(nextInterview.app.companyName)}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <span className="text-ds-headline-sm font-bold text-slate-900">{nextInterview.app.companyName}</span>
                        <Pill tone="primary" icon="badge">
                          {APPLICATION_STATUS_LABELS[nextInterview.app.status]}
                        </Pill>
                      </div>
                      <span className="mt-0.5 text-ds-body-md font-semibold text-primary">{nextInterview.app.jobTitle}</span>
                      <div className="mt-2 flex flex-wrap items-center gap-x-space-md gap-y-1 text-ds-body-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className={`${ICON} text-[16px] text-slate-400`}>schedule</span>
                          {fmtTime.format(nextInterview.start)}
                          {nextInterview.end ? ` - ${fmtTime.format(nextInterview.end)}` : ''}, {fmtDate.format(nextInterview.start)}
                        </span>
                        {nextInterview.app.slot?.employerName && (
                          <span className="flex items-center gap-1">
                            <span className={`${ICON} text-[16px] text-slate-400`}>person_outline</span>
                            Người phỏng vấn: <strong className="font-semibold text-slate-900">{nextInterview.app.slot.employerName}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm pt-space-sm">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <Link to="/device-check" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-ds-label-md text-slate-900 transition-colors hover:bg-slate-200 no-underline">
                      <span className={`${ICON} text-[16px] text-teal-600`}>mic</span>
                      Kiểm tra Mic &amp; Cam
                    </Link>
                    {/* TẠM TẮT (24/11/2026): lịch phỏng vấn */}
                    {/* <Link to="/my-interviews" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-ds-label-md text-slate-900 transition-colors hover:bg-slate-200 no-underline">
                      <span className={`${ICON} text-[16px] text-primary`}>calendar_month</span>
                      Xem chi tiết lịch
                    </Link> */}
                  </div>
                  <Link to={`/jobs/${nextInterview.app.jobId}`} className="ml-auto inline-flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2 text-ds-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-indigo-700 no-underline">
                    <span className={`${ICON} text-[18px]`}>description</span>
                    Xem tin tuyển dụng
                  </Link>
                </div>
              </>
            ) : (
              <div className={`${SOFT} flex flex-col items-start gap-2 p-space-md`}>
                <p className="m-0 text-ds-body-md text-slate-600">Chưa có buổi phỏng vấn nào được đặt trước.</p>
                <p className="m-0 text-ds-body-sm text-slate-400">
                  Khi nhà tuyển dụng duyệt đơn, khung giờ đã hẹn sẽ xuất hiện ở đây kèm đồng hồ đếm ngược.
                </p>
                <Link to="/my-applications" className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-ds-label-md font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-200 no-underline">
                  Theo dõi đơn ứng tuyển
                </Link>
              </div>
            )}
          </section>

          {/* Tiến độ đơn ứng tuyển */}
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">Tiến độ đơn ứng tuyển gần đây</h2>
                <span className="text-ds-body-sm text-slate-600">Theo dõi sát sao từng chặng tuyển dụng được tự động đồng bộ</span>
              </div>
              <Link to="/my-applications" className="flex shrink-0 items-center gap-1 text-ds-label-md text-primary hover:underline">
                <span>Xem tất cả {counts.total} đơn</span>
                <span className={`${ICON} text-[16px]`}>arrow_forward</span>
              </Link>
            </div>

            {apps.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
                <span className={`${ICON} text-[28px] text-slate-600`}>inbox</span>
                <p className="m-0 text-ds-headline-sm font-semibold text-slate-900">Chưa có đơn ứng tuyển</p>
                <p className="m-0 text-ds-body-sm text-slate-600">Xem bảng tin tuyển dụng để gửi đơn ứng tuyển đầu tiên.</p>
                <Link to="/jobs" className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-ds-label-md font-semibold text-on-primary no-underline">
                  Xem tin tuyển dụng
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-space-md">
                {apps.slice(0, 3).map((app) => (
                  <div key={app.id} className={`${SOFT} flex flex-col gap-space-sm p-space-md`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-space-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-ds-label-lg font-bold text-primary shadow-sm">
                          {monogram(app.companyName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="m-0 text-ds-label-lg text-slate-900">{app.companyName}</h3>
                          <p className="m-0 truncate text-ds-body-sm text-slate-600">{app.jobTitle}</p>
                        </div>
                      </div>
                      <Pill tone={app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' || app.status === 'CANCELLED' ? 'danger' : 'primary'}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Pill>
                    </div>
                    <Stepper steps={stagesOf(app)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lịch sử luyện tập AI */}
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-space-xs">
                <span className={`${ICON} text-[22px] text-primary`}>smart_toy</span>
                <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">Lịch sử luyện tập AI gần nhất</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ds-label-sm text-slate-600">
                  Tổng số: {mock.sessions?.totalElements ?? sessions.length} phiên luyện
                </span>
                <Link to="/mock-interviews/history" className="text-ds-label-md text-primary hover:underline">
                  Xem báo cáo
                </Link>
              </div>
            </div>
            {sessions.length === 0 && !loading ? (
              <p className="m-0 text-ds-body-md text-slate-600">Chưa có phiên luyện tập nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-ds-label-sm uppercase tracking-wider text-slate-600">
                      <th className="rounded-l-lg px-space-md py-2.5 font-semibold">Chủ đề mô phỏng</th>
                      <th className="px-space-md py-2.5 font-semibold">Thời gian</th>
                      <th className="px-space-md py-2.5 font-semibold">Điểm số AI</th>
                      <th className="px-space-md py-2.5 font-semibold">Đánh giá chung</th>
                      <th className="rounded-r-lg px-space-md py-2.5 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-ds-body-sm">
                    {sessions.slice(0, 4).map((s) => {
                      const at = parseServerTimestamp(s.completedAt ?? s.createdAt);
                      const to = s.status === 'COMPLETED' ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`;
                      return (
                        <tr key={s.id} className="border-b border-surface-container-high/40 transition-colors hover:bg-slate-50/50">
                          <td className="px-space-md py-3 font-semibold text-slate-900">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                              <span className="truncate">{s.jobTitle || s.topic || `Phiên ${s.mode}`}</span>
                            </span>
                          </td>
                          <td className="px-space-md py-3 text-slate-600">
                            {at ? `${fmtShort.format(at)}, ${fmtTime.format(at)}` : '—'}
                          </td>
                          <td className="px-space-md py-3">
                            {s.overallScore != null ? (
                              <>
                                <span className="text-ds-label-lg font-bold text-primary tabular-nums">{Math.round(s.overallScore)}</span>
                                <span className="text-slate-400">/100</span>
                              </>
                            ) : (
                              <span className="text-slate-400">Chưa chấm</span>
                            )}
                          </td>
                          <td className="px-space-md py-3">
                            {s.status !== 'COMPLETED' ? (
                              <Pill tone="warning">Đang làm bài</Pill>
                            ) : s.overallScore != null ? (
                              <Pill tone={s.overallScore >= 80 ? 'success' : s.overallScore >= 50 ? 'warning' : 'danger'}>
                                {scoreBand(Math.round(s.overallScore))}
                              </Pill>
                            ) : (
                              <Pill>Đã hoàn thành</Pill>
                            )}
                          </td>
                          <td className="px-space-md py-3 text-right">
                            <Link to={to} className="text-ds-label-md font-semibold text-primary hover:underline no-underline">
                              {s.status === 'COMPLETED' ? 'Xem chi tiết' : 'Tiếp tục'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ============ CỘT PHẢI (4 cột) ============ */}
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          {/* Ví & thanh toán */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-4 text-white">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  Ví &amp; thanh toán
                </span>
                <Link to="/payments" className="text-xs font-semibold text-indigo-100 no-underline hover:text-white">
                  Chi tiết →
                </Link>
              </div>
              <p className="relative m-0 mt-3 text-[11px] font-medium uppercase tracking-wide text-indigo-200">Số dư khả dụng</p>
              <p className="relative m-0 text-2xl font-bold tracking-tight">
                {wallet ? formatVnd(wallet.availableBalance) : '—'}
              </p>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <Link
                to="/packages"
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm no-underline transition-colors hover:bg-indigo-50"
              >
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-indigo-500">workspace_premium</span>
                  Gói tài khoản
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  Nâng cấp
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </span>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/wallet"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
                >
                  <span className="material-symbols-outlined text-[18px]">add_card</span>
                  Nạp tiền
                </Link>
                <Link
                  to="/payments"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:text-indigo-600"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  Thanh toán
                </Link>
              </div>
              <Link to="/my-orders" className="flex items-center justify-between text-xs font-medium text-slate-500 no-underline hover:text-indigo-600">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Đơn hàng &amp; giao dịch
                </span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
          </section>

          {/* Năng lực cốt lõi AI — khối demo */}
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-space-xs">
                <span className={`${ICON} text-[20px] text-primary`}>psychology</span>
                <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">Năng lực cốt lõi AI</h2>
              </div>
              <Pill icon="hive">Khối demo</Pill>
            </div>
            {[
              { label: 'Kiến thức chuyên môn (Tech Depth)', pct: 90 },
              { label: 'Tư duy giải quyết vấn đề (Problem Solving)', pct: 82 },
              { label: 'Phương pháp STAR & Cấu trúc câu trả lời', pct: 86 },
              { label: 'Phản xạ âm thanh & Nhịp điệu giao tiếp', pct: 80 },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-ds-label-sm">
                  <span className="min-w-0 truncate text-slate-900">{row.label}</span>
                  <span className="shrink-0 font-bold text-primary tabular-nums">{row.pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="m-0 text-ds-body-sm text-slate-400">
              Hệ thống chưa chấm điểm theo từng năng lực, chỉ có điểm tổng của mỗi phiên — xem cột "Điểm AI trung bình" ở trên.
            </p>
          </section>

          {/* Việc làm mới trên bảng tin — số thật */}
          {jobs.length > 0 && (
            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-[20px] text-teal-600`}>work</span>
                  <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">Việc làm mới</h2>
                </div>
                <Link to="/jobs" className="text-ds-label-sm text-primary hover:underline">
                  Bảng tin
                </Link>
              </div>
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className={`${SOFT} flex flex-col gap-1 p-space-md`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="m-0 text-ds-label-lg font-semibold text-slate-900">{job.title}</h3>
                  </div>
                  <p className="m-0 text-ds-body-sm text-slate-600">
                    {job.companyName}
                    {job.location ? ` • ${job.location}` : ''}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-ds-label-md font-semibold text-teal-600">{job.salaryRange ?? 'Chưa công khai'}</span>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-ds-label-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary"
                    >
                      Ứng tuyển
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Mẹo vàng từ AI Copilot — khối demo */}
          <section className="rounded-xl bg-indigo-600 p-space-lg text-on-primary shadow-sm">
            <div className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-secondary-container`}>bolt</span>
              <span className="text-ds-label-sm font-bold uppercase tracking-wider text-secondary-container">Mẹo từ AI Copilot</span>
            </div>
            <h3 className="mt-2 text-ds-headline-md font-bold tracking-tight">Tăng 40% tỷ lệ đỗ phỏng vấn</h3>
            <p className="mt-2 text-ds-body-sm text-on-primary/90">
              Khối demo — hệ thống chưa đo tỷ lệ đỗ. Con số lấy nguyên văn từ thiết kế.
            </p>
            <Link
              to="/mock-interviews"
              className="mt-space-md inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-ds-label-md font-bold text-primary shadow-sm no-underline transition-transform active:scale-95"
            >
              Tạo bài phỏng vấn thử 15 phút
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard của các vai trò khác (employer/staff/admin) — chưa có mockup mới, giữ lối dựng cũ
 * bằng primitive `ui.tsx`: chỉ là danh sách đường tắt, không có số liệu.
 */
const ROLE_LINKS: Record<string, { to: string; label: string; description: string; icon: string }[]> = {
  employer: [
    { to: '/my-jobs', label: 'Tin đã đăng', description: 'Quản lý các tin đang tuyển', icon: 'work' },
    { to: '/jobs/new', label: 'Đăng tin mới', description: 'Tạo tin tuyển dụng mới', icon: 'add' },
    // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
    // { to: '/my-slots', label: 'Lịch trống', description: 'Khung giờ phỏng vấn bạn mở cho ứng viên', icon: 'event' },
    { to: '/payments', label: 'Ví & thanh toán', description: 'Nạp tiền, mua gói và theo dõi giao dịch', icon: 'account_balance_wallet' },
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    PaymentService.getWallet()
      .then((res) => setWallet(res.data.data ?? null))
      .catch(() => { /* ví vẫn hiển thị nút nạp/thanh toán khi API lỗi */ });
    OrderService.getMyOrders()
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => { /* danh sách đơn để trống khi chưa có dữ liệu */ });
  }, []);

  const links = [
    ...(role === 'ROLE_ADMIN'
      ? [...ROLE_LINKS.admin, ...ROLE_LINKS.employer]
      : role === 'ROLE_STAFF'
        ? [...ROLE_LINKS.staff, ...ROLE_LINKS.employer]
        : ROLE_LINKS.employer),
  ].filter((item) => role !== 'ROLE_INTERVIEWER' || !item.to.startsWith('/admin'));

  const pendingOrders = orders.filter((order) => order.status === 'PENDING');
  const paidTotal = orders
    .filter((order) => order.status === 'PAID')
    .reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-teal-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">space_dashboard</span>
              Bảng điều khiển nhà tuyển dụng
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Chào mừng {user?.fullName ?? 'bạn'} trở lại!
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Quản lý tin tuyển dụng, lịch phỏng vấn và thanh toán của bạn trong một nơi duy nhất.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Đăng tin mới
            </Link>
            <Link
              to="/payments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Ví &amp; thanh toán
            </Link>
          </div>
        </div>
      </section>

      {/* Wallet summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            label: 'Số dư khả dụng',
            value: wallet ? formatVnd(wallet.availableBalance) : '—',
            icon: 'account_balance_wallet',
            tone: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Đơn chờ thanh toán',
            value: `${pendingOrders.length} đơn`,
            icon: 'receipt_long',
            tone: 'bg-violet-50 text-violet-600',
          },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="m-0 mt-1 truncate text-lg font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Wallet actions */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-4">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              Ví &amp; thanh toán
            </div>
            <p className="m-0 mt-3 text-[11px] font-medium uppercase tracking-wide text-indigo-200">Tổng đã thanh toán</p>
            <p className="m-0 text-2xl font-bold tracking-tight">{formatVnd(paidTotal)}</p>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <Link
              to="/wallet"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Nạp tiền vào ví
            </Link>
            <Link
              to="/packages"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:text-indigo-600"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Mua gói dịch vụ
            </Link>
            <Link
              to="/my-orders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:text-indigo-600"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Đơn hàng của tôi
            </Link>
          </div>
        </section>

        {/* Quick links */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="m-0 text-lg font-bold text-slate-900">Công cụ tuyển dụng</h2>
              <p className="m-0 mt-0.5 text-sm text-slate-500">Các lối tắt dành cho vai trò của bạn.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm group-hover:bg-indigo-50">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{item.description}</span>
                </span>
                <span className="material-symbols-outlined ml-auto text-[18px] text-slate-300 group-hover:text-indigo-500">arrow_forward</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'ROLE_USER' ? <CandidateDashboard /> : <WorkspaceDashboard />;
};

export default DashboardPage;
