import { useCallback, useState } from 'react';
import ReviewService from '../services/review.service';
import { BugReport, Review, ReviewList } from '../models/Review.model';

export const useReviewController = () => {
  const [reviewList, setReviewList] = useState<ReviewList | null>(null);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [myBugs, setMyBugs] = useState<BugReport[]>([]);
  const [allBugs, setAllBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const createReview = useCallback(async (body: { targetId: number; jobId?: number; rating: number; comment: string }) => {
    clearMessages();
    try {
      await ReviewService.createReview(body);
      setSuccessMsg('Review submitted');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit review');
      return false;
    }
  }, []);

  const fetchReviewsByTarget = useCallback(async (userId: number) => {
    try {
      const res = await ReviewService.getReviewsByTarget(userId);
      setReviewList(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load review');
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await ReviewService.getMyReviews();
      setMyReviews(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách đánh giá');
    }
  }, []);

  const fetchAllReviews = useCallback(async () => {
    try {
      const res = await ReviewService.getAllReviews();
      setAllReviews(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách đánh giá');
    }
  }, []);

  const replyReview = useCallback(async (id: number, reply: string) => {
    clearMessages();
    try {
      await ReviewService.replyReview(id, reply);
      setSuccessMsg('Đã gửi phản hồi');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không gửi được phản hồi');
      return false;
    }
  }, []);

  const createBugReport = useCallback(async (body: { title: string; category: string; description: string }) => {
    clearMessages();
    setLoading(true);
    try {
      await ReviewService.createBugReport(body);
      setSuccessMsg('Report submitted — thank you!');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit report');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyBugs = useCallback(async () => {
    try {
      const res = await ReviewService.getMyBugReports();
      setMyBugs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách báo lỗi');
    }
  }, []);

  const fetchAllBugs = useCallback(async () => {
    try {
      const res = await ReviewService.getAllBugReports();
      setAllBugs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách báo lỗi');
    }
  }, []);

  const updateBugReport = useCallback(async (id: number, body: { status?: string; reply?: string }) => {
    clearMessages();
    try {
      await ReviewService.updateBugReport(id, body);
      setSuccessMsg('Đã cập nhật báo cáo');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không cập nhật được báo cáo');
      return false;
    }
  }, []);

  return {
    reviewList, myReviews, allReviews, myBugs, allBugs,
    loading, error, successMsg,
    createReview, fetchReviewsByTarget, fetchMyReviews, fetchAllReviews, replyReview,
    createBugReport, fetchMyBugs, fetchAllBugs, updateBugReport,
    clearMessages,
  };
};
