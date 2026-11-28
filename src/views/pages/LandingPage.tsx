import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '../layout/PublicShell';

const ICON = 'material-symbols-outlined';

const offerings = [
  {
    number: '01',
    icon: 'graphic_eq',
    title: 'Tập nói với một hành tinh khác',
    description: 'Phỏng vấn mô phỏng bằng AI, câu hỏi theo vị trí và phản hồi đủ cụ thể để lần sau bạn nói khác đi.',
    link: '/ai-interview',
    action: 'Thử phòng luyện',
    tone: 'lavender',
  },
  {
    number: '02',
    icon: 'description',
    title: 'Cho CV đi soi gương',
    description: 'Tìm điểm mạnh, chỗ còn hụt và cách chỉnh hồ sơ cho vị trí bạn thực sự muốn.',
    link: '/register',
    action: 'Mở hồ sơ nghề nghiệp',
    tone: 'lime',
  },
  {
    number: '03',
    icon: 'travel_explore',
    title: 'Rẽ sang một quỹ đạo mới',
    description: 'Khám phá cơ hội làm việc, theo dõi đơn và tiến gần hơn tới cuộc trò chuyện tiếp theo.',
    link: '/opportunities',
    action: 'Khám phá công việc',
    tone: 'coral',
  },
];

function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:min-h-[650px] lg:grid-cols-[1.03fr_0.97fr] lg:gap-4 lg:px-10 lg:pb-20">
      <div className="relative z-10 flex flex-col items-start">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9d0c3] bg-[#fffdf7] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#604273] sm:text-xs">
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ee795f] opacity-50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#ee795f]" />
          </span>
          Phòng thí nghiệm sự nghiệp · Việt Nam
        </span>
        <h1 className="max-w-3xl text-[clamp(3.2rem,5.3vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.075em] text-[#28212e]">
          Phỏng vấn,
          <br />
          nhưng lần này
          <br />
          <span className="relative inline-block text-[#604273]">
            khác hành tinh.
            <span className="absolute -bottom-1 left-0 -z-10 h-[0.28em] w-[95%] -rotate-2 rounded-full bg-[#d5ef6c]" aria-hidden="true" />
          </span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-[#6f6675] sm:text-lg sm:leading-8">
          Luyện phỏng vấn cùng AI, làm hồ sơ sáng rõ hơn và tìm công việc hợp với phiên bản tiếp theo của bạn.
          Bớt đoán mò. Thêm vài lần diễn tập có ích.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/register" className="public-cta inline-flex min-h-14 items-center justify-center gap-3 rounded-[1.15rem] px-6 text-sm font-bold no-underline sm:text-base">
            Bắt đầu chuyến thử
            <span className={ICON} aria-hidden="true">arrow_outward</span>
          </Link>
          <Link to="/ai-interview" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.15rem] border border-[#d9d0c3] bg-[#fffdf7] px-6 text-sm font-bold text-[#28212e] no-underline transition hover:-translate-y-0.5 hover:border-[#604273] sm:text-base">
            <span className={ICON} aria-hidden="true">play_circle</span>
            Xem phòng AI
          </Link>
        </div>
        <div className="mt-9 flex items-center gap-3 text-xs leading-5 text-[#6f6675]">
          <span className="flex -space-x-2" aria-hidden="true">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f3efe6] bg-[#e9dff0] text-[10px] font-bold text-[#604273]">CV</span>
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f3efe6] bg-[#d5ef6c] text-[10px] font-bold text-[#39431b]">AI</span>
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f3efe6] bg-[#f6d0c5] text-[10px] font-bold text-[#6b3024]">↗</span>
          </span>
          <span>Không gian thử nghiệm cho người đang<br className="hidden sm:block" /> nghĩ về bước đi kế tiếp.</span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[620px] items-center justify-center lg:min-h-[560px]">
        <div className="absolute inset-[8%] rounded-[46%_54%_60%_40%/42%_44%_56%_58%] bg-[#e9dff0]" aria-hidden="true" />
        <div className="orbit-ring absolute inset-[5%] rounded-full border border-dashed border-[#604273]/40" aria-hidden="true" />
        <div className="orbit-ring absolute inset-[15%] rounded-full border border-[#604273]/20" style={{ animationDirection: 'reverse', animationDuration: '42s' }} aria-hidden="true" />
        <img
          src="/images/interview-orbit.png"
          alt="Một sinh vật ngoài hành tinh thân thiện đang luyện phỏng vấn bên chiếc micro và hồ sơ bay lơ lửng"
          className="orbit-art relative z-10 w-full drop-shadow-[0_24px_22px_rgba(53,35,68,0.16)]"
        />
        <div className="tape-label absolute left-0 top-[16%] z-20 rounded-lg bg-[#d5ef6c] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#39431b] shadow-sm sm:left-[3%] sm:text-xs">
          Tín hiệu ổn định-ish
        </div>
        <div className="absolute bottom-[8%] right-0 z-20 max-w-[210px] rounded-2xl border border-[#d9d0c3] bg-[#fffdf7] p-4 shadow-[6px_6px_0_rgba(96,66,115,0.16)] sm:right-[2%]">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f6675]">Trạm phản hồi</p>
          <p className="mb-0 mt-2 text-sm font-semibold leading-5 text-[#28212e]">“Thử kể lại bằng một ví dụ thật.”</p>
          <div className="mt-3 flex items-center gap-1" aria-hidden="true">
            {[12, 22, 15, 30, 18, 25, 10, 21].map((height, index) => (
              <span key={index} className="w-1 rounded-full bg-[#604273]" style={{ height }} />
            ))}
          </div>
        </div>
        <span className="absolute right-[8%] top-[9%] z-20 flex size-12 rotate-12 items-center justify-center rounded-full bg-[#ee795f] font-mono text-xs font-bold text-[#321c19] shadow-md sm:size-14 sm:text-sm" aria-label="Trạm số 01">
          01
        </span>
      </div>
    </section>
  );
}

