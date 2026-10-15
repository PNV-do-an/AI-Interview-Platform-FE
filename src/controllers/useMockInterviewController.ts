import { useCallback, useState } from 'react';
import InterviewService from '../services/interview.service';
import {
  InterviewAnswer,
  InterviewResult,
  InterviewSession,
  StartInterviewRequest,
} from '../models/Interview.model';
import { PagedResponse } from '../models/User.model';

export const useMockInterviewController = () => {
  const [sessions, setSessions] = useState<PagedResponse<InterviewSession> | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [lastAnswer, setLastAnswer] = useState<InterviewAnswer | null>(null);
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
      setError(e.response?.data?.message || 'Không thể bắt đầu phiên phỏng vấn');
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
      setError(e.response?.data?.message || 'Không tải được lịch sử phỏng vấn');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResult = useCallback(async (id: number) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await InterviewService.getResult(id);
      setResult(res.data.data!);
      setSession(res.data.data!.session);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được kết quả phỏng vấn');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (id: number, answerText: string, durationSec?: number) => {
    clearMessages();
    try {
      const res = await InterviewService.submitAnswer(id, { answerText, durationSec });
      setLastAnswer(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gửi câu trả lời thất bại');
      return null;
    }
  }, []);

  const finishSession = useCallback(async (id: number) => {
    clearMessages();
    try {
      const res = await InterviewService.finish(id);
      setResult(res.data.data!);
      setSession(res.data.data!.session);
      setSuccessMsg('Đã hoàn thành phiên phỏng vấn');
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể kết thúc phiên phỏng vấn');
      return null;
    }
  }, []);

  return {
    sessions, session, result, lastAnswer,
    loading, error, successMsg,
    startSession, fetchMySessions, fetchResult, submitAnswer, finishSession, clearMessages,
  };
};
