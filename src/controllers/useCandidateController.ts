import { useCallback, useState } from 'react';
import ProgramService from '../services/program.service';
import { readApiErrorMessage } from '../utils/apiError';
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
      setError(readApiErrorMessage(e, 'Không tải được danh sách đơn ứng tuyển'));
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelApplication = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.cancelApplication(id);
      setSuccessMsg('Đã hủy đơn ứng tuyển.');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không hủy được đơn ứng tuyển'));
      return false;
    }
  }, []);

  const bookSlot = useCallback(async (slotId: number, applicationId: number) => {
    clearMessages();
    try {
      await ProgramService.bookSlot(slotId, applicationId);
      setSuccessMsg('Đã đặt lịch phỏng vấn thành công!');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không đặt được lịch phỏng vấn'));
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProgramService.getMyProfile();
      setProfile(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được hồ sơ ứng viên'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (body: Partial<CandidateProfile>) => {
    clearMessages();
    try {
      const res = await ProgramService.updateMyProfile(body);
      setProfile(res.data.data!);
      setSuccessMsg('Đã lưu hồ sơ.');
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không cập nhật được hồ sơ'));
      return false;
    }
  }, []);

  return {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, bookSlot,
    fetchProfile, updateProfile, clearMessages,
  };
};