function SignalStrip() {
  return (
    <div className="overflow-hidden border-y border-[#28212e]/15 bg-[#28212e] text-[#fffdf7]" aria-label="Nền tảng nghề nghiệp">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] sm:gap-x-8 sm:text-xs">
        <span>Thực hành</span><span className="text-[#d5ef6c]" aria-hidden="true">✳</span>
        <span>Nhận phản hồi</span><span className="text-[#ee795f]" aria-hidden="true">✳</span>
        <span>Tìm cơ hội</span><span className="text-[#d5ef6c]" aria-hidden="true">✳</span>
        <span>Lặp lại khi cần</span>
      </div>
    </div>
  );
}

function Offerings() {
  return (
    <section id="trạm" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#ee795f]">Ba cánh cửa, một hành trình</span>
          <h2 className="mt-3 max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.06em] text-[#28212e] sm:text-5xl">
            Không cần biết hết.<br />Chỉ cần bắt đầu ở đâu đó.
          </h2>
        </div>
        <p className="mb-1 max-w-sm text-sm leading-6 text-[#6f6675]">Một nền tảng, vài công cụ thực tế, không có bài kiểm tra xem bạn có phải người ngoài hành tinh hay không.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {offerings.map((item) => (
          <article key={item.number} className={`odd-card flex min-h-[310px] flex-col rounded-[1.6rem] p-6 sm:p-7 ${item.tone === 'lavender' ? 'bg-[#e9dff0]' : item.tone === 'lime' ? 'bg-[#e8f2be]' : 'bg-[#f6d0c5]'}`}>
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-bold tracking-widest text-[#6f6675]">/{item.number}</span>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-[#28212e]/15 bg-[#fffdf7]/70 text-[#604273]"><span className={ICON} aria-hidden="true">{item.icon}</span></span>
            </div>
            <h3 className="mb-0 mt-9 max-w-[16rem] text-2xl font-bold leading-tight tracking-[-0.04em] text-[#28212e]">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#514957]">{item.description}</p>
            <Link to={item.link} className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-bold text-[#4f3569] no-underline hover:underline">
              {item.action}<span className={ICON} aria-hidden="true">arrow_forward</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: 'waving_hand', title: 'Chọn điểm xuất phát', copy: 'Một vị trí muốn thử, một CV cần chỉnh, hay một buổi phỏng vấn sắp tới.' },
    { icon: 'forum', title: 'Thử trong vùng an toàn', copy: 'Diễn tập, nghe lại, xem gợi ý. Lỡ nói vấp cũng chẳng có ai chấm công.' },
    { icon: 'rocket_launch', title: 'Mang điều tốt ra ngoài', copy: 'Dùng phần đã luyện để nộp hồ sơ và bước vào cuộc gặp thật tự tin hơn.' },
  ];

  return (
    <section className="border-y border-[#28212e]/10 bg-[#fffdf7]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div className="relative">
          <span className="inline-block -rotate-2 rounded-md bg-[#d5ef6c] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#39431b]">Sơ đồ tàu vũ trụ nghề nghiệp</span>
          <h2 className="mt-5 max-w-lg text-4xl font-bold leading-[1.02] tracking-[-0.06em] text-[#28212e] sm:text-5xl">Ba bước nhỏ.<br /><span className="text-[#604273]">Không cần áo phi hành gia.</span></h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#6f6675]">AI Interview gom những công cụ chuẩn bị nghề nghiệp vào một nơi để bạn tập trước khi cơ hội thật xuất hiện.</p>
          <Link to="/opportunities" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#604273] no-underline hover:underline">Đi xem bản đồ cơ hội<span className={ICON} aria-hidden="true">north_east</span></Link>
          <div className="absolute -bottom-8 right-6 hidden size-16 rotate-12 items-center justify-center rounded-full border border-dashed border-[#ee795f] font-mono text-[10px] font-bold uppercase text-[#ee795f] lg:flex" aria-hidden="true">đi<br />thử!</div>
        </div>
        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {steps.map((step, index) => (
            <li key={step.title} className="relative grid grid-cols-[3.25rem_1fr] gap-4 border-b border-[#d9d0c3] py-6 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[4rem_1fr] sm:gap-6">
              <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-[#e9dff0] text-[#604273] sm:size-14"><span className={ICON} aria-hidden="true">{step.icon}</span></span>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ee795f]">Tín hiệu 0{index + 1}</span>
                <h3 className="mb-0 mt-1 text-xl font-bold tracking-[-0.03em] text-[#28212e]">{step.title}</h3>
                <p className="mb-0 mt-2 max-w-lg text-sm leading-6 text-[#6f6675]">{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalTransmission() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#604273] px-6 py-12 text-[#fffdf7] sm:px-10 sm:py-16 lg:px-16">
        <div className="absolute -right-16 -top-24 size-64 rounded-full border border-[#fffdf7]/20 sm:size-80" aria-hidden="true" />
        <div className="absolute -right-4 -top-12 size-48 rounded-full border border-dashed border-[#d5ef6c]/60 sm:size-64" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#d5ef6c]">Một tín hiệu cuối trước khi hạ cánh</span>
          <h2 className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.06em] sm:text-6xl">Cơ hội kế tiếp<br />đang ở ngoài kia.</h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[#f2eaf4] sm:text-base">Tập một vòng, chỉnh một dòng CV, hoặc đơn giản là xem công việc nào đang gọi tên bạn.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="public-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold no-underline">Tạo tài khoản<span className={ICON} aria-hidden="true">arrow_outward</span></Link>
            <Link to="/opportunities" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#fffdf7]/40 px-5 text-sm font-bold text-[#fffdf7] no-underline hover:bg-[#fffdf7]/10">Xem việc làm<span className={ICON} aria-hidden="true">north_east</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const LandingPage: React.FC = () => (
  <PublicShell>
    <div className="odd-home">
      <LandingHero />
      <SignalStrip />
      <Offerings />
      <HowItWorks />
      <FinalTransmission />
    </div>
  </PublicShell>
);

export default LandingPage;
