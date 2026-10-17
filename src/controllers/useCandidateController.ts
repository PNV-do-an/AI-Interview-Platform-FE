import { useCallback, useState } from 'react';
import ProgramService from '../services/program.service';
import { Application, CandidateProfile } from '../models/Program.model';
import { PagedResponse } from '../models/User.model';

export const useCandidateController = () => {
  const [applications, setApplications] = useState<PagedResponse<Application> | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchMyApplications = useCallback(async (page = 0) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getMyApplications({ page, size: 10 });
      setApplications(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelApplication = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.cancelApplication(id);
      setSuccessMsg('Application withdrawn');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to withdraw application');
      return false;
    }
  }, []);

  const bookSlot = useCallback(async (slotId: number, applicationId: number) => {
    clearMessages();
    try {
      await ProgramService.bookSlot(slotId, applicationId);
      setSuccessMsg('Interview scheduled!');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to schedule interview');
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProgramService.getMyProfile();
      setProfile(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (body: Partial<CandidateProfile>) => {
    clearMessages();
    try {
      const res = await ProgramService.updateMyProfile(body);
      setProfile(res.data.data!);
      setSuccessMsg('Profile updated');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update profile');
      return false;
    }
  }, []);

  return {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, bookSlot,
    fetchProfile, updateProfile, clearMessages,
  };
};
