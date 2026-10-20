import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { PagedResponse } from '../models/User.model';
import {
  Application,
  CandidateProfile,
  JobDetail,
  JobRequest,
  JobStatus,
  JobSummary,
  MatchSuggestion,
  Slot,
  SlotRequest,
} from '../models/Program.model';

const JOBS = '/api/v1/jobs';
const SLOTS = '/api/v1/slots';
const APPLICATIONS = '/api/v1/applications';
const PROFILE = '/api/v1/candidate-profile';

const ProgramService = {
  // --- Jobs (public) ---
  searchJobs: (params: { page?: number; size?: number; search?: string }) =>
    httpService.get<ApiResponse<PagedResponse<JobSummary>>>(JOBS, { params }),

  getJobDetail: (id: number) =>
    httpService.get<ApiResponse<JobDetail>>(`${JOBS}/${id}`),

  // --- Jobs (employer) ---
  getMyJobs: (params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<JobSummary>>>(`${JOBS}/my-jobs`, { params }),

  createJob: (body: JobRequest) =>
    httpService.post<ApiResponse<JobDetail>>(JOBS, body),

  updateJob: (id: number, body: JobRequest) =>
    httpService.put<ApiResponse<JobDetail>>(`${JOBS}/${id}`, body),

  submitJobForReview: (id: number) =>
    httpService.patch<ApiResponse<JobDetail>>(`${JOBS}/${id}/submit`),

  changeJobStatus: (id: number, status: JobStatus) =>
    httpService.patch<ApiResponse<JobDetail>>(`${JOBS}/${id}/status`, null, { params: { status } }),

  deleteJob: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${JOBS}/${id}`),

  getMatchingCandidates: (jobId: number) =>
    httpService.get<ApiResponse<MatchSuggestion[]>>(`${JOBS}/${jobId}/suggestions`),

  // --- Slots ---
  getMySlots: () =>
    httpService.get<ApiResponse<Slot[]>>(`${SLOTS}/my`),

  getAvailableSlots: (employerId: number) =>
    httpService.get<ApiResponse<Slot[]>>(`${SLOTS}/available`, { params: { employerId } }),

  createSlot: (body: SlotRequest) =>
    httpService.post<ApiResponse<Slot>>(SLOTS, body),

  updateSlot: (id: number, body: SlotRequest) =>
    httpService.put<ApiResponse<Slot>>(`${SLOTS}/${id}`, body),

  cancelSlot: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${SLOTS}/${id}`),

  // --- Applications ---
  applyJob: (jobId: number, coverLetter?: string) =>
    httpService.post<ApiResponse<Application>>(`${APPLICATIONS}/jobs/${jobId}`, { coverLetter }),

  getMyApplications: (params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<Application>>>(`${APPLICATIONS}/my`, { params }),

  cancelApplication: (id: number) =>
    httpService.patch<ApiResponse<void>>(`${APPLICATIONS}/${id}/cancel`, {}),

  bookSlot: (slotId: number, applicationId: number) =>
    httpService.post<ApiResponse<Application>>(`${APPLICATIONS}/book-slot`, { slotId, applicationId }),

  getJobApplications: (jobId: number, params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<Application>>>(`${APPLICATIONS}/jobs/${jobId}`, { params }),

  evaluateApplication: (id: number, body: { status: string; score?: number; feedback?: string }) =>
    httpService.patch<ApiResponse<Application>>(`${APPLICATIONS}/${id}/evaluate`, body),

  // --- Candidate profile ---
  getMyProfile: () =>
    httpService.get<ApiResponse<CandidateProfile>>(PROFILE),

  updateMyProfile: (body: Partial<CandidateProfile>) =>
    httpService.put<ApiResponse<CandidateProfile>>(PROFILE, body),
};

export default ProgramService;
