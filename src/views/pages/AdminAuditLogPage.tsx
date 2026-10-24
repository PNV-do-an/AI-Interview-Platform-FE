/**
 * Màn "Nhật ký kiểm toán" — DATA page, nguồn GET /admin/audit-logs (ADMIN only).
 * Action label + icon dùng bảng chung adminKit (AUDIT_ACTION_VN / AUDIT_ACTION_ICON).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { AUDIT_ACTIONS, AuditLog, PagedResponse } from '../../models/User.model';
import {
  AdminCard, AdminPageHeader, AUDIT_ACTION_ICON, AUDIT_ACTION_VN, EmptyBlock, ErrorBlock, ICON,
  LoadingBlock, Pagination, Pill, SearchField, adminButton, adminSelectClass, adminTdClass,
  adminThClass, adminTableClass, errorText, fmtServer, timeAgo,
} from '../components/adminKit';

const ACTION_TONE: Record<string, 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  DELETE_USER: 'danger', LOCK_USER: 'danger', REJECT_JOB: 'danger', RESET_PASSWORD: 'warning',
  CHANGE_ROLE: 'warning', APPROVE_JOB: 'success', RESTORE_USER: 'success', ENABLE_USER: 'success',
  UNLOCK_USER: 'success', UPDATE_SETTINGS: 'primary', INVITE_USER: 'primary',
};

const PAGE_SIZE = 20;

const AuditActionIcon: React.FC<{ action: string }> = ({ action }) => (
  <span className={`${ICON} text-[18px]`}>{AUDIT_ACTION_ICON[action] ?? 'history'}</span>
);

const AdminAuditLogPage: React.FC = () => {
  const [data, setData] = useState<PagedResponse<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    AdminService.getAuditLogs({
      page, size: PAGE_SIZE,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then((res) => setData(res.data.data!))
      .catch((err) => setError(errorText(err, 'Không tải được nhật ký kiểm toán.')))
      .finally(() => setLoading(false));
  }, [page, action, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, tick]);

  const rows = useMemo(() => {
    const list = data?.content ?? [];
    const q = text.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.adminEmail, r.targetEmail, r.targetFullName, r.detail, r.reason, AUDIT_ACTION_VN[r.action] ?? r.action]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, text]);

  const failedCount = (data?.content ?? []).filter((r) => !r.succeeded).length;

  return (
    <div className="px-space-xl py-space-xl bg-background min-h-screen">
      <AdminPageHeader
        crumbs={[{ label: 'Hệ thống Quản trị', icon: 'shield' }, { label: 'Nhật ký kiểm toán' }]}
        title="Nhật ký kiểm toán hệ thống"
        subtitle="Toàn bộ hành động quản trị trên tài khoản, tin tuyển dụng và cấu hình — kèm kết quả và lý do khi bị nghiệp vụ chặn."
        actions={(
          <button type="button" className={adminButton('ghost')} onClick={() => setTick((n) => n + 1)}>
            <span className={`${ICON} text-[18px]`}>refresh</span>Làm mới dữ liệu
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Tổng sự kiện</span>
          <span className="mt-3 text-ds-headline-xl font-bold text-on-surface">{(data?.totalElements ?? 0).toLocaleString('vi-VN')}</span>
          <span className="mt-1 text-ds-body-sm text-on-surface-variant">Bản ghi trong bộ lọc hiện tại</span>
        </div>
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Trang đang xem</span>
          <span className="mt-3 text-ds-headline-xl font-bold text-on-surface">{data ? page + 1 : '—'}</span>
          <span className="mt-1 text-ds-body-sm text-on-surface-variant">/ {data?.totalPages ?? 0} trang</span>
        </div>
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Thất bại trên trang</span>
          <span className="mt-3 text-ds-headline-xl font-bold text-error">{failedCount}</span>
          <span className="mt-1 text-ds-body-sm text-on-surface-variant">Hành động bị rule nghiệp vụ từ chối</span>
        </div>
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Loại hành động</span>
          <span className="mt-3 text-ds-headline-xl font-bold text-on-surface">{AUDIT_ACTIONS.length}</span>
          <span className="mt-1 text-ds-body-sm text-on-surface-variant">Loại hành động được ghi nhận</span>
        </div>
      </div>

      {error && <div className="mb-space-md"><ErrorBlock message={error} onRetry={() => setTick((n) => n + 1)} /></div>}

      <AdminCard bodyClass="p-space-md">
        <div className="flex flex-col lg:flex-row lg:items-end gap-space-sm mb-space-md">
          <SearchField
            className="lg:w-80"
            value={text}
            onChange={setText}
            placeholder="Lọc nhanh theo email, đối tượng, chi tiết..."
          />
          <div className="relative lg:w-64">
            <select value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} className={adminSelectClass} aria-label="Lọc theo hành động">
              <option value="">Tất cả hành động</option>
              {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{AUDIT_ACTION_VN[a]}</option>)}
            </select>
            <span className={`${ICON} text-[18px] text-outline-strong absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>expand_more</span>
          </div>
          <label className="flex flex-col gap-1 lg:w-44">
            <span className="text-ds-label-md text-on-surface-variant font-semibold">Từ ngày</span>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="h-10 px-3 rounded-lg bg-surface-container-low text-ds-body-sm border-0 outline-none" />
          </label>
          <label className="flex flex-col gap-1 lg:w-44">
            <span className="text-ds-label-md text-on-surface-variant font-semibold">Đến ngày</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="h-10 px-3 rounded-lg bg-surface-container-low text-ds-body-sm border-0 outline-none" />
          </label>
          {(action || from || to || text) && (
            <button
              type="button"
              className={adminButton('soft', 'h-10 self-end')}
              onClick={() => { setAction(''); setFrom(''); setTo(''); setText(''); setPage(0); }}
            >
              <span className={`${ICON} text-[18px]`}>filter_alt</span>Xóa bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <LoadingBlock label="Đang tải nhật ký kiểm toán..." />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon="receipt_long"
            title="Không có sự kiện nào khớp bộ lọc"
            description="Thử bỏ bớt bộ lọc hành động hoặc mở rộng khoảng ngày."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className={adminTableClass}>
              <thead>
                <tr>
                  <th className={adminThClass}>Thời gian</th>
                  <th className={adminThClass}>Hành động</th>
                  <th className={adminThClass}>Quản trị viên</th>
                  <th className={adminThClass}>Đối tượng</th>
                  <th className={adminThClass}>Kết quả</th>
                  <th className={adminThClass}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const targetHref = row.targetUserId ? `/admin/users/${row.targetUserId}` : null;
                  const actionCell = (
                    <>
                      <AuditActionIcon action={row.action} />
                      <Pill tone={ACTION_TONE[row.action] ?? 'neutral'}>
                        {AUDIT_ACTION_VN[row.action] ?? row.action}
                      </Pill>
                    </>
                  );
                  return (
                  <tr key={row.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className={adminTdClass}>
                      <span className="block font-semibold">{fmtServer(row.createdAt)}</span>
                      <span className="block text-ds-body-sm text-on-surface-variant">{timeAgo(row.createdAt)}</span>
                    </td>
                    <td className={adminTdClass}>
                      {targetHref ? (
                        <Link
                          to={targetHref}
                          className="inline-flex items-center gap-1.5 no-underline text-inherit"
                          title={`Xem hồ sơ người dùng ID ${row.targetUserId}`}
                        >
                          {actionCell}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">{actionCell}</span>
                      )}
                    </td>
                    <td className={adminTdClass}>
                      <span className="block font-semibold">{row.adminEmail}</span>
                      <span className="block text-ds-body-sm text-on-surface-variant">ID {row.adminId}</span>
                    </td>
                    <td className={adminTdClass}>
                      {row.targetUserId ? (
                        <>
                          <span className="block font-semibold">{row.targetFullName ?? '—'}</span>
                          <span className="block text-ds-body-sm text-on-surface-variant">{row.targetEmail ?? `ID ${row.targetUserId}`}</span>
                        </>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className={adminTdClass}>
                      <Pill tone={row.succeeded ? 'success' : 'danger'} icon={row.succeeded ? 'check_circle' : 'block'}>
                        {row.succeeded ? 'Thành công' : 'Bị chặn'}
                      </Pill>
                      {!row.succeeded && row.reason && (
                        <span className="block mt-1 text-ds-body-sm text-error">{row.reason}</span>
                      )}
                    </td>
                    <td className={`${adminTdClass} max-w-sm`}>
                      <span className="block text-ds-body-sm text-on-surface-variant break-words">{row.detail ?? '—'}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalElements > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.totalElements} onPage={setPage} />
        )}
      </AdminCard>
    </div>
  );
};

export default AdminAuditLogPage;
