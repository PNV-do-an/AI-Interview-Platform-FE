import React from 'react';
import { Link } from 'react-router-dom';

type IconName = 'arrow' | 'spark' | 'briefcase' | 'users' | 'file' | 'play' | 'check' | 'mic';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
};

const Icon: React.FC<{ name: IconName; className?: string }> = ({ name, className = 'h-5 w-5' }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.7"
    viewBox="0 0 24 24"
  >
    {ICON_PATHS[name]}
  </svg>
);

export const LandingHero: React.FC = () => (
  <section aria-labelledby="landing-title" className="relative isolate mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[650px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:px-10 lg:pb-24 lg:pt-16">
    <div aria-hidden="true" className="landing-orbit pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 overflow-hidden lg:block">
      <span className="landing-orbit__ring landing-orbit__ring--outer" />
      <span className="landing-orbit__ring landing-orbit__ring--inner" />
      <span className="landing-orbit__glow" />
    </div>

    <div className="landing-hero-copy relative z-10 max-w-[600px]">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-[11px] font-bold tracking-[0.13em] text-indigo-700 shadow-sm shadow-indigo-100/50">
        <span className="landing-status-dot h-2 w-2 rounded-full bg-teal-500" />
        LỘ TRÌNH NGHỀ NGHIỆP CỦA BẠN
      </div>
      <h1 id="landing-title" className="mt-7 text-[clamp(2.8rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.065em] text-slate-950">
        Phỏng vấn tự tin.
        <span className="relative mt-1 block w-fit text-indigo-600">
          Tìm đúng cơ hội.
          <span aria-hidden="true" className="landing-title-swipe absolute -bottom-1 left-1 h-[9px] w-[92%] rounded-full bg-teal-300/80" />
        </span>
      </h1>
      <p className="mt-7 max-w-[510px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
        Tập dượt cùng AI, nhận phản hồi rõ ràng và khám phá những công việc phù hợp — tất cả trong một hành trình.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/register" className="landing-primary-button group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Bắt đầu miễn phí
          <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        <Link to="/ai-interview" className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          <span className="text-indigo-600"><Icon name="play" className="h-[18px] w-[18px]" /></span>
          Khám phá phỏng vấn AI
        </Link>
      </div>
      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-slate-200/80 pt-6">
        <div>
          <p className="text-xl font-semibold tracking-tight text-slate-900">50.000<span className="text-indigo-600">+</span></p>
          <p className="mt-0.5 text-xs text-slate-500">ứng viên đồng hành</p>
        </div>
        <span aria-hidden="true" className="h-9 w-px bg-slate-200" />
        <div>
          <p className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-slate-900"><span className="text-amber-400">★</span> 4,9<span className="text-sm font-medium text-slate-400">/5</span></p>
          <p className="mt-0.5 text-xs text-slate-500">đánh giá từ cộng đồng</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
          <span className="flex -space-x-2" aria-hidden="true">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#faf9f6] bg-[#e7ddff] text-[10px] font-bold text-violet-700">A</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#faf9f6] bg-[#d9f5eb] text-[10px] font-bold text-emerald-700">M</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#faf9f6] bg-[#ffe9d7] text-[10px] font-bold text-orange-700">L</span>
          </span>
          Cộng đồng đang phát triển
        </div>
      </div>
    </div>

    <div className="landing-hero-visual relative mx-auto w-full max-w-[590px] lg:ml-auto">
      <div aria-hidden="true" className="landing-visual-backdrop absolute -inset-4 rounded-[2.5rem] bg-indigo-100/50" />
      <div className="landing-visual-frame relative aspect-[0.94] overflow-hidden rounded-[1.8rem] border border-white/80 bg-slate-200 shadow-[0_30px_80px_-24px_rgba(39,35,91,0.32)] sm:aspect-[1.08] sm:rounded-[2rem]">
        <img
          src="/interview-hero.png"
          alt="Ứng viên Việt Nam đang tự tin luyện phỏng vấn trực tuyến trong văn phòng hiện đại"
          className="landing-portrait h-full w-full object-cover object-[58%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-6 sm:right-6 sm:top-6">
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-slate-950/45 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md sm:text-xs">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-teal-200"><Icon name="spark" className="h-4 w-4" /></span>
            AI Interview Coach
          </div>
          <span className="rounded-full border border-white/20 bg-slate-950/45 px-3 py-2 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-md sm:text-[11px]">MÔ PHỎNG 1:1</span>
        </div>
        <div className="landing-float absolute bottom-5 left-4 w-[min(15rem,60%)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl shadow-slate-950/15 backdrop-blur-xl sm:bottom-7 sm:left-6 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500">ĐIỂM PHỎNG VẤN</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-slate-900">86<span className="ml-1 text-sm font-medium tracking-normal text-slate-400">/100</span></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Icon name="check" className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="landing-meter-fill block h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" /></div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">Rõ ràng · Tự tin · Có trọng tâm</p>
        </div>
        <div className="landing-float landing-float--delayed absolute bottom-7 right-4 hidden max-w-[215px] rounded-2xl border border-white/60 bg-slate-950/75 p-4 text-white shadow-xl shadow-slate-950/20 backdrop-blur-xl sm:block sm:right-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-teal-200"><Icon name="spark" className="h-3.5 w-3.5" /> Gợi ý luyện tập</div>
          <p className="mt-2 text-xs leading-5 text-white/90">Thử bổ sung một kết quả cụ thể để câu trả lời thuyết phục hơn.</p>
          <div className="landing-wave mt-3 flex h-5 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 17 }, (_, index) => <span key={index} />)}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="landing-spark landing-spark--one absolute -right-3 top-[22%] h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_24px_8px_rgba(94,234,212,0.35)]" />
      <div aria-hidden="true" className="landing-spark landing-spark--two absolute -left-5 top-[40%] h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_18px_7px_rgba(129,140,248,0.3)]" />
    </div>
  </section>
);

