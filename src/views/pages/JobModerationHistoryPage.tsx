import React from 'react';
import { Link } from 'react-router-dom';

/**
 * STATIC mockup page — JD moderation history (Stitch screen_18.2 "lịch sử kiểm duyệt JD").
 * BE chưa có endpoint kiểm duyệt JD nên trang dựng tĩnh: giữ nguyên demo data tiếng Việt từ
 * mockup, chrome tiếng Anh, không gọi API, không gắn sidebar.
 */

const STATS = [
  {
    label: 'Total processed', icon: 'assignment_turned_in', iconCls: 'bg-surface-high text-primary',
    value: '342', unit: 'tin', bar: 100, barCls: 'bg-primary-container w-full',
    chip: { icon: 'trending_up', text: '100%', cls: 'bg-success-bg text-success-text' },
  },
  {
    label: 'Approved', icon: 'check_circle', iconCls: 'bg-success-bg text-success-text',
    value: '298', unit: 'tin', bar: 87.1, barCls: 'bg-secondary',
    chip: { text: '87.1% approval rate', cls: 'bg-success-bg text-success-text' },
  },
  {
    label: 'Rejected', icon: 'cancel', iconCls: 'bg-danger-bg text-error',
    value: '44', unit: 'tin', bar: 12.9, barCls: 'bg-error',
    chip: { text: '12.9% rejected', cls: 'bg-danger-bg text-danger-text' },
  },
  {
    label: 'Avg. processing time', icon: 'schedule', iconCls: 'bg-surface-high text-primary-container',
    value: '1.8', unit: 'giờ / tin', bar: 76, barCls: 'bg-primary-container',
    chip: { icon: 'speed', text: 'Nhanh hơn 30m', cls: 'bg-success-bg text-success-text' },
  },
];

const TABS = [
  { label: 'All', count: '342', active: true },
  { label: 'Approved', count: '298' },
  { label: 'Rejected', count: '44' },
];

interface HistoryRow {
  code: string;
  field: string;
  fieldTone: 'info' | 'success' | 'neutral';
  title: string;
  mode: string;
  company: { initials: string; name: string; email: string; danger?: boolean };
  submitted: { time: string; date: string };
  processed: { time: string; date: string; duration: string; overnight?: boolean };
  approved: boolean;
  reviewer: { initials: string; name: string; alt?: boolean };
  note: string;
}

