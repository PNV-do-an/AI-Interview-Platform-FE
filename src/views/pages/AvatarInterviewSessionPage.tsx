/**
 * Phòng "Phỏng vấn Video call AI trực tiếp" cho phiên mode=AVATAR
 * 
 * Hỗ trợ 2 chế độ:
 * 1. Text Mode (Browser TTS): Câu hỏi tự sinh, giọng đọc trình duyệt, gõ trả lời
 * 2. LiveTalking Mode (WebRTC): Kết nối với Python AI service, có video avatar thật + mic
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import httpService from '../../services/http.service';
import ProgramService from '../../services/program.service';
import AIService from '../../services/ai.service';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import { InterviewTranscriptEntry } from '../../models/Interview.model';
import ConfirmDialog from '../components/ConfirmDialog';
import { ICON } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock, Pill, fmtServer } from '../components/adminKit';

const MAX_TURNS = 40; // trần lượt của BE 012

/** Đọc interview mode từ localStorage (text hoặc avatar) */
const getInterviewMode = (): 'text' | 'avatar' => {
  const stored = localStorage.getItem('ai_interview_mode');
  return (stored === 'avatar') ? 'avatar' : 'text';
};

/* --------------------------------- câu hỏi AI --------------------------------- */

const cleanSkill = (s: string) => s.replace(/\(.*?\)/g, '').trim();

/** Kỹ năng từ JD thật (`requiredSkills`, CSV) — nguồn nguyên liệu câu hỏi của AI. */
const fetchJobSkills = async (jobId?: number): Promise<string[]> => {
  if (!jobId) return [];
  try {
    const res = await ProgramService.getJobDetail(jobId);
    return (res.data.data?.requiredSkills ?? '')
      .split(/[,;\n•]+/).map(cleanSkill).filter(Boolean).slice(0, 6);
  } catch {
    return [];
  }
};

/** Sinh câu hỏi lượt tiếp theo từ JD thật; xoay vòng 5 nhóm, kỹ năng lấy từ `requiredSkills`. */
export const buildAvatarQuestion = (
  turn: number,
  jobTitle: string,
  skills: string[],
): string => {
  const s = skills.length ? skills : [jobTitle];
  const pick = s[turn % s.length];
  const templates = [
    `Trình độ hiểu biết của bạn về ${pick} trong bối cảnh vị trí ${jobTitle} như thế nào? Hãy cho một ví dụ cụ thể.`,
    `Hãy kể một tình huống thực tế bạn đã dùng ${pick} để giải quyết vấn đề. Kết quả đo được là gì?`,
    `Nếu phải thiết kế một hệ thống nhỏ dựa trên ${pick}, bạn sẽ bắt đầu từ đâu và đánh đổi những gì?`,
    `Áp dụng mô hình STAR: mô tả một lần bạn xử lý xung đột kỹ thuật liên quan đến ${pick}.`,
    `Bạn tự đánh giá mình ở mức nào với ${pick}, và kế hoạch bù đắp khoảng trống cho vị trí ${jobTitle} là gì?`,
  ];
  return templates[turn % templates.length];
};

/* ----------------------------------- TTS ------------------------------------ */

const useSpeech = () => {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const vi = voices.find(v => v.lang?.toLowerCase().startsWith('vi'));
    if (vi) u.voice = vi;
    u.lang = vi?.lang ?? 'vi-VN';
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [supported]);

  useEffect(() => stop, [stop]);
  return { supported, speaking, speak, stop };
};

/* ------------------------------ media (cam/mic) ------------------------------ */

const useLocalMedia = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('denied');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setState('granted');
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setState('denied');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };
  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };
  return { videoRef, state, micOn, camOn, toggleMic, toggleCam };
};

/* --------------------------------- RTT probe -------------------------------- */

