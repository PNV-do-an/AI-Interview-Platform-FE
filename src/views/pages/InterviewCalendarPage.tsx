import React, { useEffect, useMemo, useState } from 'react';
import { useSlotController } from '../../controllers/useSlotController';
import { Slot } from '../../models/Program.model';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const startOfWeek = (d: Date) => {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

type SlotState = 'open' | 'booked' | 'cancelled';

const slotState = (s: Slot): SlotState =>
  s.cancelled ? 'cancelled' : s.booked ? 'booked' : 'open';

const CELL_TONE: Record<SlotState, string> = {
  open: 'border border-slate-200 bg-slate-50 text-slate-900-variant',
  booked: 'border border-transparent bg-info text-info-text',
  cancelled: 'border border-transparent bg-danger-bg text-danger-text line-through',
};

const STATE_LABEL: Record<SlotState, string> = {
  open: 'Trá»‘ng',
  booked: 'ÄÃ£ Ä‘áº·t',
  cancelled: 'ÄÃ£ huá»·',
};

const BADGE_TONE: Record<SlotState, 'neutral' | 'info' | 'danger'> = {
  open: 'neutral',
  booked: 'info',
  cancelled: 'danger',
};

const InterviewCalendarPage: React.FC = () => {
  const { mySlots, loading, error, successMsg, fetchMySlots, createSlot, cancelSlot } =
    useSlotController();

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [formDate, setFormDate] = useState<string>(dayKey(new Date()));
  const [formStart, setFormStart] = useState<string>('09:00');
  const [formEnd, setFormEnd] = useState<string>('09:45');
  const [formNote, setFormNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [pendingCancel, setPendingCancel] = useState<Slot | null>(null);

  useEffect(() => {
    fetchMySlots();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = dayKey(new Date());

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const dayKeys = useMemo(() => days.map(dayKey), [days]);

  const slotsOn = (key: string) =>
    mySlots.filter((s) => dayKey(new Date(s.startTime)) === key);

  const weekSlots = useMemo(
    () => mySlots.filter((s) => dayKeys.includes(dayKey(new Date(s.startTime)))),
    [mySlots, dayKeys]
  );

  const hours = useMemo(() => {
    let minH = 8;
    let maxH = 18;
    if (weekSlots.length) {
      minH = Math.min(...weekSlots.map((s) => new Date(s.startTime).getHours()));
      maxH = Math.max(...weekSlots.map((s) => new Date(s.endTime).getHours()));
      if (maxH <= minH) maxH = minH + 1;
    }
    return Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);
  }, [weekSlots]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const startDate = new Date(`${formDate}T${formStart}`);
    const endDate = new Date(`${formDate}T${formEnd}`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Vui lÃ²ng nháº­p ngÃ y vÃ  giá» há»£p lá»‡.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('Giá» káº¿t thÃºc pháº£i sau giá» báº¯t Ä‘áº§u.');
      return;
    }
    setSaving(true);
    // Backend nháº­n LocalDateTime (má»‘c tÆ°á»ng, khÃ´ng cÃ³ zone); toISOString() sáº½ lá»‡ch giá».
    const ok = await createSlot({
      startTime: `${formDate}T${formStart}:00`,
      endTime: `${formDate}T${formEnd}:00`,
      note: formNote.trim() || undefined,
    });
    setSaving(false);
    if (ok) {
      setFormNote('');
      setWeekStart(startOfWeek(startDate));
      await fetchMySlots();
    }
  };

  const runCancel = async () => {
    if (!pendingCancel) return;
    const id = pendingCancel.id;
    setPendingCancel(null);
    await cancelSlot(id);
    await fetchMySlots();
  };

  const weekLabel = `${weekStart.toLocaleDateString('vi-VN', {
    month: 'numeric',
    day: 'numeric',
  })} â€“ ${addDays(weekStart, 6).toLocaleDateString('vi-VN', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <div className="pb-10">
      <PageHeader
        title="Lá»‹ch trá»‘ng phá»ng váº¥n"
        description="CÃ´ng khai cÃ¡c khung giá» trá»‘ng vÃ  xem á»©ng viÃªn Ä‘Ã£ Ä‘áº·t buá»•i nÃ o."
      />

      <ErrorBanner message={error || formError} />
      {successMsg && !error && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text"
          role="status"
        >
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Week calendar + time band */}
        <div className="lg:col-span-8">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-headline-sm text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    calendar_today
                  </span>
                  {weekLabel}
                </span>
                <span className="text-body-sm text-slate-900-variant">
                  Lá»‹ch xem theo tuáº§n cá»§a cÃ¡c khung giá» Ä‘Ã£ cÃ´ng khai. Chuyá»ƒn tuáº§n khÃ´ng cáº§n táº£i láº¡i dá»¯ liá»‡u.
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Tuáº§n trÆ°á»›c"
                  className={buttonClass('secondary', 'h-8 w-8 px-0')}
                  onClick={() => setWeekStart((w) => addDays(w, -7))}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  className={buttonClass('secondary', 'h-8 px-2 text-label-sm')}
                  onClick={() => setWeekStart(startOfWeek(new Date()))}
                >
                  HÃ´m nay
                </button>
                <button
                  type="button"
                  aria-label="Tuáº§n sau"
                  className={buttonClass('secondary', 'h-8 w-8 px-0')}
                  onClick={() => setWeekStart((w) => addDays(w, 7))}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Legend (token tones only) */}
            <div className="flex flex-wrap items-center gap-4 text-label-sm text-slate-900-variant">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm border border-slate-200 bg-slate-50" /> Trá»‘ng
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-info" /> ÄÃ£ Ä‘áº·t
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-danger-bg" /> ÄÃ£ huá»·
              </span>
            </div>

            {loading ? (
              <LoadingState label="Äang táº£i khung giá»..." />
            ) : mySlots.length === 0 ? (
              <EmptyState
                icon="event"
                title="ChÆ°a cÃ³ khung giá» nÃ o"
                description="ThÃªm khung giá» trá»‘ng Ä‘áº§u tiÃªn báº±ng form bÃªn cáº¡nh Ä‘á»ƒ báº¯t Ä‘áº§u nháº­n lá»‹ch Ä‘áº·t."
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[760px] grid-cols-8">
                  {/* Header row */}
                  <div className="border-b border-slate-200 px-2 py-2 text-label-sm uppercase tracking-[0.04em] text-slate-500">
                    Giá»
                  </div>
                  {days.map((d, i) => {
                    const key = dayKey(d);
                    const count = slotsOn(key).length;
                    const isToday = key === today;
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center gap-0.5 rounded-t-md border-b border-slate-200 px-1 py-2 ${
                          isToday ? 'bg-indigo-600 text-on-primary' : 'bg-slate-50 text-slate-900'
                        }`}
                      >
                        <span className="text-label-sm uppercase">{WEEKDAYS[i]}</span>
                        <span className="text-headline-sm">{d.getDate()}</span>
                        {count > 0 && (
                          <span
                            className={`font-mono text-[10px] ${
                              isToday ? 'text-on-primary' : 'text-slate-900-variant'
                            }`}
                          >
                            {count} khung giá»
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Body: one row per hour in the band */}
                  {hours.map((h) => (
                    <React.Fragment key={h}>
                      <div className="border-t border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-500">
                        {pad(h)}:00
                      </div>
                      {days.map((d) => {
                        const key = dayKey(d);
                        const cellSlots = slotsOn(key).filter(
                          (s) => new Date(s.startTime).getHours() === h
                        );
                        return (
                          <div
                            key={`${key}-${h}`}
                            className="flex min-h-[68px] flex-col gap-1 border-l border-t border-slate-200 p-1"
                          >
                            {cellSlots.map((s) => {
                              const st = slotState(s);
                              const start = new Date(s.startTime);
                              const end = new Date(s.endTime);
                              return (
                                <div
                                  key={s.id}
                                  className={`rounded-md px-1.5 py-1 text-label-sm ${CELL_TONE[st]}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono">
                                      {timeLabel(start)}â€“{timeLabel(end)}
                                    </span>
                                    <Badge tone={BADGE_TONE[st]}>{STATE_LABEL[st]}</Badge>
                                  </div>
                                  {st === 'booked' && s.bookedByName && (
                                    <div className="truncate">bá»Ÿi {s.bookedByName}</div>
                                  )}
                                  {s.note && <div className="truncate opacity-80">{s.note}</div>}
                                  {st === 'open' && (
                                    <button
                                      type="button"
                                      className="mt-0.5 text-label-sm font-medium underline underline-offset-2 hover:text-slate-900"
                                      onClick={() => setPendingCancel(s)}
                                    >
                                      Huá»· khung giá»
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Add availability form (replaces the mockup's fake summary panel) */}
        <div className="lg:col-span-4">
          <Card className="flex flex-col gap-3 lg:sticky lg:top-20">
            <div className="flex items-center gap-1 text-headline-sm text-slate-900">
              <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
              ThÃªm lá»‹ch trá»‘ng
            </div>
            <p className="m-0 text-body-sm text-slate-900-variant">
              CÃ´ng khai khung giá» má»›i. á»¨ng viÃªn cÃ³ thá»ƒ Ä‘áº·t tá»« luá»“ng lá»‹ch háº¹n.
            </p>

            <form onSubmit={onCreate} className="flex flex-col gap-3">
              <div>
                <label className={labelClass} htmlFor="slot-date">
                  NgÃ y
                </label>
                <input
                  id="slot-date"
                  type="date"
                  required
                  min={today}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="slot-start">
                    Giá» báº¯t Ä‘áº§u
                  </label>
                  <input
                    id="slot-start"
                    type="time"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="slot-end">
                    Giá» káº¿t thÃºc
                  </label>
                  <input
                    id="slot-end"
                    type="time"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="slot-note">
                    Ghi chÃº
                  </label>
                  <span className="mb-1 font-mono text-[11px] text-slate-500">
                    {formNote.length} / 400
                  </span>
                </div>
                <textarea
                  id="slot-note"
                  rows={3}
                  maxLength={400}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Táº­p trung vÃ o thiáº¿t káº¿ há»‡ thá»‘ng phÃ¢n tÃ¡n."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </div>
              <button type="submit" disabled={saving} className={buttonClass('primary', 'w-full')}>
                <span className="material-symbols-outlined text-[18px]">
                  {saving ? 'progress_activity' : 'add'}
                </span>
                {saving ? 'Äang thÃªm...' : 'ThÃªm khung giá»'}
              </button>
            </form>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Huá»· khung giá» nÃ y?"
        message="Khung giá» sáº½ biáº¿n máº¥t khá»i lá»‹ch vÃ  á»©ng viÃªn khÃ´ng cÃ²n Ä‘áº·t Ä‘Æ°á»£c ná»¯a. KhÃ´ng thá»ƒ hoÃ n tÃ¡c."
        confirmLabel="Huá»· khung giá»"
        cancelLabel="Giá»¯ khung giá»"
        danger
        onConfirm={() => void runCancel()}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
};

export default InterviewCalendarPage;

