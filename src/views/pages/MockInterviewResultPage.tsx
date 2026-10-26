/**
 * Màn "Báo cáo Đánh giá Phỏng vấn AI" (mockup Stitch `screen_10`, phần trên) —
 * route /mock-interviews/:id/result, shell CandidateLayout.
 *
 * Số thật: GET /interviews/{id}/result -> session.overallScore, session.mode/jobTitle/topic/
 * companyName/questions, từng answer (question, answerText, durationSec, score, feedback).
 * "Điểm mạnh" / "Cần cải thiện" dựng từ chính danh sách câu trả lời đã được chấm (điểm cao/thấp),
 * không bịa nhận định.
 *
 * Sao đổi so với mockup:
 * - Bỏ máy nghe + sóng âm từng câu (FE không nhận bản ghi âm nào) -> trong mỗi câu chỉ còn
 *   "Nội dung trả lời" + "Nhận xét kèm theo".
 * - Bỏ "Hệ thống AI Model: TalentNexus Core v4.2" (tên mô hình không có trong dữ liệu).
 * - "Thời lượng 28 phút" = tổng durationSec các câu đã trả lời; "Cao hơn 78% ứng viên cùng vị trí"
 *   và bảng "Năng lực cốt lõi" (4 thanh 90/82/88/79) giữ nguyên chữ thiết kế + dán nhãn "Khối demo".
 * - Chip "#INT-8492" -> id phiên thật.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import {
  AVATAR_RUBRIC_VERSION, InterviewAnswer, InterviewRubric, RUBRIC_DIMENSIONS,
} from '../../models/Interview.model';
import {
  DemoTag, EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pill, adminButton, fmtServer,
} from '../components/adminKit';
import { CARD, SOFT, ScoreRing } from '../components/candidateKit';

/** Nhãn dải điểm — dẫn xuất từ điểm thật, không phải nhận định mới. */
const scoreBand = (score: number) =>
  score >= 90 ? 'Xuất sắc' : score >= 80 ? 'Tốt' : score >= 70 ? 'Khá tốt' : score >= 50 ? 'Cần cải thiện' : 'Cần cố gắng';

const scoreTone = (score: number): 'success' | 'primary' | 'warning' | 'danger' =>
  score >= 80 ? 'success' : score >= 70 ? 'primary' : score >= 50 ? 'warning' : 'danger';

const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const COMPETENCIES = [
  { icon: 'terminal', label: 'Kiến thức chuyên môn', score: 90, bar: 'w-[90%] bg-primary', note: 'Khả năng nắm bắt sâu kiến trúc, cấu trúc dữ liệu và cơ chế render.' },
  { icon: 'psychology', label: 'Tư duy giải quyết vấn đề', score: 82, bar: 'w-[82%] bg-primary-container', note: 'Phương pháp bẻ nhỏ vấn đề logic, giải pháp quản lý trạng thái tinh gọn.' },
  { icon: 'groups', label: 'Giao tiếp & Trình bày', score: 88, bar: 'w-[88%] bg-secondary-teal', note: 'Cấu trúc câu trả lời mạch lạc, đúng trọng tâm giám khảo cần.' },
  { icon: 'speed', label: 'Tốc độ phản hồi', score: 79, bar: 'w-[79%] bg-tertiary', note: 'Nhịp trả lời và thời gian suy nghĩ trước mỗi câu hỏi mở.' },
];

/** Một item trong cột Điểm mạnh / Cần cải thiện — dựng từ answer thật. */
const InsightItem: React.FC<{ icon: string; iconClass: string; title: string; body: string; meta?: string }> = ({
  icon, iconClass, title, body, meta,
}) => (
  <div className={`flex items-start gap-space-sm rounded-lg p-space-md ${SOFT}`}>
    <span className={`${ICON} mt-0.5 shrink-0 text-[20px] ${iconClass}`}>{icon}</span>
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-semibold text-on-surface">{title}</span>
      <p className="m-0 text-ds-body-sm text-on-surface-variant">{body}</p>
      {meta && <span className="text-ds-label-sm text-outline">{meta}</span>}
    </div>
  </div>
);

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));

/**
 * Báo cáo phiên AVATAR (mockup 2 + BE 012): finish xong BE chưa có điểm -> `GET /report` 404,
 * màn hiện form tự đánh rubric 5 chiều (0..100) + 2 ô điểm mạnh/cần cải thiện (trần 4000 ký tự),
 * nộp qua `POST /{id}/evaluation`; overall do BE tính từ trung bình 5 chiều.
 */
