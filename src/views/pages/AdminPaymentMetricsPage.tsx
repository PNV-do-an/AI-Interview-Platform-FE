import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/payment.service';
import { CARD } from '../components/candidateKit';
import { ErrorBlock, LoadingBlock } from '../components/adminKit';

const AdminPaymentMetricsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getPaymentMetrics();
      setData(res.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <div className={`${CARD} p-space-lg`}><LoadingBlock label="Đang tải metrics..." /></div>;
  if (error) return <div className={`${CARD} p-space-lg`}><ErrorBlock message={error} onRetry={load} /></div>;

  return (
    <div className="flex flex-col gap-space-lg">
      <h1 className="text-ds-headline-lg font-bold text-on-surface">Payment Metrics</h1>
      <div className={`${CARD} p-space-lg`}>
        <pre className="overflow-auto text-ds-body-sm">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AdminPaymentMetricsPage;
