/**
 * Màn "Cài đặt tài khoản & Tùy chọn bảo mật" của ứng viên (mockup Stitch
 * `c_i_t_t_i_kho_n_ng_vi_n`, 2026-10-26) — route /account, shell CandidateLayout.
 *
 * Số/nút thật:
 * - Email + SĐT: GET /api/user/profile (response trần, không bọc ApiResponse). SĐT chỉ đọc vì
 *   luồng tự phục vụ không có request nào sửa SĐT.
 * - Ảnh đại diện: PUT/DELETE /api/user/avatar (data URL). Ảnh chỉ hiện lại trong phiên này vì
 *   GET /api/user/profile không trả trường ảnh — phải tải lại ảnh mới thấy chuỗi.
 * - Đổi mật khẩu: POST /api/user/change-password, 4 rule khớp từng message chặn phía server
 *   (min 8, hoa.thường, số, ký tự đặc biệt đúng dãy @#$%^&+=!).
 * - Phiên đăng nhập: GET/DELETE /api/user/sessions; "Kết thúc phiên này" và "Đăng xuất khỏi các
 *   thiết bị khác" gọi thu hồi thật (không có bulk nên xoá lần lượt từng dòng không phải current).
 *
 * Sao đổi so với mockup (nội dung phải nói đúng hệ quả):
 * - Đổi mật khẩu thu hồi MỌI phiên kể cả máy đang dùng -> không có chữ "vẫn duy trì phiên hiện
 *   tại"; hiện hộp cảnh báo + nút đăng nhập lại.
 * - "Cập nhật 45 ngày trước" cạnh đề mục Đổi mật khẩu: bỏ (không có nguồn số).
 * - Chip "Đã xác minh": suy từ luồng đăng nhập (mở được màn này nghĩa là email đã xác thực);
 *   SĐT không có chip xác minh vì chưa có nguồn.
 * - Session không có tên thành phố/ISP -> hiển thị bản mô tả thiết bị + IP + "hoạt động X trước".
 *
 * Khối giữ nguyên chữ mockup và dán nhãn "Khối demo" (chưa mở trong phiên bản này): điểm an toàn
 * 85%, kênh nhận thông báo, tài khoản liên kết Google/GitHub/LinkedIn, 4 công tắc thông báo,
 * Danger Zone, "Mẹo từ trợ lý AI" (số 40%).
 * Riêng thẻ 2FA KHÔNG dán nhãn (theo quyết định 24/10 ở /admin/account — BE đang làm wave 2FA/TOTP,
 * dán nhãn sẽ thành sai): giá trị hiển thị là "Đang tắt" (đúng hiện trạng, chưa có API bật) và nút
 * "Kích hoạt 2FA" đặt `disabled`, không hành động giả.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import ProgramService from '../../services/program.service';
import { useAuth } from '../../context/AuthContext';
import { SelfProfile, UserSessionInfo } from '../../models/Api.model';
import {
  DemoTag, ICON, LoadingBlock, Pill, Toggle,
  adminButton, adminInputClass, errorText, initialsOf, timeAgo,
} from '../components/adminKit';
import { CARD, CandidatePageHeader, SOFT } from '../components/candidateKit';

/** 4 rule == 4 message chặn phía server; ký tự đặc biệt đúng dãy @#$%^&+=!. */
const RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: v => v.length >= 8 },
  { key: 'case', label: 'Chứa ít nhất một chữ hoa và chữ thường', test: v => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { key: 'digit', label: 'Chứa ít nhất một chữ số', test: v => /\d/.test(v) },
  { key: 'symbol', label: 'Chứa ít nhất một ký tự đặc biệt (@#$%^&+=!)', test: v => /[@#$%^&+=!]/.test(v) },
];

const STRENGTH_LABEL = ['Rất yếu (0/4)', 'Yếu (1/4)', 'Trung bình (2/4)', 'Khá an toàn (3/4)', 'Mạnh (4/4)'];

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Không đọc được tệp ảnh'));
  reader.readAsDataURL(file);
});

const fmtMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** Chỉ có trình duyệt + hệ điều hành (không có vị trí địa lý): thiết bị di động dùng icon khác. */
const deviceIconOf = (label: string) => (
  /iPhone|iPad|điện thoại|máy tính bảng|portrait|android/i.test(label) ? 'smartphone' : 'laptop_mac'
);