const ROWS: HistoryRow[] = [
  {
    code: 'JD-8821', field: 'Công nghệ thông tin', fieldTone: 'success',
    title: 'Senior Fullstack Engineer (Node.js/React)', mode: 'Hybrid • Quận 7, TP. HCM',
    company: { initials: 'VN', name: 'VNG Tech Lab', email: 'recruitment@vng.com.vn' },
    submitted: { time: '14:30', date: '24/02/2026' },
    processed: { time: '16:15', date: '24/02/2026', duration: '1h 45m' },
    approved: true,
    reviewer: { initials: 'TQ', name: 'Trần Quản Trị' },
    note: 'Đầy đủ thông tin, mô tả chi tiết, kỹ năng đo lường rõ ràng, dải lương minh bạch 2,200 - 3,500 USD.',
  },
  {
    code: 'JD-8820', field: 'Dữ liệu & AI', fieldTone: 'info',
    title: 'AI Research Scientist (LLMs & Vision)', mode: 'Toàn thời gian • Hà Nội',
    company: { initials: 'VA', name: 'VinAI Innovation', email: 'hr-ai@vinai.io' },
    submitted: { time: '11:00', date: '24/02/2026' },
    processed: { time: '12:10', date: '24/02/2026', duration: '1h 10m' },
    approved: true,
    reviewer: { initials: 'LK', name: 'Lê Kiểm Duyệt 1', alt: true },
    note: 'Bộ câu hỏi kỹ thuật chuyên sâu chuẩn mực, tương thích xuất sắc với bộ đề mô phỏng AI Interview.',
  },
  {
    code: 'JD-8819', field: 'Marketing & Media', fieldTone: 'neutral',
    title: 'Thực tập sinh Marketing online (Có phí đặt cọc)', mode: 'Remote • Làm việc tự do',
    company: { initials: 'TP', name: 'Tân Phát Digital', email: 'tanphat.mkt@gmail.com', danger: true },
    submitted: { time: '09:15', date: '24/02/2026' },
    processed: { time: '10:05', date: '24/02/2026', duration: '50m' },
    approved: false,
    reviewer: { initials: 'NA', name: 'Nguyễn Admin' },
    note: 'Yêu cầu ứng viên đặt cọc tiền giữ chỗ - vi phạm nghiêm trọng Bộ Quy tắc minh bạch tuyển dụng. Khóa quyền đăng tin 14 ngày.',
  },
  {
    code: 'JD-8815', field: 'Thiết kế Sản phẩm', fieldTone: 'success',
    title: 'Lead Product Designer (UI/UX - Fintech)', mode: 'Tại văn phòng • Hà Nội',
    company: { initials: 'TC', name: 'Techcombank Digital', email: 'talent-design@techcombank.com.vn' },
    submitted: { time: '17:40', date: '23/02/2026' },
    processed: { time: '08:30', date: '24/02/2026', duration: 'Qua đêm (2h làm việc)', overnight: true },
    approved: true,
    reviewer: { initials: 'TQ', name: 'Trần Quản Trị' },
    note: 'Đã cấu hình sẵn 5 vòng kịch bản phỏng vấn hành vi và tình huống chuyên sâu, chỉ định người phỏng vấn rõ ràng.',
  },
  {
    code: 'JD-8812', field: 'Nhân sự & Tuyển dụng', fieldTone: 'neutral',
    title: 'Chuyên viên Tuyển dụng IT (Recruiter)', mode: 'Toàn thời gian • Đà Nẵng',
    company: { initials: 'FH', name: 'FastHR Agency', email: 'info@fasthr-consulting.vn' },
    submitted: { time: '15:10', date: '23/02/2026' },
    processed: { time: '16:45', date: '23/02/2026', duration: '1h 35m' },
    approved: false,
    reviewer: { initials: 'LK', name: 'Lê Kiểm Duyệt 1', alt: true },
    note: 'Mô tả công việc quá sơ sài (dưới 100 từ), thiếu tiêu chí đánh giá năng lực ứng viên và dải lương cụ thể. Đã gửi yêu cầu chỉnh sửa.',
  },
  {
    code: 'JD-8809', field: 'DevOps & Cloud', fieldTone: 'success',
    title: 'DevOps / SRE Specialist (Kubernetes/AWS)', mode: 'Linh hoạt • TP. Thủ Đức',
    company: { initials: 'FP', name: 'FPT Software', email: 'recruitment@fsoft.com.vn' },
    submitted: { time: '10:00', date: '23/02/2026' },
    processed: { time: '11:40', date: '23/02/2026', duration: '1h 40m' },
    approved: true,
    reviewer: { initials: 'TQ', name: 'Trần Quản Trị' },
    note: 'Phúc lợi minh bạch, đầy đủ chứng chỉ bắt buộc, đã gắn bộ câu hỏi phỏng vấn thực hành Docker/K8s tự động.',
  },
  {
    code: 'JD-8804', field: 'Phân tích Dữ liệu', fieldTone: 'info',
    title: 'Data Analyst & Business Intelligence', mode: 'Toàn thời gian • Times City, Hà Nội',
    company: { initials: 'OM', name: 'One Mount Group', email: 'talent@onemount.com' },
    submitted: { time: '08:20', date: '23/02/2026' },
    processed: { time: '09:50', date: '23/02/2026', duration: '1h 30m' },
    approved: true,
    reviewer: { initials: 'NA', name: 'Nguyễn Admin' },
    note: 'Thông tin chuẩn xác, yêu cầu SQL & PowerBI rõ ràng. Đáp ứng đầy đủ quy định về bảo mật dữ liệu khách hàng.',
  },
];

const FIELD_CHIP: Record<HistoryRow['fieldTone'], string> = {
  info: 'bg-info text-info-text',
  success: 'bg-success-bg text-success-text',
  neutral: 'bg-surface-high text-ink',
};

const DATE_OPTIONS = ['30 ngày qua', 'Hôm nay', '7 ngày qua', 'Quý này', 'Tùy chọn khoảng ngày'];
const EMPLOYER_OPTIONS = ['Tất cả nhà tuyển dụng', 'VNG Corporation', 'FPT Software', 'Viettel Telecom', 'VinAI Innovation', 'Techcombank', 'One Mount Group'];
const MODERATOR_OPTIONS = ['Tất cả kiểm duyệt viên', 'Trần Quản Trị', 'Lê Kiểm Duyệt 1', 'Nguyễn Admin'];

const iconBtnClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-outline-strong transition-colors hover:bg-surface-high hover:text-ink';

const filterSelectClass =
  'h-10 w-full cursor-pointer appearance-none rounded-md bg-surface-low pl-3 pr-8 text-body-sm text-ink shadow-inner transition-colors focus:bg-card focus:outline-none';