const AvatarReportView: React.FC<{ sessionId: number }> = ({ sessionId }) => {
  const { user } = useAuth();
  const {
    result, report, reportMissing, loading, error,
    fetchResult, loadReport, submitEvaluation, clearMessages,
  } = useMockInterviewController();
  const [rubric, setRubric] = useState<InterviewRubric>({
    chuyenMon: 70, duAn: 70, tuDuy: 70, truyenDat: 70, mucKhop: 70,
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchResult(sessionId);
  }, [user, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result?.session.mode === 'AVATAR' && result.session.status === 'COMPLETED') {
      void loadReport(sessionId);
    }
  }, [result, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const session = result?.session;
  const transcript = result?.transcript ?? [];
  const confirmed = transcript.filter(t => t.confirmed);
  const totalSec = transcript.reduce((sum, t) => sum + (t.durationSec ?? 0), 0);

  if (!session) {
    return loading
      ? <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải báo cáo..." /></div>
      : <div className={`${CARD} p-space-lg`}><ErrorBlock message={error || 'Không tìm thấy phiên phỏng vấn.'} onRetry={() => void fetchResult(sessionId)} /></div>;
  }

  const submit = async () => {
    setBusy(true);
    clearMessages();
    await submitEvaluation(sessionId, {
      rubric,
      rubricVersion: AVATAR_RUBRIC_VERSION,
      strengths: strengths.trim() || undefined,
      improvements: improvements.trim() || undefined,
    });
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="flex flex-col gap-space-lg lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-on-surface-variant">
            <Link to="/dashboard" className="no-underline text-on-surface-variant hover:text-primary">Trang chủ</Link>
            <span className={`${ICON} text-outline text-[14px]`}>chevron_right</span>
            <Link to="/mock-interviews/history" className="no-underline text-on-surface-variant hover:text-primary">Lịch sử &amp; Đánh giá</Link>
            <span className={`${ICON} text-outline text-[14px]`}>chevron_right</span>
            <span className="flex items-center gap-1.5 font-semibold text-on-surface">
              Báo cáo phiên Video Call AI
              <span className="rounded bg-surface-container-high px-space-xs py-0.5 text-ds-label-sm text-on-surface">#AV-{session.id}</span>
            </span>
          </nav>
          <h1 className="pt-space-xs text-ds-headline-xl font-bold tracking-tight text-on-surface">
            {session.jobTitle ?? 'Phòng phỏng vấn AVATAR'}
          </h1>
          <div className="flex flex-wrap items-center gap-space-lg pt-1 text-ds-body-sm text-on-surface-variant">
            <span>{session.companyName ?? 'Luyện với AI'}</span>
            <span>{confirmed.length} lượt đã chốt</span>
            {totalSec > 0 && <span>~{Math.round(totalSec / 60)} phút trả lời</span>}
            <span>Bắt đầu {fmtServer(session.createdAt, 'datetime')}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <Link to={`/mock-interviews/${session.id}`} className={adminButton('ghost', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>subtitles</span>
            Xem lại transcript
          </Link>
          <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>add_circle</span>
            Luyện phiên mới
          </Link>
        </div>
      </div>

      {error && <ErrorBlock message={error} />}

      {session.status !== 'COMPLETED' ? (
        <div className={`${CARD} flex flex-col items-center gap-space-md p-space-2xl text-center`}>
          <span className={`${ICON} text-[34px] text-primary`}>videocam</span>
          <p className="m-0 text-ds-headline-sm font-bold text-on-surface">Phiên vẫn đang mở</p>
          <p className="m-0 max-w-md text-ds-body-sm text-on-surface-variant">
            Kết thúc phiên trong phòng phỏng vấn để mở rubric tự đánh 5 chiều.
          </p>
          <Link to={`/mock-interviews/${session.id}`} className={adminButton('primary', 'h-11 no-underline')}>
            Tiếp tục phiên
          </Link>
        </div>
      ) : report ? (
        <div className={`${CARD} flex flex-col gap-space-xl p-space-xl`}>
          <div className="flex flex-col items-center gap-space-lg md:flex-row md:items-start">
            <ScoreRing value={report.overallScore} caption={scoreBand(report.overallScore)} size={176} />
            <div className="flex min-w-0 flex-1 flex-col gap-space-md">
              <h2 className="text-ds-headline-sm font-bold text-on-surface">Rubric 5 chiều bạn đã nộp</h2>
              {RUBRIC_DIMENSIONS.map(d => {
                const v = report[d.key];
                return (
                  <div key={d.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-ds-label-md">
                      <span className="font-semibold text-on-surface">{d.label}</span>
                      <span className="tabular-nums text-on-surface-variant">{v}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-ds-label-sm text-outline">
                Điểm tổng = trung bình cộng 5 chiều do hệ thống tính · thang đánh giá {report.rubricVersion}
              </p>
            </div>
          </div>
          {(report.strengths || report.improvements) && (
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              {report.strengths && (
                <div className="rounded-lg bg-secondary-container/40 p-space-lg">
                  <span className="flex items-center gap-1.5 text-ds-label-lg font-bold text-secondary-teal">
                    <span className={`${ICON} text-[18px]`}>verified</span> Điểm mạnh của bạn
                  </span>
                  <p className="m-0 mt-2 whitespace-pre-line text-ds-body-md text-on-surface">{report.strengths}</p>
                </div>
              )}
              {report.improvements && (
                <div className="rounded-lg bg-tertiary-fixed/60 p-space-lg">
                  <span className="flex items-center gap-1.5 text-ds-label-lg font-bold text-on-tertiary-fixed-variant">
                    <span className={`${ICON} text-[18px]`}>north_east</span> Cần cải thiện
                  </span>
                  <p className="m-0 mt-2 whitespace-pre-line text-ds-body-md text-on-surface">{report.improvements}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : reportMissing ? (
        <div className={`${CARD} flex flex-col gap-space-lg p-space-xl`}>
          <div>
            <h2 className="flex items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
              <span className={`${ICON} text-primary`}>rate_review</span>
              Tự đánh giá phiên theo rubric 5 chiều
            </h2>
            <p className="mt-1 text-ds-body-sm text-on-surface-variant">
              Phiên video call không có hội đồng chấm tự động — bạn kéo thanh điểm cho từng chiều,
              điểm tổng được tính bằng trung bình cộng 5 chiều.
            </p>
          </div>
          {RUBRIC_DIMENSIONS.map(d => (
            <div key={d.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-ds-label-lg">
                <span className="font-semibold text-on-surface">{d.label}</span>
                <span className="tabular-nums text-primary">{rubric[d.key]}/100</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={rubric[d.key]}
                onChange={e => setRubric(prev => ({ ...prev, [d.key]: clampScore(Number(e.target.value)) }))}
                className="w-full accent-[#4f46e5]"
                aria-label={`Điểm ${d.label}`}
              />
              <span className="text-ds-label-sm text-outline">{d.hint}</span>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <label className="flex flex-col gap-1 text-ds-label-lg font-semibold text-on-surface">
              Điểm mạnh muốn ghi vào báo cáo
              <textarea
                value={strengths}
                maxLength={4000}
                onChange={e => setStrengths(e.target.value)}
                placeholder="vd. Trả lời đúng trọng tâm phần kiến trúc, dẫn chứng dự án rõ ràng..."
                className="min-h-[110px] w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-ds-body-sm font-normal text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-ds-label-lg font-semibold text-on-surface">
              Điểm cần cải thiện
              <textarea
                value={improvements}
                maxLength={4000}
                onChange={e => setImprovements(e.target.value)}
                placeholder="vd. Thiếu số liệu định lượng ở phần Result của STAR..."
                className="min-h-[110px] w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-ds-body-sm font-normal text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-surface-container-high pt-space-lg">
            <span className="text-ds-label-md text-outline tabular-nums">
              Điểm tổng dự kiến: {clampScore(Object.values(rubric).reduce((a, b) => a + b, 0) / RUBRIC_DIMENSIONS.length)}/100
            </span>
            <button type="button" onClick={() => void submit()} disabled={busy} className={adminButton('primary', 'h-11 disabled:opacity-40')}>
              <span className={`${ICON} text-[18px]`}>assignment_turned_in</span>
              Nộp rubric &amp; xem báo cáo
            </button>
          </div>
        </div>
      ) : (
        <div className={`${CARD} p-space-xl`}><LoadingBlock label="Đang tải báo cáo..." /></div>
      )}

      {confirmed.length > 0 && (
        <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <h2 className="flex items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
            <span className={`${ICON} text-primary`}>forum</span>
            Transcript phiên ({confirmed.length} lượt đã chốt)
          </h2>
          <div className="flex flex-col">
            {confirmed.map(t => (
              <div key={t.index} className="flex flex-col gap-2 border-b border-surface-container-low py-space-md last:border-b-0">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-ds-label-sm font-bold text-on-primary-fixed-variant">AI</span>
                  <p className="m-0 flex-1 text-ds-body-md text-on-surface">{t.questionText}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-ds-label-sm font-bold text-on-secondary-container">Bạn</span>
                  <div className="flex-1">
                    <p className="m-0 whitespace-pre-line text-ds-body-md text-on-surface">{t.answerText}</p>
                    <span className="text-ds-label-sm text-outline">
                      {t.durationSec != null ? `${fmtDuration(t.durationSec)} · ` : ''}
                      {t.answeredAt ? fmtServer(t.answeredAt, 'time') : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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

  const answers = result?.answers ?? [];

  const insights = useMemo(() => {
    const scored = answers.filter((a): a is InterviewAnswer & { score: number } => typeof a.score === 'number');
    const byScore = [...scored].sort((a, b) => b.score - a.score);
    return {
      strengths: byScore.filter(a => a.score >= 80).slice(0, 3),
      improvements: byScore.filter(a => a.score < 80).reverse().slice(0, 3),
      avg: byScore.length ? byScore.reduce((sum, a) => sum + a.score, 0) / byScore.length : null,
    };
  }, [answers]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className="p-10 text-ds-body-md text-on-surface-variant">
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

  const answered = answers.filter(a => a.answerText);
  const overall = session.overallScore ?? 0;
  const total = session.questions?.length ?? answers.length;
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
          <nav className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-on-surface-variant">
            <Link to="/dashboard" className="no-underline text-on-surface-variant hover:text-primary">Trang chủ</Link>
            <span className={`${ICON} text-outline text-[14px]`}>chevron_right</span>
            <Link to="/mock-interviews/history" className="no-underline text-on-surface-variant hover:text-primary">Lịch sử &amp; Đánh giá</Link>
            <span className={`${ICON} text-outline text-[14px]`}>chevron_right</span>
            <span className="flex items-center gap-1.5 font-semibold text-on-surface">
              Báo cáo kết quả phiên phỏng vấn
              <span className="rounded bg-surface-container-high px-space-xs py-0.5 text-ds-label-sm text-on-surface">
                #PT-{session.id}
              </span>
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <h1 className="text-ds-headline-xl font-bold tracking-tight text-on-surface">Báo cáo Đánh giá Phỏng vấn AI</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-space-md py-1 text-ds-label-md text-on-secondary-container">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-teal" />
              {session.status === 'COMPLETED' ? `Hoàn thành: ${fmtServer(session.completedAt ?? session.createdAt, 'datetime')}` : 'Phiên chưa kết thúc'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-lg pt-1 text-ds-body-sm text-on-surface-variant">
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-primary`}>badge</span>
              <span className="font-medium text-on-surface">Vị trí / Chủ đề:</span>
              <span>{roleLabel}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-outline`}>timelapse</span>
              <span className="font-medium text-on-surface">Thời lượng:</span>
              <span>
                {totalSec > 0 ? `${Math.round(totalSec / 60)} phút` : 'chưa ghi nhận'}
                {` (Trả lời ${answered.length}/${total} câu hỏi)`}
              </span>
            </span>
            {session.companyName && (
              <>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-[18px] text-outline`}>business</span>
                  <span>{session.companyName}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
          <button type="button" onClick={() => window.print()} className={adminButton('ghost', 'h-10')}>
            <span className={`${ICON} text-[18px] text-outline`}>download</span>
            Xuất báo cáo PDF
          </button>
          <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px]`}>add_circle</span>
            Luyện phiên mới
          </Link>
        </div>
      </div>

      {/* 2. Điểm tổng hợp + năng lực cốt lõi */}
      <div className={`${CARD} relative flex flex-col gap-space-xl overflow-hidden p-space-lg xl:flex-row xl:items-stretch`}>
        <span className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl" />
        <div className={`relative z-10 flex min-w-[280px] flex-col items-center justify-center gap-space-sm rounded-xl p-space-md text-center ${SOFT}`}>
          <span className="text-ds-label-sm font-semibold uppercase tracking-wider text-primary">Điểm số Tổng hợp</span>
          <ScoreRing value={overall} caption={scoreBand(overall)} size={176} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-space-md py-1 text-ds-body-sm shadow-sm">
            <span className={`${ICON} text-[16px] text-secondary-teal`}>trending_up</span>
            <span className="font-semibold text-on-surface">Cao hơn 78%</span>
            <span className="text-on-surface-variant">ứng viên cùng vị trí</span>
          </span>
          <DemoTag>Khối demo — chưa có mức so sánh</DemoTag>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between gap-space-lg">
          <div>
            <div className="mb-space-md flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-space-sm">
              <h2 className="flex flex-wrap items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
                Phân tích Năng lực Cốt lõi
                <DemoTag>Khối demo</DemoTag>
              </h2>
              <span className="text-ds-label-sm uppercase tracking-wider text-outline">Hệ thống trọng số chuẩn (bản mẫu)</span>
            </div>
            <div className="grid grid-cols-1 gap-x-space-xl gap-y-space-md md:grid-cols-2">
              {COMPETENCIES.map(m => (
                <div key={m.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-ds-body-sm">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className={`${ICON} text-[18px] text-primary`}>{m.icon}</span>
                      {m.label}
                    </span>
                    <span className="font-bold text-on-surface tabular-nums">
                      {m.score}
                      <span className="text-ds-label-sm text-outline">/100</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
                    <div className={`h-full rounded-full ${m.bar}`} />
                  </div>
                  <span className="text-ds-label-sm text-on-surface-variant">{m.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md pt-space-sm text-ds-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className={`${ICON} text-[16px] text-primary`}>info</span>
              Điểm thật của phiên: {overall}/100 • câu trả lời có điểm: {insights.avg == null ? 0 : answers.filter(a => typeof a.score === 'number').length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Điểm mạnh / Cần cải thiện / Gợi ý */}
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <span className={`${ICON} text-[24px]`}>task_alt</span>
            </span>
            <div className="flex flex-col">
              <h3 className="text-ds-headline-sm font-bold text-on-surface">Điểm mạnh nổi bật</h3>
              <span className="text-ds-label-sm text-secondary-teal">
                {insights.strengths.length} câu đạt từ 80/100
              </span>
            </div>
          </div>
          {insights.strengths.length === 0 ? (
            <p className="m-0 rounded-lg bg-surface-container-low p-space-md text-ds-body-sm text-on-surface-variant">
              Chưa có câu nào đạt từ 80/100 trong phiên này.
            </p>
          ) : insights.strengths.map(a => (
            <InsightItem
              key={a.id}
              icon="check_circle"
              iconClass="text-secondary-teal"
              title={`Câu ${a.questionIndex + 1}: ${a.question}`}
              body={a.feedback ?? 'AI ghi nhận nội dung trả lời đủ ý.'}
              meta={`${a.score}/100${a.durationSec != null ? ` • trả lời ${fmtDuration(a.durationSec)}` : ''}`}
            />
          ))}
        </div>

        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
              <span className={`${ICON} text-[24px]`}>troubleshoot</span>
            </span>
            <div className="flex flex-col">
              <h3 className="text-ds-headline-sm font-bold text-on-surface">Cần cải thiện</h3>
              <span className="text-ds-label-sm text-primary">Các câu còn dưới mức 80/100</span>
            </div>
          </div>
          {insights.improvements.length === 0 ? (
            <p className="m-0 rounded-lg bg-surface-container-low p-space-md text-ds-body-sm text-on-surface-variant">
              Mọi câu đã trả lời đều đạt từ 80/100 — không có câu cần sửa ưu tiên.
            </p>
          ) : insights.improvements.map(a => (
            <InsightItem
              key={a.id}
              icon="report_problem"
              iconClass="text-outline-strong"
              title={`Câu ${a.questionIndex + 1}: ${a.question}`}
              body={a.feedback ?? 'Chưa có nhận xét kèm theo câu này.'}
              meta={`${a.score}/100${a.durationSec != null ? ` • trả lời ${fmtDuration(a.durationSec)}` : ''}`}
            />
          ))}
        </div>

        <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
          <div className="flex items-center gap-space-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <span className={`${ICON} text-[24px]`}>auto_awesome</span>
            </span>
            <div className="flex flex-col">
              <h3 className="flex flex-wrap items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
                Gợi ý từ AI Mentor
                <DemoTag>Khối demo</DemoTag>
              </h3>
              <span className="text-ds-label-sm text-primary">Lộ trình rèn luyện cá nhân hóa (bản mẫu)</span>
            </div>
          </div>
          <InsightItem icon="school" iconClass="text-primary" title="Khóa học đề xuất cho bạn" body='Tập trung tối ưu quy mô lớn và Micro-Frontends.' />
          <InsightItem icon="code_blocks" iconClass="text-primary" title="Bài tập thử thách thực hành" body="Thử dựng kiến trúc Micro-frontend cho hệ sinh thái Thương mại điện tử đa domain." />
          <InsightItem icon="lightbulb" iconClass="text-primary" title="Mẹo phỏng vấn vòng kế tiếp" body="Hãy dành 15 giây tóm tắt lại bài toán để đồng bộ hóa góc nhìn với giám khảo trước khi đưa ra kiến trúc giải pháp." />
        </div>
      </div>

      {/* 4. Accordion từng câu hỏi (dữ liệu thật) */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-col gap-space-sm border-b border-surface-container-high pb-space-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-ds-headline-sm font-bold text-on-surface">
              Chi tiết Đánh giá Từng câu hỏi ({answered.length}/{total} Questions)
            </h2>
            <p className="text-ds-body-sm text-on-surface-variant">
              Nội dung trả lời đã ghi nhận và nhận xét kèm theo từng câu
            </p>
          </div>
          <div className="flex items-center gap-space-sm">
            {insights.avg != null && (
              <span className="rounded-full bg-secondary-container px-space-md py-1 text-ds-label-md font-semibold text-on-secondary-container tabular-nums">
                Trung bình: {(insights.avg / 10).toFixed(1)}/10
              </span>
            )}
            <button type="button" onClick={expandAll} className="rounded px-2 py-1 text-ds-label-md text-primary hover:underline">
              Mở rộng tất cả
            </button>
            <button type="button" onClick={collapseAll} className="rounded px-2 py-1 text-ds-label-md text-on-surface-variant hover:text-on-surface">
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
              return (
                <div key={a.id} className={`rounded-lg ${SOFT}`}>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-space-md rounded-lg px-space-lg py-space-md text-left transition-colors hover:bg-surface-container"
                  >
                    <span className="flex min-w-0 items-center gap-space-md pr-space-md">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-ds-label-lg font-bold text-primary">
                        {a.questionIndex + 1}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-ds-headline-sm font-semibold text-on-surface">{a.question}</span>
                        <span className="text-ds-body-sm text-on-surface-variant">
                          {a.durationSec != null ? `Thời lượng trả lời: ${fmtDuration(a.durationSec)}` : 'Chưa ghi nhận thời lượng'}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-space-md">
                      {typeof a.score === 'number' ? (
                        <Pill tone={scoreTone(a.score)}>{a.score}/100</Pill>
                      ) : (
                        <span className="text-ds-label-md text-outline">Chưa chấm</span>
                      )}
                      <span className={`${ICON} text-outline transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
                    </span>
                  </button>

                  {open && (
                    <div className="grid grid-cols-1 gap-space-md px-space-lg pb-space-lg lg:grid-cols-2">
                      <div className="flex flex-col gap-1.5 rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                        <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-outline">
                          <span className={`${ICON} text-[16px]`}>transcribe</span>
                          Nội dung câu trả lời
                        </span>
                        {a.answerText ? (
                          <p className="m-0 whitespace-pre-wrap text-ds-body-sm leading-relaxed text-on-surface italic">
                            {a.answerText}
                          </p>
                        ) : (
                          <p className="m-0 text-ds-body-sm italic text-on-surface-variant">Không có bản ghi câu trả lời.</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-lg bg-secondary-container/40 p-space-md">
                        <span className="flex items-center gap-1 text-ds-label-sm font-semibold uppercase text-on-secondary-container">
                          <span className={`${ICON} text-[16px]`}>psychology</span>
                          Nhận xét kèm theo
                        </span>
                        <p className="m-0 text-ds-body-sm leading-relaxed text-on-surface">
                          {a.feedback ?? 'Câu này chưa có nhận xét.'}
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

      <div className={`flex flex-wrap items-center justify-between gap-space-md rounded-xl p-space-lg ${SOFT}`}>
        <span className="flex items-center gap-space-sm">
          <span className={`${ICON} text-[20px] text-primary`}>history</span>
          <span className="text-ds-body-sm text-on-surface-variant">So sánh phiên này với các phiên trước.</span>
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
