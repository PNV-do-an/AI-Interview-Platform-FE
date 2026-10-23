import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

/* ------------------------------------------------------------------ */
/* Shared bits (marketing chrome, tokens from tailwind.config.js)      */
/* ------------------------------------------------------------------ */

const Logo: React.FC<{ size?: 'header' | 'footer' }> = ({ size = 'header' }) => (
  <BrandLogo
    markClass={size === 'header' ? 'h-7' : 'h-6'}
    nameClass="text-[15px] font-bold tracking-tight text-ink"
  />
);

const NAV_ITEMS: { label: string; to?: string; active?: boolean }[] = [
  { label: 'Nền tảng' },
  { label: 'Dành cho ứng viên' },
  { label: 'Dành cho nhà tuyển dụng' },
  { label: 'Tin tuyển dụng', to: '/jobs' },
  { label: 'Bảng giá' },
];

const SiteHeader: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline/40">
    <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to="/" aria-label="AI Interview trang chủ">
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-label-md text-ink-variant hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href="#"
                className="text-label-md text-ink-variant hover:text-ink transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="hidden sm:inline-flex text-label-md text-ink-variant hover:text-ink px-3 py-2 transition-colors"
        >
          Đăng nhập
        </Link>
        <a
          href="#"
          className="hidden xl:inline-flex items-center text-label-md text-ink bg-card border border-outline hover:bg-surface-low px-3 py-1.5 rounded-lg transition-colors"
        >
          Đăng tin tuyển dụng
        </a>
        <Link
          to="/register"
          className="inline-flex items-center text-label-md font-medium text-on-primary bg-primary-container hover:bg-primary px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          Bắt đầu miễn phí
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </div>
  </header>
);

const FOOTER_COLUMNS: { heading: string; links: { label: string; to?: string }[] }[] = [
  {
    heading: 'Nền tảng',
    links: [
      { label: 'Bộ máy thích ứng' },
      { label: 'Sandbox lập trình trực tiếp' },
      { label: 'Giọng nói & chỉ số' },
      { label: 'Bộ tiêu chí chấm nhất quán' },
      { label: 'Bảo mật & toàn vẹn' },
    ],
  },
  {
    heading: 'Giải pháp',
    links: [
      { label: 'Lãnh đạo kỹ thuật' },
      { label: 'Vận hành tuyển dụng' },
      { label: 'Ôn luyện cho ứng viên' },
      { label: 'Kho tin tuyển dụng', to: '/jobs' },
      { label: 'Doanh nghiệp' },
    ],
  },
  {
    heading: 'Tài nguyên',
    links: [
      { label: 'Tài liệu' },
      { label: 'Tài liệu API' },
      { label: 'Phương pháp chống thiên kiến' },
      { label: 'Chuẩn đo độ trễ' },
      { label: 'Các gói giá' },
    ],
  },
  {
    heading: 'Công ty',
    links: [
      { label: 'Về chúng tôi' },
      { label: 'Cơ hội nghề nghiệp' },
      { label: 'Pháp lý & tuân thủ' },
      { label: 'Chính sách bảo mật' },
      { label: 'Điều khoản sử dụng' },
    ],
  },
];

