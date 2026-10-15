import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviewController } from '../../controllers/useReviewController';
import {
  BUG_CATEGORY_LABELS, BUG_STATUS_LABELS, StarDisplay,
  BugCategory, BugStatus,
} from '../../models/Review.model';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #D5DEEF', borderRadius: 8, padding: 16, marginTop: 12, background: '#fff' },
  meta: { color: '#6b7280', fontSize: 14 },
  textarea: { width: '100%', minHeight: 60, padding: 8, marginTop: 8, boxSizing: 'border-box' as const },
  section: { marginTop: 32 },
  row: { display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' },
};

const statusColor: Record<BugStatus, [string, string]> = {
  OPEN: ['#92400e', '#fef3c7'],
  IN_PROGRESS: ['#1e40af', '#dbeafe'],
  RESOLVED: ['#065f46', '#d1fae5'],
};

const badge = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 12,
  fontSize: 12, fontWeight: 600, color, background: bg,
});

const AdminFeedbackPage: React.FC = () => {
  const {
    allReviews, allBugs, loading, error, successMsg,
    fetchAllReviews, fetchAllBugs, replyReview, updateBugReport,
  } = useReviewController();

  const [reviewReplies, setReviewReplies] = useState<Record<number, string>>({});
  const [bugReplies, setBugReplies] = useState<Record<number, string>>({});
  const [bugStatus, setBugStatus] = useState<Record<number, BugStatus>>({});

  const load = () => { fetchAllReviews(); fetchAllBugs(); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onReplyReview = async (id: number) => {
    const reply = (reviewReplies[id] || '').trim();
    if (!reply) return;
    const ok = await replyReview(id, reply);
    if (ok) {
      setReviewReplies((prev) => ({ ...prev, [id]: '' }));
      fetchAllReviews();
    }
  };

  const onUpdateBug = async (id: number) => {
    const reply = (bugReplies[id] || '').trim() || undefined;
    const status = bugStatus[id];
    const ok = await updateBugReport(id, { status, reply });
    if (ok) {
      setBugReplies((prev) => ({ ...prev, [id]: '' }));
      fetchAllBugs();
    }
  };

  return (
    <div style={styles.page}>
      <h2>Quản lý đánh giá &amp; báo cáo</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <div style={styles.section}>
        <h3>Đánh giá từ ứng viên ({allReviews.length})</h3>
        {allReviews.length === 0 && <p style={styles.meta}>Chưa có đánh giá nào.</p>}
        {allReviews.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>
                <strong>{r.reviewerName}</strong> đánh giá <strong>{r.targetName}</strong>
              </span>
              <StarDisplay rating={r.rating} />
            </div>
            {r.jobTitle && <p style={styles.meta}>Vị trí: {r.jobTitle}</p>}
            <p style={{ marginTop: 6 }}>{r.comment}</p>
            {r.reply ? (
              <p style={styles.meta}>Đã phản hồi: {r.reply}</p>
            ) : (
              <>
                <textarea
                  placeholder="Viết phản hồi..."
                  value={reviewReplies[r.id] || ''}
                  onChange={(e) => setReviewReplies((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  style={styles.textarea}
                />
                <div style={styles.row}>
                  <button onClick={() => onReplyReview(r.id)} disabled={!(reviewReplies[r.id] || '').trim()}>
                    Phản hồi
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3>Báo cáo lỗi &amp; góp ý ({allBugs.length})</h3>
        {allBugs.length === 0 && <p style={styles.meta}>Chưa có báo cáo nào.</p>}
        {allBugs.map((b) => {
          const [color, bg] = statusColor[b.status];
          return (
            <div key={b.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{b.title}</strong>
                <span style={badge(color, bg)}>{BUG_STATUS_LABELS[b.status]}</span>
              </div>
              <p style={styles.meta}>
                {b.reporterName} · {BUG_CATEGORY_LABELS[b.category as BugCategory]} ·{' '}
                {new Date(b.createdAt).toLocaleDateString('vi-VN')}
              </p>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{b.description}</p>
              {b.reply && <p style={styles.meta}>Phản hồi hiện tại: {b.reply}</p>}
              <div style={styles.row}>
                <select
                  value={bugStatus[b.id] || b.status}
                  onChange={(e) => setBugStatus((prev) => ({ ...prev, [b.id]: e.target.value as BugStatus }))}
                >
                  {(Object.keys(BUG_STATUS_LABELS) as BugStatus[]).map((s) => (
                    <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Phản hồi cho người báo cáo..."
                value={bugReplies[b.id] || ''}
                onChange={(e) => setBugReplies((prev) => ({ ...prev, [b.id]: e.target.value }))}
                style={styles.textarea}
              />
              <div style={styles.row}>
                <button onClick={() => onUpdateBug(b.id)}>Cập nhật</button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24 }}>
        <Link to="/dashboard">← Về trang tổng quan</Link>
      </p>
    </div>
  );
};

export default AdminFeedbackPage;