const useLatency = () => {
  const [rtt, setRtt] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const probe = async () => {
      const t0 = performance.now();
      try {
        await httpService.get('/api/v1/packages');
        if (alive) setRtt(Math.round(performance.now() - t0));
      } catch {
        if (alive) setRtt(null);
      }
    };
    void probe();
    const id = setInterval(probe, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const label = rtt == null ? null : rtt < 100 ? 'Rất ổn định' : rtt < 300 ? 'Ổn định' : 'Kém ổn định';
  return { rtt, label };
};

/* ----------------------------------- page ----------------------------------- */

const fmtClock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

interface TurnView {
  index: number;
  questionText: string;
  answerText?: string;
  confirmed: boolean;
  answeredAt?: string;
}

const AvatarInterviewSessionPage: React.FC<{ sessionId: number }> = ({ sessionId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, session, loading, error, fetchResult, submitAnswer, finishSession, clearMessages } =
    useMockInterviewController();

  const [interviewMode, setInterviewMode] = useState<'text' | 'avatar'>('text'); // mặc định text mode
  const [draft, setDraft] = useState('');
  const [question, setQuestion] = useState('');
  const [turn, setTurn] = useState(0);
  const [turnElapsed, setTurnElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'live' | 'notes'>('live');
  const [savingDraft, setSavingDraft] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const devicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Đọc interview mode từ localStorage khi mount
    setInterviewMode(getInterviewMode());
  }, []);

  const speech = useSpeech();
  const media = useLocalMedia();
  const { rtt, label: rttLabel } = useLatency();

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchResult(sessionId);
  }, [user, sessionId]);

  const turns: TurnView[] = useMemo(() => {
    const list: TurnView[] = (result?.transcript ?? []).map(e => ({
      index: e.index,
      questionText: e.questionText,
      answerText: e.answerText,
      confirmed: e.confirmed,
      answeredAt: e.answeredAt,
    }));
    if (question && !list.some(x => x.index === turn)) {
      list.push({ index: turn, questionText: question, confirmed: false });
    }
    return list.sort((a, b) => a.index - b.index);
  }, [result, turn, question]);

  // khởi tạo lượt hiện tại: resume entry chưa chốt, hoặc sinh + đọc câu mới khi BE trả rỗng
  const bootedRef = useRef(false);
  useEffect(() => {
    if (!session || session.mode !== 'AVATAR' || session.status === 'COMPLETED' || bootedRef.current) return;
    bootedRef.current = true;
    const src: InterviewTranscriptEntry[] = result?.transcript ?? [];
    const last = src[src.length - 1];
    const idx = session.currentQuestionIndex;
    if (last && last.index === idx && !last.confirmed) {
      setQuestion(last.questionText);
      setDraft(last.answerText ?? '');
      speech.speak(last.questionText);
      return;
    }
    void (async () => {
      const skills = await fetchJobSkills(session.jobId);
      const q = buildAvatarQuestion(idx, session.jobTitle ?? 'lập trình viên', skills);
      setQuestion(q);
      speech.speak(q);
    })();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTurnElapsed(0);
    const id = setInterval(() => setTurnElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [turn]);

  useEffect(() => {
    const id = setInterval(() => setSessionElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns, draft]);

  if (!user || user.role !== 'ROLE_USER') {
    return <div className="p-10 text-ds-body-md text-on-surface-variant">Vui lòng đăng nhập bằng tài khoản ứng viên.</div>;
  }
  if (!session) {
    return loading ? <LoadingBlock label="Đang tải phòng phỏng vấn..." />
      : <ErrorBlock message={error || 'Không tìm thấy phiên phỏng vấn.'} onRetry={() => void fetchResult(sessionId)} />;
  }

  const atCap = turn >= MAX_TURNS;
  const finished = session.status === 'COMPLETED';

  const saveDraft = async () => {
    if (!draft.trim() || !question || busy) return;
    setSavingDraft(true);
    await submitAnswer(sessionId, { questionText: question, answerText: draft.trim(), durationSec: turnElapsed, confirm: false });
    setSavingDraft(false);
    clearMessages();
  };

  const nextTurn = async () => {
    if (!draft.trim() || !question || busy || atCap) return;
    setBusy(true);
    const ok = await submitAnswer(sessionId, { questionText: question, answerText: draft.trim(), durationSec: turnElapsed, confirm: true });
    if (ok) {
      const nextIdx = turn + 1;
      setTurn(nextIdx);
      setDraft('');
      const skills = await fetchJobSkills(session.jobId);
      const q = buildAvatarQuestion(nextIdx, session.jobTitle ?? 'lập trình viên', skills);
      setQuestion(q);
      speech.speak(q);
      void fetchResult(sessionId);
    }
    setBusy(false);
  };

  const runFinish = async () => {
    setConfirmFinish(false);
    speech.stop();
    const res = await finishSession(sessionId);
    if (res) navigate(`/mock-interviews/${sessionId}/result`);
  };

  const contextLabel = session.jobTitle ?? 'Phòng phỏng vấn AVATAR';

  return (
    <div className="flex flex-col gap-space-md">
      {/* Header phiên: REC + RTT + Kết thúc */}
      <div className="flex flex-wrap items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-space-md">
          <span className="truncate text-ds-headline-sm font-bold text-on-surface">{contextLabel}</span>
          {session.companyName && (
            <span className="text-ds-label-md text-on-surface-variant">• {session.companyName}</span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 text-ds-label-md font-bold text-on-error-container tabular-nums">
            <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
            REC {fmtClock(sessionElapsed)}
          </span>
          {rtt != null && (
            <Pill tone={rtt < 300 ? 'success' : 'warning'} icon="wifi">
              {rtt}ms {rttLabel ? `(${rttLabel})` : ''}
            </Pill>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => devicesRef.current?.scrollIntoView({ behavior: 'smooth' })} className={adminButton('ghost', 'h-10')}>
            <span className={`${ICON} text-[18px]`}>tune</span>
            Thiết bị
          </button>
          <button type="button" onClick={() => setConfirmFinish(true)} disabled={busy} className={adminButton('danger', 'h-10 disabled:opacity-40')}>
            <span className={`${ICON} text-[18px]`}>task_alt</span>
            Kết thúc &amp; Xem kết quả
          </button>
        </div>
      </div>

      {/* Stepper lượt hội thoại thật (trần 40 của BE 012) */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-surface-container-low px-space-md py-2.5 text-ds-label-md">
        {Array.from({ length: Math.min(turn + 2, 6) }, (_, i) => {
          const state = i < turn ? 'done' : i === turn ? 'current' : 'todo';
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className={`${ICON} shrink-0 text-[14px] text-outline`}>arrow_forward</span>}
              <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 ${
                state === 'current' ? 'bg-primary-container font-bold text-on-primary'
                  : state === 'done' ? 'bg-surface-container-lowest text-secondary-teal'
                    : 'bg-surface-container text-outline'}`}>
                {state === 'done' && <span className={`${ICON} text-[14px]`}>check_circle</span>}
                Lượt {i + 1}
              </span>
            </React.Fragment>
          );
        })}
        <span className="ml-auto shrink-0 text-on-surface-variant tabular-nums">
          {turn + 1}/{MAX_TURNS} lượt tối đa
        </span>
      </div>

      {error && <ErrorBlock message={error} />}
      {atCap && !finished && (
        <ErrorBlock message="Phiên đã đạt số lượt tối đa, hãy kết thúc để nhận báo cáo." />
      )}

      <div className="grid grid-cols-1 items-start gap-space-md xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Hai khung video + câu trả lời */}
        <div className="flex min-w-0 flex-col gap-space-md">
          <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
            {/* AI panel */}
            <div className="relative flex h-[280px] flex-col rounded-xl bg-inverse-surface p-space-md text-inverse-on-surface shadow-md">
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container">
                    <span className={`${ICON} text-[18px] text-on-primary`}>smart_toy</span>
                  </span>
                  <span className="text-ds-label-md font-semibold">Trợ lý AI</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-ds-label-sm">
                  <span className={`h-2 w-2 rounded-full ${speech.speaking ? 'animate-pulse bg-secondary-teal' : 'bg-outline'}`} />
                  {speech.speaking ? 'AI đang nói' : 'Đang chờ trả lời'}
                </span>
              </div>
              <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-lg bg-black/30 p-space-md backdrop-blur-sm">
                <div className="flex items-center justify-between text-ds-label-sm text-inverse-on-surface/70">
                  <span className="flex items-center gap-1">
                    <span className={`${ICON} text-[16px]`}>subtitles</span> Phụ đề AI
                  </span>
                  <span className="tabular-nums">Câu {turn + 1}</span>
                </div>
                <p className="mt-1 text-ds-body-md leading-relaxed">“{question || 'Đang chuẩn bị câu hỏi...'}”</p>
                <button
                  type="button"
                  onClick={() => speech.speak(question)}
                  disabled={!speech.supported || !question}
                  className={adminButton('soft', 'mt-2 h-9 disabled:opacity-40')}
                  title={speech.supported ? 'AI đọc lại câu hỏi bằng giọng của trình duyệt' : 'Trình duyệt không hỗ trợ đọc giọng nói'}
                >
                  <span className={`${ICON} text-[16px]`}>volume_up</span>
                  Nghe lại
                </button>
              </div>
            </div>

            {/* Camera ứng viên */}
            <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-xl bg-inverse-surface shadow-md">
              {media.state === 'granted' ? (
                <video
                  ref={media.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${media.camOn ? '' : 'opacity-0'}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-space-lg text-center text-inverse-on-surface/80">
                  <span className={`${ICON} text-[34px]`}>videocam_off</span>
                  <p className="m-0 text-ds-label-lg font-semibold">
                    {media.state === 'denied' ? 'Không truy cập được camera' : 'Đang xin quyền camera...'}
                  </p>
                  <p className="m-0 text-ds-body-sm">
                    Bạn vẫn gõ được câu trả lời — transcript không cần camera.
                  </p>
                </div>
              )}
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-ds-label-md text-inverse-on-surface">
                <span className={`h-2 w-2 rounded-full ${media.state === 'granted' ? 'bg-secondary-teal' : 'bg-outline'}`} />
                {user?.fullName ?? 'Bạn'}
              </span>
              {media.state === 'granted' && (
                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-ds-label-sm text-inverse-on-surface">
                  <span className={`${ICON} text-[14px]`}>{media.micOn ? 'mic' : 'mic_off'}</span>
                  {media.micOn ? 'Mic bật' : 'Mic tắt'}
                </span>
              )}
            </div>
          </div>

          {/* Ô trả lời (thay cho STT — gõ transcript) */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-ds-label-lg font-bold text-secondary-teal">
                <span className={`${ICON} text-[18px]`}>edit_note</span>
                Bạn đang trả lời (bản ghi chữ)
              </span>
              <span className="flex items-center gap-2 text-ds-label-sm text-outline tabular-nums">
                {savingDraft ? 'Đang lưu nháp...' : draft.trim() ? 'Nháp đã lưu lên phiên' : ''}
                <span className={`${ICON} text-[16px]`}>timer</span>
                {fmtClock(turnElapsed)}
              </span>
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={() => void saveDraft()}
              disabled={finished || atCap}
              placeholder="Gõ câu trả lời của bạn cho câu hỏi ở khung Phụ đề AI..."
              className="mt-2 min-h-[120px] w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-ds-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <div ref={devicesRef} className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={media.toggleMic} disabled={media.state !== 'granted'} className={adminButton('ghost', 'h-11 disabled:opacity-40')}>
                <span className={`${ICON} text-[18px]`}>{media.micOn ? 'mic' : 'mic_off'}</span>
                {media.micOn ? 'Bật mic' : 'Tắt mic'}
              </button>
              <button type="button" onClick={media.toggleCam} disabled={media.state !== 'granted'} className={adminButton('ghost', 'h-11 disabled:opacity-40')}>
                <span className={`${ICON} text-[18px]`}>{media.camOn ? 'videocam' : 'videocam_off'}</span>
                Camera
              </button>
              <button type="button" onClick={() => setShowStar(true)} className={adminButton('soft', 'h-11')}>
                <span className={`${ICON} text-[18px]`}>lightbulb</span>
                Gợi ý STAR
              </button>
              <button type="button" onClick={() => void saveDraft()} disabled={!draft.trim() || busy || finished} className={adminButton('ghost', 'h-11 disabled:opacity-40')}>
                <span className={`${ICON} text-[18px]`}>save</span>
                Lưu nháp
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => void nextTurn()} disabled={!draft.trim() || busy || finished || atCap} className={adminButton('primary', 'h-11 disabled:opacity-40')}>
                  Trả lời &amp; Tiếp
                  <span className={`${ICON} text-[18px]`}>arrow_forward</span>
                </button>
                <button type="button" onClick={() => setConfirmFinish(true)} disabled={busy || finished} className={adminButton('danger', 'h-11 disabled:opacity-40')}>
                  <span className={`${ICON} text-[18px]`}>assignment_turned_in</span>
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel phải: Bản ghi Live / Ghi chú */}
        <aside className="flex w-full flex-col rounded-xl bg-surface-container-lowest shadow-sm xl:sticky xl:top-4">
          <div className="flex border-b border-surface-container-high text-ds-label-lg">
            {([['live', 'Bản ghi Live'], ['notes', 'Ghi chú cá nhân']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 px-3 py-3 font-semibold transition-colors ${
                  tab === key ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'live' ? (
            <div ref={logRef} className="flex max-h-[520px] min-h-[320px] flex-col gap-3 overflow-y-auto p-space-md">
              <span className="text-ds-label-sm font-bold uppercase tracking-wide text-primary">
                Chủ đề: {contextLabel}
              </span>
              {turns.map(t => (
                <div key={t.index} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-ds-label-sm font-bold text-on-primary-fixed-variant">
                      AI
                    </span>
                    <div className="rounded-lg bg-surface-container-low px-3 py-2 text-ds-body-sm text-on-surface">
                      {t.questionText}
                      <span className="mt-0.5 block text-ds-label-sm text-outline tabular-nums">Câu {t.index + 1}</span>
                    </div>
                  </div>
                  {(t.answerText || (t.index === turn && draft)) && (
                    <div className="flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-ds-label-sm font-bold text-on-secondary-container">
                        Bạn
                      </span>
                      <div className={`rounded-lg px-3 py-2 text-ds-body-sm text-on-surface ${t.confirmed ? 'bg-surface-container' : 'border border-dashed border-outline-variant bg-surface-container-lowest'}`}>
                        {t.answerText || draft}
                        {!t.confirmed && (
                          <span className="mt-0.5 block text-ds-label-sm text-outline">
                            Nháp — chưa chốt lượt {savingDraft ? '· đang lưu' : ''}
                          </span>
                        )}
                        {t.confirmed && t.answeredAt && (
                          <span className="mt-0.5 block text-ds-label-sm text-outline">{fmtServer(t.answeredAt, 'time')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {turns.length === 0 && (
                <p className="py-space-xl text-center text-ds-body-sm text-outline">
                  AI đang chuẩn bị câu hỏi đầu tiên...
                </p>
              )}
            </div>
          ) : (
            <div className="p-space-md">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ghi chú cá nhân trong phiên — chỉ hiển thị trên màn hình này, không lưu vào máy chủ."
                className="min-h-[320px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-ds-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
              />
            </div>
          )}
          <div className="border-t border-surface-container-high px-space-md py-2.5 text-ds-label-sm text-on-surface-variant">
            {media.state === 'granted'
              ? `${media.micOn ? 'Micro đang bật' : 'Micro đang tắt'} • ${media.camOn ? 'Camera đang bật' : 'Camera đang tắt'}`
              : 'Chưa cấp quyền thiết bị — transcript vẫn ghi bình thường'}
            {speech.supported ? ' • Giọng đọc: trình duyệt' : ' • Trình duyệt không hỗ trợ giọng đọc'}
          </div>
        </aside>
      </div>

      {showStar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-space-xl shadow-lg">
            <h3 className="flex items-center gap-2 text-ds-headline-sm font-bold text-on-surface">
              <span className={`${ICON} text-amber-500`}>lightbulb</span>
              Khung trả lời STAR
            </h3>
            <dl className="mt-4 flex flex-col gap-3 text-ds-body-md text-on-surface">
              {[
                ['Situation', 'Bối cảnh dự án/vấn đề bạn gặp'],
                ['Task', 'Nhiệm vụ của bạn, mục tiêu đo được'],
                ['Action', 'Bạn đã làm gì, vì sao chọn cách đó'],
                ['Result', 'Kết quả kèm số liệu hoặc bài học'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-container-low px-4 py-3">
                  <dt className="font-bold text-primary">{k}</dt>
                  <dd className="m-0 text-ds-body-sm text-on-surface-variant">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-ds-body-sm text-outline">
              Đây là khung gợi ý cách trình bày, không phải nhận định AI về câu trả lời của bạn.
            </p>
            <button type="button" onClick={() => setShowStar(false)} className={adminButton('primary', 'mt-4 w-full justify-center')}>
              Quay lại phiên
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmFinish}
        title="Kết thúc phiên và chuyển tới báo cáo?"
        message={draft.trim()
          ? 'Lượt đang gõ dở sẽ không được chốt. Bạn vẫn có thể nộp rubric tự đánh sau khi kết thúc.'
          : 'Bạn sẽ chuyển tới màn báo cáo để nộp rubric tự đánh 5 chiều.'}
        confirmLabel="Kết thúc & Xem kết quả"
        cancelLabel="Tiếp tục"
        danger
        onConfirm={() => void runFinish()}
        onCancel={() => setConfirmFinish(false)}
      />
    </div>
  );
};

export default AvatarInterviewSessionPage;
