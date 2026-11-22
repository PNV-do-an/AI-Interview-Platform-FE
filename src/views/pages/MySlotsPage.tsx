import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlotController } from '../../controllers/useSlotController';
import ConfirmDialog from '../components/ConfirmDialog';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:bg-slate-50';

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
    const withSeconds = (v: string) => (v.length === 16 ? `${v}:00` : v);
    const ok = await createSlot({ startTime: withSeconds(start), endTime: withSeconds(end), note: note || undefined });
    if (ok) {
      setNote('');
      await fetchMySlots();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">event_available</span>
              Lịch rảnh
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Khung giờ phỏng vấn</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Mở khung giờ trống để ứng viên đặt lịch phỏng vấn với bạn.
            </p>
          </div>
          <Link to="/payments" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline shadow-sm transition-transform hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Ví & thanh toán
          </Link>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Create slot form */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <h2 className="m-0 text-lg font-bold text-slate-900">Thêm khung giờ trống</h2>
        <p className="m-0 mt-0.5 text-sm text-slate-500">Chọn thời gian bắt đầu và kết thúc cho buổi phỏng vấn.</p>
        <form onSubmit={onCreate} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Bắt đầu</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Kết thúc</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Ghi chú</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú (tuỳ chọn)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <button type="submit" className={`${BTN_PRIMARY} self-start`}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm khung giờ
          </button>
        </form>
      </section>

      {/* Slots list */}
      {loading && (
        <div className={`${CARD} flex items-center justify-center gap-3 p-10 text-sm text-slate-500`}>
          <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
          Đang tải khung giờ...
        </div>
      )}

      {!loading && mySlots.length === 0 && (
        <div className={`${CARD} flex flex-col items-center justify-center gap-3 px-6 py-12 text-center`}>
          <span className="material-symbols-outlined text-[36px] text-slate-300">event_busy</span>
          <p className="m-0 text-sm font-semibold text-slate-700">Chưa có khung giờ trống nào</p>
          <p className="m-0 text-xs text-slate-500">Thêm khung giờ để ứng viên có thể đặt lịch phỏng vấn với bạn.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {mySlots.map((slot) => (
          <div
            key={slot.id}
            className="flex min-h-[60px] flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-indigo-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-semibold text-slate-900">
                {new Date(slot.startTime).toLocaleString('vi-VN')} — {new Date(slot.endTime).toLocaleTimeString('vi-VN')}
              </p>
              {slot.note && <p className="m-0 mt-0.5 truncate text-xs text-slate-500">{slot.note}</p>}
            </div>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              slot.booked ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {slot.booked ? `Đã đặt bởi ${slot.bookedByName}` : 'Còn trống'}
            </span>
            {!slot.booked && (
              <button
                type="button"
                onClick={() => setPendingCancel(slot.id)}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Huỷ
              </button>
            )}
          </div>
        ))}
      </div>

      <div>
        <Link to="/my-jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 no-underline hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Tin đã đăng
        </Link>
      </div>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Huỷ khung giờ này?"
        message="Khung giờ sẽ bị gỡ khỏi lịch đặt hẹn. Không thể hoàn tác."
        confirmLabel="Huỷ khung giờ"
        cancelLabel="Giữ khung giờ"
        danger
        onConfirm={() => { if (pendingCancel !== null) void doCancel(pendingCancel); }}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
};

export default MySlotsPage;
