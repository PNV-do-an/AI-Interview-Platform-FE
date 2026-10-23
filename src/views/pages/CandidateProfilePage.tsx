import React, { useEffect, useState } from 'react';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  ErrorBanner,
  LoadingState,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const textareaClass = inputClass.replace('h-9', 'py-2');

const sectionCard =
  'flex flex-col gap-3 rounded-xl bg-card p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]';

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading, error, successMsg, fetchProfile, updateProfile, clearMessages } =
    useCandidateController();

  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [summary, setSummary] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [cvFileName, setCvFileName] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchProfile();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    await updateProfile({
      skills,
      experienceYears: Number(experienceYears) || 0,
      summary,
      careerGoal,
      cvFileName,
    });
  };

  const skillList = skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-body-md text-ink-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </Card>
    );
  }

  return (
    <div className="pb-16">
      <form onSubmit={handleSubmit}>
        {/* Top Quick Context Strip */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-1.5 text-label-sm text-ink-variant">
            <span className="material-symbols-outlined text-[16px]">account_box</span>
            <span>Ứng viên</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-ink">Hồ sơ &amp; CV</span>
          </div>
          <button type="submit" className={buttonClass('primary')}>
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Lưu thay đổi</span>
          </button>
        </div>

        {successMsg && (
          <div
            className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text"
            role="status"
          >
            <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}
        <ErrorBanner message={error} />
        {loading && <LoadingState />}

        {/* Primary Asymmetric Split Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT / MAIN CORE COLUMN */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Candidate Identity Card */}
            <div className="relative overflow-hidden rounded-xl bg-card p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              {/* Subtle background flare (hex literal: thiếu token primary-fixed-dim #c3c0ff) */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#c3c0ff]/25 blur-3xl" />
              <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-surface-mid text-display-mobile text-primary">
                  {initials || '?'}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h1 className="m-0 text-headline-lg text-ink">{user.fullName}</h1>
                    {profile && (
                      <span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-label-sm text-ink-variant">
                        ID-{profile.id}
                      </span>
                    )}
                  </div>
                  <div className="mb-2 mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-body-sm text-ink-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline-strong">
                        mail
                      </span>
                      {user.email}
                    </span>
                    {profile?.updatedAt && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-outline-strong">
                          event
                        </span>
                        {new Date(profile.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className={sectionCard}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">subject</span>
                <h2 className="m-0 text-headline-md text-ink">Tóm tắt bản thân</h2>
              </div>
              <div className="rounded-xl bg-surface-low p-4">
                <textarea
                  className={`${textareaClass} min-h-[120px]`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tóm tắt kinh nghiệm và điểm mạnh của bạn"
                />
              </div>
            </div>

            {/* Technical Skills & Stack */}
            <div className={sectionCard}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">code</span>
                <h2 className="m-0 text-headline-md text-ink">Kỹ năng &amp; công nghệ</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-xl bg-surface-low p-4 md:col-span-2">
                  <label className={labelClass}>Kỹ năng (phân tách bằng dấu phẩy)</label>
                  <input
                    className={inputClass}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Java, Spring Boot, PostgreSQL"
                  />
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-surface-low p-4">
                  <label className={labelClass}>Số năm kinh nghiệm</label>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>
              {skillList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {skillList.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[11px] text-ink-variant"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT / RESUME LEDGER COLUMN */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Active Resume / CV */}
            <div className={sectionCard}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  description
                </span>
                <h2 className="m-0 text-headline-md text-ink">CV hiện tại</h2>
              </div>
              {cvFileName ? (
                <div className="flex items-center gap-3 rounded-xl bg-surface-low p-4">
                  <div className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded bg-danger text-danger-text">
                    <span className="font-mono text-[10px] font-bold">PDF</span>
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  </div>
                  <span className="min-w-0 truncate text-label-md font-semibold text-ink">
                    {cvFileName}
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-surface-low p-4 text-body-sm text-ink-variant">
                  Chưa có CV nào.
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Tên file CV</label>
                <input
                  className={inputClass}
                  value={cvFileName}
                  onChange={(e) => setCvFileName(e.target.value)}
                  placeholder="vd: NguyenVanA_CV.pdf"
                />
              </div>
            </div>

            {/* Career Goal */}
            <div className={sectionCard}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  edit_note
                </span>
                <h2 className="m-0 text-headline-md text-ink">Mục tiêu nghề nghiệp</h2>
              </div>
              <div className="rounded-xl bg-surface-low p-4">
                <textarea
                  className={`${textareaClass} min-h-[80px]`}
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Bạn muốn phát triển sự nghiệp theo hướng nào?"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CandidateProfilePage;
