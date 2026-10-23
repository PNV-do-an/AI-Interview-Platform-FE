import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import {
  JOB_STATUS_LABELS,
  MODERATION_ACTION_LABELS,
  ModerationJobDetail,
  ModerationRecord,
} from '../../models/AdminConsole.model';
import {
  EmptyBlock,
  ErrorBlock,
  ICON,
  LoadingBlock,
  ModalBackdrop,
  errorText,
  fmtServer,
  salaryLabel,
  splitCsv,
  timeAgo,
} from '../components/adminKit';

/**
 * Hồ sơ kiểm duyệt JD (mockup Stitch `chi tiết kiểm duyệt JD`) — DATA page.
 * Nguồn số thật:
 *   GET /admin/jobs/moderation/{id}   -> toàn bộ nội dung JD + timeline kiểm duyệt
 *   PATCH /api/v1/jobs/{id}/review    -> Phê duyệt / Từ chối (kèm reason)
 * Mockup có 2 khối không tồn tại trong hợp đồng BE: "Doanh nghiệp đã xác minh", MST và
 * "Hạn ứng tuyển". FE không bịa thông tin pháp nhân nên 2 khối đó được thay bằng dữ liệu
 * thật tương đương (email NTD, employerId, createdAt) - ghi trong spec/INDEX.md.
 */

const WORKPLACE_VN: Record<string, string> = {
  ONSITE: 'Tại văn phòng',
  HYBRID: 'Hybrid',
  REMOTE: 'Từ xa',
};

const TRACK_VN: Record<string, string> = {
  LIVE_CODING: 'Live Coding trực tiếp',
  SYSTEM_DESIGN: 'System Design',
  ASYNC_TECHNICAL: 'Kỹ thuật async',
  CULTURAL_FIT: 'Phù hợp văn hoá',
};

const CHECKLIST = [
  { title: 'Nội dung đầy đủ & rõ ràng', desc: 'Mô tả, yêu cầu, dải lương và quyền lợi minh bạch' },
  { title: 'Không vi phạm chính sách', desc: 'Không phân biệt giới tính, tuổi tác hoặc nội dung cấm' },
  { title: 'Thông tin doanh nghiệp hợp lệ', desc: 'Email doanh nghiệp và mã tin trùng khớp hồ sơ' },
];

const DEMO_BENEFITS = [
  'Mức lương cạnh tranh đúng theo dải đã công khai, thưởng tháng 13 cùng thưởng dự án định kỳ.',
  'Chính sách làm việc linh hoạt theo mô hình đã kê khai trong tin tuyển dụng.',
  'Đóng bảo hiểm đầy đủ theo quy định pháp luật và gói bảo hiểm sức khỏe cho nhân viên.',
  'Cung cấp thiết bị làm việc và ngân sách đào tạo công nghệ hằng năm.',
];

const REJECT_REASONS = [
  'Thiếu thông tin quan trọng (Lương, yêu cầu chi tiết)',
  'Nội dung không phù hợp / Vi phạm quy tắc cộng đồng',
  'Thông tin liên hệ hoặc pháp nhân chưa chính xác',
  'Lý do khác',
];

const NOTE_MAX = 250;
const REJECT_TEXT_MAX = 500;

const splitLines = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

const TIMELINE_DOT: Record<string, string> = {
  APPROVED: 'bg-secondary-teal ring-secondary-fixed',
  REJECTED: 'bg-error ring-error-container',
  SUBMITTED: 'bg-primary ring-primary-fixed',
  RESUBMITTED: 'bg-primary ring-primary-fixed',
};

const STATUS_CHIP: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800',
  OPEN: 'bg-secondary-container/50 text-on-secondary-container',
  CLOSED: 'bg-error-container text-on-error-container',
  DRAFT: 'bg-surface-container-high text-on-surface-variant',
};