const TRUSTED_NAMES = ['VNG', 'FPT Software', 'Viettel', 'Shopee', 'PayOS'];

export const TrustStrip: React.FC = () => (
  <section aria-label="Đối tác và doanh nghiệp đồng hành" className="border-y border-slate-200/75 bg-white/65">
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
      <p className="max-w-[220px] text-xs font-semibold leading-5 text-slate-500">Được tin dùng bởi 500+ doanh nghiệp &amp; trường đại học</p>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 md:justify-end md:gap-x-10">
        {TRUSTED_NAMES.map((name, index) => <span key={name} className={`text-sm font-bold tracking-tight text-slate-400 transition-colors hover:text-slate-700 sm:text-base ${index === 1 ? 'italic' : ''}`}>{name}</span>)}
      </div>
    </div>
  </section>
);

const FEATURES: Array<{ icon: IconName; eyebrow: string; title: string; description: string; link: string; to: string; accent: string }> = [
  {
    icon: 'mic', eyebrow: 'LUYỆN TẬP THÔNG MINH', title: 'Phỏng vấn cùng AI',
    description: 'Thực hành theo vị trí bạn nhắm tới. Nhận gợi ý để trả lời mạch lạc và thể hiện đúng thế mạnh.',
    link: 'Khám phá phòng luyện tập', to: '/ai-interview', accent: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: 'briefcase', eyebrow: 'CƠ HỘI PHÙ HỢP', title: 'Tìm việc làm',
    description: 'Khám phá các vị trí tuyển dụng và tìm bước tiếp theo phù hợp với kinh nghiệm của bạn.',
    link: 'Xem việc làm', to: '/opportunities', accent: 'bg-teal-50 text-teal-700',
  },
  {
    icon: 'file', eyebrow: 'HỒ SƠ SẴN SÀNG', title: 'Tạo CV chuyên nghiệp',
    description: 'Hoàn thiện thông tin, kinh nghiệm và kỹ năng để xây dựng hồ sơ nổi bật, sẵn sàng ứng tuyển.',
    link: 'Bắt đầu tạo CV', to: '/my-profile', accent: 'bg-violet-50 text-violet-700',
  },
];

