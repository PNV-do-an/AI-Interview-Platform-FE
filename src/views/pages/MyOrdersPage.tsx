import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ORDER_STATUS_LABELS, Order, PAYMENT_METHOD_LABELS } from '../../models/Order.model';

const statusColor = (status: Order['status']): string => {
  if (status === 'PAID') return '#16a34a';
  if (status === 'CANCELLED') return '#9ca3af';
  return '#d97706';
};

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
    if (!window.confirm('Hủy đơn hàng này?')) return;
    clearMessages();
    const ok = await cancelOrder(id);
    if (ok) fetchMyOrders();
  };

  return (
    <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Đơn hàng của tôi</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      {loading && <p>Đang xử lý...</p>}

      {orders.length === 0 && !loading && (
        <p style={{ color: '#6b7280' }}>
          Bạn chưa có đơn hàng nào — <Link to="/packages" style={{ color: '#628ECB' }}>xem gói dịch vụ</Link>.
        </p>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: '1px solid #D5DEEF', borderRadius: 8, padding: '16px 20px',
            marginBottom: 12, background: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong style={{ color: '#395886' }}>{order.packageName}</strong>
              <span style={{ color: '#888', fontSize: 13 }}> · {order.orderCode}</span>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {formatVnd(order.amount)} · {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                Tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
                {order.paidAt && ` · Thanh toán: ${new Date(order.paidAt).toLocaleString('vi-VN')}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  background: '#F0F3FA', color: statusColor(order.status),
                }}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              {order.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handlePay(order.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 6, border: 'none',
                      background: '#628ECB', color: '#fff', cursor: 'pointer',
                    }}
                  >
                    Thanh toán
                  </button>
                  <button
                    onClick={() => handleCancel(order.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 6, border: '1px solid #D5DEEF',
                      background: '#fff', cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      <p style={{ marginTop: 24 }}>
        <Link to="/packages" style={{ color: '#628ECB', marginRight: 16 }}>← Xem gói dịch vụ</Link>
        <Link to="/dashboard" style={{ color: '#628ECB' }}>← Về Dashboard</Link>
      </p>
    </div>
  );
};

export default MyOrdersPage;
