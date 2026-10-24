import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { AdminSettings, SettingsValidationError } from '../../models/AdminConsole.model';
import {
  ICON,
  LoadingBlock,
  Toggle,
  adminButton,
  errorText,
  fmtServer,
  timeAgo,
} from '../components/adminKit';

/**
 * Cấu hình hệ thống (mockup Stitch `cấu hình hệ thống`) — DATA page.
 * Nguồn số thật:
 *   GET /admin/settings -> 14 khóa cấu hình (general / notification / ai) + meta.lastUpdatedAt
 *   PUT /admin/settings -> chỉ gửi các key đã đổi theo nhóm; giá trị sai -> 422 `{detail:{key:msg}}`
 *                          và KHÔNG ghi một phần nào (all-or-nothing), FE map detail về từng ô.
 * Guard hasRole('ADMIN') -> ROLE_STAFF nhận 403 và màn hiện banner lỗi.
 * Khác mockup (ghi ở spec/INDEX.md):
 *   - "v2.4.0-prod", chip "Live v2.5", khối "Hạ tầng kết nối AI" (24ms / 38% / 14-50) và ô logo:
 *     BE không có endpoint -> giữ nguyên văn số mockup, gắn nhãn Demo.
 *   - BE còn khóa `ai.promptConfig` (2000 ký tự) nhưng mockup không có ô tương ứng nên chưa hiển thị.
 *   - Mục điều hướng không có form ("Quy trình kiểm duyệt") chuyển thành link thật tới
 *     /admin/job-approvals.
 */

type Group = 'general' | 'notification' | 'ai';

type FlatKey =
  | 'general.platformName' | 'general.supportEmail' | 'general.defaultLanguage' | 'general.timezone'
  | 'notification.inApp' | 'notification.interviewReminderEmail' | 'notification.jdDecisionEmail' | 'notification.weeklyDigestEmail'
  | 'ai.interviewEnabled' | 'ai.defaultQuestionCount' | 'ai.maxAnswerSeconds' | 'ai.evaluatorModel' | 'ai.sttEnabled';

type FlatValue = string | number | boolean;

type FlatSettings = Record<FlatKey, FlatValue>;

const GROUP_KEYS: Record<Group, FlatKey[]> = {
  general: ['general.platformName', 'general.supportEmail', 'general.defaultLanguage', 'general.timezone'],
  notification: [
    'notification.inApp', 'notification.interviewReminderEmail',
    'notification.jdDecisionEmail', 'notification.weeklyDigestEmail',
  ],
  ai: ['ai.interviewEnabled', 'ai.defaultQuestionCount', 'ai.maxAnswerSeconds', 'ai.evaluatorModel', 'ai.sttEnabled'],
};

const LANG_OPTIONS = [
  { value: 'vi-VN', label: 'Tiếng Việt (vi-VN)' },
  { value: 'en-US', label: 'English (en-US)' },
  { value: 'ja-JP', label: '日本語 (ja-JP)' },
];

const TZ_OPTIONS = [
  { value: 'GMT+7', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'GMT+8', label: '(GMT+08:00) Singapore, Kuala Lumpur' },
  { value: 'GMT+9', label: '(GMT+09:00) Tokyo, Seoul' },
  { value: 'GMT+0', label: '(GMT+00:00) London, UTC' },
];

const ANSWER_TIME_OPTIONS = [
  { value: '120', label: '2 phút (120 giây)' },
  { value: '180', label: '3 phút (180 giây)' },
  { value: '300', label: '5 phút (300 giây)' },
];

const MODEL_OPTIONS = [
  { value: 'SMART_EVALUATOR_V2_5', label: 'AI Smart Evaluator v2.5 (Pro Model) - Khuyến nghị cho kiểm tra chuyên sâu' },
  { value: 'DEEPSEEK_FAST_ENGINE', label: 'DeepSeek-Coder & Behavioral Fast-Engine (Tiết kiệm chi phí)' },
  { value: 'GPT4O_ENTERPRISE', label: 'GPT-4o Enterprise Specialized Interview Pipeline' },
];

