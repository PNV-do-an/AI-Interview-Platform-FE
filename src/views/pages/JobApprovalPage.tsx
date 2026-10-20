import React, { useState } from 'react';

/**
 * STATIC mockup page — JD moderation queue (Stitch screen_18 "kiểm duyệt tin tuyển dụng").
 * BE chưa có endpoint kiểm duyệt JD (JobController chỉ có CRUD + suggestions) nên trang dựng
 * tĩnh đúng convention: giữ nguyên số liệu/demo data tiếng Việt từ mockup, chrome tiếng Anh,
 * không gọi API, không gắn sidebar.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #fffbeb/#92400e/#78350f
 * amber-50/800/900 (chip điểm và panel cảnh báo), #f59e0b amber-500 (dot chờ review lại),
 * #ffedd5/#c2410c orange-100/700 (avatar nhà tuyển dụng), #e11d48/#be123c rose-600/700 (nút từ chối).
 */

interface QueueItem {
  code: string;
  company: string;
  initials: string;
  verified: boolean;
  unverified?: boolean;
  time: string;
  title: string;
  salary: string;
  location?: string;
  score: number;
  tag?: { text: string; tone: 'success' | 'warning' | 'danger' | 'info' };
}

const QUEUE: QueueItem[] = [
  {
    code: '#JD-2025-084F', company: 'VNG Tech Corp', initials: 'VNG', verified: true,
    time: '15 phút trước', title: 'Senior Fullstack Engineer (React & Node.js)',
    salary: '35 - 55 Tr', location: 'TP. HCM (Hybrid)', score: 98,
    tag: { text: 'Under review', tone: 'success' },
  },
  {
    code: '#JD-2025-083E', company: 'Techcom Securities', initials: 'TCB', verified: true,
    time: '42 phút trước', title: 'Data Science Lead & AI Architect',
    salary: 'Thoả thuận (Chưa công khai)', score: 62,
    tag: { text: 'Salary range warning', tone: 'warning' },
  },
  {
    code: '#JD-2025-081B', company: 'Shopee VN', initials: 'SHP', verified: true,
    time: '1 giờ trước', title: 'Product Growth Manager (FinTech)',
    salary: '40 - 65 Tr', location: 'Hà Nội', score: 94,
    tag: { text: 'VIP customer', tone: 'info' },
  },
  {
    code: '#JD-2025-079A', company: 'Startup X Corp', initials: 'STX', verified: false, unverified: true,
    time: '2 giờ trước', title: 'Intern UI/UX Designer & Content',
    salary: '2 - 4 Tr', location: 'Từ xa (Remote)', score: 45,
    tag: { text: 'Spam suspected', tone: 'danger' },
  },
];

const SCORE_PILL = (score: number): string => {
  if (score >= 80) return 'bg-success-bg text-success-text';
  if (score >= 60) return 'bg-[#fffbeb] text-[#92400e]';
  return 'bg-danger-bg text-danger-text';
};

const TAG_CLASS: Record<string, string> = {
  success: 'bg-success-bg text-success-text',
  warning: 'bg-[#fffbeb] text-[#92400e]',
  danger: 'bg-danger-bg text-danger-text',
  info: 'bg-success-bg text-success-text',
};

const FILTER_CHIPS = [
  { label: 'All pending', count: '14', active: true },
  { label: 'Needs AI re-review', count: '(3)', dot: 'bg-[#f59e0b]' },
  { label: 'Urgent / VIP', count: '(5)', dot: 'bg-secondary' },
  { label: 'Approved today', count: '(28)' },
  { label: 'Rejected', count: '(4)' },
];

const AI_CHECKS = [
  { icon: 'check_circle', tone: 'ok', title: 'Ngôn từ hòa nhập & bình đẳng', desc: 'Không phát hiện từ ngữ phân biệt giới tính, tuổi tác, vùng miền hoặc tôn giáo.' },
  { icon: 'check_circle', tone: 'ok', title: 'Minh bạch dải lương', desc: 'Mức lương 35,000,000 - 55,000,000 VNĐ nằm trong khung chuẩn năng lực Senior.' },
  { icon: 'check_circle', tone: 'ok', title: 'Độ tương thích Taxonomy kỹ năng', desc: '100% kỹ năng (React, Node.js, Next.js, Docker, PostgreSQL) đã được chuẩn hóa.' },
  { icon: 'info', tone: 'warn', title: 'Lưu ý mô hình làm việc', desc: 'Ghi "Linh hoạt Hybrid" - Cần đảm bảo có chỉ định địa chỉ văn phòng thực cho ngày On-site.' },
];

