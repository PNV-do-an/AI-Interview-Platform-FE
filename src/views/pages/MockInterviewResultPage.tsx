import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';

const scoreColor = (score: number) =>
  score >= 80 ? '#166534' : score >= 50 ? '#395886' : '#991b1b';

const MockInterviewResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { result, loading, error, fetchResult } = useMockInterviewController();

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
  }, [user, id]);

  if (!user || user.role !== 'ROLE_USER') {
    return <div style={{ padding: '40px', color: '#395886' }}>Vui lòng đăng nhập với tài khoản ứng viên.</div>;
  }
  if (!result) {
    return <div style={{ padding: '40px', color: '#395886' }}>{loading ? 'Đang tải...' : (error || 'Không tìm thấy kết quả.')}</div>;
  }

  const { session, answers } = result;
  const answered = answers.filter((a) => a.answerText);

  return (
    <div style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Kết quả phỏng vấn</h1>
      <p style={{ color: '#628ECB' }}>
        {session.mode === 'MOCK' ? `Phỏng vấn mô phỏng — ${session.jobTitle}` : `Luyện kiến thức — ${session.topic}`}
        {' · '}{new Date(session.createdAt).toLocaleString('vi-VN')}
      </p>

      <div
        style={{
          background: '#F0F3FA', borderRadius: 8, padding: 24, textAlign: 'center', marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, color: '#628ECB', marginBottom: 4 }}>ĐIỂM TỔNG THỂ</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor(session.overallScore ?? 0) }}>
          {session.overallScore ?? 0}/100
        </div>
        <div style={{ color: '#888', fontSize: 13 }}>
          Đã trả lời {answered.length}/{session.questions.length} câu hỏi
        </div>
      </div>

      {answers.map((a) => (
        <div key={a.id} style={{ border: '1px solid #D5DEEF', borderRadius: 6, padding: 16, marginBottom: 12, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ color: '#395886', flex: 1 }}>
              Câu {a.questionIndex + 1}: {a.question}
            </strong>
            {a.score != null && (
              <span
                style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 700,
                  background: '#D5DEEF', color: scoreColor(a.score), whiteSpace: 'nowrap',
                }}
              >
                {a.score}/100
              </span>
            )}
          </div>
          {a.answerText ? (
            <>
              <p style={{ color: '#555', marginTop: 8, whiteSpace: 'pre-wrap' }}>{a.answerText}</p>
              {a.feedback && (
                <p style={{ color: '#395886', background: '#F0F3FA', padding: 10, borderRadius: 4, fontSize: 13 }}>
                  Nhận xét AI: {a.feedback}
                </p>
              )}
            </>
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa trả lời.</p>
          )}
        </div>
      ))}

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link
          to="/mock-interviews"
          style={{ padding: '10px 20px', background: '#628ECB', color: '#fff', borderRadius: 4, textDecoration: 'none' }}
        >
          Luyện thêm
        </Link>
        <Link
          to="/my-applications"
          style={{ padding: '10px 20px', background: '#fff', color: '#628ECB', border: '1px solid #628ECB', borderRadius: 4, textDecoration: 'none' }}
        >
          Xem đơn ứng tuyển
        </Link>
      </div>
    </div>
  );
};

export default MockInterviewResultPage;
