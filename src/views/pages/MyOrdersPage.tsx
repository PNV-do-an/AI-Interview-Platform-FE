import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../models/Order.model';
import ConfirmDialog from '../components/ConfirmDialog';
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

  const [cancelId, setCancelId] = useState<number | null>(null);

  const handlePay = async (id: number) => {
    clearMessages();
    const ok = await payOrder(id);
    if (ok) fetchMyOrders();
  };

  const runCancel = async () => {
    if (cancelId === null) return;
    const id = cancelId;
    setCancelId(null);
    clearMessages();
    const ok = await cancelOrder(id);
    if (ok) fetchMyOrders();
  };

  return (
    <div>
      <PageHeader title="Đơn hàng của tôi" />

      {loading && <LoadingState label="Đang xử lý..." />}
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
            Chưa có đơn hàng nào — <Link to="/packages" className="text-primary no-underline hover:underline">xem gói dịch vụ</Link>.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Gói dịch vụ</th>
                <th className={thClass}>Mã đơn</th>
                <th className={thClass}>Số tiền</th>
                <th className={thClass}>Phương thức thanh toán</th>
                <th className={thClass}>Trạng thái</th>
                <th className={thClass}>Thời gian</th>
                <th className={thClass}>Thao tác</th>
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
                    <div>Tạo lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                    {order.paidAt && <div>· Đã thanh toán: {new Date(order.paidAt).toLocaleString('vi-VN')}</div>}
                  </td>
                  <td className={tdClass}>
                    {order.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePay(order.id)} className={buttonClass('primary')}>
                          Thanh toán
                        </button>
                        <button onClick={() => setCancelId(order.id)} className={buttonClass('secondary')}>
                          Huỷ
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
          ← Xem gói dịch vụ
        </Link>
      </p>

      <ConfirmDialog
        open={cancelId !== null}
        title="Huỷ đơn hàng này?"
        message="Đơn sẽ bị đóng và không thể thanh toán nữa. Không thể hoàn tác."
        confirmLabel="Huỷ đơn"
        cancelLabel="Giữ đơn"
        danger
        onConfirm={() => void runCancel()}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
};

export default MyOrdersPage;
