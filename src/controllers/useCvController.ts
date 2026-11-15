import { useCallback, useState } from 'react';
import CvService from '../services/cv.service';
import { CoverLetter, CvParseResponse, CvSkillItem } from '../models/Cv.model';

export const useCvController = () => {
  const [cv, setCv] = useState<CvParseResponse | null>(null);
  const [cvSkills, setCvSkills] = useState<CvSkillItem[]>([]);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [current, setCurrent] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchMyCv = useCallback(async () => {
    try {
      const res = await CvService.getMyCv();
      setCv(res.data.data ?? null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được CV');
    }
  }, []);

  const fetchMySkills = useCallback(async () => {
    try {
      const res = await CvService.getMySkills();
      setCvSkills(res.data.data ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách kỹ năng');
    }
  }, []);

  const uploadCv = useCallback(async (file: File) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await CvService.uploadCv(file);
      setCv(res.data.data ?? null);
      setSuccessMsg(res.data.message || 'Phân tích CV thành công');
      return res.data.data ?? null;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tải CV lên thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTargetPosition = useCallback(async (position: string, level: string) => {
    clearMessages();
    try {
      const res = await CvService.updateTargetPosition(position, level);
      setCv(res.data.data ?? null);
      setSuccessMsg(res.data.message || 'Đã cập nhật vị trí mục tiêu');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật vị trí mục tiêu thất bại');
      return false;
    }
  }, []);

  const generateLetter = useCallback(async (body: { jobId?: number; cvId?: number; title: string }) => {
    clearMessages();
    try {
      const res = await CvService.generateLetter(body);
      setCurrent(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tạo thư xin việc thất bại');
      return null;
    }
  }, []);

  const fetchMyLetters = useCallback(async () => {
    try {
      const res = await CvService.getMyLetters();
      setLetters(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách thư');
    }
  }, []);

  const updateLetter = useCallback(async (id: number, content: string) => {
    clearMessages();
    try {
      const res = await CvService.updateLetter(id, content);
      setCurrent(res.data.data!);
      setSuccessMsg('Thư đã được lưu');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lưu thư thất bại');
      return false;
    }
  }, []);

  const deleteLetter = useCallback(async (id: number) => {
    clearMessages();
    try {
      await CvService.deleteLetter(id);
      setSuccessMsg('Đã xóa thư');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Xóa thư thất bại');
      return false;
    }
  }, []);

  return {
    cv, cvSkills, letters, current,
    loading, error, successMsg,
    fetchMyCv, fetchMySkills, uploadCv, updateTargetPosition,
    generateLetter, fetchMyLetters, updateLetter, deleteLetter, clearMessages,
  };
};
