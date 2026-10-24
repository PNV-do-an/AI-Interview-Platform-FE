import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import {
  AuditLog, PagedResponse, Role,
} from '../../models/User.model';
import {
  DashboardResponse, DashboardRange, ModerationJob, ModerationJobDetail,
} from '../../models/AdminConsole.model';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  AdminPageHeader, EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pill, adminButton,
  errorText, fmtServer, timeAgo,
} from '../components/adminKit';

/**
 * Tổng quan Quản trị Hệ thống — screen `dash_board_admin` (mockup Stitch 2026-10-21).
 *
 * DATA (số thật): GET /admin/dashboard?days= (009 thêm `trends.months`,
 * `interviews.avgDurationSeconds`, `interviews.liveNow`), GET /admin/audit-logs,
 * GET /admin/jobs/moderation?status=PENDING_APPROVAL (+ detail cho 3 thẻ hàng chờ và
 * block cảnh báo từ `aiSafety.checks`), PATCH /jobs/{id}/review cho "Duyệt nhanh".
 * DEMO còn lại (BE chưa có endpoint, đã ghi nhận ở spec/INDEX.md):
 *   - card "Tài nguyên AI & Hệ thống": uptime 99.98%, độ trễ 320ms, token 1.240/2.500
 *     (chỉ dòng "phòng đang live" là số thật `interviews.liveNow`);
 *   - hai nút "Theo tuần" / "Theo giờ trong ngày" của biểu đồ (API chỉ có chuỗi 12 tháng).
 * Phân đoạn mốc thời gian chỉ có 7/30/90 vì BE trả 400 với giá trị khác. Chuỗi 12 tháng
 * KHÔNG đổi theo mốc đang xem - BE luôn trả đúng 12 bucket kết thúc ở tháng hiện tại.
 */

const RANGE_LABEL: Record<DashboardRange, string> = { 7: '7 ngày', 30: '30 ngày qua', 90: '90 ngày' };

const ROLE_BUCKET: { key: Role | 'STAFF_ADMIN'; label: string }[] = [
  { key: 'ROLE_USER', label: 'Ứng viên' },
  { key: 'ROLE_INTERVIEWER', label: 'Doanh nghiệp' },
  { key: 'STAFF_ADMIN', label: 'Mod/Admin' },
];

const DONUT_TONE: { color: string; text: string }[] = [
  { color: '#4f46e5', text: 'text-primary' },
  { color: '#006b5f', text: 'text-secondary-teal' },
  { color: '#005cc6', text: 'text-tertiary' },
  { color: '#c7c4d8', text: 'text-on-surface-variant' },
];

const ACTION_META: Record<string, { label: string; icon: string; cat: 'user' | 'job' | 'security' | 'interview' }> = {
  INVITE_USER: { label: 'Mời thành viên mới', icon: 'person_add', cat: 'user' },
  RESEND_INVITATION: { label: 'Gửi lại lời mời', icon: 'send', cat: 'user' },
  REVOKE_INVITATION: { label: 'Thu hồi lời mời', icon: 'link_off', cat: 'user' },
  UPDATE_PROFILE: { label: 'Cập nhật hồ sơ', icon: 'badge', cat: 'user' },
  CHANGE_ROLE: { label: 'Chuyển vai trò', icon: 'admin_panel_settings', cat: 'user' },
  ENABLE_USER: { label: 'Kích hoạt tài khoản', icon: 'how_to_reg', cat: 'user' },
  DISABLE_USER: { label: 'Vô hiệu hóa tài khoản', icon: 'block', cat: 'user' },
  DELETE_USER: { label: 'Xóa tài khoản', icon: 'delete', cat: 'security' },
  RESTORE_USER: { label: 'Phục hồi tài khoản', icon: 'restore', cat: 'user' },
  VIEW_USER: { label: 'Xem hồ sơ tài khoản', icon: 'visibility', cat: 'user' },
  EXPORT_USERS: { label: 'Xuất CSV danh sách', icon: 'download', cat: 'user' },
  LOCK_USER: { label: 'Khóa tài khoản', icon: 'lock', cat: 'security' },
  UNLOCK_USER: { label: 'Mở khóa tài khoản', icon: 'lock_open', cat: 'security' },
  RESET_PASSWORD: { label: 'Gửi mail đặt lại mật khẩu', icon: 'key', cat: 'security' },
  APPROVE_JOB: { label: 'Duyệt tin tuyển dụng', icon: 'verified', cat: 'job' },
  REJECT_JOB: { label: 'Từ chối tin tuyển dụng', icon: 'gavel', cat: 'job' },
  UPDATE_SETTINGS: { label: 'Cập nhật cấu hình hệ thống', icon: 'tune', cat: 'interview' },
};

