import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import {
  APPLICATION_STATUS_LABELS,
  Application,
  JOB_STATUS_LABELS,
  JobSummary,
} from '../../models/Program.model';
import { parseServerTimestamp } from '../../utils/date';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  StatusBadge,
  buttonClass,
  inputClass,
  labelClass,
  tdClass,
} from '../components/ui';

const textareaClass = `${inputClass.replace('h-9', 'py-2')} min-h-[80px] resize-y`;

/**
 * `my-jobs` khÃ´ng cÃ³ endpoint thá»‘ng kÃª riÃªng (khÃ¡c mÃ n admin), nÃªn tháº» sá»‘ liá»‡u, tab lá»c vÃ 
 * báº£ng cÃ¹ng tÃ­nh tá»« má»™t láº§n táº£i danh sÃ¡ch.
 */
const LOAD_ALL_SIZE = 100;

type JobTab = 'all' | 'open' | 'pending' | 'revisions' | 'draft';

const searchNormalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatJobDate = (value: string) => {
  const date = parseServerTimestamp(value);
  return date ? date.toLocaleDateString('vi-VN') : 'â€”';
};

const tabButtonClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-label-md text-label-md transition-colors ${
    active ? 'bg-indigo-600 text-on-primary' : 'text-slate-900-variant hover:bg-slate-50 hover:text-slate-900'
  }`;

const TabCount: React.FC<{ value: number; tone?: string }> = ({ value, tone = 'bg-slate-100 text-slate-900' }) => (
  <span className={`rounded-full px-1.5 text-[10px] ${tone}`}>{value}</span>
);

const StatCard: React.FC<{
  label: string;
  icon: string;
  value: number;
  unit: string;
  valueClass: string;
  footer: React.ReactNode;
}> = ({ label, icon, value, unit, valueClass, footer }) => (
  <div className="flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="font-label-md text-label-md uppercase tracking-wider text-slate-900-variant">{label}</span>
      <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className={`font-display-sm text-display-sm ${valueClass}`}>{value}</span>
      <span className="font-body-sm text-body-sm text-slate-900-variant">{unit}</span>
    </div>
    <div className="mt-2 pt-2 text-body-sm text-slate-900-variant">{footer}</div>
  </div>
);

const MyJobsPage: React.FC = () => {
  const {
    myJobs, applications, suggestions, loading, error, successMsg,
    fetchMyJobs, changeStatus, deleteJob, fetchApplications, fetchSuggestions, fetchReviewNotes, evaluate,
  } = useEmployerJobController();

  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [evalApp, setEvalApp] = useState<Application | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [pendingDelete, setPendingDelete] = useState<JobSummary | null>(null);
  const [activeTab, setActiveTab] = useState<JobTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyJobs(0, LOAD_ALL_SIZE);
  }, [fetchMyJobs]);

  const jobs = useMemo(() => myJobs?.content ?? [], [myJobs]);

  useEffect(() => {
    const draftIds = jobs.filter((job) => job.status === 'DRAFT').map((job) => job.id);
    if (draftIds.length === 0) {
      setReviewNotes({});
      return undefined;
    }
    let cancelled = false;
    fetchReviewNotes(draftIds).then((notes) => {
      if (!cancelled) setReviewNotes(notes);
    });
    return () => { cancelled = true; };
  }, [jobs, fetchReviewNotes]);

  const stats = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter((job) => job.status === 'OPEN').length,
    closed: jobs.filter((job) => job.status === 'CLOSED').length,
    pending: jobs.filter((job) => job.status === 'PENDING_APPROVAL').length,
    draft: jobs.filter((job) => job.status === 'DRAFT').length,
    needsRevision: jobs.filter((job) => job.status === 'DRAFT' && reviewNotes[job.id]).length,
  }), [jobs, reviewNotes]);

  const visibleJobs = useMemo(() => {
    const q = searchNormalize(searchQuery.trim());
    return jobs.filter((job) => {
      const matchesTab =
        activeTab === 'all'
        || (activeTab === 'open' && job.status === 'OPEN')
        || (activeTab === 'pending' && job.status === 'PENDING_APPROVAL')
        || (activeTab === 'draft' && job.status === 'DRAFT')
        || (activeTab === 'revisions' && job.status === 'DRAFT' && Boolean(reviewNotes[job.id]));
      if (!matchesTab) return false;
      if (!q) return true;
      return [job.title, job.companyName, job.position, job.location, job.employerName]
        .some((part) => searchNormalize(part ?? '').includes(q));
    });
  }, [jobs, activeTab, searchQuery, reviewNotes]);

  const reload = () => fetchMyJobs(0, LOAD_ALL_SIZE);

  const toggleStatus = async (job: JobSummary) => {
    const ok = await changeStatus(job.id, job.status === 'OPEN' ? 'CLOSED' : 'OPEN');
    if (ok) await reload();
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await deleteJob(id);
    await reload();
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

  const rowButtonClass = `${buttonClass('ghost')} h-8 px-2 text-label-sm`;

  return (
    <div className="flex flex-col gap-4">
      {/* TOP HEADER / ACTION BAR */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-headline-lg text-slate-900">Quáº£n lÃ½ tin tuyá»ƒn dá»¥ng (JD)</h1>
          <p className="m-0 text-body-md text-slate-900-variant">
            Táº¡o má»›i, theo dÃµi tráº¡ng thÃ¡i kiá»ƒm duyá»‡t cá»§a quáº£n trá»‹ viÃªn vÃ  Ä‘Ã³ng/má»Ÿ nháº­n há»“ sÆ¡
          </p>
        </div>
        <Link
          to="/jobs/new"
          className={`${buttonClass('primary', 'no-underline')} flex h-10 shrink-0 items-center gap-2 px-4`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Táº¡o JD má»›i
        </Link>
      </div>

      {loading && <LoadingState label="Äang táº£iâ€¦" />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tá»•ng sá»‘ JD"
          icon="article"
          value={stats.total}
          unit="tin Ä‘Äƒng"
          valueClass="text-slate-900"
          footer={(
            <span className="flex items-center justify-between">
              <span>{stats.open} Ä‘ang má»Ÿ</span>
              <span className="text-slate-400">{stats.closed} táº¡m Ä‘Ã³ng</span>
            </span>
          )}
        />
        <StatCard
          label="Chá» phÃª duyá»‡t"
          icon="hourglass_top"
          value={stats.pending}
          unit="yÃªu cáº§u"
          valueClass="text-blue-700"
          footer={<span>Äang chá» quáº£n trá»‹ viÃªn xÃ©t duyá»‡t</span>}
        />
        <StatCard
          label="ÄÃ£ duyá»‡t & Ä‘ang má»Ÿ"
          icon="verified"
          value={stats.open}
          unit="tin cÃ´ng khai"
          valueClass="text-secondary"
          footer={<span>á»¨ng viÃªn cÃ³ thá»ƒ ná»™p há»“ sÆ¡</span>}
        />
        <StatCard
          label="Báº£n nhÃ¡p"
          icon="edit_note"
          value={stats.draft}
          unit="tin nhÃ¡p"
          valueClass="text-slate-900"
          footer={<span>{stats.needsRevision} tin bá»‹ tráº£ láº¡i, cáº§n chá»‰nh sá»­a</span>}
        />
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button type="button" className={tabButtonClass(activeTab === 'all')} onClick={() => setActiveTab('all')}>
            <span>Táº¥t cáº£</span>
            <TabCount value={stats.total} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'open')} onClick={() => setActiveTab('open')}>
            <span>Äang má»Ÿ</span>
            <TabCount value={stats.open} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
            <span>Chá» duyá»‡t</span>
            <TabCount value={stats.pending} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'revisions')} onClick={() => setActiveTab('revisions')}>
            <span>Cáº§n chá»‰nh sá»­a</span>
            <TabCount value={stats.needsRevision} tone="bg-red-100 text-red-700" />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'draft')} onClick={() => setActiveTab('draft')}>
            <span>LÆ°u nhÃ¡p</span>
            <TabCount value={stats.draft} />
          </button>
        </div>

        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="TÃ¬m theo tiÃªu Ä‘á», cÃ´ng ty, Ä‘á»‹a Ä‘iá»ƒm hoáº·c ngÆ°á»i phá»¥ trÃ¡châ€¦"
            type="text"
            aria-label="TÃ¬m tin tuyá»ƒn dá»¥ng"
          />
        </div>
      </div>

      {/* TABLE OF JDs */}
      {!loading && jobs.length === 0 ? (
        <EmptyState
          icon="work"
          title="ChÆ°a cÃ³ tin tuyá»ƒn dá»¥ng nÃ o"
          description="Báº¥m â€œTáº¡o JD má»›iâ€ Ä‘á»ƒ Ä‘i qua wizard 4 bÆ°á»›c; báº£n nhÃ¡p Ä‘Æ°á»£c lÆ°u tá»± Ä‘á»™ng."
          action={(
            <Link to="/jobs/new" className={buttonClass('primary', 'no-underline')}>Táº¡o JD má»›i</Link>
          )}
        />
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 font-label-md text-label-md text-slate-900-variant">
                  <th className="px-4 py-3 font-semibold">TiÃªu Ä‘á» vá»‹ trÃ­ &amp; CÃ´ng ty</th>
                  <th className="px-3 py-3 font-semibold">Äá»‹a Ä‘iá»ƒm &amp; Má»©c lÆ°Æ¡ng</th>
                  <th className="px-3 py-3 font-semibold">NgÃ y táº¡o</th>
                  <th className="px-3 py-3 font-semibold">Kiá»ƒm duyá»‡t</th>
                  <th className="px-4 py-3 text-right font-semibold">HÃ nh Ä‘á»™ng</th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => {
                  const reviewNote = job.status === 'DRAFT' ? reviewNotes[job.id] : undefined;
                  const inPipeline = job.status === 'OPEN' || job.status === 'CLOSED';
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60">
                      <td className={tdClass}>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="max-w-md truncate font-label-md text-label-md text-slate-900 no-underline hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          <span className="text-body-sm text-slate-900-variant">{job.companyName}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-body-sm text-slate-900">{job.location || 'â€”'}</span>
                          <span className="text-body-sm text-slate-900-variant">{job.salaryRange || 'ChÆ°a ghi má»©c lÆ°Æ¡ng'}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span className="text-body-sm text-slate-900-variant">{formatJobDate(job.createdAt)}</span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
                          {reviewNote && (
                            <span className="max-w-xs text-body-sm text-[#92400e]">
                              <span className="font-label-sm text-label-sm">Quáº£n trá»‹ viÃªn tráº£ láº¡i: </span>
                              <span className="whitespace-pre-wrap">{reviewNote}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Link to={`/jobs/${job.id}`} className={`${rowButtonClass} no-underline`}>Xem</Link>
                          {job.status !== 'PENDING_APPROVAL' && (
                            <Link to={`/jobs/${job.id}/edit`} className={`${rowButtonClass} no-underline`}>Sá»­a</Link>
                          )}
                          {inPipeline && (
                            <>
                              <button type="button" className={rowButtonClass} onClick={() => void openApplications(job)}>
                                ÄÆ¡n á»©ng tuyá»ƒn
                              </button>
                              <button type="button" className={rowButtonClass} onClick={() => void openSuggestions(job)}>
                                á»¨ng viÃªn gá»£i Ã½
                              </button>
                              <button type="button" className={rowButtonClass} onClick={() => void toggleStatus(job)}>
                                {job.status === 'OPEN' ? 'ÄÃ³ng tin' : 'Má»Ÿ láº¡i'}
                              </button>
                            </>
                          )}
                          {job.status !== 'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              className={`${buttonClass('danger')} h-8 px-2 text-label-sm`}
                              onClick={() => setPendingDelete(job)}
                            >
                              XoÃ¡
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {visibleJobs.length === 0 && (
            <p className="m-0 px-4 py-6 text-body-md text-slate-900-variant">KhÃ´ng cÃ³ tin nÃ o khá»›p bá»™ lá»c hiá»‡n táº¡i.</p>
          )}
        </div>
      )}

      {selectedJob && applications && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-slate-900">ÄÆ¡n á»©ng tuyá»ƒn cho: {selectedJob.title}</h3>
          {applications.content.length === 0 && (
            <p className="m-0 text-body-sm text-slate-900-variant">ChÆ°a cÃ³ Ä‘Æ¡n á»©ng tuyá»ƒn nÃ o.</p>
          )}
          {applications.content.map((app) => (
            <div key={app.id} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-slate-900">{app.candidateName}</strong>
                <StatusBadge status={app.status} label={APPLICATION_STATUS_LABELS[app.status]} />
                {app.score !== undefined && app.score !== null && (
                  <span className="text-metric-stat text-primary">{app.score}/100</span>
                )}
              </div>
              <p className="m-0 text-body-sm text-slate-900-variant">{app.candidateEmail}</p>
              {app.slot && (
                <p className="m-0 flex items-center gap-1 text-body-sm text-slate-900-variant">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                  ÄÃ£ Ä‘áº·t: {new Date(app.slot.startTime).toLocaleString('vi-VN')}
                </p>
              )}
              {app.feedback && <p className="m-0 text-body-sm text-slate-900">GÃ³p Ã½: {app.feedback}</p>}
              {(app.status === 'PENDING' || app.status === 'SCHEDULED' || app.status === 'INTERVIEWED') && (
                <div className="pt-2">
                  <button
                    type="button"
                    className={buttonClass('secondary')}
                    onClick={() => { setEvalApp(app); setScore(app.score?.toString() ?? ''); setFeedback(app.feedback ?? ''); }}
                  >
                    {app.status === 'INTERVIEWED' ? 'ÄÃ¡nh giÃ¡ & cho Ä‘iá»ƒm' : 'Cáº­p nháº­t tráº¡ng thÃ¡i'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {evalApp && (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="m-0 text-headline-sm text-slate-900">ÄÃ¡nh giÃ¡: {evalApp.candidateName}</h4>
              <div>
                <label className={labelClass}>Äiá»ƒm (0-100)</label>
                <input
                  type="number" min={0} max={100} value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className={`${inputClass} w-[120px]`}
                />
              </div>
              <div>
                <label className={labelClass}>GÃ³p Ã½</label>
                <textarea
                  value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {evalApp.status === 'PENDING' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('SCHEDULED')}>Duyá»‡t &amp; xáº¿p lá»‹ch</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>KhÃ´ng Ä‘áº¡t</button>
                  </>
                )}
                {evalApp.status === 'SCHEDULED' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('INTERVIEWED')}>ÄÃ£ phá»ng váº¥n</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>KhÃ´ng Ä‘áº¡t</button>
                  </>
                )}
                {evalApp.status === 'INTERVIEWED' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('ACCEPTED')}>TrÃºng tuyá»ƒn</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>KhÃ´ng Ä‘áº¡t</button>
                  </>
                )}
                <button type="button" className={buttonClass('ghost')} onClick={() => setEvalApp(null)}>ÄÃ³ng</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedJob && suggestions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-slate-900">á»¨ng viÃªn gá»£i Ã½ cho: {selectedJob.title}</h3>
          {suggestions.map((m) => (
            <div key={m.candidateId} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-slate-900">{m.fullName}</strong>
                <span className="text-metric-stat text-primary">Khá»›p {m.matchScore}%</span>
              </div>
              <p className="m-0 text-body-sm text-slate-900-variant">{m.email}</p>
              <p className="m-0 text-body-sm text-slate-900">Ká»¹ nÄƒng khá»›p: {m.matchedSkills.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="XoÃ¡ tin tuyá»ƒn dá»¥ng nÃ y?"
        message={pendingDelete ? `"${pendingDelete.title}" sáº½ bá»‹ gá»¡ khá»i danh sÃ¡ch cá»§a báº¡n. KhÃ´ng thá»ƒ hoÃ n tÃ¡c.` : ''}
        confirmLabel="XoÃ¡"
        cancelLabel="Huá»·"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default MyJobsPage;

