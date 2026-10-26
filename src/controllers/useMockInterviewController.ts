import { useCallback, useState } from 'react';
import InterviewService from '../services/interview.service';
import {
  InterviewAnswer,
  InterviewEvaluationRequest,
  InterviewReport,
  InterviewResult,
  InterviewSession,
  StartInterviewRequest,
  SubmitAnswerRequest,
} from '../models/Interview.model';
import { PagedResponse } from '../models/User.model';

export const useMockInterviewController = () => {
  const [sessions, setSessions] = useState<PagedResponse<InterviewSession> | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [lastAnswer, setLastAnswer] = useState<InterviewAnswer | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  /** `GET /report` trả 404 khi chưa nộp rubric — trang dùng cờ này để hiện form tự đánh. */
  const [reportMissing, setReportMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const startSession = useCallback(async (body: StartInterviewRequest) => {
    clearMessages();
    try {
      const res = await InterviewService.start(body);
      setSession(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không bắt đầu được phiên luyện tập');
      return null;
    }
  }, []);

  const fetchMySessions = useCallback(async (page = 0) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await InterviewService.getMySessions({ page, size: 10 });
      setSessions(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được lịch sử phiên luyện tập');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResult = useCallback(async (id: number) => {
    setLoading(true);
    clearMessages();
    setReport(null);
    setReportMissing(false);
    try {
      const res = await InterviewService.getResult(id);
      setResult(res.data.data!);
      setSession(res.data.data!.session);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được kết quả phiên luyện tập');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (id: number, body: SubmitAnswerRequest) => {
    try {
      const res = await InterviewService.submitAnswer(id, body);
      setLastAnswer(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không gửi được câu trả lời');
      return null;
    }
  }, []);

  const finishSession = useCallback(async (id: number) => {
    clearMessages();
    try {
      const res = await InterviewService.finish(id);
      setResult(res.data.data!);
      setSession(res.data.data!.session);
      setSuccessMsg('Đã hoàn thành phiên luyện tập');
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không kết thúc được phiên luyện tập');
      return null;
    }
  }, []);

  /** Đọc báo cáo AVATAR; 404 được tách thành `reportMissing` (chưa nộp rubric), không phải lỗi. */
  const loadReport = useCallback(async (id: number) => {
    setReportMissing(false);
    try {
      const res = await InterviewService.getReport(id);
      setReport(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      if (e.response?.status === 404) setReportMissing(true);
      else setError(e.response?.data?.message || 'Không tải được báo cáo phiên phỏng vấn');
      return null;
    }
  }, []);

  const submitEvaluation = useCallback(async (id: number, body: InterviewEvaluationRequest) => {
    clearMessages();
    try {
      const res = await InterviewService.submitEvaluation(id, body);
      setReport(res.data.data!);
      setReportMissing(false);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không nộp được phiếu đánh giá');
      return null;
    }
  }, []);

  const deleteSession = useCallback(async (id: number) => {
    clearMessages();
    try {
      await InterviewService.deleteSession(id);
      setSuccessMsg('Đã xóa phiên luyện tập');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không xóa được phiên luyện tập');
      return false;
    }
  }, []);

  return {
    sessions, session, result, lastAnswer, report, reportMissing,
    loading, error, successMsg,
    startSession, fetchMySessions, fetchResult, submitAnswer, finishSession,
    loadReport, submitEvaluation, deleteSession, clearMessages,
  };
};
