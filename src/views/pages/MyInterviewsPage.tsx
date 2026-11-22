import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useSlotController } from '../../controllers/useSlotController';
import { Application } from '../../models/Program.model';
import { parseServerTimestamp } from '../../utils/date';
import {
  CARD,
  CandidatePageHeader,
  ICON,
  SOFT,
  StatusChip,
} from '../components/candidateKit';
import { adminButton, EmptyBlock, ErrorBlock, LoadingBlock, Pill } from '../components/adminKit';

/**
 * Lịch phỏng vấn (ứng viên) — mockup `t_l_ch_ph_ng_v_n_ai_interview_platform` (2026-10-26).
 *
 * Màn này gộp 2 việc mockup tách rời: xem lịch đã đặt (slot thật gắn trên đơn ứng tuyển,
 * `GET /applications/my`) và chọn khung giờ trống của nhà tuyển dụng rồi đặt
 * (`GET /slots/available?employerId=` + `POST /applications/book-slot`).
 *
 * Bỏ so với mockup: hồ sơ người phỏng vấn (ảnh, rating 4.9, số buổi đã mentor) và "Lượt phỏng
 * vấn Pro còn 3/5" — BE không trả field nào về năng lực/điểm danh của interviewer cũng như quota
 * lượt cho ứng viên. Hai khối "AI Co-Pilot hoạt động thế nào" / "Chính sách đổi lịch" là copy
 * mockup nên có nhãn demo; riêng ô ghi chú cho mentor không có field trong `Slot` nên để trống
 * hoàn toàn, không dựng input giả.
 */

const fmtDay = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
const fmtFull = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
const fmtTime = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (d: Date) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(startOfDay(d).getTime() + diff * 86_400_000);
};

/** Slot lưu giờ local của BE (`LocalDateTime`) -> parseServerTimestamp coi là UTC rồi hiển thị lại. */
const slotRange = (s: { startTime: string; endTime: string }) => {
  const a = parseServerTimestamp(s.startTime);
  const b = parseServerTimestamp(s.endTime);
  if (!a || !b) return '—';
  return `${fmtTime.format(a)} - ${fmtTime.format(b)}`;
};