const Section: React.FC<{ title: string; items: string[]; dot: string }> = ({ title, items, dot }) => (
  <div className="space-y-space-md">
    <div className="flex items-center gap-space-xs">
      <span className="w-1.5 h-5 bg-primary rounded-full" />
      <h2 className="text-ds-headline-sm text-on-surface font-bold">{title}</h2>
    </div>
    <ul className="space-y-space-sm text-on-surface-variant text-ds-body-md leading-relaxed pl-1">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-start gap-space-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-2.5 flex-shrink-0`} />
          <span className="break-words">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const SpecCell: React.FC<{ icon: string; label: string; value: string | null | undefined; tone?: string }> = ({ icon, label, value, tone = 'text-primary' }) => (
  <div className="space-y-0.5 p-space-xs">
    <span className="text-ds-label-sm text-on-surface-variant block">{label}</span>
    <p className="text-ds-label-md text-on-surface flex items-center gap-1.5 font-semibold mt-1">
      <span className={`${ICON} text-[18px] ${tone}`}>{icon}</span>
      <span className="truncate">{value || '—'}</span>
    </p>
  </div>
);

const TimelineEntry: React.FC<{ record: ModerationRecord; last: boolean }> = ({ record, last }) => (
  <div className="relative group">
    <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ${TIMELINE_DOT[record.action] ?? 'bg-outline-strong ring-surface-container'}`} />
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-space-xs">
        <span className={`text-ds-label-md font-semibold ${record.action === 'REJECTED' ? 'text-error' : 'text-on-surface'}`}>
          {MODERATION_ACTION_LABELS[record.action] ?? record.action}
        </span>
        <span className="text-ds-label-sm text-outline-strong whitespace-nowrap">{fmtServer(record.createdAt, 'datetime')}</span>
      </div>
      <p className="text-ds-body-sm text-on-surface-variant">
        {record.actorName}
        <span className="text-outline-strong"> • </span>
        {record.actorRole === 'EMPLOYER' ? 'Nhà tuyển dụng' : record.actorRole === 'STAFF' ? 'Nhân viên vận hành' : 'Quản trị viên'}
        {record.processingSeconds !== null && (
          <span className="text-outline-strong"> • xử lý {record.processingSeconds}s</span>
        )}
      </p>
      {record.note && (
        <p className="text-ds-body-sm bg-surface-container-low p-space-xs rounded text-on-surface break-words">{record.note}</p>
      )}
    </div>
    {!last && <div className="h-space-sm" />}
  </div>
);

const JobReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const valid = Number.isFinite(jobId) && jobId > 0;

  const [detail, setDetail] = useState<ModerationJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectText, setRejectText] = useState('');

  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((tone: 'ok' | 'err', text: string) => {
    setToast({ tone, text });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const load = useCallback(async () => {
    if (!valid) {
      setLoading(false);
      setLoadError('Mã tin tuyển dụng không hợp lệ.');
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const res = await AdminService.getModerationDetail(jobId);
      setDetail(res.data.data!);
    } catch (err) {
      setDetail(null);
      setLoadError(errorText(err, 'Không tải được hồ sơ kiểm duyệt.'));
    } finally {
      setLoading(false);
    }
  }, [jobId, valid]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = useCallback(async (approved: boolean, reason: string) => {
    setBusy(true);
    try {
      const res = await AdminService.reviewJob(jobId, { approved, reason: reason || undefined });
      showToast('ok', res.data.message || (approved ? 'JD đã được phê duyệt và hiển thị công khai.' : 'Đã từ chối và gửi phản hồi cho nhà tuyển dụng.'));
      setNote('');
      setRejectOpen(false);
      setRejectText('');
      await load();
    } catch (err) {
      showToast('err', errorText(err, 'Không ghi được quyết định kiểm duyệt.'));
    } finally {
      setBusy(false);
    }
  }, [jobId, load, showToast]);

  const copyLink = useCallback(() => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(
        () => showToast('ok', 'Đã sao chép link hồ sơ kiểm duyệt.'),
        () => showToast('err', 'Trình duyệt chặn sao chép link.'),
      );
      return;
    }
    showToast('err', 'Trình duyệt không hỗ trợ sao chép link.');
  }, [showToast]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-space-xl">
        <LoadingBlock label="Đang tải hồ sơ kiểm duyệt..." />
      </div>
    );
  }

  const job = detail?.job ?? null;

  if (!detail || !job) {
    return (
      <div className="mx-auto w-full max-w-7xl p-space-xl flex flex-col gap-space-md">
        <ErrorBlock message={loadError} onRetry={() => void load()} />
        <Link to="/admin/job-approvals" className="text-ds-label-md text-primary hover:underline">
          Quay lại hàng đợi kiểm duyệt
        </Link>
      </div>
    );
  }

  const pending = job.status === 'PENDING_APPROVAL';
  const salary = salaryLabel(job);
  /** `location` có thể null; `workplaceModel` vẫn là thông tin thật nên được đứng một mình. */
  const place = job.location?.trim();
  const placeLabel = place
    ? `${place}${job.workplaceModel ? ` (${WORKPLACE_VN[job.workplaceModel]})` : ''}`
    : (WORKPLACE_VN[job.workplaceModel] ?? null);
  const skills = splitCsv(job.requiredSkills);
  const focusAreas = splitCsv(job.aiQuestionFocusAreas);
  const realBenefits = [job.annualBonus, job.equityBand].map((v) => (v ?? '').trim()).filter(Boolean);
  const timeline = detail.timeline ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-lg p-space-lg lg:p-space-xl">
      {/* Breadcrumb + chip định danh + action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant text-ds-label-md flex-wrap">
            <Link to="/admin/job-approvals" className="hover:text-primary transition-colors flex items-center gap-1 no-underline text-inherit">
              <span className={`${ICON} text-[16px]`}>arrow_back</span>
              Quay lại danh sách kiểm duyệt
            </Link>
            <span className="text-outline-variant">/</span>
            <span>Kiểm duyệt JD</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold truncate max-w-[280px]">{job.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-ds-label-sm text-on-surface-variant tracking-wider font-mono">
              Mã JD: #{job.id}
            </span>
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-ds-label-sm text-on-surface">
              Loại: {job.employmentType || 'Chưa kê khai'}
            </span>
            <span className="px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-ds-label-sm text-on-tertiary-fixed font-medium">
              Cấp bậc: {job.experienceLevel || 'Chưa kê khai'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <Link
            to={`/jobs/${job.id}`}
            className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-ds-label-md transition-all flex items-center gap-space-xs shadow-sm no-underline"
          >
            <span className={`${ICON} text-[18px]`}>visibility</span>
            Xem bản ứng viên
          </Link>
          <button type="button" onClick={copyLink} className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-ds-label-md transition-all flex items-center gap-space-xs shadow-sm border-0 cursor-pointer">
            <span className={`${ICON} text-[18px]`}>share</span>
            Chia sẻ link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* TRÁI: toàn văn JD */}
        <div className="lg:col-span-8 space-y-space-lg">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg lg:p-space-xl space-y-space-lg">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md pb-space-lg border-b border-surface-container">
              <div className="flex items-start gap-space-md">
                <div className="w-16 h-16 rounded-xl bg-primary-container/10 flex items-center justify-center flex-shrink-0 text-primary-container overflow-hidden p-2 ring-1 ring-primary-fixed">
                  <span className={`${ICON} text-[36px]`}>business_center</span>
                </div>
                <div className="space-y-space-xs min-w-0">
                  <h1 className="text-ds-headline-lg text-on-surface tracking-tight font-bold">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <span className="text-ds-label-lg text-on-surface font-semibold">{job.companyName}</span>
                    <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-ds-label-sm font-medium">
                      <span className={`${ICON} text-[14px]`}>badge</span>
                      NTD: {job.employerName || job.employerEmail}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-on-surface-variant text-ds-body-sm pt-space-xs">
                    <span className="flex items-center gap-1.5">
                      <span className={`${ICON} text-[16px] text-outline-strong`}>schedule</span>
                      Ngày gửi duyệt: {fmtServer(detail.submittedAt, 'datetime')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`${ICON} text-[16px] text-outline-strong`}>event_available</span>
                      Ngày tạo tin: {fmtServer(job.createdAt, 'date')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex md:flex-col items-baseline md:items-end justify-between gap-1 flex-shrink-0 bg-surface-container-low px-space-md py-space-sm rounded-xl border border-surface-container">
                <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
                  Mức thu nhập đề xuất
                </span>
                <span className="text-ds-headline-md text-primary font-bold">{salary}</span>
                {job.salaryCurrency && (
                  <span className="text-ds-body-sm text-outline-strong">{job.salaryCurrency} / tháng (Gross)</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md bg-surface-container-low rounded-xl border border-surface-container">
              <SpecCell
                icon="location_on"
                label="Địa điểm làm việc"
                value={placeLabel}
              />
              <SpecCell icon="work_history" label="Kinh nghiệm" value={job.experienceLevel} />
              <SpecCell icon="apartment" label="Bộ phận" value={job.department} />
              <SpecCell
                icon="smart_toy"
                label="AI Interview Engine"
                value={job.aiScreeningEnabled ? `${TRACK_VN[job.aiScreeningTrack] ?? job.aiScreeningTrack} • qua ${job.aiScreeningPassScore}` : 'Chưa kích hoạt'}
                tone="text-secondary-teal"
              />
            </div>

            <div className="space-y-space-sm">
              <span className="text-ds-label-sm text-on-surface-variant uppercase tracking-wider font-semibold block">
                Kỹ năng trọng tâm &amp; Lĩnh vực
              </span>
              <div className="flex flex-wrap gap-space-xs">
                {skills.map((skill) => (
                  <span key={skill} className="px-space-sm py-1 rounded-full bg-surface-container text-ds-label-md text-on-surface font-medium">
                    {skill}
                  </span>
                ))}
                {focusAreas.map((area) => (
                  <span key={area} className="px-space-sm py-1 rounded-full bg-primary-fixed/40 text-ds-label-md text-on-primary-fixed-variant font-semibold">
                    {area}
                  </span>
                ))}
                {!skills.length && !focusAreas.length && (
                  <span className="text-ds-body-sm text-on-surface-variant">Tin chưa được gắn thẻ kỹ năng.</span>
                )}
              </div>
            </div>

            <div className="h-px bg-surface-container" />

            <Section title="Mô tả công việc" items={splitLines(job.description)} dot="bg-primary" />
            <div className="h-px bg-surface-container" />
            <Section title="Yêu cầu ứng viên" items={splitLines(job.requirements)} dot="bg-primary" />
            <div className="h-px bg-surface-container" />
            <Section title="Quyền lợi & Đãi ngộ" items={realBenefits.length ? realBenefits : DEMO_BENEFITS} dot="bg-secondary-teal" />

            <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-sm border border-surface-container">
              <div className="flex items-center justify-between gap-space-sm flex-wrap">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <span className={`${ICON} text-[24px]`}>corporate_fare</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-ds-headline-sm text-on-surface font-semibold truncate">{job.companyName}</h3>
                    <p className="text-ds-body-sm text-on-surface-variant truncate">{job.position}</p>
                  </div>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface text-ds-label-sm font-semibold font-mono">
                  Mã NTD: #{job.employerId}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-space-xs text-on-surface-variant text-ds-body-sm border-t border-surface-container mt-space-xs">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className={`${ICON} text-[16px] text-outline-strong`}>apartment</span>
                  <span className="truncate">{job.location || 'Chưa kê khai địa điểm'}</span>
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className={`${ICON} text-[16px] text-outline-strong`}>mail</span>
                  <span className="text-primary font-medium truncate">{job.employerEmail}</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* PHẢI: bảng quyết định + lịch sử */}
        <div className="lg:col-span-4 space-y-space-lg">
          <div className="sticky top-20 space-y-space-lg">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                <div>
                  <span className="text-ds-label-sm text-on-surface-variant uppercase tracking-wider block">Trạng thái tin</span>
                  <span className="text-ds-headline-sm text-on-surface">Kiểm định chất lượng</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full text-ds-label-md font-semibold shadow-sm ${STATUS_CHIP[job.status]}`}>
                  {pending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  {JOB_STATUS_LABELS[job.status]}
                </span>
              </div>

              <p className="text-ds-body-sm text-on-surface-variant">
                Tiêu chuẩn kiểm duyệt nội dung tin đăng tuyển trước khi kích hoạt thuật toán AI phỏng vấn.
              </p>

              <div className="space-y-space-sm bg-surface-container-low p-space-md rounded-lg">
                <span className="text-ds-label-sm text-on-surface font-bold uppercase tracking-wider">Bộ tiêu chuẩn kiểm duyệt</span>
                <div className="space-y-space-xs">
                  {CHECKLIST.map((item) => (
                    <div key={item.title} className="flex items-start gap-space-sm">
                      <span className={`${ICON} text-[18px] text-secondary-teal mt-0.5 shrink-0`}>check_circle</span>
                      <span className="text-ds-body-sm text-on-surface">
                        <strong className="block font-semibold text-on-surface">{item.title}</strong>
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {job.reviewNote && (
                <div className="p-space-sm rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-space-xs">
                  <span className={`${ICON} text-amber-700 text-[18px] shrink-0`}>feed</span>
                  <span className="text-ds-body-sm text-amber-800 break-words">{job.reviewNote}</span>
                </div>
              )}

              <div className="space-y-space-xs">
                <label className="text-ds-label-md text-on-surface flex items-center justify-between" htmlFor="review-note">
                  <span>Ghi chú kiểm duyệt (Gửi kèm quyết định)</span>
                  <span className="text-outline font-normal text-[11px]">{note.length}/{NOTE_MAX}</span>
                </label>
                <textarea
                  id="review-note"
                  rows={3}
                  value={note}
                  maxLength={NOTE_MAX}
                  disabled={!pending || busy}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho doanh nghiệp hoặc lưu vết kiểm duyệt nội bộ..."
                  className="w-full bg-surface-container-low rounded-lg text-ds-body-sm text-on-surface placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                <button
                  type="button"
                  disabled={!pending || busy}
                  onClick={() => { setRejectReason(REJECT_REASONS[0]); setRejectText(''); setRejectOpen(true); }}
                  className="w-full py-space-sm px-space-md rounded-lg bg-error-container/60 hover:bg-error-container text-on-error-container text-ds-label-md transition-all flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`${ICON} text-[18px]`}>close</span>
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={!pending || busy}
                  onClick={() => void decide(true, note.trim())}
                  className="w-full py-space-sm px-space-md rounded-lg bg-secondary-teal hover:bg-secondary-teal/90 text-on-secondary text-ds-label-md transition-all flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`${ICON} text-[18px]`}>{busy ? 'progress_activity' : 'check_circle'}</span>
                  {busy ? 'Đang gửi...' : 'Phê duyệt'}
                </button>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-xs text-on-surface-variant text-ds-body-sm">
                <span className={`${ICON} text-primary text-[18px] flex-shrink-0`}>info</span>
                <span>
                  {pending
                    ? 'Sau khi phê duyệt, JD sẽ lập tức hiển thị công khai trên cổng việc làm và kích hoạt tính năng AI Mock Interview tương ứng.'
                    : `Tin đang ở trạng thái ${JOB_STATUS_LABELS[job.status].toLowerCase()} nên không còn quyết định nào được ghi.}`}
                </span>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <span className={`${ICON} text-primary text-[20px]`}>history</span>
                  <h3 className="text-ds-headline-sm text-on-surface">Lịch sử kiểm duyệt</h3>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-ds-label-sm text-on-surface-variant">
                  {timeline.length} bản ghi
                </span>
              </div>
              {timeline.length === 0 ? (
                <EmptyBlock icon="timeline" title="Chưa có bản ghi kiểm duyệt" description="Lịch sử sẽ xuất hiện khi tin được gửi duyệt hoặc có quyết định." />
              ) : (
                <div className="relative pl-6 space-y-space-md before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
                  {timeline.map((record, i) => (
                    <TimelineEntry key={record.id} record={record} last={i === timeline.length - 1} />
                  ))}
                </div>
              )}
              {detail.decidedAt && (
                <p className="text-ds-body-sm text-on-surface-variant pt-space-xs border-t border-surface-container">
                  Quyết định gần nhất {timeAgo(detail.decidedAt)} ({fmtServer(detail.decidedAt, 'datetime')})
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Toast phản hồi quyết định */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[950] flex items-center gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-proof border-l-4 border-secondary-teal max-w-md">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.tone === 'ok' ? 'bg-secondary-container/50 text-on-secondary-container' : 'bg-error-container/70 text-error'}`}>
            <span className={`${ICON} text-[20px]`}>{toast.tone === 'ok' ? 'check' : 'error'}</span>
          </div>
          <div className="flex-1 pr-space-xs">
            <div className="flex items-center justify-between gap-space-md">
              <span className="text-ds-label-md text-on-surface font-bold">{toast.tone === 'ok' ? 'Thao tác thành công' : 'Thao tác thất bại'}</span>
              <span className="text-ds-label-sm text-outline-strong">Vừa xong</span>
            </div>
            <p className="text-ds-body-sm text-on-surface-variant">{toast.text}</p>
          </div>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors border-0 bg-transparent cursor-pointer">
            <span className={`${ICON} text-[16px]`}>close</span>
          </button>
        </div>
      )}

      {/* Modal từ chối */}
      {rejectOpen && (
        <ModalBackdrop onClose={() => !busy && setRejectOpen(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-card max-w-lg w-full p-space-lg space-y-space-md">
            <div className="flex items-start justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-error-container/70 flex items-center justify-center text-error flex-shrink-0">
                  <span className={`${ICON} text-[22px]`}>error_outline</span>
                </div>
                <div>
                  <h2 className="text-ds-headline-sm text-on-surface">Từ chối phê duyệt JD</h2>
                  <p className="text-ds-body-sm text-on-surface-variant">
                    Chọn lý do và phản hồi để nhà tuyển dụng {job.companyName} chỉnh sửa.
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setRejectOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors border-0 bg-transparent cursor-pointer">
                <span className={`${ICON} text-[18px]`}>close</span>
              </button>
            </div>

            <div className="space-y-space-md">
              <div className="space-y-space-xs">
                <label className="text-ds-label-md text-on-surface font-semibold" htmlFor="reject-reason">
                  Lý do từ chối (Bắt buộc)
                </label>
                <div className="relative">
                  <select
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full h-10 px-space-md bg-surface-container-low rounded-lg text-ds-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer border-0"
                  >
                    {REJECT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                  <span className={`${ICON} absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[18px]`}>expand_more</span>
                </div>
              </div>

              <div className="space-y-space-xs">
                <label className="text-ds-label-md text-on-surface font-semibold" htmlFor="reject-text">
                  Chi tiết phản hồi cho nhà tuyển dụng (Bắt buộc)
                </label>
                <textarea
                  id="reject-text"
                  rows={4}
                  value={rejectText}
                  maxLength={REJECT_TEXT_MAX}
                  onChange={(e) => setRejectText(e.target.value)}
                  placeholder={`Mô tả cụ thể những điểm cần chỉnh sửa để ${job.companyName} cập nhật lại tin...`}
                  className="w-full bg-surface-container-low rounded-lg text-ds-body-sm text-on-surface placeholder:text-outline-strong focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                />
                <span className="text-ds-label-sm text-outline-strong block text-right">
                  {rejectText.length}/{REJECT_TEXT_MAX} ký tự
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant text-ds-body-sm flex items-center gap-space-xs">
                <span className={`${ICON} text-[18px] text-primary`}>forward_to_inbox</span>
                <span>
                  Email thông báo tự động kèm lý do từ chối sẽ được gửi tới <strong className="text-on-surface">{job.employerEmail}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button type="button" onClick={() => setRejectOpen(false)} className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-ds-label-md transition-all border-0 cursor-pointer">
                Hủy thao tác
              </button>
              <button
                type="button"
                disabled={busy || !rejectText.trim()}
                onClick={() => void decide(false, `${rejectReason} | ${rejectText.trim()}`)}
                className="px-space-md py-space-sm rounded-lg bg-error hover:bg-error/90 text-on-error text-ds-label-md transition-all flex items-center gap-1.5 shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`${ICON} text-[18px]`}>send</span>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default JobReviewDetailPage;