const CHIPS: { key: 'all' | 'user' | 'job' | 'interview' | 'security'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'user', label: 'Người dùng mới' },
  { key: 'job', label: 'Tin tuyển dụng' },
  { key: 'interview', label: 'Phiên phỏng vấn' },
  { key: 'security', label: 'Cảnh báo bảo mật' },
];

/**
 * Biểu đồ area "Tần suất & Xu hướng" vẽ từ `dashboard.trends.months` (009 FR-001),
 * giữ đúng hình dáng mockup: viewBox 0 0 760 220, đáy y=205, đỉnh y=18, hai series cubic.
 */
const CHART_W = 760;
const CHART_BASE = 205;
const CHART_TOP = 18;

/** Series thành path lấp (area) + path nét (line) + tọa độ từng điểm; `scale` = max của cả hai series. */
const seriesPaths = (values: number[], scale: number): {
  area: string; line: string; points: [number, number][];
} => {
  const n = values.length;
  const point = (i: number, v: number): [number, number] => [
    n <= 1 ? 0 : (i * CHART_W) / (n - 1),
    CHART_BASE - (scale > 0 ? (v / scale) * (CHART_BASE - CHART_TOP) : 0),
  ];
  const coords = values.map(point);
  if (coords.length === 0) return { line: '', area: '', points: [] };
  let line = `M ${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i += 1) {
    const [px, py] = coords[i - 1];
    const [cx, cy] = coords[i];
    const mid = ((px + cx) / 2).toFixed(1);
    line += ` C ${mid},${py.toFixed(1)} ${mid},${cy.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
  }
  const last = coords[coords.length - 1];
  return { line, points: coords, area: `${line} L ${last[0].toFixed(1)},${CHART_BASE} L 0,${CHART_BASE} Z` };
};

/** "24m 18s" theo mockup; null/âm -> '—'. */
const fmtMmSs = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  return `${m}m ${seconds % 60}s`;
};

