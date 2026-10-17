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
      setError(e.response?.data?.message || 'Failed to load review list');
    }
  }, []);

  const fetchAllReviews = useCallback(async () => {
    try {
      const res = await ReviewService.getAllReviews();
      setAllReviews(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load review list');
    }
  }, []);

  const replyReview = useCallback(async (id: number, reply: string) => {
    clearMessages();
    try {
      await ReviewService.replyReview(id, reply);
      setSuccessMsg('Reply posted');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to post reply');
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
      setError(e.response?.data?.message || 'Failed to load bug reports');
    }
  }, []);

  const fetchAllBugs = useCallback(async () => {
    try {
      const res = await ReviewService.getAllBugReports();
      setAllBugs(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load bug reports');
    }
  }, []);

  const updateBugReport = useCallback(async (id: number, body: { status?: string; reply?: string }) => {
    clearMessages();
    try {
      await ReviewService.updateBugReport(id, body);
      setSuccessMsg('Report updated');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update report');
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