const JobModerationHistoryPage: React.FC = () => (
  <div className="flex flex-col gap-4">
    {/* Breadcrumb + actions */}
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div>
        <nav className="mb-1.5 flex items-center gap-1 text-label-md text-ink-variant">
          <Link to="/admin/job-approvals" className="flex items-center gap-1 transition-colors hover:text-primary">
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            JD Moderation
          </Link>
          <span className="font-bold text-outline">/</span>
          <span className="font-semibold text-primary">Moderation history</span>
        </nav>
        <h1 className="m-0 text-headline-lg font-bold tracking-tight text-ink">Job Posting Moderation History</h1>
        <p className="m-0 mt-0.5 max-w-3xl text-body-sm text-ink-variant">
          Track, review and look up every job posting approval or rejection decision made by employers across the AI Interview system.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-card px-3.5 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-high">
          <span className="material-symbols-outlined text-[18px] text-ink-variant">refresh</span>
          Refresh data
        </button>
        <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-container px-4 text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Excel / CSV
        </button>
      </div>
    </div>

    {/* KPI summary */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map(s => (
        <div key={s.label} className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-label-md font-semibold uppercase tracking-wider text-ink-variant">{s.label}</span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${s.iconCls}`}>
              <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-metric-stat text-ink">{s.value}</span>
              <span className="text-label-md text-ink-variant">{s.unit}</span>
            </div>
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-label-sm font-bold ${s.chip.cls}`}>
              {s.chip.icon && <span className="material-symbols-outlined text-[14px]">{s.chip.icon}</span>}
              {s.chip.text}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
            <div className={`h-full rounded-full ${s.barCls}`} style={{ width: `${s.bar}%` }} />
          </div>
        </div>
      ))}
    </div>

    {/* Filter module */}
    <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-card p-3 shadow-sm">
      <div className="flex flex-col justify-between gap-2 rounded-lg bg-surface-low/50 p-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          {TABS.map(t => (
            <button
              key={t.label}
              type="button"
              className={
                t.active
                  ? 'inline-flex items-center gap-2 rounded-md bg-card px-4 py-2 text-label-md font-bold text-primary shadow-sm'
                  : 'inline-flex items-center gap-2 rounded-md px-4 py-2 text-label-md text-ink-variant transition-colors hover:bg-surface-high hover:text-ink'
              }
            >
              <span>{t.label}</span>
              <span className={t.active ? 'rounded-full bg-info px-2 py-0.5 text-label-sm text-info-text' : 'rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-bold text-success-text'}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong">search</span>
          <input
            type="text"
            placeholder="Search by JD title, posting ID or company name..."
            className="h-10 w-full rounded-md bg-surface-low pl-10 pr-4 text-body-sm text-ink shadow-inner placeholder:text-outline-strong focus:bg-card focus:outline-none"
          />
        </div>
        <div className="relative md:col-span-2">
          <select className={filterSelectClass}>
            {DATE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">calendar_month</span>
        </div>
        <div className="relative md:col-span-2">
          <select className={filterSelectClass}>
            {EMPLOYER_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">business</span>
        </div>
        <div className="relative md:col-span-2">
          <select className={filterSelectClass}>
            {MODERATOR_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">admin_panel_settings</span>
        </div>
        <div className="flex justify-end md:col-span-1">
          <button type="button" title="Clear filters" className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-surface-mid text-ink-variant transition-colors hover:bg-danger-bg hover:text-danger-text">
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
          </button>
        </div>
      </div>
    </div>

    {/* History table */}
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className="bg-surface-low/60 text-label-md uppercase tracking-wider text-ink-variant">
              <th className="w-72 px-4 py-3.5 font-semibold">JD title &amp; ID</th>
              <th className="w-60 px-4 py-3.5 font-semibold">Employer</th>
              <th className="w-40 px-4 py-3.5 font-semibold">Submitted</th>
              <th className="w-44 px-4 py-3.5 font-semibold">Processed</th>
              <th className="w-36 px-4 py-3.5 font-semibold">Decision</th>
              <th className="w-44 px-4 py-3.5 font-semibold">Reviewer</th>
              <th className="px-4 py-3.5 font-semibold">Reason / feedback note</th>
              <th className="w-28 px-4 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {ROWS.map(r => (
              <tr key={r.code} className="group transition-colors hover:bg-surface-low/40">
                <td className="align-top px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-surface-high px-1.5 py-0.5 font-mono text-label-sm text-ink-variant">{r.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-label-sm font-semibold ${FIELD_CHIP[r.fieldTone]}`}>{r.field}</span>
                    </div>
                    <Link
                      to={`/admin/job-approvals/${r.code}`}
                      className={`line-clamp-1 text-headline-sm font-bold leading-tight transition-colors ${r.approved ? 'text-ink group-hover:text-primary' : 'text-ink group-hover:text-danger-text'}`}
                    >
                      {r.title}
                    </Link>
                    <span className="text-label-sm text-outline-strong">{r.mode}</span>
                  </div>
                </td>
                <td className="align-top px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={
                      r.company.danger
                        ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger-bg text-label-md font-bold text-danger-text'
                        : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-high text-label-md font-bold text-primary'
                    }>
                      {r.company.initials}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md font-semibold text-ink">{r.company.name}</span>
                      <span className="truncate text-body-sm text-outline-strong">{r.company.email}</span>
                    </div>
                  </div>
                </td>
                <td className="align-top px-4 py-4 text-body-sm text-ink-variant">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink">{r.submitted.time}</span>
                    <span className="text-label-sm text-outline-strong">{r.submitted.date}</span>
                  </div>
                </td>
                <td className="align-top px-4 py-4 text-body-sm text-ink-variant">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">{r.processed.time}</span>
                      <span className="text-label-sm text-outline-strong">{r.processed.date}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-label-sm font-semibold ${r.processed.overnight ? 'text-ink-variant' : 'text-success-text'}`}>
                      <span className="material-symbols-outlined text-[13px]">timer</span> {r.processed.duration}
                    </span>
                  </div>
                </td>
                <td className="align-top px-4 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-md font-bold ${r.approved ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                    <span className="material-symbols-outlined text-[16px]">{r.approved ? 'check_circle' : 'cancel'}</span>
                    {r.approved ? 'Đã duyệt' : 'Bị từ chối'}
                  </span>
                </td>
                <td className="align-top px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-label-sm font-bold ${r.reviewer.alt ? 'bg-success-bg text-success-text' : 'bg-info text-info-text'}`}>
                      {r.reviewer.initials}
                    </div>
                    <span className="text-label-md font-medium text-ink">{r.reviewer.name}</span>
                  </div>
                </td>
                <td className="align-top px-4 py-4">
                  <div className={`flex items-start gap-1.5 rounded-md p-2 ${r.approved ? 'bg-surface-low/60 text-ink-variant' : 'bg-danger-bg/50 text-danger-text'}`}>
                    <span className={`material-symbols-outlined mt-0.5 shrink-0 text-[16px] ${r.approved ? 'text-success-text' : 'text-error'}`}>
                      {r.approved ? 'verified' : 'report_problem'}
                    </span>
                    <p className="m-0 line-clamp-2 text-body-sm">{r.note}</p>
                  </div>
                </td>
                <td className="align-top px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/admin/job-approvals/${r.code}`} title="View JD detail" className={`${iconBtnClass} text-primary`}>
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </Link>
                    <button type="button" aria-label="More actions" className={iconBtnClass}>
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-low bg-card px-4 py-3 sm:flex-row">
        <div className="flex items-center gap-4">
          <span className="text-body-sm text-ink-variant">
            Showing <span className="font-semibold text-ink">1 - 7</span> of <span className="font-semibold text-ink">342</span> records
          </span>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-outline-strong">Page size:</span>
            <select className="h-8 cursor-pointer rounded-md bg-surface-low px-2.5 text-body-sm text-ink focus:outline-none">
              <option value="10">10 records / page</option>
              <option value="20">20 records / page</option>
              <option value="50">50 records / page</option>
            </select>
          </div>
        </div>
        <div className="flex select-none items-center gap-1">
          <button type="button" disabled className={`${iconBtnClass} disabled:opacity-40`} aria-label="Previous page">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary-container text-label-md font-bold text-on-primary">1</button>
          {[2, 3].map(p => (
            <button key={p} type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-label-md font-medium text-ink-variant transition-colors hover:bg-surface-high hover:text-ink">
              {p}
            </button>
          ))}
          <span className="flex h-8 w-8 items-center justify-center text-label-md text-outline-strong">...</span>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-label-md font-medium text-ink-variant transition-colors hover:bg-surface-high hover:text-ink">
            49
          </button>
          <button type="button" className={iconBtnClass} aria-label="Next page">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    {/* Audit footnote */}
    <div className="flex flex-col items-center justify-between gap-2 rounded-xl bg-surface-low/50 p-3 text-ink-variant md:flex-row">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">security</span>
        <span className="text-label-sm">
          All moderation logs are digitally signed and stored immutably (Immutable Audit Log) for 24 months per the AI ecosystem security standard.
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-label-sm font-semibold text-success-text">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        Real-time sync: 24/02/2026 16:45:00
      </div>
    </div>
  </div>
);

export default JobModerationHistoryPage;
