/**
 * STATIC mockup — screen_22 "Phân quyền hệ thống" (Role permission management).
 * BE chưa có endpoint role-permission (matrix đang đọc từ @PreAuthorize), nên trang này
 * chạy hoàn toàn bằng dữ liệu demo: không gọi API, không link sidebar.
 * Data demo giữ nguyên văn tiếng Việt theo mockup; chrome (breadcrumb, nhãn chung) tiếng Anh.
 * Màu mockup không có token dự án (giữ dạng hex): #e2e8f0 hairline, #004598 tertiary (icon Edit),
 * #005cc6 tertiary-container (icon nhóm pipeline/admin), #4fdbc8 secondary-fixed-dim (chấm "có thay đổi"),
 * #10b981 emerald-500 (nhịp pulse thanh save).
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, buttonClass } from '../components/ui';

const MONO = 'font-mono text-label-sm';

type PermKey = 'view' | 'create' | 'edit' | 'delete' | 'approve';

const ACTIONS: { key: PermKey; label: string; icon: string; iconClass: string }[] = [
  { key: 'view', label: 'View', icon: 'visibility', iconClass: 'text-primary' },
  { key: 'create', label: 'Create', icon: 'add_circle', iconClass: 'text-secondary' },
  { key: 'edit', label: 'Edit', icon: 'edit_square', iconClass: 'text-[#004598]' },
  { key: 'delete', label: 'Delete', icon: 'delete', iconClass: 'text-danger-text' },
  { key: 'approve', label: 'Approve', icon: 'verified', iconClass: 'text-primary-container' },
];

/** 'y' = được cấp, '' = chưa cấp, 'x' = không áp dụng, 'lock' = chỉ cấp quản trị cao. */
type Cell = 'y' | '' | 'x' | 'lock';

interface ModuleRow {
  id: string;
  name: string;
  desc: string;
  icon: string;
  iconClass: string;
  tag?: { label: string; cls: string };
  perms: Record<PermKey, Cell>;
}

const INITIAL_MATRIX: ModuleRow[] = [
  {
    id: 'profile', name: 'Hồ sơ ứng viên & CV kho dữ liệu', icon: 'badge', iconClass: 'bg-surface-mid text-primary',
    desc: 'Truy xuất thông tin chi tiết ứng viên, tải CV gốc và hồ sơ kỹ năng trích xuất bởi AI',
    perms: { view: 'y', create: 'y', edit: 'y', delete: '', approve: 'x' },
  },
  {
    id: 'jd', name: 'Tin tuyển dụng (Job Description)', icon: 'description', iconClass: 'bg-surface-mid text-secondary',
    desc: 'Soạn thảo, xuất bản vị trí tuyển dụng, chỉnh sửa bộ câu hỏi phỏng vấn chuẩn hóa',
    perms: { view: 'y', create: 'y', edit: 'y', delete: 'y', approve: 'lock' },
  },
  {
    id: 'pipeline', name: 'Quản lý ứng tuyển (Candidate Pipeline)', icon: 'assignment_ind', iconClass: 'bg-surface-mid text-[#005cc6]',
    desc: 'Theo dõi luồng ứng viên qua các phễu tuyển dụng, sàng lọc và phân loại trạng thái',
    perms: { view: 'y', create: 'x', edit: 'y', delete: '', approve: 'y' },
  },
  {
    id: 'schedule', name: 'Lịch phỏng vấn & Điều phối ca thi', icon: 'calendar_month', iconClass: 'bg-surface-mid text-primary',
    desc: 'Tạo slot rảnh cho chuyên gia, gửi lời mời Google Meet / Zoom và đồng bộ lịch',
    perms: { view: 'y', create: 'y', edit: 'y', delete: 'y', approve: 'x' },
  },
  {
    id: 'ai-mock', name: 'Phỏng vấn giả lập AI (AI Mock Interview)', icon: 'smart_toy', iconClass: 'bg-success-bg text-success-text',
    desc: 'Xem video ghi hình, bản transcript giọng nói và điểm radar năng lực AI đánh giá',
    tag: { label: 'AI Core', cls: 'bg-success-bg text-success-text' },
    perms: { view: 'y', create: 'x', edit: 'x', delete: 'x', approve: 'x' },
  },
  {
    id: 'scoring', name: 'Bảng điểm & Đánh giá chuyên môn', icon: 'rate_review', iconClass: 'bg-surface-mid text-primary-container',
    desc: 'Nhập tiêu chí chấm điểm sau phỏng vấn, nhận xét kỹ năng mềm và xác nhận Pass/Fail',
    perms: { view: 'y', create: 'y', edit: 'y', delete: '', approve: 'y' },
  },
  {
    id: 'users', name: 'Quản lý người dùng hệ thống', icon: 'manage_accounts', iconClass: 'bg-surface-high text-outline-strong',
    desc: 'Khóa tài khoản, xem lịch sử đăng nhập, quản lý phiên và phân vai trò',
    tag: { label: 'Admin Only', cls: 'bg-danger-bg text-danger-text' },
    perms: { view: 'lock', create: 'lock', edit: 'lock', delete: 'lock', approve: 'lock' },
  },
  {
    id: 'moderation', name: 'Kiểm duyệt JD & Vi phạm nội dung', icon: 'fact_check', iconClass: 'bg-surface-high text-outline-strong',
    desc: 'Kiểm tra thông tin pháp lý doanh nghiệp và từ chối các tin tuyển dụng không hợp lệ',
    tag: { label: 'Admin Only', cls: 'bg-danger-bg text-danger-text' },
    perms: { view: 'lock', create: 'lock', edit: 'lock', delete: 'lock', approve: 'lock' },
  },
  {
    id: 'report', name: 'Dashboard & Báo cáo tuyển dụng', icon: 'query_stats', iconClass: 'bg-surface-mid text-primary',
    desc: 'Xem biểu đồ hiệu suất tin đăng, tỷ lệ chuyển đổi vòng phỏng vấn của doanh nghiệp',
    perms: { view: 'y', create: 'x', edit: 'x', delete: 'x', approve: 'x' },
  },
];