const NOTIFICATION_ROWS: { key: FlatKey; icon: string; tone: string; title: string; desc: string }[] = [
  {
    key: 'notification.inApp', icon: 'notifications_active', tone: 'text-primary',
    title: 'Thông báo trên hệ thống (In-app Notification)',
    desc: 'Gửi thông báo đẩy và chuông thông báo ngay trong ứng dụng khi có sự kiện mới',
  },
  {
    key: 'notification.interviewReminderEmail', icon: 'alarm', tone: 'text-primary',
    title: 'Nhắc lịch phỏng vấn qua Email',
    desc: 'Tự động gửi email nhắc trước 24 giờ và 1 giờ cho Ứng viên & Nhà tuyển dụng trước buổi phỏng vấn',
  },
  {
    key: 'notification.jdDecisionEmail', icon: 'fact_check', tone: 'text-secondary-teal',
    title: 'Thông báo khi JD được duyệt hoặc từ chối',
    desc: 'Gửi thông báo ngay lập tức cho Nhà tuyển dụng khi Quản trị viên duyệt hoặc từ chối tin tuyển dụng',
  },
  {
    key: 'notification.weeklyDigestEmail', icon: 'insights', tone: 'text-outline-strong',
    title: 'Email báo cáo tổng hợp tuần cho Admin',
    desc: 'Gửi email tổng kết số lượng ứng viên và phiên phỏng vấn vào lúc 08:00 sáng thứ Hai',
  },
];

const toFlat = (s: AdminSettings): FlatSettings => ({
  'general.platformName': s.general.platformName,
  'general.supportEmail': s.general.supportEmail,
  'general.defaultLanguage': s.general.defaultLanguage,
  'general.timezone': s.general.timezone,
  'notification.inApp': s.notification.inApp,
  'notification.interviewReminderEmail': s.notification.interviewReminderEmail,
  'notification.jdDecisionEmail': s.notification.jdDecisionEmail,
  'notification.weeklyDigestEmail': s.notification.weeklyDigestEmail,
  'ai.interviewEnabled': s.ai.interviewEnabled,
  'ai.defaultQuestionCount': s.ai.defaultQuestionCount,
  'ai.maxAnswerSeconds': String(s.ai.maxAnswerSeconds),
  'ai.evaluatorModel': s.ai.evaluatorModel,
  'ai.sttEnabled': s.ai.sttEnabled,
});

const inputClass =
  'w-full h-10 box-border rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-3 ' +
  'text-ds-body-md text-on-surface shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60';

const selectClass =
  'w-full h-10 cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest ' +
  'pl-9 pr-10 text-ds-body-md text-on-surface shadow-sm transition-colors focus:border-primary focus:outline-none disabled:opacity-60';

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  (message ? (
    <p className="mt-1 text-ds-body-sm text-error">
      <span className={`${ICON} text-[14px] align-[-2px] mr-1`}>error</span>
      {message}
    </p>
  ) : null);

/** Hàng field theo mockup: cột trái nhãn + mô tả, cột phải control. */
const FieldRow: React.FC<{
  htmlFor?: string; label: string; hint: string; error?: string; children: React.ReactNode;
}> = ({ htmlFor, label, hint, error, children }) => (
  <div className="grid grid-cols-1 items-start gap-4 pt-2 md:grid-cols-3">
    <div className="flex flex-col gap-0.5">
      <label htmlFor={htmlFor} className="text-ds-label-md font-semibold text-on-surface">{label}</label>
      <span className="text-ds-body-sm text-on-surface-variant">{hint}</span>
    </div>
    <div className="md:col-span-2">
      {children}
      <FieldError message={error} />
    </div>
  </div>
);

const SectionShell: React.FC<{
  id: string; icon: string; iconCls: string; title: string; desc: string;
  aside?: React.ReactNode; children: React.ReactNode;
  dirty: boolean; saving: boolean; onSave: () => void; onCancel: () => void;
}> = ({ id, icon, iconCls, title, desc, aside, children, dirty, saving, onSave, onCancel }) => (
  <section id={id} className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
    <div className="flex flex-col gap-3 bg-surface-container-low/50 p-space-lg sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-space-md">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
          <span className={`${ICON} text-[24px]`}>{icon}</span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-ds-headline-sm font-bold text-on-surface">{title}</h3>
          <p className="text-ds-body-sm text-on-surface-variant">{desc}</p>
        </div>
      </div>
      {aside}
    </div>
    <div className="flex flex-col gap-space-lg p-space-lg">{children}</div>
    <div className="flex items-center justify-end gap-space-sm border-t border-surface-container bg-surface-container-low/30 px-space-lg py-space-md">
      <button type="button" onClick={onCancel} disabled={!dirty || saving} className={`${adminButton('ghost', 'h-10')} disabled:opacity-50`}>
        Hủy
      </button>
      <button type="button" onClick={onSave} disabled={!dirty || saving} className={`${adminButton('primary', 'h-10')} disabled:opacity-50`}>
        <span className={`${ICON} text-[18px]`}>{saving ? 'progress_activity' : 'check'}</span>
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
    </div>
  </section>
);

