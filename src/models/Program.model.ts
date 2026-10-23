export type JobStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'CLOSED';
export type WorkplaceModel = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type AiScreeningTrack = 'LIVE_CODING' | 'SYSTEM_DESIGN' | 'ASYNC_TECHNICAL' | 'CULTURAL_FIT';
export type ApplicationStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'INTERVIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED';

export interface JobSummary {
  id: number;
  title: string;
  companyName: string;
  position?: string;
  location?: string;
  salaryRange?: string;
  status: JobStatus;
  employerName: string;
  createdAt: string;
}

export interface JobDetail {
  id: number;
  title: string;
  companyName: string;
  position?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
  requirements?: string;
  requiredSkills?: string;
  status: JobStatus;
  employerId: number;
  employerName: string;
  employerEmail?: string;
  createdAt: string;
  updatedAt?: string;
  department?: string | null;
  experienceLevel?: string | null;
  employmentType?: string | null;
  workplaceModel?: WorkplaceModel | null;
  timezoneRequirement?: string | null;
  salaryCurrency?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  equityBand?: string | null;
  annualBonus?: string | null;
  aiScreeningEnabled?: boolean | null;
  aiScreeningTrack?: AiScreeningTrack | null;
  aiScreeningPassScore?: number | null;
  aiQuestionFocusAreas?: string | null;
  reviewNote?: string | null;
}

export interface JobRequest {
  title: string;
  companyName: string;
  position?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
  requirements?: string;
  requiredSkills?: string;
  department?: string;
  experienceLevel?: string;
  employmentType?: string;
  workplaceModel?: WorkplaceModel;
  timezoneRequirement?: string;
  salaryCurrency?: string;
  salaryMin?: number;
  salaryMax?: number;
  equityBand?: string;
  annualBonus?: string;
  aiScreeningEnabled?: boolean;
  aiScreeningTrack?: AiScreeningTrack | null;
  aiScreeningPassScore?: number | null;
  aiQuestionFocusAreas?: string | null;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
};

export const WORKPLACE_MODEL_LABELS: Record<WorkplaceModel, string> = {
  ONSITE: 'Tại văn phòng',
  HYBRID: 'Kết hợp',
  REMOTE: 'Làm từ xa',
};

export const AI_SCREENING_TRACK_LABELS: Record<AiScreeningTrack, string> = {
  LIVE_CODING: 'Live Coding (45 phút)',
  SYSTEM_DESIGN: 'System Design chuyên sâu (60 phút)',
  ASYNC_TECHNICAL: 'Bài kiểm tra kỹ thuật async (90 phút)',
  CULTURAL_FIT: 'Văn hoá & tư duy kỹ thuật (30 phút)',
};

export interface Slot {
  id: number;
  employerId: number;
  employerName: string;
  startTime: string;
  endTime: string;
  booked: boolean;
  bookedByName?: string;
  note?: string;
  cancelled: boolean;
}

export interface SlotRequest {
  startTime: string;
  endTime: string;
  note?: string;
}

export interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  employerId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail?: string;
  status: ApplicationStatus;
  score?: number;
  feedback?: string;
  coverLetter?: string;
  slot?: Slot | null;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchSuggestion {
  candidateId: number;
  fullName: string;
  email: string;
  skills?: string;
  experienceYears?: number;
  matchScore: number;
  matchedSkills: string[];
}

export interface CandidateProfile {
  id: number;
  skills?: string;
  experienceYears?: number;
  summary?: string;
  careerGoal?: string;
  cvFileName?: string;
  updatedAt?: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Đang xét',
  SCHEDULED: 'Đã đặt lịch',
  INTERVIEWED: 'Đã phỏng vấn',
  ACCEPTED: 'Trúng tuyển',
  REJECTED: 'Không đạt',
  CANCELLED: 'Đã huỷ',
};
