import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobController } from '../../controllers/useJobController';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 20 },
  input: { flex: 1, padding: 8 },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 },
  meta: { color: '#6b7280', fontSize: 14 },
  pager: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 },
};

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
    <div style={styles.page}>
      <h2>Chương trình phỏng vấn</h2>
      <form onSubmit={onSearch} style={styles.searchRow}>
        <input
          placeholder="Tìm theo tiêu đề, công ty, vị trí, địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
        <button type="submit">Tìm kiếm</button>
      </form>

      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {jobs?.content.map((job) => (
        <div key={job.id} style={styles.card}>
          <Link to={`/jobs/${job.id}`} style={{ fontSize: 18, fontWeight: 600 }}>
            {job.title}
          </Link>
          <p style={styles.meta}>
            {job.companyName}
            {job.location ? ` · ${job.location}` : ''}
            {job.salaryRange ? ` · ${job.salaryRange}` : ''}
          </p>
        </div>
      ))}

      {jobs && jobs.content.length === 0 && !loading && <p>Không có tin tuyển dụng nào.</p>}

      {jobs && jobs.totalPages > 1 && (
        <div style={styles.pager}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {jobs.number + 1} / {jobs.totalPages}</span>
          <button disabled={page >= jobs.totalPages - 1} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/dashboard">← Về Dashboard</Link>
      </p>
    </div>
  );
};

export default JobsPage;
