export type InterviewMode = 'MOCK' | 'KNOWLEDGE';
export type InterviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED';

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
}

export interface StartInterviewRequest {
  mode: InterviewMode;
  jobId?: number;
  topic?: string;
  questionCount: number;
}

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  MOCK: 'Phỏng vấn mô phỏng theo tin tuyển dụng',
  KNOWLEDGE: 'Luyện tập kiến thức theo chủ đề',
};
