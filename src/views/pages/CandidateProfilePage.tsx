/**
 * Màn "Hồ sơ cá nhân & CV Ứng viên" (mockup Stitch `h_s_cv`) — route /my-profile, shell CandidateLayout.
 *
 * Giữ nguyên luồng dữ liệu cũ: GET/PUT hồ sơ ứng viên qua `useCandidateController`
 * (skills CSV, experienceYears, summary, careerGoal, cvFileName, updatedAt) +
 * GET /api/user/profile cho SĐT chỉ đọc + PUT/DELETE /api/user/avatar cho ảnh đại diện.
 *
 * "Độ hoàn thiện" là % ĐẾM TRÊN FIELD THẬT (6 mục: tóm tắt, kỹ năng, số năm, mục tiêu, tên CV,
 * SĐT) — không phải điểm AI.
 *
 * Sao đổi so với mockup:
 * - Ô "Địa điểm làm việc mong muốn" và "Mức lương kỳ vọng": BỎ — hồ sơ ứng viên không có field
 *   nào cho hai mục này, để trống sẽ thành chữ giả.
 * - "Họ và tên", "Email", "Số điện thoại": chỉ đọc vì luồng tự phục vụ không có request sửa ba
 *   mục này (SĐT do quản trị viên nhập); hướng dẫn đổi tên ghi cạnh nhãn.
 * - Dropzone "Kéo thả file CV": thay bằng ô ghi tên file (hồ sơ chỉ lưu TÊN file) + cầu nối sang
 *   màn Phân tích CV thật (/cv-analyzer). Nút "Tải xuống CV hiện tại" bỏ vì FE không giữ file.
 * - "Xem trước CV công khai": bỏ (không có trang CV công khai).
 *
 * Khối giữ nguyên chữ thiết kế + dán nhãn "Khối demo": Open to work, Lượt xem hồ sơ/Khớp AI 94%,
 * Gợi ý kỹ năng từ AI, "AI đã trích xuất 18 kỹ năng & 4 dự án", mẹo 35%, Kinh nghiệm làm việc,
 * Học vấn & Chứng chỉ.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useAuth } from '../../context/AuthContext';
import { SelfProfile } from '../../models/Api.model';
import {
  DemoTag, ICON, adminButton, adminInputClass, errorText, initialsOf, timeAgo,
} from '../components/adminKit';
import { CARD, CandidatePageHeader, SOFT } from '../components/candidateKit';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Không đọc được tệp ảnh'));
  reader.readAsDataURL(file);
});

const csvToList = (value: string) => value.split(',').map(s => s.trim()).filter(Boolean);
const listToCsv = (list: string[]) => Array.from(new Set(list)).join(', ');

const label2 = 'text-ds-label-md text-on-surface';
const boxInput = `${adminInputClass} bg-surface-container-low border-transparent`;

const SectionHead: React.FC<{
  icon: string; iconClass: string; title: string; description?: string; right?: React.ReactNode;
}> = ({ icon, iconClass, title, description, right }) => (
  <div className="flex flex-wrap items-start justify-between gap-space-sm border-b border-surface-container-high pb-space-sm">
    <div className="flex min-w-0 items-center gap-space-sm">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <span className={`${ICON} text-[18px]`}>{icon}</span>
      </span>
      <div className="min-w-0">
        <h2 className="text-ds-headline-md text-on-surface">{title}</h2>
        {description && <p className="text-ds-body-sm text-on-surface-variant">{description}</p>}
      </div>
    </div>
    {right}
  </div>
);

const ReadonlyBox: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="flex flex-col gap-space-xs">
    <span className={label2}>{label}</span>
    <div className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-low px-space-md text-ds-body-md text-on-surface-variant">
      <span className="truncate">{value || 'Chưa có'}</span>
      <span className={`${ICON} ml-auto shrink-0 text-[16px]`}>lock</span>
    </div>
    {hint && <span className="text-ds-body-sm text-outline">{hint}</span>}
  </div>
);

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading, error, successMsg, fetchProfile, updateProfile, clearMessages } =
    useCandidateController();

  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [summary, setSummary] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [openToWork, setOpenToWork] = useState(true);
  const [saving, setSaving] = useState(false);

  const [self, setSelf] = useState<SelfProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchProfile();
  }, [fetchProfile, user]);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills || '');
      setExperienceYears(String(profile.experienceYears ?? 0));
      setSummary(profile.summary || '');
      setCareerGoal(profile.careerGoal || '');
      setCvFileName(profile.cvFileName || '');
    }
  }, [profile]);

  useEffect(() => {
    AuthService.getSelfProfile()
      .then(res => { if (alive.current) setSelf(res.data); })
      .catch(() => { /* SĐT chỉ đọc: thiếu thì màn vẫn dùng được */ });
  }, []);

  const skillList = useMemo(() => csvToList(skills), [skills]);

  const completeness = useMemo(() => {
    const checks = [
      summary.trim().length > 0,
      skillList.length >= 3,
      Number(experienceYears) > 0,
      careerGoal.trim().length > 0,
      cvFileName.trim().length > 0,
      (self?.phone ?? '').trim().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [careerGoal, cvFileName, experienceYears, self, skillList.length, summary]);

  const addSkill = useCallback(() => {
    const value = newSkill.trim();
    if (!value) return;
    setSkills(prev => listToCsv([...csvToList(prev), value]));
    setNewSkill('');
  }, [newSkill]);

  const removeSkill = useCallback((name: string) => {
    setSkills(prev => csvToList(prev).filter(s => s !== name).join(', '));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    clearMessages();
    setSaving(true);
    await updateProfile({
      skills: listToCsv(skillList),
      experienceYears: Number(experienceYears) || 0,
      summary,
      careerGoal,
      cvFileName: cvFileName.trim(),
    });
    if (alive.current) setSaving(false);
  };

  const onAvatarPick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarMsg({ kind: 'error', text: 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.' });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarMsg({ kind: 'error', text: `Ảnh vượt giới hạn ${(AVATAR_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB.` });
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

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={`${CARD} p-space-lg text-ds-body-md text-on-surface-variant`}>
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-space-xl" onSubmit={handleSubmit}>
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Hồ sơ & CV' }]}
        title="Hồ sơ cá nhân & CV Ứng viên"
        subtitle="Cập nhật hồ sơ đầy đủ để hệ thống phân tích năng lực, khớp vị trí tuyển dụng chính xác và tùy biến kịch bản phỏng vấn theo đúng kinh nghiệm thực tế."
        actions={
          <>
            <Link to="/cv-analyzer" className={adminButton('ghost', 'h-10 no-underline')}>
              <span className={`${ICON} text-[18px] text-primary`}>description</span>
              Phân tích CV
            </Link>
            <button type="submit" disabled={saving || loading} className={adminButton('primary', 'h-10')}>
              <span className={`${ICON} text-[18px]`}>{saving ? 'progress_activity' : 'save'}</span>
              Lưu thay đổi
            </button>
          </>
        }
        status={
          <span className={`flex items-center gap-space-md rounded-xl px-space-md py-space-sm shadow-sm ${SOFT}`}>
            <span className="relative flex h-12 w-12 items-center justify-center">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-highest"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-primary transition-all duration-700 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${completeness}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute text-ds-label-md text-on-surface tabular-nums">{completeness}%</span>
            </span>
            <span className="flex flex-col">
              <span className="flex items-center gap-space-xs text-ds-label-lg text-on-surface">
                Độ hoàn thiện
                <span className="h-2 w-2 rounded-full bg-secondary-teal" />
              </span>
              <span className="text-ds-body-sm text-on-surface-variant">
                Đếm theo 6 mục đã điền (tóm tắt, kỹ năng, số năm, mục tiêu, CV, SĐT)
              </span>
            </span>
          </span>
        }
      />

      {successMsg && (
        <p role="status" className="m-0 flex items-center gap-2 rounded-lg bg-secondary-container/50 px-4 py-3 text-ds-body-md text-on-secondary-container">
          <span className={`${ICON} text-[18px]`}>check_circle</span>
          {successMsg}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
          <span className={`${ICON} text-[18px]`}>error</span>
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        {/* Cột trái: danh thiếp + quản lý CV */}
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          <div className={`${CARD} flex flex-col gap-space-lg p-space-lg`}>
            <div className="flex flex-col items-center gap-space-md text-center">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-surface-container-high shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ds-display-sm font-bold text-primary">
                      {initialsOf(user.fullName)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Thay đổi ảnh đại diện"
                  disabled={avatarBusy}
                  onClick={() => avatarInput.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-colors hover:bg-on-primary-fixed-variant"
                >
                  <span className={`${ICON} text-[18px]`}>{avatarBusy ? 'progress_activity' : 'photo_camera'}</span>
                </button>
              </div>
              <input ref={avatarInput} type="file" accept={AVATAR_TYPES.join(',')} className="hidden" onChange={onAvatarPick} />
              <div className="flex flex-col items-center">
                {avatarUrl ? (
                  <button type="button" onClick={removeAvatar} className="mb-space-xs text-ds-label-md text-primary hover:underline">
                    Xóa ảnh đại diện
                  </button>
                ) : (
                  <span className="mb-space-xs text-ds-label-md text-outline">Chưa có ảnh</span>
                )}
                <span className="text-ds-body-sm text-outline">PNG, JPG hoặc WEBP, tối đa 2MB</span>
              </div>
              {avatarMsg && (
                <p className={`m-0 flex items-center gap-1.5 text-ds-body-sm ${avatarMsg.kind === 'success' ? 'text-secondary-teal' : 'text-error'}`}>
                  <span className={`${ICON} text-[16px]`}>{avatarMsg.kind === 'success' ? 'check_circle' : 'error'}</span>
                  {avatarMsg.text}
                </p>
              )}
              <div className="flex flex-col items-center gap-space-xs pt-space-xs">
                <h2 className="text-ds-headline-md text-on-surface">{user.fullName}</h2>
                <span className="flex items-center gap-space-xs text-ds-label-md text-on-surface-variant">
                  <span className={`${ICON} text-[16px] text-secondary-teal`}>code</span>
                  {careerGoal.trim() ? careerGoal.trim().slice(0, 48) : 'Chưa đặt mục tiêu nghề nghiệp'}
                </span>
                <span className="text-ds-body-sm text-outline">{user.email}</span>
                {profile?.updatedAt && (
                  <span className="text-ds-body-sm text-outline">Hồ sơ lưu {timeAgo(profile.updatedAt)}</span>
                )}
              </div>
            </div>

            <div className={`flex items-center justify-between gap-space-md rounded-xl p-space-md ${SOFT}`}>
              <div className="flex flex-col">
                <span className="text-ds-label-lg leading-snug text-on-surface">Sẵn sàng nhận lời mời phỏng vấn</span>
                <span className="flex flex-wrap items-center gap-1.5 text-ds-body-sm text-on-surface-variant">
                  Open to work
                  <DemoTag>Khối demo</DemoTag>
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={openToWork}
                aria-label="Sẵn sàng nhận lời mời phỏng vấn"
                onClick={() => setOpenToWork(v => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full border-0 transition-colors ${openToWork ? 'bg-secondary-teal' : 'bg-outline-variant'}`}
              >
                <span
                  className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform"
                  style={{ transform: openToWork ? 'translateX(20px)' : 'none' }}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
              <div className={`flex flex-col items-center rounded-lg p-space-sm text-center ${SOFT}`}>
                <span className="text-ds-headline-sm text-outline">—</span>
                <span className="text-ds-body-sm text-on-surface-variant">Lượt xem hồ sơ</span>
              </div>
              <div className={`flex flex-col items-center rounded-lg p-space-sm text-center ${SOFT}`}>
                <span className="text-ds-headline-sm text-primary tabular-nums">{completeness}%</span>
                <span className="text-ds-body-sm text-on-surface-variant">Mục hồ sơ đã điền</span>
              </div>
            </div>
          </div>

          <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-space-xs">
                <span className={`${ICON} text-[20px] text-primary`}>description</span>
                <h3 className="text-ds-headline-sm text-on-surface">Quản lý File CV</h3>
              </span>
              {cvFileName.trim() ? (
                <span className="rounded-full bg-secondary-container px-2 py-0.5 text-ds-label-sm uppercase text-on-secondary-container">
                  Đã lưu tên
                </span>
              ) : (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-ds-label-sm uppercase text-on-surface-variant">
                  Trống
                </span>
              )}
            </div>

            <div className="flex flex-col gap-space-xs">
              <label className={label2} htmlFor="cv-file-name">Tên file CV đang dùng cho đơn ứng tuyển</label>
              <input
                id="cv-file-name"
                className={boxInput}
                value={cvFileName}
                onChange={e => setCvFileName(e.target.value)}
                placeholder="vd: LeVanHuy_Frontend_CV.pdf"
              />
              <span className="text-ds-body-sm text-outline">
                Hồ sơ chỉ lưu tên file; nội dung CV được phân tích ở màn Phân tích CV.
              </span>
            </div>

            {cvFileName.trim() && (
              <div className="flex items-center gap-space-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
                  <span className={`${ICON} text-[22px]`}>picture_as_pdf</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-ds-label-md text-on-surface" title={cvFileName}>{cvFileName}</span>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    {profile?.updatedAt ? `Ghi nhận ${timeAgo(profile.updatedAt)}` : 'Chưa lưu lần nào'}
                  </span>
                </span>
                <button
                  type="button"
                  title="Xóa tên file"
                  onClick={() => setCvFileName('')}
                  className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                >
                  <span className={`${ICON} text-[18px]`}>delete</span>
                </button>
              </div>
            )}

            <Link to="/cv-analyzer" className={`${adminButton('ghost', 'h-9 w-full no-underline')}`}>
              <span className={`${ICON} text-[18px] text-primary`}>upload_file</span>
              Tải &amp; phân tích CV
            </Link>

            <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-high/60 p-space-md">
              <span className={`${ICON} mt-0.5 shrink-0 text-[20px] text-primary`}>smart_toy</span>
              <div className="flex flex-col">
                <span className="flex flex-wrap items-center gap-1.5 text-ds-label-md text-on-surface">
                  Mẹo phỏng vấn từ trợ lý AI
                  <DemoTag>Khối demo</DemoTag>
                </span>
                <span className="text-ds-body-sm text-on-surface-variant">
                  CV cập nhật chi tiết các số liệu định lượng (metrics) sẽ giúp hệ thống tạo ra các câu
                  phỏng vấn sát với thực tế hơn 35%.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: ba khối nhập liệu */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          <section className={`${CARD} flex flex-col gap-space-lg p-space-lg`}>
            <SectionHead
              icon="person"
              iconClass="bg-primary/10 text-primary"
              title="Thông tin cá nhân cơ bản"
              description="Thông tin dùng để nhà tuyển dụng liên hệ và hệ thống thiết lập xưng hô"
              right={<span className="text-ds-label-sm text-outline">Bắt buộc (*)</span>}
            />
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <ReadonlyBox label="Họ và tên *" value={user.fullName} hint="Đổi tên liên hệ quản trị viên; tên hiển thị chỉ cập nhật sau khi đăng nhập lại." />
              <ReadonlyBox label="Email công việc *" value={user.email} hint="Email đăng nhập, không đổi ở màn này." />
              <ReadonlyBox label="Số điện thoại *" value={(self?.phone ?? '').trim()} hint="Chưa có SĐT thì liên hệ quản trị viên bổ sung." />
              <div className="flex flex-col gap-space-xs">
                <label className={label2} htmlFor="exp-years">Số năm kinh nghiệm *</label>
                <input
                  id="exp-years"
                  className={boxInput}
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={e => setExperienceYears(e.target.value)}
                />
                <span className="text-ds-body-sm text-outline">Dùng để chọn độ khó câu hỏi phỏng vấn.</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={label2} htmlFor="career-goal">Mục tiêu nghề nghiệp (Career Objective)</label>
                <span className="text-ds-body-sm text-outline tabular-nums">{careerGoal.length} ký tự</span>
              </div>
              <textarea
                id="career-goal"
                rows={3}
                className={`${boxInput} h-auto resize-none py-space-md leading-relaxed`}
                value={careerGoal}
                onChange={e => setCareerGoal(e.target.value)}
                placeholder="vd: Hướng tới vị trí Lead Frontend tại công ty sản phẩm có hệ thống thiết kế lớn."
              />
            </div>

            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={label2} htmlFor="summary">Tóm tắt năng lực</label>
                <span className="text-ds-body-sm text-outline tabular-nums">{summary.length} ký tự</span>
              </div>
              <textarea
                id="summary"
                rows={4}
                className={`${boxInput} h-auto resize-none py-space-md leading-relaxed`}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Kinh nghiệm, công nghệ đã dùng và kết quả đo được ở các dự án gần nhất."
              />
            </div>
          </section>

          <section className={`${CARD} flex flex-col gap-space-lg p-space-lg`}>
            <SectionHead
              icon="psychology"
              iconClass="bg-secondary-teal/10 text-secondary-teal"
              title="Kỹ năng chuyên môn & Công nghệ"
              description="Kỹ năng được gắn thẻ giúp đối chiếu độ khớp với bản mô tả công việc (JD)"
              right={
                <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-ds-label-sm font-semibold text-on-surface tabular-nums">
                  {skillList.length} kỹ năng
                </span>
              }
            />

            <div className="flex flex-col gap-space-sm rounded-xl bg-secondary-container/30 p-space-md sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-space-sm text-ds-body-sm text-on-secondary-container">
                <span className={`${ICON} shrink-0 text-[20px] text-secondary-teal`}>auto_awesome</span>
                <span>
                  <span className="font-semibold">Khối demo</span> — gợi ý kỹ năng theo mục tiêu:
                  GraphQL, Micro-frontends, Core Web Vitals.
                </span>
              </span>
              <button
                type="button"
                disabled
                className={`${adminButton('primary', 'h-8 shrink-0 opacity-60 disabled:cursor-not-allowed')} `}
              >
                <span className={`${ICON} text-[16px]`}>add</span>
                Thêm tất cả
              </button>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant">
                Kỹ năng đã lưu trong hồ sơ
              </span>
              {skillList.length === 0 ? (
                <p className="m-0 text-ds-body-sm text-outline">Chưa có kỹ năng nào — thêm ở ô bên dưới.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-space-xs">
                  {skillList.map(s => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-ds-label-md text-on-surface"
                    >
                      {s}
                      <button type="button" aria-label={`Xóa ${s}`} onClick={() => removeSkill(s)} className="flex items-center hover:text-error">
                        <span className={`${ICON} text-[14px]`}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-space-xs">
              <label className={label2} htmlFor="new-skill">Thêm kỹ năng</label>
              <div className="flex gap-space-sm">
                <input
                  id="new-skill"
                  className={boxInput}
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Nhập tên kỹ năng (ví dụ: GraphQL, Zustand, Cypress) rồi nhấn Enter"
                />
                <button type="button" onClick={addSkill} className={adminButton('soft', 'h-10 shrink-0')}>
                  <span className={`${ICON} text-[18px]`}>add</span>
                  Thêm
                </button>
              </div>
              <span className="text-ds-body-sm text-outline">
                Danh sách lưu thành một chuỗi phân tách dấu phẩy; bấm "Lưu thay đổi" để ghi vào hồ sơ.
              </span>
            </div>
          </section>

          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <SectionHead
              icon="work_history"
              iconClass="bg-tertiary-fixed text-on-tertiary-fixed"
              title="Kinh nghiệm làm việc"
              description="Các dòng dưới là bản mẫu — hồ sơ hiện chỉ lưu số năm kinh nghiệm"
              right={<DemoTag>Khối demo</DemoTag>}
            />
            <div className="flex flex-col gap-space-sm">
              {[
                { role: 'Senior Frontend Engineer', org: 'Tech Corp • 01/2023 - Nay', detail: 'Chịu trách nhiệm kiến trúc micro-frontends, tối ưu Core Web Vitals cho hệ thống 2 triệu lượt truy cập/tháng.' },
                { role: 'Frontend Developer', org: 'Startup X • 06/2020 - 12/2022', detail: 'Phát triển dashboard realtime với React + TypeScript, giảm 40% thời gian tải trang.' },
              ].map(item => (
                <div key={item.role} className={`flex flex-col gap-1 rounded-lg p-space-md ${SOFT}`}>
                  <span className="text-ds-headline-sm font-semibold text-on-surface">{item.role}</span>
                  <span className="text-ds-label-md text-on-surface-variant">{item.org}</span>
                  <span className="text-ds-body-sm text-on-surface-variant">{item.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <SectionHead
              icon="school"
              iconClass="bg-primary-fixed text-on-primary-fixed"
              title="Học vấn & Chứng chỉ"
              description="Chưa có nơi lưu trong hồ sơ nên màn chỉ hiển thị bản mẫu"
              right={<DemoTag>Khối demo</DemoTag>}
            />
            <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
              {[
                { title: 'Cử nhân Công nghệ thông tin', org: 'Đại học Bách khoa • 2016 - 2020' },
                { title: 'AWS Certified Developer – Associate', org: 'Amazon • 2023' },
              ].map(item => (
                <div key={item.title} className={`flex flex-col gap-1 rounded-lg p-space-md ${SOFT}`}>
                  <span className="text-ds-label-lg font-semibold text-on-surface">{item.title}</span>
                  <span className="text-ds-body-sm text-on-surface-variant">{item.org}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </form>
  );
};

export default CandidateProfilePage;
