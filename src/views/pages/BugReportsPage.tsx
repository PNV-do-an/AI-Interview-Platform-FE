import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviewController } from '../../controllers/useReviewController';
import { BUG_CATEGORY_LABELS, BUG_STATUS_LABELS, BugCategory, BugStatus } from '../../models/Review.model';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 760, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #D5DEEF', borderRadius: 8, padding: 20, marginTop: 16, background: '#fff' },
  input: { width: '100%', padding: 8, marginTop: 8, boxSizing: 'border-box' as const },
  textarea: { width: '100%', minHeight: 110, padding: 8, marginTop: 8, boxSizing: 'border-box' as const },
  meta: { color: '#6b7280', fontSize: 14 },
  reply: { background: '#F0F3FA', borderRadius: 6, padding: 10, marginTop: 10, fontSize: 14 },
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
    <div style={styles.page}>
      <h2>Báo cáo lỗi &amp; góp ý</h2>
      <p style={styles.meta}>Phản ánh sự cố hoặc đề xuất tính năng để đội ngũ phát triển cải thiện nền tảng.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <div style={styles.card}>
        <h3>Gửi báo cáo mới</h3>
        <input
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as BugCategory)} style={styles.input}>
          {(Object.keys(BUG_CATEGORY_LABELS) as BugCategory[]).map((c) => (
            <option key={c} value={c}>{BUG_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <textarea
          placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={onSubmit} disabled={loading || !title.trim() || !description.trim()}>
            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 32 }}>Báo cáo của tôi</h3>
      {myBugs.length === 0 && <p style={styles.meta}>Bạn chưa gửi báo cáo nào.</p>}
      {myBugs.map((b) => {
        const [color, bg] = statusColor[b.status];
        return (
          <div key={b.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong>{b.title}</strong>
              <span style={badge(color, bg)}>{BUG_STATUS_LABELS[b.status]}</span>
            </div>
            <p style={styles.meta}>{BUG_CATEGORY_LABELS[b.category]} · {new Date(b.createdAt).toLocaleDateString('vi-VN')}</p>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{b.description}</p>
            {b.reply && (
              <div style={styles.reply}>
                <strong>Phản hồi từ {b.repliedByName || 'đội ngũ hỗ trợ'}:</strong>
                <p style={{ margin: '4px 0 0' }}>{b.reply}</p>
              </div>
            )}
          </div>
        );
      })}

      <p style={{ marginTop: 24 }}>
        <Link to="/dashboard">← Về trang tổng quan</Link>
      </p>
    </div>
  );
};

export default BugReportsPage;
