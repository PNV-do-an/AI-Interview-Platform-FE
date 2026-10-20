import React from 'react';
import { Link } from 'react-router-dom';

/**
 * STATIC mockup page — Admin dashboard (Stitch screen_16 "bảng điều khiển quản trị viên").
 * BE chưa có endpoint dashboard tổng hợp nên trang dựng tĩnh: giữ nguyên số liệu demo tiếng
 * Việt từ mockup, chrome tiếng Anh, không gọi API, không gắn sidebar.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #004598 tertiary,
 * #005cc6 tertiary-container (nhóm Mentor), #4f46e5 đường ứng viên, #006b5f đường phỏng vấn,
 * #dae2fd lưới biểu đồ, #eaedff nền donut, #777587 phân đoạn quản trị, #283044/#eef0ff/#c3c0ff tooltip tối.
 */

const TIME_PILLS = ['Today', '7 days', 'Past 30 days', 'This year', 'Custom'];

const ACTIVITY_FILTERS = ['All', 'New users', 'Job postings', 'Interview sessions', 'Security alerts'];

const ACTIVITY_LOGS = [
  {
    icon: 'post_add', tile: 'bg-surface-mid text-primary',
    title: <>Công ty CP VNG vừa đăng tin: <span className="text-primary">Senior Backend Engineer (Go/Kubernetes)</span></>,
    desc: 'Vị trí tuyển dụng 03 chỉ tiêu, mức lương thỏa thuận $2,500 - $3,500 tại TP. Hồ Chí Minh.',
    time: '4 phút trước', badge: { text: 'Chờ duyệt', cls: 'bg-success-bg text-success-text' },
  },
  {
    icon: 'psychology_alt', tile: 'bg-secondary-fixed text-ink',
    title: <>Ứng viên <span>Trần Minh Khang</span> hoàn thành phiên phỏng vấn AI</>,
    desc: 'Vị trí React Frontend Developer • Kết quả đánh giá: 9.2/10 (Thuộc top 5% xuất sắc).',
    time: '12 phút trước', badge: { text: 'Hoàn thành', cls: 'bg-surface-high text-success-text' },
  },
  {
    icon: 'verified_user', tile: 'bg-info text-primary',
    title: <>Doanh nghiệp <span>TechCorp APAC</span> nâng cấp gói Enterprise Tier</>,
    desc: 'Kích hoạt 500 token phỏng vấn tự động kèm phòng phỏng vấn thương hiệu riêng.',
    time: '25 phút trước', badge: { text: 'Thanh toán thành công', cls: 'bg-surface-mid text-primary' },
  },
  {
    icon: 'person_add', tile: 'bg-surface-mid text-ink',
    title: <>Người dùng mới <span>Lê Hoàng Nam</span> đăng ký tài khoản Ứng viên</>,
    desc: 'Xác thực danh tính qua GitHub SSO • Đã tải lên CV định dạng PDF (Data Analyst).',
    time: '38 phút trước', badge: { text: 'Đã xác thực', cls: 'bg-surface-low text-ink-variant' },
  },
  {
    icon: 'cloud_sync', tile: 'bg-surface-highest text-[#004598]',
    title: <>Tải trọng AI Audio Transcriber Node-03 tăng đạt ngưỡng 85%</>,
    desc: 'Kubernetes Auto-scaler đã tự động kích hoạt thêm 02 pod phụ trợ trên cụm máy chủ Singapore.',
    time: '1 giờ trước', badge: { text: 'Tự cân bằng tải', cls: 'bg-success-bg text-success-text' },
  },
];

