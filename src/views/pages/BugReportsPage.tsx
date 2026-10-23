import React, { useEffect, useState } from 'react';
import { useReviewController } from '../../controllers/useReviewController';
import { BUG_CATEGORY_LABELS, BUG_STATUS_LABELS, BugCategory, BugStatus } from '../../models/Review.model';
import {
  Badge, buttonClass, Card, ErrorBanner, PageHeader, inputClass,
} from '../components/ui';

type BadgeTone = 'warning' | 'info' | 'success';

const statusTone: Record<BugStatus, BadgeTone> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
};

// inputClass bỏ `h-9` thay `py-2` khi dùng cho textarea.
const textareaClass =
  'min-h-[110px] w-full resize-y rounded-md border border-[#e2e8f0] bg-card px-2.5 py-2 text-body-md text-ink ' +
  'transition-all placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

// inputClass ép `w-full` nên select dùng bản riêng (bỏ w-full) để bo theo nội dung.
const selectClass =
  'h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink ' +
  'transition-all focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const BugReportsPage: React.FC = () => {
  const { myBugs, loading, error, successMsg, createBugReport, fetchMyBugs } = useReviewController();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BugCategory>('BUG');
  const [description, setDescription] = useState('');

  useEffect(() => { fetchMyBugs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async () => {
    const ok = await createBugReport({ title: title.trim(), category, description: description.trim() });
    if (ok) {
      setTitle('');
      setCategory('BUG');
      setDescription('');
      fetchMyBugs();
    }
  };

  return (
    <div>
      <PageHeader
        title="Báo cáo sự cố"
        description="Báo một vấn đề hoặc gợi ý tính năng để giúp đội ngũ cải thiện nền tảng."
      />
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <Card>
        <h2 className="m-0 text-headline-sm text-ink">Gửi báo cáo mới</h2>
        <div className="mt-3 flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as BugCategory)}>
            {(Object.keys(BUG_CATEGORY_LABELS) as BugCategory[]).map((c) => (
              <option key={c} value={c}>{BUG_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <textarea
            className={textareaClass}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={onSubmit}
              disabled={loading || !title.trim() || !description.trim()}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-headline-md text-ink">Báo cáo của tôi</h2>
      {myBugs.length === 0 && (
        <p className="m-0 text-body-sm text-ink-variant">Chưa có báo cáo nào được gửi.</p>
      )}
      <div className="flex flex-col gap-3">
        {myBugs.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-headline-sm text-ink">{b.title}</strong>
              <Badge tone={statusTone[b.status]}>{BUG_STATUS_LABELS[b.status]}</Badge>
            </div>
            <p className="mt-1 text-body-sm tabular-nums text-ink-variant">
              {BUG_CATEGORY_LABELS[b.category]} · {new Date(b.createdAt).toLocaleDateString('vi-VN')}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-body-md text-ink">{b.description}</p>
            {b.reply && (
              <div className="mt-2 rounded-md bg-surface-low p-3">
                <strong className="text-label-md text-ink">Phản hồi từ {b.repliedByName || 'đội ngũ hỗ trợ'}:</strong>
                <p className="mt-1 text-body-sm text-ink-variant">{b.reply}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BugReportsPage;
