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
  BUG: 'System Bug',
  FEATURE: 'Feature Request',
  OTHER: 'Other',
};

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="text-[18px] tracking-[2px] text-amber-500">
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);
