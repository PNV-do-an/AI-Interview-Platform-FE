import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { PagedResponse } from '../models/User.model';
import {
  InterviewAnswer,
  InterviewEvaluationRequest,
  InterviewReport,
  InterviewResult,
  InterviewSession,
  StartInterviewRequest,
  SubmitAnswerRequest,
} from '../models/Interview.model';

const BASE = '/api/v1/mock-interviews';

const InterviewService = {
  start: (body: StartInterviewRequest) =>
    httpService.post<ApiResponse<InterviewSession>>(BASE, body),

  getMySessions: (params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<InterviewSession>>>(`${BASE}/my`, { params }),

  getResult: (id: number) =>
    httpService.get<ApiResponse<InterviewResult>>(`${BASE}/${id}`),

  submitAnswer: (id: number, body: SubmitAnswerRequest) =>
    httpService.post<ApiResponse<InterviewAnswer>>(`${BASE}/${id}/answer`, body),

  finish: (id: number) =>
    httpService.post<ApiResponse<InterviewResult>>(`${BASE}/${id}/finish`, {}),

  /** Rubric 5 chiều cho phiên AVATAR đã COMPLETED (BE 012); overall do BE tính. */
  submitEvaluation: (id: number, body: InterviewEvaluationRequest) =>
    httpService.post<ApiResponse<InterviewReport>>(`${BASE}/${id}/evaluation`, body),

  /** 404 "Chưa có báo cáo cho phiên phỏng vấn này" khi chưa nộp evaluation. */
  getReport: (id: number) =>
    httpService.get<ApiResponse<InterviewReport>>(`${BASE}/${id}/report`),

  deleteSession: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${BASE}/${id}`),
};

export default InterviewService;
