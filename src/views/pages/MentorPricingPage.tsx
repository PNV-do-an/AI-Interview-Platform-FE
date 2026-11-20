import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { MentorPricing, MentorPricingRequest } from '../../models/Payment.model';
import { CARD, SOFT } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock } from '../components/adminKit';

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
      setMsg('Đã lưu bảng giá.');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải bảng giá..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">Bảng giá mentor</h1>
      <div className={`${CARD} p-space-lg`}>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          {(['minPrice', 'maxPrice', 'hourlyRate'] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-ds-label-sm text-on-surface-variant">{k}</span>
              <input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-ds-label-sm text-on-surface-variant">Level</span>
            <input value={form.level ?? ''} onChange={(e) => setForm({ ...form, level: e.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <span className="text-ds-body-sm text-on-surface">Featured</span>
          </label>
        </div>
        <button type="button" onClick={save} disabled={busy} className={`${adminButton('primary', 'mt-space-md h-10')}`}>
          {busy ? 'Đang lưu...' : 'Lưu'}
        </button>
        {msg && <p className="mt-space-sm text-ds-body-sm text-on-surface-variant">{msg}</p>}
      </div>
      {data && <div className={`${SOFT} p-space-md text-ds-body-sm text-on-surface-variant`}>Mentor ID: {data.mentorId}</div>}
    </div>
  );
};

export default MentorPricingPage;
