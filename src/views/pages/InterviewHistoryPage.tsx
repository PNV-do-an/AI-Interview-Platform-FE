import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMockInterviewController } from '../../controllers/useMockInterviewController';
import InterviewService from '../../services/interview.service';
import { useAuth } from '../../context/AuthContext';
import { InterviewSession } from '../../models/Interview.model';
import { parseServerTimestamp } from '../../utils/date';
import { ICON, EmptyBlock, ErrorBlock, LoadingBlock, adminButton, fmtServer, timeAgo } from '../components/adminKit';
import { Card } from '../components/ui';

/**
 * Màn "Lịch sử phỏng vấn AI & Quá trình tiến bộ" (route `/interview-history`) — dựng từ khối
 * bảng lịch sử của mockup Stitch 4 `screen_10_k_t_qu_ph_ng_v_n_ai_l_ch_s_luy_n_t_p`
 * (plan `candidate-redesign-stitch4.md` §4-S4 / §5-S4).
 *
 * Token mockup -> token dự án: `text-label-*`/`text-body-*` -> `text-ds-*`, `secondary` teal
 * #006b5f -> `secondary-teal`, `outline` #777587 -> `outline-strong`, `font-*` (Inter) -> bỏ.
 *
 * Data: `GET /mock-interviews/my` (controller). Tab lọc nhóm theo `jobTitle` (MOCK) / `topic`
 * (KNOWLEDGE) dẫn xuất client-side; phân trang client-side.
 *
 * Khối mockup BỎ (conventions §3): dòng keyword kỹ năng dưới mỗi vị trí ("React 18, TypeScript...")
 * vì session không có field, và "Top 78%" / điểm theo tiêu chí ở màn báo cáo.
 */

const PAGE_SIZE = 10;
const MAX_TAIL_PAGES = 19;

// BE chấm thang 0-100 (dữ liệu cũ có thể thang 0-10) -> đưa về thang 100 để tra dải điểm.
const toHundred = (score: number) => (score <= 10 ? score * 10 : score);

const BANDS: { min: number; label: string; icon: string; pill: string; text: string }[] = [
  { min: 90, label: 'Xuất sắc', icon: 'stars', pill: 'bg-secondary-container text-on-secondary-container', text: 'text-secondary-teal' },
  { min: 80, label: 'Khá', icon: 'check_circle', pill: 'bg-surface-container text-primary', text: 'text-primary' },
  { min: 70, label: 'Trung bình', icon: 'trending_flat', pill: 'bg-surface-container-high text-on-surface-variant', text: 'text-on-surface-variant' },
  { min: 50, label: 'Cần luyện thêm', icon: 'replay', pill: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', text: 'text-tertiary' },
  { min: 0, label: 'Cần cải thiện', icon: 'report_problem', pill: 'bg-error-container text-on-error-container', text: 'text-error' },
];

const bandOf = (score: number) => BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];

const sessionTotal = (s: InterviewSession) => (Array.isArray(s.questions) ? s.questions.length : s.answeredCount);

// Thời lượng phiên = completedAt - createdAt; BE trả LocalDateTime naive UTC -> parseServerTimestamp.
const durationMin = (s: InterviewSession): number | null => {
  const from = parseServerTimestamp(s.createdAt)?.getTime();
  const to = parseServerTimestamp(s.completedAt)?.getTime();
  if (!from || !to || to <= from) return null;
  return Math.max(1, Math.round((to - from) / 60000));
};

const groupKey = (s: InterviewSession): string =>
  (s.mode === 'MOCK' ? s.jobTitle : s.topic)?.trim() ||
  (s.mode === 'MOCK' ? 'Phỏng vấn mock' : 'Luyện theo chủ đề');

const titleOf = (s: InterviewSession): string =>
  s.mode === 'MOCK' ? (s.jobTitle ?? 'Phỏng vấn mock') : (s.topic ?? 'Luyện theo chủ đề');

const InterviewHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, loading, error, fetchMySessions, startSession } = useMockInterviewController();

  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(0);
  const [retakingId, setRetakingId] = useState<number | null>(null);
  // `/mock-interviews/my` phân trang phía BE (size 10) -> nạp nốt các trang còn lại
  // để tab lọc + phân trang client-side trên toàn bộ lịch sử.
  const [tailRows, setTailRows] = useState<InterviewSession[]>([]);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchMySessions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const head = useMemo(() => sessions?.content ?? [], [sessions]);
  const pageCount = sessions?.totalPages ?? 0;
  const serverSize = sessions?.size ?? PAGE_SIZE;

  useEffect(() => {
    if (pageCount <= 1) {
      setTailRows([]);
      return;
    }
    let cancelled = false;
    // Nạp tối đa MAX_TAIL trang sau để tab lọc + phân trang client-side đếm đủ mà không bắn hàng trăm request.
    const pages = Array.from({ length: Math.min(pageCount - 1, MAX_TAIL_PAGES) }, (_, i) => i + 1);
    Promise.all(pages.map((p) => InterviewService.getMySessions({ page: p, size: serverSize })))
      .then((res) => {
        if (!cancelled) setTailRows(res.flatMap((r) => r.data.data?.content ?? []));
      })
      .catch(() => {
        // Trang sau nạp lỗi -> chỉ hiển thị phần đã có, không chặn màn.
        if (!cancelled) setTailRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pageCount, serverSize]);

  const rows = useMemo(() => {
    const byId = new Map<number, InterviewSession>();
    [...head, ...tailRows].forEach((s) => byId.set(s.id, s));
    return Array.from(byId.values()).sort(
      (a, b) =>
        (parseServerTimestamp(b.completedAt ?? b.createdAt)?.getTime() ?? 0) -
        (parseServerTimestamp(a.completedAt ?? a.createdAt)?.getTime() ?? 0)
    );
  }, [head, tailRows]);

  const tabs = useMemo(() => {
    const groups = new Map<string, number>();
    rows.forEach((s) => groups.set(groupKey(s), (groups.get(groupKey(s)) ?? 0) + 1));
    return [
      { key: 'all', label: 'Tất cả phiên', count: rows.length },
      ...Array.from(groups.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([key, count]) => ({ key, label: key, count })),
    ];
  }, [rows]);

  const visible = useMemo(
    () => (tab === 'all' ? rows : rows.filter((s) => groupKey(s) === tab)),
    [rows, tab]
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const slice = visible.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const gotoTab = (key: string) => {
    setTab(key);
    setPage(0);
  };

  const runRetake = async (s: InterviewSession) => {
    setRetakingId(s.id);
    const started = await startSession({
      mode: s.mode,
      jobId: s.mode === 'MOCK' ? s.jobId : undefined,
      topic: s.mode === 'KNOWLEDGE' ? s.topic : undefined,
      questionCount: Math.min(10, Math.max(3, sessionTotal(s) || 5)),
    });
    setRetakingId(null);
    if (started) navigate(`/mock-interviews/${started.id}`);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-ds-body-md text-on-surface-variant">
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </Card>
    );
  }

  return (
    <div className="flex flex-col w-full gap-space-md pb-16">
      {error && <ErrorBlock message={error} onRetry={() => fetchMySessions(0)} />}

      {/* Below Section: Practice History & Progression Table */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pb-space-md">
          <div>
            <h2 className="m-0 text-ds-headline-sm text-on-surface font-bold">
              Lịch sử phỏng vấn AI &amp; Quá trình tiến bộ
            </h2>
            <p className="m-0 text-ds-body-sm text-on-surface-variant">
              Theo dõi sự cải thiện điểm số qua các phiên luyện tập mô phỏng
            </p>
          </div>
          <div className="flex flex-col lg:items-end gap-space-sm">
            <Link to="/mock-interviews" className={`${adminButton('primary', 'h-9 self-start lg:self-auto')} no-underline`}>
              <span className={`${ICON} text-[18px]`}>add_circle</span>
              Luyện tập phiên mới
            </Link>
            {/* Filter Tabs — nhóm dẫn xuất từ jobTitle/topic thật */}
            {rows.length > 0 && (
              <div className="flex items-center flex-wrap gap-1 p-1 bg-surface-container-low rounded-lg text-ds-label-md">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => gotoTab(t.key)}
                    className={`px-space-md py-1.5 rounded cursor-pointer border-0 transition-colors ${
                      tab === t.key
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                        : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <LoadingBlock label="Đang tải lịch sử luyện tập..." />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon="smart_toy"
            title="Chưa có phiên luyện tập nào."
            description="Khởi tạo một phiên phỏng vấn AI để báo cáo và lịch sử tiến bộ hiển thị tại đây."
            action={
              <Link to="/mock-interviews" className={`${adminButton('primary')} no-underline`}>
                <span className={`${ICON} text-[18px]`}>smart_toy</span>
                Luyện phỏng vấn AI
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyBlock icon="filter_list" title="Không có phiên nào trong nhóm đã chọn." />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-ds-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-outline-strong text-ds-label-sm uppercase tracking-wider">
                  <th className="py-space-md px-space-md rounded-l-lg text-left font-bold">Ngày thực hiện</th>
                  <th className="py-space-md px-space-md text-left font-bold">Vị trí / Chủ đề</th>
                  <th className="py-space-md px-space-md text-left font-bold">Thời lượng</th>
                  <th className="py-space-md px-space-md text-left font-bold">Điểm tổng</th>
                  <th className="py-space-md px-space-md text-left font-bold">Đánh giá chính</th>
                  <th className="py-space-md px-space-md text-right rounded-r-lg font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {slice.map((s) => {
                  const minutes = durationMin(s);
                  const done = s.status === 'COMPLETED';
                  const overall = s.overallScore != null ? toHundred(s.overallScore) : null;
                  const band = overall != null ? bandOf(overall) : null;
                  const canRetake = s.mode === 'MOCK' ? Boolean(s.jobId) : Boolean(s.topic);
                  const timeRange =
                    s.completedAt
                      ? `${fmtServer(s.createdAt, 'time')} - ${fmtServer(s.completedAt, 'time')}`
                      : `${fmtServer(s.createdAt, 'time')}`;
                  return (
                    <tr key={s.id} className="border-b border-outline-variant/40 hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-space-md px-space-md align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">{fmtServer(s.createdAt, 'date')}</span>
                          <span className="text-ds-label-sm text-outline-strong">{timeRange} ({timeAgo(s.createdAt)})</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md align-middle">
                        <div className="flex items-center gap-space-xs">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.mode === 'MOCK' ? 'bg-secondary-teal' : 'bg-primary'}`} />
                          <span className="font-medium text-on-surface">{titleOf(s)}</span>
                        </div>
                        <span className="text-ds-label-sm text-outline-variant">
                          {s.companyName ? `${s.companyName} • ` : ''}
                          {s.answeredCount}/{sessionTotal(s)} câu
                        </span>
                      </td>
                      <td className="py-space-md px-space-md align-middle font-medium whitespace-nowrap">
                        {minutes != null
                          ? `${minutes} phút`
                          : s.status === 'COMPLETED'
                            ? 'Chưa ghi nhận'
                            : 'Chưa hoàn thành'}
                      </td>
                      <td className="py-space-md px-space-md align-middle">
                        {s.overallScore != null ? (
                          <span className={`inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-bold tabular-nums ${band?.pill}`}>
                            {s.overallScore}/100
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                            Chưa chấm
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md align-middle">
                        {band ? (
                          <span className={`inline-flex items-center gap-1 font-medium ${band.text}`}>
                            <span className={`${ICON} text-[16px]`}>{band.icon}</span>
                            {band.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-outline-strong">
                            <span className={`${ICON} text-[16px]`}>hourglass_empty</span>
                            {done ? 'Chưa chấm' : 'Đang diễn ra'}
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md text-right align-middle">
                        <div className="inline-flex items-center gap-space-xs justify-end">
                          <Link
                            to={done ? `/mock-interviews/${s.id}/result` : `/mock-interviews/${s.id}`}
                            className="inline-flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container text-primary hover:bg-surface-container-high text-ds-label-md transition-colors no-underline whitespace-nowrap"
                          >
                            <span className={`${ICON} text-[16px]`}>visibility</span>
                            Xem
                          </Link>
                          {canRetake && (
                            <button
                              type="button"
                              title="Luyện tập lại"
                              disabled={retakingId === s.id}
                              onClick={() => void runRetake(s)}
                              className="p-1 rounded text-outline-strong hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-50"
                            >
                              <span className={`${ICON} text-[18px]`}>replay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer — phân trang client-side trên danh sách đã lọc */}
        {visible.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md mt-space-sm">
            <span className="text-ds-body-sm text-on-surface-variant tabular-nums">
              Hiển thị {clampedPage * PAGE_SIZE + 1} - {Math.min(visible.length, (clampedPage + 1) * PAGE_SIZE)}
              {' '}trên tổng số {visible.length} phiên luyện tập
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={() => setPage(clampedPage - 1)}
                disabled={clampedPage <= 0}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low text-outline-strong text-ds-label-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border-0"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-ds-label-md font-bold flex items-center justify-center cursor-pointer border-0 transition-colors tabular-nums ${
                    i === clampedPage
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(clampedPage + 1)}
                disabled={clampedPage + 1 >= totalPages}
                className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-ds-label-md cursor-pointer disabled:opacity-40 border-0"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewHistoryPage;
