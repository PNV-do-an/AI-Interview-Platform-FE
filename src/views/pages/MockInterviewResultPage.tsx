/**
 * Màn "Báo cáo Đánh giá Phỏng vấn AI" (mockup Stitch `screen_10`) —
 * route /mock-interviews/:id/result, shell WorkspaceLayout.
 *
 * Số thật: GET /mock-interviews/{id} -> session, transcript từng lượt đã chốt, answers
 * (question, answerText, durationSec, score, feedback) và GET /{id}/report -> rubric 5 chiều.
 * Không có form tự đánh giá: phiên AVATAR kết thúc là BE tự tạo báo cáo; trang chỉ đọc lại.
 *
 * Nội dung từng câu lấy đúng transcript ứng viên đã nói. Nhận xét ưu tiên feedback do AI
 * service/BE chấm; nếu bản ghi cũ chưa có, `evaluateAnswerText` chấm tất định từ chính câu
 * trả lời đó (độ dài, dẫn chứng dự án, lập luận, số liệu) — không bịa nội dung.
 *
 * Sao đổi so với mockup:
 * - Bỏ máy nghe + sóng âm từng câu (FE không nhận bản ghi âm nào) -> chỉ còn "Nội dung trả lời"
 *   + "Nhận xét chuyên sâu từ AI".
 * - Bỏ "Hệ thống AI Model: TalentNexus Core v4.2" và dòng ghi chú rubric version vì dữ liệu
 *   không có.
 * - "Cao hơn 78% ứng viên" và khóa học/mẹo viết sẵn của mockup -> thay bằng chỉ số và gợi ý
 *   suy ra từ chính câu trả lời (số câu, số từ, số liệu, câu điểm thấp nhất).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import {
  INTERVIEW_MODE_LABELS, InterviewAnswer, InterviewRubric, InterviewSession, RUBRIC_DIMENSIONS,
} from '../../models/Interview.model';
import { buildFallbackEvaluation, evaluateAnswerText } from '../../utils/avatarEvaluation';
import {
  EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pill, adminButton, adminTableClass,
  adminTdClass, adminThClass, fmtServer,
} from '../components/adminKit';
import { CARD, SOFT, ScoreRing } from '../components/candidateKit';

/** Nhãn dải điểm — dẫn xuất từ điểm thật, không phải nhận định mới. */
const scoreBand = (score: number) =>
  score >= 90 ? 'Xuất sắc' : score >= 80 ? 'Tốt' : score >= 70 ? 'Khá tốt' : score >= 50 ? 'Cần cải thiện' : 'Cần cố gắng';

const scoreTone = (score: number): 'success' | 'primary' | 'warning' | 'danger' =>
  score >= 80 ? 'success' : score >= 70 ? 'primary' : score >= 50 ? 'warning' : 'danger';

const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const OPTION_LETTER = (i: number) => String.fromCharCode(65 + i);

const splitLines = (value?: string) =>
  (value ?? '').split('\n').map(line => line.trim()).filter(Boolean);

const clipText = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Đáp án đúng lấy từ `correctAnswer`; fallback theo chỉ số nếu BE chỉ trả options. */
const isCorrectOption = (answer: InterviewAnswer, option: string, index: number) =>
  answer.correctAnswer != null
    ? option === answer.correctAnswer
    : answer.correct === true && answer.selectedOptionIndex === index;

const isChosenOption = (answer: InterviewAnswer, option: string, index: number) =>
  answer.selectedOptionIndex != null ? answer.selectedOptionIndex === index : answer.answerText === option;

/** Một item trong cột Điểm mạnh / Cần cải thiện — dựng từ answer thật. */
const InsightItem: React.FC<{ icon: string; iconClass: string; title: string; body: string; meta?: string }> = ({
  icon, iconClass, title, body, meta,
}) => (
  <div className={`flex items-start gap-space-sm rounded-lg p-space-md ${SOFT}`}>
    <span className={`${ICON} mt-0.5 shrink-0 text-[20px] ${iconClass}`}>{icon}</span>
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="break-words font-semibold text-slate-900">{title}</span>
      <p className="m-0 whitespace-pre-line text-ds-body-sm text-slate-600">{body}</p>
      {meta && <span className="text-ds-label-sm text-slate-400">{meta}</span>}
    </div>
  </div>
);

/** Ô số liệu nhỏ trong phần tổng kết trắc nghiệm. */
const Stat: React.FC<{ icon: string; label: string; value: string; tone: string }> = ({ icon, label, value, tone }) => (
  <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-space-md">
    <span className={`flex items-center gap-1.5 text-ds-label-sm font-medium ${tone}`}>
      <span className={`${ICON} text-[18px]`}>{icon}</span>
      {label}
    </span>
    <span className="text-ds-headline-md font-bold text-slate-900 tabular-nums">{value}</span>
  </div>
);

/** Một dòng câu hỏi trong báo cáo AVATAR, đã ghép transcript + điểm/nhận xét của BE. */
interface QuestionRow {
  index: number;
  question: string;
  answerText?: string;
  durationSec?: number;
  score: number;
  feedback: string;
}

const titleOfSession = (s: InterviewSession) =>
  s.jobTitle ?? s.topic ?? INTERVIEW_MODE_LABELS[s.mode];

const progressOfSession = (s: InterviewSession) =>
  s.mode === 'AVATAR'
    ? `${s.answeredCount ?? 0} lượt`
    : `${s.answeredCount ?? 0}/${s.questionCount || s.questions?.length || 0} câu`;

/** Icon cho từng chiều rubric — chỉ để trình bày, nhãn lấy từ model. */
const dimIcon = (key: keyof InterviewRubric) => {
  switch (key) {
    case 'chuyenMon': return 'terminal';
    case 'duAn': return 'work';
    case 'tuDuy': return 'psychology';
    case 'truyenDat': return 'forum';
    default: return 'speed';
  }
};

/**
 * Báo cáo phiên AVATAR (BE 012). Khi phiên kết thúc, BE tự chấm rubric 5 chiều và ghi nhận
 * xét từng câu vào interview_answers; màn này chỉ đọc lại, không có form tự đánh.
 */
