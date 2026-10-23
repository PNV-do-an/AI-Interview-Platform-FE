import React, { useState } from 'react';
import { Badge } from '../components/ui';

/**
 * Static screen ported from Stitch mockups:
 *   ai_interview_engine_rubric_studio_1 + ai_interview_engine_rubric_studio_2
 * Both states of the same studio are merged into ONE page:
 *  - the mockup's own editor tabs are reused as the state switch (6 tabs = 3 prompts of state 1 + 3 of state 2);
 *  - duplicated blocks (persona selector, guardrails, rubric weights, cutoffs, playground modal) are kept once
 *    from the richer state; unique blocks (domain anchors, sandbox env, donut visual, waveform, feedback preview) all ship.
 *
 * Token mapping (mockup -> frontend/tailwind.config.js "Precision Intelligence"):
 *  surface-container-lowest->card, low->surface-low, container->surface-mid, high->surface-high,
 *  on-surface->ink, on-surface-variant->ink-variant, outline(#777587)->outline-strong, outline-variant(#c7c4d8)->outline,
 *  font-code-inline/text-code-inline -> font-mono text-[12px].
 * Mockup colors with no token (kept as hex literals):
 *  tertiary #313ba4, secondary-container #6063ee, tertiary-container #4a55be, surface-container-highest #dae2fd.
 * primary-fixed #e2dfff equals the `info` token -> bg-info.
 */

const CARD = 'flex flex-col gap-3 rounded-lg border border-surface-mid bg-card p-4 shadow-sm';

const SectionTitle: React.FC<{ icon: string; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1">
      <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      <h2 className="m-0 text-headline-sm text-ink">{title}</h2>
    </div>
    {right}
  </div>
);

// ---- prompt editor content (both studio states) ----------------------------

