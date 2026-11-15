import { useCallback, useState } from 'react';
import StudyService from '../services/study.service';
import { PagedResponse } from '../models/User.model';
import {
  AnswerEvaluationResponse,
  ProgramType,
  QuestionResponse,
  StudyProgramResponse,
  TopicResponse,
} from '../models/Study.model';

export const useStudyController = () => {
  const [programs, setPrograms] = useState<StudyProgramResponse[]>([]);
  const [program, setProgram] = useState<StudyProgramResponse | null>(null);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [questions, setQuestions] = useState<PagedResponse<QuestionResponse> | null>(null);
  const [evaluation, setEvaluation] = useState<AnswerEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const generateProgram = useCallback(async (body: {
    programType: ProgramType;
    targetPosition?: string;
    questionsPerTopic?: number;
  }) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await StudyService.generateProgram(body);
      const data = res.data.data!;
      setPrograms((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      setSuccessMsg(res.data.message || 'Tạo chương trình ôn tập thành công');
      return data;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tạo chương trình ôn tập thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await StudyService.getPrograms();
      setPrograms(res.data.data ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách chương trình');
    }
  }, []);

  const fetchProgram = useCallback(async (id: number) => {
    try {
      const res = await StudyService.getProgram(id);
      setProgram(res.data.data ?? null);
      return res.data.data ?? null;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được chương trình');
      return null;
    }
  }, []);

  const fetchTopics = useCallback(async (id: number) => {
    try {
      const res = await StudyService.getProgramTopics(id);
      setTopics(res.data.data ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách chủ đề');
    }
  }, []);

  const fetchQuestions = useCallback(async (topicId: number, page: number, size: number) => {
    setLoading(true);
    try {
      const res = await StudyService.getTopicQuestions(topicId, { page, size });
      setQuestions(res.data.data ?? null);
      setEvaluation(null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được câu hỏi');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (topicId: number, questionId: number, answer: string) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await StudyService.submitAnswer(topicId, { questionId, answer });
      setEvaluation(res.data.data ?? null);
      return res.data.data ?? null;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không đánh giá được câu trả lời');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    programs, program, topics, questions, evaluation,
    loading, error, successMsg,
    generateProgram, fetchPrograms, fetchProgram, fetchTopics, fetchQuestions,
    submitAnswer, clearMessages,
  };
};
