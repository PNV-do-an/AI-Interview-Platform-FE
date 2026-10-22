import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import { InterviewAnswer, InterviewSession } from '../../models/Interview.model';
import { parseServerTimestamp } from '../../utils/date';
import { ICON, LoadingBlock, EmptyBlock, ErrorBlock, adminButton, fmtServer } from '../components/adminKit';
import { Card } from '../components/ui';

/**
 * Màn "Báo cáo kết quả phiên phỏng vấn AI" theo mockup Stitch 4
 * `screen_10_k_t_qu_ph_ng_v_n_ai_l_ch_s_luy_n_t_p` (plan `candidate-redesign-stitch4.md` §4-S4).
 * Bảng lịch sử + tab lọc của mockup nằm ở `InterviewHistoryPage` (`/interview-history`).
 *
 * Token mockup -> token dự án (như AppLayout): `text-label-*`/`text-body-*`/`text-headline-*`
 * (scale DESIGN.md) -> `text-ds-*`; `secondary` teal #006b5f -> `secondary-teal`;
 * `outline` #777587 -> `outline-strong`; `shadow-[0_1px_8px_rgba(0,0,0,0.04)]` -> `shadow-header`;
 * lớp `font-*` (họ chữ Inter) -> bỏ. Hai `stopColor` dưới vòng điểm = gradient
 * primary -> secondary-teal nguyên văn mockup (#3525cd, #006b5f).
 *
 * Khối mockup BỎ vì BE không có nguồn số (conventions §3): "Cao hơn 78% ứng viên cùng vị trí",
 * "Hệ thống trọng số chuẩn" + 4 thanh năng lực cốt lõi có điểm, cụm "Tín hiệu AI tích cực"
 * (gồm chip từ vựng/phát âm/độ trễ), wave form + nút phát audio, chip "Chủ đề" từng câu,
 * "Hệ thống AI Model: TalentNexus Core v4.2", 3 card "Gợi ý từ AI Mentor" bịa tên khóa học.
 */

const RING_CIRCUMFERENCE = 427.25; // chu vi đường tròn r=68 trong SVG mockup

// BE chấm thang 0-100 (dữ liệu cũ có thể thang 0-10) -> quy về thang 10 như mockup hiển thị.
const toTen = (score: number) => (score > 10 ? score / 10 : score);

interface Band {
  label: string;
  icon: string;
  pill: string;
  text: string;
}

// Dải điểm dẫn xuất từ overallScore/score thật; nhãn tiếng Việt đúng theo mockup.
const BANDS: { min: number; band: Band }[] = [
  { min: 90, band: { label: 'Xuất sắc', icon: 'stars', pill: 'bg-secondary-container text-on-secondary-container', text: 'text-secondary-teal' } },
  { min: 80, band: { label: 'Khá', icon: 'check_circle', pill: 'bg-surface-container text-primary', text: 'text-primary' } },
  { min: 70, band: { label: 'Trung bình', icon: 'trending_flat', pill: 'bg-surface-container-high text-on-surface-variant', text: 'text-on-surface-variant' } },
  { min: 50, band: { label: 'Cần luyện thêm', icon: 'replay', pill: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', text: 'text-tertiary' } },
  { min: 0, band: { label: 'Cần cải thiện', icon: 'report_problem', pill: 'bg-error-container text-on-error-container', text: 'text-error' } },
];

const bandOf = (score: number): Band =>
  (BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]).band;

// Điểm câu hỏi có thể ở thang 10 -> nhân ngược lên 100 để tra dải điểm chung.
const bandOfAnswer = (score: number) => bandOf(toTen(score) * 10);

const clampCount = (n: number) => Math.min(10, Math.max(3, n || 5));

// Danh sách câu hỏi có thể vắng ở `/mock-interviews/my` -> lấy answeredCount làm sàn.
const questionTotal = (s: InterviewSession) =>
  Array.isArray(s.questions) ? s.questions.length : s.answeredCount;

// Thời lượng phiên = completedAt - createdAt (BE trả LocalDateTime naive UTC).
const durationMin = (s: InterviewSession): number | null => {
  const from = parseServerTimestamp(s.createdAt)?.getTime();
  const to = parseServerTimestamp(s.completedAt)?.getTime();
  if (!from || !to || to <= from) return null;
  return Math.max(1, Math.round((to - from) / 60000));
};

const fmtDurationSec = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
};

