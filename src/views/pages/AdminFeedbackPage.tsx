import React, { useEffect, useState } from 'react';
import { useReviewController } from '../../controllers/useReviewController';
import {
  BUG_CATEGORY_LABELS, BUG_STATUS_LABELS, StarDisplay,
  BugCategory, BugStatus,
} from '../../models/Review.model';
import {
  Badge, buttonClass, Card, EmptyState, ErrorBanner, LoadingState, PageHeader,
} from '../components/ui';

type BadgeTone = 'warning' | 'info' | 'success';

const statusTone: Record<BugStatus, BadgeTone> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
};

// inputClass bỏ `h-9` thay `py-2` khi dùng cho textarea.
const textareaClass =
  'w-full resize-y rounded-md border border-[#e2e8f0] bg-card px-2.5 py-2 text-body-md text-ink ' +
  'transition-all placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const selectClass =
  'h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink ' +
  'transition-all focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

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
    <div>
      <PageHeader title="Đánh giá & Báo lỗi" />
      {loading && <LoadingState />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-headline-md text-ink">Đánh giá của ứng viên ({allReviews.length})</h2>
        {allReviews.length === 0 && (
          <EmptyState icon="star" title="Chưa có đánh giá nào." />
        )}
        <div className="flex flex-col gap-3">
          {allReviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-body-md text-ink">
                  <strong>{r.reviewerName}</strong> đã đánh giá <strong>{r.targetName}</strong>
                </span>
                <StarDisplay rating={r.rating} />
              </div>
              {r.jobTitle && <p className="mt-1 text-body-sm text-ink-variant">Vị trí: {r.jobTitle}</p>}
              <p className="mt-1.5 text-body-md text-ink">{r.comment}</p>
              {r.reply ? (
                <p className="mt-1 text-body-sm text-ink-variant">Đã phản hồi: {r.reply}</p>
              ) : (
                <>
                  <textarea
                    className={`${textareaClass} mt-2`}
                    placeholder="Viết phản hồi..."
                    value={reviewReplies[r.id] || ''}
                    onChange={(e) => setReviewReplies((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className={buttonClass('primary')}
                      onClick={() => onReplyReview(r.id)}
                      disabled={!(reviewReplies[r.id] || '').trim()}
                    >
                      Phản hồi
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-headline-md text-ink">Báo lỗi &amp; Góp ý ({allBugs.length})</h2>
        {allBugs.length === 0 && (
          <EmptyState icon="bug_report" title="Chưa có báo cáo nào." />
        )}
        <div className="flex flex-col gap-3">
          {allBugs.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-headline-sm text-ink">{b.title}</strong>
                <Badge tone={statusTone[b.status]}>{BUG_STATUS_LABELS[b.status]}</Badge>
              </div>
              <p className="mt-1 text-body-sm text-ink-variant">
                {b.reporterName} · {BUG_CATEGORY_LABELS[b.category as BugCategory]} ·{' '}
                <span className="tabular-nums">{new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-body-md text-ink">{b.description}</p>
              {b.reply && <p className="mt-1 text-body-sm text-ink-variant">Phản hồi hiện tại: {b.reply}</p>}
              <div className="mt-2 flex items-center gap-2">
                <select
                  className={selectClass}
                  value={bugStatus[b.id] || b.status}
                  onChange={(e) => setBugStatus((prev) => ({ ...prev, [b.id]: e.target.value as BugStatus }))}
                >
                  {(Object.keys(BUG_STATUS_LABELS) as BugStatus[]).map((s) => (
                    <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <textarea
                className={`${textareaClass} mt-2`}
                placeholder="Phản hồi người báo lỗi..."
                value={bugReplies[b.id] || ''}
                onChange={(e) => setBugReplies((prev) => ({ ...prev, [b.id]: e.target.value }))}
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className={buttonClass('primary')} onClick={() => onUpdateBug(b.id)}>
                  Cập nhật
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminFeedbackPage;