const LAST_SAVED = 'Lần lưu gần nhất: 14:32 - 12/05/2026 bởi Quản trị viên cấp cao';

const ROLES = [
  {
    id: 'candidate', name: 'Ứng viên', chip: 'Mặc định hệ thống', chipCls: 'bg-surface-low text-ink-variant',
    icon: 'person', iconCls: 'bg-surface-mid text-primary',
    count: '12,450 người dùng', countCls: 'text-secondary', dotCls: 'bg-secondary',
    desc: 'Quyền tìm việc làm, nộp CV trực tuyến, trải nghiệm phòng phỏng vấn giả lập AI và tham gia lịch phỏng vấn chính thức.',
  },
  {
    id: 'employer', name: 'Nhà tuyển dụng / Cố vấn', chip: 'Doanh nghiệp', chipCls: 'bg-success-bg text-success-text',
    icon: 'apartment', iconCls: 'bg-primary-container text-on-primary',
    count: '860 người dùng kích hoạt', countCls: 'text-primary font-semibold', dotCls: 'bg-primary animate-pulse',
    desc: 'Quyền đăng tin JD, tiếp nhận & duyệt hồ sơ ứng viên, đặt lịch phỏng vấn vòng chuyên môn và xem phân tích AI.',
  },
  {
    id: 'admin', name: 'Quản trị viên', chip: 'Toàn quyền SuperAdmin', chipCls: 'bg-danger-bg text-danger-text',
    icon: 'admin_panel_settings', iconCls: 'bg-surface-mid text-[#005cc6]',
    count: '14 tài khoản quản trị', countCls: 'text-outline-strong', dotCls: 'bg-outline-strong',
    desc: 'Toàn quyền hệ thống, phê duyệt tin tuyển dụng, phân quyền phân vai, cấu hình mô hình AI và xem audit logs.',
  },
];

const FILTERS = [
  { value: 'all', label: 'All modules (9)' },
  { value: 'granted', label: 'Only modules with permissions' },
  { value: 'restricted', label: 'Admin-only modules' },
];

const cellKey = (rowId: string, action: PermKey) => `${rowId}:${action}`;

/** Map "mặc định đã cấp" của mockup -> state khởi điểm; checkbox sửa local state, không gọi API. */
const initialGrants = (): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  INITIAL_MATRIX.forEach(row => {
    ACTIONS.forEach(a => {
      const c = row.perms[a.key];
      if (c === 'y' || c === '') out[cellKey(row.id, a.key)] = c === 'y';
    });
  });
  return out;
};

const selectableCell = (row: ModuleRow, action: PermKey): Cell => row.perms[action];

