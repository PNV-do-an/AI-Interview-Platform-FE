import { useCallback, useState } from 'react';
import ProgramService from '../services/program.service';
import {
  Application,
  JobDetail,
  JobRequest,
  JobStatus,
  JobSummary,
  MatchSuggestion,
} from '../models/Program.model';
import { PagedResponse } from '../models/User.model';
import { readApiErrorMessage } from '../utils/apiError';

const JOB_REQUEST_FIELDS = [
  'title', 'companyName', 'position', 'location', 'salaryRange', 'description',
  'requirements', 'requiredSkills', 'department', 'experienceLevel', 'employmentType',
  'workplaceModel', 'timezoneRequirement', 'salaryCurrency', 'salaryMin', 'salaryMax',
  'equityBand', 'annualBonus', 'aiScreeningEnabled', 'aiScreeningTrack',
  'aiScreeningPassScore', 'aiQuestionFocusAreas',
];

export const useEmployerJobController = () => {
  const [myJobs, setMyJobs] = useState<PagedResponse<JobSummary> | null>(null);
  const [applications, setApplications] = useState<PagedResponse<Application> | null>(null);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchMyJobs = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    // Chỉ xoá lỗi: đọc lại danh sách là hành động nền, không được xoá thông báo "Đã xoá/Đã cập nhật"
    // mà trang vừa hiển thị sau khi ghi.
    setError('');
    try {
      const res = await ProgramService.getMyJobs({ page, size });
      setMyJobs(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được tin tuyển dụng của bạn'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.createJob(body);
      setSuccessMsg('Đã tạo tin tuyển dụng');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tạo được tin tuyển dụng', JOB_REQUEST_FIELDS));
      return false;
    }
  }, []);

  const updateJob = useCallback(async (id: number, body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.updateJob(id, body);
      setSuccessMsg('Đã cập nhật tin tuyển dụng');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không cập nhật được tin tuyển dụng', JOB_REQUEST_FIELDS));
      return false;
    }
  }, []);

  const saveJob = useCallback(async (id: number | null, body: JobRequest): Promise<JobDetail | null> => {
    clearMessages();
    try {
      const res = id == null
        ? await ProgramService.createJob(body)
        : await ProgramService.updateJob(id, body);
      return res.data.data ?? null;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không lưu được tin tuyển dụng', JOB_REQUEST_FIELDS));
      return null;
    }
  }, []);

  const fetchJobDetail = useCallback(async (id: number): Promise<JobDetail | null> => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getJobDetail(id);
      return res.data.data ?? null;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được tin tuyển dụng'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviewNotes = useCallback(async (ids: number[]): Promise<Record<number, string>> => {
    const notes: Record<number, string> = {};
    await Promise.all(ids.map(async (id) => {
      try {
        const res = await ProgramService.getJobDetail(id);
        const note = res.data.data?.reviewNote;
        if (note) notes[id] = note;
      } catch {
        // Summary API không trả reviewNote; job không đọc được thì bỏ qua, không chặn danh sách.
      }
    }));
    return notes;
  }, []);

  const submitJob = useCallback(async (id: number): Promise<JobDetail | null> => {
    clearMessages();
    try {
      const res = await ProgramService.submitJobForReview(id);
      setSuccessMsg('Đã gửi để xét duyệt');
      return res.data.data ?? null;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không gửi được tin tuyển dụng để xét duyệt', JOB_REQUEST_FIELDS));
      return null;
    }
  }, []);

  const changeStatus = useCallback(async (id: number, status: JobStatus) => {
    clearMessages();
    try {
      await ProgramService.changeJobStatus(id, status);
      setSuccessMsg('Đã cập nhật trạng thái');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không cập nhật được trạng thái'));
      return false;
    }
  }, []);

  const deleteJob = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.deleteJob(id);
      setSuccessMsg('Đã xoá tin tuyển dụng');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không xoá được tin tuyển dụng'));
      return false;
    }
  }, []);

  const fetchApplications = useCallback(async (jobId: number, page = 0) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getJobApplications(jobId, { page, size: 10 });
      setApplications(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được danh sách ứng viên'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (jobId: number) => {
    clearMessages();
    try {
      const res = await ProgramService.getMatchingCandidates(jobId);
      setSuggestions(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được ứng viên gợi ý'));
    }
  }, []);

  const evaluate = useCallback(async (id: number, body: { status: string; score?: number; feedback?: string }) => {
    clearMessages();
    try {
      await ProgramService.evaluateApplication(id, body);
      setSuccessMsg('Đã cập nhật đánh giá');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không lưu được đánh giá'));
      return false;
    }
  }, []);

  return {
    myJobs, applications, suggestions,
    loading, error, successMsg,
    fetchMyJobs, createJob, updateJob, saveJob, fetchJobDetail, fetchReviewNotes, submitJob,
    changeStatus, deleteJob, fetchApplications, fetchSuggestions, evaluate, clearMessages,
  };
};

export type { JobDetail };
