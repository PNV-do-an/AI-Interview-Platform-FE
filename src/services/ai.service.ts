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
import httpService from './http.service';

const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || '';

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
  /** Có URL cấu hình nghĩa là FE sẽ thử nối avatar; chưa có là đi thẳng luồng browser TTS. */
  isConfigured: () => AI_SERVICE_URL.trim() !== '',

  health: async (signal?: AbortSignal) =>
    (await httpService.get<AiHealth>(`${AI_SERVICE_URL}/health`, { baseURL: '', signal })).data,

  /** Đổi SDP của trình duyệt lấy answer SDP + sessionid của LiveTalking. */
  offerAvatar: async (sdpOffer: string, signal?: AbortSignal) =>
    (await httpService.post<AvatarOffer>(
      `${AI_SERVICE_URL}/api/v1/ai/avatar/offer`,
      { sdp: sdpOffer, type: 'offer' },
      { baseURL: '', signal },
    )).data,

  createSession: async (input: { jobTitle: string; jdText: string; avatarSessionId: string }) =>
    (await httpService.post<AiSession>(`${AI_SERVICE_URL}/api/v1/ai/session`, input, { baseURL: '' })).data,

  getQuestion: async (sessionId: string, speak = true) =>
    (await httpService.get<AiQuestion>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/question?speak=${speak}`,
      { baseURL: '' },
    )).data,

  /** Gõ chữ — đường lùi khi micro bị từ chối hoặc STT hỏng. */
  submitAnswer: async (sessionId: string, input: {
    questionIndex?: number; answerText: string; durationSec?: number; confirm?: boolean;
  }) =>
    (await httpService.post<AiAnswer>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/answer`, input, { baseURL: '' },
    )).data,

  /** Cho avatar nhắc lại một câu cố định (nút "Nghe lại"). */
  speak: async (sessionId: string, text: string) =>
    (await httpService.post<{ sessionid: string; chars: number }>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/speak`, { text }, { baseURL: '' },
    )).data,

  isSpeaking: async (sessionId: string) =>
    (await httpService.get<{ speaking: boolean }>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/speaking`, { baseURL: '' },
    )).data.speaking,

  interrupt: async (sessionId: string) =>
    (await httpService.post<{ sessionid: string; interrupted: boolean }>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/interrupt`, {}, { baseURL: '' },
    )).data,

  /** Xóa transcript trong bộ nhớ python khi FE đóng phiên; điểm vẫn nằm ở BE. */
  deleteSession: async (sessionId: string) => {
    await httpService.delete(`${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}`, { baseURL: '' });
  },
};

export default AIService;
