/**
 * STATIC mockup — screen_22 "Cấu hình hệ thống" (Admin system settings).
 * BE chưa có endpoint cấu hình (general/notification/AI params) nên trang này là bản demo:
 * không gọi API, không link sidebar; state chỉ sống trong phiên.
 * Mockup kê 5 mục điều hướng nhưng chỉ dựng form cho 3 mục (Chung / Thông báo / AI Interview)
 * -> bỏ 2 mục không có nội dung ("Quy trình kiểm duyệt", "Bảo mật & Phân quyền").
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #6366f1 viền focus ô input,
 * #10b981 nhịp xanh (dot/thanh health), #d8e2ff + #004598 nhóm tertiary (icon kênh thông báo).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Badge, buttonClass } from '../components/ui';

const MONO = 'font-mono text-label-sm';

const VERSION_CHIP = 'v2.4.0-prod';
const LAST_UPDATED = 'Cập nhật lần cuối: 10 phút trước bởi SuperAdmin';

const NAV = [
  { id: 'section-general', label: 'Chung', icon: 'tune' },
  { id: 'section-notifications', label: 'Thông báo', icon: 'notifications_active', count: '4 mục' },
  { id: 'section-ai', label: 'AI Interview', icon: 'psychology', chip: 'Live v2.5' },
];

const NOTIFICATION_ROWS = [
  {
    key: 'in-app', icon: 'notifications_active', tone: 'text-primary',
    title: 'Thông báo trên hệ thống (In-app Notification)',
    desc: 'Gửi thông báo đẩy và chuông thông báo ngay trong ứng dụng khi có sự kiện mới',
  },
  {
    key: 'interview-reminder', icon: 'alarm', tone: 'text-primary',
    title: 'Nhắc lịch phỏng vấn qua Email',
    desc: 'Tự động gửi email nhắc trước 24 giờ và 1 giờ cho Ứng viên & Nhà tuyển dụng trước buổi phỏng vấn',
  },
  {
    key: 'jd-decision', icon: 'fact_check', tone: 'text-secondary',
    title: 'Thông báo khi JD được duyệt hoặc từ chối',
    desc: 'Gửi thông báo ngay lập tức cho Nhà tuyển dụng khi Quản trị viên duyệt hoặc từ chối tin tuyển dụng',
  },
  {
    key: 'weekly-report', icon: 'insights', tone: 'text-outline-strong',
    title: 'Email báo cáo tổng hợp tuần cho Admin',
    desc: 'Gửi email tổng kết số lượng ứng viên và phiên phỏng vấn vào lúc 08:00 sáng thứ Hai',
  },
];

const LANGS = ['Tiếng Việt (vi-VN)', 'English (en-US)', '日本語 (ja-JP)'];

const TIMEZONES = [
  '(GMT+07:00) Bangkok, Hanoi, Jakarta',
  '(GMT+08:00) Singapore, Kuala Lumpur',
  '(GMT+09:00) Tokyo, Seoul',
  '(GMT+00:00) London, UTC',
];

const RESPONSE_TIMES = ['2 phút (120 giây)', '3 phút (180 giây)', '5 phút (300 giây)'];

const AI_MODELS = [
  'AI Smart Evaluator v2.5 (Pro Model) - Khuyến nghị cho kiểm tra chuyên sâu',
  'DeepSeek-Coder & Behavioral Fast-Engine (Tiết kiệm chi phí)',
  'GPT-4o Enterprise Specialized Interview Pipeline',
];

const fieldClass =
  'h-10 w-full box-border rounded-lg border border-[#e2e8f0] bg-card pl-9 pr-3 text-body-md text-ink ' +
  'shadow-sm transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-primary';

const selectClass =
  'h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#e2e8f0] bg-card pl-9 pr-10 ' +
  'text-body-md text-ink shadow-sm transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-primary';

/** Field theo bố cục mockup: cột trái là nhãn + mô tả, cột phải là control. */
const FieldRow: React.FC<{
  htmlFor?: string; label: string; hint: string; control: React.ReactNode;
}> = ({ htmlFor, label, hint, control }) => (
  <div className="grid grid-cols-1 items-center gap-4 pt-2 md:grid-cols-3">
    <div className="flex flex-col gap-0.5">
      <label htmlFor={htmlFor} className="text-label-md font-semibold text-ink">{label}</label>
      <span className="text-body-sm text-ink-variant">{hint}</span>
    </div>
    <div className="md:col-span-2">{control}</div>
  </div>
);

