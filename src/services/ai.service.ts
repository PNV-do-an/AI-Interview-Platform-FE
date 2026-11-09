/**
 * AI service (FastAPI, `AI_SERVICE_URL`, mặc định cổng 8020) — cầu nối FE ↔ LiveTalking.
 *
 * Hợp đồng lấy trực tiếp từ `app/main.py` + `app/sessions.py` của repo BE: thân trả về là
 * **JSON trần**, không bọc `{success, data}` như BE Java, nên mọi chỗ đọc `res.data.data` sẽ
 * ra `undefined`. Route khớp 1:1 với `InterviewAiEngine` phía python:
 *   GET  /health                                      -> {status, avatarSessions, ...}
 *   POST /api/v1/ai/avatar/offer  {sdp,type}          -> {answerSdp, answerType, avatarSessionId}
 *   POST /api/v1/ai/session       {jobTitle,jdText,avatarSessionId} -> {sessionid,maxTurns,rubricVersion}
 *   GET  /api/v1/ai/session/{sid}/question?speak=     -> {sessionid,index,questionText,done}
 *   POST /api/v1/ai/session/{sid}/answer              -> {sessionid,index,answerText,confirmed,next?}
 *   POST /api/v1/ai/session/{sid}/speak  {text}       -> {sessionid,chars}
 *   GET  /api/v1/ai/session/{sid}/speaking            -> {speaking}
 *   POST /api/v1/ai/session/{sid}/interrupt           -> {sessionid,interrupted}
 *   DELETE /api/v1/ai/session/{sid}                   -> {sessionid,deleted}
 */
import axios from 'axios';

const AI_SERVICE_URL_KEY = 'ai_service_url';
const BUILD_AI_SERVICE_URL = (process.env.REACT_APP_AI_SERVICE_URL || '').trim();
const aiHttp = axios.create();

const normalizeServiceUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Nhập URL đầy đủ, ví dụ https://ten-tunnel.trycloudflare.com.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || value.includes('?') || value.includes('#')) {
    throw new Error('URL AI service phải dùng HTTP/HTTPS và không chứa tài khoản, query hoặc fragment.');
  }
  return url.toString().replace(/\/+$/, '');
};

const serviceUrl = (): string => {
  const saved = window.localStorage.getItem(AI_SERVICE_URL_KEY);
  return (saved ?? BUILD_AI_SERVICE_URL).trim().replace(/\/+$/, '');
};

const serviceEndpoint = (path: string, baseUrl = serviceUrl()): string => {
  if (!baseUrl) throw new Error('Chưa cấu hình URL của AI service.');
  return `${baseUrl}${path}`;
};

/** `avatarSessions === -1` nghĩa là AI service sống nhưng không với tới tiến trình avatar. */
export interface AiHealth {
  status: string;
  avatarServer: string;
  avatarId: string;
  /** Có giá trị = avatar được publish qua HTTPS (HLS), FE không cần bắt tay WebRTC. */
  mediaUrl: string;
  avatarSessions: number;
  sttModel: string;
  llmProvider: string;
  openSessions: number;
  maxTurns: number;
  rubricVersion: string;
}

export interface AvatarOffer {
  answerSdp: string;
  answerType: string;
  avatarSessionId: string;
}

export interface AiSession {
  sessionid: string;
  maxTurns: number;
  rubricVersion: string;
}

export interface AiQuestion {
  sessionid: string;
  index: number;
  /** `null` kèm `done=true` khi LLM báo hết bộ câu hỏi. */
  questionText: string | null;
  done: boolean;
}

export interface AiAnswer {
  sessionid: string;
  index: number;
  answerText: string;
  confirmed: boolean;
  durationSec?: number | null;
  /** Câu hỏi lượt kế, chỉ có khi `confirm=true` (python `ask_next`). */
  next?: AiQuestion;
}

