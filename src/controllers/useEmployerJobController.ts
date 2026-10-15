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

export const useEmployerJobController = () => {
  const [myJobs, setMyJobs] = useState<PagedResponse<JobSummary> | null>(null);
  const [applications, setApplications] = useState<PagedResponse<Application> | null>(null);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchMyJobs = useCallback(async (page = 0) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getMyJobs({ page, size: 10 });
      setMyJobs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách tin của bạn');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.createJob(body);
      setSuccessMsg('Tin tuyển dụng đã được tạo');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tạo tin thất bại');
      return false;
    }
  }, []);

  const updateJob = useCallback(async (id: number, body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.updateJob(id, body);
      setSuccessMsg('Tin tuyển dụng đã được cập nhật');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật tin thất bại');
      return false;
    }
  }, []);

  const changeStatus = useCallback(async (id: number, status: JobStatus) => {
    clearMessages();
    try {
      await ProgramService.changeJobStatus(id, status);
      setSuccessMsg('Trạng thái đã được cập nhật');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật trạng thái thất bại');
      return false;
    }
  }, []);

  const deleteJob = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.deleteJob(id);
      setSuccessMsg('Tin tuyển dụng đã được xóa');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Xóa tin thất bại');
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
      setError(e.response?.data?.message || 'Không tải được danh sách ứng viên');
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
      setError(e.response?.data?.message || 'Không tải được gợi ý ứng viên');
    }
  }, []);

  const evaluate = useCallback(async (id: number, body: { status: string; score?: number; feedback?: string }) => {
    clearMessages();
    try {
      await ProgramService.evaluateApplication(id, body);
      setSuccessMsg('Đã cập nhật đánh giá');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Đánh giá thất bại');
      return false;
    }
  }, []);

  return {
    myJobs, applications, suggestions,
    loading, error, successMsg,
    fetchMyJobs, createJob, updateJob, changeStatus, deleteJob,
    fetchApplications, fetchSuggestions, evaluate, clearMessages,
  };
};

export type { JobDetail };
