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
      setError(e.response?.data?.message || 'Failed to load your job postings');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.createJob(body);
      setSuccessMsg('Job posting created');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create job posting');
      return false;
    }
  }, []);

  const updateJob = useCallback(async (id: number, body: JobRequest) => {
    clearMessages();
    try {
      await ProgramService.updateJob(id, body);
      setSuccessMsg('Job posting updated');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update job posting');
      return false;
    }
  }, []);

  const changeStatus = useCallback(async (id: number, status: JobStatus) => {
    clearMessages();
    try {
      await ProgramService.changeJobStatus(id, status);
      setSuccessMsg('Status updated');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update status');
      return false;
    }
  }, []);

  const deleteJob = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.deleteJob(id);
      setSuccessMsg('Job posting deleted');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete job posting');
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
      setError(e.response?.data?.message || 'Failed to load applicants');
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
      setError(e.response?.data?.message || 'Failed to load suggested candidates');
    }
  }, []);

  const evaluate = useCallback(async (id: number, body: { status: string; score?: number; feedback?: string }) => {
    clearMessages();
    try {
      await ProgramService.evaluateApplication(id, body);
      setSuccessMsg('Evaluation updated');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save evaluation');
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
