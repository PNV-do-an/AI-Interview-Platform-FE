/**
 * MockInterviewStartPage – /mock-interviews (ROLE_USER đã đăng nhập, CandidateLayout)
 *
 * Cho phép ứng viên cấu hình và bắt đầu một phiên luyện tập mới:
 *   • Chọn chế độ: MOCK (theo JD), KNOWLEDGE (chủ đề kỹ thuật), AVATAR (video call AI)
 *   • Chọn số câu / chủ đề / job tương ứng
 *   • Nhấn "Bắt đầu" → gọi startSession → chuyển sang /mock-interviews/:id
 *
 * Ngoài ra hiển thị 3 phiên gần nhất từ lịch sử để ứng viên tiếp tục hoặc xem kết quả.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useJobController } from '../../controllers/useJobController';
import { InterviewMode, INTERVIEW_MODE_LABELS } from '../../models/Interview.model';
import { CandidatePageHeader } from '../components/candidateKit';
import { StatusBadge, buttonClass } from '../components/ui';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const KNOWLEDGE_TOPICS = [
  'Frontend (React / Vue / Web Platform)',
  'Backend (NodeJS / Go / Java / Spring)',
  'System Design & Architecture',
  'Databases & SQL',
  'Data Structures & Algorithms',
  'DevOps & Cloud (AWS / GCP / Docker / K8s)',
  'AI / ML / Data Science',
  'Product Management',
  'UI/UX Design',
];

const QUESTION_COUNTS = [5, 10, 15, 20];

type Mode = InterviewMode;

interface ModeOption {
  value: Mode;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'MOCK',
    label: 'Luyện theo tin tuyển dụng',
    desc: 'AI đặt câu hỏi bám sát JD thực tế của doanh nghiệp bạn chọn.',
    icon: 'work_outline',
    color: 'text-primary',
  },
  {
    value: 'KNOWLEDGE',
    label: 'Luyện chủ đề kỹ thuật',
    desc: 'Ôn tập kiến thức chuyên sâu theo lĩnh vực — từ cơ bản đến nâng cao.',
    icon: 'psychology',
    color: 'text-secondary-teal',
  },
  {
    value: 'AVATAR',
    label: 'Video call với AI',
    desc: 'Phỏng vấn trực tiếp cùng AI qua giao diện video, giọng nói thời gian thực.',
    icon: 'videocam',
    color: 'text-tertiary',
  },
];

/* ─── component ───────────────────────────────────────────────────────────── */

const MockInterviewStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, loading: startLoading, error, startSession, fetchMySessions } = useMockInterviewController();
  const { jobs, fetchJobs } = useJobController();

  const [mode, setMode] = useState<Mode>('KNOWLEDGE');
  const [topic, setTopic] = useState(KNOWLEDGE_TOPICS[0]);
  const [jobId, setJobId] = useState<number | ''>('');
  const [questionCount, setQuestionCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  // load recent sessions + job list once
  useEffect(() => {
    fetchMySessions(0);
    fetchJobs(0, '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    const body =
      mode === 'MOCK'
        ? { mode, jobId: Number(jobId) || undefined, questionCount }
        : mode === 'KNOWLEDGE'
        ? { mode, topic, questionCount }
        : { mode }; // AVATAR — số câu do hội thoại quyết định
    const session = await startSession(body);
    if (session) {
      navigate(`/mock-interviews/${session.id}`);
    }
    setSubmitting(false);
  };

  const recentSessions = sessions?.content?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-space-xl">
      {/* ── header ── */}
      <CandidatePageHeader
        crumbs={[
          { label: 'Tổng quan', to: '/dashboard' },
          { label: 'Luyện phỏng vấn AI' },
        ]}
        title="Luyện phỏng vấn AI"
        subtitle="Chọn chế độ và cấu hình phiên luyện tập mới. AI sẽ đặt câu hỏi phù hợp và phân tích câu trả lời của bạn ngay lập tức."
        actions={
          <Link
            to="/mock-interviews/history"
            className="inline-flex items-center gap-space-xs rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-md py-space-sm text-ds-label-lg text-on-surface no-underline transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Lịch sử & Báo cáo
          </Link>
        }
      />

      {/* ── error banner ── */}
      {error && (
        <div className="flex items-center gap-space-sm rounded-xl bg-error-container px-space-md py-space-sm text-ds-body-sm text-on-error-container">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* ── setup card ── */}
      <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-xl flex flex-col gap-space-xl">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
          <h2 className="text-ds-headline-md font-semibold text-on-surface">Cấu hình phiên luyện tập</h2>
        </div>

        {/* step 1 – mode */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-ds-label-sm font-bold text-on-primary">1</span>
            <span className="text-ds-label-lg font-semibold text-on-surface">Chọn chế độ phỏng vấn</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`flex flex-col gap-space-sm rounded-xl border p-space-md text-left transition-all ${
                  mode === opt.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant/50 bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[28px] ${mode === opt.value ? opt.color : 'text-on-surface-variant'}`}>
                  {opt.icon}
                </span>
                <span className={`text-ds-label-lg font-semibold ${mode === opt.value ? 'text-primary' : 'text-on-surface'}`}>
                  {opt.label}
                </span>
                <span className="text-ds-body-sm text-on-surface-variant leading-relaxed">{opt.desc}</span>
                {mode === opt.value && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Đang chọn
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* step 2 – topic / job */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-ds-label-sm font-bold text-on-primary">2</span>
            <span className="text-ds-label-lg font-semibold text-on-surface">
              {mode === 'MOCK' ? 'Chọn tin tuyển dụng' : mode === 'KNOWLEDGE' ? 'Chọn chủ đề kỹ thuật' : 'Thông tin phiên Video Call'}
            </span>
          </div>

          {mode === 'KNOWLEDGE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm">
              {KNOWLEDGE_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`flex items-center gap-space-sm rounded-lg border px-space-md py-space-sm text-ds-body-sm text-left transition-all ${
                    topic === t
                      ? 'border-primary bg-primary/5 font-semibold text-primary'
                      : 'border-outline-variant/40 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {topic === t && <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>}
                  {t}
                </button>
              ))}
            </div>
          )}

          {mode === 'MOCK' && (
            <div className="flex flex-col gap-space-xs">
              <label className="text-ds-label-md text-on-surface-variant">Tin tuyển dụng (tuỳ chọn)</label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-10 w-full max-w-sm rounded-lg border border-outline-variant/50 bg-surface-container-low px-space-md text-ds-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Phỏng vấn chung (không gắn JD) --</option>
                {jobs?.content?.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} – {j.companyName ?? 'Chưa có công ty'}
                  </option>
                ))}
              </select>
              <p className="text-ds-body-sm text-on-surface-variant">
                Nếu không chọn, AI sẽ dùng bộ câu hỏi chung cho vị trí kỹ thuật phổ biến.
              </p>
            </div>
          )}

          {mode === 'AVATAR' && (
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5 shrink-0">info</span>
                <div className="text-ds-body-sm text-on-surface-variant leading-relaxed">
                  <p className="font-semibold text-on-surface mb-1">Yêu cầu thiết bị cho Video Call AI</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Camera và microphone phải được cấp quyền</li>
                    <li>Trình duyệt Chrome / Edge / Safari phiên bản mới nhất</li>
                    <li>Kết nối internet ổn định</li>
                  </ul>
                  <Link to="/device-check" className="inline-flex items-center gap-1 mt-2 text-primary no-underline font-semibold hover:underline">
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                    Kiểm tra thiết bị trước khi bắt đầu
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* step 3 – question count (không áp dụng cho AVATAR) */}
        {mode !== 'AVATAR' && (
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-ds-label-sm font-bold text-on-primary">3</span>
              <span className="text-ds-label-lg font-semibold text-on-surface">Số câu hỏi</span>
            </div>
            <div className="flex flex-wrap gap-space-sm">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={`w-16 rounded-lg border py-space-sm text-center text-ds-label-lg font-semibold transition-all ${
                    questionCount === n
                      ? 'border-primary bg-primary text-on-primary shadow-sm'
                      : 'border-outline-variant/50 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="flex items-center text-ds-body-sm text-on-surface-variant">câu</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
          <p className="text-ds-body-sm text-on-surface-variant">
            Mỗi phiên luyện tập được lưu và có thể xem lại tại{' '}
            <Link to="/mock-interviews/history" className="text-primary no-underline hover:underline">
              Lịch sử & Báo cáo
            </Link>.
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={submitting || (mode === 'MOCK' && false /* jobId optional */)}
            className={`${buttonClass('primary')} inline-flex items-center gap-space-sm min-w-[180px] justify-center`}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Đang khởi tạo…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {mode === 'AVATAR' ? 'videocam' : 'smart_toy'}
                </span>
                Bắt đầu ngay
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── recent sessions ── */}
      {recentSessions.length > 0 && (
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="text-ds-headline-sm font-semibold text-on-surface">Phiên gần đây</h2>
            <Link
              to="/mock-interviews/history"
              className="text-ds-label-md text-primary no-underline hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {recentSessions.map((s) => {
              const isDone = s.status === 'COMPLETED';
              const pct = s.questions.length > 0
                ? Math.round((s.answeredCount / s.questions.length) * 100)
                : 0;
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md flex flex-col gap-space-sm shadow-sm"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <span className="text-ds-label-md font-semibold text-on-surface leading-snug">
                      {s.jobTitle
                        ? `${s.jobTitle}${s.companyName ? ` · ${s.companyName}` : ''}`
                        : s.topic ?? INTERVIEW_MODE_LABELS[s.mode]}
                    </span>
                    <StatusBadge status={s.status} label={isDone ? 'Hoàn thành' : 'Đang dở'} />
                  </div>

                  <div className="text-ds-body-sm text-on-surface-variant">
                    {INTERVIEW_MODE_LABELS[s.mode]}
                    {!isDone && s.questions.length > 0 && (
                      <span className="ml-2 text-on-surface">
                        · {s.answeredCount}/{s.questions.length} câu ({pct}%)
                      </span>
                    )}
                    {isDone && s.overallScore != null && (
                      <span className="ml-2 font-semibold text-primary">· {s.overallScore}/100</span>
                    )}
                  </div>

                  <Link
                    to={isDone ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                    className={`inline-flex items-center justify-center gap-space-xs rounded-lg px-space-md py-space-xs text-ds-label-md font-semibold no-underline transition-colors ${
                      isDone
                        ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        : 'bg-primary text-on-primary hover:bg-primary-hover'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isDone ? 'bar_chart' : 'play_arrow'}
                    </span>
                    {isDone ? 'Xem kết quả' : 'Tiếp tục'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* loading state */}
      {startLoading && recentSessions.length === 0 && (
        <div className="flex items-center gap-space-sm text-ds-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          Đang tải lịch sử…
        </div>
      )}
    </div>
  );
};

export default MockInterviewStartPage;
