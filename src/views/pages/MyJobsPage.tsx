import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import { APPLICATION_STATUS_LABELS, Application, JOB_STATUS_LABELS, JobSummary } from '../../models/Program.model';
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

// Type definitions for job statistics
interface JobStats {
  totalJobs: number;
  pendingApproval: number;
  approvedActive: number;
  totalCandidates: number;
  openJobs: number;
  closedJobs: number;
}

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
  
  // New filter states
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'rejected' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [hiringFilter, setHiringFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Calculate statistics
  const stats: JobStats = React.useMemo(() => {
    const jobs = myJobs?.content ?? [];
    return {
      totalJobs: jobs.length,
      pendingApproval: jobs.filter(j => j.status === 'PENDING_APPROVAL').length,
      approvedActive: jobs.filter(j => j.status === 'OPEN').length,
      openJobs: jobs.filter(j => j.status === 'OPEN').length,
      closedJobs: jobs.filter(j => j.status === 'CLOSED' || j.status === 'DRAFT').length,
      totalCandidates: jobs.reduce((sum, j) => sum + (j.candidateCount || 0), 0),
    };
  }, [myJobs]);

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
    <div className="bg-background min-h-screen">
      {loading && <LoadingState label="Đang tải…" />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* TOP HEADER / ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-6 pt-16">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-headline-lg text-ink tracking-tight">Quản lý tin tuyển dụng (JD)</h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Tuyển dụng chủ động
            </span>
          </div>
          <p className="m-0 text-body-md text-ink-variant">Tạo mới, theo dõi trạng thái kiểm duyệt từ Quản trị viên và quản lý đóng/mở nhận hồ sơ</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button className={`${buttonClass('ghost')} px-4 h-10 flex items-center gap-2 font-label-lg text-label-lg shadow-sm`} type="button">
            <span className="material-symbols-outlined text-[18px] text-outline">download</span>
            Xuất báo cáo Excel
          </button>
          <button className={`${buttonClass('ghost')} px-4 h-10 flex items-center gap-2 font-label-lg text-label-lg shadow-sm`} type="button">
            <span className="material-symbols-outlined text-[18px] text-outline">tune</span>
            Lọc nhanh
          </button>
          <Link to="/jobs/new" className={`${buttonClass('primary', 'no-underline')} px-4 h-10 flex items-center gap-2 font-label-lg text-label-lg shadow-md shadow-primary/20`}>
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tạo JD mới
          </Link>
        </div>
      </div>

      {/* METRICS OVERVIEW (BENTO ROW) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-4 mb-4">
        {/* Card 1: Tổng số JD */}
        <div className="bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-ink-variant uppercase tracking-wider">Tổng số JD</span>
            <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">article</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-ink">{stats.totalJobs}</span>
            <span className="font-body-sm text-body-sm text-ink-variant">tin đăng</span>
          </div>
          <div className="mt-2 pt-2 flex items-center justify-between text-body-sm text-ink-variant">
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> {stats.openJobs} đang mở
            </span>
            <span className="text-outline font-label-sm text-label-sm">{stats.closedJobs} tạm đóng</span>
          </div>
        </div>

        {/* Card 2: Chờ phê duyệt */}
        <div className="bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-ink-variant uppercase tracking-wider">Chờ phê duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-surface-mid flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-tertiary">{stats.pendingApproval}</span>
            <span className="font-body-sm text-body-sm text-ink-variant">yêu cầu</span>
          </div>
          <div className="mt-2 pt-2 flex items-center gap-1 text-body-sm text-outline">
            <span className="material-symbols-outlined text-[15px] text-tertiary">smart_toy</span>
            <span className="font-body-sm text-body-sm">Đang được AI &amp; Admin thẩm định</span>
          </div>
        </div>

        {/* Card 3: Đã duyệt & Đang chạy */}
        <div className="bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-ink-variant uppercase tracking-wider">Đã duyệt &amp; Đang chạy</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-secondary">{stats.approvedActive}</span>
            <span className="font-body-sm text-body-sm text-ink-variant">chiến dịch</span>
          </div>
          <div className="mt-2 pt-2 flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[15px]">trending_up</span>
            <span>Tỷ lệ tiếp cận ứng viên +18%</span>
          </div>
        </div>

        {/* Card 4: Tổng ứng viên nộp */}
        <div className="bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-ink-variant uppercase tracking-wider">Tổng ứng viên nộp</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display-sm text-display-sm text-ink">{stats.totalCandidates}</span>
            <span className="font-body-sm text-body-sm text-ink-variant">hồ sơ</span>
          </div>
          <div className="mt-2 pt-2 flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[15px]">flash_on</span>
            <span>+28 ứng viên mới hôm nay</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-card rounded-xl p-4 shadow-sm flex flex-col gap-4 mb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 shadow-sm ${activeTab === 'all' ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'} transition-all`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{stats.totalJobs}</span>
          </button>
          <button 
            onClick={() => setActiveTab('open')}
            className={`px-4 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 ${activeTab === 'open' ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'} transition-all`}
          >
            <span>Đang mở</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-mid text-[10px] text-ink">{stats.openJobs}</span>
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 ${activeTab === 'pending' ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'} transition-all`}
          >
            <span>Chờ duyệt</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-mid text-[10px] text-ink">{stats.pendingApproval}</span>
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 ${activeTab === 'rejected' ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'} transition-all`}
          >
            <span>Bị từ chối</span>
            <span className="px-1.5 py-0.2 rounded-full bg-error-container text-error text-[10px]">0</span>
          </button>
          <button 
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 ${activeTab === 'draft' ? 'bg-primary-container text-on-primary' : 'text-ink-variant hover:bg-surface-low hover:text-ink'} transition-all`}
          >
            <span>Lưu nháp</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-mid text-[10px] text-ink">{myJobs?.content.filter(j => j.status === 'DRAFT').length}</span>
          </button>
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <div className="md:col-span-6 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-low text-ink placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
              placeholder="Tìm kiếm theo tiêu đề vị trí, mã JD, người phụ trách..." 
              type="text"
            />
          </div>
          <div className="md:col-span-2">
            <select 
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-low text-ink font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Trạng thái duyệt: Tất cả</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select 
              value={hiringFilter}
              onChange={(e) => setHiringFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-low text-ink font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Trạng thái tuyển: Tất cả</option>
              <option value="open">Đang mở nhận hồ sơ</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-low text-ink font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Ngành nghề: Tất cả</option>
              <option value="it">Công nghệ thông tin</option>
              <option value="product">Khối Sản phẩm</option>
              <option value="marketing">Marketing &amp; Sales</option>
              <option value="design">Thiết kế UI/UX</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE OF JDS */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-low/70 text-ink-variant font-label-md text-label-md">
                <th className="py-3 px-4 font-semibold">Tiêu đề vị trí &amp; Phòng ban</th>
                <th className="py-3 px-3 font-semibold">Ngày tạo &amp; Cập nhật</th>
                <th className="py-3 px-3 font-semibold">Ngành &amp; Cấp bậc</th>
                <th className="py-3 px-3 font-semibold">Kiểm duyệt</th>
                <th className="py-3 px-3 font-semibold">Nhận hồ sơ</th>
                <th className="py-3 px-3 font-semibold">Ứng viên</th>
                <th className="py-3 px-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low">
          </button>
        </div>
      )}

      {selectedJob && applications && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
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
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('SCHEDULED')}>Duyệt &amp; xếp lịch</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                {evalApp.status === 'SCHEDULED' && (
                  <>
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('INTERVIEWED')}>Đã phỏng vấn</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                {evalApp.status === 'INTERVIEWED' && (
                  <>
                    <button className={buttonClass('primary')} onClick={() => submitEvaluate('ACCEPTED')}>Trúng tuyển</button>
                    <button className={buttonClass('danger')} onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                <button className={buttonClass('ghost')} onClick={() => setEvalApp(null)}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedJob && suggestions.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-surface-low p-4 shadow-card">
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
