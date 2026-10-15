import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';
import { INTERVIEW_MODE_LABELS, InterviewMode } from '../../models/Interview.model';

const MockInterviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, loading, error, successMsg, startSession, fetchMySessions } = useMockInterviewController();
  const { jobs, fetchJobs } = useJobController();

  const [mode, setMode] = useState<InterviewMode>('MOCK');
  const [jobId, setJobId] = useState<number | ''>('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMySessions(0);
      fetchJobs(0, '');
    }
  }, [user]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = await startSession({
      mode,
      jobId: mode === 'MOCK' && jobId !== '' ? Number(jobId) : undefined,
      topic: mode === 'KNOWLEDGE' ? topic : undefined,
      questionCount,
    });
    if (session) navigate(`/mock-interviews/${session.id}`);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return <div style={{ padding: '40px', color: '#395886' }}>Vui lòng đăng nhập với tài khoản ứng viên.</div>;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #D5DEEF',
    borderRadius: 4, boxSizing: 'border-box', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600 };

  return (
    <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Luyện phỏng vấn với AI</h1>

      <div style={{ background: '#F0F3FA', borderRadius: 8, padding: 24, marginBottom: 32 }}>
        <h3 style={{ color: '#395886', marginTop: 0 }}>Bắt đầu phiên mới</h3>
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Chế độ luyện tập</label>
            <select
              style={inputStyle}
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
            >
              {Object.entries(INTERVIEW_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {mode === 'MOCK' && (
            <div>
              <label style={labelStyle}>Chọn tin tuyển dụng</label>
              <select style={inputStyle} value={jobId} onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Chọn tin tuyển dụng —</option>
                {jobs?.content.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.companyName}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'KNOWLEDGE' && (
            <div>
              <label style={labelStyle}>Chủ đề luyện tập</label>
              <input
                style={inputStyle}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Java Spring Boot, React, SQL..."
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Số câu hỏi (3-10)</label>
            <input
              style={{ ...inputStyle, width: 120 }}
              type="number"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px', background: '#628ECB', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, width: 200,
            }}
          >
            Bắt đầu phỏng vấn
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      </div>

      <h3 style={{ color: '#395886' }}>Lịch sử phỏng vấn</h3>
      {loading && <p style={{ color: '#395886' }}>Đang tải...</p>}
      {!sessions || sessions.content.length === 0 ? (
        <p style={{ color: '#888' }}>Chưa có phiên phỏng vấn nào.</p>
      ) : (
        sessions.content.map((s) => (
          <div
            key={s.id}
            style={{
              border: '1px solid #D5DEEF', borderRadius: 6, padding: 16,
              marginBottom: 10, background: '#fff', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            }}
          >
            <div>
              <strong style={{ color: '#395886' }}>
                {s.mode === 'MOCK' ? `Phỏng vấn mô phỏng — ${s.jobTitle}` : `Kiến thức — ${s.topic}`}
              </strong>
              <div style={{ color: '#888', fontSize: 13 }}>
                {new Date(s.createdAt).toLocaleString('vi-VN')} · {s.answeredCount}/{s.questions.length} câu đã trả lời
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {s.status === 'COMPLETED' && s.overallScore != null && (
                <span style={{ padding: '4px 12px', borderRadius: 4, background: '#D5DEEF', color: '#395886', fontSize: 13 }}>
                  Điểm: {s.overallScore}/100
                </span>
              )}
              <Link
                to={s.status === 'COMPLETED' ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                style={{ padding: '6px 14px', background: '#628ECB', color: '#fff', borderRadius: 4, textDecoration: 'none', fontSize: 13 }}
              >
                {s.status === 'COMPLETED' ? 'Xem kết quả' : 'Tiếp tục'}
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MockInterviewsPage;
