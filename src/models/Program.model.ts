export type JobStatus = 'OPEN' | 'CLOSED';
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
}

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
  PENDING: 'Chờ duyệt',
  SCHEDULED: 'Đã hẹn lịch',
  INTERVIEWED: 'Đã phỏng vấn',
  ACCEPTED: 'Đạt',
  REJECTED: 'Không đạt',
  CANCELLED: 'Đã hủy',
};
