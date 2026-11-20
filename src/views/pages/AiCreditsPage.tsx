import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { AiCreditBalance, AiCreditPackage } from '../../models/Payment.model';
import { CARD, SOFT, ICON } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock } from '../components/adminKit';

const AiCreditsPage: React.FC = () => {
  const [balance, setBalance] = useState<AiCreditBalance | null>(null);
  const [packages, setPackages] = useState<AiCreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [b, p] = await Promise.all([PaymentService.getAiCreditBalance(), PaymentService.getAiCreditPackages()]);
      setBalance(b.data?.data ?? null);
      setPackages(p.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được dữ liệu AI credits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const buy = async (pkg: AiCreditPackage) => {
    setBusyId(pkg.id);
    setMsg('');
    try {
      await PaymentService.purchaseAiCreditPackage(pkg.id);
      setMsg(`Mua gói "${pkg.name}" thành công.`);
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Mua gói thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải AI credits..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">AI Credits</h1>
      <div className={`${CARD} p-space-lg`}>
        <div className="flex flex-wrap items-center gap-space-lg">
          <div>
            <span className="text-ds-label-sm text-on-surface-variant">Số dư</span>
            <div className="text-ds-headline-md font-bold text-on-surface">{balance?.balance ?? 0} credits</div>
          </div>
          <div>
            <span className="text-ds-label-sm text-on-surface-variant">Đã dùng hôm nay</span>
            <div className="text-ds-headline-md font-bold text-on-surface">{balance?.todayUsage ?? 0}</div>
          </div>
        </div>
      </div>

      {msg && <p className="text-ds-body-sm text-on-surface-variant">{msg}</p>}

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`${CARD} flex flex-col gap-space-sm p-space-lg`}>
            <h3 className="text-ds-headline-sm font-bold text-on-surface">{pkg.name}</h3>
            {pkg.description && <p className="text-ds-body-sm text-on-surface-variant">{pkg.description}</p>}
            <div className="text-ds-headline-md font-bold text-primary">{pkg.price.toLocaleString('vi-VN')} ₫</div>
            <div className="text-ds-body-sm text-on-surface-variant">{pkg.credits} credits • hiệu lực {pkg.validityDays} ngày</div>
            {pkg.discountPercent > 0 && <span className="text-ds-label-sm text-secondary-teal">Giảm {pkg.discountPercent}%</span>}
            <button
              type="button"
              disabled={busyId === pkg.id || !pkg.active}
              onClick={() => buy(pkg)}
              className={adminButton('primary', 'mt-auto h-10')}
            >
              {busyId === pkg.id ? 'Đang mua...' : pkg.active ? 'Mua gói' : 'Không khả dụng'}
            </button>
          </div>
        ))}
      </div>
      {packages.length === 0 && <p className="text-ds-body-sm text-on-surface-variant">Chưa có gói credits nào.</p>}
    </div>
  );
};

export default AiCreditsPage;