const InsightColumn: React.FC<{
  icon: string;
  tile: string;
  markIcon: string;
  markColor: string;
  itemBg: string;
  title: string;
  subtitle: string;
  items: InterviewAnswer[];
}> = ({ icon, tile, markIcon, markColor, itemBg, title, subtitle, items }) => (
  <div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
    <div className="flex items-center gap-space-sm mb-space-md">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tile}`}>
        <span className={`${ICON} text-[24px]`}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <h3 className="m-0 text-ds-headline-sm text-on-surface font-bold">{title}</h3>
        <span className={`text-ds-label-sm ${markColor}`}>{subtitle}</span>
      </div>
    </div>
    <div className="flex flex-col gap-space-md flex-1">
      {items.map((a) => (
        <div key={a.id} className={`p-space-md rounded-lg flex items-start gap-space-sm ${itemBg}`}>
          <span className={`${ICON} ${markColor} text-[20px] mt-0.5 shrink-0`}>{markIcon}</span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-on-surface text-ds-body-md">
              Câu {a.questionIndex + 1}: {a.question}
            </span>
            <p className="m-0 text-on-surface-variant text-ds-body-sm whitespace-pre-wrap">{a.feedback}</p>
            {a.score != null && (
              <span className="text-ds-label-sm text-outline-strong tabular-nums">
                {toTen(a.score).toFixed(1)} / 10
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockInterviewResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, loading, error, fetchResult, startSession } = useMockInterviewController();

  // Trạng thái accordion (UI-only): mặc định mở câu đầu tiên khi có dữ liệu.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    if (result?.answers?.length) setOpenIds(new Set([result.answers[0].id]));
  }, [result]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-ds-body-md text-on-surface-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </Card>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-space-md pt-2">
        {error
          ? <ErrorBlock message={error} onRetry={() => id && fetchResult(Number(id))} />
          : (loading ? <LoadingBlock label="Đang tải báo cáo..." /> : <ErrorBlock message="Không tìm thấy kết quả phiên phỏng vấn." />)}
      </div>
    );
  }

  const { session, answers } = result;
  const total = questionTotal(session);
  const answeredCount = session.answeredCount || answers.filter((a) => a.answerText).length;
  const overall = session.overallScore ?? null;
  const minutes = durationMin(session);
  const isFinished = session.status === 'COMPLETED' || Boolean(session.completedAt);
  const roleLabel = session.mode === 'MOCK' ? (session.jobTitle ?? 'Phỏng vấn mock theo JD') : (session.topic ?? 'Luyện theo chủ đề');
  // Retake chỉ khả thi khi phiên còn dấu vết để tạo phiên mới: MOCK cần jobId, KNOWLEDGE cần topic.
  const canRetake = session.mode === 'MOCK' ? Boolean(session.jobId) : Boolean(session.topic);

  const scored = answers.filter((a) => a.score != null);
  const avgTen = scored.length
    ? scored.reduce((sum, a) => sum + toTen(a.score as number), 0) / scored.length
    : null;

  // 3 cột dẫn xuất từ answers[] theo dải điểm, chỉ dùng feedback text thật của BE.
  const withFeedback = answers.filter((a) => a.score != null && (a.feedback ?? '').trim());
  const strengths = withFeedback.filter((a) => toTen(a.score as number) >= 8);
  const improvements = withFeedback.filter((a) => toTen(a.score as number) <= 5);
  const notes = withFeedback.filter((a) => {
    const ten = toTen(a.score as number);
    return ten > 5 && ten < 8;
  });
  const columns = [strengths, improvements, notes].filter((c) => c.length > 0).length;
  const gridClass =
    columns === 3 ? 'md:grid-cols-3' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  const runRetake = async () => {
    setRetaking(true);
    const started = await startSession({
      mode: session.mode,
      jobId: session.mode === 'MOCK' ? session.jobId : undefined,
      topic: session.mode === 'KNOWLEDGE' ? session.topic : undefined,
      questionCount: clampCount(total),
    });
    setRetaking(false);
    if (started) navigate(`/mock-interviews/${started.id}`);
  };

  const toggle = (qid: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });

  const allOpen = answers.length > 0 && openIds.size === answers.length;
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(answers.map((a) => a.id)));

  return (
    <div className="flex flex-col w-full gap-space-xl pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg pb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-on-surface-variant">
            <Link to="/mock-interviews" className="flex items-center gap-1 text-primary no-underline hover:underline">
              <span className={`${ICON} text-[16px]`}>psychology</span>
              AI Interview
            </Link>
            <span className="text-outline-variant font-normal">/</span>
            <span className="text-on-surface font-semibold flex items-center gap-1">
              Báo cáo kết quả phiên phỏng vấn
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface text-ds-label-sm">
                #{session.mode === 'MOCK' ? 'MOCK' : 'KNOW'}-{session.id}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <h1 className="m-0 text-ds-headline-xl text-on-surface font-bold tracking-tight">
              Báo cáo Đánh giá Phỏng vấn AI
            </h1>
            <span className="inline-flex items-center gap-1 px-space-md py-1 rounded-full bg-secondary-container text-on-secondary-container text-ds-label-md">
              <span className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-secondary-teal' : 'bg-outline-strong'}`} />
              {isFinished ? `Hoàn thành: ${fmtServer(session.completedAt ?? session.createdAt, 'datetime')}` : 'Chưa hoàn thành phiên'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-lg text-ds-body-sm text-on-surface-variant pt-1">
            <div className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-primary`}>badge</span>
              <span className="text-on-surface font-medium">{session.mode === 'MOCK' ? 'Vị trí:' : 'Chủ đề:'}</span>
              <span>{roleLabel}</span>
              {session.companyName && <span className="text-outline-strong">({session.companyName})</span>}
            </div>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <div className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[18px] text-outline-strong`}>timelapse</span>
              <span className="text-on-surface font-medium">Thời lượng:</span>
              <span>
                {minutes != null
                  ? `${minutes} phút`
                  : session.status === 'COMPLETED'
                    ? 'Chưa ghi nhận'
                    : 'Đang diễn ra'}
                {` (Hoàn thành ${answeredCount}/${total} câu hỏi)`}
              </span>
            </div>
            {total > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <div className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-[18px] text-secondary-teal`}>task_alt</span>
                  <span className="text-on-surface font-medium">Đã chấm:</span>
                  <span>{scored.length}/{answers.length} câu</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-space-sm self-start lg:self-center">
          {canRetake && (
            <button
              type="button"
              onClick={() => void runRetake()}
              disabled={retaking}
              className={adminButton('ghost', 'disabled:opacity-60')}
            >
              <span className={`${ICON} text-[18px] text-outline-strong`}>autorenew</span>
              {retaking ? 'Đang tạo phiên...' : 'Luyện tập lại phiên này'}
            </button>
          )}
          <button type="button" onClick={() => window.print()} className={adminButton('ghost')}>
            <span className={`${ICON} text-[18px] text-outline-strong`}>download</span>
            Xuất báo cáo PDF
          </button>
          <Link to="/mock-interviews" className={`${adminButton('primary')} no-underline`}>
            <span className={`${ICON} text-[18px]`}>add_circle</span>
            Luyện tập phiên mới
          </Link>
          <Link to="/interview-history" className={`${adminButton('ghost')} no-underline`}>
            <span className={`${ICON} text-[18px] text-outline-strong`}>monitoring</span>
            Lịch sử &amp; Đánh giá
          </Link>
        </div>
      </div>

      {!isFinished && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm rounded-xl bg-primary-fixed px-space-lg py-space-md">
          <span className="flex items-start gap-2 text-ds-body-md text-on-primary-fixed-variant">
            <span className={`${ICON} text-[20px]`}>hourglass_empty</span>
            Phiên chưa hoàn thành — điểm tổng hợp sẽ xuất hiện sau khi kết thúc phiên.
          </span>
          <Link
            to={`/mock-interviews/${session.id}`}
            className={`${adminButton('primary', 'h-9 shrink-0')} no-underline`}
          >
            <span className={`${ICON} text-[18px]`}>play_arrow</span>
            Tiếp tục phiên
          </Link>
        </div>
      )}

      {error && <ErrorBlock message={error} />}

      {/* Top Highlight: vòng điểm tổng hợp (toàn bộ dẫn từ overallScore thật) */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row gap-space-xl items-stretch">
        <div className="flex flex-col items-center justify-center min-w-[260px] p-space-md rounded-xl bg-surface-container-low text-center">
          <span className="text-ds-label-sm text-primary uppercase tracking-wider mb-space-sm font-semibold">
            Điểm số Tổng hợp
          </span>
          <div className="relative w-44 h-44 flex items-center justify-center my-space-xs">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160" role="img" aria-label="Điểm tổng hợp">
              <circle
                className="text-surface-container-high"
                cx="80" cy="80" r="68" fill="transparent" stroke="currentColor" strokeWidth="12"
              />
              {overall != null && (
                <circle
                  cx="80" cy="80" r="68" fill="transparent" stroke="url(#ds-score-gradient)"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, overall)) / 100)}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
              )}
              <defs>
                <linearGradient id="ds-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3525cd" />
                  <stop offset="100%" stopColor="#006b5f" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              {overall != null ? (
                <>
                  <span className="text-ds-display-sm font-bold text-on-surface tracking-tight tabular-nums">
                    {overall}
                    <span className="text-ds-body-md font-semibold text-outline-strong">/100</span>
                  </span>
                  <span className={`text-ds-label-md font-bold uppercase tracking-wider mt-0.5 ${bandOf(overall).text}`}>
                    {bandOf(overall).label}
                  </span>
                </>
              ) : (
                <span className="text-ds-label-md font-bold uppercase tracking-wider text-outline-strong">Chưa chấm</span>
              )}
            </div>
          </div>
          {answeredCount > 0 && (
            <span className="text-ds-body-sm text-on-surface-variant">
              Hoàn thành {answeredCount}/{total} câu hỏi
            </span>
          )}
        </div>

        {/* Cột phải: số dẫn xuất thật từ answers[] (không có điểm theo tiêu chí -> bỏ 4 thanh năng lực) */}
        <div className="flex-1 flex flex-col justify-between gap-space-lg">
          <div>
            <h2 className="m-0 pb-space-sm text-ds-headline-sm text-on-surface font-bold">
              Thông tin phiên phỏng vấn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-ds-label-sm text-outline-strong uppercase tracking-wider font-semibold">
                  Vị trí / Chủ đề
                </span>
                <span className="text-ds-body-md text-on-surface font-semibold">{roleLabel}</span>
                {session.companyName && (
                  <span className="text-ds-body-sm text-on-surface-variant">{session.companyName}</span>
                )}
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-ds-label-sm text-outline-strong uppercase tracking-wider font-semibold">
                  Thời lượng
                </span>
                <span className="text-ds-body-md text-on-surface font-semibold tabular-nums">
                  {minutes != null ? `${minutes} phút` : 'Chưa ghi nhận'}
                </span>
                <span className="text-ds-body-sm text-on-surface-variant">
                  Hoàn thành {answeredCount}/{total} câu hỏi
                </span>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-ds-label-sm text-outline-strong uppercase tracking-wider font-semibold">
                  Điểm tổng
                </span>
                <span className="text-ds-body-md text-on-surface font-semibold tabular-nums">
                  {overall != null ? `${overall}/100` : 'Chưa chấm'}
                </span>
                <span className="text-ds-body-sm text-on-surface-variant tabular-nums">
                  {scored.length
                    ? `Trung bình mỗi câu: ${avgTen?.toFixed(1)}/10 (${scored.length}/${answers.length} câu đã chấm)`
                    : 'Chưa có câu nào được chấm'}
                </span>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-ds-label-sm text-outline-strong uppercase tracking-wider font-semibold">
                  Ngày thực hiện
                </span>
                <span className="text-ds-body-md text-on-surface font-semibold">
                  {fmtServer(session.createdAt, 'date')}
                </span>
                <span className="text-ds-body-sm text-on-surface-variant">
                  {session.completedAt
                    ? `Kết thúc: ${fmtServer(session.completedAt, 'time')}`
                    : `Bắt đầu: ${fmtServer(session.createdAt, 'time')}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
            <span className="text-ds-label-sm text-outline-strong uppercase font-semibold">Đánh giá chính:</span>
            {overall != null ? (
              <span className={`inline-flex items-center gap-1 px-space-md py-1 rounded-full text-ds-label-md font-medium ${bandOf(overall).pill}`}>
                <span className={`${ICON} text-[16px]`}>{bandOf(overall).icon}</span>
                {bandOf(overall).label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-space-md py-1 rounded-full bg-surface-container-high text-on-surface-variant text-ds-label-md">
                <span className={`${ICON} text-[16px]`}>hourglass_empty</span>
                Chưa chấm
              </span>
            )}
            {scored.length > 0 && (
              <span className="inline-flex items-center gap-1 px-space-md py-1 rounded-full bg-surface-container text-primary text-ds-label-md tabular-nums">
                <span className={`${ICON} text-[16px]`}>report_problem</span>
                {improvements.length} câu cần cải thiện
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Feedback & Insights — 3 cột dẫn xuất từ answers[] theo dải điểm; cột rỗng thì ẩn */}
      {columns > 0 && (
        <div className={`grid grid-cols-1 ${gridClass} gap-space-lg`}>
          {strengths.length > 0 && (
            <InsightColumn
              icon="task_alt"
              tile="bg-secondary-container text-secondary-teal"
              markIcon="check_circle"
              markColor="text-secondary-teal"
              itemBg="bg-surface-container-low"
              title="Điểm mạnh nổi bật"
              subtitle={`${strengths.length} câu vượt ngưỡng kỳ vọng`}
              items={strengths}
            />
          )}
          {improvements.length > 0 && (
            <InsightColumn
              icon="troubleshoot"
              tile="bg-surface-container-highest text-primary"
              markIcon="report_problem"
              markColor="text-primary"
              itemBg="bg-surface-container-low"
              title="Cần cải thiện"
              subtitle="Lưu ý để đạt mức điểm hoàn hảo"
              items={improvements}
            />
          )}
          {notes.length > 0 && (
            <InsightColumn
              icon="auto_awesome"
              tile="bg-primary-fixed text-primary"
              markIcon="lightbulb"
              markColor="text-primary"
              itemBg="bg-surface-container"
              title="Gợi ý từ AI Mentor"
              subtitle={`${notes.length} câu ở mức trung bình`}
              items={notes}
            />
          )}
        </div>
      )}

      {/* Question-by-Question Accordion — audio/waveform + chip "Chủ đề" bỏ: không có file ghi âm */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-md gap-space-sm">
          <div>
            <h2 className="m-0 text-ds-headline-sm text-on-surface font-bold">
              Chi tiết Đánh giá Từng câu hỏi ({answeredCount}/{total} Questions)
            </h2>
            <p className="m-0 text-ds-body-sm text-on-surface-variant">
              Phân tích ngữ nghĩa và gợi ý tối ưu câu trả lời
            </p>
          </div>
          <div className="flex items-center gap-space-sm">
            {avgTen != null && (
              <span className="text-ds-label-md text-secondary-teal bg-secondary-container px-space-md py-1 rounded-full tabular-nums">
                Trung bình: {avgTen.toFixed(1)}/10
              </span>
            )}
            <button
              type="button"
              onClick={toggleAll}
              className="text-ds-label-md text-primary hover:underline px-2 py-1 bg-transparent border-0 cursor-pointer"
            >
              {allOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            </button>
          </div>
        </div>

        {answers.length === 0 ? (
          <EmptyBlock
            icon="chat_error"
            title="Phiên này chưa có câu trả lời nào."
            description="Vào phiên luyện tập để trả lời câu hỏi; báo cáo chi tiết sẽ hiển thị ở đây."
            action={
              <Link to="/mock-interviews" className={`${adminButton('primary')} no-underline`}>
                <span className={`${ICON} text-[18px]`}>smart_toy</span>
                Luyện phỏng vấn AI
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-space-sm pt-space-sm">
            {answers.map((a) => {
              const open = openIds.has(a.id);
              return (
                <div key={a.id} className="rounded-lg bg-surface-container-low">
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className="w-full px-space-lg py-space-md flex items-center justify-between text-left hover:bg-surface-container transition-colors rounded-lg cursor-pointer border-0 bg-transparent"
                  >
                    <div className="flex items-center gap-space-md min-w-0 pr-space-md">
                      <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0 text-ds-label-md tabular-nums">
                        {a.questionIndex + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-ds-headline-sm text-on-surface font-semibold truncate">
                          Câu {a.questionIndex + 1}: {a.question}
                        </span>
                        {a.durationSec != null && (
                          <span className="text-ds-body-sm text-on-surface-variant">
                            Thời lượng: {fmtDurationSec(a.durationSec)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-space-md shrink-0">
                      {a.score != null ? (
                        <span className={`px-space-md py-1 rounded-full text-ds-label-md font-bold tabular-nums ${bandOfAnswer(a.score).pill}`}>
                          {toTen(a.score).toFixed(1)} / 10
                        </span>
                      ) : (
                        <span className="px-space-md py-1 rounded-full text-ds-label-md bg-surface-container-high text-on-surface-variant">
                          Chưa chấm
                        </span>
                      )}
                      <span className={`${ICON} text-outline-strong ${open ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </button>

                  {open && (
                    <div className="px-space-lg pb-space-lg flex flex-col gap-space-md">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md pt-space-xs">
                        <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-1.5">
                          <span className="text-ds-label-sm text-outline-strong uppercase font-semibold flex items-center gap-1">
                            <span className={`${ICON} text-[16px]`}>transcribe</span>
                            Trích xuất câu trả lời của ứng viên
                          </span>
                          {a.answerText ? (
                            <p className="m-0 text-ds-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                              {a.answerText}
                            </p>
                          ) : (
                            <p className="m-0 text-ds-body-sm text-outline-strong italic">Chưa có câu trả lời được ghi nhận.</p>
                          )}
                        </div>
                        {a.feedback && (
                          <div className="p-space-md rounded-lg bg-secondary-container/40 flex flex-col gap-1.5">
                            <span className="text-ds-label-sm text-secondary-teal uppercase font-semibold flex items-center gap-1">
                              <span className={`${ICON} text-[16px]`}>smart_toy</span>
                              Nhận xét chuyên sâu từ AI
                            </span>
                            <p className="m-0 text-ds-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                              {a.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewResultPage;