/** "2026-10" -> "T10". */
const monthLabel = (yyyymm: string): string => {
  const parts = yyyymm.split('-');
  return `T${parts[1] ?? yyyymm}`;
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts[0]) return 'JD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState<DashboardRange>(30);
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [logs, setLogs] = useState<PagedResponse<AuditLog> | null>(null);
  const [queue, setQueue] = useState<ModerationJob[]>([]);
  const [queueDetails, setQueueDetails] = useState<Record<number, ModerationJobDetail>>({});
  const [chip, setChip] = useState<'all' | 'user' | 'job' | 'interview' | 'security'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveTarget, setApproveTarget] = useState<ModerationJob | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    Promise.all([
      AdminService.getDashboard(days),
      AdminService.getAuditLogs({ page: 0, size: 12 }),
      AdminService.getModerationQueue({ page: 0, size: 3, status: 'PENDING_APPROVAL' }),
    ])
      .then(([d, a, q]) => {
        if (reqId.current !== id) return;
        setDash(d.data.data!);
        setLogs(a.data.data!);
        const items = q.data.data!.content;
        setQueue(items);
        items.forEach((job) => {
          AdminService.getModerationDetail(job.id)
            .then((res) => {
              if (reqId.current === id) setQueueDetails((prev) => ({ ...prev, [job.id]: res.data.data! }));
            })
            .catch(() => {});
        });
      })
      .catch((err) => { if (reqId.current === id) setError(errorText(err, 'Không tải được bảng điều khiển.')); })
      .finally(() => { if (reqId.current === id) setLoading(false); });
  }, [days]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const roleBucketValue = (key: Role | 'STAFF_ADMIN'): number => {
    if (!dash) return 0;
    if (key === 'STAFF_ADMIN') return dash.users.byRole.ROLE_STAFF + dash.users.byRole.ROLE_ADMIN;
    return dash.users.byRole[key];
  };

  const donut = useMemo(() => {
    const total = dash?.users.total ?? 0;
    const order: { role: Role; label: string; unit: string }[] = [
      { role: 'ROLE_USER', label: 'Ứng viên (Candidates)', unit: 'tài khoản' },
      { role: 'ROLE_INTERVIEWER', label: 'Nhà tuyển dụng (HR/Recruiter)', unit: 'doanh nghiệp' },
      { role: 'ROLE_STAFF', label: 'Nhân viên vận hành', unit: 'nhân sự nội bộ' },
      { role: 'ROLE_ADMIN', label: 'Quản trị viên & Điều phối', unit: 'nhân sự nội bộ' },
    ];
    return order.map((entry, i) => {
      const count = dash?.users.byRole[entry.role] ?? 0;
      const pct = total ? Math.round((count / total) * 1000) / 10 : 0;
      return { ...entry, count, pct, tone: DONUT_TONE[i] };
    });
  }, [dash]);

  const feed = useMemo(() => {
    const list = logs?.content ?? [];
    if (chip === 'all') return list;
    return list.filter((row) => (ACTION_META[row.action]?.cat ?? 'user') === chip);
  }, [logs, chip]);

  /** Chuỗi 12 tháng thật; BE luôn trả đủ 12 bucket nên FE chỉ việc vẽ. */
  const chart = useMemo(() => {
    const months = dash?.trends?.months ?? [];
    const mock = months.map((m) => m.mock);
    const formal = months.map((m) => m.formal);
    const scale = Math.max(...mock, ...formal, 0);
    let peak = -1;
    let peakTotal = 0;
    months.forEach((m, i) => {
      const sum = m.mock + m.formal;
      if (sum > peakTotal) { peakTotal = sum; peak = i; }
    });
    return {
      months, peak, peakTotal,
      mockSeries: seriesPaths(mock, scale),
      formalSeries: seriesPaths(formal, scale),
    };
  }, [dash]);

  /** Block cảnh báo: tin trong hàng chờ có kiểm tra an toàn KHÔNG đạt (009 FR-006). */
  const flagged = useMemo(
    () => queue
      .map((job) => ({
        job,
        failed: (queueDetails[job.id]?.aiSafety?.checks ?? []).filter((c) => !c.passed),
      }))
      .filter((entry) => entry.failed.length > 0),
    [queue, queueDetails],
  );

  const approve = async () => {
    if (!approveTarget) return;
    const id = approveTarget.id;
    setBusyId(id);
    try {
      await AdminService.reviewJob(id, { approved: true });
      setToast(`Đã duyệt “${approveTarget.title}”`);
      setApproveTarget(null);
      load();
    } catch (err) {
      setToast(errorText(err, 'Không duyệt được tin tuyển dụng.'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !dash) {
    return <div className="px-space-xl py-space-xl"><LoadingBlock label="Đang tải bảng điều khiển..." /></div>;
  }

  const completionRate = dash && dash.interviews.inPeriod
    ? `${Math.round((dash.interviews.completedInPeriod / dash.interviews.inPeriod) * 1000) / 10}%`
    : '—';

  return (
    <div className="px-space-xl py-space-xl bg-background w-full min-h-screen">
      <div className="flex flex-col w-full">
        <AdminPageHeader
          crumbs={[{ label: 'Hệ thống Quản trị' }, { label: 'Bảng điều khiển Tổng quan' }]}
          title="Tổng quan Quản trị Hệ thống"
          subtitle="Giám sát hiệu suất vận hành, chỉ số tăng trưởng người dùng và hoạt động phỏng vấn AI theo thời gian thực."
          actions={(
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="inline-flex items-center p-1 bg-surface-container rounded-xl shadow-inner">
                {([7, 30, 90] as DashboardRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDays(range)}
                    className={`px-3 py-1.5 rounded-lg text-ds-label-md transition-colors border-0 cursor-pointer ${
                      days === range
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                        : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {RANGE_LABEL[range]}
                  </button>
                ))}
              </div>
              <button type="button" className={adminButton('ghost')} onClick={load}>
                <span className={`${ICON} text-[18px] text-on-surface-variant`}>refresh</span>Tải lại số liệu
              </button>
              <Link to="/admin/settings" className={`${adminButton('ghost')} no-underline`}>
                <span className={`${ICON} text-[18px] text-primary`}>psychology</span>Cấu hình AI Prompt
              </Link>
              <Link to="/admin/job-approvals" className={`${adminButton('primary', 'shadow-md')} no-underline`}>
                <span className={`${ICON} text-[18px]`}>verified</span>Kiểm duyệt JD ngay
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary-teal text-on-secondary-teal text-[10px] font-bold">
                  {dash?.jobs.pendingModeration ?? 0}
                </span>
              </Link>
            </div>
          )}
        />

        {error && <div className="mb-space-lg"><ErrorBlock message={error} onRetry={load} /></div>}
        {toast && (
          <div className="mb-space-lg rounded-xl bg-secondary-container px-4 py-3 text-ds-body-md text-on-secondary-container">
            {toast}
          </div>
        )}

        {/* Hàng card chỉ số */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg mb-space-xl">
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-ds-label-md uppercase tracking-wider text-on-surface-variant">Tổng người dùng</span>
                <span className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className={`${ICON} text-[20px]`}>group</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="text-ds-display-sm text-on-surface font-extrabold tracking-tight">
                  {(dash?.users.total ?? 0).toLocaleString('vi-VN')}
                </span>
                <span className="inline-flex items-center text-ds-label-md font-bold text-secondary-teal">
                  <span className={`${ICON} text-[16px]`}>trending_up</span>+{(dash?.users.newInPeriod ?? 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant mt-1">Tài khoản mới trong {days} ngày qua</p>
            </div>
            <div className="mt-space-md pt-space-sm flex flex-wrap gap-1.5 bg-surface-container-low p-2 rounded-lg">
              {ROLE_BUCKET.map((bucket) => (
                <span key={bucket.key} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant text-ds-label-sm">
                  <strong className="text-on-surface">{roleBucketValue(bucket.key).toLocaleString('vi-VN')}</strong> {bucket.label}
                </span>
              ))}
            </div>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-ds-label-md uppercase tracking-wider text-on-surface-variant">Tổng tin tuyển dụng (JD)</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className={`${ICON} text-[20px]`}>assignment</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="text-ds-display-sm text-on-surface font-extrabold tracking-tight">
                  {(dash?.jobs.total ?? 0).toLocaleString('vi-VN')}
                </span>
                <span className="inline-flex items-center text-ds-label-md font-bold text-secondary-teal">
                  <span className={`${ICON} text-[16px]`}>trending_up</span>+{(dash?.jobs.newInPeriod ?? 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant mt-1">{dash?.jobs.newInPeriod ?? 0} tin mới trong mốc đang xem</p>
            </div>
            <div className="mt-space-md pt-space-sm flex flex-wrap gap-1.5 bg-surface-container-low p-2 rounded-lg">
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant text-ds-label-sm">
                <strong className="text-secondary-teal">{dash?.jobs.byStatus.OPEN ?? 0}</strong> Mở tuyển
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant text-ds-label-sm">
                <strong className="text-on-surface-variant">{dash?.jobs.byStatus.CLOSED ?? 0}</strong> Đã đóng
              </span>
              <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container text-ds-label-sm font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                {dash?.jobs.pendingModeration ?? 0} chờ duyệt
              </span>
            </div>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-ds-label-md uppercase tracking-wider text-on-surface-variant">Lượt phỏng vấn AI</span>
                <span className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <span className={`${ICON} text-[20px]`}>smart_toy</span>
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="text-ds-display-sm text-on-surface font-extrabold tracking-tight">
                  {(dash?.interviews.total ?? 0).toLocaleString('vi-VN')}
                </span>
                <span className="inline-flex items-center text-ds-label-md font-bold text-secondary-teal">
                  <span className={`${ICON} text-[16px]`}>trending_up</span>+{(dash?.interviews.inPeriod ?? 0).toLocaleString('vi-VN')}
                </span>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant mt-1">{dash?.interviews.inPeriod ?? 0} lượt trong {days} ngày gần nhất</p>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
              <div className="flex flex-col">
                <span className="text-ds-label-sm text-on-surface-variant">Tỷ lệ xong</span>
                <span className="text-ds-label-md font-bold text-primary">{completionRate}</span>
              </div>
              <div className="w-px h-6 bg-surface-container-highest" />
              <div className="flex flex-col">
                <span className="text-ds-label-sm text-on-surface-variant">Điểm TB</span>
                <span className="text-ds-label-md font-bold text-secondary-teal">
                  {dash?.interviews.avgOverallScore === null || dash?.interviews.avgOverallScore === undefined ? '—' : `${dash.interviews.avgOverallScore} / 100`}
                </span>
              </div>
              <div className="w-px h-6 bg-surface-container-highest" />
              <div className="flex flex-col">
                <span className="text-ds-label-sm text-on-surface-variant">Thời lượng</span>
                <span className="text-ds-label-md font-bold text-on-surface">
                  {fmtMmSs(dash?.interviews.avgDurationSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="min-w-0 text-ds-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                  Tài nguyên AI & Hệ thống
                </span>
                <span className="w-8 h-8 shrink-0 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                  <span className={`${ICON} text-[20px]`}>dns</span>
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-space-sm gap-y-0.5 mt-1">
                <span className="text-ds-display-sm text-secondary-teal font-extrabold tracking-tight">99.98%</span>
                <span className="text-ds-label-sm text-on-surface-variant font-medium">Độ sẵn sàng SLA</span>
              </div>
              <div className="flex items-center gap-1.5 text-ds-body-sm text-on-surface-variant">
                <span className={`${ICON} text-[16px] text-secondary-teal`}>speed</span>
                <span>Độ trễ AI LLM: <strong className="text-on-surface font-semibold">320ms</strong></span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs flex flex-col gap-2 bg-surface-container-low p-space-sm rounded-lg">
              <div className="flex items-center justify-between text-ds-label-sm">
                <span className="text-on-surface-variant">Token chi tiêu tháng</span>
                <span className="font-bold text-on-surface">1,240 / 2,500</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: '49.6%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary-teal animate-pulse" />
                  {(dash?.interviews.liveNow ?? 0).toLocaleString('vi-VN')} phòng đang live
                </span>
                <span className="font-semibold text-primary">49.6% ngân sách</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-md">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h2 className="text-ds-headline-sm text-on-surface font-bold">Tần suất & Xu hướng Lượt phỏng vấn AI</h2>
                  </div>
                  <p className="text-ds-body-sm text-on-surface-variant pl-space-md">
                    Biểu đồ đối sánh số lượt ứng viên tự luyện tập và phỏng vấn chính thức theo ủy quyền doanh nghiệp
                  </p>
                </div>
                <div className="inline-flex p-1 bg-surface-container-low rounded-lg self-start sm:self-auto">
                  <button type="button" className="px-2.5 py-1 text-on-surface-variant hover:text-on-surface text-ds-label-sm rounded-md transition-colors border-0 bg-transparent cursor-pointer">Theo tuần</button>
                  <button type="button" className="px-2.5 py-1 bg-surface-container-lowest text-primary font-bold shadow-sm text-ds-label-sm rounded-md transition-all border-0 cursor-pointer">12 tháng qua</button>
                  <button type="button" className="px-2.5 py-1 text-on-surface-variant hover:text-on-surface text-ds-label-sm rounded-md transition-colors border-0 bg-transparent cursor-pointer">Theo giờ trong ngày</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-space-md py-space-sm px-space-md rounded-lg bg-surface-container-low mb-space-md">
                <div className="flex items-center gap-space-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-primary-container" />
                    <span className="text-ds-label-sm text-on-surface">Mock Interview (Ứng viên tự luyện)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-secondary-teal" />
                    <span className="text-ds-label-sm text-on-surface">Formal Interview (Doanh nghiệp giao đề)</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs text-ds-label-sm text-on-surface">
                  <span className="text-on-surface-variant">Tổng phiên {days} ngày:</span>
                  <strong className="text-secondary-teal font-bold">{(dash?.interviews.inPeriod ?? 0).toLocaleString('vi-VN')}</strong>
                </div>
              </div>

              <div className="relative w-full h-72">
                <svg className="inline-defs-container" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                  <defs>
                    <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#006b5f" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#006b5f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 220">
                  <path d={chart.formalSeries.area} fill="url(#secondaryAreaGrad)" />
                  <path d={chart.mockSeries.area} fill="url(#primaryAreaGrad)" />
                  <path d={chart.formalSeries.line} fill="none" stroke="#006b5f" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={chart.mockSeries.line} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                  {chart.peak >= 0 && (
                    <>
                      <circle
                        cx={chart.mockSeries.points[chart.peak][0]}
                        cy={chart.mockSeries.points[chart.peak][1]}
                        r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2.5"
                      />
                      <circle
                        cx={chart.formalSeries.points[chart.peak][0]}
                        cy={chart.formalSeries.points[chart.peak][1]}
                        r="4" fill="#006b5f" stroke="#ffffff" strokeWidth="2"
                      />
                    </>
                  )}
                </svg>
                {chart.peak >= 0 && (
                  <div
                    className="absolute top-4 -translate-x-1/2 p-space-sm bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex flex-col gap-1 pointer-events-none z-10 w-48"
                    style={{ left: `${Math.min(88, Math.max(12, (chart.peak / Math.max(chart.months.length - 1, 1)) * 100))}%` }}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-inverse-primary">
                      Tháng {chart.months[chart.peak].month.split('-').reverse().join(' / ')}
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container" />Tổng lượt:
                      </span>
                      <span className="font-bold">{chart.peakTotal.toLocaleString('vi-VN')} lượt</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5 opacity-80">
                      <span>Tự luyện: {chart.months[chart.peak].mock.toLocaleString('vi-VN')}</span>
                      <span>Giao đề: {chart.months[chart.peak].formal.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                )}
                {chart.peak < 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-ds-body-sm text-on-surface-variant">
                      Chưa có phiên phỏng vấn nào trong 12 tháng qua
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-space-sm text-on-surface-variant text-ds-label-sm">
                {chart.months.map((m, i) => (
                  <span
                    key={m.month}
                    className={i === chart.peak ? 'text-primary font-bold' : i === chart.months.length - 1 ? 'text-on-surface font-semibold' : undefined}
                  >
                    {monthLabel(m.month)}
                  </span>
                ))}
              </div>
            </div>

            {!alertDismissed && flagged.length > 0 && (
              <div className="p-space-md rounded-xl bg-surface-container-high flex items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                    <span className={`${ICON} text-[22px]`}>warning</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-ds-headline-sm text-on-surface font-bold">Cảnh báo kiểm duyệt JD vi phạm chính sách</h3>
                      <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold tracking-wide">
                        {flagged.length} tin bị cắm cờ
                      </span>
                    </div>
                    <p className="text-ds-body-sm text-on-surface-variant">
                      {flagged.map((entry) => `“${entry.job.title}”: ${entry.failed.map((c) => c.label).join(', ')}`).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-center">
                  <button type="button" onClick={() => setAlertDismissed(true)} className="px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container text-ds-label-md font-medium transition-colors shadow-sm border-0 cursor-pointer">
                    Bỏ qua
                  </button>
                  <button type="button" onClick={() => navigate('/admin/job-approvals')} className="px-3.5 py-2 rounded-lg bg-error text-on-error hover:opacity-90 text-ds-label-md font-semibold transition-opacity shadow-sm flex items-center gap-1.5 border-0 cursor-pointer">
                    <span className={`${ICON} text-[16px]`}>gavel</span>Xử lý vi phạm
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-xs">
                <h2 className="text-ds-headline-sm text-on-surface font-bold">Phân bố Người dùng</h2>
                <span className={`${ICON} text-on-surface-variant text-[20px]`}>pie_chart</span>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant">Tỷ trọng tài khoản theo vai trò</p>

              <div className="relative w-56 h-56 mx-auto my-space-lg flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eaedff" strokeWidth="12" />
                  {(() => {
                    const circumference = 2 * Math.PI * 38;
                    let offset = 0;
                    return donut.filter((slice) => slice.count > 0).map((slice) => {
                      const length = (slice.pct / 100) * circumference;
                      const dash = `${length} ${circumference}`;
                      const el = (
                        <circle
                          key={slice.role}
                          cx="50" cy="50" r="38" fill="transparent"
                          stroke={slice.tone.color}
                          strokeDasharray={dash}
                          strokeDashoffset={-offset}
                          strokeWidth="12"
                        />
                      );
                      offset += length;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Tổng cộng</span>
                  <span className="text-ds-headline-lg text-on-surface font-extrabold tracking-tight">
                    {(dash?.users.total ?? 0).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[11px] text-secondary-teal font-bold">Người dùng</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                {donut.map((slice) => (
                  <div key={slice.role} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.tone.color }} />
                      <div className="flex flex-col">
                        <span className="text-ds-label-md text-on-surface font-semibold">{slice.label}</span>
                        <span className="text-[11px] text-on-surface-variant">{slice.count.toLocaleString('vi-VN')} {slice.unit}</span>
                      </div>
                    </div>
                    <span className={`text-ds-label-lg font-bold ${slice.tone.text}`}>{slice.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-space-md mt-space-sm">
              <Link to="/admin/analytics" className="w-full inline-flex items-center justify-center gap-space-xs py-2 rounded-lg text-primary hover:bg-surface-container text-ds-label-md font-semibold transition-colors no-underline">
                <span>Xem phân tích danh sách chi tiết</span>
                <span className={`${ICON} text-[16px]`}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className={`${ICON} text-primary text-[22px]`}>history</span>
                  <h2 className="text-ds-headline-sm text-on-surface font-bold">Nhật ký Hoạt động Hệ thống</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-ds-label-sm font-semibold">
                  {logs?.totalElements.toLocaleString('vi-VN') ?? 0} sự kiện
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 py-space-sm">
                {CHIPS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setChip(item.key)}
                    className={`px-3 py-1 rounded-full text-ds-label-sm transition-colors border-0 cursor-pointer ${
                      chip === item.key
                        ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <LoadingBlock label="Đang tải nhật ký hoạt động..." />
              ) : feed.length === 0 ? (
                <EmptyBlock
                  icon="receipt_long"
                  title="Chưa có sự kiện trong nhóm này"
                  description="BE chỉ ghi nhật ký cho hành động quản trị; phiên phỏng vấn không phát sinh sự kiện kiểm toán."
                />
              ) : (
                <div className="flex flex-col gap-space-md mt-space-sm">
                  {feed.map((row) => {
                    const meta = ACTION_META[row.action] ?? { label: row.action, icon: 'bolt', cat: 'user' as const };
                    return (
                      <div key={row.id} className="flex items-start gap-space-md p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className={`${ICON} text-[20px]`}>{meta.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-ds-label-lg text-on-surface font-semibold truncate">
                              {meta.label}
                              {row.targetEmail && <span className="text-primary"> · {row.targetFullName ?? row.targetEmail}</span>}
                            </p>
                            <span className="text-[11px] text-on-surface-variant shrink-0" title={fmtServer(row.createdAt)}>
                              {timeAgo(row.createdAt)}
                            </span>
                          </div>
                          <p className="text-ds-body-sm text-on-surface-variant mt-0.5 truncate">
                            {row.detail ?? row.reason ?? `${row.adminEmail} · ID ${row.adminId}`}
                          </p>
                        </div>
                        <span className="self-center shrink-0">
                          {row.succeeded
                            ? <Pill tone="success">Thành công</Pill>
                            : <Pill tone="danger">Bị chặn</Pill>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-space-md mt-space-sm">
              <Link to="/admin/audit" className={`w-full py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-ds-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs no-underline`}>
                <span className={`${ICON} text-[18px]`}>receipt_long</span>
                Xem toàn bộ nhật ký kiểm toán (System Audit Log)
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex flex-col flex-1">
              <div className="flex items-start justify-between gap-space-sm pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
                    <span className={`${ICON} text-[20px]`}>fact_check</span>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-ds-headline-sm text-on-surface font-bold leading-tight">Hàng chờ Kiểm duyệt JD</h2>
                    <span className="text-[11px] text-on-surface-variant font-medium">Cần phê duyệt trước khi công khai</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-ds-label-sm font-bold flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-teal animate-pulse" />
                  {dash?.jobs.pendingModeration ?? 0} tin chờ
                </span>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant mt-1.5 mb-space-md">
                Tin tuyển dụng được AI tiền kiểm tự động, cần quản trị viên đối soát lần cuối.
              </p>

              {queue.length === 0 && !loading ? (
                <EmptyBlock icon="task_alt" title="Không còn tin chờ duyệt" description="Hàng chờ kiểm duyệt đang trống." />
              ) : (
                <div className="flex flex-col gap-space-sm">
                  {queue.map((job) => {
                    const detail = queueDetails[job.id]?.job;
                    return (
                      <div key={job.id} className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant transition-all flex flex-col gap-2.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-space-sm min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm flex items-center justify-center font-bold text-primary text-[14px] shrink-0">
                              {initials(job.companyName || job.title)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h4 className="text-ds-label-lg text-on-surface font-bold truncate leading-snug">{job.title}</h4>
                              <span className="text-[11px] text-on-surface-variant truncate">
                                {job.companyName} • Gửi {timeAgo(job.submittedAt ?? job.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold tracking-wide uppercase shrink-0">
                            Chờ duyệt
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-on-surface-variant text-[12px] pt-0.5">
                          {detail?.salaryRange && (
                            <span className="inline-flex items-center gap-1 font-medium text-on-surface">
                              <span className={`${ICON} text-[15px] text-primary`}>payments</span>{detail.salaryRange}
                            </span>
                          )}
                          {detail?.location && (
                            <>
                              <span className="text-outline-variant">•</span>
                              <span className="inline-flex items-center gap-1">
                                <span className={`${ICON} text-[15px] text-on-surface-variant`}>location_on</span>{detail.location}
                              </span>
                            </>
                          )}
                          {detail && (
                            <>
                              <span className="text-outline-variant">•</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary-teal font-semibold text-[11px]">
                                <span className={`${ICON} text-[13px]`}>{detail.aiScreeningEnabled ? 'verified' : 'layers_clear'}</span>
                                {detail.aiScreeningEnabled ? 'AI screening bật' : 'Không AI screening'}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-0.5">
                          <Link to={`/admin/job-approvals/${job.id}`} className="text-primary hover:text-primary-container text-ds-label-sm font-semibold flex items-center gap-1 transition-colors px-1 py-1 rounded no-underline">
                            <span>Xem chi tiết</span>
                            <span className={`${ICON} text-[15px]`}>open_in_new</span>
                          </Link>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/job-approvals/${job.id}`)}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-error hover:bg-error-container hover:text-on-error-container text-ds-label-sm font-semibold transition-colors cursor-pointer"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              disabled={busyId === job.id}
                              onClick={() => setApproveTarget(job)}
                              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:opacity-95 text-ds-label-sm font-semibold transition-opacity shadow-sm flex items-center gap-1 border-0 cursor-pointer disabled:opacity-60"
                            >
                              <span className={`${ICON} text-[15px]`}>check</span>
                              {busyId === job.id ? 'Đang xử lý' : 'Duyệt nhanh'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-space-md mt-space-sm">
              <Link
                to="/admin/job-approvals"
                className="w-full py-2.5 px-4 rounded-xl border border-secondary-teal/30 bg-surface-container-low hover:bg-secondary-container/30 text-on-secondary-container text-ds-label-md font-bold transition-all flex items-center justify-center gap-space-xs no-underline"
              >
                <span>Mở toàn bộ trang Kiểm duyệt JD (Còn {dash?.jobs.pendingModeration ?? 0} tin)</span>
                <span className={`${ICON} text-[18px] text-secondary-teal`}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!approveTarget}
        title="Duyệt tin tuyển dụng"
        message={approveTarget ? `Xác nhận công khai “${approveTarget.title}” của ${approveTarget.companyName} trên Job Board?` : ''}
        confirmLabel="Duyệt tin"
        cancelLabel="Giữ lại"
        onConfirm={approve}
        onCancel={() => setApproveTarget(null)}
      />
    </div>
  );
};

export default AdminDashboardPage;