const AIService = {
  /** URL runtime lưu trên trình duyệt được ưu tiên hơn cấu hình lúc build. */
  getServiceUrl: serviceUrl,

  setServiceUrl: (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
      window.localStorage.removeItem(AI_SERVICE_URL_KEY);
      return serviceUrl();
    }
    const normalized = normalizeServiceUrl(trimmed);
    window.localStorage.setItem(AI_SERVICE_URL_KEY, normalized);
    return normalized;
  },

  normalizeServiceUrl,

  /** Có URL cấu hình nghĩa là FE sẽ thử nối avatar; chưa có là đi thẳng luồng browser TTS. */
  isConfigured: () => serviceUrl() !== '',

  health: async (signal?: AbortSignal) =>
    (await aiHttp.get<AiHealth>(serviceEndpoint('/health'), { baseURL: '', signal })).data,

  healthAtUrl: async (url: string, signal?: AbortSignal) => {
    const baseUrl = normalizeServiceUrl(url);
    return (await aiHttp.get<AiHealth>(serviceEndpoint('/health', baseUrl),
      { baseURL: '', signal, timeout: 6000 })).data;
  },

  /** Probe RTT thuần: /ping không gọi avatar nên số đo không cộng hop tới máy chủ avatar. */
  pingAtUrl: async (url: string, signal?: AbortSignal) => {
    const baseUrl = normalizeServiceUrl(url);
    return (await aiHttp.get<{ status: string }>(serviceEndpoint('/ping', baseUrl),
      { baseURL: '', signal, timeout: 6000 })).data;
  },

  /** Đổi SDP của trình duyệt lấy answer SDP + sessionid của LiveTalking. */
  offerAvatar: async (sdpOffer: string, signal?: AbortSignal) =>
    (await aiHttp.post<AvatarOffer>(
      serviceEndpoint('/api/v1/ai/avatar/offer'),
      { sdp: sdpOffer, type: 'offer' },
      { baseURL: '', signal },
    )).data,

  createSession: async (input: { jobTitle: string; jdText: string; avatarSessionId: string }) =>
    (await aiHttp.post<AiSession>(serviceEndpoint('/api/v1/ai/session'), input,
      { baseURL: '' })).data,

  getQuestion: async (sessionId: string, speak = true) =>
    (await aiHttp.get<AiQuestion>(
      `${serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/question`)}?speak=${speak}`,
      { baseURL: '' },
    )).data,

  /** Gõ chữ — đường lùi khi micro bị từ chối hoặc STT hỏng. */
  submitAnswer: async (sessionId: string, input: {
    questionIndex?: number; answerText: string; durationSec?: number; confirm?: boolean;
  }) =>
    (await aiHttp.post<AiAnswer>(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/answer`), input,
      { baseURL: '' },
    )).data,

  /** Cho avatar nhắc lại một câu cố định (nút "Nghe lại"). */
  speak: async (sessionId: string, text: string) =>
    (await aiHttp.post<{ sessionid: string; chars: number }>(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/speak`),
      { text }, { baseURL: '' },
    )).data,

  isSpeaking: async (sessionId: string) =>
    (await aiHttp.get<{ speaking: boolean }>(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/speaking`),
      { baseURL: '' },
    )).data.speaking,

  interrupt: async (sessionId: string) =>
    (await aiHttp.post<{ sessionid: string; interrupted: boolean }>(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/interrupt`),
      {}, { baseURL: '' },
    )).data,

  /** Xóa transcript trong bộ nhớ python khi FE đóng phiên; điểm vẫn nằm ở BE. */
  deleteSession: async (sessionId: string) => {
    await aiHttp.delete(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}`),
      { baseURL: '' },
    );
  },

  /** AI tự chấm rubric khi hết gói câu hỏi. */
  evaluate: async (sessionId: string) =>
    (await aiHttp.post<Record<string, unknown>>(
      serviceEndpoint(`/api/v1/ai/session/${encodeURIComponent(sessionId)}/evaluate`),
      {}, { baseURL: '' },
    )).data,
};

export default AIService;
