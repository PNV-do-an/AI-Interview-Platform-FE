import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { useAuth } from '../../context/AuthContext';
import { buttonClass } from '../components/ui';

// Nhãn dải điểm — CHUỶ ÁNH XẠ TRÌNH BÀY từ điểm thật (a.score), không phải dữ liệu mới.
const scoreBand = (score: number) =>
  score >= 90 ? 'Xuất sắc' : score >= 80 ? 'Tốt' : score >= 70 ? 'Khá tốt' : score >= 50 ? 'Cần cải thiện' : 'Cần cố gắng';

// Định dạng giây -> mm:ss cho thời lượng trả lời (durationSec thật từ API).
const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const MockInterviewResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { result, loading, error, fetchResult } = useMockInterviewController();

  // Trạng thái accordion (UI-only): mặc định mở câu đầu tiên khi có dữ liệu.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user?.role === 'ROLE_USER' && id) fetchResult(Number(id));
  }, [user, id]);

  useEffect(() => {
    if (result?.answers?.length) setOpenIds(new Set([result.answers[0].id]));
  }, [result]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className="p-10 text-body-md text-ink-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }
  if (!result) {
    return (
      <div className="p-10 text-body-md text-ink-variant">
        {loading ? 'Đang tải...' : (error || 'Chưa có kết quả.')}
      </div>
    );
  }

  const { session, answers } = result;
  const answered = answers.filter((a) => a.answerText);
  const overall = session.overallScore ?? 0;

  // Nhãn vai trò / tiêu đề / thời điểm — tất cả dẫn xuất từ field thật của session.
  const roleLabel = session.mode === 'MOCK' ? (session.jobTitle || 'Phiên luyện tập') : (session.topic || 'Luyện tập kiến thức');
  const reportTitle = session.mode === 'MOCK' ? (session.jobTitle || 'Mô phỏng') : (session.topic || 'Luyện tập');
  const completedAt = session.completedAt || session.createdAt;
  const completedDate = new Date(completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  const totalSec = answers.reduce((sum, a) => sum + (a.durationSec ?? 0), 0);
  const completedLabel = totalSec > 0
    ? `Hoàn tất ${completedDate} • thời lượng ${Math.round(totalSec / 60)} phút`
    : `Hoàn tất ${completedDate}`;

  const toggle = (qid: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid); else next.add(qid);
      return next;
    });
  const expandAll = () => setOpenIds(new Set(answers.map((a) => a.id)));
  const collapseAll = () => setOpenIds(new Set());
  const share = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb — dùng session id thật, link về danh sách phiên. */}
      <div className="flex items-center gap-1 text-label-sm text-ink-variant">
        <Link to="/mock-interviews" className="flex items-center gap-1 text-ink-variant transition-colors hover:text-primary">
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          <span>Phiên</span>
        </Link>
        <span>/</span>
        <span className="text-ink">Phiên #{session.id}</span>
      </div>

      {/* Header: vai trò + tiêu đề + điểm tổng + cụm nút hành động. */}
      <div className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-info px-2 py-0.5 text-label-sm text-info-text">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              {roleLabel}
            </span>
            <span className="rounded-full bg-surface-mid px-2 py-0.5 text-label-sm text-ink-variant">{completedLabel}</span>
          </div>
          <h1 className="m-0 text-headline-lg text-ink">Báo cáo đánh giá: {reportTitle}</h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-2 rounded-full bg-info px-3 py-1 text-label-md text-info-text">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              <span className="text-headline-sm text-primary tabular-nums">Điểm: {overall}/100</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
          <button type="button" onClick={() => window.print()} className={buttonClass('secondary')}>
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Xuất báo cáo PDF
          </button>
          <button type="button" onClick={share} className={buttonClass('secondary')}>
            <span className="material-symbols-outlined text-[16px]">share</span>
            Chia sẻ với nhà tuyển dụng
          </button>
          <Link to="/mock-interviews" className={buttonClass('primary', 'no-underline')}>
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Luyện tập lại
          </Link>
        </div>
      </div>

      {/* Overall Rating — thẻ điểm tổng duy nhất có field thật (overallScore).
          Bỏ Percentile / Top % / Benchmarked against N vì model không có field. */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-outline-strong">Điểm tổng quan</span>
          <span className="material-symbols-outlined text-[20px] text-primary">military_tech</span>
        </div>
        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-metric-stat text-primary tabular-nums">{overall}</span>
          <span className="text-headline-sm text-outline-strong">/100</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            /* width dẫn xuất từ điểm tổng overallScore -> giữ inline style */
            style={{ width: `${overall}%` }}
          />
        </div>
        <div className="mt-2 text-body-sm text-ink-variant tabular-nums">
          Đã trả lời {answered.length}/{session.questions.length} câu hỏi
        </div>
      </div>

      {/* Question-by-Question Deep Dive — dựng theo TỪNG CÂU (điểm từng câu có field thật). */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-label-md font-bold text-on-primary tabular-nums">
              {answers.length}
            </div>
            <div>
              <h3 className="m-0 text-headline-sm text-ink">Chi tiết theo từng câu hỏi</h3>
              <p className="m-0 text-body-sm text-outline-strong">AI chấm điểm và góp ý cho từng câu hỏi</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-label-sm">
            <button type="button" onClick={expandAll} className="rounded bg-surface-mid px-2 py-1 text-ink transition-colors hover:bg-surface-high">
              Mở tất cả
            </button>
            <button type="button" onClick={collapseAll} className="rounded bg-surface-mid px-2 py-1 text-ink transition-colors hover:bg-surface-high">
              Thu gọn tất cả
            </button>
          </div>
        </div>

        {answers.map((a) => {
          const open = openIds.has(a.id);
          return (
            <div key={a.id} className="overflow-hidden rounded-xl bg-card shadow-sm">
              <button
                type="button"
                onClick={() => toggle(a.id)}
                className="flex w-full items-center justify-between gap-2 p-4 text-left transition-colors hover:bg-surface-low"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold ${
                      open ? 'bg-info text-primary' : 'bg-surface-mid text-ink'
                    }`}
                  >
                    {`Q${a.questionIndex + 1}`}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-headline-sm text-ink">{a.question}</span>
                    {a.durationSec != null && (
                      <span className="text-body-sm text-outline-strong tabular-nums">Trả lời trong {fmtDuration(a.durationSec)}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {a.score != null && (
                    <div className="flex flex-col text-right">
                      <span className="text-headline-sm text-primary tabular-nums">{a.score}/100</span>
                      <span className="text-label-sm text-primary">{scoreBand(a.score)}</span>
                    </div>
                  )}
                  <span className={`material-symbols-outlined text-outline-strong transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </button>

              {open && (
                <div className="flex flex-col gap-3 p-4 pt-0">
                  {a.answerText ? (
                    <div className="rounded-lg bg-surface-low p-4">
                      <span className="text-label-sm font-semibold uppercase tracking-wider text-outline-strong">Nội dung câu trả lời</span>
                      <p className="m-0 mt-1 whitespace-pre-wrap text-body-md text-ink">{a.answerText}</p>
                    </div>
                  ) : (
                    <p className="m-0 text-body-sm italic text-ink-variant">Chưa ghi nhận câu trả lời.</p>
                  )}
                  {a.feedback && (
                    <div className="flex flex-col gap-1 rounded-lg bg-surface-high p-4">
                      <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                        <span className="text-label-md font-semibold">Cơ sở đánh giá của AI</span>
                      </div>
                      <p className="m-0 text-body-sm text-ink">{a.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MockInterviewResultPage;
