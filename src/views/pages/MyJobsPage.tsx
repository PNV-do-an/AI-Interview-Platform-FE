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
 * `my-jobs` không có endpoint thống kê riêng (khác màn admin), nên thẻ số liệu, tab lọc và
 * bảng cùng tính từ một lần tải danh sách.
 */
const LOAD_ALL_SIZE = 100;

type JobTab = 'all' | 'open' | 'pending' | 'revisions' | 'draft';

const searchNormalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatJobDate = (value: string) => {
  const date = parseServerTimestamp(value);
  return date ? date.toLocaleDateString('vi-VN') : '—';
};

const tabButtonClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-label-md text-label-md transition-colors ${
    active ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'
  }`;

const TabCount: React.FC<{ value: number; tone?: string }> = ({ value, tone = 'bg-surface-mid text-ink' }) => (
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
  <div className="flex flex-col justify-between rounded-xl bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="font-label-md text-label-md uppercase tracking-wider text-ink-variant">{label}</span>
      <span className="material-symbols-outlined text-[20px] text-outline">{icon}</span>
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className={`font-display-sm text-display-sm ${valueClass}`}>{value}</span>
      <span className="font-body-sm text-body-sm text-ink-variant">{unit}</span>
    </div>
    <div className="mt-2 pt-2 text-body-sm text-ink-variant">{footer}</div>
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
          <h1 className="m-0 text-headline-lg text-ink">Quản lý tin tuyển dụng (JD)</h1>
          <p className="m-0 text-body-md text-ink-variant">
            Tạo mới, theo dõi trạng thái kiểm duyệt của quản trị viên và đóng/mở nhận hồ sơ
          </p>
        </div>
        <Link
          to="/jobs/new"
          className={`${buttonClass('primary', 'no-underline')} flex h-10 shrink-0 items-center gap-2 px-4`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tạo JD mới
        </Link>
      </div>

      {loading && <LoadingState label="Đang tải…" />}
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
          label="Tổng số JD"
          icon="article"
          value={stats.total}
          unit="tin đăng"
          valueClass="text-ink"
          footer={(
            <span className="flex items-center justify-between">
              <span>{stats.open} đang mở</span>
              <span className="text-outline">{stats.closed} tạm đóng</span>
            </span>
          )}
        />
        <StatCard
          label="Chờ phê duyệt"
          icon="hourglass_top"
          value={stats.pending}
          unit="yêu cầu"
          valueClass="text-tertiary"
          footer={<span>Đang chờ quản trị viên xét duyệt</span>}
        />
        <StatCard
          label="Đã duyệt & đang mở"
          icon="verified"
          value={stats.open}
          unit="tin công khai"
          valueClass="text-secondary"
          footer={<span>Ứng viên có thể nộp hồ sơ</span>}
        />
        <StatCard
          label="Bản nháp"
          icon="edit_note"
          value={stats.draft}
          unit="tin nháp"
          valueClass="text-ink"
          footer={<span>{stats.needsRevision} tin bị trả lại, cần chỉnh sửa</span>}
        />
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button type="button" className={tabButtonClass(activeTab === 'all')} onClick={() => setActiveTab('all')}>
            <span>Tất cả</span>
            <TabCount value={stats.total} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'open')} onClick={() => setActiveTab('open')}>
            <span>Đang mở</span>
            <TabCount value={stats.open} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
            <span>Chờ duyệt</span>
            <TabCount value={stats.pending} />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'revisions')} onClick={() => setActiveTab('revisions')}>
            <span>Cần chỉnh sửa</span>
            <TabCount value={stats.needsRevision} tone="bg-error-container text-on-error-container" />
          </button>
          <button type="button" className={tabButtonClass(activeTab === 'draft')} onClick={() => setActiveTab('draft')}>
            <span>Lưu nháp</span>
            <TabCount value={stats.draft} />
          </button>
        </div>

        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Tìm theo tiêu đề, công ty, địa điểm hoặc người phụ trách…"
            type="text"
            aria-label="Tìm tin tuyển dụng"
          />
        </div>
      </div>

      {/* TABLE OF JDs */}
      {!loading && jobs.length === 0 ? (
        <EmptyState
          icon="work"
          title="Chưa có tin tuyển dụng nào"
          description="Bấm “Tạo JD mới” để đi qua wizard 4 bước; bản nháp được lưu tự động."
          action={(
            <Link to="/jobs/new" className={buttonClass('primary', 'no-underline')}>Tạo JD mới</Link>
          )}
        />
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-low font-label-md text-label-md text-ink-variant">
                  <th className="px-4 py-3 font-semibold">Tiêu đề vị trí &amp; Công ty</th>
                  <th className="px-3 py-3 font-semibold">Địa điểm &amp; Mức lương</th>
                  <th className="px-3 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-3 py-3 font-semibold">Kiểm duyệt</th>
                  <th className="px-4 py-3 text-right font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => {
                  const reviewNote = job.status === 'DRAFT' ? reviewNotes[job.id] : undefined;
                  const inPipeline = job.status === 'OPEN' || job.status === 'CLOSED';
                  return (
                    <tr key={job.id} className="hover:bg-surface-low/60">
                      <td className={tdClass}>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="max-w-md truncate font-label-md text-label-md text-ink no-underline hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          <span className="text-body-sm text-ink-variant">{job.companyName}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-body-sm text-ink">{job.location || '—'}</span>
                          <span className="text-body-sm text-ink-variant">{job.salaryRange || 'Chưa ghi mức lương'}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span className="text-body-sm text-ink-variant">{formatJobDate(job.createdAt)}</span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
                          {reviewNote && (
                            <span className="max-w-xs text-body-sm text-[#92400e]">
                              <span className="font-label-sm text-label-sm">Quản trị viên trả lại: </span>
                              <span className="whitespace-pre-wrap">{reviewNote}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Link to={`/jobs/${job.id}`} className={`${rowButtonClass} no-underline`}>Xem</Link>
                          {job.status !== 'PENDING_APPROVAL' && (
                            <Link to={`/jobs/${job.id}/edit`} className={`${rowButtonClass} no-underline`}>Sửa</Link>
                          )}
                          {inPipeline && (
                            <>
                              <button type="button" className={rowButtonClass} onClick={() => void openApplications(job)}>
                                Đơn ứng tuyển
                              </button>
                              <button type="button" className={rowButtonClass} onClick={() => void openSuggestions(job)}>
                                Ứng viên gợi ý
                              </button>
                              <button type="button" className={rowButtonClass} onClick={() => void toggleStatus(job)}>
                                {job.status === 'OPEN' ? 'Đóng tin' : 'Mở lại'}
                              </button>
                            </>
                          )}
                          {job.status !== 'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              className={`${buttonClass('danger')} h-8 px-2 text-label-sm`}
                              onClick={() => setPendingDelete(job)}
                            >
                              Xoá
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
            <p className="m-0 px-4 py-6 text-body-md text-ink-variant">Không có tin nào khớp bộ lọc hiện tại.</p>
          )}
        </div>
      )}

      {selectedJob && applications && (
        <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-ink">Đơn ứng tuyển cho: {selectedJob.title}</h3>
          {applications.content.length === 0 && (
            <p className="m-0 text-body-sm text-ink-variant">Chưa có đơn ứng tuyển nào.</p>
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
                  Đã đặt: {new Date(app.slot.startTime).toLocaleString('vi-VN')}
                </p>
              )}
              {app.feedback && <p className="m-0 text-body-sm text-ink">Góp ý: {app.feedback}</p>}
              {(app.status === 'PENDING' || app.status === 'SCHEDULED' || app.status === 'INTERVIEWED') && (
                <div className="pt-2">
                  <button
                    type="button"
                    className={buttonClass('secondary')}
                    onClick={() => { setEvalApp(app); setScore(app.score?.toString() ?? ''); setFeedback(app.feedback ?? ''); }}
                  >
                    {app.status === 'INTERVIEWED' ? 'Đánh giá & cho điểm' : 'Cập nhật trạng thái'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {evalApp && (
            <div className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-card p-4">
              <h4 className="m-0 text-headline-sm text-ink">Đánh giá: {evalApp.candidateName}</h4>
              <div>
                <label className={labelClass}>Điểm (0-100)</label>
                <input
                  type="number" min={0} max={100} value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className={`${inputClass} w-[120px]`}
                />
              </div>
              <div>
                <label className={labelClass}>Góp ý</label>
                <textarea
                  value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {evalApp.status === 'PENDING' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('SCHEDULED')}>Duyệt &amp; xếp lịch</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                {evalApp.status === 'SCHEDULED' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('INTERVIEWED')}>Đã phỏng vấn</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                {evalApp.status === 'INTERVIEWED' && (
                  <>
                    <button type="button" className={buttonClass('primary')} onClick={() => submitEvaluate('ACCEPTED')}>Trúng tuyển</button>
                    <button type="button" className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                <button type="button" className={buttonClass('ghost')} onClick={() => setEvalApp(null)}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedJob && suggestions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
          <h3 className="m-0 text-headline-md text-ink">Ứng viên gợi ý cho: {selectedJob.title}</h3>
          {suggestions.map((m) => (
            <div key={m.candidateId} className="flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-headline-sm text-ink">{m.fullName}</strong>
                <span className="text-metric-stat text-primary">Khớp {m.matchScore}%</span>
              </div>
              <p className="m-0 text-body-sm text-ink-variant">{m.email}</p>
              <p className="m-0 text-body-sm text-ink">Kỹ năng khớp: {m.matchedSkills.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Xoá tin tuyển dụng này?"
        message={pendingDelete ? `"${pendingDelete.title}" sẽ bị gỡ khỏi danh sách của bạn. Không thể hoàn tác.` : ''}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default MyJobsPage;
