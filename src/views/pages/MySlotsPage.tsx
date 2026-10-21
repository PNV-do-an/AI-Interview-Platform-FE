import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlotController } from '../../controllers/useSlotController';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Badge,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  buttonClass,
  inputClass,
  labelClass,
} from '../components/ui';

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MySlotsPage: React.FC = () => {
  const { mySlots, loading, error, successMsg, fetchMySlots, createSlot, cancelSlot } = useSlotController();
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [note, setNote] = useState('');
  const [pendingCancel, setPendingCancel] = useState<number | null>(null);

  useEffect(() => { fetchMySlots(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doCancel = async (id: number) => {
    setPendingCancel(null);
    await cancelSlot(id);
    await fetchMySlots();
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Backend nhận LocalDateTime (mốc tường(local), không có zone). toISOString() sẽ đẩy về UTC
    // và làm lệch giờ với máy ngoài UTC, nên gửi đúng chuỗi local.
    const withSeconds = (v: string) => (v.length === 16 ? `${v}:00` : v);
    const ok = await createSlot({ startTime: withSeconds(start), endTime: withSeconds(end), note: note || undefined });
    if (ok) {
      setNote('');
      await fetchMySlots();
    }
  };

  return (
    <div>
      <PageHeader title="Interviewer Availability" />

      {loading && <LoadingState />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <form
        onSubmit={onCreate}
        className="mb-6 flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-card"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Start</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button type="submit" className={buttonClass('primary', 'self-start')}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Slot
        </button>
      </form>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {mySlots.map((slot) => (
          <div
            key={slot.id}
            className="flex min-h-8 flex-wrap items-center gap-2 rounded-md border border-[#e2e8f0] bg-card px-3 py-1 text-label-md text-ink transition-colors hover:border-[#6366f1] hover:bg-info"
          >
            <span className="material-symbols-outlined shrink-0 text-[18px] text-primary">schedule</span>
            <strong className="min-w-0 flex-1 truncate font-medium">
              {new Date(slot.startTime).toLocaleString('vi-VN')} — {new Date(slot.endTime).toLocaleTimeString('vi-VN')}
            </strong>
            <Badge tone={slot.booked ? 'danger' : 'success'}>
              {slot.booked ? `Booked by ${slot.bookedByName}` : 'Available'}
            </Badge>
            {slot.note && <span className="min-w-0 flex-1 truncate text-body-sm text-ink-variant">{slot.note}</span>}
            {!slot.booked && (
              <button
                className={buttonClass('ghost', 'h-7 shrink-0 px-2 text-label-sm')}
                onClick={() => setPendingCancel(slot.id)}
              >
                Cancel Slot
              </button>
            )}
          </div>
        ))}
      </div>

      {mySlots.length === 0 && !loading && (
        <EmptyState icon="event" title="No availability slots yet." />
      )}

      <p className="pt-6">
        <Link to="/my-jobs" className="text-label-md text-ink-variant no-underline transition-colors hover:text-primary">
          ← My Job Postings
        </Link>
      </p>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this availability slot?"
        message="The slot is removed from the booking calendar. This can't be undone."
        confirmLabel="Cancel Slot"
        cancelLabel="Keep slot"
        danger
        onConfirm={() => { if (pendingCancel !== null) void doCancel(pendingCancel); }}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
};

export default MySlotsPage;
