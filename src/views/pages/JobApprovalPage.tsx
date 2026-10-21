import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { parseServerTimestamp } from '../../utils/date';
import {
  JOB_STATUS_LABELS,
  JobStatusCode,
  ModerationJob,
  ModerationJobDetail,
} from '../../models/AdminConsole.model';
import {
  EmptyBlock,
  ErrorBlock,
  ICON,
  LoadingBlock,
  ModalBackdrop,
  adminButton,
  errorText,
  fmtServer,
  modalCancelClass,
  modalDangerClass,
  splitCsv,
  timeAgo,
} from '../components/adminKit';

/**
 * Hàng đợi kiểm duyệt JD (mockup Stitch `kiểm duyệt tin tuyển dụng`) — DATA page.
 * Nguồn số thật:
 *   GET /admin/jobs/moderation?page&size&status&search  -> danh sách hàng đợi
 *   GET /admin/jobs/moderation/{id}                     -> khung inspect bên phải
 *   PATCH /api/v1/jobs/{id}/review {approved, reason}   -> phê duyệt / từ chối
 * Ba endpoint đọc đều guard ADMIN -> ROLE_STAFF nhận 403 và màn hiện ErrorBlock.
 * `aiSafetyScore` là cột placeholder chưa có writer phía BE nên hiển thị "Chưa chấm",
 * không dựng số demo. Điểm tín nhiệm NTD / lịch sử đăng tin / 4 thẻ thẩm định AI là demo
 * nguyên văn mockup (không có endpoint) - ghi chú trong spec/INDEX.md.
 */

const PAGE_SIZE = 50;

