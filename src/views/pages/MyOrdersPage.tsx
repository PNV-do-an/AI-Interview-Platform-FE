import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../models/Order.model';
import ConfirmDialog from '../components/ConfirmDialog';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';

const statusTone: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

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

  const paidTotal = orders
    .filter((order) => order.status === 'PAID')
    .reduce((sum, order) => sum + order.amount, 0);
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">receipt_long</span>
              Đơn hàng của tôi
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Lịch sử đơn hàng & thanh toán</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Theo dõi các đơn mua gói dịch vụ, trạng thái thanh toán và thao tác với đơn đang chờ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-slate-300">Đã thanh toán</p>
              <p className="m-0 text-lg font-bold">{formatVnd(paidTotal)}</p>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Mua thêm gói
            </Link>
          </div>
        </div>
      </section>

      {successMsg && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng đơn hàng', value: `${orders.length} đơn`, icon: 'receipt_long', tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Đang chờ thanh toán', value: `${pendingCount} đơn`, icon: 'schedule', tone: 'bg-amber-50 text-amber-600' },
          { label: 'Tổng đã thanh toán', value: formatVnd(paidTotal), icon: 'payments', tone: 'bg-emerald-50 text-emerald-600' },
        ].map((item) => (
          <div key={item.label} className={`${CARD} flex items-start gap-3 p-5`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="m-0 mt-1 truncate text-lg font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={`${CARD} flex items-center justify-center gap-3 p-10 text-sm text-slate-500`}>
          <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
          Đang tải đơn hàng...
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className={`${CARD} flex flex-col items-center justify-center gap-3 px-6 py-12 text-center`}>
          <span className="material-symbols-outlined text-[36px] text-slate-300">receipt_long</span>
          <p className="m-0 text-sm font-semibold text-slate-700">Chưa có đơn hàng nào</p>
          <p className="m-0 text-xs text-slate-500">Xem gói dịch vụ để chọn gói phù hợp và bắt đầu thanh toán.</p>
          <Link to="/packages" className={`${BTN_PRIMARY} mt-2`}>
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Xem gói dịch vụ
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Gói dịch vụ</th>
                  <th className="px-5 py-3 font-semibold">Mã đơn</th>
                  <th className="px-5 py-3 font-semibold">Số tiền</th>
                  <th className="px-5 py-3 font-semibold">Phương thức</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Thời gian</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900">{order.packageName}</td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{order.orderCode}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatVnd(order.amount)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      <div>Tạo lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                      {order.paidAt && <div className="mt-0.5">Đã thanh toán: {new Date(order.paidAt).toLocaleString('vi-VN')}</div>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {order.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => handlePay(order.id)} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
                            Thanh toán
                          </button>
                          <button onClick={() => setCancelId(order.id)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60">
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2">
        <Link to="/packages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 no-underline hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Xem gói dịch vụ
        </Link>
      </div>

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
