import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 },
  meta: { color: '#6b7280' },
  section: { marginTop: 16 },
  textarea: { width: '100%', minHeight: 100, padding: 8, marginTop: 8 },
};

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

  return (
    <div style={styles.page}>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {jobDetail && (
        <div style={styles.card}>
          <h2>{jobDetail.title}</h2>
          <p style={styles.meta}>
            {jobDetail.companyName}
            {jobDetail.location ? ` · ${jobDetail.location}` : ''}
            {jobDetail.salaryRange ? ` · ${jobDetail.salaryRange}` : ''}
          </p>
          <p style={styles.meta}>Người đăng: {jobDetail.employerName}</p>
          <p style={{ ...styles.meta, marginTop: 4 }}>
            <Link to={`/employers/${jobDetail.employerId}/reviews`}>Xem đánh giá nhà tuyển dụng →</Link>
          </p>

          {jobDetail.description && (
            <div style={styles.section}>
              <h3>Mô tả công việc</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{jobDetail.description}</p>
            </div>
          )}
          {jobDetail.requirements && (
            <div style={styles.section}>
              <h3>Yêu cầu</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{jobDetail.requirements}</p>
            </div>
          )}
          {jobDetail.requiredSkills && (
            <div style={styles.section}>
              <h3>Kỹ năng yêu cầu</h3>
              <p>{jobDetail.requiredSkills}</p>
            </div>
          )}

          {isCandidate && jobDetail.status === 'OPEN' && (
            <div style={styles.section}>
              {!showApply ? (
                <button onClick={() => setShowApply(true)}>Ứng tuyển ngay</button>
              ) : (
                <>
                  <textarea
                    placeholder="Thư giới thiệu (không bắt buộc)..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    style={styles.textarea}
                  />
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={onApply}>Gửi đơn ứng tuyển</button>
                    <button onClick={() => setShowApply(false)}>Hủy</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/jobs">← Danh sách chương trình</Link>
      </p>
    </div>
  );
};

export default JobDetailPage;
