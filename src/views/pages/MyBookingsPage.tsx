import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { Booking } from '../../models/Payment.model';
import { CARD } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock } from '../components/adminKit';

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
    try { await fn(); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Thao tác thất bại.'); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải booking..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">Booking của tôi</h1>
      {items.length === 0 ? <p className="text-ds-body-sm text-on-surface-variant">Chưa có booking nào.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-ds-body-sm">
            <thead><tr className="bg-surface-container-low text-ds-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-space-md py-2.5">ID</th><th className="px-space-md py-2.5">Mentor</th><th className="px-space-md py-2.5">Số tiền</th><th className="px-space-md py-2.5">Trạng thái</th><th className="px-space-md py-2.5">Hành động</th>
            </tr></thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-surface-container-high/40">
                  <td className="px-space-md py-3">{b.id}</td>
                  <td className="px-space-md py-3">#{b.mentorId}</td>
                  <td className="px-space-md py-3">{b.amount.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-space-md py-3">{b.status}</td>
                  <td className="px-space-md py-3 flex gap-2">
                    {b.status === 'HELD' && <>
                      <button disabled={busyId === b.id} onClick={() => act(() => PaymentService.completeBooking(b.id), b.id)} className={adminButton('soft', 'h-8')}>Hoàn thành</button>
                      <button disabled={busyId === b.id} onClick={() => act(() => PaymentService.cancelBooking(b.id, 'user cancel'), b.id)} className={adminButton('ghost', 'h-8')}>Hủy</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
