import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvController } from '../../controllers/useCvController';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';

const CoverLettersPage = () => {
  const { user } = useAuth();
  const {
    cvs, letters, current, loading, error, successMsg,
    generateLetter, fetchMyCvs, fetchMyLetters, updateLetter, deleteLetter, clearMessages,
  } = useCvController();
  const { jobs, fetchJobs } = useJobController();

  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState<number | ''>('');
  const [cvId, setCvId] = useState<number | ''>('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMyCvs();
      fetchMyLetters();
      fetchJobs(0, '');
    }
  }, [user]);

  useEffect(() => {
    if (current) setContent(current.content);
  }, [current?.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const letter = await generateLetter({
      title,
      jobId: jobId !== '' ? Number(jobId) : undefined,
      cvId: cvId !== '' ? Number(cvId) : undefined,
    });
    if (letter) {
      fetchMyLetters();
    }
  };

  const handleSave = async () => {
    if (!current) return;
    const ok = await updateLetter(current.id, content);
    if (ok) fetchMyLetters();
  };

  const handleDownload = () => {
    if (!current) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.title.replace(/[^\wÀ-ỹ -]+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openLetter = (id: number) => {
    const letter = letters.find((l) => l.id === id);
    if (letter) setContent(letter.content);
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
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Thư xin việc AI</h1>
      <p style={{ color: '#628ECB' }}>
        Chọn tin tuyển dụng và CV đã phân tích — AI sẽ soạn thư xin việc nháp, bạn có thể chỉnh sửa và tải xuống.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <div>
          <div style={{ background: '#F0F3FA', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: '#395886', marginTop: 0 }}>Tạo thư mới</h3>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Tiêu đề thư</label>
                <input
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thư xin việc Java Developer - FPT"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Tin tuyển dụng (tùy chọn)</label>
                <select style={inputStyle} value={jobId} onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Thư dùng chung —</option>
                  {jobs?.content.map((j) => (
                    <option key={j.id} value={j.id}>{j.title} — {j.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>CV làm cơ sở (khuyến nghị)</label>
                <select style={inputStyle} value={cvId} onChange={(e) => setCvId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Không dùng CV —</option>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>{cv.fileName} ({cv.cvScore}/100)</option>
                  ))}
                </select>
                {cvs.length === 0 && (
                  <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                    Bạn chưa có CV nào — <Link to="/cv-analyzer" style={{ color: '#628ECB' }}>phân tích CV</Link> trước.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!title.trim() || loading}
                style={{
                  padding: '12px 24px',
                  background: title.trim() ? '#628ECB' : '#B1C9EF',
                  color: '#fff', border: 'none', borderRadius: 4,
                  cursor: title.trim() ? 'pointer' : 'not-allowed', fontSize: 15,
                }}
              >
                {loading ? 'Đang tạo...' : 'Tạo thư'}
              </button>
            </form>
          </div>

          <h3 style={{ color: '#395886' }}>Thư đã lưu</h3>
          {letters.length === 0 ? (
            <p style={{ color: '#888' }}>Chưa có thư nào.</p>
          ) : (
            letters.map((l) => (
              <div
                key={l.id}
                style={{
                  border: '1px solid #D5DEEF', borderRadius: 6, padding: '10px 14px',
                  marginBottom: 8, background: current?.id === l.id ? '#F0F3FA' : '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ color: '#395886' }}>{l.title}</strong>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {l.jobTitle ? `${l.jobTitle} · ` : ''}{new Date(l.updatedAt || l.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openLetter(l.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Xem</button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Xóa thư này?')) return;
                      const ok = await deleteLetter(l.id);
                      if (ok) fetchMyLetters();
                    }}
                    style={{ padding: '4px 10px', fontSize: 12, color: '#B33' }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 style={{ color: '#395886' }}>Nội dung thư</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung thư sẽ hiển thị ở đây — bạn có thể chỉnh sửa trực tiếp."
            style={{
              width: '100%', minHeight: 420, padding: 12, fontSize: 14,
              border: '1px solid #D5DEEF', borderRadius: 4, boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!current}
              style={{
                padding: '10px 22px',
                background: current ? '#628ECB' : '#B1C9EF',
                color: '#fff', border: 'none', borderRadius: 4,
                cursor: current ? 'pointer' : 'not-allowed',
              }}
            >
              Lưu thay đổi
            </button>
            <button
              onClick={handleDownload}
              disabled={!content.trim()}
              style={{
                padding: '10px 22px', background: '#fff', color: '#628ECB',
                border: '1px solid #628ECB', borderRadius: 4,
                cursor: content.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Tải xuống (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLettersPage;