const MODERATION_QUEUE = [
  {
    initials: 'TK', tone: 'text-primary', title: 'Lead Product Manager',
    meta: 'Tiki Corp • Gửi 15 phút trước', badge: { text: 'Mới', cls: 'bg-secondary-fixed text-ink' },
    salary: '75 - 105 triệu VNĐ', location: 'TP. Hồ Chí Minh',
    tag: { icon: 'verified', text: 'Khớp 98% AI', cls: 'bg-success-bg text-success-text' },
  },
  {
    initials: 'FPT', tone: 'text-success-text', title: 'AI/ML Engineer (LLM Fine-tuning)',
    meta: 'FPT Software • Gửi 45 phút trước', badge: { text: 'Ưu tiên', cls: 'bg-info text-info-text' },
    salary: '45 - 65 triệu VNĐ', location: 'Hà Nội (Hybrid)',
    tag: { icon: 'security', text: 'Đã quét an toàn', cls: 'bg-success-bg text-success-text' },
  },
  {
    initials: 'SP', tone: 'text-[#005cc6]', title: 'Chuyên viên Tuyển dụng IT (Tech Recruiter)',
    meta: 'Shopee Vietnam • Gửi 2 giờ trước', badge: { text: 'Tiêu chuẩn', cls: 'bg-surface-high text-ink-variant' },
    salary: '20 - 32 triệu VNĐ', location: 'TP. Hồ Chí Minh',
    tag: { icon: 'history', text: '3 vòng PV', cls: 'bg-surface-high text-ink-variant' },
  },
];

