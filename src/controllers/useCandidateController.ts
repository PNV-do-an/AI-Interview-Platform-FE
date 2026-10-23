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
      setError(e.response?.data?.message || 'Không tải được đơn ứng tuyển');
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelApplication = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.cancelApplication(id);
      setSuccessMsg('Đã rút đơn ứng tuyển');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không rút được đơn ứng tuyển');
      return false;
    }
  }, []);

  const bookSlot = useCallback(async (slotId: number, applicationId: number) => {
    clearMessages();
    try {
      await ProgramService.bookSlot(slotId, applicationId);
      setSuccessMsg('Đã đặt lịch phỏng vấn');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không đặt được lịch phỏng vấn');
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProgramService.getMyProfile();
      setProfile(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (body: Partial<CandidateProfile>) => {
    clearMessages();
    try {
      const res = await ProgramService.updateMyProfile(body);
      setProfile(res.data.data!);
      setSuccessMsg('Đã cập nhật hồ sơ');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không cập nhật được hồ sơ');
      return false;
    }
  }, []);

  return {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, bookSlot,
    fetchProfile, updateProfile, clearMessages,
  };
};