const SectionShell: React.FC<{
  id: string; icon: string; iconCls: string; title: string; desc: string;
  aside?: React.ReactNode; children: React.ReactNode; onSave: () => void;
}> = ({ id, icon, iconCls, title, desc, aside, children, onSave }) => (
  <section id={id} className="flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-sm">
    <div className="flex flex-col gap-3 bg-surface-low/50 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div className="flex flex-col">
          <h3 className="m-0 text-headline-sm font-bold text-ink">{title}</h3>
          <p className="m-0 text-body-sm text-ink-variant">{desc}</p>
        </div>
      </div>
      {aside}
    </div>
    <div className="flex flex-col gap-5 p-5">{children}</div>
    <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] bg-surface-low/30 px-5 py-3">
      <button type="button" className={buttonClass('secondary', 'h-10 rounded-lg px-5')}>Cancel</button>
      <button type="button" className={buttonClass('primary', 'h-10 rounded-lg px-5')} onClick={onSave}>
        <span className="material-symbols-outlined text-[18px]">check</span>
        Save configuration
      </button>
    </div>
  </section>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; large?: boolean }> = ({
  checked, onChange, label, large = false,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex shrink-0 items-center rounded-full transition-colors shadow-inner ${
      large ? 'h-7 w-14' : 'h-6 w-12'
    } ${checked ? 'bg-primary-container' : 'bg-surface-high'}`}
  >
    <span
      className={`absolute top-[2px] rounded-full bg-card transition-transform ${
        large ? 'h-6 w-6' : 'h-5 w-5'
      } ${checked ? (large ? 'translate-x-[30px]' : 'translate-x-[24px]') : 'translate-x-[2px]'}`}
    />
  </button>
);

const AdminSystemSettingsPage: React.FC = () => {
  const [activeNav, setActiveNav] = useState('section-general');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);

  const [systemName, setSystemName] = useState('AI Interview Platform');
  const [supportEmail, setSupportEmail] = useState('support@ai-interview.vn');
  const [lang, setLang] = useState(LANGS[0]);
  const [tz, setTz] = useState(TIMEZONES[0]);

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'in-app': true, 'interview-reminder': true, 'jd-decision': true, 'weekly-report': false,
  });

  const [aiEnabled, setAiEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  const [responseTime, setResponseTime] = useState(RESPONSE_TIMES[1]);
  const [aiModel, setAiModel] = useState(AI_MODELS[0]);
  const [sttEnabled, setSttEnabled] = useState(true);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const saved = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4000);
  };

  const gotoSection = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header: breadcrumb, title, status ribbon */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1 text-body-sm text-ink-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Home
            </span>
            <span className="text-outline-strong">/</span>
            <span>Administration</span>
            <span className="text-outline-strong">/</span>
            <span className="font-medium text-ink">System settings</span>
          </nav>
          <div className="mt-0.5 flex items-baseline gap-2">
            <h1 className="m-0 text-headline-lg font-bold tracking-tight text-ink">System settings</h1>
            <Badge tone="info">{VERSION_CHIP}</Badge>
          </div>
          <p className="m-0 max-w-3xl text-body-md text-ink-variant">
            Quản lý các thiết lập chung, thông báo tự động và thông số vận hành AI của toàn bộ nền tảng
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-[#e2e8f0] bg-card p-2 shadow-sm md:self-auto">
          <div className="inline-flex items-center gap-2 rounded-lg bg-surface-low px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-label-md font-semibold text-ink">Status: operating normally</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-low px-3 py-1.5 text-body-sm text-ink-variant">
            <span className="material-symbols-outlined text-[16px] text-outline-strong">history</span>
            <span>{LAST_UPDATED}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left: section nav + infrastructure health */}
        <div className="flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-16">
          <div className="rounded-xl border border-[#e2e8f0] bg-card p-1 shadow-sm">
            <div className="px-3 pb-1 pt-2">
              <span className="text-label-sm font-bold uppercase tracking-wider text-outline-strong">
                Setting categories
              </span>
            </div>
            <nav className="mt-1 flex flex-col gap-1">
              {NAV.map(n => {
                const active = activeNav === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-label-md transition-colors ${
                      active ? 'bg-info font-semibold text-primary' : 'text-ink-variant hover:bg-surface-high hover:text-ink'
                    }`}
                    onClick={() => gotoSection(n.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : ''}`}>{n.icon}</span>
                      {n.label}
                    </span>
                    {n.count && (
                      <span className="rounded-full bg-surface-mid px-2 py-0.5 text-label-sm font-medium text-ink-variant">
                        {n.count}
                      </span>
                    )}
                    {n.chip && (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-label-sm font-semibold text-success-text">
                        {n.chip}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between pb-1">
              <span className="flex items-center gap-1.5 text-label-md font-bold text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">dns</span>
                Hạ tầng kết nối AI
              </span>
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            </div>
            <HealthBar label="API DeepSeek / OpenAI" value="24ms (Ổn định)" pct={94} barCls="bg-[#10b981]" />
            <HealthBar label="Bộ nhớ lưu trữ Audio/CV" value="38% (190GB / 500GB)" pct={38} barCls="bg-primary-container" />
            <div className="flex items-center justify-between pt-1 text-body-sm text-outline-strong">
              <span>Database Pool: 14/50 active</span>
              <button type="button" className={`${MONO} font-semibold text-primary hover:underline`}>Details</button>
            </div>
          </div>
        </div>

        {/* Right: the three configuration sections */}
        <div className="flex flex-col gap-6 lg:col-span-9">
          <SectionShell
            id="section-general" icon="apartment" iconCls="bg-info text-primary"
            title="Thông tin cơ bản nền tảng"
            desc="Các thông tin hiển thị thương hiệu và cấu hình quốc tế hóa mặc định"
            aside={<span className="rounded-full bg-surface-mid px-2 py-1 text-label-sm text-ink-variant">Public setting</span>}
            onSave={() => saved('General configuration saved')}
          >
            {/* Logo */}
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-label-md font-semibold text-ink">Logo hệ thống</span>
                <span className="text-body-sm text-ink-variant">
                  Hiển thị trên thanh điều hướng, hóa đơn và email thông báo.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-low p-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[28px] text-primary">smart_toy</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <button type="button" className={buttonClass('primary', 'h-9')}>
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      Upload new image
                    </button>
                    <button type="button" className={buttonClass('secondary', 'h-9')}>Remove</button>
                  </div>
                  <span className="text-body-sm text-outline-strong">
                    Định dạng PNG, SVG, JPG. Kích thước đề xuất 512x512px. Tối đa 2MB.
                  </span>
                </div>
              </div>
            </div>

            <FieldRow
              htmlFor="system-name" label="Tên hệ thống"
              hint="Tên định danh thương hiệu hiển thị trên web app."
              control={
                <input
                  id="system-name" className={`${fieldClass} pl-3.5`} type="text"
                  value={systemName} onChange={e => setSystemName(e.target.value)}
                />
              }
            />
            <FieldRow
              htmlFor="support-email" label="Email liên hệ & hỗ trợ"
              hint="Địa chỉ tiếp nhận thông tin khi người dùng gửi phản hồi."
              control={
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">mail</span>
                  <input
                    id="support-email" className={fieldClass} type="email"
                    value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                  />
                </span>
              }
            />
            <FieldRow
              htmlFor="default-lang" label="Ngôn ngữ mặc định"
              hint="Ngôn ngữ kích hoạt đầu tiên khi ứng viên truy cập."
              control={
                <span className="relative flex items-center">
                  <select
                    id="default-lang" className={`${selectClass} pl-3.5`}
                    value={lang} onChange={e => setLang(e.target.value)}
                  >
                    {LANGS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[20px] text-outline-strong">arrow_drop_down</span>
                </span>
              }
            />
            <FieldRow
              htmlFor="timezone" label="Múi giờ hệ thống"
              hint="Đồng bộ lịch hẹn và phiên phỏng vấn video AI."
              control={
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">schedule</span>
                  <select
                    id="timezone" className={selectClass} value={tz} onChange={e => setTz(e.target.value)}
                  >
                    {TIMEZONES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[20px] text-outline-strong">arrow_drop_down</span>
                </span>
              }
            />
          </SectionShell>

          <SectionShell
            id="section-notifications" icon="forward_to_inbox" iconCls="bg-[#d8e2ff] text-[#004598]"
            title="Kênh thông báo & Cảnh báo tự động"
            desc="Thiết lập các luồng thông báo gửi tới ứng viên, nhà tuyển dụng và ban quản trị"
            aside={
              <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-1 text-label-sm font-semibold text-success-text">
                <span className="material-symbols-outlined text-[14px]">bolt</span> Real-time
              </span>
            }
            onSave={() => saved('Notification configuration saved')}
          >
            {NOTIFICATION_ROWS.map(r => (
              <div
                key={r.key}
                className="flex items-center justify-between gap-4 rounded-xl bg-surface-low/50 p-3 transition-colors hover:bg-surface-low"
              >
                <div className="flex max-w-xl items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card shadow-sm ${r.tone}`}>
                    <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md font-bold text-ink">{r.title}</span>
                    <span className="text-body-sm text-ink-variant">{r.desc}</span>
                  </div>
                </div>
                <Toggle
                  label={r.title}
                  checked={!!notifications[r.key]}
                  onChange={() => setNotifications(n => ({ ...n, [r.key]: !n[r.key] }))}
                />
              </div>
            ))}
          </SectionShell>

          <SectionShell
            id="section-ai" icon="auto_awesome" iconCls="bg-success-bg text-success-text"
            title="Tham số phòng phỏng vấn AI"
            desc="Điều chỉnh thuật toán, số lượng câu hỏi và thời gian giới hạn cho mỗi phiên luyện tập"
            aside={
              <span className="inline-flex items-center gap-1 rounded-full bg-info px-2 py-1 text-label-sm font-semibold text-primary">
                <span className="material-symbols-outlined text-[14px]">psychology</span> AI Engine Core
              </span>
            }
            onSave={() => saved('AI configuration saved')}
          >
            {/* Master toggle banner */}
            <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-info/50 via-surface-mid/60 to-success-bg p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[28px]">graphic_eq</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-headline-sm font-bold text-ink">Bật tính năng AI Interview</span>
                    <span className={`rounded-full px-2 py-0.5 text-label-sm font-semibold ${
                      aiEnabled ? 'bg-primary text-on-primary' : 'bg-surface-mid text-ink-variant'
                    }`}
                    >
                      {aiEnabled ? 'Đang kích hoạt' : 'Tạm tắt'}
                    </span>
                  </div>
                  <span className="text-body-sm text-ink-variant">
                    Cho phép ứng viên tạo phiên mô phỏng phỏng vấn video với AI và nhận báo cáo đánh giá tự động.
                  </span>
                </div>
              </div>
              <Toggle large label="Bật tính năng AI Interview" checked={aiEnabled} onChange={() => setAiEnabled(v => !v)} />
            </div>

            <div className={`grid grid-cols-1 gap-5 pt-1 transition-opacity md:grid-cols-2 ${aiEnabled ? '' : 'opacity-50'}`}>
              <ParamField
                htmlFor="ai-question-count" label="Số câu hỏi mặc định mỗi phiên"
                hint={<span className="text-label-sm text-outline-strong">Gợi ý: 4 - 8 câu</span>}
                footer="Số lượng câu hỏi tạo sự cân bằng tối ưu giữa đánh giá sâu và thời lượng phỏng vấn (15-20 phút)."
                disabled={!aiEnabled}
              >
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">quiz</span>
                  <input
                    id="ai-question-count" className={fieldClass} type="number" min={3} max={15} disabled={!aiEnabled}
                    value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                  />
                </span>
              </ParamField>

              <ParamField
                htmlFor="ai-response-time" label="Thời gian trả lời tối đa mỗi câu"
                footer="Hệ thống sẽ tự động dừng lắng nghe và chuyển sang câu tiếp theo khi hết thời gian."
                disabled={!aiEnabled}
              >
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-outline-strong">timer</span>
                  <select
                    id="ai-response-time" className={selectClass} disabled={!aiEnabled}
                    value={responseTime} onChange={e => setResponseTime(e.target.value)}
                  >
                    {RESPONSE_TIMES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[20px] text-outline-strong">arrow_drop_down</span>
                </span>
              </ParamField>

              <ParamField
                htmlFor="ai-evaluator-model" label="Mô hình AI chấm điểm & sinh câu hỏi"
                footer="Model được tinh chỉnh với dữ liệu 50,000+ kịch bản phỏng vấn IT, Kinh doanh và Marketing theo tiêu chuẩn STAR."
                className="md:col-span-2" disabled={!aiEnabled}
              >
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-secondary">smart_toy</span>
                  <select
                    id="ai-evaluator-model" className={selectClass} disabled={!aiEnabled}
                    value={aiModel} onChange={e => setAiModel(e.target.value)}
                  >
                    {AI_MODELS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 text-[20px] text-outline-strong">arrow_drop_down</span>
                </span>
              </ParamField>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-low/50 p-3 md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md font-bold text-ink">
                      Tự động ghi âm và chuyển đổi giọng nói (STT)
                    </span>
                    <span className="text-body-sm text-ink-variant">
                      Bóc băng câu trả lời thành văn bản theo thời gian thực để trích xuất từ khóa và đo lường độ trôi chảy
                    </span>
                  </div>
                </div>
                <Toggle label="STT" checked={sttEnabled} onChange={() => setSttEnabled(v => !v)} />
              </div>
            </div>
          </SectionShell>
        </div>
      </div>

      {/* Toast xác nhận (local state, đúng hình thái mockup) */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border border-[#e2e8f0] bg-card p-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success-text">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 pr-2">
            <span className="text-label-md font-bold text-ink">Đã lưu cấu hình thành công</span>
            <p className="m-0 text-body-sm text-ink-variant">
              Các thay đổi đã được áp dụng ngay trên toàn hệ thống.
            </p>
            <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-surface-high">
              <span className="block h-full w-full rounded-full bg-[#10b981]" />
            </span>
          </div>
          <button
            type="button"
            aria-label="Close notification"
            className="rounded-lg p-1 text-outline-strong transition-colors hover:text-ink"
            onClick={() => setToast('')}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

const HealthBar: React.FC<{ label: string; value: string; pct: number; barCls: string }> = ({
  label, value, pct, barCls,
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-body-sm">
      <span className="text-ink-variant">{label}</span>
      <span className="text-label-md font-medium text-ink">{value}</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
      <div className={`h-full rounded-full ${barCls}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const ParamField: React.FC<{
  htmlFor: string; label: string; hint?: React.ReactNode; footer: string;
  className?: string; disabled?: boolean; children: React.ReactNode;
}> = ({ htmlFor, label, hint, footer, className = '', disabled, children }) => (
  <div className={`flex flex-col gap-1 ${className} ${disabled ? 'pointer-events-none' : ''}`}>
    <label htmlFor={htmlFor} className="flex items-center justify-between text-label-md font-semibold text-ink">
      <span>{label}</span>
      {hint}
    </label>
    {children}
    <span className="text-body-sm text-ink-variant">{footer}</span>
  </div>
);

export default AdminSystemSettingsPage;
