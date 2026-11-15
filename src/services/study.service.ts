import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { PagedResponse } from '../models/User.model';
import {
  AnswerEvaluationResponse,
  ProgramType,
  QuestionResponse,
  StudyProgramResponse,
  TopicResponse,
} from '../models/Study.model';

const STUDY = '/api/v1/study';

const StudyService = {
  generateProgram: (body: {
    programType: ProgramType;
    targetPosition?: string;
    questionsPerTopic?: number;
  }) =>
    httpService.post<ApiResponse<StudyProgramResponse>>(`${STUDY}/generate`, body),

  getPrograms: () =>
    httpService.get<ApiResponse<StudyProgramResponse[]>>(`${STUDY}/programs`),

  getProgram: (id: number) =>
    httpService.get<ApiResponse<StudyProgramResponse>>(`${STUDY}/programs/${id}`),

  getProgramTopics: (id: number) =>
    httpService.get<ApiResponse<TopicResponse[]>>(`${STUDY}/programs/${id}/topics`),

  getTopicQuestions: (topicId: number, params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<QuestionResponse>>>(`${STUDY}/topics/${topicId}/questions`, { params }),

  submitAnswer: (topicId: number, body: { questionId: number; answer: string }) =>
    httpService.post<ApiResponse<AnswerEvaluationResponse>>(`${STUDY}/topics/${topicId}/answer`, body),
};

export default StudyService;
