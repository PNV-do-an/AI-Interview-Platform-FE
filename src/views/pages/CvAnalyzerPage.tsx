import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvController } from '../../controllers/useCvController';
import { useAuth } from '../../context/AuthContext';

const scoreColor = (score: number) =>
  score >= 80 ? '#166534' : score >= 50 ? '#395886' : '#991b1b';

const CvAnalyzerPage = () => {
  const { user } = useAuth();
  const { cvs, analysis, loading, error, successMsg, analyzeCv, fetchMyCvs, clearMessages } =
    useCvController();

  const [cvText, setCvText] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchMyCvs();
  }, [user]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (cvText.trim().length < 50) {
      return;
    }
    await analyzeCv(cvText.trim(), fileName || undefined);
    fetchMyCvs();
  };

  if (!user || user.role !== 'ROLE_USER') {
    return <div style={{ padding: '40px', color: '#395886' }}>Vui lòng đăng nhập với tài khoản ứng viên.</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Quét & phân tích CV bằng AI</h1>
      <p style={{ color: '#628ECB' }}>
        Dán nội dung CV của bạn (sao chép từ file Word/PDF) để AI phát hiện kỹ năng, chấm điểm và đề xuất cải thiện.
      </p>

      <form onSubmit={handleAnalyze} style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600 }}>
            Tên file CV (tùy chọn)
          </label>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="VD: CV_NguyenVanA.pdf"
            style={{
              width: '100%', maxWidth: 360, padding: '10px 12px',
              border: '1px solid #D5DEEF', borderRadius: 4, boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600 }}>
            Nội dung CV
          </label>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder={"Dán toàn bộ nội dung CV tại đây...\n\nGợi ý: nên có các mục Thông tin liên hệ, Tóm tắt, Kinh nghiệm, Học vấn, Kỹ năng."}
            style={{
              width: '100%', minHeight: 260, padding: 12, fontSize: 14,
              border: '1px solid #D5DEEF', borderRadius: 4, boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={cvText.trim().length < 50 || loading}
          style={{
            padding: '12px 28px',
            background: cvText.trim().length >= 50 ? '#628ECB' : '#B1C9EF',
            color: '#fff', border: 'none', borderRadius: 4,
            cursor: cvText.trim().length >= 50 ? 'pointer' : 'not-allowed', fontSize: 15,
          }}
        >
          {loading ? 'Đang phân tích...' : 'Phân tích CV'}
        </button>
        {cvText.trim().length > 0 && cvText.trim().length < 50 && (
          <span style={{ color: '#991b1b', marginLeft: 12, fontSize: 13 }}>
            Nội dung quá ngắn (tối thiểu 50 ký tự).
          </span>
        )}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {analysis && (
        <div style={{ background: '#F0F3FA', borderRadius: 8, padding: 24, marginBottom: 32 }}>
          <h3 style={{ color: '#395886', marginTop: 0 }}>Kết quả phân tích: {analysis.fileName}</h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: scoreColor(analysis.cvScore) }}>
                {analysis.cvScore}/100
              </div>
              <div style={{ color: '#628ECB', fontSize: 13 }}>Điểm CV</div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <strong style={{ color: '#395886' }}>Kỹ năng phát hiện ({analysis.detectedSkills.length})</strong>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {analysis.detectedSkills.length === 0 && (
                  <span style={{ color: '#888' }}>Chưa phát hiện kỹ năng nào.</span>
                )}
                {analysis.detectedSkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '4px 12px', borderRadius: 12, fontSize: 13,
                      background: '#D5DEEF', color: '#395886',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {analysis.suggestions.length > 0 && (
            <div>
              <strong style={{ color: '#395886' }}>Đề xuất cải thiện</strong>
              <ul style={{ color: '#555', marginTop: 8, paddingLeft: 20 }}>
                {analysis.suggestions.map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p style={{ marginTop: 12 }}>
            <Link to="/cover-letters" style={{ color: '#628ECB' }}>
              → Dùng CV này để tạo thư xin việc
            </Link>
          </p>
        </div>
      )}

      <h3 style={{ color: '#395886' }}>CV đã phân tích</h3>
      {cvs.length === 0 ? (
        <p style={{ color: '#888' }}>Chưa có CV nào được phân tích.</p>
      ) : (
        cvs.map((cv) => (
          <div
            key={cv.id}
            style={{
              border: '1px solid #D5DEEF', borderRadius: 6, padding: '12px 16px',
              marginBottom: 8, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 8, background: '#fff',
            }}
          >
            <div>
              <strong style={{ color: '#395886' }}>{cv.fileName}</strong>
              <span style={{ color: '#888', fontSize: 13, marginLeft: 10 }}>
                {new Date(cv.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <span style={{ color: scoreColor(cv.cvScore), fontWeight: 700 }}>{cv.cvScore}/100</span>
          </div>
        ))
      )}
    </div>
  );
};

export default CvAnalyzerPage;
