import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';

const MockInterviewSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session, result, lastAnswer, loading, error, successMsg,
    fetchResult, submitAnswer, finishSession, clearMessages,
  } = useMockInterviewController();

  const [answerText, setAnswerText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
  }, [user, id]);

  useEffect(() => {
    if (session?.status === 'COMPLETED') {
      navigate(`/mock-interviews/${id}/result`, { replace: true });
    }
  }, [session?.status]);

  useEffect(() => {
    setAnswerText('');
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.currentQuestionIndex, session?.id]);

  if (!user || user.role !== 'ROLE_USER') {
    return <div style={{ padding: '40px', color: '#395886' }}>Vui lòng đăng nhập với tài khoản ứng viên.</div>;
  }
  if (!session) {
    return <div style={{ padding: '40px', color: '#395886' }}>{loading ? 'Đang tải...' : (error || 'Không tìm thấy phiên phỏng vấn.')}</div>;
  }

  const total = session.questions.length;
  const index = Math.min(session.currentQuestionIndex, total - 1);
  const isDone = session.currentQuestionIndex >= total;

  const handleSubmit = async () => {
    clearMessages();
    if (!answerText.trim()) return;
    const saved = await submitAnswer(session.id, answerText.trim(), elapsed);
    if (saved && session.currentQuestionIndex + 1 >= total) {
      await finishSession(session.id);
      navigate(`/mock-interviews/${session.id}/result`);
    }
  };

  const handleFinish = async () => {
    if (!window.confirm('Bạn muốn kết thúc phiên phỏng vấn ngay bây giờ?')) return;
    const res = await finishSession(session.id);
    if (res) navigate(`/mock-interviews/${session.id}/result`);
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: '#395886' }}>
          {session.mode === 'MOCK' ? 'Phỏng vấn mô phỏng' : `Luyện kiến thức: ${session.topic}`}
        </h1>
        <span style={{ color: '#628ECB', fontWeight: 600 }}>
          Câu {Math.min(session.currentQuestionIndex + (isDone ? 0 : 1), total)} / {total}
        </span>
      </div>

      <div style={{ height: 8, background: '#D5DEEF', borderRadius: 4, margin: '16px 0' }}>
        <div
          style={{
            height: '100%', background: '#628ECB', borderRadius: 4,
            width: `${(session.answeredCount / total) * 100}%`,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {!isDone ? (
        <>
          <div style={{ background: '#F0F3FA', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ color: '#628ECB', fontSize: 13, marginBottom: 8 }}>
              Thời gian suy nghĩ: {formatTime(elapsed)}
            </div>
            <strong style={{ color: '#395886', fontSize: 16 }}>{session.questions[index]}</strong>
          </div>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Nhập câu trả lời của bạn... (nên trả lời chi tiết, tối thiểu 60 từ, có ví dụ thực tế)"
            style={{
              width: '100%', minHeight: 180, padding: 12, fontSize: 14,
              border: '1px solid #D5DEEF', borderRadius: 4, boxSizing: 'border-box',
            }}
          />

          {lastAnswer && lastAnswer.score != null && (
            <div style={{ background: '#F0F3FA', borderRadius: 8, padding: 16, marginTop: 16 }}>
              <strong style={{ color: '#395886' }}>
                Điểm câu trước: {lastAnswer.score}/100
              </strong>
              <p style={{ color: '#555', marginBottom: 0 }}>{lastAnswer.feedback}</p>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={!answerText.trim() || loading}
              style={{
                padding: '12px 28px', background: answerText.trim() ? '#628ECB' : '#B1C9EF',
                color: '#fff', border: 'none', borderRadius: 4, fontSize: 15,
                cursor: answerText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {session.currentQuestionIndex + 1 >= total ? 'Hoàn thành' : 'Gửi & câu tiếp theo'}
            </button>
            <button
              onClick={handleFinish}
              style={{ padding: '12px 20px', background: '#fff', color: '#B33', border: '1px solid #B33', borderRadius: 4, cursor: 'pointer' }}
            >
              Kết thúc sớm
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#395886' }}>Bạn đã trả lời đủ {total} câu hỏi.</p>
          <button
            onClick={handleFinish}
            style={{ padding: '12px 28px', background: '#628ECB', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}
          >
            Xem kết quả
          </button>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/mock-interviews" style={{ color: '#628ECB' }}>← Quay lại danh sách</Link>
      </p>
    </div>
  );
};

export default MockInterviewSessionPage;
