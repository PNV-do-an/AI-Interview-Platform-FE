import React, { useState } from 'react';
import { Badge } from '../components/ui';

/**
 * Static screen ported from Stitch mockup: hiring_analytics_ai_talent_insights.
 * All figures are copied verbatim from the mockup (approved static UI). No API calls.
 *
 * Token mapping (mockup -> tailwind.config.js "Precision Intelligence"):
 *  surface-container-lowest->card, low->surface-low, container->surface-mid, high->surface-high,
 *  on-surface->ink, on-surface-variant->ink-variant, outline(#777587)->outline-strong, outline-variant(#c7c4d8)->outline,
 *  font-code-inline/text-code-inline -> font-mono text-[12px], primary-fixed #e2dfff -> bg-info token.
 * Mockup colors with no token (kept as hex literals):
 *  secondary-container #6063ee, tertiary-container #4a55be, tertiary #313ba4, surface-container-highest #dae2fd.
 */

const FILTER_BOX = 'flex items-center rounded-xl bg-surface-low px-3 py-1.5 text-label-md text-ink shadow-sm';
const BAR_TRACK = 'flex h-3 w-full overflow-hidden rounded-full bg-[#dae2fd]'; // surface-container-highest: no token

const KPIS = [
  {
    label: 'TB. thời gian tuyển dụng',
    icon: 'speed',
    iconTone: 'text-primary',
    blob: 'bg-primary/5',
    value: '14.2',
    unit: 'Ngày',
    foot: (
      <>
        <div className="flex items-center gap-1 text-label-sm font-semibold text-ink">
          <span className="material-symbols-outlined text-[16px] text-primary">trending_down</span>
          <span className="text-primary">-42%</span>
          <span className="font-normal text-outline-strong">so với ngành (24.5 ngày)</span>
        </div>
        <svg className="h-6 w-16 overflow-visible text-primary" fill="none" viewBox="0 0 64 24">
          <path d="M1 19 L14 15 L28 17 L42 8 L54 11 L63 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
          <circle cx="63" cy="3" fill="currentColor" r="2.5" />
        </svg>
      </>
    ),
  },
  {
    label: 'Độ chính xác hiệu chỉnh',
    icon: 'verified',
    iconTone: 'text-secondary',
    blob: 'bg-secondary/5',
    value: '96.4%',
    unit: '',
    badge: '+3.1%',
    foot: (
      <>
        <span className="text-label-sm text-outline-strong">Mức đồng thuận với hội đồng người</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="ml-1 font-mono text-[12px] font-semibold text-ink">4/4 Bậc</span>
        </div>
      </>
    ),
  },
  {
    label: 'Thông lượng đạt yêu cầu',
    icon: 'group_work',
    iconTone: 'text-primary',
    blob: 'bg-surface-high',
    value: '148',
    unit: 'Kỹ sư',
    foot: (
      <>
        <div className="flex items-center gap-1 text-label-sm text-ink">
          <span className="font-semibold text-primary">74.2%</span>
          <span className="text-outline-strong">Tỷ lệ qua vòng sàng lọc</span>
        </div>
        <span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[12px] font-medium text-ink-variant">Đã sàng lọc 356</span>
      </>
    ),
  },
  {
    label: 'Mức tăng hiệu suất',
    icon: 'savings',
    iconTone: 'text-primary',
    blob: 'bg-info/20',
    value: '340+',
    unit: 'Giờ tiết kiệm',
    foot: (
      <>
        <span className="text-label-sm font-semibold text-primary">~$38,200</span>
        <span className="text-label-sm text-outline-strong">Giờ kỹ thuật giữ lại được</span>
      </>
    ),
  },
];

