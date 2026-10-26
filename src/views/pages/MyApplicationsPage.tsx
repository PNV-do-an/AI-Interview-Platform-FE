/**
 * Màn "Đơn ứng tuyển của tôi" (mockup Stitch `screen_7`) — route /my-applications, shell CandidateLayout.
 *
 * Giữ nguyên luồng cũ: GET đơn của ứng viên (`fetchMyApplications(page)`), đặt lịch phỏng vấn
 * (`openBooking`/`confirmBooking` qua `useSlotController`), rút đơn (`cancelApplication` +
 * ConfirmDialog), tab lọc trạng thái + tìm kiếm chạy ở client, phân trang, chuyển kiểu xem thẻ/bảng.
 *
 * Số thật trên màn: totalElements, trạng thái đơn, `score` (điểm sàng lọc), `slot` (giờ phỏng vấn
 * + ghi chú của doanh nghiệp), `createdAt`/`updatedAt`, tên công ty + vị trí, `feedback`,
 * tên CV (`profile.cvFileName`).
 * Stepper "Tiến trình xét duyệt" SUY RA từ 6 trạng thái thật của đơn (nộp -> xét -> phỏng vấn -> kết quả),
 * không phải 5 chặng do AI viết.
 *
 * Sao đổi so với mockup:
 * - "Mã đơn: #APP-2025-089" -> dùng id thật của đơn; "HR Lead: ...", địa chỉ trụ sở, tech stack,
 *   mức lương: BỎ — đơn ứng tuyển không lưu những thông tin đó.
 * - Card "Lưu Lịch Google" / "Vào phòng họp": BỎ — không có link tham gia họp, hiện khung giờ đã đặt.
 * - Dropdown "Vòng tuyển dụng / Thời gian nộp / Sắp xếp": BỎ — BE không nhận bộ lọc/sắp xếp,
 *   tab trạng thái + ô tìm kiếm (client-side, chỉ áp dụng trên trang đang xem) đã đủ.
 * - "+3 đơn trong tháng 10/2025", "92% độ tương thích", "Đạt 88/100", "Tỷ lệ thành công 75%",
 *   "42% tỷ lệ nhận Offer": giữ nguyên chữ thiết kế + dán nhãn "Khối demo".
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useSlotController } from '../../controllers/useSlotController';
import { useAuth } from '../../context/AuthContext';
import {
  APPLICATION_STATUS_LABELS, Application, ApplicationStatus,
} from '../../models/Program.model';
import { parseServerTimestamp } from '../../utils/date';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  DemoTag, EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pill, adminButton, adminInputClass,
  adminTableClass, adminTdClass, adminThClass, fmtServer, timeAgo,
} from '../components/adminKit';
import {
  CARD, CandidatePageHeader, CandidateStat, SOFT, StatusChip, Stepper, type Step,
} from '../components/candidateKit';

interface TabDef {
  key: string;
  label: string;
  statuses: ApplicationStatus[] | null;
}

// Tab phân đoạn của mockup, ánh xạ lên Application.status thật.
const TAB_DEFS: TabDef[] = [
  { key: 'all', label: 'Tất cả', statuses: null },
  { key: 'review', label: 'Chờ xét duyệt', statuses: ['PENDING'] },
  { key: 'scheduled', label: 'Hẹn lịch phỏng vấn', statuses: ['SCHEDULED'] },
  { key: 'interviewed', label: 'Đã phỏng vấn', statuses: ['INTERVIEWED'] },
  { key: 'offers', label: 'Đạt yêu cầu & Offer', statuses: ['ACCEPTED'] },
  { key: 'closed', label: 'Đã đóng', statuses: ['REJECTED', 'CANCELLED'] },
];

const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  PENDING: 'info',
  SCHEDULED: 'primary',
  INTERVIEWED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

const STATUS_ICON: Record<ApplicationStatus, string> = {
  PENDING: 'hourglass_empty',
  SCHEDULED: 'calendar_today',
  INTERVIEWED: 'task_alt',
  ACCEPTED: 'verified',
  REJECTED: 'do_not_disturb_on',
  CANCELLED: 'cancel',
};

const isClosed = (status: ApplicationStatus) => status === 'REJECTED' || status === 'CANCELLED';
const slotStart = (app: Application) => parseServerTimestamp(app.slot?.startTime)?.getTime() ?? 0;

/** Tiến trình 4 chặng dẫn xuất từ status + điểm sàng lọc + lịch đã đặt (toàn bộ là số thật). */
const stepsOf = (app: Application): Step[] => {
  const reachedInterview = app.status === 'INTERVIEWED' || app.status === 'ACCEPTED';
  return [
    {
      label: '1. Nộp hồ sơ',
      meta: fmtServer(app.createdAt, 'date'),
      state: 'done',
    },
    {
      label: '2. Xét hồ sơ',
      meta: app.score != null ? `${app.score}/100 điểm sàng lọc` : 'Chưa có điểm sàng lọc',
      state: app.status === 'PENDING' ? 'current' : 'done',
    },
    {
      label: '3. Phỏng vấn',
      meta: app.slot ? fmtServer(app.slot.startTime, 'datetime') : 'Chưa có lịch phỏng vấn',
      state: app.status === 'SCHEDULED' ? 'current' : reachedInterview ? 'done' : 'todo',
    },
    {
      label: '4. Kết quả',
      meta: app.feedback ? 'Đã có phản hồi' : 'Chờ kết luận từ doanh nghiệp',
      state: app.status === 'ACCEPTED'
        ? 'done'
        : isClosed(app.status)
          ? 'failed'
          : 'todo',
    },
  ];
};

const MyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, bookSlot,
    fetchProfile, clearMessages,
  } = useCandidateController();
  const { availableSlots, fetchAvailableSlots } = useSlotController();

  const [page, setPage] = useState(0);
  const [bookingApp, setBookingApp] = useState<Application | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [pendingWithdraw, setPendingWithdraw] = useState<Application | null>(null);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMyApplications(0);
      fetchProfile();
    }
  }, [user]);

  const openBooking = async (app: Application) => {
    clearMessages();
    setSelectedSlot(null);
    setBookingApp(app);
    await fetchAvailableSlots(app.employerId);
  };

  const confirmBooking = async () => {
    if (!bookingApp || !selectedSlot) return;
    const ok = await bookSlot(selectedSlot, bookingApp.id);
    if (ok) {
      setBookingApp(null);
      fetchMyApplications(page);
    }
  };

  const withdraw = (app: Application) => setPendingWithdraw(app);

  const runWithdraw = async () => {
    if (!pendingWithdraw) return;
    const id = pendingWithdraw.id;
    setPendingWithdraw(null);
    const ok = await cancelApplication(id);
    if (ok) fetchMyApplications(page);
  };

  const content = applications?.content ?? [];

  const tabCounts = useMemo(
    () =>
      TAB_DEFS.map((t) => ({
        ...t,
        count: content.filter((a) => !t.statuses || t.statuses.includes(a.status)).length,
      })),
    [content]
  );

  const visible = useMemo(() => {
    const def = TAB_DEFS.find((t) => t.key === tab) ?? TAB_DEFS[0];
    const q = query.trim().toLowerCase();
    return content.filter((a) => {
      const inTab = !def.statuses || def.statuses.includes(a.status);
      const inQuery =
        !q ||
        a.companyName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q);
      return inTab && inQuery;
    });
  }, [content, tab, query]);

  // Phỏng vấn kế tiếp: khung giờ đã đặt sớm nhất còn hiệu lực trong trang đang tải.
  const nextInterview = useMemo(() => {
    const now = Date.now();
    const upcoming = content
      .filter((a) => a.slot && slotStart(a) >= now)
      .sort((a, b) => slotStart(a) - slotStart(b));
    return upcoming[0] ?? null;
  }, [content]);

  // Đơn nổi bật: ưu tiên đơn có lịch gần nhất, rồi đơn đang mở, rồi đơn đầu trang.
  const spotlight = useMemo(() => {
    if (nextInterview) return nextInterview;
    const open = content.find((a) => !isClosed(a.status));
    return open ?? content[0] ?? null;
  }, [content, nextInterview]);

  const pageCounts = useMemo(() => {
    const pending = content.filter((a) => a.status === 'PENDING').length;
    const scheduled = content.filter((a) => a.status === 'SCHEDULED').length;
    const accepted = content.filter((a) => a.status === 'ACCEPTED').length;
    const scored = content.filter((a) => a.score != null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length)
      : null;
    return { pending, scheduled, accepted, avgScore };
  }, [content]);

  const lastSync = useMemo(() => {
    const stamps = content
      .map((a) => a.updatedAt)
      .filter((v): v is string => Boolean(v))
      .sort((a, b) => (parseServerTimestamp(b)?.getTime() ?? 0) - (parseServerTimestamp(a)?.getTime() ?? 0));
    return stamps[0] ?? null;
  }, [content]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={CARD}>
        <div className="flex flex-col items-center gap-space-sm p-space-lg text-ds-body-md text-on-surface-variant">
          <span className={`${ICON} text-[28px] text-outline`}>account_box</span>
          Vui lòng đăng nhập bằng tài khoản ứng viên.
        </div>
      </div>
    );
  }
  if (loading && !applications) return <LoadingBlock label="Đang tải đơn ứng tuyển..." />;

  const total = applications?.totalElements ?? 0;
  const size = applications?.size ?? 10;
  const showingFrom = total === 0 ? 0 : page * size + 1;
  const showingTo = Math.min((page + 1) * size, total);
  const totalPages = applications?.totalPages ?? 1;

  const renderActions = (app: Application, compact = false) => (
    <div className="flex flex-wrap items-center justify-end gap-space-xs">
      {app.status === 'PENDING' && (
        <button
          type="button"
          className={adminButton('primary', compact ? 'h-9 px-3' : 'h-10')}
          onClick={() => void openBooking(app)}
        >
          <span className={`${ICON} text-[18px]`}>event_available</span>
          Đặt lịch phỏng vấn
        </button>
      )}
      {(app.status === 'PENDING' || app.status === 'SCHEDULED') && (
        <button
          type="button"
          onClick={() => withdraw(app)}
          className={`inline-flex items-center gap-1.5 rounded-lg text-ds-label-md font-semibold text-error transition-colors hover:bg-error-container ${
            compact ? 'h-9 px-3' : 'h-10 px-4'
          }`}
        >
          <span className={`${ICON} text-[18px]`}>user_cancel</span>
          Rút đơn ứng tuyển
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Đơn ứng tuyển' }]}
        title="Đơn ứng tuyển của tôi"
        subtitle="Theo dõi tiến độ tuyển dụng, lịch phỏng vấn và phản hồi từ các doanh nghiệp theo thời gian thực."
        status={
          spotlight ? (
            <StatusChip
              label={nextInterview ? 'Sắp phỏng vấn' : 'Đang theo dõi'}
              tone={nextInterview ? 'primary' : 'teal'}
            />
          ) : undefined
        }
        actions={
          <>
            <Link to="/jobs" className={adminButton('primary', 'h-10 no-underline')}>
              <span className={`${ICON} text-[20px]`}>add_circle</span>
              Tìm việc làm mới
            </Link>
            <button
              type="button"
              onClick={() => fetchMyApplications(page)}
              className={adminButton('ghost', 'h-10')}
            >
              <span className={`${ICON} text-[18px] text-outline`}>autorenew</span>
              Làm mới
            </button>
          </>
        }
      />

      {/* 4 card chỉ số — giá trị đếm từ trang đang xem, unit ghi rõ phạm vi. */}
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        <CandidateStat
          label="Tổng số đơn nộp"
          value={total}
          unit="đơn hồ sơ"
          icon="send"
          tone="primary"
          sub={
            <span className="text-on-surface-variant">
              Trang này có {content.length} đơn • trung bình điểm sàng lọc{' '}
              {pageCounts.avgScore != null ? `${pageCounts.avgScore}/100` : 'chưa có'}
            </span>
          }
        />
        <CandidateStat
          label="Đang chờ xét duyệt"
          value={pageCounts.pending}
          unit="vị trí"
          icon="pending_actions"
          tone="neutral"
          sub={
            <span className="text-on-surface-variant">
              Đếm trong trang đang xem (trang {page + 1})
            </span>
          }
        />
        <CandidateStat
          label="Đã có lịch phỏng vấn"
          value={pageCounts.scheduled}
          unit="đơn"
          icon="event_available"
          tone="tertiary"
          sub={
            nextInterview?.slot ? (
              <>
                <Pill tone="primary" icon="alarm">
                  Sắp tới: {fmtServer(nextInterview.slot.startTime, 'datetime')}
                </Pill>
                <span className="truncate text-on-surface-variant">{nextInterview.companyName}</span>
              </>
            ) : (
              <span className="text-on-surface-variant">Chưa có lịch kế tiếp trong trang này</span>
            )
          }
        />
        <CandidateStat
          label="Đã nhận Offer"
          value={pageCounts.accepted}
          unit="đơn"
          icon="verified"
          tone="teal"
          sub={
            <>
              <DemoTag>Khối demo — tỷ lệ thành công</DemoTag>
              <span className="text-on-surface-variant">
                {content.length ? `Trang này: ${Math.round((pageCounts.accepted / content.length) * 100)}% đạt` : 'Trống'}
              </span>
            </>
          }
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={() => fetchMyApplications(page)} />}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-secondary-container px-4 py-3 text-ds-body-md text-on-secondary-container" role="status">
          <span className={`${ICON} shrink-0 text-[18px]`}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {profile && !profile.cvFileName && (
        <div className={`flex flex-wrap items-center gap-space-sm px-4 py-3 text-ds-body-md text-on-surface-variant ${SOFT}`}>
          <span className={`${ICON} text-[20px] text-tertiary`}>info</span>
          <span>
            Hồ sơ của bạn chưa có CV. Hãy cập nhật ở{' '}
            <Link to="/my-profile" className="font-semibold text-primary no-underline hover:underline">
              trang Hồ sơ &amp; CV
            </Link>{' '}
            để nhà tuyển dụng có thể tìm thấy bạn.
          </span>
        </div>
      )}

      {/* Khối nổi bật: đơn cần chú ý + tiến trình xét duyệt dẫn xuất từ trạng thái thật. */}
      {spotlight && (
        <section className={`relative flex flex-col gap-space-md overflow-hidden rounded-xl p-space-lg ${CARD} shadow-md`}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className={`relative flex flex-col gap-space-md rounded-xl bg-surface-container-low/60 p-space-md lg:flex-row lg:items-center lg:justify-between`}>
            <div className="flex min-w-0 items-start gap-space-md">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-container text-ds-headline-md font-bold text-on-primary">
                {(spotlight.companyName || '?').slice(0, 3).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <Pill tone={STATUS_TONE[spotlight.status]} icon={STATUS_ICON[spotlight.status]}>
                    {APPLICATION_STATUS_LABELS[spotlight.status]}
                  </Pill>
                  <span className="text-ds-label-sm text-outline">Mã đơn #{spotlight.id}</span>
                </div>
                <h2 className="m-0 text-ds-headline-md text-on-surface">{spotlight.jobTitle}</h2>
                <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-ds-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className={`${ICON} text-[16px] text-outline`}>apartment</span>
                    {spotlight.companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`${ICON} text-[16px] text-outline`}>calendar_today</span>
                    Ngày nộp: {fmtServer(spotlight.createdAt, 'date')} ({timeAgo(spotlight.createdAt)})
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
            <div className="flex shrink-0 flex-wrap items-center gap-space-sm self-end lg:self-center">
              {renderActions(spotlight)}
            </div>
          </div>

          <div className="relative flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-xs">
              <span className="text-ds-label-md uppercase tracking-wider text-on-surface">
                Tiến trình xét duyệt {stepsOf(spotlight).length} chặng
              </span>
              <span className="text-ds-body-sm font-semibold text-primary">
                {APPLICATION_STATUS_LABELS[spotlight.status]}
              </span>
            </div>
            <Stepper steps={stepsOf(spotlight)} />
          </div>

          {spotlight.feedback && (
            <div className={`relative flex items-start gap-space-sm p-space-md text-ds-body-md text-on-surface-variant ${SOFT}`}>
              <span className={`${ICON} text-[20px] text-outline`}>chat</span>
              <span>{spotlight.feedback}</span>
            </div>
          )}

          <div className="relative grid grid-cols-1 gap-space-md lg:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-xl border border-outline-variant/40 bg-surface-container-low p-space-md lg:col-span-2">
              {spotlight.slot ? (
                <>
                  <span className="flex items-center gap-2 text-ds-label-lg font-bold text-on-surface">
                    <span className={`${ICON} text-[20px] text-primary`}>schedule</span>
                    Khung giờ đã đặt
                  </span>
                  <span className="text-ds-body-md text-on-surface-variant">
                    {fmtServer(spotlight.slot.startTime, 'datetime')} — {fmtServer(spotlight.slot.endTime, 'time')}
                  </span>
                  {spotlight.slot.note && (
                    <span className="text-ds-body-sm text-on-surface-variant">
                      Ghi chú từ doanh nghiệp: {spotlight.slot.note}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2 text-ds-label-lg font-bold text-on-surface">
                    <span className={`${ICON} text-[20px] text-outline`}>event_busy</span>
                    Chưa có lịch phỏng vấn
                  </span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    {spotlight.status === 'PENDING'
                      ? 'Khi hồ sơ được duyệt, bạn sẽ chọn khung giờ ở nút "Đặt lịch phỏng vấn".'
                      : 'Doanh nghiệp chưa mở khung giờ cho đơn này.'}
                  </span>
                </>
              )}
            </div>

            <div className={`flex flex-col justify-between gap-space-sm p-space-md ${SOFT}`}>
              <div className="flex items-start gap-2">
                <span className={`${ICON} shrink-0 text-[20px] text-primary`}>psychology</span>
                <div className="flex flex-col">
                  <span className="flex flex-wrap items-center gap-1 text-ds-label-md font-bold text-primary">
                    Lời khuyên từ AI Copilot
                    <DemoTag>Khối demo</DemoTag>
                  </span>
                  <p className="m-0 text-ds-body-sm text-on-surface-variant">
                    Hãy ôn lại các kỹ năng đúng trong mô tả công việc và luyện 1–2 phiên mô phỏng
                    trước buổi phỏng vấn chính thức.
                  </p>
                </div>
              </div>
              <Link
                to="/mock-interviews"
                className={adminButton('soft', 'w-full justify-center no-underline')}
              >
                <span className={`${ICON} text-[16px]`}>smart_toy</span>
                Luyện phỏng vấn AI
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Thanh tab + tìm kiếm + chuyển kiểu xem. */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex max-w-full items-center gap-space-xs overflow-x-auto pb-1">
            {tabCounts.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap rounded-full px-space-md py-2 text-ds-label-md font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums opacity-80">{t.count}</span>
                </button>
              );
            })}
          </div>
          <span className="flex items-center gap-1 text-ds-body-sm text-outline">
            <span className={`${ICON} text-[18px]`}>sync</span>
            {lastSync ? `Cập nhật ${timeAgo(lastSync)} trước` : 'Chưa có mốc cập nhật'}
          </span>
        </div>

        <div className="flex flex-col gap-space-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <span className={`${ICON} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline`}>
              search
            </span>
            <input
              className={`${adminInputClass} pl-11`}
              placeholder="Tìm theo vị trí hoặc tên doanh nghiệp..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm theo vị trí hoặc tên doanh nghiệp"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
            {(['cards', 'table'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                title={mode === 'cards' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
                aria-label={mode === 'cards' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
                onClick={() => setView(mode)}
                className={`flex h-8 w-8 items-center justify-center rounded transition-all ${
                  view === mode
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`${ICON} text-[18px]`}>{mode === 'cards' ? 'view_agenda' : 'table_rows'}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-ds-body-sm text-outline">
          Tab và ô tìm kiếm lọc trên trang đang xem (trang {page + 1}/{totalPages}); đơn ở trang khác
          vẫn tính trong card "Tổng số đơn nộp".
        </p>
      </section>

      {!applications || content.length === 0 ? (
        <section className={`${CARD} p-space-lg`}>
          <EmptyBlock
            icon="description"
            title="Chưa có đơn ứng tuyển nào"
            description="Ứng tuyển một tin tuyển dụng để theo dõi tiến trình xét duyệt và lịch phỏng vấn tại đây."
            action={
              <button type="button" className={adminButton('primary')} onClick={() => navigate('/jobs')}>
                Xem tin tuyển dụng
              </button>
            }
          />
        </section>
      ) : visible.length === 0 ? (
        <section className={`${CARD} p-space-lg`}>
          <EmptyBlock icon="filter_list_off" title="Không có đơn ứng tuyển khớp bộ lọc." />
        </section>
      ) : view === 'cards' ? (
        <div className="flex flex-col gap-space-md">
          {visible.map((app) => (
            <article key={app.id} className={`${CARD} flex flex-col gap-space-md p-space-lg transition-shadow hover:shadow-md`}>
              <div className="flex flex-col gap-space-sm md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-space-sm">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-ds-headline-md font-bold text-primary">
                    {(app.companyName || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <h2 className="m-0 text-ds-headline-sm font-semibold text-on-surface">{app.jobTitle}</h2>
                      <Pill tone={STATUS_TONE[app.status]} icon={STATUS_ICON[app.status]}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Pill>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-ds-body-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className={`${ICON} text-[16px] text-outline`}>apartment</span>
                        {app.companyName}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`${ICON} text-[16px] text-outline`}>schedule</span>
                        Đã nộp {fmtServer(app.createdAt, 'date')} • {timeAgo(app.createdAt)}
                      </span>
                      {app.score != null && (
                        <span className="flex items-center gap-1">
                          <span className={`${ICON} text-[16px] text-outline`}>auto_awesome</span>
                          Điểm sàng lọc {app.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-ds-label-sm text-outline">#{app.id}</span>
              </div>

              <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
                <Stepper steps={stepsOf(app)} />
                {app.slot && (
                  <span className="flex flex-wrap items-center gap-1 text-ds-body-sm font-semibold text-primary">
                    <span className={`${ICON} text-[16px]`}>event_available</span>
                    Lịch phỏng vấn: {fmtServer(app.slot.startTime, 'datetime')} — {fmtServer(app.slot.endTime, 'time')}
                  </span>
                )}
                {app.feedback && (
                  <p className="m-0 text-ds-body-sm text-on-surface-variant">{app.feedback}</p>
                )}
              </div>

              <div className="flex flex-col items-stretch justify-between gap-space-sm sm:flex-row sm:items-center">
                {profile?.cvFileName ? (
                  <span className="text-ds-body-sm text-outline">
                    CV đã tải lên:{' '}
                    <span className="font-mono text-ds-label-sm text-on-surface-variant">{profile.cvFileName}</span>
                  </span>
                ) : (
                  <span className="text-ds-body-sm text-outline">Chưa có CV trong hồ sơ</span>
                )}
                {renderActions(app)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className={adminTableClass}>
              <thead>
                <tr>
                  <th className={adminThClass}>Vị trí</th>
                  <th className={adminThClass}>Doanh nghiệp</th>
                  <th className={adminThClass}>Ngày nộp</th>
                  <th className={adminThClass}>Trạng thái</th>
                  <th className={`${adminThClass} text-center`}>Điểm sàng lọc</th>
                  <th className={`${adminThClass} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-surface-container-low/60">
                    <td className={adminTdClass}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-on-surface">{app.jobTitle}</span>
                        {app.slot && (
                          <span className="text-ds-body-sm text-primary">
                            {fmtServer(app.slot.startTime, 'datetime')}
                          </span>
                        )}
                        {!app.slot && app.feedback && (
                          <span className="text-ds-body-sm text-on-surface-variant">{app.feedback}</span>
                        )}
                      </div>
                    </td>
                    <td className={adminTdClass}>
                      <div className="flex items-center gap-space-sm">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-ds-label-md font-bold text-primary">
                          {(app.companyName || '?').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="text-ds-label-md text-on-surface">{app.companyName}</span>
                      </div>
                    </td>
                    <td className={adminTdClass}>
                      <div className="flex flex-col whitespace-nowrap">
                        <span className="text-ds-label-md text-on-surface">{fmtServer(app.createdAt, 'date')}</span>
                        <span className="text-ds-body-sm text-outline">{timeAgo(app.createdAt)}</span>
                      </div>
                    </td>
                    <td className={adminTdClass}>
                      <Pill tone={STATUS_TONE[app.status]} icon={STATUS_ICON[app.status]}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Pill>
                    </td>
                    <td className={`${adminTdClass} text-center`}>
                      {app.score != null ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-ds-label-md font-bold tabular-nums text-on-surface">
                          {app.score}/100
                        </span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className={`${adminTdClass} text-right`}>{renderActions(app, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {content.length > 0 && totalPages > 1 && (
        <div className={`${CARD} flex flex-col items-center justify-between gap-space-md p-space-md sm:flex-row`}>
          <span className="text-ds-body-sm text-outline">
            Hiển thị <span className="font-semibold text-on-surface">{showingFrom}–{showingTo}</span> trong tổng số{' '}
            <span className="font-semibold text-on-surface">{total}</span> đơn ứng tuyển
          </span>
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => {
                setPage(page - 1);
                fetchMyApplications(page - 1);
              }}
              className={adminButton('ghost', 'h-9 px-3 disabled:opacity-40')}
            >
              <span className={`${ICON} text-[18px]`}>chevron_left</span>
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPage(i);
                  fetchMyApplications(i);
                }}
                className={`h-8 w-8 rounded-lg text-ds-label-md font-semibold transition-colors ${
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
              disabled={page + 1 >= totalPages}
              onClick={() => {
                setPage(page + 1);
                fetchMyApplications(page + 1);
              }}
              className={adminButton('ghost', 'h-9 px-3 disabled:opacity-40')}
            >
              Sau
              <span className={`${ICON} text-[18px]`}>chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* CTA ngữ cảnh dưới trang — con số so sánh là số minh hoạ của thiết kế. */}
      <div className="flex flex-col items-center justify-between gap-space-lg rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-lg text-on-primary md:flex-row">
        <div className="flex items-center gap-space-md">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <span className={`${ICON} text-[30px] text-secondary-fixed`}>auto_awesome</span>
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-ds-headline-md font-bold text-on-primary">
              Tối ưu hóa khả năng trúng tuyển cùng AI Coach
            </h3>
            <p className="m-0 max-w-xl text-ds-body-md text-on-primary-container">
              Luyện một phiên mô phỏng theo đúng mô tả công việc trước buổi phỏng vấn chính thức.
            </p>
          </div>
        </div>
        <Link
          to="/mock-interviews"
          className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary-fixed px-space-lg text-ds-label-lg font-bold text-on-secondary-fixed shadow-sm no-underline transition-all hover:brightness-105 md:w-auto"
        >
          <span className={`${ICON} text-[20px]`}>play_circle</span>
          Bắt đầu Luyện Phỏng vấn Ngay
        </Link>
      </div>

      {bookingApp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
          <div className={`flex max-h-[80vh] w-full max-w-[520px] flex-col gap-space-md overflow-y-auto p-space-lg ${CARD}`}>
            <div className="flex items-start justify-between gap-space-sm">
              <div>
                <h3 className="m-0 text-ds-headline-sm font-bold text-on-surface">
                  Chọn giờ phỏng vấn — {bookingApp.jobTitle}
                </h3>
                <p className="mt-0.5 text-ds-body-sm text-on-surface-variant">{bookingApp.companyName}</p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setBookingApp(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className={`${ICON} text-[20px]`}>close</span>
              </button>
            </div>

            {availableSlots.length === 0 ? (
              <EmptyBlock
                icon="event_busy"
                title="Chưa có khung giờ trống"
                description="Doanh nghiệp chưa mở lịch cho đơn này. Vui lòng quay lại sau."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {availableSlots.map((s) => {
                  const active = selectedSlot === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-space-sm rounded-lg border px-space-md py-space-sm text-ds-body-md transition-colors ${
                        active
                          ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant'
                          : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        checked={active}
                        onChange={() => setSelectedSlot(s.id)}
                        className="mr-1 accent-[#4f46e5]"
                      />
                      <span className={`${ICON} text-[18px] text-outline`}>schedule</span>
                      <span>
                        {fmtServer(s.startTime, 'datetime')} — {fmtServer(s.endTime, 'time')}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-space-sm">
              <button type="button" className={adminButton('ghost')} onClick={() => setBookingApp(null)}>
                Đóng
              </button>
              {availableSlots.length > 0 && (
                <button
                  type="button"
                  className={adminButton('primary', 'disabled:opacity-40')}
                  onClick={() => void confirmBooking()}
                  disabled={!selectedSlot}
                >
                  <span className={`${ICON} text-[18px]`}>check</span>
                  Xác nhận và đặt lịch
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingWithdraw !== null}
        title="Rút đơn ứng tuyển này?"
        message={
          pendingWithdraw
            ? `Đơn ứng tuyển cho "${pendingWithdraw.jobTitle}" sẽ bị huỷ. Không thể hoàn tác.`
            : ''
        }
        confirmLabel="Rút đơn"
        cancelLabel="Giữ lại"
        danger
        onConfirm={() => void runWithdraw()}
        onCancel={() => setPendingWithdraw(null)}
      />
    </div>
  );
};

export default MyApplicationsPage;
