import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../models/Order.model';
import {
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatusBadge,
  buttonClass,
  tableClass,
  tdClass,
  thClass,
} from '../components/ui';

const MyOrdersPage: React.FC = () => {
  const {
    orders, loading, error, successMsg,
    fetchMyOrders, payOrder, cancelOrder, clearMessages,
  } = useOrderController();

  useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

  const handlePay = async (id: number) => {
    clearMessages();
    const ok = await payOrder(id);
    if (ok) fetchMyOrders();
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this order?')) return;
    clearMessages();
    const ok = await cancelOrder(id);
    if (ok) fetchMyOrders();
  };

  return (
    <div>
      <PageHeader title="My Orders" />

      {loading && <LoadingState label="Processing..." />}
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] bg-card px-6 py-12 text-center">
          <span className="material-symbols-outlined text-[28px] text-ink-variant">receipt_long</span>
          <p className="m-0 text-body-md text-ink-variant">
            No orders yet — <Link to="/packages" className="text-primary no-underline hover:underline">view packages</Link>.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Package</th>
                <th className={thClass}>Order Code</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Payment Method</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Date</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-low">
                  <td className={tdClass}>
                    <strong className="text-headline-sm text-ink">{order.packageName}</strong>
                  </td>
                  <td className={`${tdClass} text-body-sm text-ink-variant`}>{order.orderCode}</td>
                  <td className={`${tdClass} whitespace-nowrap text-headline-sm text-primary`}>{formatVnd(order.amount)}</td>
                  <td className={`${tdClass} whitespace-nowrap text-body-sm text-ink-variant`}>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
                  </td>
                  <td className={`${tdClass} text-body-sm text-ink-variant`}>
                    <div>Created: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                    {order.paidAt && <div>· Paid: {new Date(order.paidAt).toLocaleString('vi-VN')}</div>}
                  </td>
                  <td className={tdClass}>
                    {order.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePay(order.id)} className={buttonClass('primary')}>
                          Pay
                        </button>
                        <button onClick={() => handleCancel(order.id)} className={buttonClass('secondary')}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="pt-6">
        <Link to="/packages" className="text-label-md text-ink-variant no-underline transition-colors hover:text-primary">
          ← View Packages
        </Link>
      </p>
    </div>
  );
};

export default MyOrdersPage;
