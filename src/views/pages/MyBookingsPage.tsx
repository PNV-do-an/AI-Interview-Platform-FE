import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentService from '../../services/payment.service';
import { Booking } from '../../models/Payment.model';
import { formatVnd } from '../../models/Order.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';

const statusTone: Record<string, string> = {
  HELD: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
  RELEASED: 'bg-teal-50 text-teal-700 border-teal-200',
};

const statusLabel: Record<string, string> = {
  HELD: 'Đang giữ',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  RELEASED: 'Đã giải ngân',
};

const MyBookingsPage: React.FC = () => {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getMyBookings();
      setItems(res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được danh sách booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const act = async (fn: () => Promise<any>, id: number) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const heldCount = items.filter((b) => b.status === 'HELD').length;
  const totalAmount = items.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">event_available</span>
              Lịch sử đặt lịch
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Booking mentor & phỏng vấn</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Theo dõi các buổi phỏng vấn đã đặt với mentor, trạng thái thanh toán và thao tác hoàn thành hoặc huỷ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-slate-300">Tổng giá trị</p>
              <p className="m-0 text-lg font-bold">{formatVnd(totalAmount)}</p>
            </div>
            <Link
              to="/payments"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Ví & thanh toán
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng booking', value: `${items.length} buổi`, icon: 'event_available', tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Đang giữ tiền', value: `${heldCount} buổi`, icon: 'lock', tone: 'bg-amber-50 text-amber-600' },
          { label: 'Tổng giá trị', value: formatVnd(totalAmount), icon: 'payments', tone: 'bg-emerald-50 text-emerald-600' },
        ].map((item) => (
          <div key={item.label} className={`${CARD} flex items-start gap-3 p-5`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="m-0 mt-1 truncate text-lg font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={`${CARD} flex items-center justify-center gap-3 p-10 text-sm text-slate-500`}>
          <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
          Đang tải booking...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className={`${CARD} flex flex-col items-center justify-center gap-3 px-6 py-12 text-center`}>
          <span className="material-symbols-outlined text-[36px] text-slate-300">event_busy</span>
          <p className="m-0 text-sm font-semibold text-slate-700">Chưa có booking nào</p>
          <p className="m-0 text-xs text-slate-500">Đặt lịch phỏng vấn với mentor để bắt đầu rèn luyện.</p>
          <Link to="/payments" className={`${BTN_PRIMARY} mt-2`}>
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Xem thanh toán
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Mã booking</th>
                  <th className="px-5 py-3 font-semibold">Mentor</th>
                  <th className="px-5 py-3 font-semibold">Số tiền</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Thời gian giữ</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">#{b.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">Mentor #{b.mentorId}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatVnd(b.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[b.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {statusLabel[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {b.heldAt ? new Date(b.heldAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {b.status === 'HELD' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyId === b.id}
                            onClick={() => act(() => PaymentService.completeBooking(b.id), b.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === b.id ? '...' : 'Hoàn thành'}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === b.id}
                            onClick={() => act(() => PaymentService.cancelBooking(b.id, 'user cancel'), b.id)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div>
        <Link to="/payments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 no-underline hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Về trung tâm thanh toán
        </Link>
      </div>
    </div>
  );
};

export default MyBookingsPage;
