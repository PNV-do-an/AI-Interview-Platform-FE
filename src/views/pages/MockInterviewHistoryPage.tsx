/**
 * Màn "Lịch sử phỏng vấn AI & Quá trình tiến bộ" (mockup Stitch `screen_10`, phần bảng dưới)
 * — route /mock-interviews/history, shell CandidateLayout.
 *
 * Số thật: GET /interviews/my (controller `fetchMySessions(page)`, size 10) -> totalElements,
 * từng phiên (mode, jobTitle/topic, companyName, status, answeredCount/questions, overallScore,
 * createdAt, completedAt). Nút "Xem" mở /mock-interviews/:id/result khi COMPLETED, mở lại phiên
 * /mock-interviews/:id khi còn IN_PROGRESS.
 *
 * Sao đổi so với mockup:
 * - Tab lọc theo chủ đề ("Frontend Dev (8)", "System Design (3)"…) -> tab theo TRẠNG THÁI thật vì
 *   phiên chỉ có mode MOCK/KNOWLEDGE + status; đếm trong trang đang xem (BE không có bộ lọc status
 *   nên tab chỉ áp dụng trên trang này — ghi rõ dưới hàng tab).
 * - Cột "Thời lượng": InterviewSession không có field thời lượng -> thay bằng "Tiến trình"
 *   (MOCK/KNOWLEDGE: số câu đã trả lời/tổng; AVATAR: số lượt đã chốt — BE 012 không sinh câu trước).
 * - Wave 26/10 (BE 012): thêm chip "Video Call" cho mode AVATAR + nút xóa phiên qua DELETE (ConfirmDialog).
 * - Cột "Đánh giá chính": mockup dùng chữ do AI viết -> dùng dải điểm suy ra từ overallScore.
 * - Cột "Hành động" bỏ nút replay riêng -> "Luyện phiên mới" ở đầu trang dẫn tới màn bắt đầu phiên.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import { INTERVIEW_MODE_LABELS, InterviewSession } from '../../models/Interview.model';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pagination, Pill,
  adminButton, adminTableClass, adminTdClass, adminThClass, fmtServer, timeAgo,
} from '../components/adminKit';
import { CARD, CandidatePageHeader, CandidateStat, SOFT } from '../components/candidateKit';

type Tab = 'ALL' | 'COMPLETED' | 'IN_PROGRESS';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'Tất cả phiên' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'IN_PROGRESS', label: 'Đang làm' },
];

/** Dải điểm dẫn xuất từ overallScore thật (không phải nhận định AI). */
const scoreBand = (score: number) =>
  score >= 90 ? 'Xuất sắc' : score >= 80 ? 'Tốt' : score >= 70 ? 'Khá tốt' : score >= 50 ? 'Cần cải thiện' : 'Cần cố gắng';

const scoreTone = (score?: number): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
  if (score == null) return 'neutral';
  if (score >= 80) return 'success';
  if (score >= 70) return 'primary';
  if (score >= 50) return 'warning';
  return 'danger';
};

const titleOf = (s: InterviewSession) =>
  s.mode === 'MOCK' ? s.jobTitle ?? 'Phiên mô phỏng'
    : s.mode === 'AVATAR' ? s.jobTitle ?? 'Phòng video call AI'
      : s.topic ?? 'Luyện theo chủ đề';
const subOf = (s: InterviewSession) =>
  s.mode === 'MOCK' ? s.companyName ?? 'Theo tin tuyển dụng'
    : s.mode === 'AVATAR' ? INTERVIEW_MODE_LABELS.AVATAR
      : 'Luyện kiến thức theo chủ đề';
/** MOCK/KNOWLEDGE: câu hỏi sinh trước; AVATAR: `questions` rỗng, đếm theo lượt đã chốt (BE 012). */
const progressOf = (s: InterviewSession) =>
  s.mode === 'AVATAR' ? `${s.answeredCount} lượt chốt` : `${s.answeredCount}/${s.questions?.length ?? 0}`;

