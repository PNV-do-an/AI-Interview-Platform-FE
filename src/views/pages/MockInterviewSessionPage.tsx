import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import AvatarInterviewSessionPage from './AvatarInterviewSessionPage';
import { Card, buttonClass, inputClass } from '../components/ui';

// Textarea: kế thừa inputClass, bỏ h-9, thay bằng py-2 (theo luật design system).
const textareaClass = `${inputClass.replace('h-9', 'py-2')} min-h-[180px] resize-y`;

const MockInterviewSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session, lastAnswer, loading, error, successMsg,
    fetchResult, submitAnswer, finishSession, clearMessages,
  } = useMockInterviewController();

  const [answerText, setAnswerText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
  }, [user, id]);

  useEffect(() => {
    if (session?.status === 'COMPLETED' && session.mode !== 'AVATAR') {
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
    return (
      <div className="p-10 text-body-md text-ink-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }
  if (!session) {
    return (
      <div className="p-10 text-body-md text-ink-variant">
        {loading ? 'Đang tải...' : (error || 'Không tìm thấy phiên phỏng vấn.')}
      </div>
    );
  }

  // Phiên AVATAR (BE 012) vào phòng video call; MOCK/KNOWLEDGE giữ màn chữ cũ.
  if (session.mode === 'AVATAR') {
    return <AvatarInterviewSessionPage sessionId={session.id} />;
  }

  const total = session.questions.length;
  const index = Math.min(session.currentQuestionIndex, total - 1);
  const isDone = session.currentQuestionIndex >= total;
  const pending = Math.max(total - session.answeredCount, 0);
  const currentQuestion = session.questions[index];
  const currentOptions = typeof currentQuestion === 'string'
    ? []
    : ((currentQuestion as { options?: string[] }).options ?? []);
  const questionText = typeof currentQuestion === 'string'
    ? currentQuestion
    : (currentQuestion as { question: string }).question;

  const handleSubmit = async () => {
    clearMessages();
    if (!answerText.trim() || loading || submitting || submitLockRef.current) return;

    // Trắc nghiệm: gửi kèm vị trí đáp án đã chọn để BE chấm đúng, không phụ thuộc việc map text.
    const current = session.questions[index];
    const options = typeof current === 'string' ? [] : ((current as { options?: string[] }).options ?? []);
    const selectedOptionIndex = options.indexOf(answerText);
    const isLast = session.currentQuestionIndex + 1 >= total;

    submitLockRef.current = true;
    setSubmitting(true);
    const saved = await submitAnswer(session.id, {
      answerText: answerText.trim(),
      durationSec: elapsed,
      ...(selectedOptionIndex >= 0 ? { selectedOptionIndex } : {}),
    });
    if (!saved) {
      submitLockRef.current = false;
      setSubmitting(false);
      return;
    }

    if (isLast) {
      const res = await finishSession(session.id);
      if (res) {
        navigate(`/mock-interviews/${session.id}/result`);
        return;
      }
      submitLockRef.current = false;
      setSubmitting(false);
      return;
    }
    // Controller đã tăng currentQuestionIndex tại chỗ từ response của BE;
    // effect theo index sẽ xoá câu trả lời cũ và bật lại đồng hồ.
    submitLockRef.current = false;
    setSubmitting(false);
  };

  const runFinish = async () => {
    setConfirmFinish(false);
    const res = await finishSession(session.id);
    if (res) navigate(`/mock-interviews/${session.id}/result`);
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const contextLabel = session.mode === 'MOCK' ? session.jobTitle : session.topic;

  return (
    <div className="flex flex-col gap-4">
      {/* Top session bar: telemetry thật (timer, tiến trình) + điều khiển đã có logic (End Interview) */}
      <Card className="bg-card">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-surface-low px-3 py-1">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-primary" />
              <span className="text-label-sm font-semibold text-ink">Phiên luyện tập trực tiếp</span>
              {contextLabel && (
                <>
                  <span className="text-outline-strong">/</span>
                  <span className="text-label-md text-ink">{contextLabel}</span>
                </>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-6">
                <span className="text-label-sm text-ink-variant">Câu hỏi {Math.min(session.currentQuestionIndex + (isDone ? 0 : 1), total)}/{total}</span>
                <span className="font-mono text-[12px] font-medium text-primary tabular-nums">
                  {total > 0 ? Math.round((session.answeredCount / total) * 100) : 0}% Hoàn tất
                </span>
              </div>
              <div className="mt-1 h-1.5 w-44 overflow-hidden rounded-full bg-surface-high">
                <div
                  className="h-full rounded-full bg-primary-container transition-all duration-500"
                  /* width dẫn xuất từ answeredCount/total -> giữ inline style */
                  style={{ width: `${total > 0 ? (session.answeredCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-surface-low px-3 py-1.5">
              <div className="flex items-center gap-1 text-error">
                <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
                <span className="font-mono text-[12px] font-medium">REC</span>
              </div>
              <div className="flex items-baseline gap-1 font-mono text-[12px]">
                <span className="text-ink-variant">Thời gian</span>
                <span className="font-medium text-ink tabular-nums">{formatTime(elapsed)}</span>
              </div>
            </div>
            <button onClick={() => setConfirmFinish(true)} className={buttonClass('danger', 'gap-1')}>
              <span className="material-symbols-outlined text-[18px]">call_end</span>
              <span>Kết thúc phỏng vấn</span>
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
          <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Cột chính: câu hỏi + ô trả lời (giữ nguyên logic submit/finish) */}
        <div className="flex min-w-0 flex-col gap-4">
          {!isDone ? (
            <>
              <Card className="bg-card">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-label-sm text-ink-variant">
                  <span className="rounded-full bg-surface-low px-2 py-0.5 font-semibold text-ink">
                    Câu {index + 1} / {total}
                  </span>
                  {currentOptions.length > 0 && <span>Chọn 1 đáp án đúng</span>}
                </div>
                <p className="m-0 text-headline-md leading-relaxed text-ink">{questionText}</p>
              </Card>

              {currentOptions.length === 0 ? (
                <textarea
                  className={textareaClass}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Nhập câu trả lời của bạn..."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {currentOptions.map((opt, i) => (
                    <label
                      key={`${index}-${i}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-body-md transition-colors ${
                        answerText === opt
                          ? 'border-primary bg-primary-container/15 text-ink'
                          : 'border-outline-variant bg-surface-low text-ink hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={answerText === opt}
                        onChange={() => setAnswerText(opt)}
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-label-sm font-bold text-ink-variant">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!answerText.trim() || loading || submitting}
                  className={buttonClass('primary', 'gap-1')}
                >
                  <span>{submitting ? 'Đang gửi...' : 'Gửi câu trả lời & tiếp tục'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="m-0 text-body-lg text-ink">Bạn đã trả lời đủ {total} câu hỏi.</p>
              <button onClick={() => void runFinish()} className={buttonClass('primary')}>
                Xem góp ý chi tiết
              </button>
            </Card>
          )}
        </div>

        {/* Cột phụ: telemetry đã có (counter, pending, timer) + phản hồi câu trước từ API */}
        {/* top-20 = header 64px + 16px khoảng thở, để cột sticky không chui dưới header */}
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-20">
          <Card className="bg-card">
            <div className="text-headline-sm text-primary tabular-nums">
              Câu hỏi {Math.min(session.currentQuestionIndex + (isDone ? 0 : 1), total)}/{total}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-md bg-surface-high">
              <div
                className="h-full rounded-md bg-primary transition-[width] duration-300"
                /* width dẫn xuất từ answeredCount/total -> giữ inline style */
                style={{ width: `${(session.answeredCount / total) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-body-sm text-ink-variant tabular-nums">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              <span>Còn {pending} câu chưa trả lời</span>
            </div>
          </Card>

          {!isDone && (
            <Card className="bg-card">
              <div className="flex items-center gap-2 text-body-sm text-ink-variant">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="tabular-nums">Thời gian: {formatTime(elapsed)}</span>
              </div>
            </Card>
          )}

          {lastAnswer && lastAnswer.score != null && (
            <Card className="bg-surface-low">
              <p className="m-0 text-headline-sm text-ink tabular-nums">
                Điểm câu trả lời trước: {lastAnswer.score}/100
              </p>
              <p className="m-0 mt-1 text-body-sm text-ink-variant">{lastAnswer.feedback}</p>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmFinish}
        title="Kết thúc phiên phỏng vấn ngay?"
        message="Các câu còn lại sẽ bị bỏ qua và câu trả lời của bạn sẽ được chấm điểm. Không thể hoàn tác."
        confirmLabel="Kết thúc phỏng vấn"
        cancelLabel="Tiếp tục"
        danger
        onConfirm={() => void runFinish()}
        onCancel={() => setConfirmFinish(false)}
      />
    </div>
  );
};

export default MockInterviewSessionPage;