/** 4 chip lọc theo JobStatus mà BE nhận (`status` chặn giá trị khác 4 nhãn). */
const STATUS_CHIPS: { value: JobStatusCode; label: string }[] = [
  { value: 'PENDING_APPROVAL', label: 'Tất cả chờ duyệt' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

/** Chip mockup không có bộ lọc phía backend -> hiển thị nguyên văn, không click. */
const DEMO_CHIPS: { label: string; count: string; dot?: string }[] = [
  { label: 'Cần AI đánh giá lại', count: '(3)', dot: 'bg-amber-500' },
  { label: 'Khẩn cấp / VIP', count: '(5)', dot: 'bg-secondary-teal' },
  { label: 'Đã duyệt hôm nay', count: '(28)' },
  { label: 'Bị từ chối', count: '(4)' },
];

type SortKey = 'newest' | 'oldest' | 'score';

const SORTERS: Record<SortKey, (a: ModerationJob, b: ModerationJob) => number> = {
  newest: (a, b) => ts(b) - ts(a),
  oldest: (a, b) => ts(a) - ts(b),
  // Điểm AI luôn null ở hiện tại -> ổn định theo id khi hai hàng bằng nhau.
  score: (a, b) => (a.aiSafetyScore ?? -1) - (b.aiSafetyScore ?? -1) || b.id - a.id,
};

const ts = (row: ModerationJob): number =>
  parseServerTimestamp(row.submittedAt ?? row.createdAt)?.getTime() ?? 0;

const WORKPLACE_VN: Record<string, string> = {
  ONSITE: 'Tại văn phòng',
  HYBRID: 'Linh hoạt Hybrid',
  REMOTE: 'Từ xa (Remote)',
};

const TRACK_VN: Record<string, string> = {
  LIVE_CODING: 'Live Coding trực tiếp',
  SYSTEM_DESIGN: 'System Design',
  ASYNC_TECHNICAL: 'Kỹ thuật async',
  CULTURAL_FIT: 'Phù hợp văn hoá',
};

const AI_CHECKS = [
  {
    tone: 'ok', icon: 'check_circle', title: 'Độ tương thích chính sách lao động',
    desc: 'Đạt chuẩn 100%. Không có yếu tố phân biệt độ tuổi, giới tính, tôn giáo hay vùng miền.',
  },
  {
    tone: 'ok', icon: 'check_circle', title: 'Minh bạch khung lương',
    desc: 'Mức lương công khai hợp lý, nằm trong ngưỡng thị trường cho cấp bậc tương ứng.',
  },
  {
    tone: 'ok', icon: 'check_circle', title: 'Rà soát từ khóa cấm & nhạy cảm',
    desc: '0 phát hiện vi phạm. Nội dung văn bản nghiêm túc, chuyên nghiệp và chuẩn mực.',
  },
  {
    tone: 'warn', icon: 'info', title: 'Ghi chú hình thức Hybrid',
    desc: 'Cần đảm bảo địa chỉ trụ sở văn phòng làm việc rõ ràng cho các ngày On-site.',
  },
] as const;

const DEMO_BENEFITS = [
  'Thu nhập cạnh tranh: Lương cứng theo dải đã công khai + Lương tháng 13 + Thưởng KPI dự án.',
  'Gói bảo hiểm sức khỏe toàn diện dành cho nhân viên và người thân phụ thuộc.',
  'Cấp thiết bị làm việc khi tiếp nhận công việc; ngân sách tài trợ thi chứng chỉ công nghệ hằng năm.',
  'Chế độ làm việc linh hoạt; văn phòng tiêu chuẩn với pantry không giới hạn.',
];

const REJECT_REASONS = [
  'Lương không rõ ràng hoặc vi phạm quy định công khai mức lương theo chuẩn sàn.',
  'Yêu cầu chứa yếu tố phân biệt đối xử (giới tính, độ tuổi, hình thức bên ngoài không hợp lý).',
  'Nghi vấn trùng lặp nội dung với tin tuyển dụng khác vừa đăng gần đây.',
  'Thông tin pháp lý công ty không khớp với giấy phép đăng ký kinh doanh.',
];

const REASON_MAX = 500;

const scorePillClass = (score: number | null): string => {
  if (score === null) return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
  if (score >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-600/20';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-500/20';
  return 'bg-error-container text-error border-error/20';
};

const statusPillClass = (status: JobStatusCode): string => {
  if (status === 'PENDING_APPROVAL') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'OPEN') return 'bg-emerald-50 text-emerald-800 border-emerald-600/20';
  if (status === 'CLOSED') return 'bg-error-container text-on-error-container border-error/20';
  return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
};

const initialsOfCompany = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return parts.slice(0, 3).map((p) => p[0]).join('').toUpperCase();
};

/** Mô tả / yêu cầu là text tự do -> tách dòng, bỏ dòng rỗng, giữ bullet gốc khi có. */
const splitLines = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

const SpecCell: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col">
    <span className="text-ds-label-sm text-on-surface-variant text-[11px]">{label}</span>
    <span className={`text-ds-label-md mt-0.5 ${strong ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>
      {value || '—'}
    </span>
  </div>
);

const BulletList: React.FC<{ items: string[]; dot: string }> = ({ items, dot }) => (
  <div className="space-y-space-sm font-ds-body-md text-ds-body-md text-on-surface pl-7 leading-relaxed">
    {items.map((item, i) => (
      <div key={`${item}-${i}`} className="flex items-start gap-2.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-2.5 shrink-0`} />
        <span className="break-words">{item}</span>
      </div>
    ))}
  </div>
);