const FUNNEL_STAGES = [
  { n: '1', name: 'Được tìm nguồn & Nộp đơn', tag: '', tagClass: '', note: 'Trực tiếp, Giới thiệu, Đối tác', count: '480 ứng viên', days: 'TB: 0.5 ngày', width: '100%', bar: 'bg-primary', numClass: 'bg-surface-high text-ink' },
  { n: '2', name: 'Sàng lọc kỹ thuật động bằng AI', tag: '74.2% đạt', tagClass: 'bg-info text-primary', note: '', count: '356 hoàn thành', days: 'TB: 1.8 ngày', width: '74.2%', bar: 'bg-primary', numClass: 'bg-surface-high text-ink' },
  { n: '3', name: 'Phỏng vấn Kiến trúc sư Staff/Lead', tag: '31.4% qua', tagClass: 'bg-surface-high text-ink-variant', note: '', count: '112 đã phỏng vấn', days: 'TB: 4.2 ngày', width: '31.4%', bar: 'bg-secondary', numClass: 'bg-surface-high text-ink' },
  { n: '4', name: 'Gửi lời mời nhận việc cuối cùng', tag: '25.0% chuyển đổi', tagClass: 'bg-surface-high text-ink-variant', note: '', count: '28 lời mời', days: 'TB: 2.1 ngày', width: '18.2%', bar: 'bg-[#4a55be]', numClass: 'bg-surface-high text-ink' }, // tertiary-container: no token
  { n: '5', name: 'Nhận lời mời & Hội nhập', tag: '85.7% tỷ lệ chốt', tagClass: 'bg-surface-mid text-primary font-semibold', note: '', count: '24 đã ký', days: 'TB: 3.5 ngày', width: '14.5%', bar: 'bg-primary', numClass: 'bg-info text-primary' },
];

const CALIBRATION = [
  { name: 'Thuật toán & Cấu trúc dữ liệu cốt lõi', match: '98.2% khớp', ai: 88, staff: 89 },
  { name: 'Kiến trúc hệ phân tán', match: '94.7% khớp', ai: 82, staff: 84 },
  { name: 'Độ trưởng thành production & Khả năng quan sát', match: '92.0% khớp', ai: 79, staff: 81 },
  { name: 'Giao tiếp kỹ thuật & Đánh đổi', match: '91.5% khớp', ai: 85, staff: 83 },
];

const SKILLS = [
  { name: 'Mẫu đồng thời Go / Rust', pct: 84, bar: 'bg-primary', note: 'Kênh dẫn đầu: Giới thiệu trực tiếp & GitHub OSS', noteClass: 'text-outline-strong', chipClass: 'text-primary' },
  { name: 'Đồng thuận phân tán (Raft / Paxos)', pct: 68, bar: 'bg-[#6063ee]', note: 'Hụt nhân tài nhẹ; đề xuất tăng trọng số tiêu chí', noteClass: 'text-outline-strong', chipClass: 'text-primary' }, // secondary-container: no token
  { name: 'Phân vùng & Sharding DB Cloud', pct: 76, bar: 'bg-primary', note: 'Vượt chuẩn đội với Postgres/Cassandra', noteClass: 'text-outline-strong', chipClass: 'text-primary' },
  { name: 'Kubernetes chuyên sâu & eBPF', pct: 52, bar: 'bg-outline-strong', note: 'Kỹ năng rất hiếm: cần ưu tiên tạo nguồn', noteClass: 'text-error', chipClass: 'text-error' },
];

const CHANNELS = [
  { dot: 'bg-primary', name: 'Stripe Partner Network', stat: '32% tỷ lệ nhận việc' },
  { dot: 'bg-secondary', name: 'Giới thiệu kỹ thuật trực tiếp', stat: '28% tỷ lệ nhận việc' },
  { dot: 'bg-[#313ba4]', name: 'Đại học CNTT hàng đầu', stat: '19% tỷ lệ nhận việc' }, // tertiary: no token
];

