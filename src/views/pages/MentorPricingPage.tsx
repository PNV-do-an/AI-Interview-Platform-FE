import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentService from '../../services/payment.service';
import { MentorPricing, MentorPricingRequest } from '../../models/Payment.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';

const MentorPricingPage: React.FC = () => {
  const [data, setData] = useState<MentorPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<MentorPricingRequest>({ minPrice: 0, maxPrice: 0, hourlyRate: 0, level: '', featured: false });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getMyMentorPricing();
      const d = res.data?.data ?? null;
      setData(d);
      if (d) setForm({ minPrice: d.minPrice, maxPrice: d.maxPrice, hourlyRate: d.hourlyRate, level: d.level ?? '', featured: d.featured ?? false });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được bảng giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await PaymentService.updateMyMentorPricing(form);
      setData(res.data?.data ?? data);
      setMsg('Đã lưu bảng giá thành công.');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lưu thất bại.');
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
              <span className="material-symbols-outlined text-[15px]">sell</span>
              Bảng giá mentor
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Thiết lập giá mentor</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Cấu hình giá và cấp độ mentor của bạn để ứng viên đặt lịch.
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

      {loading && (
        <div className={`${CARD} flex items-center justify-center gap-3 p-10 text-sm text-slate-500`}>
          <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
          Đang tải bảng giá...
        </div>
      )}

      {!loading && (
        <section className={`${CARD} p-5 sm:p-6`}>
          <h2 className="m-0 text-lg font-bold text-slate-900">Cấu hình giá</h2>
          <p className="m-0 mt-0.5 text-sm text-slate-500">Thiết lập khoảng giá và mức phí theo giờ.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['minPrice', 'maxPrice', 'hourlyRate'] as const).map((k) => (
              <div key={k}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                  {k === 'minPrice' ? 'Giá tối thiểu' : k === 'maxPrice' ? 'Giá tối đa' : 'Phí theo giờ'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Level</label>
              <input
                value={form.level ?? ''}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="Level (tuỳ chọn)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="featured"
                checked={!!form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="featured" className="text-sm text-slate-900">Featured (ưu tiên hiển thị)</label>
            </div>
          </div>
          <button type="button" onClick={save} disabled={busy} className={`${BTN_PRIMARY} mt-5`}>
            {busy ? 'Đang lưu...' : 'Lưu bảng giá'}
          </button>
          {data && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Mentor ID: <strong className="text-slate-900">{data.mentorId}</strong>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MentorPricingPage;
