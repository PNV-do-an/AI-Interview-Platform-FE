import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentService from '../../services/payment.service';
import { Withdrawal, WithdrawalRequest } from '../../models/Payment.model';
import { formatVnd } from '../../models/Order.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';

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
      setMsg('Đã gửi yêu cầu rút tiền thành công.');
      setForm({ amount: 0, bankName: '', accountNumber: '', accountHolder: '' });
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setBusy(false);
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
              <span className="material-symbols-outlined text-[15px]">account_balance</span>
              Rút tiền
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Yêu cầu rút tiền</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Gửi yêu cầu rút thu nhập về tài khoản ngân hàng của bạn.
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
      {msg && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Form */}
        <section className={`${CARD} p-5 sm:p-6 lg:col-span-5`}>
          <h2 className="m-0 text-lg font-bold text-slate-900">Tạo yêu cầu rút tiền</h2>
          <p className="m-0 mt-0.5 text-sm text-slate-500">Điền thông tin tài khoản nhận tiền.</p>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Số tiền</label>
              <input
                type="number"
                min={1}
                placeholder="Số tiền (VND)"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Ngân hàng</label>
              <input
                placeholder="Tên ngân hàng"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Số tài khoản</label>
              <input
                placeholder="Số tài khoản"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Chủ tài khoản</label>
              <input
                placeholder="Tên chủ tài khoản"
                value={form.accountHolder}
                onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button type="button" onClick={submit} disabled={busy} className={`${BTN_PRIMARY} w-full`}>
              {busy ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </section>

        {/* History */}
        <section className={`${CARD} overflow-hidden lg:col-span-7`}>
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="m-0 text-lg font-bold text-slate-900">Lịch sử rút tiền</h2>
            <p className="m-0 mt-0.5 text-sm text-slate-500">Theo dõi các yêu cầu rút tiền của bạn.</p>
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
              <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
              Đang tải...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-slate-300">account_balance</span>
              <p className="m-0 text-sm font-semibold text-slate-700">Chưa có yêu cầu nào</p>
              <p className="m-0 text-xs text-slate-500">Gửi yêu cầu rút tiền đầu tiên của bạn.</p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Số tiền</th>
                    <th className="px-5 py-3 font-semibold">Ngân hàng</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">#{w.id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{w.amount.toLocaleString('vi-VN')} ₫</td>
                      <td className="px-5 py-3 text-slate-600">{w.bankName} - {w.accountNumber}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{w.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WithdrawalsPage;