const AvatarReportView: React.FC<{ sessionId: number }> = ({ sessionId }) => {
  const { user } = useAuth();
  const {
    result, report, reportMissing, loading, error, sessions,
    fetchResult, loadReport, submitEvaluation, fetchMySessions,
  } = useMockInterviewController();
  const autoEvalTried = useRef(false);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchResult(sessionId);
  }, [user, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchMySessions(0);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result?.session.mode === 'AVATAR' && result.session.status === 'COMPLETED') {
      void loadReport(sessionId);
    }
  }, [result, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const session = result?.session;
  const transcript = useMemo(() => result?.transcript ?? [], [result?.transcript]);
  const answers = useMemo(() => result?.answers ?? [], [result?.answers]);

  const confirmed = useMemo(() => transcript.filter(t => t.confirmed), [transcript]);

  const answerByIndex = useMemo(() => {
    const map = new Map<number, InterviewAnswer>();
    answers.forEach(a => map.set(a.questionIndex, a));
    return map;
  }, [answers]);

  const rows = useMemo<QuestionRow[]>(() => confirmed.map(t => {
    const answer = answerByIndex.get(t.index);
    const fallback = evaluateAnswerText(t.answerText, t.durationSec);
    return {
      index: t.index,
      question: t.questionText || answer?.question || `Câu ${t.index + 1}`,
      answerText: t.answerText ?? answer?.answerText,
      durationSec: t.durationSec ?? answer?.durationSec,
      score: typeof answer?.score === 'number' ? answer.score : fallback.score,
      feedback: answer?.feedback?.trim() ? answer.feedback : fallback.feedback,
    };
  }).sort((a, b) => a.index - b.index), [confirmed, answerByIndex]);

  const totalSec = rows.reduce((sum, row) => sum + (row.durationSec ?? 0), 0);
  const totalWords = rows.reduce((sum, row) => sum + (row.answerText ?? '').trim().split(/\s+/).filter(Boolean).length, 0);
  const avgWords = rows.length ? Math.round(totalWords / rows.length) : 0;
  const avgScore = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
    : 0;

  const strongest = useMemo(
    () => [...rows].sort((a, b) => b.score - a.score).slice(0, 3),
    [rows],
  );
  const weakest = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.score - b.score);
    const onlyWeak = rows.length >= 3 ? sorted.slice(0, 3) : sorted.filter(row => row.score < 60);
    return onlyWeak.slice(0, 3);
  }, [rows]);

  const reportStrengths = useMemo(() => splitLines(report?.strengths), [report?.strengths]);
  const reportImprovements = useMemo(() => splitLines(report?.improvements), [report?.improvements]);

  const hasEvidence = useMemo(() => {
    const joined = rows.map(row => (row.answerText ?? '').toLowerCase()).join(' ');
    return {
      project: /dự án|project|triển khai|hệ thống|sản phẩm|team|nhóm|khách hàng/.test(joined),
      numbers: /\d/.test(joined),
    };
  }, [rows]);

  const mentorTips = useMemo(() => {
    const lowest = weakest[0];
    const tips: { icon: string; title: string; body: string }[] = [];
    if (lowest) {
      tips.push({
        icon: 'school',
        title: `Ôn lại câu ${lowest.index + 1}`,
        body: `Đọc lại nhận xét của câu này, sau đó trả lời lại trong 2 phút với đủ bối cảnh, hành động và kết quả.`,
      });
    }
    if (rows.length > 0) {
      tips.push({
        icon: 'code_blocks',
        title: 'Bài tập thử thách thực hành',
        body: avgWords < 25
          ? `Câu trả lời đang ngắn (trung bình ${avgWords} từ). Thử ghi âm lại một câu theo STAR, mục tiêu 60–90 từ.`
          : !hasEvidence.numbers
            ? 'Thêm ít nhất một con số vào mỗi câu: thời gian xử lý, quy mô dữ liệu, số người dùng hoặc mức cải thiện.'
            : 'Chọn câu khó nhất và trình bày thêm phần đánh đổi: phương án thay thế, rủi ro và lý do chọn.',
      });
    }
    tips.push({
      icon: 'lightbulb',
      title: 'Mẹo cho vòng phỏng vấn kế tiếp',
      body: rows.length === 0
        ? 'Bắt đầu phiên mới và trả lời ít nhất 3 câu để báo cáo có đủ dữ liệu chấm điểm.'
        : 'Dành 10–15 giây tóm tắt lại câu hỏi trước khi trả lời để đồng bộ góc nhìn với người phỏng vấn.',
    });
    return tips;
  }, [avgWords, hasEvidence.numbers, rows.length, weakest]);

  const firstIndex = rows[0]?.index;
  const loadedSessionId = result?.session.id;
  useEffect(() => {
    if (firstIndex != null) setOpenIds(new Set([firstIndex]));
  }, [loadedSessionId, firstIndex]);

  /** Tự chấm báo cáo từ transcript — dùng cho phiên cũ chưa từng có rubric. */
  const autoSubmit = useCallback(async () => {
    if (session?.status !== 'COMPLETED') return;
    await submitEvaluation(sessionId, buildFallbackEvaluation(transcript));
  }, [session?.status, sessionId, transcript, submitEvaluation]);

  useEffect(() => {
    if (!reportMissing || autoEvalTried.current || session?.status !== 'COMPLETED') return;
    autoEvalTried.current = true;
    void autoSubmit();
  }, [reportMissing, session?.status, autoSubmit]);

  if (!session) {
    return loading
      ? <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải báo cáo..." /></div>
      : <div className={`${CARD} p-space-lg`}><ErrorBlock message={error || 'Không tìm thấy phiên phỏng vấn.'} onRetry={() => void fetchResult(sessionId)} /></div>;
  }

  const toggle = (index: number) =>
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });

  const expandAll = () => setOpenIds(new Set(rows.map(row => row.index)));
  const collapseAll = () => setOpenIds(new Set());

  const rowScore = (row: QuestionRow) => Math.max(0, Math.min(100, Math.round(row.score)));
  const historyRows = sessions?.content?.slice(0, 5) ?? [];
  const currentScore = report?.overallScore ?? null;

  return (
    <div className="flex flex-col gap-space-xl">
      {/* 1. Đầu trang: breadcrumb + chip id + tiêu đề + meta thật + action */}
      <div className="flex flex-col gap-space-lg lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-slate-600">
            <Link to="/mock-interviews" className="no-underline text-slate-600 hover:text-primary">
              <span className="flex items-center gap-1">
                <span className={`${ICON} text-[16px] text-primary`}>psychology</span>
                AI Interview
              </span>
            </Link>
            <span className="text-slate-400-variant">/</span>
            <Link to="/mock-interviews/history" className="no-underline text-slate-600 hover:text-primary">
              Lịch sử &amp; Báo cáo
            </Link>
            <span className="text-slate-400-variant">/</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-900">
              Báo cáo kết quả phiên phỏng vấn
              <span className="rounded bg-slate-200 px-space-xs py-0.5 text-ds-label-sm text-slate-900">
                #AV-{session.id}
              </span>
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <h1 className="text-ds-headline-xl font-bold tracking-tight text-slate-900">
              Báo cáo Đánh giá Phỏng vấn AI
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-space-md py-1 text-ds-label-md text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              {session.status === 'COMPLETED'
                ? `Hoàn thành: ${fmtServer(session.completedAt ?? session.createdAt, 'datetime')}`
                : 'Phiên chưa kết thúc'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-lg pt-1 text-ds-body-sm text-slate-600">
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-primary`}>badge</span>
              <span className="font-medium text-slate-900">Vị trí:</span>
              <span>{titleOfSession(session)}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-slate-400`}>timelapse</span>
              <span className="font-medium text-slate-900">Thời lượng:</span>
              <span>
                {totalSec > 0 ? `${Math.max(1, Math.round(totalSec / 60))} phút` : 'chưa ghi nhận'}
                {` (Hoàn thành ${rows.length}/${session.questionCount || rows.length} câu)`}
              </span>
            </span>
            {session.companyName && (
              <>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-[18px] text-slate-400`}>business</span>
                  <span>{session.companyName}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
          <Link to={`/mock-interviews/${session.id}`} className={adminButton('ghost', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>autorenew</span>
            Luyện tập lại phiên này
          </Link>
          <button type="button" onClick={() => window.print()} className={adminButton('ghost', 'h-10')}>
            <span className={`${ICON} text-[18px] text-slate-400`}>download</span>
            Xuất báo cáo PDF
          </button>
          <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>add_circle</span>
            Luyện tập phiên mới
          </Link>
        </div>
      </div>

      {error && <ErrorBlock message={error} />}

      {session.status !== 'COMPLETED' ? (
        <div className={`${CARD} flex flex-col items-center gap-space-md p-space-2xl text-center`}>
          <span className={`${ICON} text-[34px] text-primary`}>videocam</span>
          <p className="m-0 text-ds-headline-sm font-bold text-slate-900">Phiên vẫn đang mở</p>
          <p className="m-0 max-w-md text-ds-body-sm text-slate-600">
            Kết thúc phiên trong phòng phỏng vấn để hệ thống tự tổng hợp báo cáo đánh giá.
          </p>
          <Link to={`/mock-interviews/${session.id}`} className={adminButton('primary', 'h-11 no-underline')}>
            Tiếp tục phiên
          </Link>
        </div>
      ) : report ? (
        <>
          {/* 2. Điểm tổng hợp + 5 năng lực + tín hiệu thật từ transcript */}
          <div className={`${CARD} relative flex flex-col gap-space-xl overflow-hidden p-space-lg xl:flex-row xl:items-stretch`}>
            <span className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl" />
            <div className={`relative z-10 flex min-w-[280px] flex-col items-center justify-center gap-space-sm rounded-xl p-space-md text-center ${SOFT}`}>
              <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-primary">
                Điểm số tổng hợp
              </span>
              <ScoreRing value={report.overallScore} caption={scoreBand(report.overallScore)} size={176} />
              <Pill tone={scoreTone(report.overallScore)} icon="verified">
                Điểm trung bình 5 chiều
              </Pill>
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-between gap-space-lg">
              <div>
                <div className="mb-space-md flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-space-sm">
                  <h2 className="text-ds-headline-sm font-bold text-slate-900">
                    Phân tích Năng lực Cốt lõi (Core Competencies)
                  </h2>
                  <span className="text-ds-label-sm uppercase tracking-wider text-slate-400">
                    Chấm từ {rows.length} câu đã chốt
                  </span>
                </div>

                <div className="flex flex-col gap-space-md">
                  {RUBRIC_DIMENSIONS.map(dim => {
                    const value = Math.max(0, Math.min(100, report[dim.key]));
                    return (
                      <div key={dim.key} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-ds-label-md">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <span className={`${ICON} text-[18px] text-primary`}>{dimIcon(dim.key)}</span>
                            {dim.label}
                          </span>
                          <span className="tabular-nums text-slate-600">{value}/100</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                        </div>
                        <span className="text-ds-label-sm text-slate-600">{dim.hint}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-space-md border-t border-surface-container-high pt-space-md">
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-space-md py-1 text-ds-label-sm text-slate-600">
                  <span className={`${ICON} text-[16px] text-teal-600`}>task_alt</span>
                  Đã chốt {rows.length} câu
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-space-md py-1 text-ds-label-sm text-slate-600">
                  <span className={`${ICON} text-[16px] text-primary`}>record_voice_over</span>
                  Trung bình {avgWords} từ/câu
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-space-md py-1 text-ds-label-sm text-slate-600">
                  <span className={`${ICON} text-[16px] text-slate-400`}>timer</span>
                  {totalSec > 0 ? `~${Math.max(1, Math.round(totalSec / 60))} phút trả lời` : 'Chưa ghi nhận thời lượng'}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-space-md py-1 text-ds-label-sm text-slate-600">
                  <span className={`${ICON} text-[16px] text-primary`}>insights</span>
                  Trung bình câu: {avgScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* 3. Ba cột: điểm mạnh, cần cải thiện, gợi ý luyện tập */}
          <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <div className="flex items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <span className={`${ICON} text-[24px]`}>task_alt</span>
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-ds-headline-sm font-bold text-slate-900">Điểm mạnh nổi bật</h2>
                    <span className="text-ds-label-sm text-teal-600">
                      {strongest.length > 0 ? `${strongest.length} câu có điểm cao nhất` : 'Chưa đủ dữ liệu'}
                    </span>
                  </div>
                </div>
              </div>

              {strongest.length > 0 ? strongest.map(row => (
                <InsightItem
                  key={row.index}
                  icon="check_circle"
                  iconClass="text-teal-600"
                  title={`Câu ${row.index + 1}: ${clipText(row.question, 70)}`}
                  body={row.feedback}
                  meta={`${rowScore(row)}/100${row.durationSec != null ? ` • trả lời ${fmtDuration(row.durationSec)}` : ''}`}
                />
              )) : reportStrengths.length > 0 ? reportStrengths.map((line, i) => (
                <InsightItem
                  key={`strength-${i}`}
                  icon="check_circle"
                  iconClass="text-teal-600"
                  title={`Điểm mạnh ${i + 1}`}
                  body={line}
                />
              )) : (
                <p className="m-0 rounded-lg bg-slate-50 p-space-md text-ds-body-sm text-slate-600">
                  Chưa ghi nhận câu trả lời nào để rút ra điểm mạnh.
                </p>
              )}
            </section>

            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <div className="flex items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <span className={`${ICON} text-[24px]`}>troubleshoot</span>
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-ds-headline-sm font-bold text-slate-900">Cần cải thiện</h2>
                    <span className="text-ds-label-sm text-error">
                      {weakest.length > 0 ? `${weakest.length} câu cần xem lại` : 'Không có câu điểm thấp'}
                    </span>
                  </div>
                </div>
              </div>

              {weakest.length > 0 ? weakest.map(row => (
                <InsightItem
                  key={row.index}
                  icon="report_problem"
                  iconClass="text-error"
                  title={`Câu ${row.index + 1}: ${clipText(row.question, 70)}`}
                  body={row.feedback}
                  meta={`${rowScore(row)}/100${row.durationSec != null ? ` • trả lời ${fmtDuration(row.durationSec)}` : ''}`}
                />
              )) : reportImprovements.length > 0 ? reportImprovements.map((line, i) => (
                <InsightItem
                  key={`improvement-${i}`}
                  icon="report_problem"
                  iconClass="text-error"
                  title={`Cần cải thiện ${i + 1}`}
                  body={line}
                />
              )) : (
                <p className="m-0 rounded-lg bg-slate-50 p-space-md text-ds-body-sm text-slate-600">
                  Chưa có câu trả lời nào dưới ngưỡng cần cải thiện.
                </p>
              )}
            </section>

            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <div className="flex items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <span className={`${ICON} text-[24px]`}>auto_awesome</span>
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-ds-headline-sm font-bold text-slate-900">Gợi ý từ AI Mentor</h2>
                    <span className="text-ds-label-sm text-primary">Dựa trên chính câu trả lời của bạn</span>
                  </div>
                </div>
              </div>

              {mentorTips.map(tip => (
                <InsightItem
                  key={tip.title}
                  icon={tip.icon}
                  iconClass="text-primary"
                  title={tip.title}
                  body={tip.body}
                />
              ))}

              <Link to="/mock-interviews" className={adminButton('primary', 'mt-auto h-10 justify-center no-underline')}>
                <span className={`${ICON} text-[18px]`}>replay</span>
                Luyện phiên mới
              </Link>
            </section>
          </div>

          {/* 4. Accordion từng câu — transcript + nhận xét thật */}
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex flex-col gap-space-sm border-b border-surface-container-high pb-space-md md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-ds-headline-sm font-bold text-slate-900">
                  Chi tiết Đánh giá Từng câu hỏi ({rows.length}/{session.questionCount || rows.length} câu)
                </h2>
                <p className="text-ds-body-sm text-slate-600">
                  Nội dung bạn đã trả lời và nhận xét chấm từ chính transcript của phiên
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                {rows.length > 0 && (
                  <span className="rounded-full bg-teal-100 px-space-md py-1 text-ds-label-md font-semibold text-teal-700 tabular-nums">
                    Trung bình: {(avgScore / 10).toFixed(1)}/10
                  </span>
                )}
                <button type="button" onClick={expandAll} className="rounded px-2 py-1 text-ds-label-md text-primary hover:underline">
                  Mở rộng tất cả
                </button>
                <button type="button" onClick={collapseAll} className="rounded px-2 py-1 text-ds-label-md text-slate-600 hover:text-slate-900">
                  Thu gọn
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <EmptyBlock
                icon="help_outline"
                title="Phiên chưa có câu trả lời nào"
                description="Bắt đầu phiên mới và trả lời ít nhất một câu để hệ thống lưu transcript và nhận xét."
              />
            ) : (
              <div className="flex flex-col gap-space-sm">
                {rows.map(row => {
                  const open = openIds.has(row.index);
                  const score = rowScore(row);
                  return (
                    <div key={row.index} className={`rounded-lg ${SOFT}`}>
                      <button
                        type="button"
                        onClick={() => toggle(row.index)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-space-md rounded-lg px-space-lg py-space-md text-left transition-colors hover:bg-slate-100"
                      >
                        <span className="flex min-w-0 items-center gap-space-md pr-space-md">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ds-label-lg font-bold ${
                            score >= 70 ? 'bg-teal-100 text-teal-700'
                              : score >= 50 ? 'bg-primary-fixed text-primary'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {row.index + 1}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="break-words text-ds-headline-sm font-semibold text-slate-900">
                              Câu {row.index + 1}: {row.question}
                            </span>
                            <span className="text-ds-body-sm text-slate-600">
                              {row.durationSec != null
                                ? `Thời lượng: ${fmtDuration(row.durationSec)}`
                                : 'Chưa ghi nhận thời lượng'}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-space-md">
                          <Pill tone={scoreTone(score)} icon="stars">{score}/100</Pill>
                          <span className={`${ICON} text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </span>
                      </button>

                      {open && (
                        <div className="grid grid-cols-1 gap-space-md px-space-lg pb-space-lg lg:grid-cols-2">
                          <div className="flex flex-col gap-1.5 rounded-lg bg-white p-space-md shadow-sm">
                            <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-slate-400">
                              <span className={`${ICON} text-[16px]`}>transcribe</span>
                              Nội dung câu trả lời
                            </span>
                            {row.answerText ? (
                              <p className="m-0 whitespace-pre-wrap text-ds-body-sm italic leading-relaxed text-slate-900">
                                “{row.answerText}”
                              </p>
                            ) : (
                              <p className="m-0 text-ds-body-sm italic text-slate-600">
                                Không có bản ghi câu trả lời.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 rounded-lg bg-teal-100/40 p-space-md">
                            <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-teal-700">
                              <span className={`${ICON} text-[16px]`}>smart_toy</span>
                              Nhận xét chuyên sâu từ AI
                            </span>
                            <p className="m-0 text-ds-body-sm leading-relaxed text-slate-900">
                              {row.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className={`${CARD} flex flex-col items-center gap-space-md p-space-2xl text-center`}>
          <span className={`${ICON} animate-pulse text-[34px] text-primary`}>insights</span>
          <p className="m-0 text-ds-headline-sm font-bold text-slate-900">
            Hệ thống đang tổng hợp báo cáo đánh giá
          </p>
          <p className="m-0 max-w-md text-ds-body-sm text-slate-600">
            Điểm 5 chiều và nhận xét từng câu được chấm tự động từ transcript phiên phỏng vấn.
            Bạn không cần tự đánh giá.
          </p>
          <button type="button" onClick={() => void autoSubmit()} className={adminButton('soft', 'h-10')}>
            <span className={`${ICON} text-[18px]`}>refresh</span>
            Thử tải lại báo cáo
          </button>
        </div>
      )}

      {/* 5. Lịch sử phỏng vấn AI & quá trình tiến bộ */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-col gap-space-sm border-b border-surface-container-high pb-space-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-ds-headline-sm font-bold text-slate-900">
              Lịch sử phỏng vấn AI &amp; Quá trình tiến bộ
            </h2>
            <p className="text-ds-body-sm text-slate-600">
              Theo dõi sự cải thiện điểm số qua các phiên luyện tập mô phỏng
            </p>
          </div>
          <Link to="/mock-interviews/history" className="text-ds-label-md font-semibold text-primary no-underline hover:underline">
            Xem tất cả
          </Link>
        </div>

        {historyRows.length === 0 ? (
          <EmptyBlock
            icon="history"
            title="Chưa có phiên luyện tập nào"
            description="Các phiên đã hoàn thành sẽ xuất hiện ở đây để bạn so sánh tiến bộ."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className={adminTableClass}>
              <thead>
                <tr>
                  <th className={adminThClass}>Ngày thực hiện</th>
                  <th className={adminThClass}>Vị trí / Chủ đề</th>
                  <th className={adminThClass}>Tiến trình</th>
                  <th className={adminThClass}>Điểm tổng</th>
                  <th className={adminThClass}>Đánh giá</th>
                  <th className={adminThClass}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map(item => {
                  const isCurrent = item.id === session.id;
                  const itemScore = isCurrent && currentScore != null ? currentScore : item.overallScore;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                      <td className={adminTdClass}>
                        <span className="flex flex-col">
                          <span>{fmtServer(item.createdAt, 'date')}</span>
                          <span className="text-ds-label-sm text-slate-400">{fmtServer(item.createdAt, 'time')}</span>
                        </span>
                      </td>
                      <td className={adminTdClass}>
                        <span className="flex flex-col">
                          <span className="font-medium text-slate-900">{titleOfSession(item)}</span>
                          <span className="text-ds-label-sm text-slate-400">{INTERVIEW_MODE_LABELS[item.mode]}</span>
                        </span>
                      </td>
                      <td className={adminTdClass}>{progressOfSession(item)}</td>
                      <td className={`${adminTdClass} font-semibold tabular-nums`}>
                        {typeof itemScore === 'number' ? `${itemScore}/100` : '—'}
                      </td>
                      <td className={adminTdClass}>
                        {item.status === 'COMPLETED' && typeof itemScore === 'number' ? (
                          <Pill tone={scoreTone(itemScore)}>{scoreBand(itemScore)}</Pill>
                        ) : item.status === 'COMPLETED' ? (
                          <Pill tone="neutral">Đã hoàn thành</Pill>
                        ) : (
                          <Pill tone="info" icon="schedule">Đang làm</Pill>
                        )}
                      </td>
                      <td className={adminTdClass}>
                        <Link
                          to={item.status === 'COMPLETED'
                            ? `/mock-interviews/${item.id}/result`
                            : `/mock-interviews/${item.id}`}
                          className={adminButton('ghost', 'h-8 no-underline')}
                        >
                          <span className={`${ICON} text-[16px]`}>
                            {item.status === 'COMPLETED' ? 'visibility' : 'play_arrow'}
                          </span>
                          {item.status === 'COMPLETED' ? 'Xem' : 'Tiếp tục'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const MockInterviewResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { result, loading, error, fetchResult } = useMockInterviewController();

  // Trạng thái accordion (UI-only): mặc định mở câu đầu tiên khi có dữ liệu.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
  }, [fetchResult, id, user]);

  useEffect(() => {
    if (result?.answers?.length) setOpenIds(new Set([result.answers[0].id]));
  }, [result]);

  const answers = useMemo(() => result?.answers ?? [], [result?.answers]);

  const insights = useMemo(() => {
    const scored = answers.filter((a): a is InterviewAnswer & { score: number } => typeof a.score === 'number');
    const correct = answers.filter(a =>
      a.correct === true || (a.correct == null && typeof a.score === 'number' && a.score >= 100));
    const wrong = answers.filter(a =>
      a.correct === false || (a.correct == null && typeof a.score === 'number' && a.score < 100));
    return {
      strengths: correct.slice(0, 3),
      improvements: [...wrong].reverse().slice(0, 3),
      avg: scored.length ? scored.reduce((sum, a) => sum + a.score, 0) / scored.length : null,
    };
  }, [answers]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className="p-10 text-ds-body-md text-slate-600">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }
  if (loading && !result) {
    return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải báo cáo..." /></div>;
  }
  if (!result) {
    return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error || 'Chưa có kết quả.'} onRetry={() => id && fetchResult(Number(id))} /></div>;
  }

  const { session } = result;

  // Phiên AVATAR (BE 012) có luồng báo cáo rubric riêng; MOCK/KNOWLEDGE giữ màn chấm điểm cũ.
  if (session.mode === 'AVATAR') {
    return <AvatarReportView sessionId={session.id} />;
  }

  const total = result.totalQuestions ?? session.questions?.length ?? answers.length;
  const answeredCount = answers.length;
  const correctCount = result.correctCount
    ?? answers.filter(a => a.correct === true || (a.correct == null && typeof a.score === 'number' && a.score >= 100)).length;
  const wrongCount = answers.filter(
    a => a.correct === false || (a.correct == null && typeof a.score === 'number' && a.score < 100),
  ).length;
  const unansweredCount = Math.max(total - answeredCount, 0);
  const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
  const overall = result.score ?? session.overallScore ?? 0;
  const pctOfTotal = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const roleLabel = session.mode === 'MOCK' ? (session.jobTitle || 'Phiên luyện tập') : (session.topic || 'Luyện tập kiến thức');
  const totalSec = answers.reduce((sum, a) => sum + (a.durationSec ?? 0), 0);

  const toggle = (qid: number) =>
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid); else next.add(qid);
      return next;
    });
  const expandAll = () => setOpenIds(new Set(answers.map(a => a.id)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <div className="flex flex-col gap-space-xl">
      {/* 1. Đầu trang: breadcrumb + chip id + tiêu đề + meta thật + action */}
      <div className="flex flex-col gap-space-lg lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-slate-600">
            <Link to="/dashboard" className="no-underline text-slate-600 hover:text-primary">Trang chủ</Link>
            <span className={`${ICON} text-slate-400 text-[14px]`}>chevron_right</span>
            <Link to="/mock-interviews/history" className="no-underline text-slate-600 hover:text-primary">Lịch sử &amp; Đánh giá</Link>
            <span className={`${ICON} text-slate-400 text-[14px]`}>chevron_right</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-900">
              Báo cáo kết quả phiên phỏng vấn
              <span className="rounded bg-slate-200 px-space-xs py-0.5 text-ds-label-sm text-slate-900">
                #PT-{session.id}
              </span>
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <h1 className="text-ds-headline-xl font-bold tracking-tight text-slate-900">Báo cáo Đánh giá Phỏng vấn AI</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-space-md py-1 text-ds-label-md text-teal-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
              {session.status === 'COMPLETED' ? `Hoàn thành: ${fmtServer(session.completedAt ?? session.createdAt, 'datetime')}` : 'Phiên chưa kết thúc'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-lg pt-1 text-ds-body-sm text-slate-600">
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-primary`}>badge</span>
              <span className="font-medium text-slate-900">Vị trí / Chủ đề:</span>
              <span>{roleLabel}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-slate-400`}>timelapse</span>
              <span className="font-medium text-slate-900">Thời lượng:</span>
              <span>
                {totalSec > 0 ? `${Math.round(totalSec / 60)} phút` : 'chưa ghi nhận'}
                {` (Trả lời ${answeredCount}/${total} câu)`}
              </span>
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-teal-600`}>task_alt</span>
              <span className="font-medium text-slate-900">Số câu đúng:</span>
              <span className="font-semibold text-slate-900 tabular-nums">{correctCount}/{total}</span>
            </span>
            {session.companyName && (
              <>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-[18px] text-slate-400`}>business</span>
                  <span>{session.companyName}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
          <button type="button" onClick={() => window.print()} className={adminButton('ghost', 'h-10')}>
            <span className={`${ICON} text-[18px] text-slate-400`}>download</span>
            Xuất báo cáo PDF
          </button>
          <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>add_circle</span>
            Luyện phiên mới
          </Link>
        </div>
      </div>

      {/* 2. Điểm tổng hợp + thống kê trắc nghiệm thật từ API */}
      <div className={`${CARD} relative flex flex-col gap-space-xl overflow-hidden p-space-lg xl:flex-row xl:items-stretch`}>
        <span className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl" />
        <div className={`relative z-10 flex min-w-[280px] flex-col items-center justify-center gap-space-sm rounded-xl p-space-md text-center ${SOFT}`}>
          <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-primary">Điểm số tổng hợp</span>
          <ScoreRing value={overall} caption={scoreBand(overall)} size={176} />
          <Pill tone={scoreTone(overall)} icon="verified">Đúng {correctCount}/{total} câu</Pill>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between gap-space-lg">
          <div>
            <div className="mb-space-md flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-space-sm">
              <h2 className="text-ds-headline-sm font-bold text-slate-900">Kết quả trắc nghiệm</h2>
              <span className="text-ds-label-sm uppercase tracking-wider text-slate-400">
                {answeredCount}/{total} câu đã trả lời
              </span>
            </div>

            <div className="grid grid-cols-2 gap-space-md md:grid-cols-4">
              <Stat icon="task_alt" label="Câu đúng" value={`${correctCount}`} tone="text-teal-600" />
              <Stat icon="cancel" label="Câu sai" value={`${wrongCount}`} tone="text-error" />
              <Stat icon="help" label="Chưa trả lời" value={`${unansweredCount}`} tone="text-slate-500" />
              <Stat icon="percent" label="Tỷ lệ đúng" value={`${accuracy}%`} tone="text-primary" />
            </div>

            <div className="mt-space-lg">
              <div className="mb-1.5 flex items-center justify-between text-ds-label-sm text-slate-600">
                <span>Phân bố kết quả</span>
                <span className="tabular-nums">{total} câu</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-teal-600 transition-all" style={{ width: `${pctOfTotal(correctCount)}%` }} title={`Đúng ${correctCount}`} />
                <div className="h-full bg-error transition-all" style={{ width: `${pctOfTotal(wrongCount)}%` }} title={`Sai ${wrongCount}`} />
                <div className="h-full bg-slate-200 transition-all" style={{ width: `${pctOfTotal(unansweredCount)}%` }} title={`Chưa trả lời ${unansweredCount}`} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-space-md text-ds-label-sm text-slate-600">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-600" /> Đúng {correctCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error" /> Sai {wrongCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-200" /> Chưa trả lời {unansweredCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-md pt-space-sm text-ds-body-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className={`${ICON} text-[16px] text-primary`}>info</span>
              Điểm tổng: {overall}/100 • Thời gian làm bài: {totalSec > 0 ? fmtDuration(totalSec) : 'chưa ghi nhận'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Câu đúng / Câu sai / Tổng kết */}
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <span className={`${ICON} text-[24px]`}>task_alt</span>
            </span>
            <div className="flex flex-col">
              <h3 className="text-ds-headline-sm font-bold text-slate-900">Câu trả lời đúng</h3>
              <span className="text-ds-label-sm text-teal-600">
                {correctCount} câu chọn đúng đáp án
              </span>
            </div>
          </div>
          {insights.strengths.length === 0 ? (
            <p className="m-0 rounded-lg bg-slate-50 p-space-md text-ds-body-sm text-slate-600">
              Chưa có câu trả lời đúng trong phiên này.
            </p>
          ) : insights.strengths.map(a => (
            <InsightItem
              key={a.id}
              icon="check_circle"
              iconClass="text-teal-600"
              title={`Câu ${a.questionIndex + 1}: ${a.question}`}
              body={a.feedback ?? 'Chọn đúng đáp án.'}
              meta={`${a.score ?? 100}/100${a.durationSec != null ? ` • trả lời ${fmtDuration(a.durationSec)}` : ''}`}
            />
          ))}
        </div>

        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <span className={`${ICON} text-[24px]`}>cancel</span>
            </span>
            <div className="flex flex-col">
              <h3 className="text-ds-headline-sm font-bold text-slate-900">Câu trả lời sai</h3>
              <span className="text-ds-label-sm text-error">{wrongCount} câu cần xem lại</span>
            </div>
          </div>
          {insights.improvements.length === 0 ? (
            <p className="m-0 rounded-lg bg-slate-50 p-space-md text-ds-body-sm text-slate-600">
              Không có câu trả lời sai trong phiên này.
            </p>
          ) : insights.improvements.map(a => (
            <InsightItem
              key={a.id}
              icon="report_problem"
              iconClass="text-error"
              title={`Câu ${a.questionIndex + 1}: ${a.question}`}
              body={a.feedback ?? (a.correctAnswer ? `Đáp án đúng: ${a.correctAnswer}` : 'Chưa có nhận xét kèm theo câu này.')}
              meta={`${a.score ?? 0}/100${a.durationSec != null ? ` • trả lời ${fmtDuration(a.durationSec)}` : ''}`}
            />
          ))}
        </div>

        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <span className={`${ICON} text-[24px]`}>summarize</span>
            </span>
            <div className="flex flex-col">
              <h3 className="text-ds-headline-sm font-bold text-slate-900">Tổng kết phiên</h3>
              <span className="text-ds-label-sm text-primary">Số liệu thật từ bài làm</span>
            </div>
          </div>
          <InsightItem
            icon="percent"
            iconClass="text-primary"
            title={`Tỷ lệ trả lời đúng: ${accuracy}%`}
            body={`Bạn chọn đúng ${correctCount}/${answeredCount} câu đã trả lời, trên tổng ${total} câu của phiên.`}
          />
          <InsightItem
            icon="pending_actions"
            iconClass="text-slate-500"
            title={`Còn ${unansweredCount} câu chưa trả lời`}
            body={unansweredCount === 0
              ? 'Bạn đã hoàn thành toàn bộ câu hỏi của phiên.'
              : 'Các câu bỏ trống không được tính đúng; hãy luyện lại để hoàn thành đủ bộ câu hỏi.'}
          />
          <InsightItem
            icon="lightbulb"
            iconClass="text-primary"
            title={accuracy >= 80 ? 'Bạn đang nắm rất tốt' : 'Ưu tiên ôn lại câu sai'}
            body={accuracy >= 80
              ? 'Tiếp tục luyện với chủ đề khó hơn để duy trì phong độ.'
              : 'Mở chi tiết từng câu bên dưới để xem đáp án đúng và ghi chú lại kiến thức còn thiếu.'}
          />
          <Link to="/mock-interviews" className={adminButton('primary', 'mt-auto h-10 justify-center no-underline')}>
            <span className={`${ICON} text-[18px]`}>replay</span>
            Luyện phiên mới
          </Link>
        </div>
      </div>

      {/* 4. Accordion từng câu hỏi (dữ liệu thật) */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-col gap-space-sm border-b border-surface-container-high pb-space-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-ds-headline-sm font-bold text-slate-900">
              Chi tiết từng câu hỏi ({answeredCount}/{total} câu)
            </h2>
            <p className="text-ds-body-sm text-slate-600">
              Đáp án bạn đã chọn, đáp án đúng và nhận xét chấm điểm của hệ thống
            </p>
          </div>
          <div className="flex items-center gap-space-sm">
            {insights.avg != null && (
              <span className="rounded-full bg-teal-100 px-space-md py-1 text-ds-label-md font-semibold text-teal-700 tabular-nums">
                Trung bình: {(insights.avg / 10).toFixed(1)}/10
              </span>
            )}
            <button type="button" onClick={expandAll} className="rounded px-2 py-1 text-ds-label-md text-primary hover:underline">
              Mở rộng tất cả
            </button>
            <button type="button" onClick={collapseAll} className="rounded px-2 py-1 text-ds-label-md text-slate-600 hover:text-slate-900">
              Thu gọn
            </button>
          </div>
        </div>

        {answers.length === 0 ? (
          <EmptyBlock icon="help_outline" title="Phiên chưa có câu hỏi nào" description="Bắt đầu một phiên luyện tập để hệ thống lưu câu hỏi và điểm từng câu." />
        ) : (
          <div className="flex flex-col gap-space-sm">
            {answers.map(a => {
              const open = openIds.has(a.id);
              const options = a.options ?? [];
              const hasOptions = options.length > 0;
              const isCorrect = a.correct === true
                || (a.correct == null && typeof a.score === 'number' && a.score >= 100);
              const isWrong = a.correct === false
                || (a.correct == null && typeof a.score === 'number' && a.score < 100);
              return (
                <div key={a.id} className={`rounded-lg ${SOFT}`}>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-space-md rounded-lg px-space-lg py-space-md text-left transition-colors hover:bg-slate-100"
                  >
                    <span className="flex min-w-0 items-center gap-space-md pr-space-md">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ds-label-lg font-bold ${
                        isCorrect ? 'bg-teal-100 text-teal-700'
                          : isWrong ? 'bg-red-100 text-red-700'
                            : 'bg-primary-fixed text-primary'
                      }`}>
                        {a.questionIndex + 1}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="break-words text-ds-headline-sm font-semibold text-slate-900">{a.question}</span>
                        <span className="text-ds-body-sm text-slate-600">
                          {a.durationSec != null ? `Thời lượng trả lời: ${fmtDuration(a.durationSec)}` : 'Chưa ghi nhận thời lượng'}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-space-md">
                      {isCorrect ? (
                        <Pill tone="success" icon="check_circle">{a.score ?? 100}/100</Pill>
                      ) : isWrong ? (
                        <Pill tone="danger" icon="cancel">{a.score ?? 0}/100</Pill>
                      ) : typeof a.score === 'number' ? (
                        <Pill tone={scoreTone(a.score)}>{a.score}/100</Pill>
                      ) : (
                        <span className="text-ds-label-md text-slate-400">Chưa chấm</span>
                      )}
                      <span className={`${ICON} text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
                    </span>
                  </button>

                  {open && (
                    <div className="grid grid-cols-1 gap-space-md px-space-lg pb-space-lg lg:grid-cols-2">
                      {hasOptions ? (
                        <div className="flex flex-col gap-2 rounded-lg bg-white p-space-md shadow-sm lg:col-span-2">
                          <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase tracking-wide text-slate-400">
                            <span className={`${ICON} text-[16px]`}>checklist</span>
                            Các lựa chọn của câu hỏi
                          </span>
                          <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {options.map((opt, i) => {
                              const correctOpt = isCorrectOption(a, opt, i);
                              const chosenOpt = isChosenOption(a, opt, i);
                              return (
                                <li
                                  key={`${a.id}-${i}`}
                                  className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2 text-ds-body-sm ${
                                    correctOpt
                                      ? 'border-secondary-teal bg-teal-100/40'
                                      : chosenOpt
                                        ? 'border-error bg-red-100/40'
                                        : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ds-label-sm font-bold ${
                                    correctOpt ? 'bg-teal-600 text-white'
                                      : chosenOpt ? 'bg-error text-white'
                                        : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {OPTION_LETTER(i)}
                                  </span>
                                  <span className={`min-w-0 flex-1 break-words ${
                                    correctOpt || chosenOpt ? 'font-medium text-slate-900' : 'text-slate-600'
                                  }`}>
                                    {opt}
                                  </span>
                                  {correctOpt && chosenOpt && <Pill tone="success" icon="check_circle">Bạn chọn · Đúng</Pill>}
                                  {correctOpt && !chosenOpt && <Pill tone="success" icon="check_circle">Đáp án đúng</Pill>}
                                  {chosenOpt && !correctOpt && <Pill tone="danger" icon="cancel">Bạn chọn</Pill>}
                                </li>
                              );
                            })}
                          </ul>
                          {a.answerText && a.selectedOptionIndex == null && (
                            <p className="m-0 text-ds-body-sm text-slate-600">
                              Bạn chọn: <span className="font-semibold text-slate-900">{a.answerText}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 rounded-lg bg-white p-space-md shadow-sm">
                          <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-slate-400">
                            <span className={`${ICON} text-[16px]`}>transcribe</span>
                            Nội dung câu trả lời
                          </span>
                          {a.answerText ? (
                            <p className="m-0 whitespace-pre-wrap text-ds-body-sm italic leading-relaxed text-slate-900">
                              {a.answerText}
                            </p>
                          ) : (
                            <p className="m-0 text-ds-body-sm italic text-slate-600">Không có bản ghi câu trả lời.</p>
                          )}
                        </div>
                      )}
                      <div className={`flex flex-col gap-1.5 rounded-lg p-space-md ${
                        isCorrect ? 'bg-teal-100/40' : isWrong ? 'bg-red-100/30' : 'bg-teal-100/40'
                      } ${hasOptions ? 'lg:col-span-2' : ''}`}>
                        <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-teal-700">
                          <span className={`${ICON} text-[16px]`}>psychology</span>
                          Nhận xét kèm theo
                        </span>
                        <p className="m-0 text-ds-body-sm leading-relaxed text-slate-900">
                          {a.feedback ?? 'Câu này chưa có nhận xét.'}
                        </p>
                        {a.correctAnswer && (
                          <p className="m-0 mt-1 text-ds-label-sm text-slate-600">
                            Đáp án đúng: <span className="font-semibold text-slate-900">{a.correctAnswer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className={`flex flex-wrap items-center justify-between gap-space-md rounded-xl p-space-lg ${SOFT}`}>
        <span className="flex items-center gap-space-sm">
          <span className={`${ICON} text-[20px] text-primary`}>history</span>
          <span className="text-ds-body-sm text-slate-600">So sánh phiên này với các phiên trước.</span>
        </span>
        <Link to="/mock-interviews/history" className={adminButton('ghost', 'h-10 no-underline')}>
          Xem lịch sử luyện tập
          <span className={`${ICON} text-[18px]`}>arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};

export default MockInterviewResultPage;
