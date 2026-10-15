import { useCallback, useState } from 'react';
import CvService from '../services/cv.service';
import { CoverLetter, CvAnalysis } from '../models/Cv.model';

export const useCvController = () => {
  const [cvs, setCvs] = useState<CvAnalysis[]>([]);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [current, setCurrent] = useState<CoverLetter | null>(null);
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const analyzeCv = useCallback(async (cvText: string, fileName?: string) => {
    clearMessages();
    try {
      const res = await CvService.analyzeCv({ cvText, fileName });
      setAnalysis(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Phân tích CV thất bại');
      return null;
    }
  }, []);

  const fetchMyCvs = useCallback(async () => {
    try {
      const res = await CvService.getMyCvs();
      setCvs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách CV');
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
    cvs, letters, current, analysis,
    loading, error, successMsg,
    analyzeCv, fetchMyCvs, generateLetter, fetchMyLetters,
    updateLetter, deleteLetter, clearMessages,
  };
};
