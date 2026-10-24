import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { CategoryGroupsResponse, DashboardResponse, JobStatusCode, PermissionMatrix } from '../../models/AdminConsole.model';
import { ROLE_LABELS, Role } from '../../models/User.model';
import {
  AdminCard, AdminPageHeader, EmptyBlock, ErrorBlock, ICON, LoadingBlock, Pill,
  adminButton, adminTdClass, adminThClass, adminTableClass, errorText,
} from '../components/adminKit';

/**
 * Danh mục & Ngành nghề — màn "Danh mục & Ngành nghề" trong sidebar mockup.
 *   - Khối "Danh mục module hệ thống" = số THẬT từ GET /admin/permissions/matrix.
 *   - Khối "Phân bổ theo nhóm dữ liệu" = số THẬT từ GET /admin/dashboard.
 *   - Khối "Giá trị phân loại đang dùng" = số THẬT từ GET /admin/categories (read-only): 4 nhóm
 *     department / kinh nghiệm / kiểu làm việc / hình thức, employer tự nhập nên không có CRUD.
 */

const STATUS_LABEL: Record<JobStatusCode, string> = {
  DRAFT: 'Bản nháp', PENDING_APPROVAL: 'Chờ duyệt', OPEN: 'Đang mở', CLOSED: 'Đã đóng',
};

