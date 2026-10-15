import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ServicePackage, ServicePackageRequest } from '../../models/Order.model';

const emptyForm: ServicePackageRequest = {
  name: '',
  description: '',
  price: 0,
  durationDays: 30,
  jobPostLimit: 1,
  features: [],
};

const PackageManagementPage: React.FC = () => {
  const {
    allPackages, error, successMsg,
    fetchAllPackages, createPackage, updatePackage,
    togglePackageActive, deletePackage, clearMessages,
  } = useOrderController();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServicePackageRequest>(emptyForm);
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => { fetchAllPackages(); }, [fetchAllPackages]);

  const startEdit = (pkg: ServicePackage) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      durationDays: pkg.durationDays,
      jobPostLimit: pkg.jobPostLimit,
      features: pkg.features,
    });
    setFeaturesText(pkg.features.join('\n'));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFeaturesText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const body: ServicePackageRequest = {
      ...form,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      jobPostLimit: Number(form.jobPostLimit),
      features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
    };
    const ok = editingId
      ? await updatePackage(editingId, body)
      : await createPackage(body);
    if (ok) {
      resetForm();
      fetchAllPackages();
    }
  };

  const handleToggle = async (id: number) => {
    clearMessages();
    if (await togglePackageActive(id)) fetchAllPackages();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa gói này? Gói đã có đơn hàng sẽ không xóa được.')) return;
    clearMessages();
    if (await deletePackage(id)) fetchAllPackages();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #D5DEEF',
    borderRadius: 4, boxSizing: 'border-box', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600,
  };

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Quản lý gói dịch vụ</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <div style={{
        background: '#F0F3FA', borderRadius: 8, padding: 20, marginBottom: 24,
      }}>
        <h3 style={{ color: '#395886', marginTop: 0 }}>
          {editingId ? `Chỉnh sửa gói #${editingId}` : 'Tạo gói mới'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tên gói *</label>
            <input
              style={inputStyle} required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Cơ bản"
            />
          </div>
          <div>
            <label style={labelStyle}>Mô tả</label>
            <input
              style={inputStyle} value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Giá (VND) *</label>
              <input
                style={inputStyle} type="number" min={0} required value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Thời hạn (ngày) *</label>
              <input
                style={inputStyle} type="number" min={1} required value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Giới hạn tin đăng *</label>
              <input
                style={inputStyle} type="number" min={1} required value={form.jobPostLimit}
                onChange={(e) => setForm({ ...form, jobPostLimit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Đặc quyền (mỗi dòng một ý)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90 }}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={'Đăng tối đa 3 tin tuyển dụng\nNhận hồ sơ không giới hạn'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              style={{
                padding: '12px 24px', borderRadius: 8, border: 'none',
                background: '#628ECB', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {editingId ? 'Lưu thay đổi' : 'Tạo gói'}
            </button>
            {editingId && (
              <button
                type="button" onClick={resetForm}
                style={{
                  padding: '12px 20px', borderRadius: 8, border: '1px solid #D5DEEF',
                  background: '#fff', cursor: 'pointer',
                }}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </div>

      {allPackages.map((pkg) => (
        <div
          key={pkg.id}
          style={{
            border: '1px solid #D5DEEF', borderRadius: 8, padding: '16px 20px',
            marginBottom: 12, background: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 8,
          }}
        >
          <div>
            <strong style={{ color: '#395886' }}>{pkg.name}</strong>
            <span style={{ color: '#888', fontSize: 13 }}> · #{pkg.id}</span>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {formatVnd(pkg.price)} · {pkg.durationDays} ngày · tối đa {pkg.jobPostLimit} tin
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                background: pkg.active ? '#F0F3FA' : '#f3f4f6',
                color: pkg.active ? '#16a34a' : '#9ca3af',
              }}
            >
              {pkg.active ? 'Đang bán' : 'Đã tắt'}
            </span>
            <button onClick={() => startEdit(pkg)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #D5DEEF', background: '#fff', cursor: 'pointer' }}>
              Sửa
            </button>
            <button onClick={() => handleToggle(pkg.id)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #D5DEEF', background: '#fff', cursor: 'pointer' }}>
              {pkg.active ? 'Tắt' : 'Bật'}
            </button>
            <button onClick={() => handleDelete(pkg.id)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #D5DEEF', background: '#fff', color: '#B33', cursor: 'pointer' }}>
              Xóa
            </button>
          </div>
        </div>
      ))}

      <p style={{ marginTop: 24 }}><Link to="/dashboard" style={{ color: '#628ECB' }}>← Về Dashboard</Link></p>
    </div>
  );
};

export default PackageManagementPage;
