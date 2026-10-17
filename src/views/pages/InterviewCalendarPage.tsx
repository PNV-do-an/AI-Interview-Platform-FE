import React, { useEffect, useMemo, useState } from 'react';
import { useSlotController } from '../../controllers/useSlotController';
import { Slot } from '../../models/Program.model';
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
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  open: 'border border-[#e2e8f0] bg-surface-low text-ink-variant',
  booked: 'border border-transparent bg-info text-info-text',
  cancelled: 'border border-transparent bg-danger-bg text-danger-text line-through',
};

const STATE_LABEL: Record<SlotState, string> = {
  open: 'Open',
  booked: 'Booked',
  cancelled: 'Cancelled',
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
      setFormError('Please enter a valid date and time.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('End time must be after start time.');
      return;
    }
    setSaving(true);
    // Backend nhận LocalDateTime (mốc tường, không có zone); toISOString() sẽ lệch giờ.
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

  const onCancel = async (id: number) => {
    await cancelSlot(id);
    await fetchMySlots();
  };

  const weekLabel = `${weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${addDays(weekStart, 6).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <div className="pb-10">
      <PageHeader
        title="Interview Availability Calendar"
        description="Publish your open interview slots and review what candidates have booked."
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
                <span className="flex items-center gap-1 text-headline-sm text-ink">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    calendar_today
                  </span>
                  {weekLabel}
                </span>
                <span className="text-body-sm text-ink-variant">
                  Weekly view of your published slots. Navigate without reloading data.
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous week"
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
                  Today
                </button>
                <button
                  type="button"
                  aria-label="Next week"
                  className={buttonClass('secondary', 'h-8 w-8 px-0')}
                  onClick={() => setWeekStart((w) => addDays(w, 7))}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Legend (token tones only) */}
            <div className="flex flex-wrap items-center gap-4 text-label-sm text-ink-variant">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm border border-[#e2e8f0] bg-surface-low" /> Open
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-info" /> Booked
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-danger-bg" /> Cancelled
              </span>
            </div>

            {loading ? (
              <LoadingState label="Loading slots..." />
            ) : mySlots.length === 0 ? (
              <EmptyState
                icon="event"
                title="No slots yet"
                description="Add your first availability using the form to start receiving bookings."
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[760px] grid-cols-8">
                  {/* Header row */}
                  <div className="border-b border-[#e2e8f0] px-2 py-2 text-label-sm uppercase tracking-[0.04em] text-outline-strong">
                    Time
                  </div>
                  {days.map((d, i) => {
                    const key = dayKey(d);
                    const count = slotsOn(key).length;
                    const isToday = key === today;
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center gap-0.5 rounded-t-md border-b border-[#e2e8f0] px-1 py-2 ${
                          isToday ? 'bg-primary-container text-on-primary' : 'bg-surface-low text-ink'
                        }`}
                      >
                        <span className="text-label-sm uppercase">{WEEKDAYS[i]}</span>
                        <span className="text-headline-sm">{d.getDate()}</span>
                        {count > 0 && (
                          <span
                            className={`font-mono text-[10px] ${
                              isToday ? 'text-on-primary' : 'text-ink-variant'
                            }`}
                          >
                            {count} {count === 1 ? 'slot' : 'slots'}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Body: one row per hour in the band */}
                  {hours.map((h) => (
                    <React.Fragment key={h}>
                      <div className="border-t border-[#e2e8f0] px-2 py-1 font-mono text-[11px] text-outline-strong">
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
                            className="flex min-h-[68px] flex-col gap-1 border-l border-t border-[#e2e8f0] p-1"
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
                                      {timeLabel(start)}–{timeLabel(end)}
                                    </span>
                                    <Badge tone={BADGE_TONE[st]}>{STATE_LABEL[st]}</Badge>
                                  </div>
                                  {st === 'booked' && s.bookedByName && (
                                    <div className="truncate">by {s.bookedByName}</div>
                                  )}
                                  {s.note && <div className="truncate opacity-80">{s.note}</div>}
                                  {st === 'open' && (
                                    <button
                                      type="button"
                                      className="mt-0.5 text-label-sm font-medium underline underline-offset-2 hover:text-ink"
                                      onClick={() => onCancel(s.id)}
                                    >
                                      Cancel slot
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
            <div className="flex items-center gap-1 text-headline-sm text-ink">
              <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
              Add Availability
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Publish a new open slot. Candidates can book it from the scheduling flow.
            </p>

            <form onSubmit={onCreate} className="flex flex-col gap-3">
              <div>
                <label className={labelClass} htmlFor="slot-date">
                  Date
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
                    Start time
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
                    End time
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
                    Note
                  </label>
                  <span className="mb-1 font-mono text-[11px] text-outline-strong">
                    {formNote.length} / 400
                  </span>
                </div>
                <textarea
                  id="slot-note"
                  rows={3}
                  maxLength={400}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Focus on distributed systems design."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </div>
              <button type="submit" disabled={saving} className={buttonClass('primary', 'w-full')}>
                <span className="material-symbols-outlined text-[18px]">
                  {saving ? 'progress_activity' : 'add'}
                </span>
                {saving ? 'Adding...' : 'Add Slot'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendarPage;