const GENERAL_INFO: [string, string][] = [
  ['Salary', '35 - 55 Tr VNĐ'],
  ['Work type', 'Toàn thời gian'],
  ['Level', 'Senior Level'],
  ['Experience', 'Từ 4 năm'],
  ['Openings', '03 vị trí'],
  ['Application deadline', '30/04/2025'],
];

const JD_SECTIONS = [
  {
    icon: 'assignment', title: 'Job Description', dot: 'bg-primary',
    items: [
      'Chủ trì thiết kế kiến trúc và phát triển hệ thống module micro-frontends quy mô lớn ứng dụng ReactJS, TypeScript và Next.js Framework.',
      'Tối ưu hóa hiệu năng render phía client (SSR/SSG), xây dựng CI/CD tự động và bảo trì hạ tầng backend RESTful / GraphQL APIs xây dựng trên NodeJS (NestJS/Express).',
      'Hợp tác chặt chẽ cùng đội ngũ AI/ML để tích hợp các microservices phân tích giọng nói và luồng video thời gian thực phục vụ phòng phỏng vấn trực tuyến.',
      'Thực hiện Code Review, cố vấn kỹ thuật và định hướng nâng cao năng lực cho các kỹ sư Junior & Mid-level trong squad.',
    ],
  },
  {
    icon: 'manage_accounts', title: 'Requirements', dot: 'bg-primary',
    items: [
      'Có tối thiểu 4 năm kinh nghiệm làm việc thực chiến ở vị trí Fullstack Developer hoặc Frontend Lead.',
      'Thành thạo chuyên sâu hệ sinh thái JavaScript/TypeScript: React 18+, Next.js 14, NodeJS, State Management (Zustand/Redux Toolkit).',
      'Kinh nghiệm thiết kế Database Schema và tối ưu Query với PostgreSQL, Redis Caching, Docker containerization.',
      'Khả năng đọc hiểu tài liệu chuyên sâu và giao tiếp kỹ thuật bằng Tiếng Anh lưu loát (tương đương TOEIC 750+ hoặc IELTS 6.5+).',
    ],
  },
  {
    icon: 'card_giftcard', title: 'Benefits', dot: 'bg-secondary',
    items: [
      'Thu nhập cạnh tranh: Lương cứng lên tới 55 triệu + Lương tháng 13 cam kết + Thưởng KPI dự án từ 1 đến 3 tháng lương.',
      'Gói bảo hiểm sức khỏe VIP toàn diện PVI dành riêng cho nhân viên và người thân phụ thuộc.',
      'Cấp mới MacBook Pro M3 Max khi tiếp nhận công việc; ngân sách tài trợ thi chứng chỉ công nghệ 25.000.000 VNĐ/năm.',
      'Chế độ làm việc linh hoạt Hybrid (2 ngày làm từ xa / tuần); văn phòng tiêu chuẩn 5 sao với pantry không giới hạn.',
    ],
  },
];

