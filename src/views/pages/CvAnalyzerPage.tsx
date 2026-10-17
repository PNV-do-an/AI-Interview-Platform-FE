import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvController } from '../../controllers/useCvController';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const textareaClass = inputClass.replace('h-9', 'py-2');

const scoreClass = (score: number) =>
  score >= 80 ? 'text-success-text' : score >= 50 ? 'text-primary' : 'text-danger-text';

const CvAnalyzerPage = () => {
  const { user } = useAuth();
  const { cvs, analysis, loading, error, successMsg, analyzeCv, fetchMyCvs, clearMessages } =
    useCvController();

  const [cvText, setCvText] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchMyCvs();
  }, [user]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (cvText.trim().length < 50) {
      return;
    }
    await analyzeCv(cvText.trim(), fileName || undefined);
    fetchMyCvs();
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
        title="Quét & phân tích CV bằng AI"
        description="Dán nội dung CV của bạn (sao chép từ file Word/PDF) để AI phát hiện kỹ năng, chấm điểm và đề xuất cải thiện."
      />

      <Card className="mb-8">
        <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Tên file CV (tùy chọn)</label>
            <input
              className={`${inputClass} max-w-[360px]`}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="VD: CV_NguyenVanA.pdf"
            />
          </div>
          <div>
            <label className={labelClass}>Nội dung CV</label>
            <textarea
              className={`${textareaClass} min-h-[260px]`}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder={"Dán toàn bộ nội dung CV tại đây...\n\nGợi ý: nên có các mục Thông tin liên hệ, Tóm tắt, Kinh nghiệm, Học vấn, Kỹ năng."}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className={buttonClass('primary')}
              disabled={cvText.trim().length < 50 || loading}
            >
              {loading ? 'Đang phân tích...' : 'Phân tích CV'}
            </button>
            {cvText.trim().length > 0 && cvText.trim().length < 50 && (
              <span className="text-body-sm text-danger-text">
                Nội dung quá ngắn (tối thiểu 50 ký tự).
              </span>
            )}
          </div>
        </form>
      </Card>

      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {analysis && (
        <Card className="mb-8">
          <h3 className="m-0 text-headline-md text-ink">Kết quả phân tích: {analysis.fileName}</h3>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="text-center">
              <div className={`text-metric-stat font-semibold ${scoreClass(analysis.cvScore)}`}>
                {analysis.cvScore}/100
              </div>
              <div className="text-label-sm text-ink-variant">Điểm CV</div>
            </div>
            <div className="min-w-[260px] flex-1">
              <span className="text-headline-sm text-ink">Kỹ năng phát hiện ({analysis.detectedSkills.length})</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.detectedSkills.length === 0 && (
                  <span className="text-body-sm text-ink-variant">Chưa phát hiện kỹ năng nào.</span>
                )}
                {analysis.detectedSkills.map((s) => (
                  <Badge key={s} tone="info">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
          {analysis.suggestions.length > 0 && (
            <div className="mt-4">
              <span className="text-headline-sm text-ink">Đề xuất cải thiện</span>
              <ul className="mt-2 list-disc pl-5 text-body-md text-ink-variant">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="mb-1">{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3">
            <Link to="/cover-letters" className="inline-flex items-center gap-1 text-body-md text-primary no-underline hover:underline">
              Dùng CV này để tạo thư xin việc
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </p>
        </Card>
      )}

      <h3 className="mb-2 text-headline-md text-ink">CV đã phân tích</h3>
      {cvs.length === 0 ? (
        <EmptyState icon="fact_check" title="Chưa có CV nào được phân tích." />
      ) : (
        <div className="flex flex-col gap-2">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e2e8f0] bg-card px-4 py-2.5"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-headline-sm text-ink">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  {cv.fileName}
                </span>
                <span className="text-body-sm text-ink-variant">
                  {new Date(cv.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <span className={`text-metric-stat font-semibold ${scoreClass(cv.cvScore)}`}>{cv.cvScore}/100</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CvAnalyzerPage;
