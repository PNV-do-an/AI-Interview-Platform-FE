import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, PAYMENT_METHOD_LABELS, ServicePackage } from '../../models/Order.model';

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
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Gói dịch vụ</h1>
      <p style={{ color: '#628ECB' }}>
        Chọn gói phù hợp để đăng tin tuyển dụng và sử dụng các công cụ AI.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      {loading && <p>Đang tải...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 20 }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              border: '1px solid #D5DEEF', borderRadius: 12, padding: 24,
              background: '#fff', boxShadow: '0 2px 12px rgba(57,88,134,0.08)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <h2 style={{ color: '#395886', margin: '0 0 4px' }}>{pkg.name}</h2>
            {pkg.description && (
              <p style={{ color: '#6b7280', fontSize: 14, minHeight: 40 }}>{pkg.description}</p>
            )}
            <p style={{ fontSize: 28, fontWeight: 700, color: '#628ECB', margin: '8px 0' }}>
              {formatVnd(pkg.price)}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}>
                {' '}/ {pkg.durationDays} ngày
              </span>
            </p>
            <ul style={{ paddingLeft: 18, color: '#395886', flex: 1 }}>
              <li>Đăng tối đa {pkg.jobPostLimit} tin tuyển dụng</li>
              {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button
              onClick={() => { setSelected(pkg); clearMessages(); }}
              style={{
                marginTop: 16, padding: '12px 0', borderRadius: 8, border: 'none',
                background: '#628ECB', color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Mua gói này
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ ...styles.modalOverlay }}>
          <div style={styles.modal}>
            <h3 style={{ color: '#395886', marginTop: 0 }}>Thanh toán: {selected.name}</h3>
            <p>Số tiền: <strong>{formatVnd(selected.price)}</strong></p>
            <label style={{ display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600 }}>
              Phương thức thanh toán
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D5DEEF', borderRadius: 4, marginBottom: 16 }}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleBuy}
                disabled={paying}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 8, border: 'none',
                  background: paying ? '#B1C9EF' : '#395886', color: '#fff',
                  fontSize: 15, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer',
                }}
              >
                {paying ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
              <button
                onClick={() => setSelected(null)}
                disabled={paying}
                style={{
                  padding: '12px 20px', borderRadius: 8, border: '1px solid #D5DEEF',
                  background: '#fff', cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 0 }}>
              Thanh toán được giả lập cho môi trường demo — không phát sinh giao dịch thật.
            </p>
          </div>
        </div>
      )}

      <p style={{ marginTop: 24 }}><Link to="/dashboard" style={{ color: '#628ECB' }}>← Về Dashboard</Link></p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(57,88,134,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: 28, width: 380,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
};

export default PackagesPage;
