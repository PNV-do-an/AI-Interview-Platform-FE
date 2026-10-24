import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { parseServerTimestamp } from '../../utils/date';
import {
  ModerationAction,
  ModerationHistoryRow,
  ModerationHistoryStats,
} from '../../models/AdminConsole.model';
import {
  ICON,
  LoadingBlock,
  StatCard,
  adminButton,
  adminSelectClass,
  errorText,
  fmtServer,
  initialsOf,
} from '../components/adminKit';

/**
 * Lịch sử kiểm duyệt JD (mockup Stitch `lịch sử kiểm duyệt JD`) — DATA page.
 * Nguồn số thật:
 *   GET /admin/jobs/moderation/history?page&size&decision&from&to&moderatorId&search
 *   GET /admin/jobs/moderation/history/stats -> 4 thẻ chỉ số
 * Hai endpoint guard ADMIN + STAFF từ 009 FR-007, nên ROLE_STAFF xem được màn này (trước đây 403).
 * Khác biệt so với mockup (ghi trong spec/INDEX.md):
 *   - Cột "field chip" (Công nghệ thông tin / Dữ liệu & AI) và dòng "Remote • Hà Nội" của mockup
 *     không có trong payload lịch sử nên bỏ; thay bằng dữ liệu thật có sẵn.
 *   - BE không lưu "ngày gửi" trên bản ghi lịch sử -> suy ra từ createdAt - processingSeconds.
 *   - Bộ lọc theo doanh nghiệp chạy trên trang đang tải (BE không có param companyName);
 *     bộ lọc kiểm duyệt viên dùng moderatorId nên chạy phía server.
 *   - stats là số toàn hệ thống, không đổi theo bộ lọc thời gian.
 *   - Bỏ nút "Xem chế độ Empty State" và menu more_vert vì không có hành động thật.
 */

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_SIZE = 10;

type RangeKey = 'today' | '7' | '30' | 'quarter' | 'all';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '30', label: '30 ngày qua' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7', label: '7 ngày qua' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'all', label: 'Toàn bộ thời gian' },
];

const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;

const rangeToFromTo = (key: RangeKey): { from?: string; to?: string } => {
  if (key === 'all') return {};
  const now = new Date();
  if (key === 'today') return { from: isoDate(now), to: isoDate(now) };
  if (key === 'quarter') {
    const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { from: isoDate(start), to: isoDate(now) };
  }
  const days = key === '7' ? 7 : 30;
  const from = new Date(now.getTime() - (days - 1) * 86_400_000);
  return { from: isoDate(from), to: isoDate(now) };
};

const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds < 0) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const DECISION_META: Record<ModerationAction, { label: string; chip: string; icon: string }> = {
  APPROVED: { label: 'Đã duyệt', chip: 'bg-secondary-container text-on-secondary-container', icon: 'check_circle' },
  REJECTED: { label: 'Bị từ chối', chip: 'bg-error-container text-on-error-container', icon: 'cancel' },
  SUBMITTED: { label: 'Gửi duyệt', chip: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'upload_file' },
  RESUBMITTED: { label: 'Gửi lại', chip: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'forward' },
};

type DecisionFilter = '' | ModerationAction;