const AdminCategoryPage: React.FC = () => {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [categories, setCategories] = useState<CategoryGroupsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    Promise.all([AdminService.getPermissionMatrix(), AdminService.getDashboard(30), AdminService.getCategories()])
      .then(([m, d, c]) => {
        setMatrix(m.data.data!);
        setDash(d.data.data!);
        setCategories(c.data.data!);
      })
      .catch((err) => setError(errorText(err, 'Không tải được danh mục hệ thống.')))
      .finally(() => setLoading(false));
  }, []);

  const moduleRows = useMemo(
    () => (matrix?.modules ?? []).map((mod) => ({
      ...mod,
      grantedRoles: (matrix?.roles ?? [])
        .filter((r) => mod.actions.some((a) => a.granted[r.role]))
        .map((r) => r.label),
      actionCount: mod.actions.filter((a) => Object.values(a.granted).some(Boolean)).length,
    })),
    [matrix],
  );

  const categoryGroups = useMemo(
    () => (categories?.groups ?? []).filter((g) => g.values.length > 0),
    [categories],
  );

  if (loading) {
    return (
      <div className="px-space-xl py-space-xl"><LoadingBlock label="Đang tải danh mục hệ thống..." /></div>
    );
  }

  return (
    <div className="px-space-xl py-space-xl bg-background min-h-screen">
      <AdminPageHeader
        crumbs={[{ label: 'Hệ thống Quản trị', icon: 'shield' }, { label: 'Danh mục & Ngành nghề' }]}
        title="Danh mục & Ngành nghề"
        subtitle="Danh mục module hệ thống, phân bổ dữ liệu theo nhóm, và các giá trị phân loại nhà tuyển dụng đang dùng thật trên tin tuyển dụng (bốn khóa là chuỗi tự do, chưa có bảng danh mục tập trung)."
      />

      {error && <div className="mb-space-lg"><ErrorBlock message={error} /></div>}

      {dash && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
          {(['ROLE_USER', 'ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] as Role[]).map((role) => (
            <div key={role} className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
              <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                {ROLE_LABELS[role]}
              </span>
              <div className="mt-3 text-ds-headline-xl font-bold text-on-surface">
                {(dash.users.byRole[role] ?? 0).toLocaleString('vi-VN')}
              </div>
              <span className="text-ds-body-sm text-on-surface-variant">tài khoản đang có trên hệ thống</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg items-start">
        <AdminCard
          className="xl:col-span-2"
          title="Danh mục module hệ thống"
          description={`${moduleRows.length} module trong ma trận quyền`}
          icon="category"
          bodyClass="pt-space-md"
        >
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className={adminTableClass}>
              <thead>
                <tr>
                  <th className={adminThClass}>Module</th>
                  <th className={adminThClass}>Hành động có cấp quyền</th>
                  <th className={adminThClass}>Nhóm được truy cập</th>
                </tr>
              </thead>
              <tbody>
                {moduleRows.map((row) => (
                  <tr key={row.key} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className={adminTdClass}>
                      <span className="block font-semibold text-on-surface">{row.label}</span>
                      <span className="block text-ds-body-sm text-on-surface-variant font-mono">{row.key}</span>
                    </td>
                    <td className={adminTdClass}>
                      <span className="inline-flex flex-wrap gap-1">
                        {row.actions.filter((a) => Object.values(a.granted).some(Boolean)).map((a) => (
                          <Pill key={a.action} tone="neutral">{a.label}</Pill>
                        ))}
                        {row.actionCount === 0 && <span className="text-ds-body-sm text-on-surface-variant">Chỉ quản trị</span>}
                      </span>
                    </td>
                    <td className={adminTdClass}>
                      {row.adminOnly ? (
                        <Pill tone="danger" icon="lock">Chỉ Quản trị viên</Pill>
                      ) : (
                        <span className="text-ds-body-sm text-on-surface">{row.grantedRoles.join(' · ') || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <div className="flex flex-col gap-space-lg">
          {dash && (
            <AdminCard title="Phân bổ tin tuyển dụng" description="Theo trạng thái kiểm duyệt" icon="work">
              <ul className="flex flex-col gap-2">
                {(Object.keys(STATUS_LABEL) as JobStatusCode[]).map((status) => {
                  const count = dash.jobs.byStatus[status] ?? 0;
                  const pct = dash.jobs.total ? Math.round((count / dash.jobs.total) * 100) : 0;
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between text-ds-body-sm">
                        <span className="text-on-surface">{STATUS_LABEL[status]}</span>
                        <span className="text-on-surface-variant">{count} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link to="/admin/job-approvals" className={`${adminButton('soft', 'mt-space-md w-full justify-center no-underline')}`}>
                <span className={`${ICON} text-[18px]`}>fact_check</span>Mở hàng chờ kiểm duyệt
              </Link>
            </AdminCard>
          )}

          <AdminCard
            title="Giá trị phân loại đang dùng"
            description="Bốn khóa phân loại do nhà tuyển dụng tự nhập trên tin đang hoạt động, chưa có quản lý danh mục tập trung"
            icon="interests"
          >
            {categoryGroups.length === 0 ? (
              <EmptyBlock
                icon="label_off"
                title="Chưa có giá trị nào"
                description="Nhà tuyển dụng chưa nhập giá trị cho bốn khóa phân loại, hoặc chưa có tin tuyển dụng đang hoạt động."
              />
            ) : (
              <div className="flex flex-col gap-space-lg">
                {categoryGroups.map((group) => {
                  const max = group.values.reduce((m, v) => Math.max(m, v.jobCount), 0);
                  return (
                    <div key={group.key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                          {group.label}
                        </span>
                        <span className="text-ds-body-sm text-on-surface-variant">{group.values.length} giá trị</span>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {group.values.slice(0, 6).map((v) => {
                          const pct = max ? Math.round((v.jobCount / max) * 100) : 0;
                          return (
                            <li key={v.value}>
                              <div className="flex items-center justify-between text-ds-body-sm">
                                <span className="text-on-surface truncate" title={v.value}>{v.value}</span>
                                <span className="text-on-surface-variant ml-2 shrink-0">{v.jobCount} tin</span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                                <div className="h-full rounded-full bg-secondary-teal" style={{ width: `${pct}%` }} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {group.values.length > 6 && (
                        <span className="block mt-2 text-ds-body-sm text-on-surface-variant">
                          +{group.values.length - 6} giá trị ít dùng hơn
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryPage;
