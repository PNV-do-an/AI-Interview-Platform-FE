import React, { useEffect, useState } from 'react';
import { useOrderController } from '../../controllers/useOrderController';
import { formatVnd, ServicePackage, ServicePackageRequest } from '../../models/Order.model';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Badge, EmptyState, ErrorBanner, LoadingState, PageHeader, buttonClass, inputClass, labelClass,
} from '../components/ui';

const emptyForm: ServicePackageRequest = {
  name: '',
  description: '',
  price: 0,
  durationDays: 30,
  jobPostLimit: 1,
  features: [],
};

// inputClass bỏ `h-9` thay `py-2` khi dùng cho textarea.
const textareaClass =
  'min-h-[90px] w-full resize-y rounded-md border border-[#e2e8f0] bg-card px-2.5 py-2 text-body-md text-ink ' +
  'transition-all placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

const PackageManagementPage: React.FC = () => {
  const {
    allPackages, loading, error, successMsg,
    fetchAllPackages, createPackage, updatePackage,
    togglePackageActive, deletePackage, clearMessages,
  } = useOrderController();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServicePackageRequest>(emptyForm);
  const [featuresText, setFeaturesText] = useState('');
  const [pendingDel, setPendingDel] = useState<ServicePackage | null>(null);

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

  const runDelete = async () => {
    if (!pendingDel) return;
    const id = pendingDel.id;
    setPendingDel(null);
    clearMessages();
    if (await deletePackage(id)) fetchAllPackages();
  };

  return (
    <div>
      <PageHeader title="Gói dịch vụ" />

      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-[#e2e8f0] bg-surface-low p-4">
        <h2 className="m-0 mb-3 text-headline-sm text-ink">
          {editingId ? `Sửa gói #${editingId}` : 'Tạo gói mới'}
        </h2>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass} htmlFor="pkg-name">Tên gói *</label>
            <input
              id="pkg-name"
              className={inputClass} required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Cơ bản"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pkg-desc">Mô tả</label>
            <input
              id="pkg-desc"
              className={inputClass} value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="pkg-price">Giá (VND) *</label>
              <input
                id="pkg-price"
                className={`${inputClass} tabular-nums`} type="number" min={0} required value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pkg-duration">Thời hạn (ngày) *</label>
              <input
                id="pkg-duration"
                className={`${inputClass} tabular-nums`} type="number" min={1} required value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pkg-limit">Số tin tối đa *</label>
              <input
                id="pkg-limit"
                className={`${inputClass} tabular-nums`} type="number" min={1} required value={form.jobPostLimit}
                onChange={(e) => setForm({ ...form, jobPostLimit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="pkg-features">Tính năng (mỗi dòng một mục)</label>
            <textarea
              id="pkg-features"
              className={textareaClass}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={'Đăng tối đa 3 tin\nCV không giới hạn'}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass('primary')}>
              <span className="material-symbols-outlined text-[18px]">{editingId ? 'save' : 'add'}</span>
              {editingId ? 'Lưu thay đổi' : 'Tạo gói'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={buttonClass('secondary')}>
                Huỷ
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && <LoadingState />}
      {!loading && allPackages.length === 0 && (
        <EmptyState icon="inventory_2" title="Chưa có gói dịch vụ nào." />
      )}
      <div className="flex flex-col gap-3">
        {allPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-card p-4 transition-colors hover:bg-surface-low"
          >
            <div className="min-w-0">
              <span className="text-headline-sm text-ink">{pkg.name}</span>
              <span className="text-body-sm tabular-nums text-ink-variant"> · #{pkg.id}</span>
              <div className="text-body-sm tabular-nums text-ink-variant">
                {formatVnd(pkg.price)} · {pkg.durationDays} ngày · tối đa {pkg.jobPostLimit} tin
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pkg.active
                ? <Badge tone="success">Đang bật</Badge>
                : <Badge tone="neutral">Đã tắt</Badge>}
              <button type="button" onClick={() => startEdit(pkg)} className={buttonClass('secondary')}>
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Sửa
              </button>
              <button type="button" onClick={() => handleToggle(pkg.id)} className={buttonClass('secondary')}>
                {pkg.active ? 'Tắt' : 'Bật'}
              </button>
              <button type="button" onClick={() => setPendingDel(pkg)} className={buttonClass('danger')}>
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDel !== null}
        title="Xoá gói này?"
        message={pendingDel ? `"${pendingDel.name}" sẽ bị gỡ khỏi hệ thống. Gói đã có đơn hàng thì không xoá được.` : ''}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        danger
        onConfirm={() => void runDelete()}
        onCancel={() => setPendingDel(null)}
      />
    </div>
  );
};

export default PackageManagementPage;
