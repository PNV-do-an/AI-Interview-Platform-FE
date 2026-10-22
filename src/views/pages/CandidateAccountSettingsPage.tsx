/**
 * Màn "Cài đặt tài khoản" ứng viên theo mockup Stitch 4 `c_i_t_t_i_kho_n_ng_vi_n_ai_interview_platform`
 * (plan: spec/features/candidate-redesign-stitch4.md §4-S5 / §5-S5) — route `/account-settings`, ROLE_USER.
 *
 * Nguồn thật:
 * - Họ tên / Email / SĐT (chỉ đọc): `useAuth().user` (GET /api/v1/auth/me — AuthResponse.UserInfo,
 *   BE chưa có self-PATCH user nên mọi ô là readonly, không có nút Save chết).
 * - "Cập nhật lần cuối": GET /api/v1/candidate-profile -> `updatedAt` (ẩn khi thiếu).
 * - Đổi mật khẩu: POST /api/user/change-password (base KHÔNG có /v1 — đi qua AuthService/httpService
 *   y hệt AdminAccountSettingsPage). 4 rule + dãy ký tự đặc biệt @#$%^&+=! + meter + logic lỗi
 *   sao nguyên từ AdminAccountSettingsPage; 422/400 từng field hiển thị cạnh đúng ô qua
 *   readApiErrorMessage (BE: ProfileController + UserServiceImpl.validateNewPassword).
 * - CTA "Chỉnh sửa hồ sơ & CV" -> /my-profile; "Đăng xuất" -> logout().
 *
 * Khối mockup BỎ (không có endpoint — plan §5-S5, luật conventions §3): vòng "85% an toàn" +
 * checklist 4 chip, card "Kênh nhận thông báo", SĐT cho chỉnh sửa, nhãn "Cập nhật 45 ngày trước",
 * cả card "Tài khoản liên kết" (Google/GitHub/LinkedIn), "Bảo mật nâng cao & 2FA",
 * "Quản lý phiên đăng nhập (Active Sessions)", toàn bộ "Cài đặt thông báo & Việc làm" (3 toggle),
 * "Cho phép NTD tìm thấy hồ sơ", "Khu vực nguy hiểm" (Tạm khóa / Xóa vĩnh viễn),
 * callout "Mẹo từ trợ lý AI" (chứa số bịa "cao hơn 40%").
 *
 * Token mapping (như AppLayout): các nhãn scale mockup text-label-*, text-body-*, text-headline-*
 * -> text-ds-*; `secondary` teal của mockup (#006b5f) -> `secondary-teal`; font-* -> bỏ.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { useCandidateController } from '../../controllers/useCandidateController';
import { readApiErrorMessage } from '../../utils/apiError';
import { ICON, ErrorBlock, fmtServer } from '../components/adminKit';
import { buttonClass } from '../components/ui';

/** 4 rule mật khẩu == 4 message BE (UserServiceImpl.validateNewPassword); đặc biệt đúng dãy @#$%^&+=!. */
const RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: v => v.length >= 8 },
  { key: 'case', label: 'Chứa ít nhất một chữ hoa và chữ thường', test: v => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { key: 'digit', label: 'Chứa ít nhất một chữ số', test: v => /\d/.test(v) },
  { key: 'symbol', label: 'Chứa ít nhất một ký tự đặc biệt (@#$%^&+=!)', test: v => /[@#$%^&+=!]/.test(v) },
];

const STRENGTH_LABEL = ['Rất yếu (0/4)', 'Yếu (1/4)', 'Trung bình (2/4)', 'Khá an toàn (3/4)', 'Mạnh (4/4)'];

/**
 * BE trả 2 dạng: Bean Validation 400 "Validation failed" + detail theo field
 * (currentPassword / newPassword), và rule nghiệp vụ 400 với `message` tiếng Việt
 * ("Mật khẩu hiện tại không đúng" / "Mật khẩu mới phải ..."). Câu chứa "hiện tại" gắn ô
 * hiện tại, chứa "mới" gắn ô mới; phần còn lại gom qua readApiErrorMessage hiển thị form-level.
 */
const passwordFieldErrors = (err: any): { current: string; newPwd: string; general: string } => {
  const out = { current: '', newPwd: '', general: '' };
  const detail = err?.response?.data?.detail;
  if (detail && typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    if (typeof d.currentPassword === 'string') out.current = d.currentPassword.trim();
    if (typeof d.newPassword === 'string') out.newPwd = d.newPassword.trim();
  }
  const message: string = err?.response?.data?.message ?? '';
  if (message && message !== 'Validation failed') {
    if (/hiện tại/i.test(message)) out.current = out.current || message;
    else if (/mới/i.test(message)) out.newPwd = out.newPwd || message;
    else out.general = message;
  }
  if (!out.current && !out.newPwd && !out.general) {
    out.general = readApiErrorMessage(err, 'Không đổi được mật khẩu. Vui lòng thử lại.', ['currentPassword', 'newPassword']);
  }
  return out;
};

const card = 'bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md';
const pwdInput =
  'w-full h-10 px-3 pr-10 rounded-lg bg-surface-container-lowest border border-outline-variant text-ds-body-md text-on-surface placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const readonlyCell =
  'h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-2 text-body-md text-on-surface';

const FieldNote: React.FC<{ text: string }> = ({ text }) => (
  text ? (
    <span className="flex items-start gap-1 text-ds-label-sm text-error">
      <span className={`${ICON} text-[15px] shrink-0`}>error</span>
      <span>{text}</span>
    </span>
  ) : null
);

const EyeButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button
    type="button"
    aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-strong hover:text-on-surface border-0 bg-transparent cursor-pointer p-0"
  >
    <span className={`${ICON} text-[18px]`}>{shown ? 'visibility_off' : 'visibility'}</span>
  </button>
);

const MessageRow: React.FC<{ kind: 'success' | 'error'; children: React.ReactNode }> = ({ kind, children }) => (
  <p
    role="status"
    className={`m-0 flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-ds-body-sm ${
      kind === 'success' ? 'bg-success-bg text-success-text' : 'bg-error-container text-on-error-container'
    }`}
  >
    <span className={`${ICON} text-[18px]`}>{kind === 'success' ? 'check_circle' : 'error'}</span>
    <span className="flex-1 min-w-0">{children}</span>
  </p>
);

const CandidateAccountSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const userId = user?.id ?? 0;
  const { profile, error: profileError, fetchProfile } = useCandidateController();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [reveal, setReveal] = useState({ current: false, new: false, confirm: false });
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [fieldErr, setFieldErr] = useState({ current: '', newPwd: '' });

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  // Chỉ lấy profile để đọc updatedAt (ẩn khi BE chưa trả); userId bất biến trong phiên.
  useEffect(() => {
    if (user?.role === 'ROLE_USER' && userId) void fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const passed = useMemo(() => RULES.filter(r => r.test(newPwd)).length, [newPwd]);
  const match = newPwd.length > 0 && newPwd === confirmPwd;
  // Rule thất bại CHẶN ngay lúc submit (khớp AdminAccountSettingsPage).
  const pwdBlocked = changing || currentPwd.length === 0 || passed < 4 || !match;

  const clearPwdErrors = () => { setPwdMsg(null); setFieldErr({ current: '', newPwd: '' }); };

  const resetPwdForm = useCallback(() => {
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); clearPwdErrors();
  }, []);

  const submitPassword = useCallback(async () => {
    if (pwdBlocked) return;
    clearPwdErrors();
    setChanging(true);
    try {
      const res = await AuthService.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      if (!alive.current) return;
      resetPwdForm();
      setPwdMsg({
        kind: 'success',
        text: res.data.message
          ?? 'Đổi mật khẩu thành công. Mọi phiên đăng nhập cũ đã bị thu hồi — hãy đăng nhập lại bằng mật khẩu mới.',
      });
    } catch (err) {
      if (!alive.current) return;
      const errs = passwordFieldErrors(err);
      setFieldErr({ current: errs.current, newPwd: errs.newPwd });
      if (errs.general) setPwdMsg({ kind: 'error', text: errs.general });
    } finally {
      if (alive.current) setChanging(false);
    }
  }, [currentPwd, newPwd, pwdBlocked, resetPwdForm]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={card}>
        <span className={`${ICON} text-[28px] text-outline-strong`}>lock</span>
        <p className="m-0 text-body-md text-on-surface-variant">
          Trang này chỉ dành cho tài khoản ứng viên. Vui lòng đăng nhập bằng tài khoản ứng viên.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Header: tiêu đề + chip "Cập nhật lần cuối" từ candidate-profile.updatedAt (ẩn khi thiếu) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <h1 className="m-0 text-ds-headline-xl text-on-surface tracking-tight">
            Cài đặt tài khoản &amp; Tùy chọn bảo mật
          </h1>
          <p className="m-0 text-ds-body-md text-on-surface-variant max-w-2xl">
            Quản lý thông tin đăng nhập và đổi mật khẩu tài khoản ứng viên.
          </p>
        </div>
        {profile?.updatedAt && (
          <div className="flex items-center gap-space-sm shrink-0 self-start md:self-auto">
            <span className="text-ds-label-sm px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary-teal" />
              Cập nhật lần cuối: {fmtServer(profile.updatedAt)}
            </span>
          </div>
        )}
      </div>

      {profileError && (
        <ErrorBlock message={profileError} onRetry={() => void fetchProfile()} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Cột trái: thông tin đăng nhập (readonly, nguồn /auth/me) + form đổi mật khẩu */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <section className={card}>
            <div className="flex items-center gap-space-sm pb-space-sm border-b border-surface-container-high">
              <span className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed shrink-0">
                <span className={`${ICON} text-[20px]`}>person_outline</span>
              </span>
              <div className="flex flex-col">
                <h2 className="m-0 text-ds-headline-sm text-on-surface">Thông tin đăng nhập &amp; Tài khoản</h2>
                <p className="m-0 text-ds-body-sm text-on-surface-variant">
                  Địa chỉ liên hệ chính thức dùng cho tài khoản và phỏng vấn
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-ds-label-md text-on-surface font-semibold">Họ và tên</label>
                  <span className="inline-flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5 text-[11px] text-outline-strong">
                    <span className={`${ICON} text-[14px]`}>lock</span>
                    Chỉ đọc
                  </span>
                </div>
                <div className={readonlyCell}>
                  <span className="truncate">{user.fullName}</span>
                  <span className={`${ICON} text-outline-strong text-[18px] shrink-0`}>badge</span>
                </div>
                <span className="text-ds-body-sm text-outline-strong">
                  Backend chưa cho phép tự sửa họ tên — liên hệ bộ phận hỗ trợ để cập nhật.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <label className="text-ds-label-md text-on-surface font-semibold">Địa chỉ Email</label>
                  <div className={readonlyCell}>
                    <span className="truncate" title={user.email}>{user.email}</span>
                    <span className={`${ICON} text-secondary-teal text-[18px] shrink-0`}>mail</span>
                  </div>
                </div>
                {user.phone ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-ds-label-md text-on-surface font-semibold">Số điện thoại</label>
                    <div className={readonlyCell}>
                      <span className="truncate">{user.phone}</span>
                      <span className={`${ICON} text-secondary-teal text-[18px] shrink-0`}>call</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <Link
                to="/my-profile"
                className="self-start inline-flex items-center gap-2 px-space-md py-2 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-ds-label-md transition-colors no-underline shadow-sm"
              >
                <span className={`${ICON} text-[18px] text-primary`}>edit_note</span>
                Chỉnh sửa hồ sơ &amp; CV (kỹ năng, kinh nghiệm, mục tiêu)
              </Link>
            </div>
          </section>

          {/* Đổi mật khẩu: POST /api/user/change-password — rule + meter sao từ AdminAccountSettingsPage */}
          <section className={card}>
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
              <h3 className="m-0 text-ds-headline-sm text-on-surface font-semibold flex items-center gap-2">
                <span className={`${ICON} text-[18px] text-on-surface-variant`}>lock_reset</span>
                Đổi mật khẩu tài khoản
              </h3>
            </div>

            <form
              className="flex flex-col gap-space-md"
              onSubmit={(e) => { e.preventDefault(); void submitPassword(); }}
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-ds-label-md text-on-surface" htmlFor="cand-current-pwd">
                  Mật khẩu hiện tại <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="cand-current-pwd"
                    className={`${pwdInput} ${fieldErr.current ? 'border-error' : ''}`}
                    type={reveal.current ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPwd}
                    onChange={(e) => { setCurrentPwd(e.target.value); clearPwdErrors(); }}
                  />
                  <EyeButton shown={reveal.current} onToggle={() => setReveal(v => ({ ...v, current: !v.current }))} />
                </div>
                <FieldNote text={fieldErr.current} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <label className="text-ds-label-md text-on-surface" htmlFor="cand-new-pwd">
                    Mật khẩu mới <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cand-new-pwd"
                      className={`${pwdInput} ${fieldErr.newPwd ? 'border-error' : ''}`}
                      type={reveal.new ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Tối thiểu 8 ký tự"
                      value={newPwd}
                      onChange={(e) => { setNewPwd(e.target.value); clearPwdErrors(); }}
                    />
                    <EyeButton shown={reveal.new} onToggle={() => setReveal(v => ({ ...v, new: !v.new }))} />
                  </div>
                  <FieldNote text={fieldErr.newPwd} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-ds-label-md text-on-surface" htmlFor="cand-confirm-pwd">
                    Xác nhận mật khẩu mới <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cand-confirm-pwd"
                      className={`${pwdInput} ${confirmPwd.length > 0 && !match ? 'border-error' : ''}`}
                      type={reveal.confirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPwd}
                      onChange={(e) => { setConfirmPwd(e.target.value); clearPwdErrors(); }}
                    />
                    <EyeButton shown={reveal.confirm} onToggle={() => setReveal(v => ({ ...v, confirm: !v.confirm }))} />
                  </div>
                  {confirmPwd.length > 0 && (
                    <span className={`flex items-center gap-1 text-ds-label-sm font-semibold ${match ? 'text-secondary-teal' : 'text-error'}`}>
                      <span className={`${ICON} text-[15px]`}>{match ? 'check_circle' : 'error'}</span>
                      {match ? 'Mật khẩu khớp nhau' : 'Mật khẩu không khớp'}
                    </span>
                  )}
                </div>
              </div>

              {/* Meter + checklist 4 rule (logic đếm `passed` như AdminAccountSettingsPage) */}
              <div className="flex flex-col gap-1.5 bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex items-center justify-between text-ds-label-sm">
                  <span className="text-on-surface-variant">Độ an toàn mật khẩu:</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    passed >= 4 ? 'text-secondary-teal' : passed >= 2 ? 'text-tertiary' : 'text-error'
                  }`}
                  >
                    <span className={`${ICON} text-[14px]`}>shield</span>
                    {STRENGTH_LABEL[passed]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  {RULES.map((r, i) => (
                    <span key={r.key} className={`h-full rounded-full ${i < passed ? 'bg-secondary-teal' : 'bg-surface-container-high'}`} />
                  ))}
                </div>
                <ul className="space-y-1 pt-1 text-ds-body-sm list-none p-0 m-0">
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

              <div className="p-space-md rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed-dim/40 flex items-start gap-space-sm">
                <span className={`${ICON} text-[20px] text-tertiary shrink-0 mt-0.5`}>info</span>
                <p className="m-0 text-ds-body-sm text-on-surface leading-snug">
                  Mật khẩu mới phải thỏa đủ 4 rule ở trên. Khi đổi thành công, hệ thống thu hồi MỌI phiên
                  đăng nhập cũ (kể cả máy đang dùng) — bạn sẽ phải đăng nhập lại.
                </p>
              </div>

              {pwdMsg && (
                <MessageRow kind={pwdMsg.kind}>
                  {pwdMsg.text}
                  {pwdMsg.kind === 'success' && (
                    <button type="button" onClick={logout} className={buttonClass('secondary', 'ms-2 h-8')}>
                      Đăng xuất ngay
                    </button>
                  )}
                </MessageRow>
              )}

              <div className="flex items-center justify-end gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={resetPwdForm}
                  className="px-space-md py-2 h-10 rounded-lg bg-surface-container text-on-surface text-ds-label-lg hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
                >
                  Hủy thay đổi
                </button>
                <button
                  type="submit"
                  disabled={pwdBlocked}
                  className="px-space-md py-2 h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-ds-label-lg transition-colors flex items-center gap-2 shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`${ICON} text-[18px]`}>{changing ? 'progress_activity' : 'save'}</span>
                  {changing ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Cột phải: khối tiện ích thật (link hồ sơ + đăng xuất) — các card mockup còn lại
            (liên kết mạng xã hội, 2FA, phiên, thông báo, Danger Zone) bỏ vì không có endpoint */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm pb-space-sm border-b border-surface-container-high">
              <span className="p-2 rounded-lg bg-secondary-container/50 text-on-secondary-container shrink-0">
                <span className={`${ICON} text-[20px]`}>tune</span>
              </span>
              <h3 className="m-0 text-ds-headline-sm text-on-surface">Tiện ích tài khoản</h3>
            </div>
            <Link
              to="/my-profile"
              className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors no-underline text-on-surface"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className={`${ICON} text-[22px] text-primary shrink-0`}>badge</span>
                <span className="flex flex-col min-w-0">
                  <span className="text-ds-label-md font-semibold">Hồ sơ &amp; CV</span>
                  <span className="text-ds-body-sm text-on-surface-variant truncate">
                    Kỹ năng, số năm kinh nghiệm, tóm tắt, mục tiêu nghề nghiệp
                  </span>
                </span>
              </span>
              <span className={`${ICON} text-outline-strong shrink-0`}>arrow_forward</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 p-3 rounded-lg text-error text-ds-label-md font-semibold hover:bg-error-container/40 transition-colors border-0 bg-transparent cursor-pointer text-left"
            >
              <span className={`${ICON} text-[22px]`}>logout</span>
              Đăng xuất khỏi thiết bị này
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CandidateAccountSettingsPage;