/** BE chỉ ghi quyết định APPROVED/REJECTED vào history; 2 nhãn submit để đủ bộ tra cứu. */
const TABS: { value: DecisionFilter; label: string }[] = [
  { value: '', label: 'Tất cả quyết định' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
];

const clockParts = (d: Date | null): { time: string; date: string } => {
  if (!d) return { time: '—', date: '' };
  return {
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
};

const clockOf = (value: string | null | undefined) => clockParts(parseServerTimestamp(value));

/** Bản ghi lịch sử không lưu ngày gửi -> lấy thời điểm quyết định trừ đi thời gian xử lý. */
const submittedClock = (row: ModerationHistoryRow) => {
  const decided = parseServerTimestamp(row.createdAt);
  if (!decided) return { time: '—', date: '' };
  return clockParts(new Date(decided.getTime() - (row.processingSeconds ?? 0) * 1000));
};

const csvCell = (value: string | number | null | undefined): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

const iconBtnClass =
  'inline-flex w-8 h-8 rounded-lg items-center justify-center text-outline-strong hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40';

const JobModerationHistoryPage: React.FC = () => {
  const [stats, setStats] = useState<ModerationHistoryStats | null>(null);
  const [rows, setRows] = useState<ModerationHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [decision, setDecision] = useState<DecisionFilter>('');
  const [range, setRange] = useState<RangeKey>('30');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [moderatorId, setModeratorId] = useState<number | ''>('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = rangeToFromTo(range);
      const [historyRes, statsRes] = await Promise.all([
        AdminService.getModerationHistory({
          page,
          size,
          decision: decision || undefined,
          from,
          to,
          moderatorId: moderatorId === '' ? undefined : moderatorId,
          search: search || undefined,
        }),
        AdminService.getModerationHistoryStats(),
      ]);
      if (!alive.current) return;
      const body = historyRes.data.data!;
      setRows(body.content);
      setTotal(body.totalElements);
      setStats(statsRes.data.data ?? null);
    } catch (err) {
      if (alive.current) setError(errorText(err, 'Không tải được lịch sử kiểm duyệt.'));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [decision, moderatorId, page, range, search, size]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderatorOptions = useMemo(() => {
    const seen: { id: number; email: string }[] = [];
    rows.forEach((r) => {
      if (!seen.some((m) => m.id === r.moderatorId)) seen.push({ id: r.moderatorId, email: r.moderatorEmail });
    });
    return seen;
  }, [rows]);

  const companyOptions = useMemo(() => {
    const names: string[] = [];
    rows.forEach((r) => {
      if (r.companyName && names.indexOf(r.companyName) === -1) names.push(r.companyName);
    });
    return names.sort((a, b) => a.localeCompare(b, 'vi'));
  }, [rows]);

  const visibleRows = useMemo(
    () => (company ? rows.filter((r) => r.companyName === company) : rows),
    [company, rows],
  );

  const approvedRate = stats && stats.totalDecisions > 0 ? (stats.approved / stats.totalDecisions) * 100 : 0;
  const rejectedRate = stats && stats.totalDecisions > 0 ? (stats.rejected / stats.totalDecisions) * 100 : 0;
  const avgSeconds = stats?.avgProcessingSeconds ?? null;

  const pages = Math.max(1, Math.ceil(total / size));
  const fromIdx = total === 0 ? 0 : page * size + 1;
  const toIdx = Math.min(total, (page + 1) * size);

  const resetFilters = () => {
    setDecision('');
    setRange('30');
    setSearch('');
    setSearchInput('');
    setModeratorId('');
    setCompany('');
    setPage(0);
  };

  const exportCsv = () => {
    const header = [
      'Mã JD', 'Tiêu đề tin', 'Doanh nghiệp', 'Email nhà tuyển dụng',
      'Quyết định', 'Kiểm duyệt viên', 'Thời gian xử lý (giây)', 'Ghi chú', 'Thời điểm quyết định',
    ];
    const body = visibleRows.map((r) => [
      `JD-${r.jobId}`, r.jobTitle, r.companyName, r.employerEmail,
      DECISION_META[r.action]?.label ?? r.action, r.moderatorEmail,
      r.processingSeconds ?? '', r.note ?? '', fmtServer(r.createdAt, 'datetime'),
    ]);
    const csv = [header, ...body].map((cols) => cols.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jd-moderation-history-${isoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageButtons = (): number[] => {
    const list: number[] = [];
    const start = Math.min(page, Math.max(0, pages - 5));
    for (let p = start; p < Math.min(pages, start + 5); p += 1) list.push(p);
    return list;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="px-space-xl pt-space-lg pb-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="min-w-0">
          <nav className="flex items-center gap-1 flex-wrap text-ds-label-md text-on-surface-variant mb-1.5">
            <Link to="/admin/job-approvals" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
              <span className={`${ICON} text-[16px]`}>fact_check</span>
              Kiểm duyệt tin tuyển dụng
            </Link>
            <span className="text-outline-variant font-bold">/</span>
            <span className="inline-flex items-center gap-1 text-primary font-semibold">Lịch sử kiểm duyệt</span>
          </nav>
          <h1 className="text-ds-headline-lg text-on-surface font-bold tracking-tight">Lịch sử kiểm duyệt tin tuyển dụng</h1>
          <p className="text-ds-body-sm text-on-surface-variant mt-0.5 max-w-3xl">
            Tra cứu toàn bộ quyết định duyệt / từ chối tin tuyển dụng, người kiểm duyệt và ghi chú phản hồi gửi nhà tuyển dụng.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
          <button type="button" onClick={() => void load()} disabled={loading} className={adminButton('ghost', 'disabled:opacity-50')}>
            <span className={`${ICON} text-[18px] text-on-surface-variant`}>refresh</span>
            Làm mới dữ liệu
          </button>
          <button type="button" onClick={exportCsv} disabled={visibleRows.length === 0} className={adminButton('primary', 'disabled:opacity-50')}>
            <span className={`${ICON} text-[18px]`}>download</span>
            Xuất báo cáo CSV
          </button>
        </div>
      </div>

      <div className="px-space-xl pb-space-xl flex flex-col gap-space-lg">
        {/* 4 thẻ chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <StatCard
            label="Tổng số đã xử lý"
            icon="assignment_turned_in"
            tone="primary"
            value={stats ? stats.totalDecisions.toLocaleString('vi-VN') : '—'}
            unit="quyết định"
            pill="Toàn hệ thống"
            barPct={100}
          />
          <StatCard
            label="Đã duyệt"
            icon="check_circle"
            tone="success"
            value={stats ? String(stats.approved) : '—'}
            unit="tin"
            pill={`${approvedRate.toFixed(1)}% tỷ lệ duyệt`}
            barPct={approvedRate}
          />
          <StatCard
            label="Bị từ chối"
            icon="cancel"
            tone="danger"
            value={stats ? String(stats.rejected) : '—'}
            unit="tin"
            pill={`${rejectedRate.toFixed(1)}% bị từ chối`}
            barPct={rejectedRate}
          />
          <StatCard
            label="Thời gian xử lý TB"
            icon="schedule"
            tone="neutral"
            value={avgSeconds == null ? '—' : (avgSeconds / 3600).toFixed(1)}
            unit="giờ / tin"
            pill={avgSeconds == null ? 'Chưa có dữ liệu' : `≈ ${formatDuration(avgSeconds)} mỗi tin`}
            footnote="Tính trên toàn bộ lịch sử, không đổi theo bộ lọc thời gian"
          />
        </div>

        {/* Bộ lọc */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-low/60 p-space-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {TABS.map((tab) => {
                const active = tab.value === decision;
                const count = tab.value === '' ? stats?.totalDecisions : tab.value === 'APPROVED' ? stats?.approved : stats?.rejected;
                return (
                  <button
                    key={tab.value || 'all'}
                    type="button"
                    onClick={() => { setDecision(tab.value); setPage(0); }}
                    className={
                      active
                        ? 'inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2 text-ds-label-md font-bold text-primary shadow-sm'
                        : 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-ds-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'
                    }
                  >
                    <span>{tab.label}</span>
                    <span
                      className={
                        active
                          ? 'rounded-full bg-primary-fixed px-2 py-0.5 text-ds-label-sm text-on-primary-fixed-variant'
                          : 'rounded-full bg-surface-container-high px-2 py-0.5 text-ds-label-sm font-bold text-on-surface-variant'
                      }
                    >
                      {count == null ? '—' : count}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-ds-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container">
              <span className={`${ICON} text-[18px]`}>filter_alt_off</span>
              Đặt lại bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
            <div className="relative md:col-span-5">
              <span className={`${ICON} text-[20px] text-outline-strong absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`}>search</span>
              <form
                onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(0); }}
                className="contents"
              >
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tiêu đề tin, mã JD hoặc tên doanh nghiệp..."
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-ds-body-sm outline-none focus:bg-surface-container-lowest shadow-inner transition-all border-0"
                />
              </form>
            </div>
            <div className="relative md:col-span-2">
              <select
                value={range}
                onChange={(e) => { setRange(e.target.value as RangeKey); setPage(0); }}
                className={adminSelectClass}
                aria-label="Khoảng thời gian"
              >
                {RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className={`${ICON} text-[18px] text-outline-strong absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>calendar_month</span>
            </div>
            <div className="relative md:col-span-2" title="Lọc trên các bản ghi của trang đang tải">
              <select
                value={company}
                onChange={(e) => { setCompany(e.target.value); }}
                className={adminSelectClass}
                aria-label="Nhà tuyển dụng"
              >
                <option value="">Tất cả nhà tuyển dụng</option>
                {companyOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <span className={`${ICON} text-[18px] text-outline-strong absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>business</span>
            </div>
            <div className="relative md:col-span-2">
              <select
                value={moderatorId === '' ? '' : String(moderatorId)}
                onChange={(e) => { setModeratorId(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }}
                className={adminSelectClass}
                aria-label="Kiểm duyệt viên"
              >
                <option value="">Tất cả kiểm duyệt viên</option>
                {moderatorOptions.map((m) => <option key={m.id} value={m.id}>{m.email}</option>)}
              </select>
              <span className={`${ICON} text-[18px] text-outline-strong absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>admin_panel_settings</span>
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Link to="/admin/job-approvals" className={`${iconBtnClass} w-full`} title="Về hàng đợi chờ duyệt">
                <span className={`${ICON} text-[18px]`}>pending_actions</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bảng lịch sử */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          {error ? (
            <div className="p-space-lg">
              <div className="flex items-start justify-between gap-space-md rounded-xl bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
                <span className="flex items-start gap-2">
                  <span className={`${ICON} text-[20px]`}>error</span>
                  <span>{error}</span>
                </span>
                <button type="button" onClick={() => void load()} className={adminButton('ghost', 'h-9 shrink-0')}>
                  <span className={`${ICON} text-[18px]`}>refresh</span>Thử lại
                </button>
              </div>
            </div>
          ) : loading ? (
            <LoadingBlock label="Đang tải lịch sử kiểm duyệt..." />
          ) : visibleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-space-2xl px-space-lg text-center">
              <span className={`${ICON} text-[34px] text-outline-strong`}>search_off</span>
              <p className="text-ds-headline-sm text-on-surface font-semibold">Không tìm thấy kết quả phù hợp</p>
              <p className="text-ds-body-sm text-on-surface-variant max-w-md">
                Hãy thử điều chỉnh khoảng thời gian, từ khóa tìm kiếm hoặc kiểm tra lại nhà tuyển dụng trong danh mục này.
              </p>
              <div className="flex items-center gap-space-sm pt-space-sm">
                <button type="button" onClick={resetFilters} className={adminButton('primary')}>
                  <span className={`${ICON} text-[18px]`}>restart_alt</span>
                  Đặt lại tất cả bộ lọc
                </button>
                <Link to="/admin/job-approvals" className={adminButton('ghost')}>Hàng đợi chờ duyệt</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-ds-label-md uppercase tracking-wider text-on-surface-variant">
                      <th className="w-72 h-11 px-4 font-semibold">Tin tuyển dụng &amp; mã JD</th>
                      <th className="w-60 px-4 font-semibold">Nhà tuyển dụng</th>
                      <th className="w-36 px-4 font-semibold">Ngày gửi</th>
                      <th className="w-44 px-4 font-semibold">Quyết định lúc</th>
                      <th className="w-36 px-4 font-semibold">Kết quả</th>
                      <th className="w-48 px-4 font-semibold">Kiểm duyệt viên</th>
                      <th className="px-4 font-semibold">Ghi chú / lý do</th>
                      <th className="w-24 px-4 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const meta = DECISION_META[row.action] ?? { label: row.action, chip: 'bg-surface-container-high text-on-surface-variant', icon: 'help' };
                      const sent = submittedClock(row);
                      const decided = clockOf(row.createdAt);
                      return (
                        <tr key={row.id} className="group transition-colors hover:bg-surface-container-low/40">
                          <td className="px-4 py-4 align-top text-ds-body-sm text-on-surface-variant border-b border-outline-variant/40">
                            <div className="flex flex-col gap-1">
                              <span className="w-fit font-mono text-ds-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                                JD-{row.jobId}
                              </span>
                              <Link
                                to={`/admin/job-approvals/${row.jobId}`}
                                className="text-ds-headline-sm text-on-surface font-bold leading-tight line-clamp-1 hover:text-primary transition-colors"
                              >
                                {row.jobTitle}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top border-b border-outline-variant/40">
                            <div className="flex items-center gap-2.5">
                              <div className={
                                row.action === 'REJECTED'
                                  ? 'w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center font-bold text-ds-label-md shrink-0'
                                  : 'w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold text-ds-label-md shrink-0'
                              }>
                                {initialsOf(row.companyName)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-ds-label-md font-semibold text-on-surface truncate">{row.companyName}</span>
                                <span className="text-ds-body-sm text-outline-strong truncate">{row.employerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-ds-body-sm text-on-surface-variant border-b border-outline-variant/40">
                            <div className="flex flex-col">
                              <span className="font-medium text-on-surface">{sent.time}</span>
                              {sent.date && <span className="text-ds-label-sm text-outline-strong">{sent.date}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-ds-body-sm text-on-surface-variant border-b border-outline-variant/40">
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-col">
                                <span className="font-medium text-on-surface">{decided.time}</span>
                                {decided.date && <span className="text-ds-label-sm text-outline-strong">{decided.date}</span>}
                              </div>
                              <span className="inline-flex items-center gap-1 text-ds-label-sm font-semibold text-secondary-teal">
                                <span className={`${ICON} text-[13px]`}>timer</span>
                                {formatDuration(row.processingSeconds)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top border-b border-outline-variant/40">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-ds-label-md font-bold shadow-xs ${meta.chip}`}>
                              <span className={`${ICON} text-[16px]`}>{meta.icon}</span>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-bold text-ds-label-sm shrink-0">
                                {initialsOf(row.moderatorEmail.split('@')[0].replace(/[._-]+/g, ' '))}
                              </div>
                              <span className="text-ds-label-md font-medium text-on-surface break-all">{row.moderatorEmail}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top border-b border-outline-variant/40">
                            {row.note ? (
                              <div className={`flex items-start gap-1.5 p-2 rounded-lg ${row.action === 'REJECTED' ? 'bg-error-container/40 text-on-error-container' : 'bg-surface-container-low/60 text-on-surface-variant'}`}>
                                <span className={`${ICON} text-[16px] shrink-0 mt-0.5 ${row.action === 'REJECTED' ? 'text-error' : 'text-secondary-teal'}`}>
                                  {row.action === 'REJECTED' ? 'error_outline' : 'verified'}
                                </span>
                                <p className="m-0 text-ds-body-sm line-clamp-2">{row.note}</p>
                              </div>
                            ) : (
                              <span className="text-ds-body-sm text-outline-strong">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-right border-b border-outline-variant/40">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/admin/job-approvals/${row.jobId}`} title="Xem hồ sơ kiểm duyệt" className={`${iconBtnClass} text-primary`}>
                                <span className={`${ICON} text-[18px]`}>visibility</span>
                              </Link>
                              <Link to="/admin/audit" title="Nhật ký kiểm toán" className={iconBtnClass}>
                                <span className={`${ICON} text-[18px]`}>receipt_long</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              <div className="px-space-lg py-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-container-low">
                <div className="flex items-center gap-space-md flex-wrap">
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Hiển thị <span className="font-semibold text-on-surface">{fromIdx} - {toIdx}</span> trong tổng số{' '}
                    <span className="font-semibold text-on-surface">{total.toLocaleString('vi-VN')}</span> bản ghi
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-ds-body-sm text-outline-strong">Số lượng:</span>
                    <select
                      value={size}
                      onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-ds-body-sm outline-none cursor-pointer border-0"
                    >
                      {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} bản ghi / trang</option>)}
                    </select>
                  </div>
                  {company && (
                    <span className="text-ds-label-sm text-on-surface-variant">
                      Đang lọc theo doanh nghiệp trên trang này: {visibleRows.length} bản ghi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 select-none">
                  <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={iconBtnClass} aria-label="Trang trước">
                    <span className={`${ICON} text-[18px]`}>chevron_left</span>
                  </button>
                  {pageButtons()[0] > 0 && <span className="w-8 h-8 flex items-center justify-center text-outline-strong text-ds-label-md">...</span>}
                  {pageButtons().map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={
                        p === page
                          ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary text-ds-label-md font-bold flex items-center justify-center shadow-xs'
                          : 'w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-ds-label-md font-medium flex items-center justify-center transition-colors'
                      }
                    >
                      {p + 1}
                    </button>
                  ))}
                  {pageButtons()[pageButtons().length - 1] < pages - 1 && (
                    <span className="w-8 h-8 flex items-center justify-center text-outline-strong text-ds-label-md">...</span>
                  )}
                  <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className={iconBtnClass} aria-label="Trang sau">
                    <span className={`${ICON} text-[18px]`}>chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer audit */}
        <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <span className={`${ICON} text-[20px] text-primary`}>security</span>
            <span className="text-ds-label-sm">
              Toàn bộ nhật ký kiểm duyệt được ký số kiểm toán và lưu trữ bất biến (Immutable Audit Log) trong vòng 24 tháng theo tiêu chuẩn bảo mật hệ sinh thái AI.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobModerationHistoryPage;
