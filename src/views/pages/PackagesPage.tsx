import React, { useEffect, useState } from 'react';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, PAYMENT_METHOD_LABELS, ServicePackage } from '../../models/Order.model';
import {
  ErrorBanner,
  LoadingState,
  PageHeader,
  buttonClass,
  labelClass,
} from '../components/ui';

const selectClass =
  'h-9 w-full box-border rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink transition-all focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const PackagesPage: React.FC = () => {
  const {
    packages, loading, error, successMsg,
    fetchPackages, createOrder, payOrder, clearMessages,
  } = useOrderController();

  const [selected, setSelected] = useState<ServicePackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('MOMO');
  const [paying, setPaying] = useState(false);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const handleBuy = async () => {
    if (!selected) return;
    setPaying(true);
    clearMessages();
    const order = await createOrder({ packageId: selected.id, paymentMethod });
    if (order) {
      const ok = await payOrder(order.id);
      if (ok) {
        setSelected(null);
      }
    }
    setPaying(false);
  };

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Select a package to publish job postings and use the AI tools."
      />

      {loading && <LoadingState />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-card">
            <h2 className="m-0 text-headline-md text-ink">{pkg.name}</h2>
            {pkg.description && (
              <p className="m-0 mt-1 min-h-[40px] text-body-sm text-ink-variant">{pkg.description}</p>
            )}
            <p className="m-0 mt-2 flex flex-wrap items-baseline gap-1 text-metric-stat text-primary">
              {formatVnd(pkg.price)}
              <span className="text-body-sm font-normal text-ink-variant">
                {' '}/ {pkg.durationDays} days
              </span>
            </p>
            <ul className="m-0 mt-3 flex-1 list-disc pl-5 text-body-md text-ink">
              <li>Up to {pkg.jobPostLimit} job postings</li>
              {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button
              onClick={() => { setSelected(pkg); clearMessages(); }}
              className={buttonClass('primary', 'w-full mt-4')}
            >
              Buy Package
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-[380px] max-w-full flex-col rounded-lg border border-[#e2e8f0] bg-card p-6 shadow-card">
            <h3 className="m-0 text-headline-md text-ink">Payment: {selected.name}</h3>
            <p className="m-0 mt-2 text-body-md text-ink">
              Amount: <strong className="text-metric-stat text-primary">{formatVnd(selected.price)}</strong>
            </p>
            <label className={`${labelClass} mt-3`}>Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button onClick={handleBuy} disabled={paying} className={buttonClass('primary', 'flex-1')}>
                {paying ? 'Processing...' : 'Confirm Payment'}
              </button>
              <button onClick={() => setSelected(null)} disabled={paying} className={buttonClass('secondary')}>
                Close
              </button>
            </div>
            <p className="m-0 mt-3 flex items-start gap-1 text-body-sm text-ink-variant">
              <span className="material-symbols-outlined shrink-0 text-[18px] text-info-text">info</span>
              Payments are simulated in the demo environment — no real transactions are made.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
