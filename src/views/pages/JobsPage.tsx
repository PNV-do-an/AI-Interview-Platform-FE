import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobController } from '../../controllers/useJobController';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  buttonClass,
  inputClass,
  tdClass,
} from '../components/ui';

const JobsPage: React.FC = () => {
  const { jobs, loading, error, fetchJobs } = useJobController();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { fetchJobs(page, search); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchJobs(0, search);
  };

  return (
    <div>
      <PageHeader title="Bảng tin tuyển dụng" description="Các tin đang mở cho ứng viên" />

      <form className="mb-4 flex gap-2" onSubmit={onSearch}>
        <input
          className={inputClass}
          placeholder="Tìm theo chức danh, công ty, vị trí hoặc địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className={buttonClass('primary', 'shrink-0')}>Tìm</button>
      </form>

      <ErrorBanner message={error} />
      {loading && <LoadingState label="Đang tải…" />}

      {!loading && jobs && jobs.content.length === 0 && (
        <EmptyState
          icon="work"
          title="Chưa có tin tuyển dụng nào"
          description="Thử từ khoá tìm kiếm khác."
        />
      )}

      {!loading && jobs && jobs.content.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-card">
          {jobs.content.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-4 no-underline last:border-b-0 transition-colors hover:bg-surface-low"
            >
              <span className="flex min-w-0 flex-col py-3">
                <span className="truncate text-headline-sm text-ink">{job.title}</span>
                <span className="truncate text-body-sm text-ink-variant">
                  {job.companyName}
                  {job.location ? ` · ${job.location}` : ''}
                  {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                </span>
              </span>
              <span className="material-symbols-outlined shrink-0 text-[18px] text-ink-variant">chevron_right</span>
            </Link>
          ))}
        </div>
      )}

      {jobs && jobs.totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <button className={buttonClass('secondary')} disabled={page === 0} onClick={() => setPage(page - 1)}>
            Trước
          </button>
          <span className={tdClass}>Trang {jobs.number + 1} / {jobs.totalPages}</span>
          <button className={buttonClass('secondary')} disabled={page >= jobs.totalPages - 1} onClick={() => setPage(page + 1)}>
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
