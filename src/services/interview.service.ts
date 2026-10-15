import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { PagedResponse } from '../models/User.model';
import {
  InterviewAnswer,
  InterviewResult,
  InterviewSession,
  StartInterviewRequest,
} from '../models/Interview.model';

const BASE = '/api/v1/mock-interviews';

const InterviewService = {
  start: (body: StartInterviewRequest) =>
    httpService.post<ApiResponse<InterviewSession>>(BASE, body),

  getMySessions: (params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<InterviewSession>>>(`${BASE}/my`, { params }),

  getResult: (id: number) =>
    httpService.get<ApiResponse<InterviewResult>>(`${BASE}/${id}`),

  submitAnswer: (id: number, body: { answerText: string; durationSec?: number }) =>
    httpService.post<ApiResponse<InterviewAnswer>>(`${BASE}/${id}/answer`, body),

  finish: (id: number) =>
    httpService.post<ApiResponse<InterviewResult>>(`${BASE}/${id}/finish`, {}),
};

export default InterviewService;
