import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { Withdrawal, WithdrawalRequest } from '../../models/Payment.model';
import { CARD, SOFT } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock } from '../components/adminKit';

const WithdrawalsPage: React.FC = () => {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<WithdrawalRequest>({ amount: 0, bankName: '', accountNumber: '', accountHolder: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getMyWithdrawals();
      setItems(res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được danh sách rút tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async () => {
    setBusy(true);
    setMsg('');
    try {
      await PaymentService.requestWithdrawal(form);
      setMsg('Đã gửi yêu cầu rút tiền.');
      setForm({ amount: 0, bankName: '', accountNumber: '', accountHolder: '' });
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">Rút tiền</h1>
      <div className={`${CARD} p-space-lg`}>
        <h2 className="text-ds-headline-sm font-bold text-on-surface">Tạo yêu cầu</h2>
        <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
          <input type="number" min={1} placeholder="Số tiền" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
          <input placeholder="Ngân hàng" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
          <input placeholder="Số tài khoản" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
          <input placeholder="Chủ tài khoản" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
        </div>
        <button type="button" onClick={submit} disabled={busy} className={adminButton('primary', 'mt-space-md h-10')}>
          {busy ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
        {msg && <p className="mt-space-sm text-ds-body-sm text-on-surface-variant">{msg}</p>}
      </div>

      <div className={`${CARD} p-space-lg`}>
        <h2 className="text-ds-headline-sm font-bold text-on-surface">Lịch sử rút tiền</h2>
        {items.length === 0 ? <p className="text-ds-body-sm text-on-surface-variant">Chưa có yêu cầu nào.</p> : (
          <div className="overflow-x-auto mt-space-md">
            <table className="w-full border-collapse text-left text-ds-body-sm">
              <thead><tr className="bg-surface-container-low text-ds-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-space-md py-2.5">ID</th><th className="px-space-md py-2.5">Số tiền</th><th className="px-space-md py-2.5">Ngân hàng</th><th className="px-space-md py-2.5">Trạng thái</th><th className="px-space-md py-2.5">Ngày tạo</th>
              </tr></thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b border-surface-container-high/40">
                    <td className="px-space-md py-3">{w.id}</td>
                    <td className="px-space-md py-3">{w.amount.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-space-md py-3">{w.bankName} - {w.accountNumber}</td>
                    <td className="px-space-md py-3">{w.status}</td>
                    <td className="px-space-md py-3">{w.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalsPage;
