import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { Wallet } from '../../models/Payment.model';
import { CARD, SOFT, ICON } from '../components/candidateKit';
import { adminButton, ErrorBlock, LoadingBlock } from '../components/adminKit';

const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getWallet();
      setWallet(res.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được ví.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const topup = async () => {
    const v = Number(amount);
    if (!v || v <= 0) { setMsg('Số tiền phải lớn hơn 0.'); return; }
    setBusy(true);
    setMsg('');
    try {
      const res = await PaymentService.topup({ amount: v, idempotencyKey: `topup-${Date.now()}` });
      setWallet(res.data?.data ?? wallet);
      setMsg('Nạp tiền thành công.');
      setAmount('');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Nạp tiền thất bại.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải ví..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">Ví của tôi</h1>
      <div className={`grid grid-cols-1 gap-space-md md:grid-cols-3 ${CARD} p-space-lg`}>
        <div className={`${SOFT} p-space-md`}>
          <span className="text-ds-label-sm text-on-surface-variant">Số dư khả dụng</span>
          <div className="text-ds-headline-md font-bold text-on-surface">{(wallet?.availableBalance ?? 0).toLocaleString('vi-VN')} ₫</div>
        </div>
        <div className={`${SOFT} p-space-md`}>
          <span className="text-ds-label-sm text-on-surface-variant">Đang chờ</span>
          <div className="text-ds-headline-md font-bold text-on-surface">{(wallet?.pendingBalance ?? 0).toLocaleString('vi-VN')} ₫</div>
        </div>
        <div className={`${SOFT} p-space-md`}>
          <span className="text-ds-label-sm text-on-surface-variant">Đang giữ (escrow)</span>
          <div className="text-ds-headline-md font-bold text-on-surface">{(wallet?.escrowBalance ?? 0).toLocaleString('vi-VN')} ₫</div>
        </div>
      </div>

      <div className={`${CARD} p-space-lg`}>
        <h2 className="text-ds-headline-sm font-bold text-on-surface">Nạp tiền</h2>
        <div className="mt-space-md flex flex-col gap-space-sm sm:flex-row">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Số tiền (VND)"
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-space-md py-2 text-ds-body-md"
          />
          <button type="button" onClick={topup} disabled={busy} className={adminButton('primary', 'h-10')}>
            {busy ? 'Đang xử lý...' : 'Nạp tiền'}
          </button>
        </div>
        {msg && <p className="mt-space-sm text-ds-body-sm text-on-surface-variant">{msg}</p>}
      </div>
    </div>
  );
};

export default WalletPage;