const MyInterviewsPage: React.FC = () => {
  const candidate = useCandidateController();
  const slots = useSlotController();
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookingAppId, setBookingAppId] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    candidate.fetchMyApplications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apps = candidate.applications?.content ?? [];

  /** Đơn đang chờ ứng viên chọn giờ: `PENDING` và chưa có slot. */
  const needBooking = useMemo(
    () => apps.filter((a) => a.status === 'PENDING' && !a.slot),
    [apps],
  );

  const bookingApp: Application | null =
    needBooking.find((a) => a.id === bookingAppId) ?? needBooking[0] ?? null;

  useEffect(() => {
    if (!bookingApp) return;
    setSelectedSlotId(null);
    slots.fetchAvailableSlots(bookingApp.employerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingApp?.id]);

  const booked = useMemo(() => {
    const withSlot = apps.filter((a) => a.slot);
    const at = (a: Application) => parseServerTimestamp(a.slot!.startTime)?.getTime() ?? 0;
    return {
      upcoming: withSlot.filter((a) => at(a) >= Date.now()).sort((x, y) => at(x) - at(y)),
      past: withSlot.filter((a) => at(a) < Date.now()).sort((x, y) => at(y) - at(x)),
    };
  }, [apps]);

  const weekDays = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof slots.availableSlots>();
    weekDays.forEach((d) => map.set(d.toDateString(), []));
    slots.availableSlots.forEach((s) => {
      const at = parseServerTimestamp(s.startTime);
      if (!at) return;
      const key = startOfDay(at).toDateString();
      const list = map.get(key);
      if (list) list.push(s);
    });
    map.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [slots.availableSlots, weekDays]);

  const selectedSlot = slots.availableSlots.find((s) => s.id === selectedSlotId) ?? null;

  const confirm = async () => {
    if (!bookingApp || !selectedSlot) return;
    const ok = await candidate.bookSlot(selectedSlot.id, bookingApp.id);
    if (ok) {
      setSelectedSlotId(null);
      candidate.fetchMyApplications(0);
      slots.fetchAvailableSlots(bookingApp.employerId);
    }
  };

  const error = candidate.error || slots.error;
  const success = candidate.successMsg || slots.successMsg;
  const weekLabel = weekDays.length
    ? `Tuần: ${fmtDay.format(weekDays[0])} - ${fmtDay.format(weekDays[6])}`
    : '';
  const freeCount = slots.availableSlots.filter((s) => !s.booked && !s.cancelled).length;

  return (
    <div className="flex flex-col gap-space-lg">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Lịch phỏng vấn' }]}
        status={<StatusChip label="Xác thực chuyên gia & Nhà tuyển dụng thực tế" />}
        title="Lịch phỏng vấn & Đặt lịch với Nhà tuyển dụng"
        subtitle="Chọn khung giờ phù hợp trong tuần để nhận lịch phỏng vấn 1-1 qua video; các khung đã đặt và đã huỷ đều hiện ở cột trái."
        actions={
          <Link to="/my-applications" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-200 px-4 text-ds-label-lg text-slate-900 transition-colors hover:bg-slate-200est no-underline">
            <span className={`${ICON} text-[18px] text-slate-600`}>assignment</span>
            Đơn ứng tuyển
          </Link>
        }
      />

      {error && <ErrorBlock message={error} onRetry={() => candidate.fetchMyApplications(0)} />}
      {success && (
        <div className="flex items-start gap-2 rounded-xl bg-teal-100/40 px-4 py-3 text-ds-body-md text-on-secondary-fixed-variant" role="status">
          <span className={`${ICON} shrink-0 text-[20px]`}>check_circle</span>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* ============ CỘT GIỮA: lịch tuần + danh sách lịch ============ */}
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {bookingApp ? (
            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex min-w-0 items-start gap-space-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-ds-headline-md font-bold text-primary">
                    {bookingApp.companyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="m-0 text-ds-headline-sm font-bold text-slate-900">
                      Chọn giờ phỏng vấn — {bookingApp.jobTitle}
                    </h2>
                    <p className="m-0 text-ds-body-sm text-slate-600">
                      {bookingApp.companyName} • Người phỏng vấn: {bookingApp.slot?.employerName ?? 'chưa phân công'}
                    </p>
                  </div>
                </div>
                {needBooking.length > 1 && (
                  <label className="flex shrink-0 flex-col gap-1 text-ds-label-sm text-slate-600">
                    Đơn cần đặt lịch
                    <select
                      value={bookingApp.id}
                      onChange={(e) => setBookingAppId(Number(e.target.value))}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-ds-body-sm text-slate-900 focus:border-primary focus:outline-none"
                    >
                      {needBooking.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.jobTitle} — {a.companyName}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="flex items-center rounded-lg bg-slate-50 p-0.5">
                  <button type="button" aria-label="Tuần trước" title="Tuần trước" onClick={() => setWeekOffset((w) => w - 1)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900">
                    <span className={`${ICON} text-[20px]`}>chevron_left</span>
                  </button>
                  <button type="button" aria-label="Tuần sau" title="Tuần sau" onClick={() => setWeekOffset((w) => w + 1)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900">
                    <span className={`${ICON} text-[20px]`}>chevron_right</span>
                  </button>
                </div>
                <button type="button" onClick={() => setWeekOffset(0)} className="rounded-lg bg-slate-50 px-space-md py-1.5 text-ds-label-md text-slate-900 transition-colors hover:bg-slate-100">
                  Hôm nay
                </button>
                <div className="flex items-center gap-space-xs pl-space-xs">
                  <span className={`${ICON} text-[20px] text-primary`}>calendar_today</span>
                  <span className="text-ds-headline-sm text-slate-900">{weekLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
                <Pill tone="primary">Tất cả các ca ({freeCount} trống)</Pill>
                <Pill>{slots.loading ? 'Đang tải khung giờ…' : `${slots.availableSlots.length} khung nhà tuyển dụng mở`}</Pill>
              </div>

              {slots.loading && slots.availableSlots.length === 0 ? (
                <LoadingBlock label="Đang tải khung giờ trống..." />
              ) : freeCount === 0 ? (
                <EmptyBlock
                  icon="event_busy"
                  title="Chưa có khung giờ trống"
                  description="Nhà tuyển dụng của đơn này chưa mở khung hẹn nào. Vui lòng quay lại sau hoặc liên hệ qua màn Đơn ứng tuyển."
                />
              ) : (
                <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4 xl:grid-cols-7">
                  {weekDays.map((d) => {
                    const daySlots = byDay.get(d.toDateString()) ?? [];
                    const isToday = startOfDay(d).getTime() === startOfDay(new Date()).getTime();
                    return (
                      <div key={d.toISOString()} className="flex flex-col gap-space-xs">
                        <div className={`flex flex-col items-center rounded-lg p-space-sm text-center ${isToday ? 'bg-indigo-600 text-on-primary' : 'bg-slate-100'}`}>
                          <span className={`text-ds-label-sm ${isToday ? 'text-on-primary/90' : 'text-slate-600'}`}>
                            {WEEKDAY[d.getDay()]}
                          </span>
                          <span className="text-ds-headline-sm font-bold text-slate-900">{fmtDay.format(d)}</span>
                        </div>
                        <div className="mt-1 flex flex-col gap-space-xs">
                          {daySlots.map((s) => {
                            const taken = s.booked || s.cancelled;
                            const active = selectedSlotId === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                disabled={taken}
                                onClick={() => setSelectedSlotId(s.id)}
                                title={taken ? (s.cancelled ? 'Khung giờ đã bị huỷ' : 'Đã có người đặt') : undefined}
                                className={`w-full rounded-lg px-1 py-2 text-center text-ds-label-sm transition-all ${
                                  active
                                    ? 'border border-primary bg-indigo-600 font-bold text-on-primary shadow-sm'
                                    : taken
                                      ? 'cursor-not-allowed bg-slate-200/60 text-slate-400 line-through'
                                      : 'border border-slate-200/60 bg-white text-slate-900 hover:border-primary hover:bg-indigo-600/10'
                                }`}
                              >
                                {slotRange(s)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-space-md border-t border-slate-200/40 pt-space-md text-ds-label-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-indigo-600" /> Đang chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-slate-200 bg-white" /> Khung giờ còn trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-slate-200" /> Đã có người đặt / đã huỷ
                </span>
              </div>
            </section>
          ) : (
            <section className={`${CARD} p-space-lg`}>
              <h2 className="m-0 text-ds-headline-sm font-bold text-slate-900">Không có đơn nào chờ đặt lịch</h2>
              <p className="mt-1 text-ds-body-md text-slate-600">
                Bạn chỉ đặt được giờ phỏng vấn khi đơn ứng tuyển đang ở trạng thái "Đang xét" và nhà
                tuyển dụng đã mở khung hẹn.
              </p>
              <Link to="/jobs" className={`${adminButton('primary', 'mt-space-md no-underline')}`}>
                <span className={`${ICON} text-[18px]`}>search</span>Tìm việc làm
              </Link>
            </section>
          )}

          {/* Lịch đã đặt */}
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-space-xs">
                <span className={`${ICON} text-[22px] text-primary`}>event_available</span>
                <h2 className="m-0 text-ds-headline-sm font-bold tracking-tight text-slate-900">Lịch đã đặt</h2>
              </div>
              <span className="text-ds-label-sm text-slate-600">{booked.upcoming.length} sắp tới</span>
            </div>

            {booked.upcoming.length === 0 && booked.past.length === 0 ? (
              <p className="m-0 text-ds-body-md text-slate-600">
                Chưa có buổi phỏng vấn nào được ghi nhận. Các khung giờ đã xác nhận sẽ hiện ở đây.
              </p>
            ) : (
              <div className="flex flex-col gap-space-sm">
                {[...booked.upcoming, ...booked.past].map((app) => {
                  const at = parseServerTimestamp(app.slot!.startTime);
                  const upcoming = (at?.getTime() ?? 0) >= Date.now();
                  return (
                    <div key={app.id} className={`${SOFT} flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:justify-between`}>
                      <div className="flex min-w-0 items-start gap-space-md">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
                          <span className="text-ds-label-sm uppercase text-slate-600">
                            {at ? WEEKDAY[at.getDay()] : ''}
                          </span>
                          <span className="text-ds-headline-md leading-none text-slate-900">
                            {at ? fmtDay.format(at) : '—'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="m-0 truncate text-ds-label-lg font-semibold text-slate-900">{app.jobTitle}</h3>
                          <p className="m-0 truncate text-ds-body-sm text-slate-600">{app.companyName}</p>
                          <p className="mt-1 text-ds-body-sm text-slate-600">
                            {at ? `${fmtFull.format(at)} • ${slotRange(app.slot!)}` : 'Chưa rõ thời gian'}
                            {app.slot?.employerName ? ` • Người phỏng vấn: ${app.slot.employerName}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {app.slot!.cancelled ? (
                          <Pill tone="danger">Đã huỷ</Pill>
                        ) : upcoming ? (
                          <Pill tone="success" icon="check_circle">Đã xác nhận</Pill>
                        ) : (
                          <Pill>Đã diễn ra</Pill>
                        )}
                        <Link to={`/jobs/${app.jobId}`} className="text-ds-label-md font-semibold text-primary hover:underline no-underline">
                          Xem tin
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Hai khối copy mockup — chưa có backend đo được */}
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <section className={`${CARD} flex flex-col gap-2 p-space-lg`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 flex items-center gap-1.5 text-ds-headline-sm font-bold text-primary">
                  <span className={`${ICON} text-[20px]`}>smart_toy</span>
                  AI Co-Pilot hoạt động thế nào?
                </h3>
                <Pill icon="hive">Khối demo</Pill>
              </div>
              <p className="m-0 text-ds-body-sm text-slate-600">
                Trong suốt buổi gọi video trực tiếp, AI Nexus hoạt động thầm lặng như một trợ lý thư ký:
                ghi nhận cấu trúc câu trả lời STAR, phân tích độ tự tin giọng nói và tự động tổng hợp bộ
                câu hỏi phản biện gửi kèm sau phỏng vấn.
              </p>
            </section>
            <section className={`${CARD} flex flex-col gap-2 p-space-lg`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 flex items-center gap-1.5 text-ds-headline-sm font-bold text-teal-600">
                  <span className={`${ICON} text-[20px]`}>shield</span>
                  Chính sách đổi lịch linh hoạt
                </h3>
                <Pill icon="hive">Khối demo</Pill>
              </div>
              <p className="m-0 text-ds-body-sm text-slate-600">
                Bạn có thể dễ dàng đổi hoặc huỷ phiên phỏng vấn miễn phí trước ít nhất 04 tiếng. Lượt tin
                chỉ Pro sẽ được hoàn trả tự động vào tài khoản ngay lập tức mà không mất phụ phí.
              </p>
            </section>
          </div>
        </div>

        {/* ============ CỘT PHẢI: bảng tóm tắt lượt đặt ============ */}
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-ds-headline-sm font-bold text-slate-900">Thông tin buổi phỏng vấn</h2>
              <Pill tone={selectedSlot ? 'success' : 'neutral'}>
                {selectedSlot ? 'Đã chọn giờ' : 'Bước 1/2'}
              </Pill>
            </div>

            <div className={`${SOFT} flex flex-col gap-1 p-space-md`}>
              <span className="flex items-center gap-1.5 text-ds-label-sm text-slate-600">
                <span className={`${ICON} text-[16px] text-primary`}>schedule</span>
                Thời gian đã chọn
              </span>
              {selectedSlot ? (
                <>
                  <span className="text-ds-headline-md font-bold text-primary">
                    {slotRange(selectedSlot)}
                  </span>
                  <span className="text-ds-body-sm text-slate-600">
                    {parseServerTimestamp(selectedSlot.startTime)
                      ? fmtFull.format(parseServerTimestamp(selectedSlot.startTime)!)
                      : ''}
                  </span>
                </>
              ) : (
                <span className="text-ds-body-md text-slate-400">Chưa chọn khung giờ nào</span>
              )}
            </div>

            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-md gap-y-2 text-ds-body-sm">
              <dt className="text-slate-600">Đơn ứng tuyển</dt>
              <dd className="m-0 text-right font-semibold text-slate-900">{bookingApp?.jobTitle ?? '—'}</dd>
              <dt className="text-slate-600">Doanh nghiệp</dt>
              <dd className="m-0 text-right font-semibold text-slate-900">{bookingApp?.companyName ?? '—'}</dd>
              <dt className="text-slate-600">Hình thức</dt>
              <dd className="m-0 text-right font-semibold text-slate-900">Video call</dd>
            </dl>

            <button
              type="button"
              disabled={!selectedSlot || !bookingApp}
              onClick={() => void confirm()}
              className={adminButton('primary', 'w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed')}
            >
              <span className={`${ICON} text-[18px]`}>check_circle</span>
              Xác nhận đặt lịch phỏng vấn
            </button>
            <p className="m-0 text-center text-ds-body-sm text-slate-400">
              Có thể đổi hoặc huỷ lịch miễn phí trước 4 tiếng.
            </p>
          </section>

          {needBooking.length > 0 && (
            <section className={`${CARD} flex flex-col gap-space-sm p-space-lg`}>
              <h2 className="m-0 text-ds-headline-sm font-bold text-slate-900">Cần đặt lịch ({needBooking.length})</h2>
              {needBooking.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setBookingAppId(a.id)}
                  className={`flex flex-col items-start gap-0.5 rounded-xl p-space-md text-left transition-colors ${
                    bookingApp?.id === a.id ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-ds-label-lg font-semibold">{a.jobTitle}</span>
                  <span className="text-ds-body-sm opacity-80">{a.companyName}</span>
                </button>
              ))}
            </section>
          )}

          <section className={`${CARD} flex flex-col gap-2 p-space-lg`}>
            <div className="flex items-center gap-space-xs">
              <span className={`${ICON} text-[20px] text-teal-600`}>verified</span>
              <h2 className="m-0 text-ds-headline-sm font-bold text-slate-900">Chuẩn bị trước buổi hẹn</h2>
            </div>
            <p className="m-0 text-ds-body-sm text-slate-600">
              Kiểm tra camera, micro và đường truyền trước giờ hẹn để buổi phỏng vấn không bị gián đoạn.
            </p>
            <Link to="/device-check" className={`${adminButton('ghost', 'mt-1 no-underline')}`}>
              <span className={`${ICON} text-[18px]`}>videocam</span>
              Kiểm tra thiết bị
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MyInterviewsPage;
