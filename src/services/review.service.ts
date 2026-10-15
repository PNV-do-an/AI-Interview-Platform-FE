import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { BugReport, Review, ReviewList } from '../models/Review.model';

const REVIEWS = '/api/v1/reviews';
const BUGS = '/api/v1/bug-reports';

const ReviewService = {
  createReview: (body: { targetId: number; jobId?: number; rating: number; comment: string }) =>
    httpService.post<ApiResponse<Review>>(REVIEWS, body),

  getReviewsByTarget: (userId: number) =>
    httpService.get<ApiResponse<ReviewList>>(`${REVIEWS}/target/${userId}`),

  getMyReviews: () =>
    httpService.get<ApiResponse<Review[]>>(`${REVIEWS}/my`),

  getAllReviews: () =>
    httpService.get<ApiResponse<Review[]>>(`${REVIEWS}/admin/all`),

  replyReview: (id: number, reply: string) =>
    httpService.post<ApiResponse<Review>>(`${REVIEWS}/${id}/reply`, { reply }),

  createBugReport: (body: { title: string; category: string; description: string }) =>
    httpService.post<ApiResponse<BugReport>>(BUGS, body),

  getMyBugReports: () =>
    httpService.get<ApiResponse<BugReport[]>>(`${BUGS}/my`),

  getAllBugReports: () =>
    httpService.get<ApiResponse<BugReport[]>>(`${BUGS}/admin/all`),

  updateBugReport: (id: number, body: { status?: string; reply?: string }) =>
    httpService.patch<ApiResponse<BugReport>>(`${BUGS}/${id}`, body),
};

export default ReviewService;
