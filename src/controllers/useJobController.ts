import { useCallback, useState } from 'react';
import ProgramService from '../services/program.service';
import { JobDetail, JobSummary } from '../models/Program.model';
import { PagedResponse } from '../models/User.model';

export const useJobController = () => {
  const [jobs, setJobs] = useState<PagedResponse<JobSummary> | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchJobs = useCallback(async (page = 0, search = '') => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.searchJobs({ page, size: 10, search });
      setJobs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobDetail = useCallback(async (id: number) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getJobDetail(id);
      setJobDetail(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được chi tiết tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyJob = useCallback(async (jobId: number, coverLetter?: string) => {
    clearMessages();
    try {
      await ProgramService.applyJob(jobId, coverLetter);
      setSuccessMsg('Ứng tuyển thành công!');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ứng tuyển thất bại');
      return false;
    }
  }, []);

  return {
    jobs, jobDetail, loading, error, successMsg,
    fetchJobs, fetchJobDetail, applyJob, clearMessages,
  };
};
