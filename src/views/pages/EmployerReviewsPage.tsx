import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useReviewController } from '../../controllers/useReviewController';
import { useAuth } from '../../context/AuthContext';
import { StarDisplay } from '../../models/Review.model';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 760, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #D5DEEF', borderRadius: 8, padding: 20, marginTop: 16, background: '#fff' },
  summary: { background: '#F0F3FA', borderRadius: 8, padding: 16, textAlign: 'center' as const },
  big: { fontSize: 36, fontWeight: 700, color: '#395886' },
  meta: { color: '#6b7280', fontSize: 14 },
  textarea: { width: '100%', minHeight: 90, padding: 8, marginTop: 8, boxSizing: 'border-box' as const },
  reply: { background: '#F0F3FA', borderRadius: 6, padding: 10, marginTop: 10, fontSize: 14 },
  starBtn: { fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', padding: 2 },
};

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
    <div style={styles.page}>
      <h2>Đánh giá nhà tuyển dụng</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {reviewList && (
        <div style={styles.summary}>
          <div style={styles.big}>{reviewList.averageRating != null ? reviewList.averageRating.toFixed(1) : '—'}</div>
          <StarDisplay rating={Math.round(reviewList.averageRating || 0)} />
          <p style={styles.meta}>{reviewList.totalReviews} đánh giá</p>
        </div>
      )}

      {isCandidate && (
        <div style={styles.card}>
          <h3>Viết đánh giá của bạn</h3>
          <p style={styles.meta}>Bạn chỉ có thể đánh giá sau khi hoàn thành buổi phỏng vấn với nhà tuyển dụng này.</p>
          <div onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                style={{ ...styles.starBtn, color: (hover || rating) >= n ? '#f59e0b' : '#D5DEEF' }}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                type="button"
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="Chia sẻ trải nghiệm phỏng vấn của bạn..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={styles.textarea}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={onSubmit} disabled={!comment.trim()}>Gửi đánh giá</button>
          </div>
        </div>
      )}

      {reviewList && reviewList.reviews.length === 0 && (
        <p style={styles.meta}>Chưa có đánh giá nào.</p>
      )}

      {reviewList?.reviews.map((r) => (
        <div key={r.id} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{r.reviewerName}</strong>
            <StarDisplay rating={r.rating} />
          </div>
          {r.jobTitle && <p style={styles.meta}>Vị trí: {r.jobTitle}</p>}
          <p style={{ marginTop: 8 }}>{r.comment}</p>
          {r.reply && (
            <div style={styles.reply}>
              <strong>Phản hồi từ {r.repliedByName || 'quản trị viên'}:</strong>
              <p style={{ margin: '4px 0 0' }}>{r.reply}</p>
            </div>
          )}
        </div>
      ))}

      <p style={{ marginTop: 24 }}>
        <Link to="/jobs">← Danh sách chương trình</Link>
      </p>
    </div>
  );
};

export default EmployerReviewsPage;
