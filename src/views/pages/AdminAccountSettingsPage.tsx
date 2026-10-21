/**
 * Màn "Tài khoản của tôi" (screen_22 — admin account) — DATA page.
 *
 * Số thật: GET /admin/users/{id} (id lấy từ phiên đăng nhập) cho họ tên / email / SĐT / vai trò /
 * trạng thái / ngày tham gia / lần cập nhật cuối; "Lưu thông tin cá nhân" = PATCH /admin/users/{id}
 * chỉ gửi fullName + phone (email giữ chỉ đọc vì BE chặn: "Không thể đổi email của chính tài khoản
 * quản trị đang đăng nhập"); "Cập nhật mật khẩu" = POST /api/user/change-password với 4 rule khớp
 * từng message của BE (UserServiceImpl.validateNewPassword).
 *
 * Sao đổi so với mockup:
 * - BE đổi mật khẩu thì tokenVersion++ => THU HỒI MỌI phiên (kể cả máy đang dùng), nên hộp ghi chú
 *   "vẫn duy trì phiên đăng nhập hiện tại" được viết lại theo nội dung thật + nút đăng xuất.
 * - Tên trên thanh tiêu đề shell đọc từ bản lưu lúc đăng nhập -> chỉ đổi sau khi đăng nhập lại (ghi trong toast).
 * - Chip "ID: ADM-89021" -> id thật "ID: #<id>"; chip trạng thái dùng status thật thay vì mặc định "đang hoạt động".
 * - Side effect: GET /admin/users/{id} ghi 1 dòng audit VIEW_USER mỗi lần mở màn (BE không có endpoint
 *   self-service nào trả createdAt/status; route này đã chặn ROLE_STAFF nên không thể 403).
 *
 * Khối demo (BE chưa có endpoint, giữ nguyên văn mockup — đã ghi ở spec/INDEX.md): tải / xóa ảnh đại
 * diện, ô "Cấp độ bảo mật: 2FA Đã kích hoạt", danh sách "Thiết bị đăng nhập hoạt động" + nút "Thu hồi".
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import AuthService from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { Role, UserDetail } from '../../models/User.model';
import {
  ErrorBlock, ICON, LoadingBlock, Pill, STATUS_VN, adminButton, adminInputClass,
  errorText, fmtServer, initialsOf,
} from '../components/adminKit';

/** 4 rule mật khẩu == 4 message BE (validateNewPassword); ký tự đặc biệt đúng dãy @#$%^&+=!. */
const RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: v => v.length >= 8 },
  { key: 'case', label: 'Chứa ít nhất một chữ hoa và chữ thường', test: v => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { key: 'digit', label: 'Chứa ít nhất một chữ số', test: v => /\d/.test(v) },
  { key: 'symbol', label: 'Chứa ít nhất một ký tự đặc biệt (@#$%^&+=!)', test: v => /[@#$%^&+=!]/.test(v) },
];

const STRENGTH_LABEL = ['Rất yếu (0/4)', 'Yếu (1/4)', 'Trung bình (2/4)', 'Khá an toàn (3/4)', 'Mạnh (4/4)'];

/** Nội dung gốc mockup — BE chưa có API danh sách phiên nên chưa có số thật để thay. */
const SESSIONS = [
  {
    icon: 'laptop_mac', tile: 'bg-primary-fixed text-primary', device: 'Chrome trên macOS (Sonoma)',
    meta: 'Hà Nội, Việt Nam • IP: 14.161.42.10', current: true, state: 'Đang kết nối',
  },
  {
    icon: 'smartphone', tile: 'bg-surface-container-high text-on-surface-variant', device: 'Safari trên iPhone 15 Pro',
    meta: 'TP. Hồ Chí Minh, Việt Nam • 1 ngày trước', current: false, state: '',
  },
];

const ACCOUNT_TEXT: Record<string, string> = {
  ACTIVE: 'Tài khoản đang hoạt động',
  INACTIVE: 'Tài khoản đã vô hiệu hóa',
  LOCKED: 'Tài khoản đang bị khóa',
  PENDING: 'Tài khoản chưa xác thực',
};

const ROLE_CHIP_TEXT: Record<Role, string> = {
  ROLE_USER: 'Ứng viên',
  ROLE_INTERVIEWER: 'Nhà tuyển dụng / Cố vấn',
  ROLE_STAFF: 'Nhân viên vận hành hệ thống',
  ROLE_ADMIN: 'Quản trị viên hệ thống (Super Admin)',
};

/** Mockup dùng ảnh stock; chưa có endpoint tải ảnh nên thay bằng khối viết tắt từ họ tên thật. */
const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="relative w-24 h-24 shrink-0">
    <div className="w-full h-full rounded-full bg-primary-fixed-dim text-primary flex items-center justify-center text-ds-headline-xl font-bold ring-4 ring-primary-fixed">
      {initialsOf(name)}
    </div>
    <span
      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-secondary-teal text-on-secondary-teal flex items-center justify-center shadow-md"
      title="Đã xác minh"
    >
      <span className={`${ICON} text-[14px]`}>verified</span>
    </span>
  </div>
);

const Field: React.FC<{
  label: string; required?: boolean; readOnlyChip?: boolean; note?: string; children: React.ReactNode;
}> = ({ label, required, readOnlyChip, note, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className="text-ds-label-md text-on-surface">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {readOnlyChip && (
        <span className="inline-flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5 text-[11px] text-outline-strong">
          <span className={`${ICON} text-[14px]`}>lock</span>
          Chỉ đọc
        </span>
      )}
    </div>
    {children}
    {note && (
      <p className="mt-1 flex items-start gap-1 text-ds-body-sm text-outline-strong">
        <span className={`${ICON} text-[14px] shrink-0`}>info</span>
        <span>{note}</span>
      </p>
    )}
  </div>
);

const ReadonlyCell: React.FC<{ label: string; icon: string; iconCls: string; value: string }> = ({
  label, icon, iconCls, value,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-ds-label-md text-on-surface-variant">{label}</span>
    <div className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container-high flex items-center gap-2">
      <span className={`${ICON} text-[18px] ${iconCls}`}>{icon}</span>
      <span className="truncate text-ds-label-md text-on-surface">{value}</span>
    </div>
  </div>
);

/** Ghi chú cho khối không có endpoint (UI tiếng Việt 100%). */
const DemoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Pill icon="hive">{children}</Pill>
);

const MessageRow: React.FC<{ kind: 'success' | 'error'; children: React.ReactNode }> = ({ kind, children }) => (
  <p
    role="status"
    className={`m-0 flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-ds-body-sm ${
      kind === 'success'
        ? 'bg-secondary-container/50 text-on-secondary-container'
        : 'bg-error-container text-on-error-container'
    }`}
  >
    <span className={`${ICON} text-[18px]`}>{kind === 'success' ? 'check_circle' : 'error'}</span>
    <span className="flex-1 min-w-0">{children}</span>
  </p>
);

const EyeButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button
    type="button"
    aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-strong hover:text-on-surface border-0 bg-transparent cursor-pointer p-0"
  >
    <span className={`${ICON} text-[20px]`}>{shown ? 'visibility_off' : 'visibility'}</span>
  </button>
);

const AdminAccountSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const userId = user?.id ?? 0;

  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [reveal, setReveal] = useState({ current: false, new: false, confirm: false });
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    try {
      const res = await AdminService.getUserDetail(userId);
      const detail = res.data.data;
      if (!alive.current || !detail) return;
      setProfile(detail);
      setFullName(detail.fullName);
      setPhone(detail.phone ?? '');
    } catch (err) {
      if (alive.current) setLoadError(errorText(err, 'Không tải được hồ sơ tài khoản.'));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [userId]);

  // userId bất biến trong phiên -> mỗi lần mở màn đúng một request hồ sơ.
  useEffect(() => { void load(); }, [load]);

  const role = profile?.role ?? user?.role ?? 'ROLE_ADMIN';
  const status = profile?.status ?? 'ACTIVE';
  const statusMeta = STATUS_VN[status] ?? STATUS_VN.ACTIVE;
  const passed = useMemo(() => RULES.filter(r => r.test(newPwd)).length, [newPwd]);
  const match = newPwd.length > 0 && newPwd === confirmPwd;
  const dirty = !!profile && (fullName !== profile.fullName || phone !== (profile.phone ?? ''));
  const canSave = !!profile && !saving && dirty && fullName.trim().length > 0;

  const saveProfile = useCallback(async () => {
    if (!profile || !canSave) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await AdminService.updateProfile(profile.id, { fullName: fullName.trim(), phone: phone.trim() });
      const updated = res.data.data?.user;
      if (!alive.current) return;
      if (updated) {
        setProfile(updated);
        setFullName(updated.fullName);
        setPhone(updated.phone ?? '');
      }
      const renamed = !!user && !!updated && updated.fullName !== user.fullName;
      setSaveMsg({
        kind: 'success',
        text: `${res.data.message ?? 'Hồ sơ đã được cập nhật'}${renamed ? ' — tên trên thanh tiêu đề đổi sau khi đăng nhập lại.' : ''}`,
      });
    } catch (err) {
      if (alive.current) setSaveMsg({ kind: 'error', text: errorText(err, 'Không lưu được hồ sơ.') });
    } finally {
      if (alive.current) setSaving(false);
    }
  }, [canSave, fullName, phone, profile, user]);

  const cancelChanges = useCallback(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? '');
    setSaveMsg(null);
  }, [profile]);

  const submitPassword = useCallback(async () => {
    setPwdMsg(null);
    setChanging(true);
    try {
      const res = await AuthService.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      if (!alive.current) return;
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({
        kind: 'success',
        text: res.data.message ?? 'Đổi mật khẩu thành công. Mọi phiên đăng nhập cũ đã bị thu hồi.',
      });
    } catch (err) {
      if (alive.current) setPwdMsg({ kind: 'error', text: errorText(err, 'Không đổi được mật khẩu.') });
    } finally {
      if (alive.current) setChanging(false);
    }
  }, [currentPwd, newPwd]);

  const pwdBlocked = changing || currentPwd.length === 0 || passed < 4 || !match;

  return (
    <div className="flex flex-col gap-space-xl">
      {/* Header: tiêu đề + chip vai trò/trạng thái thật + thẻ cấp độ bảo mật (2FA là demo) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="text-ds-headline-lg text-on-surface font-bold tracking-tight">Tài khoản của tôi</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-ds-label-md font-semibold">
              <span className={`${ICON} text-[16px]`}>shield_person</span>
              {ROLE_CHIP_TEXT[role] ?? role}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-ds-label-sm font-semibold ${statusMeta.chip}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusMeta.dot}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusMeta.dot}`} />
              </span>
              {ACCOUNT_TEXT[status] ?? status}
            </span>
          </div>
          <p className="text-ds-body-md text-on-surface-variant">
            Quản lý thông tin hồ sơ quản trị viên và thiết lập bảo mật tài khoản
          </p>
        </div>
        <div className="self-start md:self-auto flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className={`${ICON} text-[20px]`}>verified_user</span>
            </div>
            <div>
              <p className="text-ds-label-sm text-on-surface-variant">Cấp độ bảo mật</p>
              <p className="text-ds-label-md text-on-surface font-semibold flex items-center gap-1">
                2FA Đã kích hoạt
                <span className={`${ICON} text-[16px] text-secondary-teal`}>check_circle</span>
              </p>
            </div>
          </div>
          <DemoNote>Khối demo — BE chưa có API 2FA</DemoNote>
        </div>
      </div>

      {loadError && <ErrorBlock message={loadError} onRetry={load} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Hồ sơ cá nhân: đọc/ghi qua GET + PATCH /admin/users/{id} */}
        <section className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-space-lg md:p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start justify-between gap-3 pb-space-md border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className={`${ICON} text-[22px]`}>account_circle</span>
                </div>
                <div>
                  <h2 className="text-ds-headline-sm text-on-surface font-bold">Thông tin cá nhân</h2>
                  <p className="text-ds-body-sm text-on-surface-variant">Cập nhật ảnh đại diện và chi tiết liên hệ của bạn</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-ds-label-sm text-on-surface-variant bg-surface-container font-mono whitespace-nowrap">
                {profile ? `ID: #${profile.id}` : 'ID: —'}
              </span>
            </div>

            {loading && !profile && <LoadingBlock label="Đang tải hồ sơ..." />}

            {!loading && (
              <>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-space-lg bg-surface-container-low p-space-md rounded-xl">
                  <Avatar name={fullName || user?.fullName || ''} />
                  <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-space-sm">
                      <button
                        type="button"
                        disabled
                        title="Backend chưa có API tải ảnh đại diện"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary text-ds-label-md font-semibold shadow-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={`${ICON} text-[18px]`}>cloud_upload</span>
                        Tải ảnh mới
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Backend chưa có API tải ảnh đại diện"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-error text-ds-label-md font-semibold hover:bg-error-container/40 transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <span className={`${ICON} text-[18px]`}>delete</span>
                        Xóa ảnh
                      </button>
                    </div>
                    <p className="text-ds-body-sm text-on-surface-variant leading-relaxed">
                      Định dạng hỗ trợ JPG, PNG hoặc GIF. Dung lượng tối đa 2MB. Khuyến nghị ảnh vuông tỉ lệ 1:1 (400x400px).
                    </p>
                    <div className="flex justify-center sm:justify-start">
                      <DemoNote>Khối demo — chưa có API lưu ảnh, hệ thống hiển thị chữ viết tắt từ họ tên</DemoNote>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-space-md">
                  <Field label="Họ và tên đầy đủ" required>
                    <div className="relative">
                      <span className={`${ICON} absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong pointer-events-none`}>badge</span>
                      <input
                        className={`${adminInputClass} pl-10`}
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ"
                        value={fullName}
                        onChange={e => { setFullName(e.target.value); setSaveMsg(null); }}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Địa chỉ Email quản trị"
                    readOnlyChip
                    note="Email quản trị viên không thể tự thay đổi: BE chặn sửa email của chính tài khoản đang đăng nhập. Vui lòng liên hệ bộ phận kỹ thuật để yêu cầu cập nhật."
                  >
                    <div className="relative">
                      <span className={`${ICON} absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong pointer-events-none`}>mail</span>
                      <input
                        className={`${adminInputClass} pl-10 pr-10 bg-surface-container-low text-on-surface-variant cursor-not-allowed`}
                        type="email"
                        value={profile?.email ?? user?.email ?? ''}
                        readOnly
                        disabled
                      />
                      <span className={`${ICON} absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong pointer-events-none`}>lock</span>
                    </div>
                  </Field>

                  <Field label="Số điện thoại liên hệ" note="Để trống rồi lưu nếu muốn xóa số khỏi hồ sơ.">
                    <div className="relative">
                      <span className={`${ICON} absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline-strong pointer-events-none`}>call</span>
                      <input
                        className={`${adminInputClass} pl-10`}
                        type="tel"
                        placeholder="Nhập số điện thoại liên hệ"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setSaveMsg(null); }}
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <ReadonlyCell
                      label="Vai trò hệ thống"
                      icon="admin_panel_settings"
                      iconCls="text-primary"
                      value={ROLE_CHIP_TEXT[role] ?? role}
                    />
                    <ReadonlyCell
                      label="Ngày tham gia hệ thống"
                      icon="calendar_month"
                      iconCls="text-outline-strong"
                      value={profile ? fmtServer(profile.createdAt, 'date') : '—'}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="px-space-lg md:px-space-xl py-space-md bg-surface-container-low border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-sm">
            <span className="text-ds-body-sm text-on-surface-variant flex items-center gap-1">
              <span className={`${ICON} text-[16px]`}>schedule</span>
              {profile ? `Lần cập nhật cuối: ${fmtServer(profile.updatedAt, 'datetime')}` : 'Lần cập nhật cuối: —'}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cancelChanges}
                disabled={!dirty}
                className={adminButton('ghost', 'flex-1 sm:flex-none disabled:opacity-40')}
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={!canSave}
                title={!dirty ? 'Chưa có thay đổi nào để gửi' : undefined}
                className={adminButton('primary', 'flex-1 sm:flex-none disabled:opacity-50')}
              >
                <span className={`${ICON} text-[18px]`}>save</span>
                {saving ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}
              </button>
            </div>
          </div>
          {saveMsg && (
            <div className="px-space-lg md:px-space-xl py-space-sm border-t border-surface-container-high">
              <MessageRow kind={saveMsg.kind}>{saveMsg.text}</MessageRow>
            </div>
          )}
        </section>

        {/* Đổi mật khẩu: POST /api/user/change-password (BE thu hồi mọi phiên khi thành công) */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-space-lg md:p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start justify-between gap-3 pb-space-md border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <span className={`${ICON} text-[22px]`}>key</span>
                </div>
                <div>
                  <h2 className="text-ds-headline-sm text-on-surface font-bold">Đổi mật khẩu</h2>
                  <p className="text-ds-body-sm text-on-surface-variant">Bảo vệ quyền truy cập quản trị viên cấp cao</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="current-pwd" className="text-ds-label-md text-on-surface">
                    Mật khẩu hiện tại <span className="text-error">*</span>
                  </label>
                  <Link to="/forgot-password" className="text-ds-label-sm text-primary font-semibold hover:underline">Quên mật khẩu?</Link>
                </div>
                <div className="relative">
                  <input
                    id="current-pwd"
                    className={`${adminInputClass} pr-10`}
                    type={reveal.current ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu đang dùng"
                    value={currentPwd}
                    onChange={e => { setCurrentPwd(e.target.value); setPwdMsg(null); }}
                  />
                  <EyeButton shown={reveal.current} onToggle={() => setReveal(v => ({ ...v, current: !v.current }))} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pwd" className="text-ds-label-md text-on-surface">
                  Mật khẩu mới <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-pwd"
                    className={`${adminInputClass} pr-10`}
                    type={reveal.new ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={newPwd}
                    onChange={e => { setNewPwd(e.target.value); setPwdMsg(null); }}
                  />
                  <EyeButton shown={reveal.new} onToggle={() => setReveal(v => ({ ...v, new: !v.new }))} />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ds-label-sm text-on-surface-variant">Độ mạnh mật khẩu:</span>
                    <span className={`text-ds-label-sm font-semibold ${
                      passed >= 4 ? 'text-secondary-teal' : passed >= 2 ? 'text-tertiary' : 'text-error'
                    }`}
                    >
                      {STRENGTH_LABEL[passed]}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {RULES.map((r, i) => (
                      <span key={r.key} className={`h-full rounded-full ${i < passed ? 'bg-secondary-teal' : 'bg-surface-container-high'}`} />
                    ))}
                  </div>
                  <ul className="space-y-1.5 pt-1 text-ds-body-sm list-none p-0 m-0">
                    {RULES.map(r => {
                      const ok = r.test(newPwd);
                      return (
                        <li key={r.key} className={`flex items-center gap-1.5 ${ok ? 'text-secondary-teal' : 'text-on-surface-variant'}`}>
                          <span className={`${ICON} text-[16px] ${ok ? 'font-bold' : 'text-outline-strong'}`}>
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
                <label htmlFor="confirm-pwd" className="text-ds-label-md text-on-surface">
                  Xác nhận mật khẩu mới <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-pwd"
                    className={`${adminInputClass} pr-10`}
                    type={reveal.confirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPwd}
                    onChange={e => { setConfirmPwd(e.target.value); setPwdMsg(null); }}
                  />
                  <EyeButton shown={reveal.confirm} onToggle={() => setReveal(v => ({ ...v, confirm: !v.confirm }))} />
                </div>
                {confirmPwd.length > 0 && (
                  <span className={`flex items-center gap-1 text-ds-label-sm font-semibold ${match ? 'text-secondary-teal' : 'text-error'}`}>
                    <span className={`${ICON} text-[16px]`}>{match ? 'check_circle' : 'error'}</span>
                    {match ? 'Mật khẩu khớp nhau' : 'Mật khẩu không khớp'}
                  </span>
                )}
              </div>

              <div className="p-space-md rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed-dim/40 flex items-start gap-space-sm">
                <span className={`${ICON} text-[20px] text-tertiary shrink-0 mt-0.5`}>info</span>
                <p className="text-ds-body-sm text-on-surface leading-snug">
                  Mật khẩu mới phải thỏa đủ 4 rule ở trên. Khi đổi thành công, hệ thống thu hồi MỌI phiên
                  đăng nhập cũ (kể cả máy đang dùng) và gửi email cảnh báo bảo mật — bạn sẽ phải đăng nhập lại.
                </p>
              </div>

              {pwdMsg && (
                <MessageRow kind={pwdMsg.kind}>
                  {pwdMsg.text}
                  {pwdMsg.kind === 'success' && (
                    <button type="button" onClick={logout} className={adminButton('ghost', 'h-8 ms-2')}>
                      Đăng xuất ngay
                    </button>
                  )}
                </MessageRow>
              )}
            </div>
          </div>

          <div className="px-space-lg md:px-space-xl py-space-md bg-surface-container-low border-t border-surface-container-high flex items-center justify-end gap-space-sm">
            <button
              type="button"
              onClick={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdMsg(null); }}
              className="px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface text-ds-label-lg font-semibold hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={submitPassword}
              disabled={pwdBlocked}
              className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary text-ds-label-lg font-semibold transition-all shadow-sm hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
            >
              <span className={`${ICON} text-[18px]`}>lock_reset</span>
              {changing ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </section>
      </div>

      {/* Phiên đăng nhập — khối demo vì BE chưa có API danh sách / thu hồi phiên */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm mb-space-md">
          <div>
            <h3 className="text-ds-headline-sm text-on-surface font-bold flex items-center gap-2">
              <span className={`${ICON} text-[20px] text-primary`}>devices</span>
              Thiết bị đăng nhập hoạt động
            </h3>
            <p className="text-ds-body-sm text-on-surface-variant">Các phiên làm việc gần nhất bằng tài khoản của bạn</p>
          </div>
          <div className="self-start sm:self-auto flex items-center gap-space-sm flex-wrap">
            <DemoNote>Khối demo — BE chưa có API danh sách phiên</DemoNote>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-ds-label-md text-error font-semibold hover:underline border-0 bg-transparent cursor-pointer"
            >
              <span className={`${ICON} text-[18px]`}>logout</span>
              Đăng xuất khỏi thiết bị này
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {SESSIONS.map(s => (
            <div
              key={s.device}
              className={`p-space-md rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm ${
                s.current ? 'border border-primary/20' : 'border border-transparent'
              }`}
            >
              <div className="flex items-center gap-space-md min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.tile}`}>
                  <span className={`${ICON} text-[22px]`}>{s.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-ds-label-md text-on-surface font-semibold flex items-center gap-2 flex-wrap">
                    {s.device}
                    {s.current && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold">Hiện tại</span>
                    )}
                  </p>
                  <p className="text-ds-body-sm text-on-surface-variant truncate">{s.meta}</p>
                </div>
              </div>
              {s.current
                ? <span className="text-ds-label-sm text-secondary-teal shrink-0">{s.state}</span>
                : <button type="button" disabled className="text-ds-label-sm text-on-surface-variant font-semibold border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed">Thu hồi</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminAccountSettingsPage;
