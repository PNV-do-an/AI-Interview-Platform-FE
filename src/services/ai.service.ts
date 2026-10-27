/**
 * AI Service API - Gọi Python FastAPI wrapper (port 8020) thay vì Browser TTS.
 * FastAPI gọi tiếp LiveTalking (port 8010) để:
 * - sinh câu hỏi qua LLM
 * - tổng hợp giọng nói qua EdgeTTS
 * - trả về transcript qua faster-whisper
 */
import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';

const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8020';

interface AvatarOfferInput {
  sdp: string;
  type: string;
}

interface OfferResponse {
  answerSdp: string;
  answerType: string;
  avatarSessionId: string;
}

interface SessionCreateInput {
  jobTitle: string;
  jdText: string;
  avatarSessionId: string;
}

interface QuestionResponse {
  sessionid: string;
  index: number;
  questionText: string;
  done?: boolean;
  next?: {
    sessionid: string;
    index: number;
    questionText: string;
    done?: boolean;
  };
}

interface AnswerInput {
  questionText: string;
  answerText: string;
  questionIndex: number;
  durationSec?: number;
  confirm?: boolean;
}

export interface AiTranscriptEntry {
  sessionid: string;
  index: number;
  questionText: string;
  answerText: string;
  confirmed: boolean;
  durationSec?: number;
}

const AIService = {
  /** Tạo phiên WebRTC với LiveTalking */
  offerAvatar: async (sdpOffer: string): Promise<OfferResponse> => {
    const res = await httpService.post<ApiResponse<OfferResponse>>(
      `${AI_SERVICE_URL}/api/v1/ai/avatar/offer`,
      { sdp: sdpOffer, type: 'offer' } as AvatarOfferInput,
      { baseURL: '' } // không có BASE, gọi thẳng AI service URL
    );
    return res.data.data!;
  },

  /** Tạo phiên phỏng vấn trên BE + liên kết với avatar session */
  createSession: async (input: SessionCreateInput) => {
    const res = await httpService.post<ApiResponse<{ sessionid: string; maxTurns: number; rubricVersion: string }>>(
      `${AI_SERVICE_URL}/api/v1/ai/session`,
      input
    );
    return res.data.data!;
  },

  /** Lấy câu hỏi của lượt hiện tại */
  getQuestion: async (sessionId: string, speak = true): Promise<QuestionResponse> => {
    const params = new URLSearchParams({ speak: String(speak) });
    const res = await httpService.get<ApiResponse<QuestionResponse>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/question?${params}`
    );
    return res.data.data!;
  },

  /** Gửi câu trả lời (text hoặc audio) */
  submitAnswer: async (sessionId: string, input: AnswerInput) => {
    const res = await httpService.post<ApiResponse<{ sessionid: string; index: number; answerText: string; confirmed: boolean }>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/answer`,
      input
    );
    return res.data.data!;
  },

  /** Gửi âm thanh (multipart form-data) */
  submitAudio: async (sessionId: string, audioFile: File, durationSec?: number) => {
    const formData = new FormData();
    formData.append('file', audioFile, audioFile.name);
    if (durationSec) formData.append('durationSec', durationSec.toString());
    
    const res = await httpService.post<ApiResponse<{ sessionid: string; index: number; answerText: string; confirmed: boolean }>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/answer/audio`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data!;
  },

  /** Đọc trạng thái đang nói hay không */
  isSpeaking: async (sessionId: string): Promise<boolean> => {
    const res = await httpService.get<ApiResponse<{ speaking: boolean }>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/speaking`
    );
    return res.data.data?.speaking ?? false;
  },

  /** Chốt transcript và chấm rubric */
  evaluate: async (sessionId: string) => {
    const res = await httpService.post<ApiResponse<any>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/evaluate`
    );
    return res.data.data!;
  },

  /** Lấy toàn bộ transcript */
  getTranscript: async (sessionId: string): Promise<AiTranscriptEntry[]> => {
    const res = await httpService.get<ApiResponse<{ sessionid: string; transcript: AiTranscriptEntry[] }>>(
      `${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}/transcript`
    );
    return res.data.data?.transcript ?? [];
  },

  /** Xóa phiên */
  deleteSession: async (sessionId: string) => {
    await httpService.delete(`${AI_SERVICE_URL}/api/v1/ai/session/${sessionId}`);
  },
};

export default AIService;
