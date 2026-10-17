import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  ErrorBanner,
  LoadingState,
  StatusBadge,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const textareaClass = inputClass.replace('h-9', 'py-2');

// Mockup radius is 0.5rem (custom xl in the design system); closest token is rounded-lg (0.25rem).
const cardShell = 'rounded-[0.5rem] p-6 sm:p-8';

const SectionHeading: React.FC<{ accentClass: string; children: React.ReactNode }> = ({ accentClass, children }) => (
  <div className="flex items-center gap-2">
    <div className={`h-5 w-1.5 rounded-full ${accentClass}`} />
    <h2 className="m-0 text-headline-lg text-ink">{children}</h2>
  </div>
);

const MetaCell: React.FC<{ label: string; icon?: string; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="flex flex-col">
    <span className="text-label-sm uppercase tracking-wider text-outline-strong">{label}</span>
    <span className="mt-0.5 flex items-center gap-1 text-headline-sm text-ink">
      {icon && <span className="material-symbols-outlined text-[16px] text-outline-strong">{icon}</span>}
      {children}
    </span>
  </div>
);

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const { user } = useAuth();
  const { jobDetail, loading, error, successMsg, fetchJobDetail, applyJob } = useJobController();
  const [coverLetter, setCoverLetter] = useState('');
  const [showApply, setShowApply] = useState(false);

  useEffect(() => { fetchJobDetail(jobId); }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCandidate = user?.role === 'ROLE_USER';

  const onApply = async () => {
    const ok = await applyJob(jobId, coverLetter || undefined);
    if (ok) setShowApply(false);
  };

  const skillTags = jobDetail?.requiredSkills
    ? jobDetail.requiredSkills.split(/[,;\n•]+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const requirementLines = jobDetail?.requirements
    ? jobDetail.requirements.split(/\n+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="pb-16">
      <ErrorBanner message={error} />

      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {loading && <LoadingState />}

      {jobDetail && (
        <>
          {/* Top Navigation & Context Bar */}
          <nav className="flex items-center gap-2 py-4 text-label-md text-ink-variant">
            <Link to="/jobs" className="flex items-center gap-1 text-ink-variant no-underline transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Jobs</span>
            </Link>
            <span className="text-xs text-outline-strong">/</span>
            <span className="font-semibold text-ink">{jobDetail.title}</span>
          </nav>

          {/* Primary Workspace: 12-Column Responsive Layout */}
          <div className="mt-2 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* LEFT / MAIN CONTENT STREAM (Cols 1-8) */}
            <section className="flex flex-col gap-6 lg:col-span-8">
              {/* Hero Header Card */}
              <Card className={`${cardShell} relative overflow-hidden`}>
                {/* Ambient subtle accent glow (secondary-fixed-dim #c0c1ff has no token) */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#c0c1ff]/40 blur-3xl" />
                <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-4">
                    {/* Employer Monogram */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[0.5rem] bg-primary text-on-primary shadow-md">
                      <span className="text-headline-lg font-semibold">{jobDetail.companyName?.charAt(0) || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-headline-md text-ink">{jobDetail.companyName}</span>
                      <h1 className="m-0 mt-1 text-display-mobile tracking-tight text-ink sm:text-display">{jobDetail.title}</h1>
                    </div>
                  </div>
                  {jobDetail.status === 'OPEN' ? (
                    <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-[#e1e0ff] px-3 py-1 text-label-md font-medium text-[#2f2ebe]">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      Actively Hiring
                    </span>
                  ) : (
                    <span className="self-start">
                      <StatusBadge status={jobDetail.status} />
                    </span>
                  )}
                </div>

                {/* Meta Metrics Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4 rounded-[0.5rem] bg-surface-low p-4 sm:grid-cols-4">
                  {jobDetail.salaryRange && (
                    <MetaCell label="Target Salary">{jobDetail.salaryRange}</MetaCell>
                  )}
                  {jobDetail.location && (
                    <MetaCell label="Location" icon="location_on">{jobDetail.location}</MetaCell>
                  )}
                  {jobDetail.position && (
                    <MetaCell label="Engagement">{jobDetail.position}</MetaCell>
                  )}
                  <MetaCell label="Published">{new Date(jobDetail.createdAt).toLocaleDateString('vi-VN')}</MetaCell>
                </div>

                {/* Tags Row */}
                {skillTags.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {skillTags.map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-full bg-surface-high px-3 py-1 font-mono text-label-sm text-ink-variant">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section: Mission & Overview */}
              {jobDetail.description && (
                <Card className={cardShell}>
                  <div className="flex flex-col gap-4">
                    <SectionHeading accentClass="bg-primary">Mission &amp; Overview</SectionHeading>
                    <p className="m-0 whitespace-pre-wrap text-body-lg leading-relaxed text-ink-variant">{jobDetail.description}</p>
                  </div>
                </Card>
              )}

              {/* Section: Requirements & Qualifications */}
              {requirementLines.length > 0 && (
                <Card className={cardShell}>
                  <div className="flex flex-col gap-5">
                    <SectionHeading accentClass="bg-primary">Requirements &amp; Qualifications</SectionHeading>
                    <div className="flex flex-col gap-3 rounded-[0.5rem] bg-surface-low p-4">
                      <ul className="m-0 flex list-none flex-col gap-2 p-0 pl-0">
                        {requirementLines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2 text-body-sm text-ink-variant">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </section>

            {/* RIGHT SECTION / STICKY INTERACTIVE DOCK (Cols 9-12) */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-20">
              {/* Primary Action Card: Quick Apply */}
              {isCandidate && jobDetail.status === 'OPEN' && (
                <Card className="rounded-[0.5rem] p-6 shadow-md">
                  <div className="flex flex-col gap-1">
                    <h2 className="m-0 text-headline-md text-ink">Submit Fast Application</h2>
                    <span className="text-body-sm text-ink-variant">Takes less than 60 seconds with verified profile.</span>
                  </div>

                  {!showApply ? (
                    <button className={buttonClass('primary', 'mt-5 h-11 w-full text-headline-sm')} onClick={() => setShowApply(true)}>
                      <span>Submit Application</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  ) : (
                    <div className="mt-5 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor="cover-note">
                          Engineering Note <span className="font-normal text-outline-strong">(Optional)</span>
                        </label>
                        <textarea
                          id="cover-note"
                          className={`${textareaClass} min-h-[100px] resize-none bg-surface-low`}
                          placeholder="Highlight relevant Java performance work, open-source repositories, or distributed system experience..."
                          rows={3}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <button className={buttonClass('primary', 'h-11 w-full text-headline-sm')} onClick={onApply}>
                          <span>Submit Application</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                        <button className={buttonClass('secondary', 'h-10 w-full')} onClick={() => setShowApply(false)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <p className="mb-0 mt-4 text-center text-label-sm text-outline-strong">
                    By applying, you agree to automatic evaluation engine processing and skill verification telemetry.
                  </p>
                </Card>
              )}

              {/* Employer / Point of Contact Card */}
              <Card className="rounded-[0.5rem] p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-mid">
                      <span className="material-symbols-outlined text-[22px] text-ink-variant">person</span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-headline-sm font-semibold text-ink">{jobDetail.employerName}</span>
                      {jobDetail.employerEmail && (
                        <a href={`mailto:${jobDetail.employerEmail}`} className="truncate text-label-sm text-primary no-underline hover:underline">
                          {jobDetail.employerEmail}
                        </a>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/employers/${jobDetail.employerId}/reviews`}
                    className="inline-flex items-center gap-1 text-body-md text-primary no-underline hover:underline"
                  >
                    See employer reviews
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobDetailPage;
