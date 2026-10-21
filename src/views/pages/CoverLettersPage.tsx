import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvController } from '../../controllers/useCvController';
import { useJobController } from '../../controllers/useJobController';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Card,
  ErrorBanner,
  PageHeader,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const textareaClass = inputClass.replace('h-9', 'py-2');

const CoverLettersPage = () => {
  const { user } = useAuth();
  const {
    cvs, letters, current, loading, error, successMsg,
    generateLetter, fetchMyCvs, fetchMyLetters, updateLetter, deleteLetter, clearMessages,
  } = useCvController();
  const { jobs, fetchJobs } = useJobController();

  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState<number | ''>('');
  const [cvId, setCvId] = useState<number | ''>('');
  const [content, setContent] = useState('');
  const [pendingDelId, setPendingDelId] = useState<number | null>(null);

  const runDelete = async () => {
    if (pendingDelId === null) return;
    const id = pendingDelId;
    setPendingDelId(null);
    const ok = await deleteLetter(id);
    if (ok) fetchMyLetters();
  };

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMyCvs();
      fetchMyLetters();
      fetchJobs(0, '');
    }
  }, [user]);

  useEffect(() => {
    if (current) setContent(current.content);
  }, [current?.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const letter = await generateLetter({
      title,
      jobId: jobId !== '' ? Number(jobId) : undefined,
      cvId: cvId !== '' ? Number(cvId) : undefined,
    });
    if (letter) {
      fetchMyLetters();
    }
  };

  const handleSave = async () => {
    if (!current) return;
    const ok = await updateLetter(current.id, content);
    if (ok) fetchMyLetters();
  };

  const handleDownload = () => {
    if (!current) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.title.replace(/[^\wÀ-ỹ -]+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openLetter = (id: number) => {
    const letter = letters.find((l) => l.id === id);
    if (letter) setContent(letter.content);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-body-md text-ink-variant">
        Vui lòng đăng nhập với tài khoản ứng viên.
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Thư xin việc AI"
        description="Chọn tin tuyển dụng và CV đã phân tích — AI sẽ soạn thư xin việc nháp, bạn có thể chỉnh sửa và tải xuống."
      />

      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Card className="mb-5">
            <h3 className="m-0 text-headline-md text-ink">Tạo thư mới</h3>
            <form onSubmit={handleGenerate} className="mt-3 flex flex-col gap-3">
              <div>
                <label className={labelClass}>Tiêu đề thư</label>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thư xin việc Java Developer - FPT"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Tin tuyển dụng (tùy chọn)</label>
                <select className={inputClass} value={jobId} onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Thư dùng chung —</option>
                  {jobs?.content.map((j) => (
                    <option key={j.id} value={j.id}>{j.title} — {j.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>CV làm cơ sở (khuyến nghị)</label>
                <select className={inputClass} value={cvId} onChange={(e) => setCvId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Không dùng CV —</option>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>{cv.fileName} ({cv.cvScore}/100)</option>
                  ))}
                </select>
                {cvs.length === 0 && (
                  <p className="mt-1 text-body-sm text-ink-variant">
                    Bạn chưa có CV nào — <Link to="/cv-analyzer" className="text-primary no-underline hover:underline">phân tích CV</Link> trước.
                  </p>
                )}
              </div>
              <button type="submit" className={buttonClass('primary', 'self-start')} disabled={!title.trim() || loading}>
                {loading ? 'Đang tạo...' : 'Tạo thư'}
              </button>
            </form>
          </Card>

          <h3 className="mb-2 text-headline-md text-ink">Thư đã lưu</h3>
          {letters.length === 0 ? (
            <p className="text-body-md text-ink-variant">Chưa có thư nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {letters.map((l) => (
                <div
                  key={l.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2.5 transition-colors ${
                    current?.id === l.id ? 'border-primary bg-surface-low' : 'border-[#e2e8f0] bg-card hover:bg-surface-low'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-headline-sm text-ink">{l.title}</span>
                    <span className="text-label-sm text-ink-variant">
                      {l.jobTitle ? `${l.jobTitle} · ` : ''}{new Date(l.updatedAt || l.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button className={buttonClass('ghost', 'h-auto px-2 py-1 text-label-sm')} onClick={() => openLetter(l.id)}>
                      Xem
                    </button>
                    <button
                      className={buttonClass('ghost', 'h-auto px-2 py-1 text-label-sm text-danger-text hover:bg-danger-bg')}
                      onClick={() => setPendingDelId(l.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-headline-md text-ink">Nội dung thư</h3>
          <textarea
            className={`${textareaClass} min-h-[420px] leading-relaxed`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung thư sẽ hiển thị ở đây — bạn có thể chỉnh sửa trực tiếp."
          />
          <div className="mt-3 flex gap-2">
            <button className={buttonClass('primary')} onClick={handleSave} disabled={!current}>
              Lưu thay đổi
            </button>
            <button className={buttonClass('secondary')} onClick={handleDownload} disabled={!content.trim()}>
              <span className="material-symbols-outlined text-[18px]">download</span>
              Tải xuống (.txt)
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelId !== null}
        title="Xóa thư này?"
        message="Thư đã xóa sẽ không còn trong danh sách. Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setPendingDelId(null)}
      />
    </div>
  );
};

export default CoverLettersPage;
