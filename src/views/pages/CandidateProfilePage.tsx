import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useCvController } from '../../controllers/useCvController';
import { useAuth } from '../../context/AuthContext';
import { splitCommaList, joinCommaList } from '../../utils/commaList';
import { timeAgo } from '../components/adminKit';
import { ErrorBanner, LoadingState } from '../components/ui';

/**
 * Màn "Hồ sơ cá nhân & CV Ứng viên" theo mockup Stitch 4 `h_s_cv_ai_interview_platform`
 * (plan: spec/features/candidate-redesign-stitch4.md §4-S1).
 *
 * Khối mockup BỎ vì BE không có nguồn số (luật conventions §3): ảnh đại diện + đổi ảnh,
 * toggle "Open to work", "12 lượt xem hồ sơ", "94% khớp thuật toán AI", vòng "Độ hoàn thiện 85%",
 * upload kéo-thả PDF/DOCX (chưa có POST /cv/upload), drop-down địa điểm + lương + chức danh
 * (CandidateProfile không có field), mục "Kinh nghiệm làm việc" và "Học vấn & Chứng chỉ" (không có bảng),
 * claim "sát hơn 35%" trong mẹo AI.
 */

const inputVI =
  'w-full h-10 px-space-md rounded-lg bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all';
const labelVI = 'text-label-md text-on-surface';
const cardVI = 'bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-lg';
const sectionTitle = (icon: string, title: string, hint: string, tone: 'primary' | 'teal' = 'primary') => (
  <div className="flex items-center gap-space-sm">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary-teal/10 text-secondary-teal'}`}>
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </div>
    <div>
      <h2 className="m-0 text-headline-md text-on-surface">{title}</h2>
      <span className="text-body-sm text-on-surface-variant">{hint}</span>
    </div>
  </div>
);

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading, error, successMsg, fetchProfile, updateProfile, clearMessages } =
    useCandidateController();
  const { cvs, fetchMyCvs } = useCvController();

  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [summary, setSummary] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchProfile();
      fetchMyCvs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills || '');
      setExperienceYears(String(profile.experienceYears ?? 0));
      setSummary(profile.summary || '');
      setCareerGoal(profile.careerGoal || '');
      setCvFileName(profile.cvFileName || '');
    }
  }, [profile]);

  const skillList = useMemo(() => splitCommaList(skills), [skills]);
  const extractedSkills = useMemo(() => {
    const latest = cvs[0];
    if (!latest) return [] as string[];
    return (latest.detectedSkills ?? []).filter((s) => !skillList.some((k) => k.toLowerCase() === s.toLowerCase()));
  }, [cvs, skillList]);

  const setSkillList = (list: string[]) => setSkills(joinCommaList(list));
  const addSkill = (value: string) => {
    const item = value.trim();
    if (!item || skillList.some((s) => s.toLowerCase() === item.toLowerCase())) return;
    setSkillList([...skillList, item]);
  };
  const removeSkill = (value: string) => setSkillList(skillList.filter((s) => s !== value));

  const resetForm = () => {
    if (!profile) return;
    setSkills(profile.skills || '');
    setExperienceYears(String(profile.experienceYears ?? 0));
    setSummary(profile.summary || '');
    setCareerGoal(profile.careerGoal || '');
    setCvFileName(profile.cvFileName || '');
    clearMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    await updateProfile({
      skills: joinCommaList(skillList),
      experienceYears: Number(experienceYears) || 0,
      summary,
      careerGoal,
      cvFileName,
    });
  };

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={cardVI}>
        <p className="m-0 text-body-md text-on-surface-variant">Vui lòng đăng nhập bằng tài khoản ứng viên.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-space-xl pb-24">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-space-xs max-w-2xl">
          <div className="flex items-center gap-space-xs text-primary text-label-md">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Hồ sơ năng lực ứng viên tiêu chuẩn</span>
          </div>
          <h1 className="m-0 text-headline-lg text-on-surface tracking-tight">Hồ sơ cá nhân &amp; CV Ứng viên</h1>
          <p className="m-0 text-body-md text-on-surface-variant leading-relaxed">
            Cập nhật hồ sơ đầy đủ để hệ thống AI phân tích năng lực, khớp vị trí tuyển dụng chính xác
            và tùy biến kịch bản phỏng vấn theo đúng kinh nghiệm thực tế.
          </p>
        </div>
        <Link
          to="/opportunities"
          className="h-10 px-space-md rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-space-xs text-label-lg shadow-sm no-underline shrink-0"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
          <span>Xem trước CV công khai</span>
        </Link>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-success-bg px-4 py-3 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      <ErrorBanner message={error} />
      {loading && <LoadingState label="Đang tải hồ sơ..." />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Danh tính */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col items-center text-center gap-space-md">
            <div className="w-28 h-28 rounded-full bg-surface-container-high shadow-md flex items-center justify-center text-display text-primary">
              {initials || '?'}
            </div>
            <div className="flex flex-col items-center gap-space-xs">
              <h2 className="m-0 text-headline-md text-on-surface">{user.fullName}</h2>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary-teal">code</span>
                <span className="text-label-md text-on-surface-variant">
                  {Number(experienceYears) > 0 ? `${experienceYears} năm kinh nghiệm` : 'Chưa ghi nhận kinh nghiệm'}
                </span>
              </div>
              <span className="text-body-sm text-outline-strong">{user.email}</span>
            </div>
          </div>

          {/* Quản lý File CV */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">description</span>
                <h3 className="m-0 text-headline-sm text-on-surface">Quản lý File CV</h3>
              </div>
              {cvFileName.trim() ? (
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm uppercase">Đang dùng</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm uppercase">Chưa có</span>
              )}
            </div>

            {cvFileName.trim() && (
              <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-label-md text-on-surface truncate" title={cvFileName}>{cvFileName}</span>
                  {profile?.updatedAt && (
                    <span className="text-body-sm text-on-surface-variant truncate mt-0.5">Đã cập nhật {timeAgo(profile.updatedAt)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-space-xs">
              <label className={labelVI} htmlFor="cvFileName">Tên file CV đang dùng</label>
              <input
                id="cvFileName"
                className={inputVI}
                value={cvFileName}
                onChange={(e) => setCvFileName(e.target.value)}
                placeholder="duong_thi_em_cv.pdf"
              />
              <span className="text-body-sm text-outline-strong">
                Chưa hỗ trợ tải file lên — hệ thống chỉ lưu tên hồ sơ đang hoạt động.
              </span>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs">
              <Link to="/cv-analyzer" className="h-9 px-space-md rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/30 text-label-md flex items-center justify-center gap-space-xs transition-colors shadow-sm no-underline">
                <span className="material-symbols-outlined text-[18px] text-primary">fact_check</span>
                <span>Quét &amp; phân tích CV bằng AI</span>
              </Link>
              <Link to="/cover-letters" className="h-9 px-space-md rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/30 text-label-md flex items-center justify-center gap-space-xs transition-colors shadow-sm no-underline">
                <span className="material-symbols-outlined text-[18px] text-primary">mail</span>
                <span>Thư xin việc do AI soạn</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Thông tin cá nhân */}
          <div className={cardVI}>
            <div className="flex items-center justify-between pb-space-xs">
              {sectionTitle('person', 'Thông tin cá nhân cơ bản', 'Thông tin dùng để nhà tuyển dụng liên hệ và hệ thống thiết lập xưng hô')}
              <span className="text-label-sm text-outline-strong">Bắt buộc (*)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className={labelVI}>Họ và tên *</label>
                <input className={`${inputVI} cursor-default`} type="text" value={user.fullName ?? ''} readOnly />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelVI} htmlFor="email">Email công việc *</label>
                <input id="email" className={`${inputVI} cursor-default`} type="email" value={user.email} readOnly />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelVI}>Số điện thoại</label>
                <input className={`${inputVI} cursor-default`} type="text" value={user.phone || 'Chưa cập nhật'} readOnly />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelVI} htmlFor="experienceYears">Số năm kinh nghiệm</label>
                <input
                  id="experienceYears"
                  className={inputVI}
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label className={labelVI} htmlFor="summary">Tóm tắt năng lực</label>
                <span className="text-body-sm text-outline-strong">{summary.length} / 600 ký tự</span>
              </div>
              <textarea
                id="summary"
                className="w-full p-space-md rounded-lg bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest leading-relaxed resize-none transition-all"
                rows={4}
                maxLength={600}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Vài năm gần nhất bạn làm gì, với công nghệ nào, kết quả ra sao?"
              />
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label className={labelVI} htmlFor="careerGoal">Mục tiêu nghề nghiệp</label>
                <span className="text-body-sm text-outline-strong">{careerGoal.length} / 600 ký tự</span>
              </div>
              <textarea
                id="careerGoal"
                className="w-full p-space-md rounded-lg bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest leading-relaxed resize-none transition-all"
                rows={3}
                maxLength={600}
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="Vị trí hoặc hướng phát triển bạn muốn nhắm tới"
              />
            </div>
          </div>

          {/* Kỹ năng */}
          <div className={cardVI}>
            <div className="flex items-center justify-between">
              {sectionTitle('psychology', 'Kỹ năng chuyên môn & Công nghệ', 'Kỹ năng được gắn thẻ giúp AI đối chiếu độ khớp với bản mô tả công việc (JD)', 'teal')}
              <span className="text-label-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold">{skillList.length} kỹ năng</span>
            </div>

            {extractedSkills.length > 0 && (
              <div className="p-space-md rounded-xl bg-secondary-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-secondary-teal shrink-0">auto_awesome</span>
                  <span className="text-body-sm text-on-secondary-container">
                    Kỹ năng AI trích xuất từ CV phân tích gần nhất:{' '}
                    <span className="font-semibold">{extractedSkills.slice(0, 6).join(', ')}{extractedSkills.length > 6 ? '…' : ''}</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="h-8 px-space-md rounded-lg bg-secondary-teal text-on-primary text-label-md hover:opacity-90 transition-colors shrink-0 flex items-center gap-space-xs self-start sm:self-auto"
                  onClick={() => { setSkillList([...skillList, ...extractedSkills]); }}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm tất cả</span>
                </button>
              </div>
            )}

            {skillList.length > 0 && (
              <div className="flex flex-wrap items-center gap-space-xs">
                {skillList.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-label-md">
                    {s}
                    <button type="button" className="hover:text-error transition-colors flex items-center border-0 bg-transparent p-0 cursor-pointer" onClick={() => removeSkill(s)} aria-label={`Xóa kỹ năng ${s}`}>
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-space-sm">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-outline-strong text-[18px]">add_circle</span>
                <input
                  className={`${inputVI} pl-8`}
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkill);
                      setNewSkill('');
                    }
                  }}
                  placeholder="Nhập tên kỹ năng mới (ví dụ: GraphQL, Zustand, Cypress...) rồi nhấn Enter"
                />
              </div>
              <button
                type="button"
                className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md transition-colors"
                onClick={() => { addSkill(newSkill); setNewSkill(''); }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh hành động dính đáy màn */}
      <div className="sticky bottom-4 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary-teal shrink-0" />
          <span className="text-body-sm">
            {profile?.updatedAt ? <>Lần lưu gần nhất: <strong>{timeAgo(profile.updatedAt)}</strong></> : 'Hồ sơ chưa được lưu'}
          </span>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
          <button type="button" className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-lg transition-colors" onClick={resetForm}>
            Hủy bỏ thay đổi
          </button>
          <button
            type="submit"
            className="h-10 px-space-lg rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-lg flex items-center gap-space-xs shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Lưu thay đổi hồ sơ</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default CandidateProfilePage;
