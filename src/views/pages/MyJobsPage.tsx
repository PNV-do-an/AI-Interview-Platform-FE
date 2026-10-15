import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import { APPLICATION_STATUS_LABELS, Application, JobSummary } from '../../models/Program.model';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 960, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  field: { marginBottom: 12 },
  score: { fontWeight: 700, color: '#2563eb' },
};

const badgeStyle = (open: boolean): React.CSSProperties => ({
  padding: '2px 8px', borderRadius: 4, fontSize: 12,
  background: open ? '#dcfce7' : '#fee2e2', color: open ? '#166534' : '#991b1b',
});

const MyJobsPage: React.FC = () => {
  const {
    myJobs, applications, suggestions, loading, error, successMsg,
    fetchMyJobs, changeStatus, deleteJob, fetchApplications, fetchSuggestions, evaluate,
  } = useEmployerJobController();

  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [evalApp, setEvalApp] = useState<Application | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => { fetchMyJobs(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div style={styles.page}>
      <div style={styles.row}>
        <h2 style={{ flex: 1 }}>Tin tuyển dụng của tôi</h2>
        <Link to="/jobs/new"><button>+ Đăng tin mới</button></Link>
        <Link to="/my-slots"><button>Quản lý lịch trống</button></Link>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {myJobs?.content.map((job) => (
        <div key={job.id} style={styles.card}>
          <div style={styles.row}>
            <strong style={{ flex: 1 }}>{job.title}</strong>
            <span style={badgeStyle(job.status === 'OPEN')}>
              {job.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
            </span>
          </div>
          <p style={{ color: '#6b7280' }}>{job.companyName}</p>
          <div style={{ ...styles.row, marginTop: 8 }}>
            <Link to={`/jobs/${job.id}`}>Xem</Link>
            <Link to={`/jobs/${job.id}/edit`}>Sửa</Link>
            <button onClick={() => openApplications(job)}>Ứng viên</button>
            <button onClick={() => openSuggestions(job)}>Gợi ý phù hợp</button>
            <button onClick={() => changeStatus(job.id, job.status === 'OPEN' ? 'CLOSED' : 'OPEN')}>
              {job.status === 'OPEN' ? 'Đóng tin' : 'Mở lại'}
            </button>
            <button onClick={() => { if (window.confirm('Xóa tin này?')) deleteJob(job.id).then(() => fetchMyJobs(page)); }}>
              Xóa
            </button>
          </div>
        </div>
      ))}
      {myJobs && myJobs.content.length === 0 && !loading && <p>Bạn chưa đăng tin nào.</p>}

      {myJobs && myJobs.totalPages > 1 && (
        <div style={styles.row}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {myJobs.number + 1} / {myJobs.totalPages}</span>
          <button disabled={page >= myJobs.totalPages - 1} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}

      {selectedJob && applications && (
        <div style={{ ...styles.card, marginTop: 24, background: '#f9fafb' }}>
          <h3>Ứng viên của: {selectedJob.title}</h3>
          {applications.content.length === 0 && <p>Chưa có ứng viên nào.</p>}
          {applications.content.map((app) => (
            <div key={app.id} style={{ ...styles.card, background: '#fff' }}>
              <div style={styles.row}>
                <strong style={{ flex: 1 }}>{app.candidateName}</strong>
                <span>{APPLICATION_STATUS_LABELS[app.status]}</span>
                {app.score !== undefined && app.score !== null && (
                  <span style={styles.score}>{app.score}/100</span>
                )}
              </div>
              <p style={{ color: '#6b7280' }}>{app.candidateEmail}</p>
              {app.slot && (
                <p>Lịch hẹn: {new Date(app.slot.startTime).toLocaleString('vi-VN')}</p>
              )}
              {app.feedback && <p>Nhận xét: {app.feedback}</p>}
              {(app.status === 'PENDING' || app.status === 'SCHEDULED' || app.status === 'INTERVIEWED') && (
                <button onClick={() => { setEvalApp(app); setScore(app.score?.toString() ?? ''); setFeedback(app.feedback ?? ''); }}>
                  {app.status === 'INTERVIEWED' ? 'Chấm điểm / Kết quả' : 'Cập nhật trạng thái'}
                </button>
              )}
            </div>
          ))}

          {evalApp && (
            <div style={{ ...styles.card, background: '#fff' }}>
              <h4>Đánh giá: {evalApp.candidateName}</h4>
              <div style={styles.field}>
                <label>Điểm (0-100)</label>
                <input
                  type="number" min={0} max={100} value={score}
                  onChange={(e) => setScore(e.target.value)}
                  style={{ display: 'block', width: 120, padding: 6, marginTop: 4 }}
                />
              </div>
              <div style={styles.field}>
                <label>Nhận xét</label>
                <textarea
                  value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  style={{ display: 'block', width: '100%', minHeight: 80, padding: 6, marginTop: 4 }}
                />
              </div>
              <div style={styles.row}>
                {evalApp.status === 'PENDING' && (
                  <>
                    <button onClick={() => submitEvaluate('SCHEDULED')}>Chấp nhận & hẹn lịch</button>
                    <button onClick={() => submitEvaluate('REJECTED')}>Từ chối</button>
                  </>
                )}
                {evalApp.status === 'SCHEDULED' && (
                  <>
                    <button onClick={() => submitEvaluate('INTERVIEWED')}>Đã phỏng vấn</button>
                    <button onClick={() => submitEvaluate('REJECTED')}>Từ chối</button>
                  </>
                )}
                {evalApp.status === 'INTERVIEWED' && (
                  <>
                    <button onClick={() => submitEvaluate('ACCEPTED')}>Đạt</button>
                    <button onClick={() => submitEvaluate('REJECTED')}>Không đạt</button>
                  </>
                )}
                <button onClick={() => setEvalApp(null)}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedJob && suggestions.length > 0 && (
        <div style={{ ...styles.card, marginTop: 24, background: '#f9fafb' }}>
          <h3>Gợi ý ứng viên phù hợp: {selectedJob.title}</h3>
          {suggestions.map((m) => (
            <div key={m.candidateId} style={{ ...styles.card, background: '#fff' }}>
              <div style={styles.row}>
                <strong style={{ flex: 1 }}>{m.fullName}</strong>
                <span style={styles.score}>Phù hợp {m.matchScore}%</span>
              </div>
              <p style={{ color: '#6b7280' }}>{m.email}</p>
              <p>Kỹ năng trùng khớp: {m.matchedSkills.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 24 }}><Link to="/dashboard">← Về Dashboard</Link></p>
    </div>
  );
};

export default MyJobsPage;