const AdminRolePermissionPage: React.FC = () => {
  const [roleId, setRoleId] = useState('employer');
  const [grants, setGrants] = useState<Record<string, boolean>>(initialGrants);
  const [filter, setFilter] = useState('all');
  const [showDesc, setShowDesc] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(true);

  const changedKeys = useMemo(() => {
    const base = initialGrants();
    return Object.keys(grants).filter(k => grants[k] !== base[k]);
  }, [grants]);

  const grantedCount = useMemo(() => {
    const cells = Object.keys(grants);
    return { granted: cells.filter(k => grants[k]).length, total: cells.length };
  }, [grants]);

  const rows = useMemo(() => INITIAL_MATRIX.filter(row => {
    if (filter === 'granted') {
      return ACTIONS.some(a => grants[cellKey(row.id, a.key)] === true);
    }
    if (filter === 'restricted') return Object.values(row.perms).includes('lock');
    return true;
  }), [filter, grants]);

  const activeRole = ROLES.find(r => r.id === roleId) ?? ROLES[1];

  const toggle = (rowId: string, action: PermKey) =>
    setGrants(g => ({ ...g, [cellKey(rowId, action)]: !g[cellKey(rowId, action)] }));

  const grantAllView = () =>
    setGrants(g => {
      const next = { ...g };
      INITIAL_MATRIX.forEach(row => {
        if (selectableCell(row, 'view') === 'y' || selectableCell(row, 'view') === '') {
          next[cellKey(row.id, 'view')] = true;
        }
      });
      return next;
    });

  const resetDefaults = () => setGrants(initialGrants());

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Breadcrumb + title + actions */}
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1 text-label-md text-ink-variant">
          <span className="hover:text-primary">System</span>
          <span className="material-symbols-outlined text-[16px] text-outline-strong">chevron_right</span>
          <span className="font-semibold text-ink">Roles &amp; Permissions</span>
        </nav>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="m-0 text-headline-lg text-ink">System permissions</h1>
            <p className="mt-0.5 mb-0 text-body-md text-ink-variant">
              Manage role-based access and control what each account type can do on the platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={buttonClass('secondary', 'h-10 rounded-lg')}>
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export matrix
            </button>
            <button type="button" className={buttonClass('primary', 'h-10 rounded-lg')}>
              <span className="material-symbols-outlined text-[18px]">add_moderator</span>
              Add role
            </button>
          </div>
        </div>
      </div>

      {/* RBAC banner */}
      {bannerOpen && (
        <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-high p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-semibold text-ink">
                RBAC security policy (Role-Based Access Control)
              </span>
              <p className="mt-1 mb-0 text-body-sm leading-relaxed text-ink-variant">
                Any attempt to reach a feature, run a query, or call an API outside the matrix below is
                automatically rejected (
                <code className={`${MONO} rounded bg-card px-1.5 py-0.5 font-bold text-primary`}>403 Forbidden</code>
                ). Permission changes sync in real time and take effect in the next active session.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="p-1 text-outline-strong transition-colors hover:text-ink"
            onClick={() => setBannerOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Role cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLES.map(r => {
          const active = r.id === roleId;
          return (
            <div
              key={r.id}
              className={`relative flex flex-col justify-between rounded-xl bg-card p-6 transition-shadow ${
                active ? 'shadow-md ring-2 ring-primary' : 'shadow-sm hover:shadow-md'
              }`}
            >
              {active && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-label-sm font-bold text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Editing this configuration
                </span>
              )}
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <button
                    type="button"
                    aria-label={`Select role ${r.name}`}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform ${r.iconCls} ${
                      active ? '' : 'hover:scale-105'
                    }`}
                    onClick={() => setRoleId(r.id)}
                  >
                    <span className="material-symbols-outlined text-[26px]">{r.icon}</span>
                  </button>
                  <span className={`rounded-full px-2 py-1 text-label-sm font-medium ${r.chipCls}`}>{r.chip}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 text-headline-md font-bold text-ink">{r.name}</h3>
                  <div className={`flex items-center gap-2 text-label-md ${r.countCls}`}>
                    <span className={`h-2 w-2 rounded-full ${r.dotCls}`} />
                    <span>{r.count}</span>
                  </div>
                  <p className="mt-2 mb-0 text-body-sm leading-relaxed text-ink-variant">{r.desc}</p>
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  className={
                    active
                      ? 'flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-label-md font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover'
                      : 'flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-surface-low text-label-md font-medium text-ink transition-colors hover:bg-surface-mid'
                  }
                  onClick={() => setRoleId(r.id)}
                >
                  {active
                    ? <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    : <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                  {active ? 'Editing permission matrix' : 'Edit permissions'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="flex flex-col gap-3 bg-surface-low/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-headline-md font-bold text-ink">Permission matrix</h2>
              <span className={`rounded-full bg-surface-mid px-2 py-0.5 text-label-sm font-bold text-primary`}>
                {grantedCount.granted} / {grantedCount.total} permissions granted
              </span>
            </div>
            <span className="hidden text-label-sm text-outline-strong sm:inline">•</span>
            <span className="hidden text-body-sm text-ink-variant sm:inline">
              Scope: {activeRole.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={buttonClass('secondary', 'h-9')} onClick={grantAllView}>
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Grant all View
            </button>
            <button type="button" className={buttonClass('secondary', 'h-9')} onClick={() => setShowDesc(v => !v)}>
              <span className="material-symbols-outlined text-[16px]">{showDesc ? 'unfold_less' : 'unfold_more'}</span>
              {showDesc ? 'Hide descriptions' : 'Show descriptions'}
            </button>
            <select
              className="h-9 cursor-pointer appearance-none rounded-md bg-card px-3 pr-8 text-label-md text-ink shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-[#e2e8f0]">
          <table className="w-full border-collapse text-left text-body-sm text-ink">
            <thead>
              <tr className="bg-surface-low text-label-md uppercase tracking-wider text-ink-variant">
                <th className="w-2/5 px-6 py-4 text-left font-semibold">Module &amp; feature group</th>
                {ACTIONS.map(a => (
                  <th key={a.key} className="w-[12%] px-3 py-4 text-center font-semibold">
                    <span className="inline-flex items-center justify-center gap-1">
                      <span className={`material-symbols-outlined text-[16px] ${a.iconClass}`}>{a.icon}</span>
                      {a.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-body-sm text-ink-variant">No module matches this filter.</td></tr>
              )}
              {rows.map(row => {
                const locked = Object.values(row.perms).includes('lock') && row.id !== 'jd';
                return (
                  <tr key={row.id} className={`transition-colors ${locked ? 'bg-surface-low/30' : 'hover:bg-surface-low/40'}`}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.iconClass}`}>
                          <span className="material-symbols-outlined text-[20px]">{row.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`block text-headline-sm font-semibold ${locked ? 'text-ink-variant' : 'text-ink'}`}>
                              {row.name}
                            </span>
                            {row.tag && (
                              <span className={`rounded px-1.5 py-0.5 text-label-sm font-bold ${row.tag.cls}`}>{row.tag.label}</span>
                            )}
                          </div>
                          {showDesc && (
                            <p className={`mt-0.5 mb-0 text-body-sm ${locked ? 'text-outline-strong' : 'text-ink-variant'}`}>
                              {row.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {ACTIONS.map(a => {
                      const cell = selectableCell(row, a.key);
                      if (cell === 'lock') {
                        return (
                          <td key={a.key} className="bg-surface-low/40 px-3 py-4 text-center align-top">
                            <span
                              className="inline-flex items-center justify-center gap-1 text-outline-strong"
                              title={row.id === 'jd' ? 'Senior administrators only' : 'Admin-only capability'}
                            >
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                            </span>
                          </td>
                        );
                      }
                      if (cell === 'x') {
                        return (
                          <td key={a.key} className="bg-surface-low/30 px-3 py-4 text-center align-top">
                            <span
                              className="inline-flex items-center justify-center text-outline-strong"
                              title="Not applicable to this module"
                            >
                              <span className="material-symbols-outlined text-[18px]">remove</span>
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={a.key} className="px-3 py-4 text-center align-top">
                          <label className="inline-flex cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              className="h-5 w-5 cursor-pointer rounded accent-primary-container"
                              checked={!!grants[cellKey(row.id, a.key)]}
                              disabled={locked}
                              onChange={() => toggle(row.id, a.key)}
                              aria-label={`${a.label} — ${row.name}`}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="m-0 border-t border-[#e2e8f0] bg-surface-low px-6 py-2.5 text-body-sm text-ink-variant">
          Mockup page — there is no role-permission write API yet, so changes here are local preview only.
          <Link to="/admin/users" className="ml-1 text-primary hover:underline">Role directory</Link>
        </p>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-72 right-0 z-30 border-t border-[#e2e8f0] bg-card/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className={`h-3.5 w-3.5 rounded-full ${changedKeys.length ? 'bg-[#4fdbc8]' : 'bg-surface-highest'}`} />
              {changedKeys.length > 0 && (
                <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-[#10b981]" />
              )}
            </span>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 text-label-md text-ink">
                <span className="font-bold">
                  {changedKeys.length > 0
                    ? `${changedKeys.length} permission change(s) pending`
                    : 'No unsaved changes'}
                </span>
                <span className="text-outline-strong">•</span>
                <span className="font-normal text-ink-variant">
                  Role: <span className="font-semibold text-primary">{activeRole.name}</span>
                </span>
              </div>
              <span className="text-body-sm text-outline-strong">{LAST_SAVED}</span>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button type="button" className={buttonClass('ghost', 'bg-transparent')} onClick={resetDefaults}>
              Restore defaults
            </button>
            <button type="button" className={buttonClass('secondary')} disabled={!changedKeys.length}>
              Discard changes
            </button>
            <button type="button" className={buttonClass('primary', 'h-10 rounded-lg px-5')} disabled={!changedKeys.length}>
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save permission configuration
            </button>
          </div>
        </div>
      </div>

      {changedKeys.length > 0 && (
        <div className="sr-only" role="status">
          <Badge tone="warning">{changedKeys.length} unsaved</Badge>
        </div>
      )}
    </div>
  );
};

export default AdminRolePermissionPage;