export const FeatureSection: React.FC = () => (
  <section id="features" aria-labelledby="features-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
    <div data-reveal className="max-w-2xl">
      <p className="text-xs font-bold tracking-[0.16em] text-indigo-600">MỘT NỀN TẢNG · NHIỀU CƠ HỘI</p>
      <h2 id="features-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl">CV tốt, phỏng vấn tự tin, cơ hội rộng mở.</h2>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Tạo hồ sơ chuyên nghiệp, luyện tập cùng AI và tìm công việc phù hợp — tất cả trên một nền tảng.</p>
    </div>
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <Link
          key={feature.title}
          to={feature.to}
          data-reveal
          style={{ transitionDelay: `${index * 100}ms` }}
          className="group relative flex min-h-[270px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 no-underline shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_22px_46px_-28px_rgba(59,52,126,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-7"
        >
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.accent}`}><Icon name={feature.icon} className="h-5 w-5" /></span>
          <p className="mt-6 text-[10px] font-bold tracking-[0.14em] text-slate-400">{feature.eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{feature.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
          <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-indigo-700">
            {feature.link}<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </span>
          <span aria-hidden="true" className="landing-card-line absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-violet-400 to-teal-400 transition-transform duration-500 group-hover:scale-x-100" />
        </Link>
      ))}
    </div>
  </section>
);

const STEPS = [
  { number: '01', title: 'Tạo CV chuyên nghiệp', text: 'Hoàn thiện thông tin, kinh nghiệm và kỹ năng để hồ sơ sẵn sàng ứng tuyển.' },
  { number: '02', title: 'Luyện tập & nhận góp ý', text: 'Thực hành theo tình huống thực tế và nhận gợi ý sau mỗi lượt.' },
  { number: '03', title: 'Tiến gần cơ hội mới', text: 'Ứng tuyển tự tin vào những công việc phù hợp với mục tiêu của bạn.' },
];

export const HowItWorksSection: React.FC = () => (
  <section id="how-it-works" aria-labelledby="steps-title" className="bg-[#f0eff9]">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-10">
      <div data-reveal className="max-w-md">
        <p className="text-xs font-bold tracking-[0.16em] text-indigo-600">BẮT ĐẦU THẬT DỄ DÀNG</p>
        <h2 id="steps-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl">Một bước nhỏ hôm nay. Một bước tiến lớn ngày mai.</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">Bạn không cần có sẵn mọi câu trả lời. Chỉ cần bắt đầu với mục tiêu tiếp theo.</p>
        <Link to="/register" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
          Tạo tài khoản miễn phí<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
        </Link>
      </div>
      <div className="relative">
        <span aria-hidden="true" className="absolute bottom-10 left-[27px] top-10 hidden w-px bg-gradient-to-b from-indigo-300 via-violet-200 to-transparent sm:block" />
        <ol className="relative space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.number} data-reveal style={{ transitionDelay: `${index * 120}ms` }} className="group relative flex gap-5 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm transition duration-300 hover:translate-x-1 hover:bg-white sm:gap-6 sm:p-6">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-sm font-bold tracking-wide text-indigo-700 transition-colors group-hover:bg-indigo-600 group-hover:text-white">{step.number}</span>
              <div className="pt-1">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

export const ClosingSection: React.FC = () => (
  <section aria-labelledby="closing-title" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
    <div data-reveal className="landing-cta-panel relative isolate overflow-hidden rounded-[2rem] bg-[#191739] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16">
      <span aria-hidden="true" className="landing-cta-orbit landing-cta-orbit--one" />
      <span aria-hidden="true" className="landing-cta-orbit landing-cta-orbit--two" />
      <div className="relative z-10 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-teal-200">BƯỚC TIẾP THEO BẮT ĐẦU TỪ BẠN</p>
        <h2 id="closing-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">Sẵn sàng cho cơ hội tiếp theo?</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base sm:leading-7">Tạo CV nổi bật, luyện tập theo nhịp độ của riêng bạn và khám phá những cơ hội mới.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link to="/my-profile" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-800 no-underline transition hover:-translate-y-0.5 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Tạo CV ngay<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link to="/opportunities" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Khám phá việc làm</Link>
        </div>
      </div>
      <div aria-hidden="true" className="landing-cta-mark absolute bottom-[-7rem] right-[-4rem] hidden h-[28rem] w-[28rem] rounded-full border border-white/10 lg:block">
        <span className="absolute inset-8 rounded-full border border-white/10" />
        <span className="absolute inset-16 rounded-full border border-white/10" />
        <span className="absolute inset-24 rounded-full border border-teal-200/20" />
        <span className="landing-cta-star absolute left-8 top-14 h-3 w-3 rounded-full bg-teal-200 shadow-[0_0_30px_12px_rgba(94,234,212,0.28)]" />
      </div>
    </div>
  </section>
);