const SectionCard: React.FC<{
  icon: string; iconClass: string; title: string; description?: string;
  extra?: React.ReactNode; children: React.ReactNode; className?: string;
}> = ({ icon, iconClass, title, description, extra, children, className = '' }) => (
  <section className={`${CARD} flex flex-col gap-space-md p-space-lg ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-sm">
      <div className="flex min-w-0 items-center gap-space-sm">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <span className={`${ICON} text-[20px]`}>{icon}</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-ds-headline-sm font-semibold text-on-surface">{title}</h3>
          {description && <p className="text-ds-body-sm text-on-surface-variant">{description}</p>}
        </div>
      </div>
      {extra}
    </header>
    {children}
  </section>
);

/** Ô thông tin chỉ đọc (email, SĐT) đúng hình dáng mockup. */
const ReadonlyCell: React.FC<{ label: string; value: string; verified?: boolean; pending?: boolean }> = ({
  label, value, verified, pending,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-ds-label-md font-semibold text-on-surface">{label}</span>
    <div className="flex h-10 items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 text-ds-body-md text-on-surface">
      <span className="truncate">{value}</span>
      {verified && (
        <span className={`${ICON} shrink-0 text-[18px] text-secondary-teal`} title="Đã xác thực">verified</span>
      )}
      {pending && (
        <span className={`${ICON} shrink-0 text-[18px] text-outline`} title="Chưa có thông tin">edit_note</span>
      )}
    </div>
  </div>
);

const Message: React.FC<{ kind: 'success' | 'error'; children: React.ReactNode }> = ({ kind, children }) => (
  <p
    role="status"
    className={`m-0 flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-ds-body-sm ${
      kind === 'success' ? 'bg-secondary-container/50 text-on-secondary-container' : 'bg-error-container text-on-error-container'
    }`}
  >
    <span className={`${ICON} text-[18px]`}>{kind === 'success' ? 'check_circle' : 'error'}</span>
    <span className="min-w-0 flex-1">{children}</span>
  </p>
);

const EyeButton: React.FC<{ shown: boolean; onToggle: () => void; label: string }> = ({ shown, onToggle, label }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-on-surface-variant hover:text-on-surface"
  >
    <span className={`${ICON} text-[18px]`}>{shown ? 'visibility_off' : 'visibility'}</span>
  </button>
);

const PwdField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  shown: boolean; onToggle: () => void; autoComplete: string;
}> = ({ label, value, onChange, placeholder, shown, onToggle, autoComplete }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-ds-label-md text-on-surface">{label}</label>
    <div className="relative">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${adminInputClass} pr-10`}
      />
      <EyeButton shown={shown} onToggle={onToggle} label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} />
    </div>
  </div>
);