const H: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-[#313ba4]">{children}</span>; // mockup text-tertiary
const K: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-medium text-secondary">{children}</span>;
const V: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="rounded bg-surface-high px-1 text-ink">{children}</span>;
const PR: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-medium text-primary">{children}</span>;
const IND = 'pl-6';

interface PromptTabDef {
  id: string;
  label: string;
  lines: React.ReactNode[];
}

const PROMPT_TABS: PromptTabDef[] = [
  {
    id: 'directive',
    label: 'System Prompt & Chân dung',
    lines: [
      <H># SYSTEM PROMPT: AI PHỎNG VẤN KỸ THUẬT (ARIA)</H>,
      <><K>VAI TRÒ</K>: Giám khảo kỹ thuật chính, đánh giá ứng viên <V>{'{candidate_name}'}</V> cho <V>{'{role_level}'}</V>.</>,
      <><K>LĨNH VỰC</K>: Kiến trúc thông lượng cao, đồng thời phân tán, phân mảnh dữ liệu.</>,
      '',
      <H>## 1. MỞ ĐẦU PHỎNG VẤN &amp; ĐẶT BÀI TOÁN</H>,
      '- Chào đón ứng viên thân thiện, giới thiệu mình là Aria và nêu khuôn khổ buổi vấn đáp kỹ thuật 45 phút.',
      '- Đưa đề bài kiến trúc cốt lõi: "Thiết kế bộ điều phối idempotency nhất quán toàn cục cho nền tảng thanh toán phân tán xử lý 50k giao dịch/giây trên các cụm đa vùng."',
      '',
      <H>## 2. ĐÀO SÂU KIỂU SOCRATIC &amp; ĐÁNH GIÁ ĐÁNH ĐỔI</H>,
      '- Khai thác sâu các quyết định ở tầng dữ liệu: đánh đổi định lý CAP (CP vs AP), cách ly phân vùng và hồ sơ độ trễ.',
      '- Nếu ứng viên đề xuất khóa Redis đơn lẻ: hỏi về TTL hết hạn khi GC pause kéo dài hoặc mạng bị phân vùng.',
      '- Yêu cầu ứng viên so sánh Two-Phase Commit (2PC), mẫu Saga và đồng thuận Raft để dung hòa trạng thái.',
      '- Đánh giá cách giảm thiểu lỗi: circuit breaking, token bucket và jittered backoff.',
      '',
      <H>## 3. HÀNG RÀO BẢO VỆ &amp; KẾT LUẬN</H>,
      '- Giữ giọng điệu ấm áp, khích lệ nhưng nghiêm ngặt. Không bao giờ đưa sẵn giải pháp; gợi mở bằng câu hỏi đào sâu.',
      '- Dành 5 phút cuối cho ứng viên hỏi về quy mô kỹ thuật và văn hóa.',
      '- Tổng hợp câu trả lời của ứng viên theo bộ tiêu chí đánh giá 4 bậc đã hiệu chỉnh khi kết thúc.',
    ],
  },
  {
    id: 'stages',
    label: 'Giai đoạn phỏng vấn & Chủ đề',
    lines: [
      <H># GIAI ĐOẠN PHỎNG VẤN &amp; HIỆU CHỈNH CHỦ ĐỀ</H>,
      <K>GIAI ĐOẠN 1: KHẢO SÁT &amp; HỢP ĐỒNG API (0-10 phút)</K>,
      '- Ứng viên phải xác định thông lượng ghi (50k req/s) và mục tiêu độ trễ p99 (&lt;20ms).',
      '- Định dạng token idempotency và chiến lược băm payload.',
      '',
      <K>GIAI ĐOẠN 2: PHÂN MẢNH DỮ LIỆU &amp; NHẤT QUÁN (10-25 phút)</K>,
      '- Đánh giá giao thức đồng thuận (Multi-Raft vs Paxos).',
      '- Xử lý trạng thái split-brain khi mạng khu vực mất kết nối.',
      '',
      <K>GIAI ĐOẠN 3: KHÔI PHỤC THỰC &amp; CIRCUIT BREAKING (25-40 phút)</K>,
      '- Ứng viên thiết kế cơ chế giới hạn tốc độ và backpressure khi tải tăng vọt.',
      '- Kiểm chứng cam kết không thu phí trùng khi một phần dịch vụ bị lỗi.',
      '',
      <K>GIAI ĐOẠN 4: HỎI ĐÁP ỨNG VIÊN &amp; CHỐT KẾT QUẢ (40-45 phút)</K>,
      '- Ứng viên Q&amp;A về văn hóa kỹ thuật và lộ trình phát triển.',
    ],
  },
  {
    id: 'rubric-guidelines',
    label: 'Hướng dẫn bộ tiêu chí đánh giá',
    lines: [
      <H># HƯỚNG DẪN BỘ TIÊU CHÍ ĐÁNH GIÁ</H>,
      <K>KIẾN TRÚC HỆ THỐNG (35%)</K>,
      '- Xuất sắc (90-100): phân tích đánh đổi CP/AP rõ ràng, chiến lược nhân bản đa vùng cụ thể, không có điểm lỗi đơn.',
      '- Tốt (70-89): kiến trúc vững, còn thiếu sót nhỏ về ngữ nghĩa khôi phục phân vùng.',
      '',
      <K>ĐỒNG THUẬT THUẬT TOÁN (30%)</K>,
      '- Xuất sắc (90-100): cấu trúc dữ liệu lock-free, bộ nhớ phụ trợ O(1), an toàn thread sạch sẽ.',
      '- Cần rà soát (&lt;70): race condition chưa được xử lý hoặc tranh chấp khóa quá mức khi chạy đồng thời.',
      '',
      <K>GIAO TIẾP KỸ THUẬT (20%)</K>,
      '- Trình bày lập luận rõ ràng khi bị đào sâu, tiếp thu phản hồi, bảo vệ quyết định kiến trúc một cách xây dựng.',
      '',
      <K>ĐỘ TIN CẬY VẬN HÀNH (15%)</K>,
      '- Chủ động về khả năng quan sát, telemetry chỉ số, biện pháp bảo vệ khi SLA suy giảm.',
    ],
  },
  {
    id: 'role-directives',
    label: 'Chỉ thị vai trò',
    lines: [
      <H>// --- KHỐI CHỈ THỊ: ĐỊNH NGHĨA VAI TRÒ ---</H>,
      <><K>BẠN LÀ</K>: Aria, Giám khảo chính cấp cao về hệ phân tán.</>,
      <><K>BỐI CẢNH</K>: Đánh giá ứng viên L5 về phân mảnh, đồng thuận và fault injection.</>,
      '',
      <H>// --- GIAO THỨC HỘI THOẠI ---</H>,
      '1. Mở đầu bằng yêu cầu kiến trúc mở: thiết kế bộ điều phối token idempotency toàn cục.',
      '2. Khi ứng viên đề xuất khóa Redis đơn giản:',
      <div className={IND}><PR>&gt; ĐÀO SÂU</PR>: Hỏi về vi phạm ngưỡng TTL khi GC pause kéo dài.</div>,
      <div className={IND}><PR>&gt; RÀNG BUỘC</PR>: Đưa ra kịch bản split-brain với node bị cô lập ở Region West.</div>,
      '3. Kỳ vọng ứng viên nêu đánh đổi: Độ trễ vs Nhất quán mạnh (áp dụng định lý CAP).',
      '',
      <H>// --- HƯỚNG DẪN SANDBOX CODE TRỰC TIẾP ---</H>,
      '- Yêu cầu cài đặt Go/Rust cho In-Memory Ring Buffer với ngữ nghĩa lock-free một ghi, nhiều đọc.',
      <>- Kiểm tra độ phức tạp không gian thuật toán: bộ nhớ phụ trợ đúng <V>O(1)</V>.</>,
      '- Nếu race đồng thời xảy ra trong Sandbox: KHÔNG báo lỗi ngay. Hướng dẫn ứng viên:',
      <div className={IND}><span className="italic text-primary">"Chạy với -race detector và kiểm tra vòng lặp CAS tại index 4."</span></div>,
      '- Ghi nhận độ trễ phản xạ và sự bình tĩnh khi debug vào sổ theo dõi bộ tiêu chí chẩn đoán.',
    ],
  },
  {
    id: 'probing',
    label: 'Ma trận đào sâu',
    lines: [
      <H>// --- MA TRẬN ĐÀO SÂU &amp; CÂY LEO THANG ---</H>,
      <K>KÍCH HOẠT [Nhắc đến đồng thuận]</K>,
      <div className={IND}>- Nếu ứng viên nêu Paxos: yêu cầu phân biệt Multi-Paxos và bầu leader của Raft.</div>,
      <div className={IND}>- Nếu ứng viên nhắc Cassandra: kiểm chứng cấu hình LOCAL_QUORUM vs ALL cho read repair.</div>,
      '',
      <K>KÍCH HOẠT [Backpressure / Hàng đợi tắc]</K>,
      <div className={IND}>- Chất vấn: "Khi lưu lượng vào tăng gấp 10 lần đột ngột, bạn shed load ở đâu để giữ SLA p99?"</div>,
      <div className={IND}>- Yêu cầu định nghĩa rõ thuật toán token bucket vs leaky bucket.</div>,
    ],
  },
  {
    id: 'sandbox',
    label: 'Giao thức Sandbox',
    lines: [
      <H>// --- GIAO THỨC RUNTIME SANDBOX CODE ---</H>,
      <><K>BÀI TOÁN MỤC TIÊU</K>: Ring Buffer lock-free một ghi, nhiều đọc.</>,
      <K>RÀNG BUỘC</K>,
      <div className={IND}>1. Bộ nhớ: heap tối đa 512MB.</div>,
      <div className={IND}>2. Cấm thư viện đồng bộ của bên thứ ba (chỉ dùng primitive atomic của stdlib).</div>,
      <div className={IND}>3. Cung cấp bộ unit test với 10 goroutine / thread đọc đồng thời.</div>,
      '',
      <><PR>&gt; TIÊU CHÍ ĐẠT</PR>: Không có cảnh báo race detector; thông lượng bộ nhớ &gt; 250k ops/sec.</>,
    ],
  },
];

// ---- small controlled pieces -----------------------------------------------

const SliderField: React.FC<{
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  leftHint: string;
  rightHint: string;
  onChange: (v: number) => void;
}> = ({ label, display, value, min, max, leftHint, rightHint, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-label-sm">
      <span className="font-medium text-ink">{label}</span>
      <span className="font-mono font-semibold text-primary">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer rounded-lg bg-surface-mid accent-primary"
    />
    <div className="flex justify-between text-[10px] text-outline-strong">
      <span>{leftHint}</span>
      <span>{rightHint}</span>
    </div>
  </div>
);

const WeightSlider: React.FC<{
  dotClass: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ dotClass, label, hint, value, min, max, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-label-sm">
      <span className="flex items-center gap-1.5 font-medium text-ink">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="font-mono font-bold text-ink">{value}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer rounded-lg bg-surface-mid accent-primary"
    />
    <div className="flex justify-between text-[11px] text-outline-strong">
      <span>{hint}</span>
    </div>
  </div>
);

const VOICES = [
  { id: 'aria', name: 'Aria', desc: 'Tự nhiên & kiểu Socratic, nhịp độ hợp tác' },
  { id: 'nova', name: 'Nova', desc: 'Phân tích sâu, đào sâu kiến trúc chặt chẽ' },
  { id: 'echo', name: 'Echo', desc: 'Chính xác & kỹ thuật, súc tích, độ trễ thấp' },
];

const GUARDRAILS = [
  { title: 'Chống lộ câu trả lời trực tiếp', desc: 'Đảm bảo AI dẫn dắt ứng viên bằng gợi mở kiểu Socratic thay vì đưa sẵn đáp án' },
  { title: 'Tăng độ khó thích ứng', desc: 'Tự động điều chỉnh độ phức tạp đề bài khi ứng viên thể hiện sự thành thạo' },
  { title: 'Ẩn danh thông tin nhân thân ứng viên', desc: 'Loại bỏ ngữ cảnh cá nhân mang tính định danh khỏi prompt phỏng vấn' },
  { title: 'Đảm bảo thời gian & nhịp mốc', desc: 'Đảm bảo mọi năng lực trong bộ tiêu chí được đánh giá trong khuôn khổ thời lượng phiên' },
];

const LANG_CHIPS = ['Go 1.22', 'Python 3.12', 'Java 21', 'Rust 1.78', 'TypeScript 5.4'];

const DOMAIN_ANCHORS = ['Hệ phân tán', 'Đồng thời & Khóa', 'Đồng thuận Raft / Paxos', 'Giao thức gRPC / RPC'];

const WAVE_BARS = [
  'h-3 bg-primary/40', 'h-5 bg-primary/60', 'h-7 bg-primary animate-pulse', 'h-4 bg-primary',
  'h-6 bg-primary/80', 'h-8 bg-primary animate-pulse', 'h-3 bg-primary/50', 'h-6 bg-primary/90',
  'h-5 bg-primary', 'h-7 bg-primary/70', 'h-2 bg-primary/40', 'h-6 bg-primary/80 animate-pulse',
  'h-7 bg-primary', 'h-4 bg-primary/60', 'h-8 bg-primary/90', 'h-3 bg-primary/40',
  'h-5 bg-primary/70', 'h-6 bg-primary', 'h-3 bg-primary/50', 'h-5 bg-primary/80',
];

const depthLabel = (v: number) => `${v >= 75 ? 'Đào sâu' : v <= 40 ? 'Bề mặt' : 'Tiêu chuẩn'} (${v}%)`;
const interruptLabel = (v: number) => `${v >= 70 ? 'Linh hoạt' : v <= 30 ? 'Kiên nhẫn' : 'Cân bằng'} (${v}%)`;
const toneLabel = (v: number) => `${v >= 70 ? 'Hỗ trợ' : v <= 30 ? 'Nghiêm khắc' : 'Trung lập'} (${v}%)`;

const RubricStudioPage: React.FC = () => {
  const [voice, setVoice] = useState('aria');
  const [depth, setDepth] = useState(85);
  const [interrupt, setInterrupt] = useState(60);
  const [tone, setTone] = useState(75);
  const [guardrailOn, setGuardrailOn] = useState<boolean[]>([true, true, true, true]);
  const [tab, setTab] = useState('directive');
  const [preset, setPreset] = useState('Senior Distributed Systems');
  const [weights, setWeights] = useState({ design: 35, algo: 30, comm: 20, rel: 15 });
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  const total = weights.design + weights.algo + weights.comm + weights.rel;
  const activeTab = PROMPT_TABS.find((t) => t.id === tab) ?? PROMPT_TABS[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Command & Action Bar */}
      <div className="flex flex-col gap-3 border-b border-surface-mid bg-card px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-label-sm text-outline-strong">
              <span>Không gian Nhà tuyển dụng</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Hiệu chỉnh AI</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-medium text-primary">Studio rubric &amp; prompt</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 tracking-tight text-headline-lg text-ink">AI Interview Engine — Studio rubric &amp; prompt</h1>
              <div className="flex cursor-pointer items-center gap-1 rounded-md border border-surface-high bg-surface-mid px-2.5 py-1 text-label-sm text-ink transition-colors hover:bg-surface-high">
                <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                <span className="font-semibold">Claude 3.5 Sonnet / GPT-4o Evaluator</span>
                <span className="text-outline-strong">v4.2</span>
                <span className="material-symbols-outlined text-[16px] text-outline-strong">expand_more</span>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Đã công bố &amp; đang áp dụng trong phỏng vấn thực tế</span>
              </div>
            </div>
            <p className="m-0 max-w-3xl text-body-md text-ink-variant">
              Cấu hình hành vi người phỏng vấn trò chuyện, giao thức lập trình tương tác và cách chấm điểm theo bộ tiêu chí đa chiều khi đánh giá ứng viên.
            </p>
          </div>
          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button type="button" className="flex items-center gap-1 rounded-md border border-surface-high bg-card px-3 py-1.5 text-label-md text-ink shadow-sm transition-colors hover:bg-surface-mid">
              <span className="material-symbols-outlined text-[16px] text-outline-strong">history</span>
              <span>Lịch sử phiên bản (v4.18.2)</span>
              <span className="material-symbols-outlined text-[16px] text-outline-strong">expand_more</span>
            </button>
            <button
              type="button"
              onClick={() => setPlaygroundOpen(true)}
              className="flex items-center gap-1 rounded-md border border-surface-high bg-surface-low px-3 py-1.5 text-label-md text-primary shadow-sm transition-colors hover:bg-info/40"
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span>Thử trong Playground</span>
              <kbd className="rounded bg-surface-high px-1 font-mono text-[10px] text-ink-variant">⌘P</kbd>
            </button>
            <button type="button" className="flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95">
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span className="font-semibold">Triển khai thay đổi</span>
            </button>
          </div>
        </div>
        {/* Active Clean Metadata Strip (state 1) */}
        <div className="flex items-center gap-6 overflow-x-auto border-t border-surface-mid/60 pt-1 text-label-sm text-ink-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">tag</span>
            <span>Nhãn phát hành: <strong className="font-mono font-medium text-ink">prod-v4.18.2</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">edit_calendar</span>
            <span>Sửa lần cuối: <strong className="text-ink">Hôm nay lúc 10:48 bởi Sarah Jenkins</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">domain_verification</span>
            <span>Vai trò đích: <strong className="text-ink">Senior Staff Distributed Systems (L5/L6)</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            <span>Cả 4 hàng rào bảo vệ đang bật</span>
          </div>
        </div>
        {/* Active Metadata Pill Strip (state 2) */}
        <div className="flex items-center gap-6 overflow-x-auto text-label-sm text-ink-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
            <span>An toàn runtime: <strong className="font-semibold text-ink">Ẩn danh nghiêm ngặt</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
            <span>Giới hạn bộ nhớ sandbox: <strong className="font-semibold text-ink">512MB / tiến trình</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
            <span>Giới hạn thời gian: <strong className="font-semibold text-ink">45 phút tiêu chuẩn</strong></span>
          </div>
          <span className="text-outline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-outline-strong">history_toggle_off</span>
            <span>Công bố lần cuối: <strong className="font-semibold text-ink">Hôm nay, 09:42 UTC bởi Sarah K.</strong></span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="grid grid-cols-1 items-start gap-4 p-4 md:p-6 lg:grid-cols-12">
        {/* PANEL A: Persona, Tone & Agent Guardrails */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Interviewer Persona */}
          <div className={CARD}>
            <SectionTitle
              icon="record_voice_over"
              title="Chân dung người phỏng vấn"
              right={<span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[11px] font-medium text-ink">Chế độ giọng nói</span>}
            />
            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-ink-variant">Giọng nói &amp; Phong cách trò chuyện</label>
              <div className="grid grid-cols-1 gap-1">
                {VOICES.map((v) => {
                  const active = voice === v.id;
                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setVoice(v.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setVoice(v.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-md p-2.5 text-left transition-colors ${
                        active ? 'border border-primary/30 bg-primary-container/10 text-primary' : 'border border-surface-mid bg-card text-ink hover:bg-surface-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          title="Nghe thử mẫu giọng nói"
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                            active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface-mid text-ink-variant hover:text-ink'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        </button>
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{v.name}</div>
                          <div className="text-[11px] text-ink-variant">{v.desc}</div>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-[18px] ${active ? 'text-primary' : 'text-outline-strong'}`}>
                        {active ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Conversational Tuning Sliders */}
            <div className="flex flex-col gap-3 border-t border-surface-mid/80 pt-1">
              <SliderField label="Độ sâu khai thác" display={depthLabel(depth)} value={depth} min={20} max={100} leftHint="Tổng quan bề mặt" rightHint="Đào sâu đa lượt" onChange={setDepth} />
              <SliderField label="Cho phép ngắt lời" display={interruptLabel(interrupt)} value={interrupt} min={10} max={100} leftHint="Chờ im lặng tuyệt đối" rightHint="Chèn lời linh hoạt" onChange={setInterrupt} />
              <SliderField label="Nhịp độ & Giọng điệu" display={toneLabel(tone)} value={tone} min={10} max={100} leftHint="Nghiêm khắc / Trung lập" rightHint="Thân thiện, hỗ trợ" onChange={setTone} />
            </div>
            {/* Primary Domain Anchors (state 2) */}
            <div className="flex flex-col gap-1 border-t border-surface-mid/80 pt-1">
              <label className="text-label-sm text-ink-variant">Lĩnh vực cốt lõi</label>
              <div className="flex flex-wrap gap-1.5">
                {DOMAIN_ANCHORS.map((a) => (
                  <span key={a} className="flex items-center gap-1 rounded-md bg-surface-high px-2 py-1 text-[12px] text-ink">
                    {a}
                    <span className="material-symbols-outlined cursor-pointer text-[14px] hover:text-error">close</span>
                  </span>
                ))}
                <button type="button" className="flex items-center gap-0.5 rounded-md bg-primary-container/10 px-2 py-1 text-[12px] text-primary transition-colors hover:bg-primary-container/20">
                  <span className="material-symbols-outlined text-[14px]">add</span> Thêm lĩnh vực
                </button>
              </div>
            </div>
          </div>

          {/* Safety & Guardrails */}
          <div className={CARD}>
            <SectionTitle
              icon="shield_check"
              title="An toàn &amp; hàng rào bảo vệ"
              right={<span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Đang áp dụng</span>}
            />
            <div className="flex flex-col gap-2 text-label-sm">
              {GUARDRAILS.map((g, i) => (
                <div key={g.title} className="flex items-start justify-between rounded-lg bg-surface-low/50 p-2 transition-colors hover:bg-surface-low">
                  <div className="flex flex-col pr-2">
                    <span className="font-medium text-ink">{g.title}</span>
                    <span className="text-[11px] text-ink-variant">{g.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={guardrailOn[i]}
                    onChange={(e) => setGuardrailOn(guardrailOn.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Coding Environment */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-1 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">code</span>
                <span>Môi trường lập trình của ứng viên</span>
              </h3>
              <span className="rounded-md bg-primary-container/10 px-2 py-0.5 text-[11px] font-medium text-primary">Đồng bộ IDE trực tiếp</span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Cấu hình môi trường thực thi được cấp phát trong giai đoạn giải đề tương tác.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase text-outline-strong">Ngôn ngữ hỗ trợ</span>
                <div className="flex flex-wrap gap-1">
                  {LANG_CHIPS.map((l) => (
                    <span key={l} className="rounded border border-surface-high bg-surface-mid px-2 py-0.5 font-mono text-[11px] font-medium text-ink">{l}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col rounded-lg border border-surface-mid bg-surface-low p-2">
                  <span className="text-[11px] text-outline-strong">Trình chạy test</span>
                  <span className="font-mono text-[12px] font-medium text-ink">JUnit / PyTest / Go Test</span>
                </div>
                <div className="flex flex-col rounded-lg border border-surface-mid bg-surface-low p-2">
                  <span className="text-[11px] text-outline-strong">Timeout thực thi</span>
                  <span className="font-mono text-[12px] font-medium text-ink">10s mỗi lượt chạy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL B: Rubric & System Prompt Editor */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex flex-col overflow-hidden rounded-lg border border-surface-mid bg-card shadow-sm">
            {/* Editor Header & Tabs — merged tab set of both studio states */}
            <div className="flex flex-col gap-2 border-b border-surface-mid bg-surface-low px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1">
                {PROMPT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={
                      tab === t.id
                        ? 'rounded-md border border-surface-mid bg-card px-3 py-1.5 text-label-md font-semibold text-primary shadow-sm transition-all'
                        : 'rounded-md px-3 py-1.5 text-label-md text-ink-variant transition-all hover:text-ink'
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Cú pháp hợp lệ</span>
                </div>
                <button type="button" className="flex items-center gap-1 rounded bg-primary-container px-2 py-1 text-[11px] text-on-primary transition-colors hover:bg-[#313ba4]">
                  <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                  <span>Tối ưu</span>
                </button>
              </div>
            </div>
            {/* Template Presets and Variables Toolbar (state 1) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-mid bg-card px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase text-outline-strong">Cấu hình mẫu:</span>
                {['Senior Distributed Systems', 'Full-Stack Tech Lead', 'Site Reliability Eng'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={
                      preset === p
                        ? 'rounded bg-primary-container/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary-container/20'
                        : 'rounded bg-surface-mid px-2 py-0.5 text-xs text-ink transition-colors hover:bg-surface-high'
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-outline-strong">
                <span>Chèn biến:</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Bấm để chèn">{'{candidate_name}'}</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Bấm để chèn">{'{role_level}'}</span>
                <span className="cursor-pointer rounded bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-ink hover:bg-surface-high" title="Bấm để chèn">{'{target_skills}'}</span>
              </div>
            </div>
            {/* Section Info Bar (state 2) */}
            <div className="flex items-center justify-between bg-surface-mid/60 px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex items-center gap-1">
                <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-ink">system_prompt.jinja2</span>
                <span>Dành cho: Senior L5+ Staff Evaluator</span>
              </div>
              <span className="font-mono text-[11px] text-primary">UTF-8 • Đã đồng bộ synthesizer</span>
            </div>
            {/* Code / Markdown Prompt Area */}
            <div className="flex min-h-[440px] overflow-x-auto bg-card p-3 font-mono text-body-sm leading-relaxed">
              <div className="select-none border-r border-surface-high pr-3 text-right text-[12px] leading-6 text-outline">
                {activeTab.lines.map((_, i) => (
                  <div key={i}>{String(i + 1).padStart(2, '0')}</div>
                ))}
              </div>
              <div className="flex-1 pl-1">
                {activeTab.lines.map((ln, i) => (
                  <div key={i} className="leading-6">{ln}</div>
                ))}
              </div>
            </div>
            {/* Editor Footer Tools */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-mid bg-surface-low px-4 py-2 text-label-sm text-ink-variant">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink">Tokens: <strong>1,840</strong> / 8,192</span>
                <span className="text-outline">•</span>
                <span>Nhiệt độ: <strong className="font-mono text-ink">0.20 (Tất định)</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Khôi phục mặc định</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Xuất mẫu prompt</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Định dạng mẫu</button>
                <button type="button" className="rounded border border-surface-mid bg-card px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-mid">Xem JSON Schema</button>
              </div>
            </div>
          </div>

          {/* Coding Sandbox Environment (state 2) */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-1 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
                <span>Môi trường Sandbox lập trình</span>
              </h3>
              <span className="rounded-full bg-primary-container/10 px-2 py-0.5 font-mono text-xs text-primary">VM Firecracker cách ly</span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Thông số thực thi trực tiếp được cấp cho IDE của ứng viên tại các mốc thử thách lập trình.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">Runtime</span>
                <span className="font-mono text-xs font-medium text-ink">Go 1.22, Rust 1.78</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">Giới hạn CPU</span>
                <span className="font-mono text-xs font-medium text-ink">2 vCPU (ghim)</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2.5">
                <span className="text-[11px] uppercase text-outline-strong">Cách ly mạng</span>
                <span className="font-mono text-xs font-semibold text-emerald-600">Airgap tuyệt đối (không egress)</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL C: Rubric Weights, Cutoffs & Previews */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {/* Evaluation Rubric Weights */}
          <div className={CARD}>
            <SectionTitle
              icon="tune"
              title="Trọng số bộ tiêu chí đánh giá"
              right={
                <div className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold text-on-primary ${total === 100 ? 'bg-primary' : 'bg-error'}`}>
                  Tổng: {total}%
                </div>
              }
            />
            <p className="m-0 text-body-sm text-ink-variant">
              Điều chỉnh phân bố trọng số giữa các nhóm tiêu chí để tính điểm tổng hợp.
            </p>
            <div className="flex flex-col gap-3 pt-1">
              <WeightSlider dotClass="bg-indigo-600" label="Kiến trúc hệ thống & Khả năng mở rộng" hint="Thiết kế đa vùng, phân mảnh dữ liệu, thông lượng" value={weights.design} min={5} max={60} onChange={(v) => setWeights({ ...weights, design: v })} />
              <WeightSlider dotClass="bg-blue-600" label="Cấu trúc dữ liệu & Đồng thời thuật toán" hint="Mẫu lock-free, mức dùng bộ nhớ, độ phức tạp thời gian" value={weights.algo} min={5} max={60} onChange={(v) => setWeights({ ...weights, algo: v })} />
              <WeightSlider dotClass="bg-emerald-600" label="Giao tiếp kỹ thuật & Đánh đổi" hint="Lập luận rõ ràng, bảo vệ quyết định thiết kế" value={weights.comm} min={5} max={50} onChange={(v) => setWeights({ ...weights, comm: v })} />
              <WeightSlider dotClass="bg-amber-600" label="Độ tin cậy vận hành & Trường hợp biên" hint="Chịu lỗi, khả năng quan sát, circuit breaker" value={weights.rel} min={5} max={40} onChange={(v) => setWeights({ ...weights, rel: v })} />
            </div>
            {/* Weight Progress Bar Visual (state 1) */}
            <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-surface-mid bg-surface-low p-2.5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-mid">
                <div className="h-full bg-indigo-600" style={{ width: `${weights.design}%` }} />
                <div className="h-full bg-blue-600" style={{ width: `${weights.algo}%` }} />
                <div className="h-full bg-emerald-600" style={{ width: `${weights.comm}%` }} />
                <div className="h-full bg-amber-600" style={{ width: `${weights.rel}%` }} />
              </div>
              <div className="flex justify-between pt-0.5 text-[11px] text-outline-strong">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Thiết kế {weights.design}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Thuật toán {weights.algo}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Giao tiếp {weights.comm}%</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Vận hành {weights.rel}%</span>
              </div>
            </div>
            {/* Auto-Normalized Weight Matrix donut (state 2) */}
            <div className="mt-1 flex items-center gap-3 rounded-lg bg-surface-low p-2.5">
              <svg className="h-16 w-16 shrink-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#eaedff" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#4f46e5" strokeDasharray="35 65" strokeDashoffset="25" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#313ba4" strokeDasharray="30 70" strokeDashoffset="90" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#059669" strokeDasharray="20 80" strokeDashoffset="60" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#d97706" strokeDasharray="15 85" strokeDashoffset="40" strokeWidth="3.2" />
              </svg>
              <div className="flex flex-col text-xs text-ink-variant">
                <span className="font-semibold text-ink">Ma trận trọng số tự chuẩn hóa</span>
                <span>Điểm chấm tuân thủ chính sách tổng tất định. Mọi sai lệch được chuẩn hóa khi chạy chấm.</span>
              </div>
            </div>
          </div>

          {/* Score Cutoffs & Hiring Triggers */}
          <div className={CARD}>
            <SectionTitle
              icon="rule"
              title="Ngưỡng điểm & Ngưỡng tuyển"
              right={<span className="font-mono text-[11px] text-outline-strong">Thang 0–100 điểm</span>}
            />
            <div className="flex flex-col gap-2 text-label-sm">
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                  <div>
                    <div className="text-[13px] font-semibold text-emerald-900">Rất khuyến nghị (≥ 85 điểm)</div>
                    <div className="text-[11px] text-emerald-700">Tự động đưa ứng viên vào vòng Partner Executive</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-emerald-800">
                  <span>≥ 85.0</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">rate_review</span>
                  <div>
                    <div className="text-[13px] font-semibold text-amber-900">Cần rà soát (70 – 84 điểm)</div>
                    <div className="text-[11px] text-amber-700">Gắn cờ để quản lý tuyển dụng xem lại bản ghi thủ công</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-amber-800">
                  <span>70.0 – 84.9</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-950">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-rose-600">cancel</span>
                  <div>
                    <div className="text-[13px] font-semibold text-rose-900">Không đi tiếp (&lt; 70 điểm)</div>
                    <div className="text-[11px] text-rose-700">Tạo gói phản hồi xây dựng cho ứng viên</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[13px] font-bold text-rose-800">
                  <span>&lt; 70.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Feedback Preview (state 1) */}
          <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-card p-4 shadow-sm">
            <SectionTitle
              icon="assignment_turned_in"
              title="Xem trước phản hồi cho ứng viên"
              right={<Badge>Tự sinh</Badge>}
            />
            <p className="m-0 text-[12px] text-ink-variant">
              Xem trước đầu ra có cấu trúc gửi cho ứng viên và đội tuyển dụng theo bộ tiêu chí này:
            </p>
            <div className="flex flex-col gap-2 rounded-lg border border-surface-mid bg-surface-low p-2 text-xs">
              <div className="flex items-center justify-between border-b border-surface-high pb-1.5">
                <span className="font-semibold text-ink">Tóm tắt đánh giá cho Elena R.</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700">Điểm: 88.5 / 100</span>
              </div>
              <div className="leading-relaxed text-ink-variant">
                <strong className="text-ink">Điểm mạnh:</strong> Thể hiện làm chủ ở mức chuyên gia về đồng thuận Raft và khôi phục split-brain khi mô phỏng lỗi node.
              </div>
              <div className="leading-relaxed text-ink-variant">
                <strong className="text-ink">Cần cải thiện:</strong> Độ phức tạp không gian của ring buffer in-memory vượt giới hạn bộ nhớ phụ trợ O(1) ở bản nháp sandbox đầu tiên.
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-outline-strong">
                <span>Đã hiệu chỉnh theo Prompt Matrix v4.18.2</span>
                <a className="flex items-center gap-0.5 font-medium text-primary hover:underline" href="#/">Bảng điểm đầy đủ <span className="material-symbols-outlined text-[13px]">arrow_forward</span></a>
              </div>
            </div>
          </div>

          {/* Voice Latency & Waveform (state 2) */}
          <div className={CARD}>
            <SectionTitle
              icon="mic"
              title="Độ trễ giọng nói & Sóng âm"
              right={
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  142ms RTT
                </span>
              }
            />
            <div className="flex h-12 items-center justify-between rounded-lg bg-surface-low px-3">
              <div className="flex h-8 w-full items-end justify-center gap-[3px]">
                {WAVE_BARS.map((b, i) => (
                  <span key={i} className={`w-[3px] rounded-full ${b}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-ink-variant">
              <span className="font-medium">Mô phỏng ứng viên đang nói</span>
              <button type="button" className="flex items-center gap-1 font-semibold text-primary hover:underline">
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                <span>Mô phỏng lượt đào sâu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Playground Modal (state 1) */}
      {playgroundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 backdrop-blur-sm">
          <div className="flex max-h-[870px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-surface-mid bg-card shadow-card">
            <div className="flex items-center justify-between bg-surface-mid px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-primary">terminal</span>
                <div>
                  <h3 className="m-0 text-headline-sm text-ink">Playground phỏng vấn tương tác</h3>
                  <p className="m-0 text-[12px] text-ink-variant">Kiểm tra phản hồi của người phỏng vấn với system prompt và hàng rào bảo vệ bạn đã cấu hình</p>
                </div>
              </div>
              <button type="button" onClick={() => setPlaygroundOpen(false)} className="rounded-lg p-1 text-outline-strong transition-colors hover:text-ink">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm">AI</div>
                <div className="max-w-[85%] rounded-xl border border-surface-mid bg-surface-low p-3 text-body-sm text-ink">
                  <p className="mb-1 font-semibold text-primary">Aria (AI chấm điểm)</p>
                  "Chào mừng! Bắt đầu phần hệ phân tán: ta sẽ khám phá việc xây dựng bộ điều phối idempotency trên ba vùng ghi nhiều. Nếu một phân vùng mạng cô lập Region West, cơ chế leasing của bạn ngăn thực thi trùng lặp như thế nào?"
                </div>
              </div>
              <div className="flex items-start justify-end gap-2">
                <div className="max-w-[85%] rounded-xl bg-primary-container p-3 text-body-sm text-on-primary">
                  <p className="mb-1 font-semibold text-on-primary-container">Phản hồi mô phỏng của ứng viên</p>
                  "Tôi sẽ đặt một instance Redis với khóa TTL 15 giây ở West và để giao dịch chạy tiếp nếu lấy khóa thành công."
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dae2fd] text-xs font-bold text-ink">Bạn</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow-sm">AI</div>
                <div className="max-w-[85%] rounded-xl border-l-2 border-primary border-surface-mid bg-surface-low p-3 text-body-sm text-ink">
                  <p className="mb-1 font-semibold text-primary">Aria (Hàng rào đào sâu Socratic được kích hoạt)</p>
                  "Chuyện gì xảy ra nếu một GC pause 18 giây bất ngờ xuất hiện ngay sau khi lấy khóa ở West, trong khi một client khác ở Central cố thực thi sau khi TTL đã hết hạn? Làm sao ngăn xử lý split-brain mà không phụ thuộc vào đồng hồ tường thuật được đồng bộ?"
                  <div className="mt-2 flex items-center gap-2 border-t border-surface-high/60 pt-2 font-mono text-[11px] text-outline-strong">
                    <span className="font-semibold text-emerald-700">✓ Hàng rào khớp:</span> Chống lộ câu trả lời trực tiếp &amp; Leo thang Socratic
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-surface-mid bg-surface-low p-3">
              <input
                type="text"
                placeholder="Nhập phản hồi mô phỏng của ứng viên để thử câu hỏi tiếp của AI..."
                className="flex-1 rounded-md border border-surface-mid bg-card px-3 py-2 text-body-sm text-ink shadow-sm placeholder:text-outline-strong focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="button" className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container">
                <span>Gửi lượt</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricStudioPage;
