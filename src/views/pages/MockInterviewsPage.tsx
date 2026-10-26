/**
 * Màn "Luyện phỏng vấn AI" (mockup Stitch 6 `luy_n_ph_ng_v_n_ai_candidate_portal`, 26/10)
 * — route /mock-interviews, shell CandidateLayout.
 *
 * Số thật: chip vị trí = `GET /jobs`; phiên gần đây = `GET /mock-interviews/my`; ba card phương
 * thức map đúng 3 mode của `POST /mock-interviews` (MOCK / KNOWLEDGE / AVATAR — hợp đồng BE 012).
 *
 * Bỏ theo luật "chỉ đồ thật" + chốt 26/10 (spec/features/ai-interview-redesign.md mục 9):
 * - "Hạn mức phiên AI 5/5 lượt — Gói Pro" (BE không quota), "Đã xác thực bởi 1,200+ NTD",
 * - khối "Chọn chuyên gia AI" (Sarah/Alex/Mai — không có persona API),
 * - "Cấp độ kinh nghiệm mục tiêu" + checkbox phạm vi đánh giá (StartInterviewRequest không có field),
 * - 3 stat "Tỷ lệ hoàn thành / Điểm trung bình / Số câu hỏi" của kho kịch bản (không có nguồn),
 * - khối "Nhận định AI gần nhất" (số % STAR, mẹo AI bịa).
 * "Kho kịch bản thịnh hành" dựng bằng KNOWLEDGE topic thật: bấm topic là start phiên.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';
import { INTERVIEW_MODE_LABELS, InterviewMode, InterviewSession } from '../../models/Interview.model';
import {
  EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pagination, Pill, adminButton, fmtServer,
} from '../components/adminKit';
import { CARD, CandidatePageHeader, SOFT } from '../components/candidateKit';

/** Ngân hàng chủ đề luyện nhanh (KNOWLEDGE mode) — giới hạn phạm vi sinh viên IT (chốt dự án). */
const TOPIC_GROUPS: { label: string; topics: string[] }[] = [
  { label: 'Tất cả', topics: [] },
  { label: 'Frontend', topics: ['React & Next.js', 'TypeScript & CSS'] },
  { label: 'Backend', topics: ['Java Spring Boot', 'Node.js & Go'] },
  { label: 'System Design', topics: ['System Design & Caching', 'Database & SQL'] },
  { label: 'Behavioral & STAR', topics: ['Hành vi & STAR'] },
];
const ALL_TOPICS = TOPIC_GROUPS.flatMap(g => g.topics);

const QUESTION_COUNTS = [3, 5, 8, 10];

const MODE_ICON: Record<InterviewMode, string> = {
  MOCK: 'terminal',
  KNOWLEDGE: 'psychology_alt',
  AVATAR: 'videocam',
};

const sessionTitle = (s: InterviewSession): string =>
  s.mode === 'MOCK' ? s.jobTitle ?? 'Phiên luyện tập' : s.topic ?? 'Luyện tập kiến thức';

/** Đếm chủ đề khớp trong trang phiên đang xem (BE không có bộ lọc đếm theo topic). */
const topicHits = (s: InterviewSession, topic: string): boolean =>
  (s.topic ?? '').toLowerCase().includes(topic.toLowerCase()) ||
  (s.jobTitle ?? '').toLowerCase().includes(topic.toLowerCase());

const MockInterviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { sessions, loading, error, successMsg, startSession, fetchMySessions } = useMockInterviewController();
  const { jobs, fetchJobs } = useJobController();

  const [jobId, setJobId] = useState<number | ''>('');
  const [topic, setTopic] = useState(params.get('topic') ?? '');
  const [questionCount, setQuestionCount] = useState(5);
  const [group, setGroup] = useState(0);
  const [busy, setBusy] = useState(false);
  const scriptsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMySessions(0);
      fetchJobs(0, '');
    }
  }, [user]);

  useEffect(() => {
    const j = params.get('jobId');
    if (j) setJobId(Number(j));
  }, [params]);

  const start = useCallback(async (mode: InterviewMode, overrides?: { jobId?: number; topic?: string }) => {
    if (busy) return;
    setBusy(true);
    const session = await startSession({
      mode,
      jobId: mode === 'KNOWLEDGE' ? overrides?.jobId : (overrides?.jobId ?? (jobId !== '' ? jobId : undefined)),
      topic: mode === 'KNOWLEDGE' ? (overrides?.topic ?? topic) : overrides?.topic,
      questionCount: mode === 'AVATAR' ? undefined : questionCount,
    });
    setBusy(false);
    if (session) navigate(`/mock-interviews/${session.id}`);
  }, [busy, jobId, topic, questionCount, startSession, navigate]);

  const startTopic = (t: string) => {
    if (!t.trim()) return;
    setTopic(t);
    void start('KNOWLEDGE', { topic: t });
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className="p-10 text-ds-body-md text-on-surface-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }

  const jobList = jobs?.content ?? [];
  const selectedJob = jobList.find(j => j.id === jobId);
  const canStart = jobId !== '' && !busy;
  const recent = (sessions?.content ?? []).slice(0, 5);
  const visibleTopics = TOPIC_GROUPS[group].topics.length ? TOPIC_GROUPS[group].topics : ALL_TOPICS;
  const doneCount = sessions?.content.filter(s => s.status === 'COMPLETED').length ?? 0;

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[
          { label: 'Trang chủ', to: '/dashboard' },
          { label: 'Luyện phỏng vấn AI', to: '/mock-interviews' },
          { label: 'Khởi tạo & Chọn đề luyện tập' },
        ]}
        title="Luyện phỏng vấn AI"
        subtitle="Mô phỏng chân thực vòng phỏng vấn kỹ thuật & hành vi bám sát vị trí bạn ứng tuyển."
        status={<Link to="/mock-interviews/history" className={adminButton('soft', 'h-10 no-underline')}>
          <span className={`${ICON} text-[18px]`}>history</span>
          Lịch sử & Đánh giá
        </Link>}
      />

      {/* Hero "AI Copilot Mock Interview" — bỏ ô hạn mức lượt (BE không quota) */}
      <section className="rounded-xl bg-gradient-to-r from-primary-container to-secondary p-space-xl text-on-primary shadow-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-ds-label-md">
          <span className={`${ICON} text-[16px]`}>bolt</span>
          AI Copilot Mock Interview · Phản hồi thời gian thực
        </span>
        <h2 className="mt-3 text-ds-headline-xl font-extrabold tracking-tight">
          Luyện phỏng vấn thử cùng Trợ lý AI
        </h2>
        <p className="mt-2 max-w-3xl text-ds-body-md text-on-primary/90">
          Chọn vị trí và chế độ luyện — phỏng vấn chữ theo tin tuyển dụng, chủ đề kỹ thuật,
          hoặc vào phòng Video Call với AI. Kết quả và transcript được lưu để bạn xem lại sau phiên.
        </p>
      </section>

      {/* 3 phương thức = 3 mode thật của POST /mock-interviews */}
      <section className="flex flex-col gap-space-md">
        <div>
          <h3 className="text-ds-headline-md font-bold tracking-tight text-on-surface">
            Phương thức luyện tập linh hoạt
          </h3>
          <p className="text-ds-body-sm text-on-surface-variant">
            Lựa chọn chế độ phù hợp với lộ trình chuẩn bị ứng tuyển của bạn
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
          <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                <span className={`${ICON} text-[22px]`}>terminal</span>
              </span>
              <Pill tone="success">MOCK</Pill>
            </div>
            <h4 className="text-ds-headline-sm font-bold text-on-surface">Luyện theo tin tuyển dụng</h4>
            <p className="flex-1 text-ds-body-sm text-on-surface-variant">
              Chọn tin đang mở để AI sinh bộ câu hỏi chuyên môn &amp; hành vi theo đúng mô tả công việc.
            </p>
            <div className="flex flex-wrap gap-2 text-ds-label-sm">
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
                {questionCount} câu hỏi
              </span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
                Phản hồi tức thì
              </span>
            </div>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void start('MOCK')}
              className={adminButton('primary', 'w-full justify-center disabled:opacity-40')}
            >
              {selectedJob ? `Bắt đầu: ${selectedJob.title}` : 'Chọn tin ở cấu hình nhanh bên dưới'}
              <span className={`${ICON} text-[18px]`}>arrow_forward</span>
            </button>
          </div>

          <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container/50 text-secondary-teal">
                <span className={`${ICON} text-[22px]`}>document_scanner</span>
              </span>
              <Pill tone="primary">KNOWLEDGE</Pill>
            </div>
            <h4 className="text-ds-headline-sm font-bold text-on-surface">Luyện chủ đề kỹ thuật</h4>
            <p className="flex-1 text-ds-body-sm text-on-surface-variant">
              Nhập chủ đề bạn muốn đào sâu (React, Spring Boot, SQL…) hoặc chọn nhanh từ kho chủ đề bên dưới.
            </p>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="vd. Java Spring Boot, React, SQL…"
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-ds-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !topic.trim()}
              onClick={() => startTopic(topic)}
              className={adminButton('soft', 'w-full justify-center disabled:opacity-40')}
            >
              <span className={`${ICON} text-[18px]`}>play_arrow</span>
              Bắt đầu luyện chủ đề
            </button>
          </div>

          <div className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant">
                <span className={`${ICON} text-[22px]`}>videocam</span>
              </span>
              <Pill tone="warning">AVATAR · BE 012</Pill>
            </div>
            <h4 className="text-ds-headline-sm font-bold text-on-surface">Video call với AI</h4>
            <p className="flex-1 text-ds-body-sm text-on-surface-variant">
              Phòng phỏng vấn trực tiếp: AI hỏi bằng giọng nói qua trình duyệt, bạn trả lời và transcript
              được lưu theo từng lượt. Kết thúc phiên nộp rubric tự đánh 5 chiều.
            </p>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void start('AVATAR')}
              className={adminButton('primary', 'w-full justify-center gap-1 disabled:opacity-40')}
            >
              <span className={`${ICON} text-[18px]`}>videocam</span>
              Vào phòng Video Call
            </button>
          </div>
        </div>
      </section>

      {/* Cấu hình nhanh */}
      <section ref={scriptsRef} className={`${CARD} flex flex-col gap-space-xl p-space-xl`}>
        <div className="flex flex-wrap items-start justify-between gap-space-md">
          <div>
            <h3 className="flex items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
              <span className={`${ICON} text-primary`}>tune</span>
              Cấu hình nhanh phiên phỏng vấn mới
            </h3>
            <p className="mt-1 text-ds-body-sm text-on-surface-variant">
              Cấu hình dùng chung cho cả ba phương thức ở trên
            </p>
          </div>
          <Pill tone="success">
            <span className={`${ICON} text-[14px]`}>fiber_manual_record</span>
            Phòng phỏng vấn ảo sẵn sàng
          </Pill>
        </div>

        <div>
          <h4 className="text-ds-label-lg font-bold text-on-surface">1. Chọn tin tuyển dụng mục tiêu</h4>
          <p className="mt-0.5 text-ds-body-sm text-on-surface-variant">
            AI sẽ tải kho câu hỏi chuyên sâu và kiến trúc tương ứng
          </p>
          {loading && jobList.length === 0 ? (
            <LoadingBlock label="Đang tải tin tuyển dụng..." />
          ) : jobList.length === 0 ? (
            <EmptyBlock
              icon="work_outline"
              title="Chưa có tin tuyển dụng đang mở"
              description="Khi có tin mới, danh sách sẽ xuất hiện ở đây để bạn luyện đúng đề."
              action={<Link to="/jobs" className={adminButton('soft', 'no-underline')}>Xem tìm việc làm</Link>}
            />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {jobList.map(j => {
                const active = j.id === jobId;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setJobId(j.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary text-on-primary shadow-sm'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`${ICON} shrink-0 text-[18px] ${active ? '' : 'text-primary'}`}>code</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ds-label-lg font-semibold">{j.title}</span>
                      <span className={`block truncate text-ds-label-sm ${active ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                        {j.companyName}
                      </span>
                    </span>
                    {active && <span className={`${ICON} text-[18px]`}>check_circle</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-ds-label-lg font-bold text-on-surface">2. Số câu hỏi</h4>
          <p className="mt-0.5 text-ds-body-sm text-on-surface-variant">
            Áp dụng cho luyện theo tin và luyện chủ đề · phòng Video Call hỏi theo lượt hội thoại
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTION_COUNTS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setQuestionCount(n)}
                className={`rounded-lg border px-4 py-2 text-ds-label-lg transition-colors ${
                  n === questionCount
                    ? 'border-primary bg-primary-fixed font-bold text-on-primary-fixed'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {n} câu
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-space-md border-t border-surface-container-high pt-space-lg lg:flex-row lg:items-center lg:justify-between">
          <span className="flex items-center gap-2 text-ds-body-sm text-on-surface-variant">
            <span className={`${ICON} text-[18px]`}>videocam_off</span>
            Camera &amp; Microphone sẽ được bật khi bạn vào phiên
          </span>
          <div className="flex flex-wrap items-center gap-space-md">
            <Link to="/device-check" className={adminButton('ghost', 'h-11 no-underline')}>
              <span className={`${ICON} text-[18px]`}>settings_voice</span>
              Kiểm tra Mic &amp; Cam
            </Link>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void start('AVATAR')}
              className={adminButton('primary', 'h-11 disabled:opacity-40')}
            >
              <span className={`${ICON} text-[18px]`}>videocam</span>
              Vào phòng phỏng vấn Video Call ngay
              <span className={`${ICON} text-[18px]`}>arrow_forward</span>
            </button>
          </div>
        </div>
        {jobId === '' && (
          <p className="text-ds-label-md text-on-surface-variant">
            Chọn một tin tuyển dụng để bật nút vào phòng Video Call.
          </p>
        )}
        {!error || <ErrorBlock message={error} />}
        {successMsg && (
          <Pill tone="success">
            <span className={`${ICON} text-[14px]`}>check_circle</span>
            {successMsg}
          </Pill>
        )}
      </section>

      {/* Kho chủ đề = KNOWLEDGE session thật (bỏ 3 stat không có nguồn của mockup) */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-ds-headline-md font-bold tracking-tight text-on-surface">
              Kho chủ đề phỏng vấn
            </h3>
            <p className="text-ds-body-sm text-on-surface-variant">
              Bấm một chủ đề để bắt đầu phiên luyện kiến thức ngay
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-container-low p-1 text-ds-label-md">
            {TOPIC_GROUPS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setGroup(i)}
                className={`rounded px-3 py-1.5 transition-colors ${
                  i === group
                    ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {g.label}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {(i === 0 ? ALL_TOPICS : g.topics).reduce(
                    (n, t) => n + (sessions?.content.filter(s => topicHits(s, t)).length ?? 0), 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
          {visibleTopics.map(t => {
            const hits = sessions?.content.filter(s => topicHits(s, t)).length ?? 0;
            return (
              <div key={t} className={`${CARD} flex flex-col gap-3 p-space-lg`}>
                <div className="flex items-center justify-between">
                  <Pill tone="primary">Chủ đề</Pill>
                  <span className="text-ds-label-sm text-outline tabular-nums">
                    {hits > 0 ? `${hits} phiên đã luyện` : 'Chưa luyện'}
                  </span>
                </div>
                <h4 className="text-ds-headline-sm font-bold text-on-surface">{t}</h4>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startTopic(t)}
                  className={adminButton('soft', 'justify-center disabled:opacity-40')}
                >
                  <span className={`${ICON} text-[18px]`}>play_arrow</span>
                  Bắt đầu phỏng vấn
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phiên gần đây — số thật */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-space-md">
          <h3 className="flex items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
            <span className={`${ICON} text-primary`}>history</span>
            Phiên phỏng vấn AI gần đây của bạn
          </h3>
          <Link to="/mock-interviews/history" className="flex items-center gap-1 text-ds-label-lg font-semibold text-primary no-underline">
            Xem tất cả lịch sử
            <span className={`${ICON} text-[16px]`}>chevron_right</span>
          </Link>
        </div>

        {loading && !sessions ? (
          <LoadingBlock label="Đang tải phiên luyện tập..." />
        ) : recent.length === 0 ? (
          <EmptyBlock icon="smart_toy" title="Chưa có phiên luyện tập nào" description="Bắt đầu một phiên ở trên để hệ thống chấm điểm và lưu lại quá trình của bạn." />
        ) : (
          <div className="flex flex-col">
            {recent.map(s => {
              const done = s.status === 'COMPLETED';
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-space-md border-b border-surface-container-low py-space-md last:border-b-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                    <span className={`${ICON} text-[20px]`}>{MODE_ICON[s.mode]}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-ds-label-lg font-semibold text-on-surface">{sessionTitle(s)}</div>
                    <div className="text-ds-label-sm text-outline">
                      {fmtServer(s.createdAt, 'date')} • {INTERVIEW_MODE_LABELS[s.mode]}
                      {s.mode === 'MOCK' && s.companyName ? ` • ${s.companyName}` : ''}
                    </div>
                  </div>
                  {s.overallScore != null && (
                    <span className="text-ds-label-lg font-bold text-primary tabular-nums">{s.overallScore}/100</span>
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      to={done ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                      className={adminButton(done ? 'soft' : 'primary', 'h-9 no-underline')}
                    >
                      {done ? 'Xem báo cáo' : 'Tiếp tục'}
                    </Link>
                    {done && (
                      <Link
                        to={s.mode === 'MOCK' && s.jobId ? `/mock-interviews?jobId=${s.jobId}` : `/mock-interviews?topic=${encodeURIComponent(s.topic ?? '')}`}
                        className={adminButton('ghost', 'h-9 no-underline')}
                      >
                        <span className={`${ICON} text-[16px]`}>replay</span>
                        Luyện lại
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions && sessions.totalElements > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-ds-body-sm text-on-surface-variant">
            <span className="tabular-nums">
              Trang này: hoàn thành {doneCount} phiên • tất cả {sessions.totalElements} phiên
            </span>
            <Pagination
              page={sessions.number}
              pageSize={sessions.size}
              total={sessions.totalElements}
              onPage={fetchMySessions}
            />
          </div>
        )}
      </section>

      <div className={`flex flex-wrap items-center gap-space-md p-space-lg ${SOFT}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-teal text-on-secondary-teal">
          <span className={`${ICON} text-[22px]`}>smartphone</span>
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-ds-label-lg font-bold text-on-surface">Phòng Video Call chạy trên trình duyệt</span>
          <p className="text-ds-body-sm text-on-surface-variant">
            AI đọc câu hỏi bằng giọng nói của trình duyệt, bạn gõ câu trả lời theo từng lượt;
            kết thúc phiên bạn tự đánh rubric 5 chiều để nhận báo cáo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewsPage;
