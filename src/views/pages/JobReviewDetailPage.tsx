import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

/**
 * STATIC mockup page — JD review detail (Stitch screen_18.1 "chi tiết kiểm duyệt JD").
 * BE chưa có endpoint kiểm duyệt JD nên trang dựng tĩnh: giữ nguyên demo data tiếng Việt
 * từ mockup, chrome tiếng Anh, không gọi API. Route /admin/job-approvals/:id nhận mã JD
 * để breadcrumb/chip hiển thị đúng tin đang soi.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #fffbeb/#92400e amber-50/800
 * (chip "Chờ review"), #f59e0b amber-500 (dot nhịp nháy trên chip).
 */

const SPEC_BAR = [
  { icon: 'location_on', label: 'Work location', value: 'Hà Nội (Hybrid)', tone: 'text-primary' },
  { icon: 'work_history', label: 'Experience', value: 'Từ 3 năm trở lên', tone: 'text-primary' },
  { icon: 'group', label: 'Openings', value: '02 Kỹ sư', tone: 'text-primary' },
  { icon: 'smart_toy', label: 'AI Interview Engine', value: 'Sẵn sàng kích hoạt', tone: 'text-secondary' },
];

const SKILL_TAGS = [
  { label: 'ReactJS', ai: true }, { label: 'TypeScript', ai: true },
  { label: 'Tailwind CSS', ai: false }, { label: 'Next.js', ai: false },
  { label: 'Redux Toolkit', ai: false }, { label: 'RESTful API / GraphQL', ai: false },
  { label: 'Công nghệ thông tin', field: true }, { label: 'Fintech / SaaS', field: true },
];

const JD_SECTIONS = [
  {
    title: 'Job Description', dot: 'bg-primary',
    items: [
      'Chịu trách nhiệm thiết kế kiến trúc và phát triển giao diện người dùng cho các hệ thống tài chính phân tán có lưu lượng truy cập cao (High-traffic FinTech platform).',
      'Chủ động tối ưu hóa hiệu năng Core Web Vitals (LCP < 2.5s, FID/INP, CLS), đảm bảo trải nghiệm người dùng liền mạch trên đa nền tảng thiết bị.',
      'Phối hợp chặt chẽ với Product Owner, Designer UI/UX và nhóm Backend Engineers để hiện thực hóa các luồng nghiệp vụ phức tạp, chuyển hóa API spec thành giao diện tương tác tinh tế.',
      'Tham gia thực hiện Code Review thường xuyên, xây dựng thư viện UI Component (Design System) chuẩn hóa nội bộ và áp dụng các Best Practices về Clean Architecture.',
      'Xây dựng Unit Test, Integration Test (Jest/React Testing Library) nhằm bảo đảm độ ổn định và an toàn của hệ thống trước mỗi đợt Release.',
    ],
  },
  {
    title: 'Candidate Requirements', dot: 'bg-primary',
    items: [
      'Tối thiểu từ 3 năm kinh nghiệm thực chiến phát triển ứng dụng web hiện đại với hệ sinh thái React, Next.js và TypeScript chuyên sâu.',
      'Nắm vững các mô hình quản lý trạng thái (State Management): Redux Toolkit, Zustand, hoặc React Query/TanStack Query.',
      'Thành thạo kỹ thuật Responsive Layout, CSS-in-JS, Tailwind CSS và hiểu sâu về cơ chế Rendering của trình duyệt (Browser Rendering Pipeline, Event Loop).',
      'Có kinh nghiệm sử dụng các công cụ Profiling & Debugging (Chrome DevTools, React DevTools, Lighthouse) để phát hiện và xử lý nghẽn bộ nhớ, Re-render thừa.',
      'Tư duy giải quyết vấn đề nhanh nhạy, kỹ năng giao tiếp chủ động, tinh thần đồng đội cao và có khả năng đọc hiểu tài liệu kỹ thuật tiếng Anh tốt.',
    ],
  },
  {
    title: 'Benefits & Compensation', dot: 'bg-secondary',
    items: [
      'Mức lương cạnh tranh từ 25.000.000 - 38.000.000 VNĐ, thưởng tháng 13 cùng thưởng dự án định kỳ, xét tăng lương 2 lần/năm.',
      'Chính sách làm việc linh hoạt Hybrid Working (2 ngày Work from Home/tuần), giờ giấc làm việc mềm dẻo.',
      'Đóng bảo hiểm đầy đủ 100% trên tổng lương thực nhận theo quy định pháp luật và gói bảo hiểm sức khỏe Bảo Việt Gold cao cấp.',
      'Cung cấp thiết bị làm việc mới nhất: MacBook Pro M3 Chip, màn hình Dell UltraSharp 4K cùng phụ kiện công thái học.',
      'Ngân sách đào tạo cá nhân hàng năm (15.000.000 VNĐ) dành cho các khóa học công nghệ quốc tế, chứng chỉ AWS/Azure.',
    ],
  },
];