const JobApprovalPage: React.FC = () => {
  const [status, setStatus] = useState<JobStatusCode>('PENDING_APPROVAL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<ModerationJob[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ModerationJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [checkedReasons, setCheckedReasons] = useState<string[]>([]);
  const [reasonText, setReasonText] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await AdminService.getModerationQueue({ page, size: PAGE_SIZE, status, search: search || undefined });
      const body = res.data.data!;
      if (!alive.current) return;
      setRows(body.content);
      setTotal(body.totalElements);
      setSelectedId((prev) => (prev && body.content.some((r) => r.id === prev) ? prev : body.content[0]?.id ?? null));
    } catch (err) {
      if (alive.current) setListError(errorText(err, 'Không tải được hàng đợi kiểm duyệt.'));
    } finally {
      if (alive.current) setListLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return undefined;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError('');
    AdminService.getModerationDetail(selectedId)
      .then((res) => { if (active) setDetail(res.data.data!); })
      .catch((err) => { if (active) { setDetail(null); setDetailError(errorText(err, 'Không tải được chi tiết tin tuyển dụng.')); } })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const pendingRows = rows.filter((r) => r.status === 'PENDING_APPROVAL');
  const sortedRows = [...rows].sort(SORTERS[sort]);

  const submitDecision = useCallback(async (approved: boolean, reason?: string) => {
    if (selectedId == null) return;
    setBusy(true);
    setFlash(null);
    try {
      const res = await AdminService.reviewJob(selectedId, { approved, reason });
      if (!alive.current) return;
      setFlash({ tone: 'ok', text: res.data.message || (approved ? 'Đã phê duyệt tin tuyển dụng.' : 'Đã từ chối và gửi phản hồi cho nhà tuyển dụng.') });
      setRejectOpen(false);
      setCheckedReasons([]);
      setReasonText('');
      await loadList();
    } catch (err) {
      if (alive.current) setFlash({ tone: 'err', text: errorText(err, 'Không ghi được quyết định kiểm duyệt.') });
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [loadList, selectedId]);

  const bulkApprove = useCallback(async () => {
    setBulkOpen(false);
    setBusy(true);
    setFlash(null);
    const failed: string[] = [];
    for (const row of pendingRows) {
      try {
        await AdminService.reviewJob(row.id, { approved: true });
      } catch (err) {
        failed.push(`#${row.id}: ${errorText(err, 'Lỗi')}`);
      }
    }
    if (alive.current) {
      setFlash({
        tone: failed.length ? 'err' : 'ok',
        text: failed.length
          ? `Đã duyệt ${pendingRows.length - failed.length}/${pendingRows.length}. Lỗi: ${failed.join(' | ')}`
          : `Đã phê duyệt ${pendingRows.length} tin tuyển dụng.`,
      });
      setBusy(false);
      await loadList();
    }
  }, [pendingRows, loadList]);

  const exportReport = useCallback(() => {
    const header = ['Ma JD', 'Tieu de', 'Cong ty', 'Nha tuyen dung', 'Email', 'Trang thai', 'Gui duyet', 'Quyet dinh', 'Ghi chu'];
    const lines = rows.map((r) => [
      r.id, r.title, r.companyName, r.employerName, r.employerEmail,
      JOB_STATUS_LABELS[r.status], r.submittedAt ?? '', r.decidedAt ?? '', r.reviewNote ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([`\uFEFF${[header.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-kiem-duyet-jd-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const joinReason = (): string => {
    const head = checkedReasons.join(' ');
    const body = reasonText.trim();
    return [head, body].filter(Boolean).join(' | ').slice(0, 1000);
  };

  const job = detail?.job ?? null;

  return (
    <div className="flex flex-col w-full">
      {/* Header band: breadcrumb + bulk/export + chip lọc */}
      <div className="px-space-xl py-space-md bg-surface-container-lowest border-b border-surface-container shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-ds-label-md text-on-surface-variant">
                <Link to="/admin/dashboard" className="hover:text-primary transition-colors no-underline text-inherit">
                  Quản trị nội dung &amp; duyệt
                </Link>
                <span className={`${ICON} text-[16px] text-outline-strong`}>chevron_right</span>
                <span className="text-on-surface font-semibold">Kiểm duyệt tin tuyển dụng</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-ds-label-sm font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {total} chờ xử lý
              </span>
            </div>
            <div>
              <h1 className="text-ds-headline-xl text-on-surface font-bold tracking-tight">
                Hàng đợi kiểm duyệt tin tuyển dụng
              </h1>
              <p className="text-ds-body-sm text-on-surface-variant mt-0.5">
                Hệ thống AI tự động phân tích và thẩm định chuẩn mực tin đăng tuyển theo bộ quy tắc lao động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-sm shrink-0">
            <button type="button" onClick={exportReport} className="h-10 px-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-ds-label-md transition-all flex items-center gap-2 border border-surface-container-high shadow-sm cursor-pointer">
              <span className={`${ICON} text-[18px] text-on-surface-variant`}>file_download</span>
              <span className="font-medium">Xuất báo cáo vi phạm</span>
            </button>
            <button
              type="button"
              disabled={!pendingRows.length || busy}
              onClick={() => setBulkOpen(true)}
              className="h-10 px-space-md rounded-xl bg-primary text-on-primary text-ds-label-md hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm font-semibold border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`${ICON} text-[18px]`}>checklist</span>
              Phê duyệt hàng loạt ({pendingRows.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs pt-1 border-t border-surface-container-high">
          {STATUS_CHIPS.map((chip, idx) => {
            const active = chip.value === status;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => { setPage(0); setStatus(chip.value); }}
                className={
                  active
                    ? 'h-8 px-space-md rounded-full bg-primary text-on-primary text-ds-label-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all border-0 cursor-pointer'
                    : 'h-8 px-space-md rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-ds-label-sm font-medium transition-colors flex items-center gap-1.5 border border-surface-container-high cursor-pointer'
                }
              >
                {idx === 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                <span>{chip.label}</span>
                <span className={active ? 'px-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold' : ''}>
                  {idx === 0 ? total : ''}
                </span>
              </button>
            );
          })}
          {DEMO_CHIPS.map((chip) => (
            <span
              key={chip.label}
              title="Chưa có bộ lọc phía backend"
              className="h-8 px-space-md rounded-full bg-surface-container-low text-on-surface-variant text-ds-label-sm font-medium flex items-center gap-1.5 border border-surface-container-high"
            >
              {chip.dot && <span className={`w-2 h-2 rounded-full ${chip.dot}`} />}
              <span>{chip.label}</span>
              <span>{chip.count}</span>
            </span>
          ))}
        </div>
      </div>

      {flash && (
        <div className={`mx-space-xl mt-space-md rounded-xl px-4 py-3 text-ds-body-md flex items-center gap-2 ${flash.tone === 'ok' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
          <span className={`${ICON} text-[20px]`}>{flash.tone === 'ok' ? 'check_circle' : 'error'}</span>
          <span className="flex-1">{flash.text}</span>
          <button type="button" onClick={() => setFlash(null)} className="text-ds-label-md font-semibold border-0 bg-transparent cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      <div className="px-space-xl py-space-lg grid grid-cols-12 gap-space-lg items-start">
        {/* Cột trái: tìm kiếm + sắp xếp + danh sách hàng đợi */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-md">
          <div className="p-space-md bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-sm">
            <div className="relative w-full">
              <span className={`${ICON} absolute left-3 top-2.5 text-outline-strong text-[18px]`}>search</span>
              <form
                onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput.trim()); }}
                className="contents"
              >
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tiêu đề, mã tin, công ty..."
                  aria-label="Tìm tin tuyển dụng chờ kiểm duyệt"
                  className="w-full h-9 pl-10 pr-3 bg-surface-container-low rounded-lg text-ds-body-sm text-on-surface border border-surface-container-high placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest transition-all"
                />
              </form>
            </div>
            <div className="grid grid-cols-2 gap-space-xs">
              <select
                value={status}
                onChange={(e) => { setPage(0); setStatus(e.target.value as JobStatusCode); }}
                aria-label="Lọc theo trạng thái"
                className="h-9 px-2 bg-surface-container-low rounded-lg text-ds-label-sm text-on-surface border border-surface-container-high focus:outline-none cursor-pointer"
              >
                {STATUS_CHIPS.map((chip) => (
                  <option key={chip.value} value={chip.value}>{`Trạng thái: ${chip.label}`}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sắp xếp hàng đợi"
                className="h-9 px-2 bg-surface-container-low rounded-lg text-ds-label-sm text-on-surface border border-surface-container-high focus:outline-none cursor-pointer"
              >
                <option value="newest">Gửi mới nhất</option>
                <option value="oldest">Gửi sớm nhất</option>
                <option value="score">Điểm AI: Thấp trước</option>
              </select>
            </div>
          </div>

          {listLoading ? (
            <LoadingBlock label="Đang tải hàng đợi kiểm duyệt..." />
          ) : listError ? (
            <ErrorBlock message={listError} onRetry={() => void loadList()} />
          ) : sortedRows.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm">
              <EmptyBlock
                icon="fact_check"
                title="Không có tin tuyển dụng"
                description="Hàng đợi đang trống với bộ lọc hiện tại. Đây là tín hiệu tốt: không còn tin chờ kiểm duyệt."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
              {sortedRows.map((row) => {
                const active = row.id === selectedId;
                return (
                  <div
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={
                      active
                        ? 'p-space-md bg-surface-container-lowest rounded-xl shadow-sm ring-2 ring-primary border border-primary/30 transition-all cursor-pointer relative overflow-hidden'
                        : 'p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative border border-surface-container'
                    }
                  >
                    {active && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                    <div className={`flex items-start justify-between gap-space-xs mb-space-xs ${active ? 'pl-1.5' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-sm shrink-0">
                          {initialsOfCompany(row.companyName)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-ds-label-md text-on-surface font-semibold truncate max-w-[150px]">
                            {row.companyName || 'Doanh nghiệp ẩn danh'}
                          </span>
                          <span className="text-ds-label-sm text-on-surface-variant text-[11px]">
                            {timeAgo(row.submittedAt ?? row.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-ds-label-sm font-semibold flex items-center gap-1 shrink-0 ${scorePillClass(row.aiSafetyScore)}`}>
                        <span className={`${ICON} text-[13px]`}>{row.aiSafetyScore === null ? 'help' : 'verified_user'}</span>
                        {row.aiSafetyScore === null ? 'Chưa chấm' : `${row.aiSafetyScore}/100`}
                      </span>
                    </div>
                    <h3 className={`text-ds-headline-sm text-on-surface font-semibold line-clamp-1 ${active ? 'pl-1.5' : ''} mt-1`}>
                      {row.title}
                    </h3>
                    <div className={`flex items-center gap-1 mt-space-xs ${active ? 'pl-1.5' : ''} text-ds-body-sm text-on-surface-variant`}>
                      <span className={`${ICON} text-[16px]`}>badge</span>
                      <span className="truncate max-w-[180px]">{row.employerName || row.employerEmail}</span>
                    </div>
                    <div className={`flex items-center justify-between mt-space-sm pt-space-xs ${active ? 'pl-1.5' : ''} border-t border-surface-container-high`}>
                      <span className="text-ds-label-sm text-primary bg-primary-fixed/50 px-2 py-0.5 rounded font-mono font-medium">
                        #JD-{row.id}
                      </span>
                      <span className={`text-ds-label-sm font-medium flex items-center gap-1.5 ${row.status === 'PENDING_APPROVAL' ? 'text-secondary-teal' : 'text-on-surface-variant'}`}>
                        <span className={`w-2 h-2 rounded-full ${statusPillClass(row.status).split(' ')[0]}`} />
                        {JOB_STATUS_LABELS[row.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-ds-body-sm text-on-surface-variant pt-1">
                <span>Đang tải thêm khi kéo xuống</span>
                {Math.ceil(total / PAGE_SIZE) > 1 && (
                  <span className="flex items-center gap-1.5">
                    <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className={adminButton('ghost', 'h-8 px-2 disabled:opacity-40')}>
                      <span className={`${ICON} text-[16px]`}>chevron_left</span>
                    </button>
                    <span>{page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
                    <button type="button" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)} className={adminButton('ghost', 'h-8 px-2 disabled:opacity-40')}>
                      <span className={`${ICON} text-[16px]`}>chevron_right</span>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cột phải: khung inspect tin đang chọn */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-lg">
          {detailLoading && !detail ? (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm">
              <LoadingBlock label="Đang tải chi tiết tin tuyển dụng..." />
            </div>
          ) : detailError || !detail || !job ? (
            <ErrorBlock message={detailError || 'Chưa chọn tin tuyển dụng nào.'} onRetry={selectedId != null ? () => setSelectedId(selectedId) : undefined} />
          ) : (
            <>
              {/* Header dính: mã tin, trạng thái, tiêu đề, 3 quyết định */}
              <div className="p-space-lg bg-surface-container-lowest rounded-xl border border-surface-container shadow-md sticky top-16 z-20 flex flex-col gap-space-md">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant">
                      <Link
                        to={`/admin/job-approvals/${job.id}`}
                        className="px-2.5 py-0.5 rounded font-mono font-medium bg-primary-fixed/40 text-primary border border-primary/20 no-underline"
                      >
                        #JD-{job.id}
                      </Link>
                      <span className="flex items-center gap-1 font-medium">
                        Đăng lúc {fmtServer(detail.submittedAt ?? job.createdAt, 'time')} • {timeAgo(detail.submittedAt ?? job.createdAt)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-sm ${statusPillClass(job.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2.5 shrink-0 flex-wrap sm:flex-nowrap pt-1">
                      <button
                        type="button"
                        disabled={busy || job.status !== 'PENDING_APPROVAL'}
                        onClick={() => { setCheckedReasons([]); setReasonText(''); setRejectOpen(true); }}
                        className="h-10 px-3.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 text-ds-label-md font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={`${ICON} text-[18px]`}>block</span>
                        <span>Từ chối duyệt</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy || job.status !== 'PENDING_APPROVAL'}
                        onClick={() => { setCheckedReasons([]); setReasonText(''); setRejectOpen(true); }}
                        className="h-10 px-3.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 text-ds-label-md font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={`${ICON} text-[18px]`}>edit_note</span>
                        <span>Yêu cầu chỉnh sửa</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy || job.status !== 'PENDING_APPROVAL'}
                        onClick={() => void submitDecision(true)}
                        className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-ds-label-md flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <span className={`${ICON} text-[18px]`}>verified</span>
                        <span>{busy ? 'Đang gửi...' : 'Phê duyệt tin'}</span>
                      </button>
                    </div>
                  </div>
                  <h2 className="text-ds-headline-xl font-bold text-on-surface tracking-tight leading-snug break-normal">
                    {job.title}
                  </h2>
                  <p className="text-ds-body-sm text-on-surface-variant">
                    {job.position} • {job.department} • {job.location}
                  </p>
                </div>

                {/* Hồ sơ nhà tuyển dụng */}
                <div className="p-space-md bg-surface-container-low rounded-xl border border-surface-container-high flex flex-wrap items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary text-ds-headline-sm flex items-center justify-center font-bold shadow-sm shrink-0">
                      {initialsOfCompany(job.companyName)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-ds-label-lg text-on-surface font-bold">{job.companyName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary-teal text-ds-label-sm font-semibold flex items-center gap-1 border border-secondary-teal/20">
                          <span className={`${ICON} text-[14px]`}>verified</span>
                          Enterprise Tier
                        </span>
                      </div>
                      <span className="text-ds-body-sm text-on-surface-variant mt-0.5 truncate">
                        {job.employerName} • {job.employerEmail}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-lg pl-space-md border-l border-surface-container-high">
                    <div className="flex flex-col text-right">
                      <span className="text-ds-label-sm text-on-surface-variant uppercase tracking-wider text-[11px]">
                        Điểm tín nhiệm NTD
                      </span>
                      <span className="text-ds-headline-sm text-secondary-teal font-bold">99 / 100</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-ds-label-sm text-on-surface-variant uppercase tracking-wider text-[11px]">
                        Lịch sử đăng tin
                      </span>
                      <span className="text-ds-headline-sm text-on-surface font-semibold">42 tin / 0 vi phạm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Khối thẩm định AI */}
              <div className="p-space-lg bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-secondary-fixed/40 text-secondary-teal flex items-center justify-center shrink-0">
                      <span className={`${ICON} text-[22px]`}>smart_toy</span>
                    </div>
                    <div>
                      <h3 className="text-ds-headline-sm text-on-surface font-bold">
                        Kết quả thẩm định bởi AI (AI Pre-screening &amp; Compliance)
                      </h3>
                      <p className="text-ds-body-sm text-on-surface-variant">
                        Kiểm tra vi phạm chính sách, phân biệt đối xử và chuẩn hóa bộ kỹ năng
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shrink-0 ${detail.aiSafetyScore === null ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : 'bg-emerald-50 text-emerald-800 border-emerald-600/20'}`}>
                    <span className={`${ICON} text-[18px]`}>{detail.aiSafetyScore === null ? 'hourglass_empty' : 'verified_user'}</span>
                    <span className="text-ds-label-md font-bold">
                      {detail.aiSafetyScore === null ? 'Chưa có điểm an toàn' : `Độ an toàn: ${detail.aiSafetyScore}/100 (Đạt chuẩn)`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-space-xs">
                  {AI_CHECKS.map((check) => (
                    <div
                      key={check.title}
                      className={`p-space-md rounded-xl border flex items-start gap-space-sm ${check.tone === 'ok' ? 'bg-surface-container-low border-surface-container-high' : 'bg-amber-50 border-amber-200/80'}`}
                    >
                      <span className={`${ICON} text-[22px] shrink-0 mt-0.5 ${check.tone === 'ok' ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {check.icon}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className={`text-ds-label-md font-semibold ${check.tone === 'ok' ? 'text-on-surface' : 'text-amber-900'}`}>
                          {check.title}
                        </span>
                        <span className={`text-ds-body-sm leading-relaxed ${check.tone === 'ok' ? 'text-on-surface-variant' : 'text-amber-800'}`}>
                          {check.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-space-md bg-primary-fixed/30 rounded-xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className={`${ICON} text-primary text-[22px]`}>psychology</span>
                    <span className="text-ds-body-sm text-on-surface font-medium">
                      {job.aiScreeningEnabled ? 'Ngân hàng câu hỏi phỏng vấn AI:' : 'Phỏng vấn AI cho tin này đang tắt:'}
                    </span>
                    <span className="text-ds-label-md text-primary font-bold">
                      {TRACK_VN[job.aiScreeningTrack] ?? job.aiScreeningTrack} — điểm qua {job.aiScreeningPassScore}
                    </span>
                  </div>
                  <Link
                    to={`/admin/job-approvals/${job.id}`}
                    className="text-ds-label-sm text-primary hover:underline font-semibold flex items-center gap-1 shrink-0 no-underline"
                  >
                    <span>Hồ sơ kiểm duyệt</span>
                    <span className={`${ICON} text-[14px]`}>arrow_forward</span>
                  </Link>
                </div>

                {job.reviewNote && (
                  <div className="p-space-md rounded-xl border border-amber-200/80 bg-amber-50 flex items-start gap-space-sm">
                    <span className={`${ICON} text-amber-700 text-[22px] shrink-0 mt-0.5`}>feed</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-ds-label-md text-amber-900 font-semibold">Ghi chú kiểm duyệt gần nhất</span>
                      <span className="text-ds-body-sm text-amber-800 leading-relaxed break-words">{job.reviewNote}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nội dung JD */}
              <div className="p-space-lg bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm flex flex-col gap-space-lg">
                <div className="flex flex-col gap-space-xs">
                  <h4 className="text-ds-label-lg text-on-surface font-bold uppercase tracking-wider text-[12px]">
                    Thông số tuyển dụng cốt lõi
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-xs pt-1">
                    <SpecCell label="Mức lương" value={job.salaryRange || `${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}`} strong />
                    <SpecCell label="Hình thức" value={job.employmentType} />
                    <SpecCell label="Cấp bậc" value={job.experienceLevel} />
                    <SpecCell label="Làm việc" value={WORKPLACE_VN[job.workplaceModel] ?? job.workplaceModel} />
                    <SpecCell label="Múi giờ yêu cầu" value={job.timezoneRequirement} />
                    <SpecCell label="Cập nhật" value={fmtServer(job.updatedAt, 'date')} />
                  </div>
                </div>

                <div className="flex flex-col gap-space-sm pt-space-xs border-t border-surface-container">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className={`${ICON} text-primary text-[22px]`}>assignment</span>
                    <h4 className="text-ds-headline-sm font-bold">Mô tả công việc (Job Description)</h4>
                  </div>
                  <BulletList items={splitLines(job.description)} dot="bg-primary" />
                </div>

                <div className="flex flex-col gap-space-sm pt-space-xs border-t border-surface-container">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className={`${ICON} text-primary text-[22px]`}>manage_accounts</span>
                    <h4 className="text-ds-headline-sm font-bold">Yêu cầu ứng viên (Requirements)</h4>
                  </div>
                  <BulletList items={splitLines(job.requirements)} dot="bg-primary" />
                </div>

                <div className="flex flex-col gap-space-sm pt-space-xs border-t border-surface-container">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className={`${ICON} text-secondary-teal text-[22px]`}>card_giftcard</span>
                    <h4 className="text-ds-headline-sm font-bold">Quyền lợi &amp; Đãi ngộ (Benefits)</h4>
                  </div>
                  <BulletList
                    items={[job.annualBonus, job.equityBand]
                      .map((v) => (v ?? '').trim())
                      .filter(Boolean)
                      .concat(DEMO_BENEFITS)
                      .slice(0, 4)}
                    dot="bg-secondary-teal"
                  />
                </div>

                <div className="flex flex-col gap-space-xs pt-space-sm border-t border-surface-container">
                  <span className="text-ds-label-lg text-on-surface font-bold uppercase tracking-wider text-[12px]">
                    Kỹ năng cốt lõi được gắn thẻ
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {splitCsv(job.requiredSkills).map((skill, i) => (
                      <span
                        key={skill}
                        className={
                          i < 4
                            ? 'px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-ds-label-md font-medium border border-primary/20'
                            : 'px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-ds-label-md font-medium border border-surface-container-highest'
                        }
                      >
                        {skill}
                      </span>
                    ))}
                    {splitCsv(job.requiredSkills).length === 0 && (
                      <span className="text-ds-body-sm text-on-surface-variant">Nhà tuyển dụng chưa gắn thẻ kỹ năng.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal từ chối duyệt */}
      {rejectOpen && (
        <ModalBackdrop onClose={() => !busy && setRejectOpen(false)}>
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs min-w-0">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <span className={`${ICON} text-[20px]`}>block</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-ds-headline-sm text-on-surface font-bold">Từ chối phê duyệt tin tuyển dụng</h3>
                  <span className="text-ds-label-sm text-on-surface-variant block truncate">
                    Mã tin: #JD-{job?.id} • {job?.companyName}
                  </span>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setRejectOpen(false)} className="p-1.5 rounded-lg text-outline-strong hover:text-on-surface hover:bg-surface-container transition-colors border-0 bg-transparent cursor-pointer">
                <span className={`${ICON} text-[22px]`}>close</span>
              </button>
            </div>

            <div className="px-space-xl py-space-sm bg-amber-50 flex items-center gap-space-xs text-amber-900">
              <span className={`${ICON} text-amber-700 text-[18px]`}>info</span>
              <span className="text-ds-body-sm">
                Thông báo này sẽ được gửi kèm email giải thích chi tiết trực tiếp đến Nhà tuyển dụng để hỗ trợ điều chỉnh.
              </span>
            </div>

            <div className="p-space-xl flex flex-col gap-space-md max-h-[70vh] overflow-y-auto">
              <div>
                <span className="text-ds-label-lg text-on-surface font-semibold mb-space-xs block">
                  Chọn các lý do không đạt tiêu chuẩn:
                </span>
                <div className="space-y-space-xs text-ds-body-md text-on-surface">
                  {REJECT_REASONS.map((reason) => {
                    const on = checkedReasons.includes(reason);
                    return (
                      <label key={reason} className={`flex items-start gap-space-xs p-2 rounded-lg transition-colors cursor-pointer ${on ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setCheckedReasons((prev) => (on ? prev.filter((r) => r !== reason) : [...prev, reason]))}
                          className="mt-0.5 accent-[#3525cd]"
                        />
                        <span className={on ? 'font-semibold text-primary' : ''}>{reason}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-ds-label-lg text-on-surface font-semibold" htmlFor="jd-reject-note">
                  Chi tiết lý do từ chối &amp; Hướng dẫn điều chỉnh cho NTD:
                </label>
                <textarea
                  id="jd-reject-note"
                  rows={4}
                  value={reasonText}
                  maxLength={REASON_MAX}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Nhập lý do chi tiết để nhà tuyển dụng chỉnh sửa tin..."
                  className="w-full p-space-sm bg-surface-container-low rounded-lg text-ds-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 shadow-sm leading-relaxed resize-y"
                />
                <span className="text-ds-label-sm text-on-surface-variant text-right">
                  {reasonText.length}/{REASON_MAX} ký tự
                </span>
              </div>

              <div className="text-ds-body-sm text-on-surface-variant">
                Nhà tuyển dụng vẫn được phép chỉnh sửa và gửi duyệt lại sau khi bị từ chối; hệ thống không trừ quota tin đăng.
              </div>
            </div>

            <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
              <button type="button" onClick={() => setRejectOpen(false)} className={modalCancelClass}>Hủy bỏ</button>
              <button
                type="button"
                disabled={busy || !joinReason().trim()}
                onClick={() => void submitDecision(false, joinReason().trim())}
                className={modalDangerClass}
              >
                <span className={`${ICON} text-[18px]`}>send</span>
                <span>{busy ? 'Đang gửi...' : 'Xác nhận từ chối & Gửi phản hồi'}</span>
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Modal xác nhận phê duyệt hàng loạt */}
      {bulkOpen && (
        <ModalBackdrop onClose={() => setBulkOpen(false)}>
          <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className={`${ICON} text-[20px]`}>checklist</span>
              </div>
              <h3 className="text-ds-headline-sm text-on-surface font-bold">Phê duyệt {pendingRows.length} tin đang chờ?</h3>
            </div>
            <p className="text-ds-body-sm text-on-surface-variant leading-relaxed">
              Hệ thống sẽ gửi quyết định duyệt từng tin ({pendingRows.map((r) => `#${r.id}`).join(', ')}) sang
              PATCH /jobs/{'{id}'}/review. Nhà tuyển dụng sẽ nhận email thông báo cho từng tin.
            </p>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button type="button" onClick={() => setBulkOpen(false)} className={modalCancelClass}>Hủy bỏ</button>
              <button type="button" onClick={() => void bulkApprove()} className={adminButton('primary', 'text-ds-label-lg font-semibold')}>
                <span className={`${ICON} text-[18px]`}>verified</span>
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default JobApprovalPage;
