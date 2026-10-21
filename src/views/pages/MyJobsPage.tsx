import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import { APPLICATION_STATUS_LABELS, Application, JOB_STATUS_LABELS, JobSummary } from '../../models/Program.model';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatusBadge,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const textareaClass = `${inputClass.replace('h-9', 'py-2')} min-h-[80px] resize-y`;

const MyJobsPage: React.FC = () => {
  const {
    myJobs, applications, suggestions, loading, error, successMsg,
    fetchMyJobs, changeStatus, deleteJob, fetchApplications, fetchSuggestions, fetchReviewNotes, evaluate,
  } = useEmployerJobController();

  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [evalApp, setEvalApp] = useState<Application | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [pendingDelete, setPendingDelete] = useState<JobSummary | null>(null);

  useEffect(() => { fetchMyJobs(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const draftIds = (myJobs?.content ?? []).filter((job) => job.status === 'DRAFT').map((job) => job.id);
    if (draftIds.length === 0) {
      setReviewNotes({});
      return;
    }
    let cancelled = false;
    fetchReviewNotes(draftIds).then((notes) => {
      if (!cancelled) setReviewNotes(notes);
    });
    return () => { cancelled = true; };
  }, [myJobs, fetchReviewNotes]);

  const toggleStatus = async (job: JobSummary) => {
    const ok = await changeStatus(job.id, job.status === 'OPEN' ? 'CLOSED' : 'OPEN');
    if (ok) await fetchMyJobs(page);
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await deleteJob(id);
    await fetchMyJobs(page);
  };

  const openApplications = async (job: JobSummary) => {
    setSelectedJob(job);
    setEvalApp(null);
    await fetchApplications(job.id);
  };

  const openSuggestions = async (job: JobSummary) => {
    setSelectedJob(job);
    setEvalApp(null);
    await fetchSuggestions(job.id);
  };

  const submitEvaluate = async (status: string) => {
    if (!evalApp) return;
    const ok = await evaluate(evalApp.id, {
      status,
      score: score ? Number(score) : undefined,
      feedback: feedback || undefined,
    });
    if (ok && selectedJob) {
      setEvalApp(null);
      setScore('');
      setFeedback('');
      await fetchApplications(selectedJob.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Job Postings"
        actions={
          <>
            <Link to="/jobs/new" className={`${buttonClass('primary', 'no-underline')}`}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Post New Job
            </Link>
            <Link to="/my-slots" className={buttonClass('secondary', 'no-underline')}>
              <span className="material-symbols-outlined text-[18px]">event</span>
              Manage Availability
            </Link>
          </>
        }
      />

      {loading && <LoadingState />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {myJobs?.content.map((job) => {
          const pipelineAvailable = job.status === 'OPEN' || job.status === 'CLOSED';
          const reviewNote = job.status === 'DRAFT' ? reviewNotes[job.id] : '';
          return (
            <div key={job.id} className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-ink">{job.title}</strong>
                <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
              </div>
              <p className="m-0 flex items-center gap-1 text-body-sm text-ink-variant">
                <span className="material-symbols-outlined text-[18px]">work</span>
                {job.companyName}
              </p>
              {reviewNote && (
                <div className="flex items-start gap-2 rounded-lg bg-[#fffbeb] px-3 py-2.5 text-body-sm text-[#92400e]" role="status">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">rate_review</span>
                  <div>
                    <strong className="block">Changes requested</strong>
                    <span className="whitespace-pre-wrap">{reviewNote}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link to={`/jobs/${job.id}`} className={buttonClass('ghost', 'no-underline')}>View</Link>
                {job.status !== 'PENDING_APPROVAL' && (
                  <Link to={`/jobs/${job.id}/edit`} className={buttonClass('ghost', 'no-underline')}>
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit
                  </Link>
                )}
                {pipelineAvailable && (
                  <>
                    <button className={buttonClass('secondary')} onClick={() => toggleStatus(job)}>
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      {job.status === 'OPEN' ? 'Close' : 'Reopen'}
                    </button>
                    <button className={buttonClass('secondary')} onClick={() => openApplications(job)}>Applicants</button>
                    <button className={buttonClass('secondary')} onClick={() => openSuggestions(job)}>Suggested Candidates</button>
                  </>
                )}
                {job.status !== 'PENDING_APPROVAL' && (
                  <button
                    className={buttonClass('danger')}
                    onClick={() => setPendingDelete(job)}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {myJobs && myJobs.content.length === 0 && !loading && (
        <EmptyState icon="work" title="No job postings yet." />
      )}

      {myJobs && myJobs.totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <button className={buttonClass('secondary')} disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="px-1 text-body-md text-ink-variant">Page {myJobs.number + 1} / {myJobs.totalPages}</span>
          <button className={buttonClass('secondary')} disabled={page >= myJobs.totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}

      {selectedJob && applications && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-ink">Applicants for: {selectedJob.title}</h3>
          {applications.content.length === 0 && (
            <p className="m-0 text-body-sm text-ink-variant">No applicants yet.</p>
          )}
          {applications.content.map((app) => (
            <div key={app.id} className="flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-ink">{app.candidateName}</strong>
                <StatusBadge status={app.status} label={APPLICATION_STATUS_LABELS[app.status]} />
                {app.score !== undefined && app.score !== null && (
                  <span className="text-metric-stat text-primary">{app.score}/100</span>
                )}
              </div>
              <p className="m-0 text-body-sm text-ink-variant">{app.candidateEmail}</p>
              {app.slot && (
                <p className="m-0 flex items-center gap-1 text-body-sm text-ink-variant">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                  Booked: {new Date(app.slot.startTime).toLocaleString('vi-VN')}
                </p>
              )}
              {app.feedback && <p className="m-0 text-body-sm text-ink">Feedback: {app.feedback}</p>}
              {(app.status === 'PENDING' || app.status === 'SCHEDULED' || app.status === 'INTERVIEWED') && (
                <div className="pt-2">
                  <button
                    className={buttonClass('secondary')}
                    onClick={() => { setEvalApp(app); setScore(app.score?.toString() ?? ''); setFeedback(app.feedback ?? ''); }}
                  >
                    {app.status === 'INTERVIEWED' ? 'Review & Grade' : 'Update Status'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {evalApp && (
            <div className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-card p-4">
              <h4 className="m-0 text-headline-sm text-ink">Evaluation: {evalApp.candidateName}</h4>
              <div>
                <label className={labelClass}>Score (0-100)</label>
                <input
                  type="number" min={0} max={100} value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className={`${inputClass} w-[120px]`}
                />
              </div>
              <div>
                <label className={labelClass}>Feedback</label>
                <textarea
                  value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {evalApp.status === 'PENDING' && (
                  <>
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('SCHEDULED')}>Accept & Schedule</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Reject</button>
                  </>
                )}
                {evalApp.status === 'SCHEDULED' && (
                  <>
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('INTERVIEWED')}>Interviewed</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Reject</button>
                  </>
                )}
                {evalApp.status === 'INTERVIEWED' && (
                  <>
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('ACCEPTED')}>Accept</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Reject</button>
                  </>
                )}
                <button className={buttonClass('ghost')} onClick={() => setEvalApp(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedJob && suggestions.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-ink">Suggested Candidates for: {selectedJob.title}</h3>
          {suggestions.map((m) => (
            <div key={m.candidateId} className="flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-ink">{m.fullName}</strong>
                <span className="text-metric-stat text-primary">{m.matchScore}% Match</span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">{m.email}</p>
              <p className="m-0 text-body-sm text-ink">Matched Skills: {m.matchedSkills.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this job posting?"
        message={pendingDelete ? `"${pendingDelete.title}" will be removed from your listings. This can't be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default MyJobsPage;