/** Hàng công tắc thông báo (khối demo: trạng thái chỉ nằm trong màn). */
const ToggleRow: React.FC<{
  title: string; description: string; checked: boolean; onChange: (v: boolean) => void;
  badge?: string; soft?: boolean; icon?: string;
}> = ({ title, description, checked, onChange, badge, soft, icon }) => (
  <div className={`flex items-start justify-between gap-space-sm ${soft ? 'rounded-lg bg-surface-container-low p-3' : ''}`}>
    <div className="flex min-w-0 flex-col pr-2">
      <span className="flex items-center gap-1.5 text-ds-label-lg font-semibold text-on-surface">
        {icon && <span className={`${ICON} text-[20px] text-secondary-teal`}>{icon}</span>}
        {title}
        {badge && (
          <span className="rounded bg-secondary-container px-1.5 py-[2px] text-[10px] font-bold uppercase text-on-secondary-container">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-0.5 text-ds-body-sm text-on-surface-variant">{description}</span>
    </div>
    <div className="mt-1 shrink-0">
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  </div>
);

const ConnectedRow: React.FC<{
  name: string; handle: string | null; logo: React.ReactNode; connected: boolean;
}> = ({ name, handle, logo, connected }) => (
  <div className={`flex items-center justify-between gap-3 rounded-lg p-3 ${connected ? 'bg-surface-container-low' : 'border border-outline-variant/60 bg-surface-container-lowest'}`}>
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
        {logo}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-ds-label-md font-semibold text-on-surface">{name}</span>
        <span className={`truncate text-ds-body-sm ${handle ? 'text-on-surface-variant' : 'text-outline'}`}>
          {handle ?? 'Chưa kết nối'}
        </span>
      </span>
    </div>
    <button
      type="button"
      disabled
      className={`shrink-0 rounded-lg px-3 py-1.5 text-ds-label-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
        connected
          ? 'bg-surface-container-high text-on-surface-variant'
          : 'bg-primary-container text-on-primary'
      }`}
    >
      {connected ? 'Hủy liên kết' : 'Kết nối'}
    </button>
  </div>
);

const CandidateAccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [self, setSelf] = useState<SelfProfile | null>(null);
  const [selfLoading, setSelfLoading] = useState(true);
  const [selfError, setSelfError] = useState('');
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [reveal, setReveal] = useState({ current: false, fresh: false, confirm: false });
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [busyId, setBusyId] = useState<number | 'all' | 'this' | null>(null);

  const [notify, setNotify] = useState({ aiMatch: true, reminder: true, newsletter: false, visible: true });

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const loadSelf = useCallback(async () => {
    setSelfLoading(true);
    setSelfError('');
    try {
      const res = await AuthService.getSelfProfile();
      if (alive.current) setSelf(res.data);
    } catch (err) {
      if (alive.current) setSelfError(errorText(err, 'Không tải được thông tin tài khoản.'));
    } finally {
      if (alive.current) setSelfLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      const res = await AuthService.getSessions();
      if (alive.current) setSessions(res.data.data ?? []);
    } catch (err) {
      if (alive.current) setSessionsError(errorText(err, 'Không tải được danh sách thiết bị đăng nhập.'));
    } finally {
      if (alive.current) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSelf();
    void loadSessions();
    ProgramService.getMyProfile()
      .then(res => { if (alive.current) setProfileUpdatedAt(res.data.data?.updatedAt ?? null); })
      .catch(() => { /* hồ sơ CV không chặn được màn cài đặt */ });
  }, [loadSelf, loadSessions]);

  const passed = useMemo(() => RULES.filter(r => r.test(newPwd)).length, [newPwd]);
  const match = newPwd.length > 0 && newPwd === confirmPwd;
  const pwdBlocked = changing || currentPwd.length === 0 || passed < 4 || !match;
  const otherSessions = sessions.filter(s => !s.current);

  const submitPassword = useCallback(async () => {
    if (pwdBlocked) return;
    setChanging(true);
    setPwdMsg(null);
    try {
      const res = await AuthService.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      if (!alive.current) return;
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({
        kind: 'success',
        text: res.data.message ?? 'Đổi mật khẩu thành công. Mọi phiên đăng nhập cũ đã bị thu hồi, hãy đăng nhập lại bằng mật khẩu mới.',
      });
      void loadSessions();
    } catch (err) {
      if (alive.current) setPwdMsg({ kind: 'error', text: errorText(err, 'Không đổi được mật khẩu.') });
    } finally {
      if (alive.current) setChanging(false);
    }
  }, [confirmPwd, currentPwd, loadSessions, newPwd, pwdBlocked]);

  const onAvatarPick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarMsg({ kind: 'error', text: 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.' });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarMsg({ kind: 'error', text: `Ảnh ${fmtMb(file.size)} vượt giới hạn 2MB.` });
      return;
    }
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await AuthService.uploadAvatar(dataUrl);
      if (!alive.current) return;
      setAvatarUrl(dataUrl);
      setAvatarMsg({ kind: 'success', text: res.data.message ?? 'Đã cập nhật ảnh đại diện' });
    } catch (err) {
      if (alive.current) setAvatarMsg({ kind: 'error', text: errorText(err, 'Không tải được ảnh lên.') });
    } finally {
      if (alive.current) setAvatarBusy(false);
    }
  }, []);

  const removeAvatar = useCallback(async () => {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const res = await AuthService.deleteAvatar();
      if (!alive.current) return;
      setAvatarUrl(null);
      setAvatarMsg({ kind: 'success', text: res.data.message ?? 'Đã xóa ảnh đại diện' });
    } catch (err) {
      if (alive.current) setAvatarMsg({ kind: 'error', text: errorText(err, 'Không xóa được ảnh đại diện.') });
    } finally {
      if (alive.current) setAvatarBusy(false);
    }
  }, []);

  const revokeOne = useCallback(async (sessionId: number) => {
    setBusyId(sessionId);
    setSessionsError('');
    try {
      await AuthService.revokeSession(sessionId);
      if (alive.current) setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      if (alive.current) setSessionsError(errorText(err, 'Không thu hồi được thiết bị này.'));
    } finally {
      if (alive.current) setBusyId(null);
    }
  }, []);

  const revokeOthers = useCallback(async () => {
    if (otherSessions.length === 0) return;
    setBusyId('all');
    setSessionsError('');
    try {
      await Promise.all(otherSessions.map(s => AuthService.revokeSession(s.id)));
      if (alive.current) setSessions(prev => prev.filter(s => s.current));
    } catch (err) {
      if (alive.current) {
        setSessionsError(errorText(err, 'Không thu hồi được hết các thiết bị khác.'));
        void loadSessions();
      }
    } finally {
      if (alive.current) setBusyId(null);
    }
  }, [loadSessions, otherSessions]);

  const endThisSession = useCallback(async () => {
    setBusyId('this');
    try {
      await AuthService.logout();
    } catch {
      // phiên đã hết hạn hoặc BE chậm: vẫn thoát khỏi màn, token không còn dùng được.
    }
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const name = self?.fullName ?? user?.fullName ?? '';
  const email = self?.email ?? user?.email ?? '';
  const phone = (self?.phone ?? '').trim();

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Cài đặt tài khoản' }]}
        title="Cài đặt tài khoản & Tùy chọn bảo mật"
        subtitle="Quản lý thông tin đăng nhập, bảo mật 2 lớp (2FA), liên kết mạng xã hội và tùy chọn thông báo tuyển dụng tự động."
        status={
          <Pill tone="neutral" icon="schedule">
            Thông tin đăng nhập tải lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Pill>
        }
      />

      {/* 1. Khối tổng quan bảo mật + kênh nhận thông báo */}
      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className={`${CARD} relative flex flex-col gap-space-lg overflow-hidden p-space-lg md:flex-row md:items-center md:justify-between lg:col-span-8`}>
          <span className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-primary/5" />
          <div className="flex w-full items-center gap-space-lg md:w-auto">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-secondary-teal"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="85, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-ds-headline-md font-bold leading-none text-on-surface">85%</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase text-secondary-teal">Tốt</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-space-xs">
                <h2 className="text-ds-headline-sm text-on-surface">Mức độ an toàn tài khoản</h2>
                <span className={`${ICON} text-[20px] text-secondary-teal`}>verified_user</span>
                <DemoTag>Khối demo</DemoTag>
              </div>
              <p className="text-ds-body-sm text-on-surface-variant">
                Điểm mẫu theo thiết kế: tài khoản có độ bảo vệ cao. Bật xác thực 2 lớp (2FA) để đạt
                mức bảo mật tuyệt đối 100%.
              </p>
            </div>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 md:w-auto">
            <span className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-ds-label-md text-on-surface">
              <span className={`${ICON} text-[18px] text-secondary-teal`}>check_circle</span>
              Mật khẩu theo quy định
            </span>
            <span className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-ds-label-md text-on-surface">
              <span className={`${ICON} text-[18px] text-secondary-teal`}>check_circle</span>
              Đã xác thực email
            </span>
            <span className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-ds-label-md text-on-surface">
              <span className={`${ICON} text-[18px] text-outline`}>hourglass_top</span>
              {phone ? 'Đã có số điện thoại' : 'Chưa có số điện thoại'}
            </span>
            <span className="flex items-center gap-2 rounded-lg bg-error-container/40 px-3 py-1.5 text-ds-label-md text-on-error-container">
              <span className={`${ICON} text-[18px] text-error`}>error</span>
              Chưa bật 2FA
            </span>
          </div>
        </div>

        <div className={`${CARD} flex flex-col justify-between p-space-lg lg:col-span-4`}>
          <div className="flex items-center justify-between">
            <span className="text-ds-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Kênh nhận thông báo
            </span>
            <span className="rounded-lg bg-secondary-container/40 p-1 text-on-secondary-container">
              <span className={`${ICON} text-[18px]`}>notifications_active</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-ds-headline-md text-on-surface">Email &amp; Trình duyệt</span>
            <p className="mt-1 text-ds-body-sm text-on-surface-variant">
              Đang kích hoạt đồng bộ thông báo phỏng vấn &amp; gợi ý việc làm thời gian thực.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-surface-container-high pt-3">
            <span className="flex items-center gap-1 text-ds-label-sm font-semibold text-secondary-teal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-teal" /> Sẵn sàng kết nối
            </span>
            <a href="#notification-section" className="flex items-center text-ds-label-md text-primary hover:underline">
              Tùy chỉnh <span className={`${ICON} text-[16px]`}>arrow_forward</span>
            </a>
          </div>
          <DemoTag>Khối demo</DemoTag>
        </div>
      </div>

      {/* 2. Cột chính: thông tin đăng nhập, bảo mật nâng cao, khu vực nguy hiểm */}
      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          <SectionCard
            icon="person_outline"
            iconClass="bg-primary-fixed text-on-primary-fixed"
            title="Thông tin đăng nhập & Tài khoản"
            description="Địa chỉ liên hệ chính thức dùng cho tài khoản và phỏng vấn"
            extra={<Pill tone="success">Đã xác minh</Pill>}
          >
            {selfLoading ? (
              <LoadingBlock label="Đang tải thông tin tài khoản..." />
            ) : (
              <>
                {selfError && (
                  <Message kind="error">
                    {selfError}
                    <button type="button" onClick={() => void loadSelf()} className={adminButton('ghost', 'h-8')}>
                      Thử lại
                    </button>
                  </Message>
                )}
                <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                  <ReadonlyCell label="Địa chỉ Email" value={email || '—'} verified />
                  <ReadonlyCell
                    label="Số điện thoại liên hệ"
                    value={phone || 'Chưa cập nhật'}
                    pending={!phone}
                  />
                </div>
                {!phone && (
                  <p className="m-0 flex items-start gap-1 text-ds-body-sm text-on-surface-variant">
                    <span className={`${ICON} shrink-0 text-[14px]`}>info</span>
                    Số điện thoại do quản trị viên cập nhật khi lập hồ sơ; màn này chỉ hiển thị.
                  </p>
                )}

                {/* Ảnh đại diện */}
                <div className={`flex flex-wrap items-center justify-between gap-space-md rounded-lg p-3 ${SOFT}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name || 'Ảnh đại diện'} className="h-full w-full rounded-full object-cover ring-4 ring-primary-fixed" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-fixed-dim text-ds-headline-md font-bold text-primary ring-4 ring-primary-fixed">
                          {initialsOf(name)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-ds-label-lg font-semibold text-on-surface">Ảnh đại diện</span>
                      <span className="text-ds-body-sm text-on-surface-variant">PNG, JPG hoặc WEBP, tối đa 2MB.</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <input ref={avatarInput} type="file" accept={AVATAR_TYPES.join(',')} className="hidden" onChange={onAvatarPick} />
                    <button
                      type="button"
                      disabled={avatarBusy}
                      onClick={() => avatarInput.current?.click()}
                      className={adminButton('primary', 'h-9')}
                    >
                      <span className={`${ICON} text-[18px]`}>{avatarBusy ? 'progress_activity' : 'upload'}</span>
                      {avatarUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                    </button>
                    {avatarUrl && (
                      <button type="button" disabled={avatarBusy} onClick={removeAvatar} className={adminButton('ghost', 'h-9')}>
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
                {avatarMsg && <Message kind={avatarMsg.kind}>{avatarMsg.text}</Message>}

                {/* Đổi mật khẩu */}
                <div className="flex flex-col gap-space-md border-t border-surface-container-high pt-space-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-on-surface">
                      <span className={`${ICON} text-[18px] text-on-surface-variant`}>lock_reset</span>
                      Đổi mật khẩu tài khoản
                    </h4>
                    <span className="text-ds-label-sm text-on-surface-variant">
                      {profileUpdatedAt ? `Hồ sơ cập nhật ${timeAgo(profileUpdatedAt)}` : 'Hồ sơ chưa có bản cập nhật'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    <PwdField
                      label="Mật khẩu hiện tại"
                      value={currentPwd}
                      onChange={setCurrentPwd}
                      placeholder="Nhập mật khẩu hiện tại"
                      autoComplete="current-password"
                      shown={reveal.current}
                      onToggle={() => setReveal(r => ({ ...r, current: !r.current }))}
                    />
                    <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                      <PwdField
                        label="Mật khẩu mới"
                        value={newPwd}
                        onChange={setNewPwd}
                        placeholder="Tối thiểu 8 ký tự"
                        autoComplete="new-password"
                        shown={reveal.fresh}
                        onToggle={() => setReveal(r => ({ ...r, fresh: !r.fresh }))}
                      />
                      <PwdField
                        label="Xác nhận mật khẩu mới"
                        value={confirmPwd}
                        onChange={setConfirmPwd}
                        placeholder="Nhập lại mật khẩu mới"
                        autoComplete="new-password"
                        shown={reveal.confirm}
                        onToggle={() => setReveal(r => ({ ...r, confirm: !r.confirm }))}
                      />
                    </div>

                    <div className={`flex flex-col gap-1.5 rounded-lg p-space-sm ${SOFT}`}>
                      <div className="flex items-center justify-between text-ds-label-sm">
                        <span className="text-on-surface-variant">Độ an toàn mật khẩu:</span>
                        <span className="flex items-center gap-1 font-semibold text-secondary-teal">
                          <span className={`${ICON} text-[14px]`}>shield</span>
                          {STRENGTH_LABEL[passed]}
                        </span>
                      </div>
                      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-surface-container-high">
                        {RULES.map((rule, i) => (
                          <span
                            key={rule.key}
                            className={`h-full flex-1 rounded-full ${i < passed ? 'bg-secondary-teal' : 'bg-surface-container-highest'}`}
                          />
                        ))}
                      </div>
                      <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                        {RULES.map(rule => {
                          const ok = rule.test(newPwd);
                          return (
                            <li key={rule.key} className={`flex items-center gap-1.5 text-ds-body-sm ${ok ? 'text-secondary-teal' : 'text-on-surface-variant'}`}>
                              <span className={`${ICON} text-[16px]`}>{ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                      {newPwd.length > 0 && !match && (
                        <p className="m-0 flex items-center gap-1 text-ds-body-sm text-error">
                          <span className={`${ICON} text-[16px]`}>error</span>
                          Mật khẩu xác nhận chưa khớp.
                        </p>
                      )}
                    </div>

                    {pwdMsg && <Message kind={pwdMsg.kind}>{pwdMsg.text}</Message>}

                    <div className={`flex items-center justify-between gap-space-sm rounded-lg p-3 ${SOFT}`}>
                      <p className="m-0 flex items-start gap-1.5 text-ds-body-sm text-on-surface-variant">
                        <span className={`${ICON} shrink-0 text-[16px] text-error`}>warning</span>
                        <span>
                          Đổi mật khẩu sẽ đăng xuất mọi thiết bị, kể cả máy đang dùng. Phải đăng nhập
                          lại bằng mật khẩu mới.
                        </span>
                      </p>
                      <span className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={submitPassword} disabled={pwdBlocked} className={adminButton('primary', 'h-9')}>
                          <span className={`${ICON} text-[18px]`}>{changing ? 'progress_activity' : 'save'}</span>
                          Cập nhật mật khẩu
                        </button>
                        {pwdMsg?.kind === 'success' && (
                          <button type="button" onClick={endThisSession} className={adminButton('ghost', 'h-9')}>
                            <span className={`${ICON} text-[16px]`}>logout</span>
                            Đăng nhập lại
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard
            icon="security"
            iconClass="bg-secondary-container/40 text-on-secondary-container"
            title="Bảo mật nâng cao & 2FA"
            description="Bảo vệ tài khoản bằng lớp phòng thủ hai lớp và giám sát thiết bị"
          >
            <div className={`flex flex-col gap-space-md rounded-xl p-space-md ${SOFT} sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex items-start gap-space-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm">
                  <span className={`${ICON} text-[24px]`}>phonelink_lock</span>
                </span>
                <div className="flex flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-ds-label-lg font-semibold text-on-surface">Xác thực 2 yếu tố (2FA)</span>
                    <Pill tone="danger">Đang tắt</Pill>
                  </span>
                  <p className="mt-0.5 max-w-md text-ds-body-sm text-on-surface-variant">
                    Yêu cầu mã 6 chữ số từ ứng dụng xác thực (Google Authenticator / Authy) hoặc SMS
                    mỗi khi đăng nhập.
                  </p>
                </div>
              </div>
              <button type="button" disabled className={`${adminButton('primary', 'h-10 shrink-0')} disabled:cursor-not-allowed disabled:opacity-60`}>
                <span className={`${ICON} text-[18px]`}>add_moderator</span>
                Kích hoạt 2FA
              </button>
            </div>

            <div className="mt-space-xs flex flex-col gap-space-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-[15px] font-semibold text-on-surface">
                  <span className={`${ICON} text-[18px] text-on-surface-variant`}>devices</span>
                  Quản lý phiên đăng nhập (Active Sessions)
                </h4>
                <span className="text-ds-label-sm text-on-surface-variant">
                  {sessionsLoading ? 'Đang tải...' : `${sessions.length} thiết bị kết nối`}
                </span>
              </div>

              {sessionsError && (
                <Message kind="error">
                  {sessionsError}
                  <button type="button" onClick={() => void loadSessions()} className={adminButton('ghost', 'h-8')}>
                    Thử lại
                  </button>
                </Message>
              )}

              {sessionsLoading ? (
                <LoadingBlock label="Đang tải danh sách thiết bị..." />
              ) : sessions.length === 0 ? (
                <p className="m-0 rounded-lg bg-surface-container-low p-3 text-ds-body-sm text-on-surface-variant">
                  Chưa ghi nhận thiết bị nào đang đăng nhập.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sessions.map(s => {
                    const label = s.deviceLabel?.trim() || 'Thiết bị khác';
                    return (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`${ICON} text-[26px] ${s.current ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {deviceIconOf(label)}
                          </span>
                          <div className="min-w-0 flex flex-col">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-ds-label-md font-semibold text-on-surface">{label}</span>
                              {s.current ? (
                                <span className="rounded-full bg-secondary-container px-2 py-0.5 text-ds-label-sm font-medium text-on-secondary-container">
                                  Phiên hiện tại
                                </span>
                              ) : (
                                <span className="text-ds-body-sm text-outline">
                                  {s.lastSeenAt ? `Hoạt động ${timeAgo(s.lastSeenAt)}` : `Tạo ${timeAgo(s.createdAt)}`}
                                </span>
                              )}
                            </span>
                            <span className="truncate text-ds-body-sm text-on-surface-variant">
                              {s.ipAddress ? `IP: ${s.ipAddress}` : 'Không ghi nhận địa chỉ IP'}
                              {s.expiresAt ? ` • Hết hạn ${timeAgo(s.expiresAt)}` : ''}
                            </span>
                          </div>
                        </div>
                        {s.current ? (
                          <button
                            type="button"
                            onClick={endThisSession}
                            disabled={busyId === 'this'}
                            className={`${adminButton('ghost', 'h-9')} text-error`}
                          >
                            <span className={`${ICON} text-[16px]`}>logout</span>
                            Kết thúc phiên này
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void revokeOne(s.id)}
                            disabled={busyId === s.id}
                            className={`${adminButton('ghost', 'h-9')} text-error hover:bg-error-container/40`}
                          >
                            Đăng xuất
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-ds-body-sm text-on-surface-variant">
                  Thu hồi sẽ buộc thiết bị đó đăng nhập lại ngay.
                </span>
                <button
                  type="button"
                  onClick={revokeOthers}
                  disabled={busyId === 'all' || otherSessions.length === 0}
                  className={adminButton('ghost', 'h-9')}
                >
                  <span className={`${ICON} text-[16px] text-error`}>logout</span>
                  {busyId === 'all' ? 'Đang thu hồi...' : 'Đăng xuất khỏi tất cả thiết bị khác'}
                </button>
              </div>
            </div>
          </SectionCard>

          <section className="flex flex-col gap-space-md rounded-xl bg-error-container/20 p-space-lg shadow-sm">
            <header className="flex flex-wrap items-center gap-space-sm border-b border-error-container/50 pb-space-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container text-on-error-container">
                <span className={`${ICON} text-[20px]`}>warning</span>
              </span>
              <div className="flex flex-col">
                <h3 className="text-ds-headline-sm text-error">Khu vực nguy hiểm (Danger Zone)</h3>
                <p className="text-ds-body-sm text-on-surface-variant">
                  Hành động không thể hoàn tác, ảnh hưởng trực tiếp đến dữ liệu ứng tuyển
                </p>
              </div>
              <DemoTag>Khối demo</DemoTag>
            </header>
            <div className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-ds-label-lg font-semibold text-on-surface">Tạm khóa tài khoản</span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Ẩn hồ sơ khỏi nhà tuyển dụng và tạm ngưng email phỏng vấn. Bạn có thể mở lại bất
                    cứ lúc nào.
                  </span>
                </div>
                <button type="button" disabled className={`${adminButton('ghost', 'h-9 shrink-0')} disabled:cursor-not-allowed disabled:opacity-60`}>
                  Tạm khóa
                </button>
              </div>
              <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-ds-label-lg font-semibold text-error">
                    Xóa vĩnh viễn tài khoản &amp; dữ liệu luyện tập
                  </span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Mọi kết quả phỏng vấn AI, video mock, hồ sơ CV và báo cáo đánh giá sẽ bị hủy hoàn toàn.
                  </span>
                </div>
                <button type="button" disabled className={`${adminButton('danger', 'h-9 shrink-0')} disabled:cursor-not-allowed disabled:opacity-60`}>
                  <span className={`${ICON} text-[16px]`}>delete_forever</span>
                  Yêu cầu xóa tài khoản
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* 3. Cột phụ: tài khoản liên kết, thông báo, mẹo AI */}
        <div className="flex flex-col gap-space-lg lg:col-span-5">
          <SectionCard
            icon="hub"
            iconClass="bg-tertiary-fixed text-on-tertiary-fixed"
            title="Tài khoản liên kết"
            description="Đăng nhập nhanh qua các dịch vụ bên thứ ba"
            extra={<DemoTag>Khối demo</DemoTag>}
          >
            <div className="flex flex-col gap-space-sm">
              <ConnectedRow
                name="Google"
                handle="— chưa ghi nhận —"
                connected
                logo={
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                  </svg>
                }
              />
              <ConnectedRow
                name="GitHub"
                handle="— chưa ghi nhận —"
                connected
                logo={
                  <svg className="h-5 w-5 text-on-surface" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                }
              />
              <ConnectedRow
                name="LinkedIn"
                handle={null}
                connected={false}
                logo={
                  <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45 1.45 1.45 0 0 0 1.45 1.45m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                }
              />
              <p className="m-0 text-ds-body-sm text-on-surface-variant">
                Ảnh và danh sách liên kết ở trên là bản mẫu; đăng nhập nhanh bằng Google/GitHub chỉ
                bật ở màn Đăng nhập.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            icon="tune"
            iconClass="bg-primary-fixed text-on-primary-fixed"
            title="Cài đặt thông báo & Việc làm"
            description="Tối ưu kênh cập nhật và quyền hiển thị hồ sơ cá nhân"
            extra={<DemoTag>Khối demo</DemoTag>}
          >
            <div id="notification-section" className="flex flex-col gap-space-md">
              <ToggleRow
                title="Thông báo việc làm phù hợp (AI Match)"
                badge="AI"
                description="Gửi ngay khi hệ thống tìm thấy cơ hội khớp trên 80% hồ sơ của bạn."
                checked={notify.aiMatch}
                onChange={v => setNotify(n => ({ ...n, aiMatch: v }))}
              />
              <span className="h-px bg-surface-container-high" />
              <ToggleRow
                title="Nhắc lịch phỏng vấn trước 24h & 2h"
                description="Gửi thông báo nhắc qua Email và tin nhắn kèm đường link phòng họp."
                checked={notify.reminder}
                onChange={v => setNotify(n => ({ ...n, reminder: v }))}
              />
              <span className="h-px bg-surface-container-high" />
              <ToggleRow
                title="Bản tin xu hướng tuyển dụng hàng tuần"
                description="Tổng hợp báo cáo lương, kỹ năng hot và mẹo trả lời phỏng vấn theo ngành."
                checked={notify.newsletter}
                onChange={v => setNotify(n => ({ ...n, newsletter: v }))}
              />
              <span className="h-px bg-surface-container-high" />
              <ToggleRow
                soft
                icon="visibility"
                title="Cho phép nhà tuyển dụng tìm thấy hồ sơ của tôi"
                description="CV và huy hiệu phỏng vấn AI được hiển thị ở danh bạ ứng viên tiêu biểu."
                checked={notify.visible}
                onChange={v => setNotify(n => ({ ...n, visible: v }))}
              />
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <span className="text-ds-body-sm text-on-surface-variant">
                  Công tắc chỉ đổi trên màn hình, chưa gửi về hệ thống.
                </span>
                <button type="button" disabled className={`${adminButton('primary', 'h-10')} disabled:cursor-not-allowed disabled:opacity-60`}>
                  <span className={`${ICON} text-[18px]`}>done_all</span>
                  Lưu cài đặt thông báo
                </button>
              </div>
            </div>
          </SectionCard>

          <div className="flex items-start gap-space-md rounded-xl bg-gradient-to-br from-primary-container/10 via-surface-container-low to-secondary-container/10 p-space-lg shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
              <span className={`${ICON} text-[22px]`}>smart_toy</span>
            </span>
            <div className="flex flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 text-ds-label-lg font-bold text-on-surface">
                Mẹo từ trợ lý AI
                <DemoTag>Khối demo</DemoTag>
              </span>
              <p className="text-ds-body-sm leading-relaxed text-on-surface-variant">
                Ứng viên kích hoạt bảo mật 2 lớp (2FA) và liên kết đầy đủ hồ sơ GitHub/LinkedIn thường
                có tỷ lệ xem xét phỏng vấn cao hơn 40% nhờ mức độ xác thực danh tính cao.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateAccountPage;