const AdminDashboardPage: React.FC = () => (
  <div className="flex flex-col gap-4">
    {/* Command bar */}
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-label-md text-ink-variant">
          <span>System administration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-primary">Overview dashboard</span>
        </div>
        <h1 className="m-0 text-headline-lg font-bold tracking-tight text-ink">System Administration Overview</h1>
        <p className="m-0 max-w-3xl text-body-md text-ink-variant">
          Monitor operational performance, user growth metrics and AI interview activity in real time.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-md bg-surface-mid p-1 shadow-inner">
          {TIME_PILLS.map((t, i) => (
            <button
              key={t}
              type="button"
              className={
                i === 2
                  ? 'inline-flex items-center gap-1 rounded px-3 py-1.5 text-label-md font-bold text-primary shadow-sm transition-colors bg-card'
                  : 'inline-flex items-center gap-1 rounded px-3 py-1.5 text-label-md text-ink-variant transition-colors hover:text-ink'
              }
            >
              {t === 'Custom' && <span className="material-symbols-outlined text-[16px]">calendar_today</span>}
              {t}
            </button>
          ))}
        </div>
        <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-card px-4 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">
          <span className="material-symbols-outlined text-[18px] text-ink-variant">download</span>
          Export report
        </button>
        <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-card px-4 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">
          <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
          Configure AI prompt
        </button>
        <Link to="/admin/job-approvals" className="relative inline-flex h-10 items-center gap-1.5 rounded-md bg-primary-container px-4 text-label-md font-medium text-on-primary shadow-md transition-opacity hover:opacity-95">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          Moderate JD now
          <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-white">7</span>
        </Link>
      </div>
    </div>

    {/* KPI row */}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {/* Users */}
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-md uppercase tracking-wider text-ink-variant">Total users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info text-primary">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-metric-stat font-bold tracking-tight text-ink">12,845</span>
            <span className="inline-flex items-center text-label-md font-bold text-success-text">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>+14.2%
            </span>
          </div>
          <p className="m-0 mt-1 text-body-sm text-ink-variant">So với tháng trước</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 rounded-md bg-surface-low p-2 pt-2">
          <span className="rounded bg-card px-2 py-0.5 text-label-sm text-ink-variant"><strong className="text-ink">9,230</strong> Ứng viên</span>
          <span className="rounded bg-card px-2 py-0.5 text-label-sm text-ink-variant"><strong className="text-ink">3,150</strong> Doanh nghiệp</span>
          <span className="rounded bg-card px-2 py-0.5 text-label-sm text-ink-variant"><strong className="text-ink">465</strong> Mod/Admin</span>
        </div>
      </div>
      {/* JDs */}
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-md uppercase tracking-wider text-ink-variant">Total job postings (JD)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success-bg text-success-text">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-metric-stat font-bold tracking-tight text-ink">1,428</span>
            <span className="inline-flex items-center text-label-md font-bold text-success-text">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>+8.6%
            </span>
          </div>
          <p className="m-0 mt-1 text-body-sm text-ink-variant">112 tin mới trong tuần này</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 rounded-md bg-surface-low p-2 pt-2">
          <span className="rounded bg-card px-2 py-0.5 text-label-sm text-ink-variant"><strong className="text-success-text">1,180</strong> Mở tuyển</span>
          <span className="rounded bg-card px-2 py-0.5 text-label-sm text-ink-variant"><strong className="text-ink-variant">185</strong> Đã đóng</span>
          <span className="inline-flex items-center gap-1 rounded bg-danger-bg px-2 py-0.5 text-label-sm font-bold text-danger-text">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
            63 chờ (7 gấp)
          </span>
        </div>
      </div>
      {/* AI interviews */}
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-md uppercase tracking-wider text-ink-variant">AI interview sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-high text-primary">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-metric-stat font-bold tracking-tight text-ink">48,920</span>
            <span className="inline-flex items-center text-label-md font-bold text-success-text">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>+22.5%
            </span>
          </div>
          <p className="m-0 mt-1 text-body-sm text-ink-variant">3,410 lượt trong 7 ngày gần nhất</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-surface-low p-2">
          <div className="flex flex-col">
            <span className="text-label-sm text-ink-variant">Tỷ lệ xong</span>
            <span className="text-label-md font-bold text-primary">94.8%</span>
          </div>
          <div className="h-6 w-px bg-surface-highest" />
          <div className="flex flex-col">
            <span className="text-label-sm text-ink-variant">Điểm TB</span>
            <span className="text-label-md font-bold text-success-text">78.4 / 100</span>
          </div>
          <div className="h-6 w-px bg-surface-highest" />
          <div className="flex flex-col">
            <span className="text-label-sm text-ink-variant">Thời lượng</span>
            <span className="text-label-md font-bold text-ink">24m 18s</span>
          </div>
        </div>
      </div>
      {/* System resources */}
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-label-md font-semibold uppercase tracking-wider text-ink-variant">AI &amp; system resources</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-mid text-ink">
              <span className="material-symbols-outlined text-[20px]">dns</span>
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-metric-stat font-bold tracking-tight text-success-text">99.98%</span>
            <span className="text-label-sm font-medium text-ink-variant">Uptime SLA</span>
          </div>
          <div className="flex items-center gap-1.5 text-body-sm text-ink-variant">
            <span className="material-symbols-outlined text-[16px] text-success-text">speed</span>
            <span>AI LLM latency: <strong className="font-semibold text-ink">320ms</strong></span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 rounded-md bg-surface-low p-2 pt-1.5">
          <div className="flex items-center justify-between text-label-sm">
            <span className="text-ink-variant">Token chi tiêu tháng</span>
            <span className="font-bold text-ink">1,240 / 2,500</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-mid">
            <div className="h-full w-[49.6%] rounded-full bg-primary-container" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-variant">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />14 phòng đang live
            </span>
            <span className="font-semibold text-primary">49.6% ngân sách</span>
          </div>
        </div>
      </div>
    </div>

    {/* Middle: chart + donut */}
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-8">
        <div className="flex flex-col rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b-0 pb-3 sm:flex-row sm:items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <h2 className="m-0 text-headline-sm font-bold text-ink">AI interview frequency &amp; trends</h2>
              </div>
              <p className="m-0 pl-4 text-body-sm text-ink-variant">
                Biểu đồ đối sánh số lượt ứng viên tự luyện tập và phỏng vấn chính thức theo ủy quyền doanh nghiệp
              </p>
            </div>
            <div className="inline-flex self-start rounded-md bg-surface-low p-1 sm:self-auto">
              {['Theo tuần', '12 tháng qua', 'Theo giờ trong ngày'].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  className={
                    i === 1
                      ? 'rounded px-2.5 py-1 text-label-sm font-bold text-primary shadow-sm transition-colors bg-card'
                      : 'rounded px-2.5 py-1 text-label-sm text-ink-variant transition-colors hover:text-ink'
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-low px-3 py-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-label-sm text-ink">
                <span className="h-3 w-3 rounded-sm bg-primary-container" />
                Mock Interview (Ứng viên tự luyện)
              </span>
              <span className="inline-flex items-center gap-2 text-label-sm text-ink">
                <span className="h-3 w-3 rounded-sm bg-secondary" />
                Formal Interview (Doanh nghiệp giao đề)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-label-sm text-ink">
              <span className="text-ink-variant">Tăng trưởng năm:</span>
              <strong className="font-bold text-success-text">+34.8% YOY</strong>
            </span>
          </div>
          <div className="relative h-72 w-full">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 220">
              <defs>
                <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006b5f" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#006b5f" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {[10, 60, 110, 160].map(y => (
                <line key={y} opacity="0.6" stroke="#dae2fd" strokeDasharray="3 3" x1="0" x2="760" y1={y} y2={y} />
              ))}
              <line opacity="0.9" stroke="#dae2fd" x1="0" x2="760" y1="205" y2="205" />
              <path d="M 0,170 C 65,160 110,140 180,120 C 250,100 310,130 380,85 C 450,40 520,70 600,45 C 670,25 710,35 760,18 L 760,205 L 0,205 Z" fill="url(#primaryAreaGrad)" />
              <path d="M 0,195 C 65,190 110,180 180,165 C 250,150 310,160 380,135 C 450,110 520,125 600,105 C 670,90 710,95 760,80 L 760,205 L 0,205 Z" fill="url(#secondaryAreaGrad)" />
              <path d="M 0,195 C 65,190 110,180 180,165 C 250,150 310,160 380,135 C 450,110 520,125 600,105 C 670,90 710,95 760,80" fill="none" stroke="#006b5f" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M 0,170 C 65,160 110,140 180,120 C 250,100 310,130 380,85 C 450,40 520,70 600,45 C 670,25 710,35 760,18" fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="3" />
              <circle cx="180" cy="120" fill="#4f46e5" r="4.5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="380" cy="85" fill="#4f46e5" r="4.5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="600" cy="45" fill="#4f46e5" r="5" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="760" cy="18" fill="#4f46e5" r="5" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="600" cy="105" fill="#006b5f" r="4" stroke="#ffffff" strokeWidth="2" />
              <circle cx="760" cy="80" fill="#006b5f" r="4" stroke="#ffffff" strokeWidth="2" />
              <line opacity="0.5" stroke="#4f46e5" strokeDasharray="4 4" strokeWidth="1.5" x1="600" x2="600" y1="20" y2="205" />
            </svg>
            {/* Tooltip anchored on T11 */}
            <div className="pointer-events-none absolute left-[72%] top-4 z-10 flex w-48 -translate-x-1/2 flex-col gap-1 rounded-md bg-[#283044] p-2 text-[#eef0ff] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c3c0ff]">Tháng 11 / 2026</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-white">+28%</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-primary-container" />Lượt phỏng vấn:
                </span>
                <span className="font-bold text-white">8,960 lượt</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-300">
                <span>Tự luyện: 6,850</span>
                <span>Giao đề: 2,110</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 text-label-sm text-ink-variant">
            {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'].map(t => <span key={t}>{t}</span>)}
            <span className="font-semibold text-ink">T10</span>
            <span className="font-bold text-primary">T11 (Đỉnh)</span>
            <span className="font-semibold text-ink">T12</span>
          </div>
        </div>

        {/* Violation warning banner */}
        <div className="flex items-start justify-between gap-3 rounded-xl bg-surface-high p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger-bg text-danger-text">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-headline-sm font-bold text-ink">JD policy violation moderation alert</h3>
                <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">2 tin bị cắm cờ</span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">
                Hệ thống AI tự động phát hiện 2 tin tuyển dụng chứa từ khóa phân biệt tuổi tác và yêu cầu ký quỹ trái quy định tuyển dụng.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-center">
            <button type="button" className="rounded-md bg-card px-3.5 py-2 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">
              Bỏ qua
            </button>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-error px-3.5 py-2 text-label-md font-semibold text-white shadow-sm transition-opacity hover:opacity-90">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              Xử lý vi phạm
            </button>
          </div>
        </div>
      </div>

      {/* Donut */}
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm lg:col-span-4">
        <div>
          <div className="flex items-center justify-between pb-1">
            <h2 className="m-0 text-headline-sm font-bold text-ink">User distribution</h2>
            <span className="material-symbols-outlined text-[20px] text-ink-variant">pie_chart</span>
          </div>
          <p className="m-0 text-body-sm text-ink-variant">Tỷ trọng tài khoản kích hoạt theo vai trò</p>
          <div className="relative mx-auto my-4 flex h-56 w-56 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#eaedff" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#4f46e5" strokeDasharray="171.9 238.76" strokeDashoffset="0" strokeLinecap="round" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#006b5f" strokeDasharray="47.75 238.76" strokeDashoffset="-173" strokeLinecap="round" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#005cc6" strokeDasharray="14.32 238.76" strokeDashoffset="-222" strokeLinecap="round" strokeWidth="12" />
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#777587" strokeDasharray="4.77 238.76" strokeDashoffset="-237" strokeLinecap="round" strokeWidth="12" />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-ink-variant">Tổng cộng</span>
              <span className="text-headline-lg font-bold tracking-tight text-ink">12,845</span>
              <span className="text-[11px] font-bold text-success-text">Người dùng</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {[
              { dot: 'bg-primary-container', label: 'Ứng viên (Candidates)', count: '9,230 tài khoản', pct: '72%', pctCls: 'text-primary' },
              { dot: 'bg-secondary', label: 'Nhà tuyển dụng (HR/Recruiter)', count: '2,560 doanh nghiệp', pct: '20%', pctCls: 'text-success-text' },
              { dot: 'bg-[#005cc6]', label: 'Mentor & Cố vấn chuyên môn', count: '770 chuyên gia', pct: '6%', pctCls: 'text-[#005cc6]' },
              { dot: 'bg-outline-strong', label: 'Quản trị viên & Điều phối', count: '285 nhân sự nội bộ', pct: '2%', pctCls: 'text-ink-variant' },
            ].map(l => (
              <div key={l.label} className="flex items-center justify-between rounded-md bg-surface-low p-2 transition-colors hover:bg-surface-mid">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${l.dot}`} />
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">{l.label}</span>
                    <span className="text-[11px] text-ink-variant">{l.count}</span>
                  </div>
                </div>
                <span className={`text-label-md font-bold ${l.pctCls}`}>{l.pct}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 border-t border-surface-low pt-2">
          <Link to="/admin/users" className="inline-flex w-full items-center justify-center gap-1 rounded-md py-2 text-label-md font-semibold text-primary transition-colors hover:bg-surface-mid">
            Xem phân tích danh sách chi tiết
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>

    {/* Bottom: activity log + moderation queue */}
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm lg:col-span-7">
        <div>
          <div className="flex flex-col justify-between gap-2 pb-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">history</span>
              <h2 className="m-0 text-headline-sm font-bold text-ink">System activity log</h2>
            </div>
            <span className="rounded-full bg-surface-high px-2 py-0.5 text-label-sm font-semibold text-ink-variant">
              Thời gian thực (Live WebSocket)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 py-2">
            {ACTIVITY_FILTERS.map((f, i) => (
              <button
                key={f}
                type="button"
                className={
                  i === 0
                    ? 'rounded-full bg-primary-container px-3 py-1 text-label-sm font-bold text-on-primary shadow-sm'
                    : 'rounded-full bg-surface-mid px-3 py-1 text-label-sm text-ink-variant transition-colors hover:text-ink'
                }
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-3">
            {ACTIVITY_LOGS.map(l => (
              <div key={l.time} className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-surface-low">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${l.tile}`}>
                  <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 truncate text-label-md font-semibold text-ink">{l.title}</p>
                    <span className="shrink-0 text-[11px] text-ink-variant">{l.time}</span>
                  </div>
                  <p className="m-0 mt-0.5 line-clamp-1 text-body-sm text-ink-variant">{l.desc}</p>
                </div>
                <span className={`shrink-0 self-center rounded-full px-2 py-0.5 text-[11px] font-bold ${l.badge.cls}`}>{l.badge.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-surface-low pt-2">
          <Link to="/admin/users" className="flex w-full items-center justify-center gap-1 rounded-md bg-surface-mid py-2.5 text-label-md font-semibold text-ink transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Xem toàn bộ nhật ký kiểm toán (System Audit Log)
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-sm lg:col-span-5">
        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-info text-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
              <div className="flex flex-col">
                <h2 className="m-0 text-headline-sm font-bold leading-tight text-ink">JD moderation queue</h2>
                <span className="text-[11px] font-medium text-ink-variant">Cần phê duyệt trước khi công khai</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-label-sm font-bold text-success-text shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              7 tin chờ
            </span>
          </div>
          <p className="m-0 mb-3 mt-1.5 text-body-sm text-ink-variant">
            Tin tuyển dụng được AI tiền kiểm tự động, cần quản trị viên đối soát lần cuối.
          </p>
          <div className="flex flex-col gap-2">
            {MODERATION_QUEUE.map(q => (
              <div key={q.title} className="flex flex-col gap-2.5 rounded-xl border border-outline/40 bg-surface-low p-3 shadow-sm transition-colors hover:border-outline-strong">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-outline/40 bg-card text-[14px] font-bold shadow-sm ${q.tone}`}>
                      {q.initials}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <h4 className="m-0 truncate text-label-md font-bold leading-snug text-ink">{q.title}</h4>
                      <span className="truncate text-[11px] text-ink-variant">{q.meta}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${q.badge.cls}`}>{q.badge.text}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5 text-[12px] text-ink-variant">
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <span className="material-symbols-outlined text-[15px] text-primary">payments</span> {q.salary}
                  </span>
                  <span className="text-outline">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-ink-variant">location_on</span> {q.location}
                  </span>
                  <span className="text-outline">•</span>
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${q.tag.cls}`}>
                    <span className="material-symbols-outlined text-[13px]">{q.tag.icon}</span> {q.tag.text}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between border-t border-outline/40 pt-2">
                  <Link to="/admin/job-approvals" className="inline-flex items-center gap-1 rounded px-1 py-1 text-label-sm font-semibold text-primary transition-colors hover:text-primary-container">
                    Xem chi tiết
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-md border border-outline bg-card px-3 py-1.5 text-label-sm font-semibold text-error transition-colors hover:bg-danger-bg hover:text-danger-text">
                      Từ chối
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 rounded-md bg-primary-container px-3.5 py-1.5 text-label-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-95">
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      Duyệt nhanh
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-surface-low pt-2">
          <Link to="/admin/job-approvals" className="flex w-full items-center justify-center gap-1 rounded-md border border-success-text/30 bg-surface-low py-2.5 text-label-md font-bold text-success-text shadow-sm transition-colors hover:bg-success-bg">
            Mở toàn bộ trang Kiểm duyệt JD (Còn 7 tin)
            <span className="material-symbols-outlined text-[18px] text-secondary">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboardPage;
