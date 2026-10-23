import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useReviewController } from '../../controllers/useReviewController';
import { useAuth } from '../../context/AuthContext';
import { StarDisplay } from '../../models/Review.model';
import {
  Card, ErrorBanner, LoadingState, PageHeader, buttonClass,
} from '../components/ui';

// inputClass bỏ `h-9` thay `py-2` khi dùng cho textarea.
const textareaClass =
  'min-h-[90px] w-full resize-y rounded-md border border-[#e2e8f0] bg-card px-2.5 py-2 text-body-md text-ink ' +
  'transition-all placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const EmployerReviewsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const targetId = Number(id);
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');
  const jobId = jobIdParam ? Number(jobIdParam) : undefined;

  const { user } = useAuth();
  const { reviewList, loading, error, successMsg, createReview, fetchReviewsByTarget } = useReviewController();

  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const load = () => fetchReviewsByTarget(targetId);
  useEffect(() => { load(); }, [targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCandidate = user?.role === 'ROLE_USER';

  const onSubmit = async () => {
    if (!comment.trim()) return;
    const ok = await createReview({ targetId, jobId, rating, comment: comment.trim() });
    if (ok) {
      setComment('');
      setRating(5);
      load();
    }
  };

  return (
    <div>
      <PageHeader title="Đánh giá nhà tuyển dụng" />
      {loading && <LoadingState label="Đang tải…" />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {reviewList && (
        <Card className="mb-4">
          <div className="flex flex-col items-center gap-1 py-2 text-center">
            <div className="text-metric-stat tabular-nums text-primary">
              {reviewList.averageRating != null ? reviewList.averageRating.toFixed(1) : '—'}
            </div>
            <StarDisplay rating={Math.round(reviewList.averageRating || 0)} />
            <p className="m-0 text-body-sm text-ink-variant">{reviewList.totalReviews} đánh giá</p>
          </div>
        </Card>
      )}

      {isCandidate && (
        <Card className="mb-4">
          <h2 className="m-0 text-headline-sm text-ink">Viết đánh giá</h2>
          <p className="mt-1 text-body-sm text-ink-variant">
            Bạn chỉ có thể đánh giá sau khi hoàn thành một buổi phỏng vấn với nhà tuyển dụng này.
          </p>
          <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-md text-[28px] leading-none transition-colors ${
                  (hover || rating) >= n ? 'text-[#f59e0b]' : 'text-[#cbd5e1] hover:text-[#f59e0b]'
                }`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className={`${textareaClass} mt-2`}
            placeholder="Chia sẻ trải nghiệm phỏng vấn của bạn..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="mt-2">
            <button type="button" className={buttonClass('primary')} onClick={onSubmit} disabled={!comment.trim()}>
              <span className="material-symbols-outlined text-[18px]">send</span>
              Gửi đánh giá
            </button>
          </div>
        </Card>
      )}

      {reviewList && reviewList.reviews.length === 0 && (
        <p className="m-0 text-body-sm text-ink-variant">Chưa có đánh giá nào.</p>
      )}

      <div className="flex flex-col gap-3">
        {reviewList?.reviews.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-headline-sm text-ink">{r.reviewerName}</strong>
              <StarDisplay rating={r.rating} />
            </div>
            {r.jobTitle && <p className="mt-1 text-body-sm text-ink-variant">Vị trí: {r.jobTitle}</p>}
            <p className="mt-2 text-body-md text-ink">{r.comment}</p>
            {r.reply && (
              <div className="mt-2 rounded-md bg-surface-low p-3">
                <strong className="text-label-md text-ink">Phản hồi từ {r.repliedByName || 'quản trị viên'}:</strong>
                <p className="mt-1 text-body-sm text-ink-variant">{r.reply}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="mt-6">
        <Link to="/jobs" className="text-body-sm text-ink-variant no-underline transition-colors hover:text-primary">
          ← Quay lại danh sách tin
        </Link>
      </p>
    </div>
  );
};

export default EmployerReviewsPage;