const CHECKLIST = [
  { title: 'Nội dung đầy đủ & rõ ràng', desc: 'Mô tả, yêu cầu, dải lương và quyền lợi minh bạch' },
  { title: 'Không vi phạm chính sách', desc: 'Không phân biệt giới tính, tuổi tác hoặc nội dung cấm' },
  { title: 'Thông tin doanh nghiệp hợp lệ', desc: 'Domain email hr@technova.io và MST hợp lệ' },
];

const HISTORY = [
  {
    dot: 'bg-primary ring-info', title: 'Cập nhật lại hồ sơ JD', time: '28/05 10:45', tone: 'text-ink',
    desc: 'Nhà tuyển dụng TechNova nộp lại bản cập nhật JD',
    note: 'Ghi chú: Đã bổ sung mức lương và chế độ đãi ngộ chi tiết.',
  },
  {
    dot: 'bg-error ring-danger-bg', title: 'Yêu cầu chỉnh sửa', time: '26/05 15:20', tone: 'text-error',
    desc: 'Admin Trần Minh Đức đã kiểm duyệt',
    note: 'Ghi chú: Cần làm rõ dải lương theo quy chế minh bạch tuyển dụng.',
  },
  {
    dot: 'bg-outline-strong ring-surface-mid', title: 'Khởi tạo tin tuyển dụng', time: '26/05 14:00', tone: 'text-ink',
    desc: 'TechNova Corporation tạo tin đăng tuyển lần đầu trên cổng quản trị.',
  },
];

const REJECT_REASONS = [
  'Thiếu thông tin quan trọng (Lương, yêu cầu chi tiết)',
  'Nội dung không phù hợp / Vi phạm quy tắc cộng đồng',
  'Thông tin liên hệ hoặc pháp nhân chưa chính xác',
  'Lý do khác',
];

const JobReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const approve = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 4000);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {/* Breadcrumb + quick actions */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-label-md text-ink-variant">
            <Link to="/admin/job-approvals" className="flex items-center gap-1 transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to moderation queue
            </Link>
            <span className="text-outline">/</span>
            <span>JD Moderation</span>
            <span className="text-outline">/</span>
            <span className="font-semibold text-ink">Frontend Developer</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-full bg-surface-mid px-2 py-0.5 text-label-sm tracking-wide text-ink-variant">JD ID: #{id}</span>
            <span className="rounded-full bg-surface-high px-2 py-0.5 text-label-sm text-ink">Type: Toàn thời gian</span>
            <span className="rounded-full bg-surface-high px-2 py-0.5 text-label-sm font-medium text-ink">Level: Middle / Senior</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface-mid px-3 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            View candidate version
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface-mid px-3 text-label-md font-medium text-ink shadow-sm transition-colors hover:bg-surface-high">
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* LEFT: JD document */}
        <div className="lg:col-span-8">
          <div className="space-y-4 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:p-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 border-b border-surface-mid pb-4 md:flex-row">
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-info/40 p-2 text-primary-container ring-1 ring-info">
                  <span className="material-symbols-outlined text-[36px]">business_center</span>
                </div>
                <div className="space-y-1">
                  <h1 className="m-0 text-headline-lg font-bold tracking-tight text-ink">
                    Senior Frontend Developer (React &amp; TypeScript)
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-label-md font-semibold text-ink">TechNova Corporation</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-medium text-success-text">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Doanh nghiệp đã xác minh
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-body-sm text-ink-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-outline-strong">schedule</span>
                      Ngày gửi duyệt: 10:45 - 28/05/2026
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-outline-strong">event_available</span>
                      Hạn ứng tuyển: 30/06/2026
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-baseline justify-between gap-1 rounded-xl border border-surface-mid bg-surface-low px-3 py-2 md:flex-col md:items-end">
                <span className="text-label-sm font-medium uppercase tracking-wider text-ink-variant">Proposed income</span>
                <span className="text-headline-md font-bold text-primary">25 - 38 triệu</span>
                <span className="text-body-sm text-outline-strong">VNĐ / tháng (Gross)</span>
              </div>
            </div>

            {/* Quick spec bar */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-mid bg-surface-low p-3 sm:grid-cols-4">
              {SPEC_BAR.map(s => (
                <div key={s.label} className="space-y-0.5 p-1">
                  <span className="block text-label-sm text-ink-variant">{s.label}</span>
                  <p className="m-0 mt-1 flex items-center gap-1.5 text-label-md font-semibold text-ink">
                    <span className={`material-symbols-outlined text-[18px] ${s.tone}`}>{s.icon}</span>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Skill tags */}
            <div className="space-y-2">
              <span className="block text-label-sm font-semibold uppercase tracking-wider text-ink-variant">Key skills &amp; domains</span>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_TAGS.map(t => (
                  <span
                    key={t.label}
                    className={
                      t.ai
                        ? 'inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-1 text-label-md font-medium text-success-text'
                        : t.field
                          ? 'rounded-full bg-info px-2 py-1 text-label-md font-semibold text-info-text'
                          : 'rounded-full bg-surface-mid px-2 py-1 text-label-md font-medium text-ink'
                    }
                  >
                    {t.ai && <span className="material-symbols-outlined text-[14px]">auto_awesome</span>}
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px bg-surface-mid" />

            {JD_SECTIONS.map(sec => (
              <div key={sec.title} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-5 w-1.5 rounded-full bg-primary" />
                  <h2 className="m-0 text-headline-sm font-bold text-ink">{sec.title}</h2>
                </div>
                <ul className="m-0 space-y-2 pl-1 leading-relaxed text-body-md text-ink-variant">
                  {sec.items.map(it => (
                    <li key={it} className="flex items-start gap-2">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${sec.dot}`} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Company summary */}
            <div className="space-y-2 rounded-xl border border-surface-mid bg-surface-low p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-mid text-primary">
                    <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                  </div>
                  <div>
                    <h3 className="m-0 text-headline-sm font-semibold text-ink">TechNova Corporation</h3>
                    <p className="m-0 text-body-sm text-ink-variant">Tập đoàn giải pháp công nghệ tài chính &amp; Chuyển đổi số</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-high px-2 py-1 text-label-sm font-semibold text-ink">MST: 0108934721</span>
              </div>
              <div className="mt-1 grid grid-cols-1 gap-1.5 border-t border-surface-mid pt-1.5 text-body-sm text-ink-variant sm:grid-cols-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline-strong">apartment</span>
                  Tầng 18, Keangnam Landmark 72, Nam Từ Liêm, Hà Nội
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline-strong">mail</span>
                  <span className="font-medium text-primary">hr@technova.io</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: review panel + history */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-surface-mid pb-2">
                <div>
                  <span className="block text-label-sm uppercase tracking-wider text-ink-variant">Posting status</span>
                  <span className="text-headline-sm text-ink">Quality inspection</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffbeb] px-2 py-1 text-label-md font-semibold text-[#92400e] shadow-sm">
                  <span className="h-2 w-2 animate-ping rounded-full bg-[#f59e0b]" />
                  Pending review
                </span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">
                Content moderation standards for job postings before activating the AI interview engine.
              </p>
              <div className="space-y-2 rounded-lg bg-surface-low p-3">
                <span className="block text-label-sm font-bold uppercase tracking-wider text-ink">Moderation checklist</span>
                <div className="space-y-1.5">
                  {CHECKLIST.map(c => (
                    <label key={c.title} className="group flex cursor-pointer items-start gap-2">
                      <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 cursor-pointer accent-primary" />
                      <span className="text-body-sm text-ink transition-colors group-hover:text-primary">
                        <strong className="block font-semibold text-ink">{c.title}</strong>
                        {c.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-label-md text-ink" htmlFor="review-note">
                  <span>Internal moderation note (Optional)</span>
                  <span className="text-[11px] font-normal text-outline-strong">{note.length}/250</span>
                </label>
                <textarea
                  id="review-note"
                  rows={3}
                  value={note}
                  maxLength={250}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho doanh nghiệp hoặc lưu vết kiểm duyệt nội bộ..."
                  className="w-full resize-none rounded-md bg-surface-low p-2 text-body-sm text-ink shadow-inner transition-all placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={() => setRejectOpen(true)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-danger-bg px-3 text-label-md font-medium text-danger-text shadow-sm transition-all hover:brightness-95">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Reject
                </button>
                <button type="button" onClick={approve}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-label-md font-medium text-white shadow-sm transition-all hover:opacity-90">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Approve
                </button>
              </div>
              <div className="flex items-start gap-1.5 rounded-md bg-surface-mid p-2 text-body-sm text-ink-variant">
                <span className="material-symbols-outlined shrink-0 text-[18px] text-primary">info</span>
                <span>Sau khi phê duyệt, JD sẽ lập tức hiển thị công khai trên cổng việc làm và kích hoạt tính năng AI Mock Interview tương ứng.</span>
              </div>
            </div>

            {/* History timeline */}
            <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-surface-mid pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-primary">history</span>
                  <h3 className="m-0 text-headline-sm text-ink">Moderation history</h3>
                </div>
                <span className="rounded-full bg-surface-mid px-1.5 py-0.5 text-label-sm text-ink-variant">3 records</span>
              </div>
              <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-surface-mid">
                {HISTORY.map(h => (
                  <div key={h.time} className="relative">
                    <span className={`absolute -left-6 top-1 h-3 w-3 rounded-full ring-4 ${h.dot}`} />
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-label-md font-semibold ${h.tone}`}>{h.title}</span>
                        <span className="text-label-sm text-outline-strong">{h.time}</span>
                      </div>
                      <p className="m-0 text-body-sm text-ink-variant">{h.desc}</p>
                      {h.note && <p className="m-0 rounded bg-surface-low p-1.5 text-body-sm text-ink">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[950] flex max-w-md items-center gap-2 rounded-xl border-l-4 border-secondary bg-card p-3 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.1)]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-text">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="flex-1 pr-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-label-md font-bold text-ink">Action successful</span>
              <span className="text-label-sm text-outline-strong">Just now</span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">JD đã được phê duyệt và hiển thị công khai trên hệ sinh thái AI Interview.</p>
          </div>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(false)}
            className="rounded p-1 text-ink-variant transition-colors hover:bg-surface-mid hover:text-ink">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-mid pb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg text-error">
                  <span className="material-symbols-outlined text-[22px]">error_outline</span>
                </div>
                <div>
                  <h2 className="m-0 text-headline-sm text-ink">Reject JD approval</h2>
                  <p className="m-0 text-body-sm text-ink-variant">Chọn lý do và phản hồi để nhà tuyển dụng TechNova chỉnh sửa.</p>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setRejectOpen(false)}
                className="rounded-md p-1.5 text-ink-variant transition-colors hover:bg-surface-mid">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-label-md font-semibold text-ink" htmlFor="reject-reason">Rejection reason (Required)</label>
                <select id="reject-reason" className="h-10 w-full cursor-pointer appearance-none rounded-md bg-surface-low px-3 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-md font-semibold text-ink">Feedback details for the employer (Required)</label>
                <textarea
                  rows={4}
                  placeholder="Mô tả cụ thể những điểm cần chỉnh sửa hoặc lý do không phê duyệt để TechNova Corporation cập nhật lại..."
                  className="w-full resize-none rounded-md bg-surface-low p-2 text-body-sm text-ink shadow-inner transition-all placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-surface-mid p-2 text-body-sm text-ink-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">forward_to_inbox</span>
                <span>Automatic notification email with the rejection reason will be sent to <strong>hr@technova.io</strong></span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setRejectOpen(false)}
                className="inline-flex h-9 items-center rounded-md bg-surface-mid px-3 text-label-md font-medium text-ink transition-colors hover:bg-surface-high">
                Cancel
              </button>
              <button type="button" onClick={() => setRejectOpen(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-error px-3 text-label-md font-medium text-white shadow-sm transition-colors hover:opacity-90">
                <span className="material-symbols-outlined text-[18px]">send</span>
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobReviewDetailPage;
