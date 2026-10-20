/**
 * STATIC mockup — "Tài khoản của tôi" (Admin account settings).
 * BE chưa có endpoint self-service cho admin: không có cập nhật hồ sơ của chính mình,
 * đổi mật khẩu bằng mật khẩu hiện tại, 2FA, hay danh sách phiên đăng nhập
 * (chỉ có /auth/me đọc và luồng forgot-password qua email/token) -> trang này là bản demo,
 * không gọi API, không link sidebar.
 * Ảnh đại diện trong mockup là ảnh stock nên thay bằng khối chữ viết tắt; ô mật khẩu để trống
 * thay vì value demo. Chrome tiếng Anh, dữ liệu demo giữ nguyên văn tiếng Việt.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 đường viền hairline, #94a3b8 placeholder,
 * #10b981/#047857 nhịp xanh đạt (dot online, thanh strength), #92400e vàng cảnh báo,
 * #d8e2ff/#adc6ff/#004598 nhóm tertiary (icon khóa, hộp ghi chú).
 */
import React, { useMemo, useState } from 'react';
import { Badge, buttonClass } from '../components/ui';

const MONO = 'font-mono text-label-sm';

const ADMIN_ID = 'ID: ADM-89021';
const LAST_PROFILE_UPDATE = 'Lần cập nhật cuối: 02/03/2025 09:30';

const RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: v => v.length >= 8 },
  { key: 'case', label: 'Chứa ít nhất một chữ hoa và chữ thường', test: v => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { key: 'digit', label: 'Chứa ít nhất một chữ số', test: v => /\d/.test(v) },
  { key: 'symbol', label: 'Chứa ít nhất một ký tự đặc biệt (!@#$...)', test: v => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_LABEL = ['Too weak (0/4)', 'Weak (1/4)', 'Fair (2/4)', 'Good (3/4)', 'Strong (4/4)'];

const SESSIONS = [
  {
    icon: 'laptop_mac', tile: 'bg-info text-primary', device: 'Chrome trên macOS (Sonoma)',
    meta: 'Hà Nội, Việt Nam • IP: 14.161.42.10', current: true, state: 'Đang kết nối',
  },
  {
    icon: 'smartphone', tile: 'bg-surface-high text-ink-variant', device: 'Safari trên iPhone 15 Pro',
    meta: 'TP. Hồ Chí Minh, Việt Nam • 1 ngày trước', current: false, state: '',
  },
];

const inputFieldClass =
  'h-10 w-full box-border rounded-lg border border-[#e2e8f0] bg-card pl-9 pr-3 text-body-md text-ink ' +
  'shadow-sm transition-colors placeholder:text-[#94a3b8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const passwordFieldClass =
  'h-10 w-full box-border rounded-lg border border-[#e2e8f0] bg-card pl-3 pr-10 text-body-md text-ink ' +
  'shadow-sm transition-colors placeholder:text-[#94a3b8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const AdminAccountSettingsPage: React.FC = () => {
  const [fullName, setFullName] = useState('Nguyễn Văn Quản Trị');
  const [phone, setPhone] = useState('0988 123 456');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [reveal, setReveal] = useState<{ current: boolean; new: boolean; confirm: boolean }>({
    current: false, new: false, confirm: false,
  });
  const [savedProfile, setSavedProfile] = useState(false);

  const passed = useMemo(() => RULES.filter(r => r.test(newPwd)), [newPwd]);
  const match = newPwd.length > 0 && newPwd === confirmPwd;

  const initials = fullName.trim().split(/\s+/).slice(-2).map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 text-headline-lg text-ink">Tài khoản của tôi</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-info px-3 py-1 text-label-md text-info-text`}>
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              Quản trị viên hệ thống (Super Admin)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-label-sm text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
              </span>
              Tài khoản đang hoạt động
            </span>
          </div>
          <p className="m-0 text-body-md text-ink-variant">
            Quản lý thông tin hồ sơ quản trị viên và thiết lập bảo mật tài khoản
          </p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-xl border border-[#e2e8f0] bg-card px-4 py-2 shadow-sm md:self-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-high text-primary">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div>
            <p className="m-0 text-label-sm text-ink-variant">Cấp độ bảo mật</p>
            <p className="m-0 flex items-center gap-1 text-label-md text-ink">
              2FA Đã kích hoạt
              <span className="material-symbols-outlined text-[16px] text-[#047857]">check_circle</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Personal profile */}
        <section className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-sm lg:col-span-7">
          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-surface-high pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info text-primary">
                  <span className="material-symbols-outlined text-[22px]">account_circle</span>
                </div>
                <div>
                  <h2 className="m-0 text-headline-sm text-ink">Thông tin cá nhân</h2>
                  <p className="m-0 text-body-sm text-ink-variant">Cập nhật ảnh đại diện và chi tiết liên hệ của bạn</p>
                </div>
              </div>
              <span className={`${MONO} rounded bg-surface-mid px-2 py-0.5 text-ink-variant`}>{ADMIN_ID}</span>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-low p-4 sm:flex-row sm:items-start">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-info text-display font-bold text-info-text ring-4 ring-primary-fixed">
                  {initials || 'AD'}
                </div>
                <span
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
                  title="Đã xác minh"
                >
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <button type="button" className={buttonClass('secondary', 'h-9')}>
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    Tải ảnh mới
                  </button>
                  <button type="button" className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-label-md font-medium text-error transition-colors hover:bg-danger-bg">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Xóa ảnh
                  </button>
                </div>
                <p className="m-0 text-body-sm leading-relaxed text-ink-variant">
                  Định dạng hỗ trợ JPG, PNG hoặc GIF. Dung lượng tối đa 2MB. Khuyến nghị ảnh vuông tỉ lệ 1:1 (400x400px).
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3">
              <Field label="Họ và tên đầy đủ" required>
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong">badge</span>
                  <input
                    className={inputFieldClass} type="text" placeholder="Nhập họ và tên đầy đủ"
                    value={fullName} onChange={e => { setFullName(e.target.value); setSavedProfile(false); }}
                  />
                </span>
              </Field>

              <Field
                label="Địa chỉ Email quản trị" readOnlyChip
                note="Email quản trị viên không thể tự thay đổi. Vui lòng liên hệ bộ phận kỹ thuật để yêu cầu cập nhật."
              >
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong">mail</span>
                  <input
                    className={`${inputFieldClass} pr-9 cursor-not-allowed bg-surface-low text-ink-variant shadow-none`}
                    type="email" value="admin@ai-interview.vn" readOnly disabled
                  />
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong">lock</span>
                </span>
              </Field>

              <Field label="Số điện thoại liên hệ">
                <span className="relative flex items-center">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong">call</span>
                  <input
                    className={inputFieldClass} type="tel" placeholder="Nhập số điện thoại liên hệ"
                    value={phone} onChange={e => { setPhone(e.target.value); setSavedProfile(false); }}
                  />
                </span>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadonlyCell
                  label="Vai trò hệ thống" icon="admin_panel_settings" iconCls="text-primary"
                  value="Quản trị viên cấp cao (Super Admin)"
                />
                <ReadonlyCell
                  label="Ngày tham gia hệ thống" icon="calendar_month" iconCls="text-outline-strong"
                  value="15/01/2024"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-surface-high bg-surface-low px-5 py-3 sm:flex-row md:px-6">
            <span className="flex items-center gap-1 text-body-sm text-ink-variant">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {LAST_PROFILE_UPDATE}
            </span>
            <button
              type="button"
              className={buttonClass('primary', 'h-10 w-full rounded-lg px-5 sm:w-auto')}
              onClick={() => setSavedProfile(true)}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Lưu thông tin cá nhân
            </button>
          </div>
          {savedProfile && (
            <p className="m-0 flex items-center gap-1.5 border-t border-[#e2e8f0] bg-success-bg px-5 py-2 text-body-sm text-success-text" role="status">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Mockup only — there is no self-service profile endpoint, so this change is not persisted.
            </p>
          )}
        </section>

        {/* Password */}
        <section className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#e2e8f0] bg-card shadow-sm lg:col-span-5">
          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-surface-high pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d8e2ff] text-[#004598]">
                  <span className="material-symbols-outlined text-[22px]">key</span>
                </div>
                <div>
                  <h2 className="m-0 text-headline-sm text-ink">Đổi mật khẩu</h2>
                  <p className="m-0 text-body-sm text-ink-variant">Bảo vệ quyền truy cập quản trị viên cấp cao</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="current-pwd" className="text-label-md text-ink">
                    Mật khẩu hiện tại <span className="text-error">*</span>
                  </label>
                  <span className="text-label-sm font-medium text-primary">Quên mật khẩu?</span>
                </div>
                <span className="relative flex items-center">
                  <input
                    id="current-pwd" className={passwordFieldClass} type={reveal.current ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu đang dùng" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  />
                  <button
                    type="button" aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-strong transition-colors hover:text-ink"
                    onClick={() => setReveal(v => ({ ...v, current: !v.current }))}
                  >
                    <span className="material-symbols-outlined text-[20px]">{reveal.current ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pwd" className="text-label-md text-ink">
                  Mật khẩu mới <span className="text-error">*</span>
                </label>
                <span className="relative flex items-center">
                  <input
                    id="new-pwd" className={passwordFieldClass} type={reveal.new ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  />
                  <button
                    type="button" aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-strong transition-colors hover:text-ink"
                    onClick={() => setReveal(v => ({ ...v, new: !v.new }))}
                  >
                    <span className="material-symbols-outlined text-[20px]">{reveal.new ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </span>

                {/* Strength meter tính thật từ ô mật khẩu mới */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm text-ink-variant">Độ mạnh mật khẩu:</span>
                    <span className={`text-label-sm font-semibold ${
                      passed.length >= 4 ? 'text-success-text' : passed.length >= 2 ? 'text-[#92400e]' : 'text-danger-text'
                    }`}
                    >
                      {STRENGTH_LABEL[passed.length]}
                    </span>
                  </div>
                  <div className="grid h-1.5 w-full grid-cols-4 gap-1.5">
                    {RULES.map((r, i) => (
                      <span
                        key={r.key}
                        className={`h-full rounded-full ${i < passed.length ? 'bg-[#10b981]' : 'bg-surface-high'}`}
                      />
                    ))}
                  </div>
                  <ul className="m-0 list-none space-y-1.5 p-0 pt-1 text-body-sm">
                    {RULES.map(r => {
                      const ok = r.test(newPwd);
                      return (
                        <li key={r.key} className={`flex items-center gap-1.5 ${ok ? 'text-[#047857]' : 'text-ink-variant'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${ok ? 'font-bold' : 'text-outline-strong'}`}>
                            {ok ? 'check' : 'radio_button_unchecked'}
                          </span>
                          <span>{r.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-pwd" className="text-label-md text-ink">
                  Xác nhận mật khẩu mới <span className="text-error">*</span>
                </label>
                <span className="relative flex items-center">
                  <input
                    id="confirm-pwd" className={passwordFieldClass} type={reveal.confirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  />
                  <button
                    type="button" aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-strong transition-colors hover:text-ink"
                    onClick={() => setReveal(v => ({ ...v, confirm: !v.confirm }))}
                  >
                    <span className="material-symbols-outlined text-[20px]">{reveal.confirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </span>
                {confirmPwd.length > 0 && (
                  <span className={`flex items-center gap-1 text-label-sm ${match ? 'text-[#047857]' : 'text-danger-text'}`}>
                    <span className="material-symbols-outlined text-[16px]">{match ? 'check_circle' : 'error'}</span>
                    {match ? 'Mật khẩu khớp nhau' : 'Mật khẩu không khớp'}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#adc6ff]/50 bg-[#d8e2ff]/40 p-3">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#004598]">info</span>
                <p className="m-0 text-body-sm leading-snug text-ink">
                  Sau khi đổi mật khẩu thành công, bạn vẫn sẽ duy trì phiên đăng nhập trên thiết bị hiện tại
                  và nhận email cảnh báo bảo mật.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-surface-high bg-surface-low px-5 py-3 md:px-6">
            <button type="button" className={buttonClass('secondary', 'h-10 rounded-lg')}>Hủy thay đổi</button>
            <button
              type="button"
              className={buttonClass('primary', 'h-10 rounded-lg')}
              disabled={passed.length < 4 || !match || currentPwd.length === 0}
            >
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              Cập nhật mật khẩu
            </button>
          </div>
        </section>
      </div>

      {/* Active sessions */}
      <section className="rounded-xl border border-[#e2e8f0] bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="m-0 flex items-center gap-2 text-headline-sm text-ink">
              <span className="material-symbols-outlined text-[20px] text-primary">devices</span>
              Thiết bị đăng nhập hoạt động
            </h3>
            <p className="m-0 text-body-sm text-ink-variant">Các phiên làm việc gần nhất bằng tài khoản của bạn</p>
          </div>
          <button type="button" className="inline-flex items-center gap-1.5 self-start text-label-md font-medium text-error hover:underline sm:self-auto">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất tất cả thiết bị khác
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SESSIONS.map(s => (
            <div
              key={s.device}
              className={`flex items-center justify-between gap-3 rounded-lg bg-surface-low p-3 ${
                s.current ? 'border border-primary/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.tile}`}>
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="m-0 flex flex-wrap items-center gap-2 text-label-md text-ink">
                    {s.device}
                    {s.current && (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success-text">Hiện tại</span>
                    )}
                  </p>
                  <p className="m-0 truncate text-body-sm text-ink-variant">{s.meta}</p>
                </div>
              </div>
              {s.current
                ? <span className="shrink-0 text-label-sm text-[#047857]">{s.state}</span>
                : <button type="button" className="shrink-0 text-label-sm font-medium text-ink-variant transition-colors hover:text-error">Thu hồi</button>}
            </div>
          ))}
        </div>
        <div className="pt-3">
          <Badge tone="neutral" icon="hive">
            Mockup only — the backend does not expose an admin session list yet.
          </Badge>
        </div>
      </section>
    </div>
  );
};

const Field: React.FC<{
  label: string; required?: boolean; readOnlyChip?: boolean; note?: string; children: React.ReactNode;
}> = ({ label, required, readOnlyChip, note, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-label-md text-ink">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {readOnlyChip && (
        <span className={`inline-flex items-center gap-1 rounded bg-surface-mid px-1.5 py-0.5 text-[11px] text-ink-variant`}>
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Chỉ đọc
        </span>
      )}
    </div>
    {children}
    {note && (
      <p className="mt-1 mb-0 flex items-center gap-1 text-body-sm text-outline-strong">
        <span className="material-symbols-outlined text-[14px]">info</span>
        {note}
      </p>
    )}
  </div>
);

const ReadonlyCell: React.FC<{ label: string; icon: string; iconCls: string; value: string }> = ({
  label, icon, iconCls, value,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-label-md text-ink-variant">{label}</label>
    <div className="flex h-10 items-center gap-2 rounded-lg border border-surface-high bg-surface-low px-3">
      <span className={`material-symbols-outlined text-[18px] ${iconCls}`}>{icon}</span>
      <span className="truncate text-label-md text-ink">{value}</span>
    </div>
  </div>
);

export default AdminAccountSettingsPage;
