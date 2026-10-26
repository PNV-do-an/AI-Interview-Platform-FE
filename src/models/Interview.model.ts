export type InterviewMode = 'MOCK' | 'KNOWLEDGE' | 'AVATAR';
export type InterviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED';

/** Một lượt hội thoại của phiên AVATAR (BE 012): nháp khi `confirmed=false`, chốt khi `true`. */
export interface InterviewTranscriptEntry {
  index: number;
  questionText: string;
  answerText?: string;
  confirmed: boolean;
  durationSec?: number;
  answeredAt?: string;
}

export interface InterviewSession {
  id: number;
  mode: InterviewMode;
  topic?: string;
  jobId?: number;
  jobTitle?: string;
  companyName?: string;
  status: InterviewSessionStatus;
  questions: string[];
  currentQuestionIndex: number;
  answeredCount: number;
  overallScore?: number;
  createdAt: string;
  completedAt?: string;
}

export interface InterviewAnswer {
  id: number;
  questionIndex: number;
  question: string;
  answerText?: string;
  durationSec?: number;
  score?: number;
  feedback?: string;
}

export interface InterviewResult {
  session: InterviewSession;
  answers: InterviewAnswer[];
  /** Mỗi lượt một dòng, cùng thứ tự `answers`; phiên AVATAR dùng mảng này làm transcript. */
  transcript?: InterviewTranscriptEntry[];
}

export interface StartInterviewRequest {
  mode: InterviewMode;
  jobId?: number;
  topic?: string;
  /** Bị BE bỏ qua ở mode AVATAR (số lượt do hội thoại quyết định). */
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  answerText: string;
  durationSec?: number;
  /** Chỉ dùng cho phiên AVATAR: câu hỏi AI do FE relay lên (BE 012). */
  questionText?: string;
  /** `false` = upsert bản nháp của lượt hiện tại; `true` = chốt lượt. */
  confirm?: boolean;
}

/** Rubric 5 chiều phiên AVATAR — key đúng tên field BE 012 yêu cầu, integer 0..100. */
export interface InterviewRubric {
  chuyenMon: number;
  duAn: number;
  tuDuy: number;
  truyenDat: number;
  mucKhop: number;
}

export const RUBRIC_DIMENSIONS: { key: keyof InterviewRubric; label: string; hint: string }[] = [
  { key: 'chuyenMon', label: 'Chuyên môn', hint: 'Độ chính xác kỹ thuật của câu trả lời' },
  { key: 'duAn', label: 'Kinh nghiệm dự án', hint: 'Ví dụ thực tế và vai trò của bạn trong dự án' },
  { key: 'tuDuy', label: 'Tư duy giải quyết', hint: 'Cách phân tích và lập luận khi gặp bài toán' },
  { key: 'truyenDat', label: 'Truyền đạt', hint: 'Sự mạch lạc, đúng trọng tâm khi trình bày' },
  { key: 'mucKhop', label: 'Mức khớp vị trí', hint: 'Độ phù hợp với yêu cầu của vị trí phỏng vấn' },
];

/** Hằng số FE khai theo yêu cầu `rubricVersion` của BE 012; đổi thang chấm phải tăng version. */
export const AVATAR_RUBRIC_VERSION = 'v1-self-fe-2026-10';

export interface InterviewEvaluationRequest {
  rubric: InterviewRubric;
  rubricVersion: string;
  strengths?: string;
  improvements?: string;
}

export interface InterviewReport {
  id: number;
  sessionId: number;
  chuyenMon: number;
  duAn: number;
  tuDuy: number;
  truyenDat: number;
  mucKhop: number;
  /** Do BE tính = trung bình cộng 5 chiều đã làm tròn; body gửi lên bị bỏ qua. */
  overallScore: number;
  strengths?: string;
  improvements?: string;
  rubricVersion: string;
  createdAt: string;
}

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  MOCK: 'Luyện theo tin tuyển dụng',
  KNOWLEDGE: 'Luyện chủ đề kỹ thuật',
  AVATAR: 'Video call với AI',
};
