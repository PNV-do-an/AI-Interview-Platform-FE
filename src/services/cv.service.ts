import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { CoverLetter, CvAnalysis } from '../models/Cv.model';

const CV = '/api/v1/cv';
const LETTERS = '/api/v1/cover-letters';

const CvService = {
  analyzeCv: (body: { cvText: string; fileName?: string }) =>
    httpService.post<ApiResponse<CvAnalysis>>(`${CV}/analyze`, body),

  getMyCvs: () =>
    httpService.get<ApiResponse<CvAnalysis[]>>(`${CV}/my`),

  generateLetter: (body: { jobId?: number; cvId?: number; title: string }) =>
    httpService.post<ApiResponse<CoverLetter>>(`${LETTERS}/generate`, body),

  getMyLetters: () =>
    httpService.get<ApiResponse<CoverLetter[]>>(`${LETTERS}/my`),

  updateLetter: (id: number, content: string) =>
    httpService.patch<ApiResponse<CoverLetter>>(`${LETTERS}/${id}`, { content }),

  deleteLetter: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${LETTERS}/${id}`),
};

export default CvService;
