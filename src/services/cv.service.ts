import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { CoverLetter, CvParseResponse, CvSkillItem } from '../models/Cv.model';

const CV = '/api/v1/cv';
const LETTERS = '/api/v1/cover-letters';

const CvService = {
  /** Multipart: instance axios đặt Content-Type application/json nên phải override ở đây,
   *  nếu không axios 1.x biến FormData thành chuỗi JSON và BE báo "not a multipart request".
   *  Với header multipart/form-data, adapter xhr sẽ bỏ nó và để browser tự gắn boundary. */
  uploadCv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return httpService.post<ApiResponse<CvParseResponse>>(`${CV}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMyCv: () =>
    httpService.get<ApiResponse<CvParseResponse>>(CV),

  updateTargetPosition: (position: string, level: string) =>
    httpService.put<ApiResponse<CvParseResponse>>(`${CV}/position`, { position, level }),

  getMySkills: () =>
    httpService.get<ApiResponse<CvSkillItem[]>>(`${CV}/skills`),

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
