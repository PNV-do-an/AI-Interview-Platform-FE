/**
 * Màn chi tiết chương trình ôn tập (route /study/:id, shell CandidateLayout).
 *
 * Nối thật API Study Program: GET /study/programs/{id}, GET /study/programs/{id}/topics,
 * GET /study/topics/{topicId}/questions (phân trang, size 1–50) và
 * POST /study/topics/{topicId}/answer (chấm câu trả lời). Chủ đề/câu hỏi của user khác
 * BE trả 404 — màn hiển thị message lỗi từ BE.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStudyController } from '../../controllers/useStudyController';
import { useAuth } from '../../context/AuthContext';
import {
  AnswerEvaluationResponse,
  DIFFICULTY_LABELS,
  PROGRAM_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  QuestionResponse,
} from '../../models/Study.model';
import { adminButton, adminInputClass, Pagination } from '../components/adminKit';
import { CARD, CandidatePageHeader, ICON, SOFT } from '../components/candidateKit';

const PAGE_SIZE = 10;

const note = 'text-ds-body-sm text-outline';

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-secondary-container/40 text-secondary-teal',
  COMPLETED: 'bg-primary-container text-on-primary',
  ARCHIVED: 'bg-surface-container-high text-on-surface-variant',
};

const TYPE_CHIP: Record<string, string> = {
  MCQ: 'bg-primary-fixed text-primary',
  SHORT_ANSWER: 'bg-secondary-container/40 text-secondary-teal',
  CODE: 'bg-tertiary-fixed text-on-tertiary-fixed',
  AUDIO: 'bg-surface-container-high text-on-surface-variant',
};

const StudyProgramDetailPage = () => {
  const { id } = useParams();
  const programId = Number(id);
  const { user } = useAuth();
  const {
    program, topics, questions, loading, error,
    fetchProgram, fetchTopics, fetchQuestions, submitAnswer,
  } = useStudyController();

  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluationResponse>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [answerError, setAnswerError] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && Number.isFinite(programId)) {
      void fetchProgram(programId);
      void fetchTopics(programId);
    }
  }, [fetchProgram, fetchTopics, programId, user]);

  const loadQuestions = useCallback(async (topicId: number, nextPage: number) => {
    setAnswerError('');
    await fetchQuestions(topicId, nextPage, PAGE_SIZE);
  }, [fetchQuestions]);

  const selectTopic = (topicId: number) => {
    setActiveTopicId(topicId);
    setPage(0);
    setAnswers({});
    setEvaluations({});
    void loadQuestions(topicId, 0);
  };

  const onPage = (nextPage: number) => {
    setPage(nextPage);
    if (activeTopicId !== null) void loadQuestions(activeTopicId, nextPage);
  };

  const handleSubmit = async (topicId: number, question: QuestionResponse) => {
    const answer = (answers[question.id] ?? '').trim();
    if (!answer || submittingId !== null) return;
    setSubmittingId(question.id);
    setAnswerError('');
    const result = await submitAnswer(topicId, question.id, answer);
    setSubmittingId(null);
    if (result) {
      setEvaluations((prev) => ({ ...prev, [question.id]: result }));
    } else {
      setAnswerError('Không đánh giá được câu trả lời — thử lại sau.');
    }
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={`${CARD} p-space-lg text-ds-body-md text-on-surface-variant`}>
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }

  const progressPct = program && program.totalTopics > 0
    ? Math.max(0, Math.min(100, Math.round((program.completedTopics / program.totalTopics) * 100)))
    : 0;

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[
          { label: 'Trang chủ', to: '/dashboard' },
          { label: 'Lộ trình ôn tập', to: '/study' },
          { label: program?.title ?? 'Chi tiết chương trình' },
        ]}
        title={program?.title ?? 'Chương trình ôn tập'}
        subtitle={program?.description}
        actions={
          <Link to="/study" className={adminButton('ghost', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px] text-primary`}>arrow_back</span>
            Về danh sách
          </Link>
        }
      />

      {error && (
        <p role="alert" className="m-0 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
          <span className={`${ICON} text-[18px]`}>error</span>
          {error}
        </p>
      )}

      {program && (
        <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-on-surface-variant">
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-ds-label-sm text-on-surface">
              {PROGRAM_TYPE_LABELS[program.programType] ?? program.programType}
            </span>
            {program.targetPosition && <span>Vị trí: {program.targetPosition}</span>}
            {program.difficultyLevel && <span>Độ khó: {DIFFICULTY_LABELS[program.difficultyLevel] ?? program.difficultyLevel}</span>}
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-ds-label-sm font-bold ${STATUS_TONE[program.status] ?? STATUS_TONE.ACTIVE}`}>
              {PROGRAM_STATUS_LABELS[program.status] ?? program.status}
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary-teal" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-ds-body-sm text-on-surface-variant tabular-nums">
              {program.completedTopics}/{program.totalTopics} chủ đề
            </span>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-3">
        {/* Danh sách chủ đề */}
        <section className={`${CARD} flex flex-col gap-space-sm p-space-lg lg:col-span-1`}>
          <div className="flex items-center gap-space-sm border-b border-surface-container-high pb-space-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className={`${ICON} text-[18px]`}>topic</span>
            </span>
            <h2 className="text-ds-headline-md text-on-surface">Chủ đề ({topics.length})</h2>
          </div>

          {topics.length === 0 ? (
            <span className={note}>Chương trình chưa có chủ đề nào.</span>
          ) : (
            <div className="flex flex-col gap-space-xs">
              {topics.map((topic) => {
                const active = topic.id === activeTopicId;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => selectTopic(topic.id)}
                    className={`flex flex-col gap-1 rounded-lg border-0 p-space-md text-left transition-colors ${
                      active ? 'bg-primary text-on-primary' : `${SOFT} hover:bg-surface-container-high`
                    }`}
                  >
                    <span className="flex items-center justify-between gap-space-xs text-ds-label-md font-semibold">
                      <span className="truncate">{topic.topicOrder}. {topic.title}</span>
                      <span className={`shrink-0 tabular-nums ${active ? 'text-on-primary/80' : 'text-outline'}`}>
                        {topic.completedQuestions}/{topic.totalQuestions}
                      </span>
                    </span>
                    {topic.skillTag && (
                      <span className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-ds-label-sm ${active ? 'bg-on-primary/15 text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                        {topic.skillTag}
                      </span>
                    )}
                    {topic.description && (
                      <span className={`line-clamp-2 text-ds-body-sm ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                        {topic.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Câu hỏi + trả lời */}
        <section className={`${CARD} flex flex-col gap-space-md p-space-lg lg:col-span-2`}>
          <div className="flex items-center gap-space-sm border-b border-surface-container-high pb-space-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-teal/10 text-secondary-teal">
              <span className={`${ICON} text-[18px]`}>quiz</span>
            </span>
            <h2 className="text-ds-headline-md text-on-surface">Câu hỏi</h2>
          </div>

          {activeTopicId === null ? (
            <div className="flex flex-col items-center gap-space-md py-space-lg text-center">
              <span className={`${ICON} text-[32px] text-outline`}>touch_app</span>
              <span className={note}>Chọn một chủ đề bên trái để xem câu hỏi.</span>
            </div>
          ) : questions && questions.content.length === 0 ? (
            <span className={note}>Chủ đề này chưa có câu hỏi nào.</span>
          ) : (
            <>
              {answerError && (
                <p role="alert" className="m-0 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
                  <span className={`${ICON} text-[18px]`}>error</span>
                  {answerError}
                </p>
              )}
              {questions?.content.map((q) => {
                const evaluation = evaluations[q.id];
                return (
                  <div key={q.id} className="flex flex-col gap-space-sm rounded-xl border border-surface-container-high p-space-md">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className={`rounded-full px-2.5 py-0.5 text-ds-label-sm font-bold ${TYPE_CHIP[q.questionType] ?? TYPE_CHIP.SHORT_ANSWER}`}>
                        {QUESTION_TYPE_LABELS[q.questionType] ?? q.questionType}
                      </span>
                      {q.skillTag && <span className="text-ds-label-sm text-on-surface-variant">{q.skillTag}</span>}
                      {q.difficulty && <span className="text-ds-label-sm text-outline">{DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}</span>}
                    </div>
                    <p className="m-0 text-ds-body-md leading-relaxed text-on-surface">{q.questionText}</p>

                    {q.questionType === 'MCQ' && q.options.length > 0 ? (
                      <div className="flex flex-col gap-space-xs" role="radiogroup" aria-label={`Đáp án câu ${q.id}`}>
                        {q.options.map((opt) => (
                          <label
                            key={opt.key}
                            className={`flex cursor-pointer items-center gap-space-sm rounded-lg border p-space-sm text-ds-body-md ${
                              answers[q.id] === opt.key
                                ? 'border-primary bg-primary/5 text-on-surface'
                                : 'border-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={opt.key}
                              checked={answers[q.id] === opt.key}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                              className="h-4 w-4 accent-[#3525cd]"
                            />
                            <span>
                              <span className="font-semibold">{opt.key}.</span> {opt.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        aria-label="Câu trả lời của bạn"
                        className={`${adminInputClass} h-auto min-h-[96px] resize-y py-space-sm leading-relaxed`}
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={q.questionType === 'CODE' ? 'Viết mã nguồn hoặc mô tả cách giải...' : 'Nhập câu trả lời của bạn...'}
                      />
                    )}

                    {!evaluation && (
                      <button
                        type="button"
                        className={adminButton('primary', 'h-9 self-start')}
                        disabled={!((answers[q.id] ?? '').trim()) || submittingId !== null || loading}
                        onClick={() => void handleSubmit(activeTopicId as number, q)}
                      >
                        <span className={`${ICON} text-[18px]`}>
                          {submittingId === q.id ? 'progress_activity' : 'send'}
                        </span>
                        {submittingId === q.id ? 'Đang chấm...' : 'Nộp câu trả lời'}
                      </button>
                    )}

                    {evaluation && (
                      <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md">
                        <div className="flex flex-wrap items-center gap-space-sm">
                          {evaluation.score != null && (
                            <span className="text-ds-headline-sm font-bold text-primary tabular-nums">
                              Điểm: {evaluation.score}
                            </span>
                          )}
                          {evaluation.isCorrect != null && (
                            <span className={`rounded-full px-2.5 py-0.5 text-ds-label-sm font-bold ${
                              evaluation.isCorrect ? 'bg-secondary-container/40 text-secondary-teal' : 'bg-error-container/50 text-error'
                            }`}>
                              {evaluation.isCorrect ? 'Đúng' : 'Sai'}
                            </span>
                          )}
                        </div>
                        {evaluation.feedback && <span className="text-ds-body-md text-on-surface">{evaluation.feedback}</span>}
                        {evaluation.modelAnswer && (
                          <div className="flex flex-col gap-1">
                            <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Đáp án mẫu</span>
                            <span className="whitespace-pre-wrap text-ds-body-sm leading-relaxed text-on-surface-variant">{evaluation.modelAnswer}</span>
                          </div>
                        )}
                        {evaluation.explanation && (
                          <div className="flex flex-col gap-1">
                            <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Giải thích</span>
                            <span className="whitespace-pre-wrap text-ds-body-sm leading-relaxed text-on-surface-variant">{evaluation.explanation}</span>
                          </div>
                        )}
                        {evaluation.strengths.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-secondary-teal">Điểm mạnh</span>
                            <ul className="m-0 list-disc pl-5 text-ds-body-sm text-on-surface-variant">
                              {evaluation.strengths.map((s, i) => (
                                <li key={i} className="mb-0.5">{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.improvements.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-error">Cần cải thiện</span>
                            <ul className="m-0 list-disc pl-5 text-ds-body-sm text-on-surface-variant">
                              {evaluation.improvements.map((s, i) => (
                                <li key={i} className="mb-0.5">{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {questions && (
                <Pagination
                  page={questions.number}
                  pageSize={questions.size}
                  total={questions.totalElements}
                  onPage={onPage}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudyProgramDetailPage;
