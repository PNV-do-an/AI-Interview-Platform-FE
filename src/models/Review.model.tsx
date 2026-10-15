import React from 'react';

export interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  targetId: number;
  targetName: string;
  jobId?: number;
  jobTitle?: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedByName?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface ReviewList {
  averageRating?: number;
  totalReviews: number;
  reviews: Review[];
}

export type BugCategory = 'BUG' | 'FEATURE' | 'OTHER';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface BugReport {
  id: number;
  reporterId: number;
  reporterName: string;
  title: string;
  category: BugCategory;
  description: string;
  status: BugStatus;
  reply?: string;
  repliedByName?: string;
  repliedAt?: string;
  createdAt: string;
}

export const BUG_CATEGORY_LABELS: Record<BugCategory, string> = {
  BUG: 'Lỗi hệ thống',
  FEATURE: 'Đề xuất tính năng',
  OTHER: 'Khác',
};

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: 'Mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
};

export const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <span style={{ color: '#f59e0b', fontSize: 18, letterSpacing: 2 }}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);