const SKILL_CHIPS = ['React.js', 'Node.js', 'Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'Microservices'];

const REJECT_REASONS = [
  'Lương không rõ ràng hoặc vi phạm quy định công khai mức lương theo chuẩn sàn.',
  'Yêu cầu chứa yếu tố phân biệt đối xử (giới tính, độ tuổi, hình thức bên ngoài không hợp lý).',
  'Nghi vấn trùng lặp nội dung với tin tuyển dụng khác vừa đăng gần đây.',
  'Thông tin pháp lý công ty không khớp với giấy phép đăng ký kinh doanh.',
];

const REJECT_NOTE =
  'Vui lòng làm rõ địa chỉ trụ sở văn phòng làm việc cụ thể tại TP.HCM đối với chế độ làm việc Hybrid và chuẩn hóa lại danh sách các hạng mục phúc lợi theo chuẩn quy định chung của hệ thống trước khi gửi duyệt lại.';

const JobApprovalPage: React.FC = () => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const selected = QUEUE[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Top command bar: breadcrumb + report/bulk actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-label-md text-ink-variant">
            <span>Content moderation</span>
            <span className="material-symbols-outlined text-[16px] text-outline-strong">chevron_right</span>
            <span className="font-semibold text-primary">JD Moderation</span>
            <span className="ml-1 rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-semibold text-success-text">
              14 pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface-low px-3 text-label-md font-medium text-ink transition-colors hover:bg-surface-mid">
              <span className="material-symbols-outlined text-[18px] text-outline-strong">file_download</span>
              Export violations report
            </button>
            <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary-container px-3 text-label-md font-medium text-on-primary shadow-sm transition-colors hover:bg-primary">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              Bulk approve (3)
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h1 className="m-0 text-headline-lg text-ink">Job Posting Moderation Queue</h1>
            <p className="m-0 mt-0.5 text-body-sm text-ink-variant">
              The AI system automatically analyzes and audits job postings against labor standards rules
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CHIPS.map(c => (
              <button
                key={c.label}
                type="button"
                className={
                  c.active
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1.5 text-label-sm font-medium text-on-primary shadow-sm'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-surface-low px-2.5 py-1.5 text-label-sm font-medium text-ink-variant transition-colors hover:bg-surface-mid hover:text-ink'
                }
              >
                {c.dot && <span className={`h-2 w-2 rounded-full ${c.dot}`} />}
                <span>{c.label}</span>
                <span className={c.active ? 'rounded-full bg-info px-1.5 py-0.5 text-[10px] font-bold text-info-text' : ''}>
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 items-start gap-4">
        {/* LEFT: queue list */}
        <div className="col-span-12 flex flex-col gap-3 lg:col-span-4">
          <div className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-card p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-outline-strong">search</span>
              <input
                type="text"
                placeholder="Search by JD title, posting ID, company name..."
                className="h-9 w-full rounded-md bg-surface-low pl-9 pr-2 text-body-sm text-ink shadow-inner placeholder:text-outline-strong focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <select className="h-8 cursor-pointer rounded-md bg-surface-low px-2 text-label-sm text-ink focus:outline-none">
                <option>Tất cả ngành nghề</option>
                <option>Công nghệ thông tin</option>
                <option>Tài chính - Ngân hàng</option>
                <option>Marketing - Truyền thông</option>
              </select>
              <select className="h-8 cursor-pointer rounded-md bg-surface-low px-2 text-label-sm text-ink focus:outline-none">
                <option>Earliest submitted</option>
                <option>Most recent</option>
                <option>Trust score (high to low)</option>
                <option>AI Safety (low to high)</option>
              </select>
            </div>
          </div>

          <div className="flex max-h-[calc(100vh-320px)] flex-col gap-2 overflow-y-auto pr-1">
            {QUEUE.map((q, i) => (
              <div
                key={q.code}
                className={
                  i === 0
                    ? 'relative cursor-pointer overflow-hidden rounded-xl bg-card p-3 shadow-md ring-2 ring-primary'
                    : 'relative cursor-pointer overflow-hidden rounded-xl bg-card p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md'
                }
              >
                {i === 0 && <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary" />}
                <div className={`mb-1 flex items-start justify-between gap-1 ${i === 0 ? 'pl-1' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <div className={
                      q.unverified
                        ? 'flex h-7 w-7 items-center justify-center rounded-md bg-danger-bg text-xs font-bold text-danger-text'
                        : i === 2
                          ? 'flex h-7 w-7 items-center justify-center rounded-md bg-[#ffedd5] text-xs font-bold text-[#c2410c]'
                          : 'flex h-7 w-7 items-center justify-center rounded-md bg-info text-xs font-bold text-info-text'
                    }>
                      {q.initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="max-w-[150px] truncate text-label-md font-semibold text-ink">{q.company}</span>
                        {q.verified && <span className="material-symbols-outlined text-[15px] text-secondary" title="Verified employer">verified</span>}
                        {q.unverified && (
                          <span className="rounded bg-danger-bg px-1.5 py-0.5 text-[9px] font-bold text-danger-text">Chưa xác minh</span>
                        )}
                      </div>
                      <span className="text-[10px] text-label-sm text-ink-variant">{q.time}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-semibold ${SCORE_PILL(q.score)}`}>
                    <span className="material-symbols-outlined text-[13px]">{q.score >= 60 ? 'format_image_left' : 'report'}</span>
                    {q.score}/100
                  </span>
                </div>
                <h3 className={`line-clamp-1 text-headline-sm font-semibold text-ink ${i === 0 ? 'pl-1' : ''}`}>{q.title}</h3>
                <div className={`mt-1 flex items-center gap-2 text-body-sm text-ink-variant ${i === 0 ? 'pl-1' : ''}`}>
                  {q.score >= 80 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      {q.salary}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      {q.salary}
                    </span>
                  )}
                  {q.location && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                        {q.location}
                      </span>
                    </>
                  )}
                </div>
                <div className={`mt-2 flex items-center justify-between pt-1 ${i === 0 ? 'pl-1' : ''}`}>
                  <span className={i === 0 ? 'rounded bg-info px-2 py-0.5 text-label-sm font-medium text-info-text' : 'text-label-sm text-outline-strong'}>
                    {q.code}
                  </span>
                  {q.tag && <span className={`rounded px-2 py-0.5 text-label-sm font-medium ${TAG_CLASS[q.tag.tone]}`}>{q.tag.text}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: detail inspector */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          {/* Sticky action header + employer snapshot */}
          <div className="sticky top-16 z-20 flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-md">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="rounded bg-info px-2 py-0.5 text-label-sm font-bold text-info-text">{selected.code}</span>
                  <span className="text-label-sm text-ink-variant">Submitted for review: 10:24 AM - Today</span>
                </div>
                <h2 className="m-0 text-headline-lg font-bold text-ink">{selected.title}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-danger-bg px-3 text-label-md font-semibold text-danger-text transition-colors hover:brightness-95"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Reject
                </button>
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#fffbeb] px-3 text-label-md font-semibold text-[#92400e] transition-colors hover:brightness-95">
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  Request edits
                </button>
                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md bg-success-text px-3 text-label-md font-bold text-white shadow-md transition-colors hover:brightness-110">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Approve now
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-low p-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-headline-sm font-bold text-on-primary">VNG</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-label-md font-bold text-ink">VNG Tech Corporation</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-semibold text-success-text">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Enterprise Tier
                    </span>
                  </div>
                  <span className="text-body-sm text-ink-variant">Tài khoản chính thức • Trụ sở Campus Tân Thuận, Quận 7, TP.HCM</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="text-label-sm uppercase text-ink-variant">Employer trust score</span>
                  <span className="text-headline-sm font-bold text-success-text">99 / 100</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-label-sm uppercase text-ink-variant">Posting history</span>
                  <span className="text-headline-sm font-semibold text-ink">42 tin / 0 vi phạm</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI pre-screening panel */}
          <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-bg text-success-text">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div>
                  <h3 className="m-0 text-headline-sm font-bold text-ink">AI Pre-screening &amp; Compliance Check</h3>
                  <p className="m-0 text-body-sm text-ink-variant">
                    Checks policy violations, discrimination and JD parameter authenticity
                  </p>
                </div>
              </div>
              <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5 text-success-text">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="text-label-md font-bold">Safety score: 96/100 (High standard)</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-2">
              {AI_CHECKS.map(c => (
                <div
                  key={c.title}
                  className={c.tone === 'ok' ? 'flex items-start gap-1.5 rounded-lg bg-surface-low p-2' : 'flex items-start gap-1.5 rounded-lg bg-[#fffbeb] p-2'}
                >
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 text-[20px] ${c.tone === 'ok' ? 'text-success-text' : 'text-[#92400e]'}`}>
                    {c.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-label-md font-semibold ${c.tone === 'ok' ? 'text-ink' : 'text-[#78350f]'}`}>{c.title}</span>
                    <span className={`text-body-sm ${c.tone === 'ok' ? 'text-ink-variant' : 'text-[#92400e]'}`}>{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-info/50 p-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
                <span className="text-body-sm font-medium text-ink">Recommended automated AI interview question set:</span>
                <span className="text-label-md font-bold text-primary">"Fullstack Technical Suite v3.4 (Next.js &amp; Microservices)"</span>
              </div>
              <button type="button" className="inline-flex shrink-0 items-center gap-1 text-label-sm font-semibold text-primary hover:underline">
                View sample questions
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* JD content inspection */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-1.5">
              <h4 className="m-0 text-label-md uppercase tracking-wider text-ink-variant">General information</h4>
              <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3 lg:grid-cols-6">
                {GENERAL_INFO.map(([k, v]) => (
                  <div key={k} className="flex flex-col rounded-md bg-surface-low p-1.5">
                    <span className="text-label-sm text-ink-variant">{k}</span>
                    <span className={k === 'Salary' ? 'text-label-md font-bold text-primary' : 'text-label-md font-semibold text-ink'}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {JD_SECTIONS.map(sec => (
              <div key={sec.title} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-ink">
                  <span className={`material-symbols-outlined text-[20px] ${sec.icon === 'card_giftcard' ? 'text-secondary' : 'text-primary'}`}>{sec.icon}</span>
                  <h4 className="m-0 text-headline-sm font-bold">{sec.title}</h4>
                </div>
                <div className="space-y-1 pl-7">
                  {sec.items.map(it => (
                    <div key={it} className="flex items-start gap-2">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${sec.dot}`} />
                      <span className="text-body-md leading-relaxed text-ink">{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-label-sm uppercase tracking-wider text-ink-variant">Tagged core skills</span>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_CHIPS.map((s, i) => (
                  <span
                    key={s}
                    className={
                      i < 4
                        ? 'rounded-full bg-info px-3 py-1 text-label-md text-info-text'
                        : 'rounded-full bg-surface-high px-3 py-1 text-label-md text-ink'
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-surface-low px-6 py-3">
              <div className="flex items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-bg text-danger-text">
                  <span className="material-symbols-outlined text-[20px]">block</span>
                </div>
                <div>
                  <h3 className="m-0 text-headline-sm font-bold text-ink">Reject job posting approval</h3>
                  <span className="text-label-sm text-ink-variant">Posting ID: {selected.code} • {selected.company}</span>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setRejectOpen(false)}
                className="rounded-md p-1 text-outline-strong transition-colors hover:bg-surface-mid hover:text-ink">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fffbeb] px-6 py-2 text-[#92400e]">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span className="text-body-sm">
                This notification will be sent with a detailed explanation email directly to the employer to support revisions.
              </span>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-6">
              <div>
                <label className="mb-1 block text-label-md font-semibold text-ink">Select non-compliant reasons:</label>
                <div className="space-y-1 text-body-md text-ink">
                  {REJECT_REASONS.map(r => (
                    <label key={r} className="flex cursor-pointer items-center gap-1.5 rounded-md p-2 transition-colors hover:bg-surface-low">
                      <input type="checkbox" className="h-4 w-4 rounded accent-primary" />
                      <span>{r}</span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-low p-2">
                    <input type="checkbox" checked readOnly className="h-4 w-4 rounded accent-primary" />
                    <span className="font-semibold text-primary">Lý do khác / Cần bổ sung và làm rõ nội dung cụ thể (Đã chọn)</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-semibold text-ink">Rejection details &amp; adjustment guidance for the employer:</label>
                <textarea
                  rows={4}
                  defaultValue={REJECT_NOTE}
                  placeholder="Enter detailed reasons to help the hiring partner revise the posting..."
                  className="w-full rounded-md bg-surface-low p-2 text-body-sm leading-relaxed text-ink shadow-inner focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-right text-label-sm text-ink-variant">186/500 characters</span>
              </div>
              <div className="pt-1">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked readOnly className="h-4 w-4 rounded accent-primary" />
                  <span className="text-body-sm text-ink">
                    Allow the employer to edit and resubmit immediately (no deduction from new posting quota).
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 bg-surface-low px-6 py-3">
              <button type="button" onClick={() => setRejectOpen(false)}
                className="inline-flex h-9 items-center rounded-md bg-surface-mid px-4 text-label-md font-semibold text-ink transition-colors hover:bg-surface-high">
                Cancel
              </button>
              <button type="button" onClick={() => setRejectOpen(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#e11d48] px-4 text-label-md font-bold text-white shadow-md transition-colors hover:bg-[#be123c]">
                <span className="material-symbols-outlined text-[18px]">send</span>
                Confirm rejection &amp; send feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApprovalPage;