const SiteFooter: React.FC<{ tagline: string }> = ({ tagline }) => (
  <footer className="w-full bg-card border-t border-outline/40 pt-16 pb-12">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6 pb-16 border-b border-outline/30">
        <div className="col-span-2">
          <div className="mb-4">
            <Logo size="footer" />
          </div>
          <p className="text-body-sm text-ink-variant max-w-sm mb-6">
            Phỏng vấn kỹ thuật thời gian thực bằng AI với bộ tiêu chí chấm minh bạch. Xây dựng cho đội ngũ kỹ thuật,
            người phụ trách tuyển dụng và việc đánh giá ứng viên công bằng.
          </p>
          <div className="inline-flex items-center gap-4 text-ink-variant text-[13px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
              Đạt chuẩn SOC 2
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">security</span>
              Bảo mật cấp doanh nghiệp
            </span>
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-label-sm uppercase tracking-wider text-ink-variant mb-4 font-semibold">
              {col.heading}
            </h4>
            <ul className="space-y-2.5 text-body-sm">
              {col.links.map((link) => (
                <li key={link.label} className="flex">
                  {link.to ? (
                    <Link to={link.to} className="text-ink-variant hover:text-ink transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href="#" className="text-ink-variant hover:text-ink transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-body-sm text-ink-variant">{tagline}</p>
        <div className="flex items-center gap-4 text-body-sm text-ink-variant">
          <a href="#" className="hover:text-ink transition-colors">
            Bảo mật
          </a>
          <a href="#" className="hover:text-ink transition-colors">
            Điều khoản
          </a>
          <a href="#" className="hover:text-ink transition-colors">
            An toàn hệ thống
          </a>
          <div className="flex items-center gap-3 pl-3">
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              terminal
            </span>
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              code
            </span>
            <span className="material-symbols-outlined text-[18px] text-ink-variant hover:text-ink cursor-pointer">
              share
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

/* Dynamic-width progress bar (the only allowed inline style) */
const MeterBar: React.FC<{ pct: number; trackClass?: string }> = ({ pct, trackClass = 'bg-surface-mid' }) => (
  <div className={`w-full h-1.5 rounded-full ${trackClass}`}>
    <div className="h-1.5 rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
  </div>
);

/* ------------------------------------------------------------------ */
/* Hero: interactive simulation preview                                */
/* ------------------------------------------------------------------ */

const WAVEFORM: string[] = [
  'h-3 bg-primary',
  'h-5 bg-primary animate-pulse',
  'h-7 bg-primary-container',
  'h-4 bg-primary',
  'h-6 bg-[#6063ee]', // secondary-container
  'h-2 bg-outline',
  'h-5 bg-primary',
  'h-7 bg-primary-container',
  'h-3 bg-outline',
  'h-6 bg-secondary',
  'h-4 bg-primary',
  'h-2 bg-outline',
  'h-5 bg-primary-container',
  'h-7 bg-primary',
  'h-3 bg-outline',
  'h-6 bg-[#6063ee]', // secondary-container
  'h-4 bg-primary',
  'h-2 bg-outline',
];

const SCORECARD_ROWS: { label: string; pct: number }[] = [
  { label: 'Kiến trúc & thiết kế hệ thống', pct: 94 },
  { label: 'Khả năng mở rộng & chịu lỗi', pct: 86 },
  { label: 'Code sạch & giải quyết vấn đề', pct: 84 },
];

const HeroSimulation: React.FC = () => (
  <div className="relative max-w-5xl mx-auto mb-16">
    {/* Frame glow */}
    <div className="absolute -inset-1.5 bg-gradient-to-r from-[#c3c0ff]/50 via-primary-container/20 to-[#e1e0ff]/50 rounded-2xl blur-md opacity-40"/>
    <div className="relative rounded-xl bg-card shadow-xl overflow-hidden">
      {/* Terminal-like titlebar */}
      <div className="h-10 px-4 bg-surface-low flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c0c1ff]" /> {/* secondary-fixed-dim */}
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container/40" />
          </div>
          <div className="h-4 w-px bg-[#dae2fd] mx-1" /> {/* surface-variant */}
          <span className="text-label-md text-ink font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
            Phiên luyện tập tương tác • Kiến trúc sư Backend cấp cao
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-mid text-primary text-label-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Phiên trực tiếp
          </span>
          <span className="font-mono text-[12px] leading-4 text-ink-variant">24 phút đã trôi qua</span>
        </div>
      </div>
      {/* Split-pane canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Left pane: AI persona & voice stream */}
        <div className="lg:col-span-7 p-6 bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-headline-sm text-ink font-semibold">Kiến trúc sư AI cấp Staff (Elena)</span>
                    <span className="px-2 py-0.5 rounded bg-surface-mid text-primary text-label-sm">Chủ trì</span>
                  </div>
                  <p className="text-body-sm text-ink-variant">
                    Trọng tâm: đồng thuận phân tán, cam kết failover, cơ chế khóa
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-high text-primary text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Lượt 4/8
              </span>
            </div>
            {/* Prompt card */}
            <div className="p-4 rounded-lg bg-surface-low mb-4 shadow-sm">
              <p className="text-label-sm text-primary uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">record_voice_over</span> Câu hỏi của AI
              </p>
              <p className="text-body-md text-ink leading-snug">
                "Giải thích distributed locking giữa Redis (Redlock) và advisory lock của PostgreSQL. Khi mạng bị
                phân vùng và có GC pause, bạn chống split-brain dual writes trong tầng consensus bằng cách nào?"
              </p>
            </div>
            {/* Audio waveform */}
            <div className="p-3 rounded-lg bg-card shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                </div>
                <span className="text-label-sm text-ink font-medium">Elena đang nói</span>
              </div>
              <div className="flex-1 flex items-center gap-1 h-7 px-2">
                {WAVEFORM.map((bar, i) => (
                  <span key={i} className={`w-1 rounded-full ${bar}`} />
                ))}
              </div>
              <span className="font-mono text-[12px] leading-4 text-ink-variant">Đang bật STT thời gian thực</span>
            </div>
          </div>
          {/* Candidate transcript */}
          <div className="mt-4 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              <span className="text-body-sm text-ink-variant">
                Lời ứng viên:{' '}
                <span className="italic text-ink">
                  "Ghép fencing token với version key đơn điệu sẽ chặn các cập nhật lưu trữ sai thứ tự..."
                </span>
              </span>
            </div>
            <span className="text-label-sm text-primary font-semibold">Chuyển giọng nói trực tiếp</span>
          </div>
        </div>
        {/* Right pane: benchmark scorecard */}
        <div className="lg:col-span-5 p-6 bg-surface-mid flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-sm uppercase tracking-wider text-ink-variant font-semibold">
                Bảng điểm hiệu suất
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-card text-primary text-label-sm shadow-sm font-medium">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Đạt chuẩn
              </span>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-body-sm text-ink-variant">Tổng điểm khớp</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-display font-bold text-primary">88%</span>
                    <span className="text-headline-sm text-ink-variant">Nên tuyển</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-surface-high text-primary text-label-sm font-semibold">
                    Ứng viên Top 8%
                  </span>
                  <p className="text-body-sm text-ink-variant mt-1">Cấp Staff &amp; Senior</p>
                </div>
              </div>
              <div className="space-y-2.5 pt-2">
                {SCORECARD_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-label-sm mb-1">
                      <span className="text-ink">{row.label}</span>
                      <span className="font-mono text-[12px] leading-4 font-medium text-primary">{row.pct}%</span>
                    </div>
                    <MeterBar pct={row.pct} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-high shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="min-w-0">
                <p className="text-label-sm font-semibold text-ink truncate">Chứng nhận phỏng vấn đã xác thực</p>
                <p className="text-body-sm text-ink-variant truncate">
                  Đủ điều kiện ứng tuyển nhanh tại 18 công ty đối tác
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-body-sm text-ink-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
              Mã hóa &amp; riêng tư
            </span>
            <span className="text-label-sm text-primary font-medium hover:underline cursor-pointer flex items-center gap-0.5">
              Xem toàn bộ báo cáo phản hồi <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const LOGOS: { name: string; icon: string }[] = [
  { name: 'CloudScale', icon: 'cloud_queue' },
  { name: 'Synthetix', icon: 'hub' },
  { name: 'DataPulse', icon: 'data_thresholding' },
  { name: 'Voxel Labs', icon: 'view_in_ar' },
  { name: 'FinTech Labs', icon: 'account_balance' },
];

const HeroSection: React.FC = () => (
  <section className="relative w-full overflow-hidden bg-surface py-12 md:py-20 lg:py-24">
    {/* Ambient backdrop glows */}
    <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#c3c0ff]/35 via-primary-container/10 to-transparent blur-3xl opacity-70" />
    <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 bg-[#6063ee]/10 rounded-full blur-2xl" />
    <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
      {/* Eyebrow pill */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-high shadow-sm">
          <span className="inline-flex w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="text-label-sm text-primary font-medium tracking-wide">
            Nền tảng phỏng vấn kỹ thuật bằng AI
          </span>
        </div>
      </div>
      {/* Heading & copy */}
      <div className="text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-display font-bold text-ink tracking-tight mb-5 leading-tight">
          Nền tảng luyện tập bằng AI nơi{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#6063ee]">
            kỹ sư xuất sắc chứng minh tay nghề.
          </span>
        </h1>
        <p className="text-body-lg text-ink-variant max-w-2xl mx-auto leading-relaxed">
          Luyện tập với các phiên phỏng vấn kỹ thuật giống thật, tương tác bằng giọng nói, được xây theo bộ tiêu chí
          chấm của các đội ngũ kỹ thuật hàng đầu. Được thẩm định một lần, bỏ qua vòng sàng lọc lặp lại và kết nối thẳng
          với các đội ngũ công nghệ tốt nhất.
        </p>
      </div>
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
        <Link
          to="/register"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-container text-on-primary text-label-md shadow-md shadow-primary-container/20 hover:bg-primary transition-all group"
        >
          <span>Bắt đầu phỏng vấn thử miễn phí với AI</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </Link>
        <a
          href="#"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-card text-ink text-label-md shadow-sm hover:bg-surface-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">play_circle</span>
          <span>Xem nền tảng tuyển dụng / Đăng tin</span>
        </a>
      </div>
      <HeroSimulation />
      {/* Trust & social proof logos */}
      <div className="text-center pt-2">
        <p className="text-label-sm uppercase tracking-wider text-ink-variant font-semibold mb-6">
          Được các đội ngũ tuyển dụng và 15.000+ kỹ sư từ những công ty công nghệ tăng trưởng nhanh tin dùng
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75">
          {LOGOS.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 text-ink text-headline-sm font-bold tracking-tight">
              <span className="material-symbols-outlined text-primary text-[20px]">{logo.icon}</span>
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const METRICS: {
  label: string;
  value: string;
  valueClass: string;
  icon?: string;
  iconColor?: string;
  suffix?: string;
  note: string;
}[] = [
  {
    label: 'Phiên đã đánh giá',
    value: '14,500+',
    valueClass: 'text-ink',
    icon: 'trending_up',
    iconColor: 'text-primary',
    note: 'Số phiên luyện đã thực hiện trên 42 nhánh kỹ thuật',
  },
  {
    label: 'Tốc độ tuyển dụng',
    value: '3.8x',
    valueClass: 'text-primary',
    suffix: 'nhanh hơn',
    note: 'Mức giảm trung bình thời gian tới offer của kỹ sư đã xác thực',
  },
  {
    label: 'Đồng thuận kỹ thuật',
    value: '94%',
    valueClass: 'text-ink',
    icon: 'handshake',
    iconColor: 'text-primary',
    note: 'Quản lý kỹ thuật đồng ý với khuyến nghị của bộ tiêu chí chấm AI',
  },
  {
    label: 'Ngưỡng sàng lọc',
    value: '62%',
    valueClass: 'text-ink',
    icon: 'target',
    iconColor: 'text-outline-strong',
    note: 'Ngưỡng đạt cơ bản của ứng viên ở lần thử đầu tiên',
  },
];

const MetricsRibbon: React.FC = () => (
  <section className="w-full bg-surface-low py-10">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {METRICS.map((metric) => (
          <div key={metric.label} className="p-5 rounded-xl bg-card shadow-sm flex flex-col justify-between">
            <span className="text-body-sm text-ink-variant font-medium">{metric.label}</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className={`text-metric-stat font-bold ${metric.valueClass}`}>{metric.value}</span>
              {metric.icon && (
                <span className={`material-symbols-outlined text-[20px] ${metric.iconColor}`}>{metric.icon}</span>
              )}
              {metric.suffix && <span className="text-label-sm font-semibold text-primary">{metric.suffix}</span>}
            </div>
            <p className="text-label-sm text-ink-variant m-0">{metric.note}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeatureVoiceWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-label-sm font-semibold text-ink">Tốc độ phản hồi giọng nói</span>
      <span className="font-mono text-[12px] leading-4 text-primary">Âm thanh thời gian thực</span>
    </div>
    <div className="flex items-center gap-2">
      <MeterBar pct={95} />
      <span className="text-label-sm text-ink-variant font-medium whitespace-nowrap">Trôi chảy tự nhiên</span>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Kiến trúc sư cấp cao</span>
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Tech Lead</span>
      <span className="px-2 py-0.5 rounded bg-card text-ink text-label-sm">Quản lý kỹ thuật</span>
    </div>
  </div>
);

const FeatureRubricWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Đánh giá công bằng &amp; khách quan</span>
      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Chế độ chấm ẩn danh</span>
      <span className="text-label-sm text-primary font-medium">Đang bật</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-label-sm text-ink">Tiêu chí chấm nhất quán</span>
      <span className="text-label-sm text-primary font-medium">Đã chuẩn hóa</span>
    </div>
  </div>
);

const FeaturePipelineWidget: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface-low shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
        <span className="material-symbols-outlined text-[18px]">bolt</span>
      </div>
      <div>
        <p className="text-label-sm font-semibold text-ink m-0">Quy trình ứng tuyển nhanh</p>
        <p className="text-body-sm text-ink-variant m-0">Bỏ qua vòng sàng lọc recruiter chung chung</p>
      </div>
    </div>
    <div className="mt-2 text-center py-1.5 rounded bg-card text-label-sm text-primary font-medium">
      Trung bình 4.2 lời mời phỏng vấn từ nhà tuyển dụng
    </div>
  </div>
);

const PILLARS: { icon: string; title: string; body: string; widget: React.ReactNode }[] = [
  {
    icon: 'mic_double',
    title: 'Luyện giọng nói & code với độ trễ bằng 0',
    body: 'Luyện tập cùng các persona kỹ thuật thích ứng (Staff Engineer, Giám đốc, Quản lý kỹ thuật). Hỏi đáp đa lượt, truy vấn edge case liên tục và chuyển giọng nói thành văn bản thời gian thực, sẽ ngắt lời khi bạn trả lời lệch chủ đề.',
    widget: <FeatureVoiceWidget />,
  },
  {
    icon: 'balance',
    title: 'Chấm điểm & bộ tiêu chí khách quan, không thiên kiến',
    body: 'Đánh giá trên năng lực kỹ thuật phần mềm cụ thể: thiết kế hệ thống, concurrency, sự chặt chẽ về thuật toán và kiến trúc sạch. Loại bỏ mệt mỏi phỏng vấn của người chấm, thiên kiến tên tuổi và nhiễu ngoài chuyên môn.',
    widget: <FeatureRubricWidget />,
  },
  {
    icon: 'forward_media',
    title: 'Quy trình tuyển dụng trực tiếp cho ứng viên đã xác thực',
    body: 'Bỏ qua hàng loạt vòng gọi điện sàng lọc HR và các bài LeetCode lặp lại. Điểm phiên luyện cao sẽ nhận chứng chỉ xác thực mã hóa, tự động gửi tới nhà tuyển dụng để vào thẳng vòng chung.',
    widget: <FeaturePipelineWidget />,
  },
];

const FeatureSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="max-w-3xl mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Lợi thế công nghệ cốt lõi
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          Được thiết kế cho độ sâu kỹ thuật, không phải đọc kịch bản có sẵn.
        </h2>
        <p className="text-body-lg text-ink-variant">
          Câu hỏi chat chung chung không thể mô phỏng vòng phỏng vấn kỹ thuật thật. AI Interview dùng máy trạng thái
          hội thoại và sandbox chạy code động để thử thách kiến trúc của bạn dưới áp lực thực.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl bg-card shadow-sm p-8 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-mid flex items-center justify-center text-primary mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[26px]">{pillar.icon}</span>
              </div>
              <h3 className="text-headline-md font-bold text-ink mb-3">{pillar.title}</h3>
              <p className="text-body-md text-ink-variant mb-6 leading-relaxed">{pillar.body}</p>
            </div>
            {pillar.widget}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const STEPS: {
  num: string;
  tag: string;
  title: string;
  body: string;
  footer: React.ReactNode;
}[] = [
  {
    num: '1',
    tag: '01 / CHUẨN BỊ',
    title: 'Chọn stack mục tiêu',
    body: 'Cài đặt kỳ vọng theo vị trí cho backend Java/Spring Boot, frontend React/Next.js, hệ phân tán hoặc ML Infrastructure.',
    footer: (
      <div className="space-y-1.5 pt-2">
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          Hệ phân tán
        </span>
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          React/Next.js
        </span>
        <span className="inline-block px-2.5 py-1 rounded bg-surface-mid text-ink text-label-sm mr-1 mb-1">
          Java / Go
        </span>
      </div>
    ),
  },
  {
    num: '2',
    tag: '02 / LUYỆN TẬP',
    title: 'Luyện tập tương tác bằng giọng nói',
    body: 'Đối thoại trực tiếp với persona AI cấp Staff trong phiên audio và lập trình 45 phút, độ phức tạp thay đổi liên tục.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-ink font-mono text-[12px] leading-4">
        <div className="flex items-center gap-1.5 text-primary mb-1">
          <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Sandbox giọng nói đang bật
        </div>
        <span>Chạy code thích ứng</span>
      </div>
    ),
  },
  {
    num: '3',
    tag: '03 / CHẨN ĐOÁN',
    title: 'Bảng điểm chẩn đoán',
    body: 'Nhận phản hồi chi tiết về các edge case bạn bỏ sót, đánh đổi về runtime thuật toán và lộ trình ôn tập đúng trọng tâm.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-ink font-mono text-[12px] leading-4 flex items-center justify-between">
        <span>Bảng điểm #DIAG-82</span>
        <span className="text-primary font-semibold">92.4 điểm</span>
      </div>
    ),
  },
  {
    num: '4',
    tag: '04 / KẾT NỐI',
    title: 'Kết nối ứng tuyển nhanh với 1 chạm',
    body: 'Điểm đã xác thực giúp bạn đi thẳng vào vòng phỏng vấn cuối của đội ngũ tuyển dụng, bỏ qua vòng sàng lọc recruiter đầu tiên.',
    footer: (
      <div className="p-3 rounded bg-surface-mid text-primary text-label-sm font-semibold text-center shadow-sm">
        Bỏ qua vòng gọi điện sơ tuyển →
      </div>
    ),
  },
];

const HowItWorksSection: React.FC = () => (
  <section className="w-full bg-surface-low py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Quy trình tuyển dụng nhất quán
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          Cách AI Interview giúp bạn được tuyển qua 4 bước đơn giản
        </h2>
        <p className="text-body-lg text-ink-variant">
          Từ chọn nhánh công nghệ mục tiêu, luyện tập thời gian thực, chấm điểm chẩn đoán cho tới đưa thẳng vào vòng
          chung đã xác thực.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.num} className="rounded-xl bg-card p-6 shadow-sm flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-headline-sm flex items-center justify-center shadow-sm">
                  {step.num}
                </span>
                <span className="font-mono text-[12px] leading-4 text-ink-variant">{step.tag}</span>
              </div>
              <h4 className="text-headline-sm font-bold text-ink mb-2">{step.title}</h4>
              <p className="text-body-sm text-ink-variant mb-6">{step.body}</p>
            </div>
            {step.footer}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const AUDIENCE_CARDS: {
  badge: string;
  badgeClass: string;
  cardClass: string;
  icon: string;
  title: string;
  body: string;
  bulletIcon: string;
  bullets: React.ReactNode[];
  cta: string;
}[] = [
  {
    badge: 'Dành cho ứng viên kỹ thuật',
    badgeClass: 'bg-surface-mid text-primary',
    cardClass: 'bg-card',
    icon: 'person_celebrate',
    title: 'Nâng tay nghề dưới áp lực thật, rồi chứng minh điều đó.',
    body: 'Không còn phải đoán lý do bị từ chối bằng email mẫu. Nhận bộ tiêu chí chấm máy chi tiết, tái lập được cho từng câu trả lời về kiến trúc, và lấy chứng chỉ được doanh nghiệp coi trọng.',
    bulletIcon: 'check_circle',
    bullets: [
      <>
        <strong>Luyện giọng nói không giới hạn</strong> theo khung năng lực phần mềm L4-L7.
      </>,
      <>
        <strong>Scratchpad code &amp; phân tích AST thời gian thực</strong> kèm gợi ý cú pháp và phân tích độ phức
        tạp thời gian.
      </>,
      <>
        <strong>Lộ trình ôn kiến trúc cụ thể</strong> chỉ ra rủi ro concurrency và lỗi trôi dữ liệu.
      </>,
      <>
        <strong>Huy hiệu chứng chỉ xác thực bằng mật mã</strong> được các tổ chức kỹ thuật đối tác công nhận.
      </>,
    ],
    cta: 'Xem nhánh luyện tập cho ứng viên',
  },
  {
    badge: 'Dành cho đội ngũ kỹ thuật hiện đại',
    badgeClass: 'bg-card text-primary shadow-sm',
    cardClass: 'bg-surface-high',
    icon: 'apartment',
    title: 'Lấy lại hơn 15 giờ mỗi tuần của kỹ sư cấp cao.',
    body: 'Bỏ vòng sàng lọc coding đầu tiên lặp lại mà vẫn giữ độ khắt khe về kỹ thuật. Nhận bản ghi code đầy đủ của ứng viên, các đánh đổi kiến trúc và nhật ký quyết định đã kiểm toán theo EEOC.',
    bulletIcon: 'verified',
    bullets: [
      <>
        <strong>Sàng lọc kỹ thuật vòng 1 tự động</strong> hiệu chỉnh theo stack production của bạn.
      </>,
      <>
        <strong>Chấm theo bộ tiêu chí tái lập</strong> quy chiếu thẳng vào tiêu chí Staff/Principal.
      </>,
      <>
        <strong>Nhật ký kiểm toán đạt chuẩn SOC-2 Type II</strong> kèm dữ liệu giảm thiểu tác động bất lợi theo EEOC.
      </>,
      <>
        <strong>Tích hợp ATS trực tiếp</strong> với Greenhouse, Lever, Ashby và Workday.
      </>,
    ],
    cta: 'Đặt lịch demo nền tảng kỹ thuật',
  },
];

const DualAudienceSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
          Chuẩn hóa cân bằng hai phía
        </span>
        <h2 className="text-headline-lg font-bold text-ink mb-4">
          Xây cho cả ứng viên năng lực cao và đội ngũ kỹ thuật hiện đại
        </h2>
        <p className="text-body-lg text-ink-variant">
          Kỹ sư muốn luyện tập đúng thực tế mà không mất thời gian. Người quản lý tuyển dụng muốn chắc chắn về kỹ
          thuật mà không phải gánh 12 giờ phỏng vấn mỗi tuần.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {AUDIENCE_CARDS.map((card) => (
          <div key={card.badge} className={`rounded-2xl p-8 lg:p-10 shadow-sm flex flex-col justify-between ${card.cardClass}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-label-sm font-semibold ${card.badgeClass}`}>
                  {card.badge}
                </span>
                <span className="material-symbols-outlined text-[24px] text-primary">{card.icon}</span>
              </div>
              <h3 className="text-headline-lg font-bold text-ink mb-4">{card.title}</h3>
              <p className="text-body-md text-ink-variant mb-8 leading-relaxed">{card.body}</p>
              <ul className="space-y-4 mb-8">
                {card.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                      {card.bulletIcon}
                    </span>
                    <span className="text-body-md text-ink">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6">
              <a href="#" className="inline-flex items-center gap-2 text-label-md text-primary font-medium hover:underline">
                <span>{card.cta}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SANDBOX_LANGS = ['Go 1.22', 'Rust 1.78', 'Java 21', 'TypeScript 5.4', 'Python 3.12'];

const CodeSandboxSection: React.FC = () => (
  <section className="w-full bg-surface-low py-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="rounded-2xl bg-card p-8 lg:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-2">
              Sandbox code tương tác
            </span>
            <h3 className="text-headline-lg font-bold text-ink mb-3">Chạy đa ngôn ngữ trực tiếp</h3>
            <p className="text-body-md text-ink-variant mb-6 leading-relaxed">
              Trình soạn thảo code trực tiếp với phản hồi test tức thì. Viết và chạy code thật trên các edge case và
              unit test động, trong khi bạn trình bày giả định về kiến trúc.
            </p>
            <div className="flex items-center gap-2 font-mono text-[12px] leading-4 text-ink-variant mb-6 flex-wrap">
              {SANDBOX_LANGS.map((lang) => (
                <span key={lang} className="px-2 py-1 rounded bg-surface-mid">
                  {lang}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-label-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-primary" /> Phát hiện rò rỉ bộ nhớ
              </span>
              <span className="flex items-center gap-1.5 text-label-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-primary" /> Log tranh chấp thread
              </span>
            </div>
          </div>
          {/* Code sandbox preview window */}
          <div className="lg:col-span-7 rounded-xl bg-surface-mid shadow-md overflow-hidden">
            <div className="h-9 px-4 bg-surface-high flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-mono text-[12px] leading-4 text-ink">Sẵn sàng chạy</span>
              </div>
              <span className="font-mono text-[12px] leading-4 text-ink-variant">Sẵn sàng chạy</span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-4 text-ink overflow-x-auto">
              <pre className="leading-relaxed m-0">
                <code>
                  <span className="text-secondary font-semibold">public class</span>{' '}
                  <span className="text-primary font-semibold">DistributedLeaseManager</span>
                  {' {\n'}
                  {'    '}
                  <span className="text-ink-variant">
                    // AI Probe: Check TTL expiration edge cases during stop-the-world GC
                  </span>
                  {'\n    '}
                  <span className="text-secondary font-semibold">public boolean</span> acquireLock(String
                  resourceId, <span className="text-secondary">long</span> ttlMillis) {'{\n'}
                  {'        '}String token = UUID.randomUUID().toString();{'\n        '}
                  <span className="text-secondary font-semibold">boolean</span> locked =
                  redisClient.setIfAbsent(resourceId, token, ttlMillis);{'\n        '}
                  <span className="text-secondary font-semibold">if</span> (!locked) {'{\n'}
                  {'            '}
                  <span className="text-secondary font-semibold">throw new</span> LockContentionException(
                  <span className="text-ink-variant">"Active lease holder exists"</span>);{'\n        }\n'}
                  {'        '}
                  <span className="text-secondary font-semibold">return</span> scheduleFencingHeartbeat(resourceId,
                  token);{'\n    }\n}'}
                </code>
              </pre>
            </div>
            <div className="px-4 py-2.5 bg-surface-high flex items-center justify-between">
              <span className="text-label-sm text-primary font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Toàn bộ test tự động đều đạt
              </span>
              <span className="text-label-sm text-ink-variant">Giải pháp sạch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCtaSection: React.FC = () => (
  <section className="w-full bg-surface py-20 lg:py-24 relative overflow-hidden">
    <div className="max-w-5xl mx-auto px-6 lg:px-12 relative">
      <div className="rounded-3xl bg-surface-high p-8 md:p-14 text-center shadow-lg relative overflow-hidden">
        {/* Accent glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#c3c0ff]/60 blur-3xl rounded-full" />
        <span className="text-label-sm uppercase tracking-wider text-primary font-semibold block mb-3">
          Có đánh giá tức thì
        </span>
        <h2 className="text-display font-bold text-ink mb-4 max-w-2xl mx-auto">
          Sẵn sàng đo mức sẵn sàng kỹ thuật của bạn?
        </h2>
        <p className="text-body-lg text-ink-variant max-w-xl mx-auto mb-8">
          Tham gia cùng hàng nghìn kỹ sư đang thử thách kỹ năng trong điều kiện phỏng vấn thật và kết nối trực tiếp
          với các công ty công nghệ chất lượng.
        </p>
        <div className="max-w-md mx-auto mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-4 py-3 rounded-lg bg-card text-ink text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-ink-variant/70"
              placeholder="Nhập email của bạn"
              type="email"
            />
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary shadow-md shadow-primary-container/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Bắt đầu luyện tập</span>
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-ink-variant text-body-sm flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">credit_card_off</span> Không cần thẻ
            tín dụng
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span> AI phản hồi tức thì
            trong &lt;60s
          </span>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const LandingPage: React.FC = () => (
  <div className="bg-surface min-h-screen">
    <SiteHeader />
    <main className="w-full pt-16 bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        <HeroSection />
        <MetricsRibbon />
        <FeatureSection />
        <HowItWorksSection />
        <DualAudienceSection />
        <CodeSandboxSection />
        <FinalCtaSection />
      </div>
    </main>
    <SiteFooter tagline="© 2025 AI Interview Inc. Bảo lưu mọi quyền." />
  </div>
);

export default LandingPage;