const CALIBRATION_LOG = [
  { code: '#CAN-8841', role: 'Principal Cloud Architect', ai: '94 / 100', panel: '96 / 100', delta: '-2.0%', duration: '32 phút', status: 'Đã xác nhận', statusDot: 'bg-primary', statusText: 'text-primary' },
  { code: '#CAN-8839', role: 'Senior Distributed Systems Dev', ai: '88 / 100', panel: '87 / 100', delta: '+1.1%', duration: '36 phút', status: 'Đã xác nhận', statusDot: 'bg-primary', statusText: 'text-primary' },
  { code: '#CAN-8832', role: 'Machine Learning Core Engineer', ai: '78 / 100', panel: '75 / 100', delta: '+3.8%', duration: '40 phút', status: 'Kiểm toán bổ sung', statusDot: 'bg-secondary', statusText: 'text-ink' },
  { code: '#CAN-8828', role: 'Staff Infrastructure / SRE', ai: '91 / 100', panel: '92 / 100', delta: '-1.0%', duration: '29 phút', status: 'Đã xác nhận', statusDot: 'bg-primary', statusText: 'text-primary' },
];

const HiringAnalyticsPage: React.FC = () => {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Command / Filter Bar */}
      <div className="flex flex-col gap-6 bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-label-sm text-outline-strong">
              <span>Không gian Nhà tuyển dụng</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Phân tích</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-medium text-primary">Phân tích tuyển dụng &amp; Insight AI</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-headline-lg text-ink">Phân tích tuyển dụng &amp; Dự báo nhân tài</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-mid px-2.5 py-0.5 text-label-sm text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Dữ liệu thời gian thực
              </span>
            </div>
            <p className="m-0 max-w-3xl text-body-md text-ink-variant">
              Tỷ lệ chuyển đổi quy trình thời gian thực, tốc độ đánh giá, phân bố kỹ năng ứng viên và hiệu chỉnh chấm điểm AI.
            </p>
          </div>
          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={FILTER_BOX}>
              <span className="material-symbols-outlined mr-2 text-[18px] text-outline-strong">calendar_today</span>
              <select className="cursor-pointer bg-transparent pr-2 text-label-md text-ink focus:outline-none" defaultValue="30 ngày gần nhất (Đang bật)">
                <option>30 ngày gần nhất (Đang bật)</option>
                <option>Q3 2025 (Th7 - Th9)</option>
                <option>Từ đầu năm (2025)</option>
                <option>Khoảng tùy chỉnh...</option>
              </select>
            </div>
            <div className={FILTER_BOX}>
              <span className="material-symbols-outlined mr-2 text-[18px] text-outline-strong">domain</span>
              <select className="cursor-pointer bg-transparent pr-2 text-label-md text-ink focus:outline-none" defaultValue="Toàn bộ khối Kỹ thuật">
                <option>Toàn bộ khối Kỹ thuật</option>
                <option>Nền tảng lõi &amp; Hạ tầng</option>
                <option>Hệ thống Machine Learning</option>
                <option>Sản phẩm &amp; Ứng dụng phân tán</option>
              </select>
            </div>
            <div className={FILTER_BOX}>
              <span className="material-symbols-outlined mr-2 text-[18px] text-outline-strong">badge</span>
              <select className="cursor-pointer bg-transparent pr-2 text-label-md text-ink focus:outline-none" defaultValue="Cấp Senior & Staff">
                <option>Cấp Senior &amp; Staff</option>
                <option>Mọi cấp bậc</option>
                <option>Kỹ sư Junior &amp; Mid</option>
                <option>Quản lý kỹ thuật</option>
              </select>
            </div>
            {/* Export Dropdown */}
            <div className="relative text-left">
              <button
                type="button"
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary"
              >
                <span className="material-symbols-outlined text-[18px]">ios_share</span>
                <span>Xuất báo cáo</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              {exportOpen && (
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl bg-card py-1 shadow-card">
                  <a className="flex items-center gap-2 px-4 py-2 text-label-md text-ink hover:bg-surface-low" href="#/">
                    <span className="material-symbols-outlined text-[18px] text-primary">picture_as_pdf</span>
                    <span>Bản tóm tắt lãnh đạo (PDF)</span>
                  </a>
                  <a className="flex items-center gap-2 px-4 py-2 text-label-md text-ink hover:bg-surface-low" href="#/">
                    <span className="material-symbols-outlined text-[18px] text-secondary">table_view</span>
                    <span>Dữ liệu thô (CSV)</span>
                  </a>
                  <a className="flex items-center gap-2 px-4 py-2 text-label-md text-ink hover:bg-surface-low" href="#/">
                    <span className="material-symbols-outlined text-[18px] text-outline-strong">tune</span>
                    <span>Nhật ký hiệu chỉnh AI (JSON)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="flex flex-col gap-6">
        {/* 4 High-Impact KPI Metric Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className={`pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 rounded-full ${k.blob}`} />
              <div className="flex items-center justify-between">
                <span className="text-label-sm uppercase tracking-wider text-outline-strong">{k.label}</span>
                <span className={`rounded-lg bg-surface-low p-1.5 ${k.iconTone}`}>
                  <span className="material-symbols-outlined text-[18px]">{k.icon}</span>
                </span>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className="tracking-tight text-metric-stat text-ink">{k.value}</span>
                {k.unit && <span className="text-body-md text-outline-strong">{k.unit}</span>}
                {k.badge && <span className="rounded-full bg-info px-2 py-0.5 text-label-sm font-semibold text-primary">{k.badge}</span>}
              </div>
              <div className="flex items-center justify-between">{k.foot}</div>
            </div>
          ))}
        </div>

        {/* Visual Analytics: Funnel & Calibration Core */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left (7 Cols): Funnel Conversion Velocity */}
          <div className="flex flex-col justify-between rounded-xl bg-card p-6 shadow-sm xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="m-0 text-headline-md text-ink">Phễu chuyển đổi quy trình end-to-end</h2>
                  <Badge tone="info">Q3 trực tiếp</Badge>
                </div>
                <p className="m-0 text-body-sm text-ink-variant">Thời lượng từng giai đoạn, tỷ lệ rớt và thông lượng đạt chuẩn tự động</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-label-sm text-outline-strong">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Số lượng
                </span>
                <span className="ml-2 flex items-center gap-1 text-label-sm text-outline-strong">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#6063ee]" /> % Chuyển đổi
                </span>
              </div>
            </div>
            {/* Funnel Stages Detailed List */}
            <div className="flex flex-col gap-3">
              {FUNNEL_STAGES.map((s) => (
                <div key={s.n} className="rounded-xl bg-surface-low p-3 transition-colors hover:bg-surface-mid">
                  <div className="mb-2 flex items-center justify-between text-label-md">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[12px] font-semibold ${s.numClass}`}>{s.n}</span>
                      <span className="font-semibold text-ink">{s.name}</span>
                      {s.note && <span className="font-normal text-outline-strong">{s.note}</span>}
                      {s.tag && <span className={`rounded px-2 py-0.5 text-label-sm ${s.tagClass}`}>{s.tag}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[12px] font-semibold ${s.n === '5' ? 'font-bold text-primary' : 'text-ink'}`}>{s.count}</span>
                      <span className="text-label-sm text-outline-strong">{s.days}</span>
                    </div>
                  </div>
                  <div className={BAR_TRACK}>
                    <div className={`h-full rounded-full transition-all duration-500 ${s.bar}`} style={{ width: s.width }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between border-t border-surface-mid pt-3 text-label-sm text-outline-strong">
              <span>Hiệu quả quy trình tổng thể: <strong className="text-ink">5.0% ứng tuyển thành tuyển dụng</strong></span>
              <span className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Đã gỡ nút thắt: tự động xếp lịch tiết kiệm 2.6 ngày
              </span>
            </div>
          </div>

          {/* Right (5 Cols): AI vs Human Panel Calibration */}
          <div className="flex flex-col justify-between rounded-xl bg-card p-6 shadow-sm xl:col-span-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="m-0 text-headline-md text-ink">Hiệu chỉnh AI vs. Con người</h2>
                <span className="rounded bg-surface-mid px-2 py-1 font-mono text-[12px] font-bold text-primary">r² = 0.941</span>
              </div>
              <p className="mb-4 mt-0 text-body-sm text-ink-variant">
                Điểm đánh giá của Aria AI so với kết quả hội đồng Staff Engineer ẩn danh.
              </p>
              {/* Correlation Competency Matrix */}
              <div className="flex flex-col gap-3">
                {CALIBRATION.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1.5 rounded-xl bg-surface-low p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-label-md font-semibold text-ink">{c.name}</span>
                      <span className="font-mono text-[12px] font-semibold text-primary">{c.match}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-label-sm text-outline-strong">AI: {c.ai}/100</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dae2fd]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${c.ai}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-label-sm text-outline-strong">Staff: {c.staff}/100</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dae2fd]">
                        <div className="h-full rounded-full bg-[#6063ee]" style={{ width: `${c.staff}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-mid p-2 text-label-sm text-ink">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
                Tốc độ trôi hiệu chỉnh: &lt; 0.8%
              </span>
              <button type="button" className="font-semibold text-primary hover:underline">Hiệu chỉnh lại mô hình</button>
            </div>
          </div>
        </div>

        {/* Skill Competency Heatmap & Fair Assessment */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Competency Heatmap (8 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-card p-6 shadow-sm xl:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="m-0 text-headline-md text-ink">Ma trận năng lực kỹ năng ứng viên</h2>
                <p className="m-0 text-body-sm text-ink-variant">Mức thành thạo của ứng viên trên 148 hồ sơ đã được đánh giá</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-surface-low px-3 py-1">
                <span className="text-label-sm text-outline-strong">Mục tiêu đối chiếu: </span>
                <span className="font-mono text-[12px] font-semibold text-primary">&gt; 70%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SKILLS.map((s) => (
                <div key={s.name} className="flex flex-col justify-between rounded-xl bg-surface-low p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-label-md font-semibold text-ink">{s.name}</span>
                    <span className={`rounded bg-surface-mid px-2 py-0.5 font-mono text-[12px] font-semibold ${s.chipClass}`}>{s.pct}% thành thạo</span>
                  </div>
                  <div className="mb-2 h-2 w-full rounded-full bg-[#dae2fd]">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className={`text-body-sm ${s.noteClass}`}>{s.note}</span>
                </div>
              ))}
            </div>
            {/* Sourcing Channels Yield Summary */}
            <div className="mt-6 rounded-xl bg-surface-low p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-label-sm uppercase tracking-wider text-outline-strong">Kênh tạo nguồn hiệu quả nhất</span>
                <span className="text-label-sm font-medium text-primary">Xếp theo tỷ lệ tuyển dụng</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-label-md sm:grid-cols-3">
                {CHANNELS.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <div>
                      <span className="font-semibold text-ink">{c.name}</span>
                      <p className="m-0 text-body-sm text-outline-strong">{c.stat}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fair Assessment & Bias Audit (4 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-card p-6 shadow-sm xl:col-span-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="m-0 text-headline-md text-ink">Kiểm toán nhân khẩu học &amp; Thiên kiến</h2>
                <span className="rounded-full bg-surface-mid p-1 text-primary">
                  <span className="material-symbols-outlined text-[20px]">gavel</span>
                </span>
              </div>
              <p className="mb-3 mt-0 text-body-sm text-ink-variant">
                Liên tục kiểm toán công bằng trên bản ghi tự động và prompt chấm điểm.
              </p>
              <div className="mb-3 flex flex-col gap-2 rounded-xl bg-surface-low p-3">
                <div className="flex items-center gap-2 text-label-md font-semibold text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Đạt 100% chấm điểm ẩn danh</span>
                </div>
                <p className="m-0 text-body-sm text-outline-strong">
                  Định danh, trường học, dấu hiệu giới tính và đặc trưng giọng nói đều được loại bỏ trước khi chấm theo tiêu chí.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[12px] font-semibold text-ink">1,420 bản ghi đã quét</span>
                  <span className="rounded bg-surface-high px-2 py-0.5 text-label-sm text-ink">0 sai lệch</span>
                </div>
              </div>
              {/* Actionable AI Recommendations */}
              <div className="flex flex-col gap-1">
                <span className="text-label-sm uppercase tracking-wider text-outline-strong">Khuyến nghị tối ưu AI</span>
                <div className="flex items-start gap-2 rounded-lg bg-surface-low p-2">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">lightbulb</span>
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">Điều chỉnh phễu Senior Backend</span>
                    <span className="text-body-sm text-outline-strong">Giảm trọng số Kubernetes từ 25% xuống 15% để tăng pool ứng viên đạt chuẩn thêm +18%.</span>
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-low p-2">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">schedule</span>
                  <div className="flex flex-col">
                    <span className="text-label-md font-semibold text-ink">Hiệu quả thời lượng phỏng vấn</span>
                    <span className="text-body-sm text-outline-strong">Độ chính xác của ứng viên đạt trạng thái ổn định ở phút 28. Giảm thời lượng mock từ 45m xuống 35m.</span>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-high py-2 text-label-md text-ink transition-colors hover:bg-surface-mid">
              <span>Áp dụng điều chỉnh tiêu chí</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Bottom Data Table: Recent Cohorts & Calibrated Evaluations */}
        <div className="flex flex-col rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="m-0 text-headline-md text-ink">Nhật ký hiệu chỉnh ứng viên đã đánh giá</h2>
              <p className="m-0 text-body-sm text-ink-variant">Luồng trực tiếp các lượt chấm điểm AI và trạng thái xác minh chéo với lãnh đạo kỹ thuật</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Lọc theo mã ứng viên hoặc kỹ năng..."
                className="w-64 rounded-lg bg-surface-low px-3 py-1.5 text-body-sm text-ink focus:outline-none"
              />
              <button type="button" className="rounded-lg bg-surface-low p-1.5 text-outline-strong hover:text-ink">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-md text-ink">
              <thead>
                <tr className="bg-surface-low text-label-sm uppercase tracking-wider text-outline-strong">
                  <th className="rounded-l-lg px-4 py-2.5 text-left font-medium">Mã ứng viên</th>
                  <th className="px-4 py-2.5 text-left font-medium">Vai trò quy trình</th>
                  <th className="px-4 py-2.5 text-left font-medium">Điểm AI</th>
                  <th className="px-4 py-2.5 text-left font-medium">Điểm hội đồng</th>
                  <th className="px-4 py-2.5 text-left font-medium">Độ lệch</th>
                  <th className="px-4 py-2.5 text-left font-medium">Thời lượng</th>
                  <th className="px-4 py-2.5 text-left font-medium">Trạng thái hiệu chỉnh</th>
                  <th className="rounded-r-lg px-4 py-2.5 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {CALIBRATION_LOG.map((r) => (
                  <tr key={r.code} className="transition-colors hover:bg-surface-low/50">
                    <td className="px-4 py-3 font-mono text-[12px] font-medium text-ink">{r.code}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{r.role}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[12px] font-bold text-primary">{r.ai}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink">{r.panel}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink">{r.delta}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-outline-strong">{r.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full bg-surface-high px-2.5 py-0.5 text-label-sm ${r.statusText}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${r.statusDot}`} /> {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="rounded p-1 text-outline-strong hover:bg-surface-mid hover:text-ink">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer Pagination / Quick View Link */}
          <div className="mt-3 flex items-center justify-between text-label-sm text-outline-strong">
            <span>Hiển thị 4 trong 148 ứng viên đã xác minh</span>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded bg-surface-low px-3 py-1 text-ink hover:bg-surface-mid">Trước</button>
              <button type="button" className="rounded bg-primary px-3 py-1 text-on-primary">1</button>
              <button type="button" className="rounded bg-surface-low px-3 py-1 text-ink hover:bg-surface-mid">2</button>
              <button type="button" className="rounded bg-surface-low px-3 py-1 text-ink hover:bg-surface-mid">3</button>
              <button type="button" className="rounded bg-surface-low px-3 py-1 text-ink hover:bg-surface-mid">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiringAnalyticsPage;
