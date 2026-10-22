import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useSlotController } from '../../controllers/useSlotController';
import { useAuth } from '../../context/AuthContext';
import { Application } from '../../models/Program.model';
import { parseServerTimestamp } from '../../utils/date';
import {
  ICON,
  EmptyBlock,
  LoadingBlock,
  ErrorBlock,
  fmtServer,
} from '../components/adminKit';
import { buttonClass } from '../components/ui';

/**
 * Màn "Đặt lịch phỏng vấn" (candidate) theo mockup Stitch 4 `t_l_ch_ph_ng_v_n`.
 * Grid lịch tuần + panel tóm tắt sticky; nguồn thật: `/applications/my`,
 * `/slots/available?employerId=`, POST `/applications/book-slot`.
 * Khối bỏ theo plan §5-S3: avatar/rating cố vấn, "Đổi người phỏng vấn",
 * tín chỉ Pro, mục tiêu mô phỏng, ô ghi chú (book-slot không nhận note),
 * checkbox AI Co-Pilot/SMS, quyền lợi Pro, 2 card FAQ chính sách.
 */

type Period = 'all' | 'morning' | 'afternoon' | 'evening';

const WEEKDAYS_VN = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDay = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const periodOf = (hour: number): Exclude<Period, 'all'> => {
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 13 && hour < 18) return 'afternoon';
  return 'evening';
};

const durationMin = (startIso: string, endIso: string): number => {
  const a = parseServerTimestamp(startIso);
  const b = parseServerTimestamp(endIso);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
};

const CandidateBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    applications, loading: appsLoading, error, successMsg,
    fetchMyApplications, bookSlot,
  } = useCandidateController();
  const { availableSlots, loading: slotsLoading, fetchAvailableSlots, clearMessages: clearSlotMsg } =
    useSlotController();

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const dow = d.getDay(); // 0 = CN
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [period, setPeriod] = useState<Period>('all');
  const [submitting, setSubmitting] = useState(false);

  // useMemo giữ reference ổn định giữa các render (deps của openApps bên dưới).
  const content = useMemo(() => applications?.content ?? [], [applications]);
  // Đơn đang mở để đặt lịch: PENDING và chưa có slot (SCHEDULED đã có lịch).
  const openApps = useMemo(
    () => content.filter((a) => a.status === 'PENDING' && !a.slot),
    [content]
  );

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchMyApplications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // applicationId từ link "/interview-booking?applicationId=" (nút Đặt lịch ở màn đơn)
  useEffect(() => {
    const raw = params.get('applicationId');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isNaN(id)) setSelectedAppId((cur) => cur ?? id);
  }, [params]);

  useEffect(() => {
    if (selectedAppId == null) return;
    const app = openApps.find((a) => a.id === selectedAppId);
    if (!app) return;
    clearSlotMsg();
    setSelectedSlotId(null);
    fetchAvailableSlots(app.employerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppId, openApps]);

  const selectedApp: Application | null =
    openApps.find((a) => a.id === selectedAppId) ?? null;

  const days = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [weekStart]);

  const grouped = useMemo(() => {
    const map = new Map<string, { slotId: number; start: Date; end: Date; booked: boolean }[]>();
    days.forEach((d) => map.set(dayKey(d), []));
    availableSlots.forEach((s) => {
      const start = parseServerTimestamp(s.startTime);
      const end = parseServerTimestamp(s.endTime);
      if (!start || !end) return;
      const key = dayKey(start);
      const arr = map.get(key);
      if (arr) arr.push({ slotId: s.id, start, end, booked: s.booked || s.cancelled });
    });
    map.forEach((arr) => arr.sort((a, b) => a.start.getTime() - b.start.getTime()));
    return map;
  }, [availableSlots, days]);

  const periodCounts = useMemo(() => {
    const c = { all: 0, morning: 0, afternoon: 0, evening: 0 };
    availableSlots.forEach((s) => {
      if (s.booked || s.cancelled) return;
      const start = parseServerTimestamp(s.startTime);
      if (!start || start < new Date()) return;
      c[periodOf(start.getHours())] += 1;
      c.all += 1;
    });
    return c;
  }, [availableSlots]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const chosenSlot =
    availableSlots.find((s) => s.id === selectedSlotId) ?? null;
  // BE trả LocalDateTime naive (UTC) -> phải qua parseServerTimestamp, nếu không ô
  // "Thời gian đã chọn" lệch 7h so với chính ô lịch bên trái.
  const chosenStart = chosenSlot ? parseServerTimestamp(chosenSlot.startTime) : null;
  const chosenEnd = chosenSlot ? parseServerTimestamp(chosenSlot.endTime) : null;

  const confirm = async () => {
    if (!selectedApp || !selectedSlotId) return;
    setSubmitting(true);
    const ok = await bookSlot(selectedSlotId, selectedApp.id);
    setSubmitting(false);
    if (ok) navigate('/my-applications');
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <EmptyBlock
        icon="lock"
        title="Trang này chỉ dành cho tài khoản ứng viên."
        description="Đăng nhập bằng tài khoản ứng viên để đặt lịch phỏng vấn."
      />
    );
  }

  const shiftWeek = (deltaDays: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(d);
  };

  return (
    <div className="flex flex-col w-full pb-space-2xl gap-space-lg">
      {/* Headline */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pt-2">
        <div className="flex flex-col gap-space-xs">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-fixed-variant w-fit text-ds-label-sm">
            <span className={`${ICON} text-[15px] text-secondary-teal`}>verified</span>
            Khung giờ do chính nhà tuyển dụng mở
          </div>
          <h1 className="m-0 text-ds-headline-xl text-on-surface tracking-tight">
            Đặt lịch phỏng vấn với Nhà tuyển dụng
          </h1>
          <p className="m-0 max-w-3xl text-ds-body-md text-on-surface-variant">
            Chọn đơn ứng tuyển, chọn khung giờ trống trong tuần của nhà tuyển dụng và xác nhận —
            lịch sẽ xuất hiện ngay trên màn Đơn ứng tuyển của bạn.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-xl shadow-sm border border-outline-variant/30">
            <span className={`${ICON} text-primary text-[20px]`}>calendar_clock</span>
            <div className="flex flex-col">
              <span className="text-ds-label-sm text-on-surface-variant">
                Đơn đang chờ lịch
              </span>
              <span className="text-ds-label-md text-primary font-bold">
                {openApps.length} đơn
              </span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-success-bg px-4 py-3 text-ds-body-md text-success-text" role="status">
          <span className={`${ICON} shrink-0 text-[18px]`}>check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      {error && <ErrorBlock message={error} />}

      {appsLoading && !applications ? (
        <LoadingBlock />
      ) : openApps.length === 0 ? (
        <EmptyBlock
          icon="event_busy"
          title="Chưa có đơn nào cần đặt lịch."
          description="Bạn chỉ đặt được lịch phỏng vấn khi có đơn ứng tuyển đang chờ xét duyệt và nhà tuyển dụng mở khung giờ."
          action={
            <button className={buttonClass('primary')} onClick={() => navigate('/jobs')}>
              Mở Bảng việc làm
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT: chọn đơn + lịch tuần */}
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            {/* Application chooser (thay card "cố vấn" — không có API mentor) */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-outline-variant/40">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-space-sm">
                <span className="text-ds-label-md text-on-surface uppercase tracking-wider">
                  Chọn đơn ứng tuyển
                </span>
                <div className="flex flex-col gap-space-xs">
                  {openApps.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAppId(a.id)}
                      className={`w-full text-left flex items-center gap-space-md px-space-md py-space-sm rounded-lg border transition-all ${
                        selectedAppId === a.id
                          ? 'border-primary bg-primary-container/10 shadow-sm'
                          : 'border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold shrink-0">
                        {a.companyName.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-on-surface truncate">{a.jobTitle}</span>
                        <span className="text-ds-body-sm text-on-surface-variant truncate">
                          {a.companyName} • Nộp ngày {fmtServer(a.createdAt, 'date')}
                        </span>
                      </span>
                      {selectedAppId === a.id && (
                        <span className={`${ICON} text-primary ml-auto shrink-0`}>check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly calendar */}
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-outline-variant/40 flex flex-col gap-space-lg">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md pb-space-md border-b border-surface-container-high">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
                    <button
                      type="button"
                      title="Tuần trước"
                      onClick={() => shiftWeek(-7)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors"
                    >
                      <span className={`${ICON} text-[20px]`}>chevron_left</span>
                    </button>
                    <button
                      type="button"
                      title="Tuần tiếp theo"
                      onClick={() => shiftWeek(7)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors"
                    >
                      <span className={`${ICON} text-[20px]`}>chevron_right</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const dow = d.getDay();
                      d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
                      d.setHours(0, 0, 0, 0);
                      setWeekStart(d);
                    }}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface text-ds-label-md hover:bg-surface-container transition-colors"
                  >
                    Hôm nay
                  </button>
                  <div className="flex items-center gap-space-xs pl-space-xs">
                    <span className={`${ICON} text-primary text-[20px]`}>calendar_today</span>
                    <span className="text-on-surface">
                      Tuần: {fmtDay(weekStart)} - {fmtDay(weekEnd)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className={`${ICON} text-[16px] text-outline`}>public</span>
                  <span className="text-ds-label-sm text-outline font-medium">
                    Múi giờ: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'GMT+7'}
                  </span>
                </div>
              </div>

              {/* Period tabs — đếm từ slot trống thật */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
              {(
                [
                  { key: 'all', label: `Tất cả các ca (${periodCounts.all} trống)` },
                  { key: 'morning', label: 'Buổi sáng (08:00 - 12:00)' },
                  { key: 'afternoon', label: 'Buổi chiều (13:30 - 17:30)' },
                  { key: 'evening', label: 'Buổi tối (18:30 - 21:00)' },
                ] as { key: Period; label: string }[]
              ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setPeriod(t.key)}
                    className={`px-space-md py-space-xs rounded-lg text-ds-label-md shrink-0 transition-colors ${
                      period === t.key
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {selectedAppId == null ? (
                <p className="m-0 py-space-lg text-center text-ds-body-md text-on-surface-variant">
                  Chọn một đơn ứng tuyển ở trên để xem khung giờ trống của nhà tuyển dụng.
                </p>
              ) : slotsLoading ? (
                <LoadingBlock label="Đang tải khung giờ trống..." />
              ) : (
                <div className="overflow-x-auto -mx-space-lg px-space-lg">
                  <div className="grid grid-cols-7 gap-space-sm min-w-[760px]">
                    {days.map((d) => {
                      const isToday = dayKey(d) === dayKey(new Date());
                      const slots = (grouped.get(dayKey(d)) ?? []).filter((s) => {
                        if (period === 'all') return true;
                        return periodOf(s.start.getHours()) === period;
                      });
                      return (
                        <div key={dayKey(d)} className="flex flex-col gap-space-xs">
                          <div
                            className={`p-space-sm rounded-lg text-center flex flex-col items-center ${
                              isToday
                                ? 'bg-primary-container/15 border border-primary/30'
                                : 'bg-surface-container'
                            }`}
                          >
                            {isToday ? (
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                Hôm nay
                              </span>
                            ) : (
                              <span className="text-ds-label-sm text-on-surface-variant">
                                {WEEKDAYS_VN[d.getDay()]}
                              </span>
                            )}
                            <span
                              className={`font-bold ${
                                isToday ? 'text-primary' : 'text-on-surface'
                              }`}
                            >
                              {fmtDay(d)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-space-xs mt-1">
                            {slots.length === 0 && (
                              <div className="w-full py-2 px-1 text-center rounded-lg text-[11px] text-outline">
                                —
                              </div>
                            )}
                            {slots.map((s) => {
                              const past = s.start < new Date();
                              const disabled = s.booked || past;
                              const selected = s.slotId === selectedSlotId;
                              if (disabled) {
                                return (
                                  <div
                                    key={s.slotId}
                                    title={s.booked ? 'Đã có người đặt' : 'Đã qua thời điểm'}
                                    className="w-full py-2 px-1 text-center rounded-lg bg-surface-container-high/60 text-outline cursor-not-allowed text-ds-label-sm line-through"
                                  >
                                    {fmtTime(s.start)} - {fmtTime(s.end)}
                                  </div>
                                );
                              }
                              return (
                                <button
                                  key={s.slotId}
                                  type="button"
                                  onClick={() => setSelectedSlotId(s.slotId)}
                                  className={`w-full py-2 px-1 text-center rounded-lg text-ds-label-sm transition-all ${
                                    selected
                                      ? 'bg-primary-container text-on-primary shadow-md ring-2 ring-primary flex items-center justify-center gap-1 font-semibold'
                                      : 'bg-surface-container-lowest border border-outline-variant/60 hover:border-primary hover:bg-primary-container/10 text-on-surface'
                                  }`}
                                >
                                  {selected && (
                                    <span className={`${ICON} text-[14px]`}>check_circle</span>
                                  )}
                                  {fmtTime(s.start)} - {fmtTime(s.end)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs border-t border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-primary-container ring-1 ring-primary" />
                  <span className="text-ds-label-sm text-on-surface-variant">Đang chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-surface-container-lowest border border-outline-variant" />
                  <span className="text-ds-label-sm text-on-surface-variant">
                    Khung giờ còn trống
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-surface-container-high/80" />
                  <span className="text-ds-label-sm text-on-surface-variant">
                    Đã có người đặt / đã qua
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: sticky summary */}
          <div className="xl:col-span-4 xl:sticky xl:top-20 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-md border border-outline-variant/50 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
                <div className="flex items-center gap-space-xs">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                    <span className={`${ICON} text-[20px]`}>event_seat</span>
                  </div>
                  <h3 className="m-0 text-on-surface">Thông tin buổi phỏng vấn</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant text-ds-label-sm">
                  {chosenSlot ? 'Xác nhận bước 2/2' : 'Chọn khung giờ'}
                </span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
                {chosenSlot ? (
                  <>
                    <div className="flex items-start gap-space-sm">
                      <span className={`${ICON} text-primary text-[20px] shrink-0 mt-0.5`}>schedule</span>
                      <div className="flex flex-col">
                        <span className="text-ds-label-sm text-on-surface-variant uppercase tracking-wider">
                          Thời gian đã chọn
                        </span>
                        <span className="text-primary font-bold">
                          {chosenStart && chosenEnd
                            ? `${fmtTime(chosenStart)} - ${fmtTime(chosenEnd)}, ${
                                WEEKDAYS_VN[chosenStart.getDay()]
                              }`
                            : '—'}
                        </span>
                        <span className="text-ds-body-sm text-on-surface-variant">
                          Ngày {fmtServer(chosenSlot.startTime, 'date')}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-surface-container-high my-1" />
                    <div className="flex items-center justify-between text-ds-body-sm">
                      <span className="text-on-surface-variant">Thời lượng:</span>
                      <span className="text-on-surface font-semibold">
                        {durationMin(chosenSlot.startTime, chosenSlot.endTime)} phút
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-ds-body-sm">
                      <span className="text-on-surface-variant">Nhà tuyển dụng:</span>
                      <span className="text-on-surface font-semibold">
                        {chosenSlot.employerName}
                      </span>
                    </div>
                    {chosenSlot.note && (
                      <div className="flex items-start justify-between gap-2 text-ds-body-sm">
                        <span className="text-on-surface-variant shrink-0">Ghi chú của NTD:</span>
                        <span className="text-on-surface font-semibold text-right">
                          {chosenSlot.note}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="m-0 text-ds-body-sm text-on-surface-variant">
                    Chưa chọn khung giờ. Khung trống hiện theo cột lịch bên trái — hãy bấm một ô
                    "còn trống".
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="text-on-surface">Đơn ứng tuyển</label>
                <div className="flex items-center justify-between p-space-sm rounded-lg border border-outline-variant/60 bg-surface">
                  {selectedApp ? (
                    <div className="flex items-center gap-space-xs min-w-0">
                      <span className={`${ICON} text-primary text-[20px]`}>work</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-on-surface truncate font-medium">
                          {selectedApp.jobTitle}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {selectedApp.companyName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-ds-body-sm text-outline">Chưa chọn đơn</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-space-xs pt-space-xs">
                <button
                  type="button"
                  onClick={() => void confirm()}
                  disabled={!chosenSlot || !selectedApp || submitting}
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold flex items-center justify-center gap-space-xs shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className={`${ICON} text-[20px]`}>task_alt</span>
                  {submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch phỏng vấn'}
                </button>
                <p className="m-0 text-ds-body-sm text-center text-on-surface-variant flex items-center justify-center gap-1 pt-1">
                  <span className={`${ICON} text-[15px] text-secondary-teal`}>verified_user</span>
                  Hủy đơn ứng tuyển để ngừng lịch hẹn (màn Đơn ứng tuyển)
                </p>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className={`${ICON} text-outline text-[20px]`}>contact_support</span>
                <span className="text-ds-body-sm text-on-surface-variant">
                  Cần trợ giúp trong quá trình đặt lịch?
                </span>
              </div>
              <Link to="/bug-reports" className="text-primary font-semibold hover:underline whitespace-nowrap">
                Trợ giúp &amp; Hỗ trợ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateBookingPage;