const MockInterviewHistoryPage: React.FC = () => {
  const { sessions, loading, error, successMsg, fetchMySessions, deleteSession } = useMockInterviewController();
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(0);
  const [toDelete, setToDelete] = useState<InterviewSession | null>(null);

  useEffect(() => { void fetchMySessions(page); }, [fetchMySessions, page]);

  const runDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    if (await deleteSession(target.id)) void fetchMySessions(page);
  };

  const rows = sessions?.content ?? [];
  const visible = useMemo(
    () => (tab === 'ALL' ? rows : rows.filter(r => r.status === tab)),
    [rows, tab],
  );

  const pageStats = useMemo(() => {
    const done = rows.filter(r => r.status === 'COMPLETED');
    const scored = done.map(r => r.overallScore).filter((v): v is number => typeof v === 'number');
    const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
    const best = scored.length ? Math.max(...scored) : null;
    const answered = rows.reduce((sum, r) => sum + (r.answeredCount ?? 0), 0);
    return { done: done.length, running: rows.length - done.length, avg, best, answered };
  }, [rows]);

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Luyện phỏng vấn AI', to: '/mock-interviews' }, { label: 'Lịch sử & Đánh giá' }]}
        title="Lịch sử phỏng vấn AI & Quá trình tiến bộ"
        subtitle="Theo dõi sự cải thiện điểm số qua các phiên luyện tập mô phỏng."
        actions={
          <>
            <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
              <span className={`${ICON} text-[18px]`}>add_circle</span>
              Luyện phiên mới
            </Link>
            <button type="button" onClick={() => void fetchMySessions(page)} className={adminButton('ghost', 'h-10')}>
              <span className={`${ICON} text-[18px] text-outline`}>autorenew</span>
              Làm mới
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        <CandidateStat
          label="Tổng số phiên"
          value={sessions?.totalElements ?? 0}
          unit="phiên"
          icon="history"
          tone="primary"
          sub={
            <span className="text-on-surface-variant">
              Trang này: {pageStats.done} hoàn thành • {pageStats.running} đang làm
            </span>
          }
        />
        <CandidateStat
          label="Điểm trung bình"
          value={pageStats.avg ?? '—'}
          unit="/100"
          icon="analytics"
          tone="teal"
          sub={
            <span className="text-on-surface-variant">
              {pageStats.avg == null ? 'Chưa có phiên chấm điểm' : `Tính trên ${pageStats.done} phiên của trang này`}
            </span>
          }
          barPct={pageStats.avg ?? 0}
        />
        <CandidateStat
          label="Điểm cao nhất"
          value={pageStats.best ?? '—'}
          unit="/100"
          icon="military_tech"
          tone="tertiary"
          sub={
            pageStats.best != null && (
              <Pill tone={scoreTone(pageStats.best)}>{scoreBand(pageStats.best)}</Pill>
            )
          }
          barPct={pageStats.best ?? 0}
        />
        <CandidateStat
          label="Số câu đã trả lời"
          value={pageStats.answered}
          unit="câu"
          icon="edit_note"
          tone="neutral"
          sub={<span className="text-on-surface-variant">Tổng trong trang đang xem</span>}
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={() => void fetchMySessions(page)} />}

      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-col gap-space-md border-b border-surface-container-high pb-space-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-ds-headline-sm font-bold tracking-tight text-on-surface">Bảng phiên luyện tập</h2>
            <p className="text-ds-body-sm text-on-surface-variant">Mỗi dòng mở báo cáo đánh giá chi tiết của phiên đó.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-container-low p-1 text-ds-label-md">
            {TABS.map(t => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded px-space-md py-1.5 transition-colors ${
                    active ? 'bg-surface-container-lowest font-bold text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {t.key === 'ALL' ? rows.length : t.key === 'COMPLETED' ? pageStats.done : pageStats.running}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="-mt-2 text-ds-body-sm text-outline">
          Bộ lọc áp dụng trên trang đang xem; tổng số phiên chính xác nằm ở card "Tổng số phiên".
        </p>

        {loading && !sessions ? (
          <LoadingBlock label="Đang tải lịch sử phiên luyện tập..." />
        ) : visible.length === 0 ? (
          <EmptyBlock
            icon="smart_toy"
            title="Chưa có phiên luyện tập nào"
            description="Bắt đầu một phiên mô phỏng để hệ thống chấm điểm và lưu lại quá trình tiến bộ của bạn."
            action={
              <Link to="/mock-interviews" className={adminButton('primary', 'h-10 no-underline')}>
                Luyện phiên mới
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className={adminTableClass}>
              <thead>
                <tr>
                  <th className={adminThClass}>Ngày thực hiện</th>
                  <th className={adminThClass}>Vị trí / Chủ đề</th>
                  <th className={adminThClass}>Tiến trình</th>
                  <th className={adminThClass}>Điểm tổng</th>
                  <th className={adminThClass}>Đánh giá</th>
                  <th className={`${adminThClass} text-right`}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(s => (
                  <tr key={s.id} className="transition-colors hover:bg-surface-container-low/60">
                    <td className={adminTdClass}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{fmtServer(s.completedAt ?? s.createdAt, 'date')}</span>
                        <span className="text-ds-label-sm text-outline">
                          {s.status === 'COMPLETED' ? timeAgo(s.completedAt ?? s.createdAt) : `Bắt đầu ${timeAgo(s.createdAt)}`}
                        </span>
                      </div>
                    </td>
                    <td className={adminTdClass}>
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${s.status === 'COMPLETED' ? 'bg-secondary-teal' : 'bg-primary'}`} />
                        <span className="font-medium text-on-surface">{titleOf(s)}</span>
                        {s.mode === 'AVATAR' && <Pill tone="warning">Video Call</Pill>}
                      </div>
                      <span className="text-ds-label-sm text-outline-variant">{subOf(s)}</span>
                    </td>
                    <td className={`${adminTdClass} tabular-nums`}>
                      {progressOf(s)}
                    </td>
                    <td className={adminTdClass}>
                      {s.overallScore != null ? (
                        <Pill tone={scoreTone(s.overallScore)}>{s.overallScore}/100</Pill>
                      ) : (
                        <span className="text-outline">Chưa chấm</span>
                      )}
                    </td>
                    <td className={adminTdClass}>
                      {s.overallScore != null ? (
                        <span className="flex items-center gap-1 text-secondary-teal">
                          <span className={`${ICON} text-[16px]`}>stars</span>
                          {scoreBand(s.overallScore)}
                        </span>
                      ) : (
                        <Pill tone={s.status === 'COMPLETED' ? 'success' : 'primary'}>
                          {s.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang làm'}
                        </Pill>
                      )}
                    </td>
                    <td className={`${adminTdClass} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={s.status === 'COMPLETED' ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                          className={adminButton('soft', 'h-9 no-underline')}
                        >
                          <span className={`${ICON} text-[16px]`}>visibility</span>
                          {s.status === 'COMPLETED' ? 'Xem báo cáo' : 'Tiếp tục'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setToDelete(s)}
                          className={adminButton('ghost', 'h-9 px-2.5')}
                          title={`Xóa phiên ${titleOf(s)}`}
                        >
                          <span className={`${ICON} text-[16px] text-error`}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sessions && sessions.totalElements > 0 && (
          <Pagination
            page={sessions.number}
            pageSize={sessions.size}
            total={sessions.totalElements}
            onPage={p => {
              setPage(p);
              setTab('ALL');
            }}
          />
        )}
      </section>

      <div className={`flex flex-wrap items-center gap-space-md rounded-xl p-space-lg ${SOFT}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
          <span className={`${ICON} text-[22px]`}>insights</span>
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-ds-label-lg font-bold text-on-surface">Điểm theo từng câu mới hiện trong báo cáo</span>
          <p className="text-ds-body-sm text-on-surface-variant">
            Mở một phiên đã hoàn thành để xem điểm từng câu hỏi, nội dung trả lời và nhận xét kèm theo.
            Phiên video call hiển thị transcript từng lượt và rubric 5 chiều bạn đã nộp.
          </p>
        </div>
      </div>

      {successMsg && (
        <Pill tone="success" icon="check_circle">{successMsg}</Pill>
      )}

      <ConfirmDialog
        open={toDelete != null}
        title="Xóa phiên luyện tập này?"
        message={toDelete
          ? `"${titleOf(toDelete)}" cùng toàn bộ câu trả lời và báo cáo của phiên sẽ bị xóa vĩnh viễn, không thể hoàn tác.`
          : ''}
        confirmLabel="Xóa phiên"
        cancelLabel="Giữ lại"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default MockInterviewHistoryPage;
