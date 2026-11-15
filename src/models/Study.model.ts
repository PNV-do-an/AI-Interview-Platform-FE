/**
 * Model khớp DTO Study Program của BE (/api/v1/study/*).
 * createdAt/completedAt là LocalDateTime naive — render qua fmtServer của adminKit.
 */
export type ProgramType = 'STUDY' | 'INTERVIEW_PREP';
export type ProgramStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MIXED';
export type QuestionType = 'MCQ' | 'SHORT_ANSWER' | 'CODE' | 'AUDIO';

export interface StudyProgramResponse {
  id: number;
  title: string;
  description: string;
  programType: ProgramType;
  targetPosition: string | null;
  difficultyLevel: DifficultyLevel;
  status: ProgramStatus;
  totalTopics: number;
  completedTopics: number;
  createdAt: string;
  completedAt: string | null;
}

export interface TopicResponse {
  id: number;
  title: string;
  description: string;
  topicOrder: number;
  difficulty: DifficultyLevel;
  skillTag: string;
  totalQuestions: number;
  completedQuestions: number;
}

export interface QuestionOption {
  key: string;
  text: string;
}

export interface QuestionResponse {
  id: number;
  skillTag: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  options: QuestionOption[];
}

export interface AnswerEvaluationResponse {
  score: number | null;
  isCorrect: boolean | null;
  feedback: string | null;
  modelAnswer: string | null;
  explanation: string | null;
  strengths: string[];
  improvements: string[];
}

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  STUDY: 'Ôn tập kiến thức',
  INTERVIEW_PREP: 'Luyện phỏng vấn',
};

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  ARCHIVED: 'Đã lưu trữ',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  MIXED: 'Tổng hợp',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: 'Trắc nghiệm',
  SHORT_ANSWER: 'Tự luận ngắn',
  CODE: 'Lập trình',
  AUDIO: 'Trả lời nói',
};