const HealthBar: React.FC<{ label: string; value: string; pct: number; barCls: string }> = ({
  label, value, pct, barCls,
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-ds-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-ds-label-md font-medium text-on-surface">{value}</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
      <div className={`h-full rounded-full ${barCls}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const AdminSystemSettingsPage: React.FC = () => {
  const [loaded, setLoaded] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<FlatSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState<Group | ''>('');
  const [activeNav, setActiveNav] = useState('section-general');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);
  const alive = useRef(true);

  useEffect(() => () => {
    alive.current = false;
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await AdminService.getSettings();
      if (!alive.current) return;
      const body = res.data.data!;
      setLoaded(body);
      setForm(toFlat(body));
    } catch (err) {
      if (alive.current) setLoadError(errorText(err, 'Không tải được cấu hình hệ thống.'));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4000);
  };

  const setValue = (key: FlatKey, value: FlatValue) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const dirtyGroups = useMemo(() => {
    const out: Record<Group, boolean> = { general: false, notification: false, ai: false };
    if (!loaded || !form) return out;
    const base = toFlat(loaded);
    (Object.keys(out) as Group[]).forEach((g) => {
      out[g] = GROUP_KEYS[g].some((k) => form[k] !== base[k]);
    });
    return out;
  }, [form, loaded]);

  const changedCount = useMemo(() => {
    if (!loaded || !form) return 0;
    const base = toFlat(loaded);
    return (Object.keys(base) as FlatKey[]).filter((k) => base[k] !== form[k]).length;
  }, [form, loaded]);

  const cancelGroup = (group: Group) => {
    if (!loaded) return;
    const base = toFlat(loaded);
    setForm((f) => {
      if (!f) return f;
      const next = { ...f };
      GROUP_KEYS[group].forEach((k) => { next[k] = base[k]; });
      return next;
    });
    setErrors((e) => {
      const next = { ...e };
      GROUP_KEYS[group].forEach((k) => delete next[k]);
      return next;
    });
  };

  const saveGroup = useCallback(async (group: Group) => {
    if (!loaded || !form) return;
    const base = toFlat(loaded);
    const patch: Record<string, FlatValue> = {};
    GROUP_KEYS[group].forEach((k) => {
      if (form[k] !== base[k]) patch[k.split('.')[1]] = form[k];
    });
    if (Object.keys(patch).length === 0) return;
    setSavingGroup(group);
    setBanner('');
    try {
      const res = await AdminService.updateSettings({ [group]: patch });
      const body = res.data.data!;
      if (!alive.current) return;
      setLoaded(body);
      setForm(toFlat(body));
      setErrors({});
      showToast('Đã lưu cấu hình thành công');
    } catch (err: unknown) {
      if (!alive.current) return;
      const data = (err as { response?: { data?: SettingsValidationError } })?.response?.data;
      if (data?.detail) {
        setErrors(data.detail);
        setBanner(data.message || 'Cấu hình không hợp lệ. Hệ thống không ghi thay đổi nào.');
      } else {
        setBanner(errorText(err, 'Không lưu được cấu hình.'));
      }
    } finally {
      if (alive.current) setSavingGroup('');
    }
  }, [form, loaded]);

  const gotoSection = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="px-space-xl py-space-lg">
        <LoadingBlock label="Đang tải cấu hình hệ thống..." />
      </div>
    );
  }

  if (!loaded || !form) {
    return (
      <div className="px-space-xl py-space-lg flex flex-col gap-space-md">
        <h1 className="text-ds-headline-xl text-on-surface font-bold tracking-tight">Cấu hình hệ thống</h1>
        <div className="flex items-start justify-between gap-space-md rounded-xl bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
          <span className="flex items-start gap-2">
            <span className={`${ICON} text-[20px]`}>error</span>
            <span>{loadError || 'Không đọc được cấu hình hệ thống.'}</span>
          </span>
          <button type="button" onClick={() => void load()} className={adminButton('ghost', 'h-9 shrink-0')}>
            <span className={`${ICON} text-[18px]`}>refresh</span>Thử lại
          </button>
        </div>
      </div>
    );
  }

  const aiOn = form['ai.interviewEnabled'] === true;

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <nav className="flex items-center gap-1 text-ds-body-sm text-on-surface-variant">
              <Link to="/admin" className="flex items-center gap-1 hover:text-primary transition-colors">
                <span className={`${ICON} text-[16px]`}>home</span>
                Trang chủ
              </Link>
              <span className="text-outline-strong">/</span>
              <span>Quản trị viên</span>
              <span className="text-outline-strong">/</span>
              <span className="font-medium text-on-surface">Cấu hình hệ thống</span>
            </nav>
            <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
              <h1 className="text-ds-headline-xl text-on-surface font-bold tracking-tight">Cấu hình hệ thống</h1>
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-ds-label-sm font-bold text-on-primary-fixed-variant">
                v2.4.0-prod
                <span className="ml-1 font-normal text-on-surface-variant">(demo)</span>
              </span>
            </div>
            <p className="max-w-3xl text-ds-body-md text-on-surface-variant">
              Quản lý các thiết lập chung, thông báo tự động và thông số vận hành AI của toàn bộ nền tảng
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start rounded-xl bg-surface-container-lowest border border-surface-container p-2 shadow-sm md:self-auto">
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-teal opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary-teal" />
              </span>
              <span className="text-ds-label-md font-semibold text-on-surface">Trạng thái: Hoạt động bình thường</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1.5 text-ds-body-sm text-on-surface-variant">
              <span className={`${ICON} text-[16px] text-outline-strong`}>history</span>
              <span>
                Cập nhật lần cuối: {loaded.meta.lastUpdatedAt ? timeAgo(loaded.meta.lastUpdatedAt) : 'chưa có thay đổi'}
                {loaded.meta.lastUpdatedBy && <> bởi {loaded.meta.lastUpdatedBy}</>}
              </span>
            </div>
          </div>
        </div>

        {banner && (
          <div className="flex items-start gap-2 rounded-xl bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
            <span className={`${ICON} text-[20px]`}>warning</span>
            <span>{banner} Không có thay đổi nào được ghi khi còn lỗi.</span>
          </div>
        )}
        {loadError && (
          <div className="flex items-start gap-2 rounded-xl bg-tertiary-fixed px-4 py-3 text-ds-body-md text-on-tertiary-fixed-variant">
            <span className={`${ICON} text-[20px]`}>info</span>
            <span>{loadError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          {/* Cột trái: điều hướng nhóm + health */}
          <div className="flex flex-col gap-space-md lg:col-span-3 lg:sticky lg:top-16">
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container p-1 shadow-sm">
              <div className="px-3 pb-1 pt-2">
                <span className="text-ds-label-sm font-bold uppercase tracking-wider text-outline-strong">Danh mục cài đặt</span>
              </div>
              <nav className="mt-1 flex flex-col gap-1">
                {([
                  { id: 'section-general', label: 'Chung', icon: 'tune' },
                  { id: 'section-notifications', label: 'Thông báo', icon: 'notifications_active', count: `${NOTIFICATION_ROWS.length} mục` },
                  { id: 'section-ai', label: 'AI Interview', icon: 'psychology', chip: 'Live v2.5' },
                ] as const).map((n) => {
                  const active = activeNav === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => gotoSection(n.id)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-ds-label-md transition-colors ${
                        active ? 'bg-primary-fixed font-semibold text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`${ICON} text-[20px] ${active ? 'text-primary' : ''}`}>{n.icon}</span>
                        {n.label}
                      </span>
                      {'count' in n && n.count && (
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-ds-label-sm font-medium text-on-surface-variant">{n.count}</span>
                      )}
                      {'chip' in n && n.chip && (
                        <span className="rounded-full bg-secondary-container/50 px-2 py-0.5 text-ds-label-sm font-semibold text-on-secondary-container">{n.chip}</span>
                      )}
                    </button>
                  );
                })}
                <Link
                  to="/admin/job-approvals"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-ds-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className={`${ICON} text-[20px]`}>verified_user</span>
                    Quy trình kiểm duyệt
                  </span>
                  <span className={`${ICON} text-[16px] text-outline-strong`}>arrow_forward</span>
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest border border-surface-container p-3 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <span className="flex items-center gap-1.5 text-ds-label-md font-bold text-on-surface">
                  <span className={`${ICON} text-[18px] text-primary`}>dns</span>
                  Hạ tầng kết nối AI
                </span>
                <span className="text-ds-label-sm text-outline-strong">Demo</span>
              </div>
              <HealthBar label="API DeepSeek / OpenAI" value="24ms (Ổn định)" pct={94} barCls="bg-secondary-teal" />
              <HealthBar label="Bộ nhớ lưu trữ Audio/CV" value="38% (190GB / 500GB)" pct={38} barCls="bg-primary-container" />
              <div className="flex items-center justify-between pt-1 text-ds-body-sm text-outline-strong">
                <span>Pool kết nối DB: 14/50 đang hoạt động</span>
                <Link to="/admin/audit" className="font-mono text-ds-label-sm font-semibold text-primary hover:underline">Chi tiết</Link>
              </div>
            </div>
          </div>

          {/* Cột phải: 3 nhóm cấu hình */}
          <div className="flex flex-col gap-space-lg lg:col-span-9">
            <SectionShell
              id="section-general" icon="apartment" iconCls="bg-primary-fixed text-primary"
              title="Thông tin cơ bản nền tảng"
              desc="Các thông tin hiển thị thương hiệu và cấu hình quốc tế hóa mặc định"
              aside={<span className="rounded-full bg-surface-container px-2 py-1 text-ds-label-sm text-on-surface-variant">Cài đặt công khai</span>}
              dirty={dirtyGroups.general}
              saving={savingGroup === 'general'}
              onSave={() => void saveGroup('general')}
              onCancel={() => cancelGroup('general')}
            >
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-ds-label-md font-semibold text-on-surface">Logo hệ thống</span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Hiển thị trên thanh điều hướng, hóa đơn và email thông báo.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container-low p-1.5 shadow-sm">
                    <span className={`${ICON} text-[28px] text-primary`}>smart_toy</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <button type="button" disabled title="Chức năng tải logo chưa khả dụng" className={`${adminButton('primary', 'h-9')} disabled:opacity-50`}>
                        <span className={`${ICON} text-[18px]`}>cloud_upload</span>
                        Tải ảnh mới
                      </button>
                      <button type="button" disabled className={`${adminButton('ghost', 'h-9')} disabled:opacity-50`}>Xóa</button>
                    </div>
                    <span className="text-ds-body-sm text-outline-strong">
                      Định dạng PNG, SVG, JPG. Kích thước đề xuất 512x512px. Tối đa 2MB.
                    </span>
                  </div>
                </div>
              </div>

              <FieldRow
                htmlFor="system-name" label="Tên hệ thống"
                hint="Tên định danh thương hiệu hiển thị trên web app. Tối đa 100 ký tự."
                error={errors['general.platformName']}
              >
                <input
                  id="system-name" className={inputClass} type="text"
                  value={form['general.platformName'] as string}
                  onChange={(e) => setValue('general.platformName', e.target.value)}
                />
              </FieldRow>

              <FieldRow
                htmlFor="support-email" label="Email liên hệ & hỗ trợ"
                hint="Địa chỉ tiếp nhận thông tin khi người dùng gửi phản hồi."
                error={errors['general.supportEmail']}
              >
                <span className="relative flex items-center">
                  <span className={`${ICON} pointer-events-none absolute left-3 text-[18px] text-outline-strong`}>mail</span>
                  <input
                    id="support-email" className={`${inputClass} pl-9`} type="email"
                    value={form['general.supportEmail'] as string}
                    onChange={(e) => setValue('general.supportEmail', e.target.value)}
                  />
                </span>
              </FieldRow>

              <FieldRow
                htmlFor="default-lang" label="Ngôn ngữ mặc định"
                hint="Ngôn ngữ kích hoạt đầu tiên khi ứng viên truy cập."
                error={errors['general.defaultLanguage']}
              >
                <span className="relative flex items-center">
                  <select
                    id="default-lang" className={`${selectClass} pl-3.5`}
                    value={form['general.defaultLanguage'] as string}
                    onChange={(e) => setValue('general.defaultLanguage', e.target.value)}
                  >
                    {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className={`${ICON} pointer-events-none absolute right-3 text-[20px] text-outline-strong`}>arrow_drop_down</span>
                </span>
              </FieldRow>

              <FieldRow
                htmlFor="timezone" label="Múi giờ hệ thống"
                hint="Đồng bộ lịch hẹn và phiên phỏng vấn video AI."
                error={errors['general.timezone']}
              >
                <span className="relative flex items-center">
                  <span className={`${ICON} pointer-events-none absolute left-3 text-[18px] text-outline-strong`}>schedule</span>
                  <select
                    id="timezone" className={selectClass}
                    value={form['general.timezone'] as string}
                    onChange={(e) => setValue('general.timezone', e.target.value)}
                  >
                    {TZ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className={`${ICON} pointer-events-none absolute right-3 text-[20px] text-outline-strong`}>arrow_drop_down</span>
                </span>
              </FieldRow>
            </SectionShell>

            <SectionShell
              id="section-notifications" icon="forward_to_inbox" iconCls="bg-tertiary-fixed text-tertiary"
              title="Kênh thông báo & Cảnh báo tự động"
              desc="Thiết lập các luồng thông báo gửi tới ứng viên, nhà tuyển dụng và ban quản trị"
              aside={
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/50 px-2 py-1 text-ds-label-sm font-semibold text-on-secondary-container">
                  <span className={`${ICON} text-[14px]`}>bolt</span> Real-time
                </span>
              }
              dirty={dirtyGroups.notification}
              saving={savingGroup === 'notification'}
              onSave={() => void saveGroup('notification')}
              onCancel={() => cancelGroup('notification')}
            >
              {NOTIFICATION_ROWS.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low/50 p-3 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex max-w-xl items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm ${r.tone}`}>
                      <span className={`${ICON} text-[20px]`}>{r.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-ds-label-md font-bold text-on-surface">{r.title}</span>
                      <span className="text-ds-body-sm text-on-surface-variant">{r.desc}</span>
                      {errors[r.key] && <FieldError message={errors[r.key]} />}
                    </div>
                  </div>
                  <Toggle
                    label={r.title}
                    checked={form[r.key] === true}
                    disabled={savingGroup === 'notification'}
                    onChange={(v) => setValue(r.key, v)}
                  />
                </div>
              ))}
            </SectionShell>

            <SectionShell
              id="section-ai" icon="auto_awesome" iconCls="bg-secondary-container/50 text-on-secondary-container"
              title="Tham số phòng phỏng vấn AI"
              desc="Điều chỉnh thuật toán, số lượng câu hỏi và thời gian giới hạn cho mỗi phiên luyện tập"
              aside={
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-1 text-ds-label-sm font-semibold text-primary">
                  <span className={`${ICON} text-[14px]`}>psychology</span> AI Engine Core
                </span>
              }
              dirty={dirtyGroups.ai}
              saving={savingGroup === 'ai'}
              onSave={() => void saveGroup('ai')}
              onCancel={() => cancelGroup('ai')}
            >
              <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm">
                    <span className={`${ICON} text-[28px]`}>graphic_eq</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ds-headline-sm font-bold text-on-surface">Bật tính năng AI Interview</span>
                      <span className={`rounded-full px-2 py-0.5 text-ds-label-sm font-semibold ${aiOn ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {aiOn ? 'Đang kích hoạt' : 'Tạm tắt'}
                      </span>
                    </div>
                    <span className="text-ds-body-sm text-on-surface-variant">
                      Cho phép ứng viên tạo phiên mô phỏng phỏng vấn video với AI và nhận báo cáo đánh giá tự động.
                    </span>
                  </div>
                </div>
                <Toggle
                  label="Bật tính năng AI Interview"
                  checked={aiOn}
                  disabled={savingGroup === 'ai'}
                  onChange={(v) => setValue('ai.interviewEnabled', v)}
                />
              </div>

              <div className={`grid grid-cols-1 gap-space-lg transition-opacity md:grid-cols-2 ${aiOn ? '' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="ai-question-count" className="flex items-center justify-between text-ds-label-md font-semibold text-on-surface">
                    <span>Số câu hỏi mặc định mỗi phiên</span>
                    <span className="text-ds-label-sm text-outline-strong">Cho phép: 3 - 15 câu</span>
                  </label>
                  <span className="relative flex items-center">
                    <span className={`${ICON} pointer-events-none absolute left-3 text-[18px] text-outline-strong`}>quiz</span>
                    <input
                      id="ai-question-count" className={`${inputClass} pl-9`} type="number" min={3} max={15}
                      value={form['ai.defaultQuestionCount'] as number}
                      onChange={(e) => setValue('ai.defaultQuestionCount', Number(e.target.value))}
                    />
                  </span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Số lượng câu hỏi tạo sự cân bằng tối ưu giữa đánh giá sâu và thời lượng phỏng vấn (15-20 phút).
                  </span>
                  <FieldError message={errors['ai.defaultQuestionCount']} />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="ai-response-time" className="text-ds-label-md font-semibold text-on-surface">
                    Thời gian trả lời tối đa mỗi câu
                  </label>
                  <span className="relative flex items-center">
                    <span className={`${ICON} pointer-events-none absolute left-3 text-[18px] text-outline-strong`}>timer</span>
                    <select
                      id="ai-response-time" className={selectClass}
                      value={form['ai.maxAnswerSeconds'] as string}
                      onChange={(e) => setValue('ai.maxAnswerSeconds', e.target.value)}
                    >
                      {ANSWER_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span className={`${ICON} pointer-events-none absolute right-3 text-[20px] text-outline-strong`}>arrow_drop_down</span>
                  </span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Hệ thống sẽ tự động dừng lắng nghe và chuyển sang câu tiếp theo khi hết thời gian.
                  </span>
                  <FieldError message={errors['ai.maxAnswerSeconds']} />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="ai-evaluator-model" className="text-ds-label-md font-semibold text-on-surface">
                    Mô hình AI chấm điểm & sinh câu hỏi
                  </label>
                  <span className="relative flex items-center">
                    <span className={`${ICON} pointer-events-none absolute left-3 text-[18px] text-secondary-teal`}>smart_toy</span>
                    <select
                      id="ai-evaluator-model" className={selectClass}
                      value={form['ai.evaluatorModel'] as string}
                      onChange={(e) => setValue('ai.evaluatorModel', e.target.value)}
                    >
                      {MODEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span className={`${ICON} pointer-events-none absolute right-3 text-[20px] text-outline-strong`}>arrow_drop_down</span>
                  </span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Model được tinh chỉnh với dữ liệu 50,000+ kịch bản phỏng vấn IT, Kinh doanh và Marketing theo tiêu chuẩn STAR.
                  </span>
                  <FieldError message={errors['ai.evaluatorModel']} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low/50 p-3 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-primary shadow-sm">
                      <span className={`${ICON} text-[20px]`}>mic</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-ds-label-md font-bold text-on-surface">
                        Tự động ghi âm và chuyển đổi giọng nói (STT)
                      </span>
                      <span className="text-ds-body-sm text-on-surface-variant">
                        Bóc băng câu trả lời thành văn bản theo thời gian thực để trích xuất từ khóa và đo lường độ trôi chảy
                      </span>
                    </div>
                  </div>
                  <Toggle
                    label="Tự động ghi âm và chuyển đổi giọng nói (STT)"
                    checked={form['ai.sttEnabled'] === true}
                    disabled={savingGroup === 'ai'}
                    onChange={(v) => setValue('ai.sttEnabled', v)}
                  />
                </div>
              </div>
            </SectionShell>

            <p className="text-ds-body-sm text-on-surface-variant">
              Chỉ ghi các khóa đã thay đổi ({changedCount} khóa đang chờ lưu). Lần ghi gần nhất:
              <span className="ml-1 font-medium text-on-surface">
                {loaded.meta.lastUpdatedAt ? fmtServer(loaded.meta.lastUpdatedAt, 'datetime') : 'chưa có'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-proof border border-surface-container">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container/50 text-on-secondary-container">
            <span className={`${ICON} text-[22px]`}>check_circle</span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 pr-2">
            <span className="text-ds-label-md font-bold text-on-surface">Đã lưu cấu hình thành công</span>
            <p className="text-ds-body-sm text-on-surface-variant">Các thay đổi đã được áp dụng ngay trên toàn hệ thống.</p>
            <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
              <span className="block h-full w-full rounded-full bg-secondary-teal" />
            </span>
          </div>
          <button type="button" aria-label="Đóng thông báo" className="rounded-lg p-1 text-outline-strong transition-colors hover:text-on-surface" onClick={() => setToast('')}>
            <span className={`${ICON} text-[18px]`}>close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSystemSettingsPage;
