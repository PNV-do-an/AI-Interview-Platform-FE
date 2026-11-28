import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminService from '../../services/admin.service';
import BrandLogo from '../components/BrandLogo';
import { UserStats } from '../../models/User.model';

/**
 * Shell riêng cho /admin/*, dùng chung bảng màu editorial và các trạng thái quyền của nền tảng.
 * Số liệu badge vẫn lấy từ API thật; ROLE_STAFF không gọi API quản trị ADMIN-only.
 */

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_STAFF: 'Nhân viên vận hành',
  ROLE_INTERVIEWER: 'Nhà tuyển dụng',
  ROLE_USER: 'Ứng viên',
};

interface AdminNavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
  badge?: 'users' | 'pending';
  badgeSuffix?: string;
  end?: boolean;
  children?: { to: string; label: string; badge?: 'pending' }[];
}

const NAV: { title: string; items: AdminNavItem[] }[] = [
  {
    title: 'Quản trị chính',
    items: [
      { to: '/admin/dashboard', label: 'Tổng quan', icon: 'dashboard', roles: ['ROLE_ADMIN'], end: true },
      {
        to: '/admin/users', label: 'Người dùng & Tài khoản', icon: 'group', roles: ['ROLE_ADMIN'],
        badge: 'users',
      },
      {
        to: '/admin/job-approvals', label: 'Kiểm duyệt JD', icon: 'fact_check',
        roles: ['ROLE_ADMIN', 'ROLE_STAFF'], badge: 'pending', badgeSuffix: 'chờ duyệt',
        children: [
          { to: '/admin/job-approvals', label: 'Chờ duyệt', badge: 'pending' },
          { to: '/admin/job-approvals/history', label: 'Lịch sử kiểm duyệt' },
        ],
      },
      { to: '/admin/audit', label: 'Nhật ký kiểm toán', icon: 'receipt_long', roles: ['ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Hệ thống & Thiết lập',
    items: [
      { to: '/admin/categories', label: 'Danh mục & Ngành nghề', icon: 'layers', roles: ['ROLE_ADMIN'] },
      { to: '/admin/settings', label: 'Cấu hình & AI Engine', icon: 'tune', roles: ['ROLE_ADMIN'] },
      { to: '/admin/account', label: 'Tài khoản quản trị', icon: 'manage_accounts', roles: ['ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Vận hành dịch vụ',
    items: [
      {
        to: '/admin/packages', label: 'Gói dịch vụ', icon: 'inventory_2',
        roles: ['ROLE_ADMIN', 'ROLE_STAFF'], end: true,
      },
      { to: '/admin/feedback', label: 'Đánh giá & Báo lỗi', icon: 'star', roles: ['ROLE_ADMIN', 'ROLE_STAFF'] },
    ],
  },
];

const NAV_ITEM_BASE =
  'flex items-center justify-between px-space-md py-2.5 rounded-xl transition-all text-ds-label-lg border border-transparent';
const NAV_ITEM_IDLE = 'text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-low hover:text-on-surface';
const NAV_ITEM_ACTIVE = 'bg-primary-container text-on-primary shadow-[3px_3px_0_#d5ef6c] font-bold';
const SUBITEM_BASE =
  'flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors text-ds-body-md';
const SUBITEM_IDLE = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';
const SUBITEM_ACTIVE = 'text-primary font-bold bg-surface-container-low';

const BADGE_CLASS = 'px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none';

const initialsOf = (name: string): string => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[parts.length - 1]?.[0] ?? '') + (parts[parts.length - 2]?.[0] ?? parts[0]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2) || 'AD';
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pendingJd, setPendingJd] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = user?.role ?? '';
  const isAdmin = role === 'ROLE_ADMIN';
  // Controller/context trả object mới mỗi render -> ref để chỉ gọi API một lần.
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAdmin || fetched.current) return;
    fetched.current = true;
    let alive = true;
    AdminService.getUserStats({})
      .then((res) => { if (alive) setStats(res.data.data!); })
      .catch(() => { /* shell phải dựng được kể cả khi stats lỗi */ });
    AdminService.getDashboard(30)
      .then((res) => { if (alive) setPendingJd(res.data.data!.jobs.pendingModeration); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isAdmin]);

  const sections = useMemo(
    () =>
      NAV.map((section) => ({
        ...section,
        items: section.items
          .filter((item) => item.roles.includes(role))
          .map((item) => ({
            ...item,
            children: item.children?.filter((child) => item.roles.includes(role)),
          })),
      })).filter((section) => section.items.length > 0),
    [role],
  );

  const badgeValue = (kind?: 'users' | 'pending', suffix = ''): string | null => {
    if (kind === 'users') return stats ? `${stats.total.toLocaleString('vi-VN')}` : null;
    if (kind === 'pending') return pendingJd === null ? null : `${pendingJd}${suffix ? ` ${suffix}` : ''}`;
    return null;
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/admin/users?search=${encodeURIComponent(q)}` : '/admin/users');
  };

  const initials = initialsOf(user?.fullName || user?.email || '');

  // Close the mobile drawer on navigation (desktop aside is unaffected).
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="h-[72px] px-space-lg flex items-center border-b border-outline-variant">
          <BrandLogo
            markClass="h-7"
            nameClass="text-ds-label-lg text-on-surface font-bold tracking-tight"
            sub={isAdmin ? 'Control room' : 'Operations'}
          />
        </div>

        <div className="px-space-md py-space-md">
          {sections.map((section) => (
            <div key={section.title} className="mb-space-sm">
              <div className="px-space-sm pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {section.title}
              </div>
              <nav className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const badge = badgeValue(item.badge, item.badgeSuffix);
                  const children = item.children ?? [];
                  return (
                    <React.Fragment key={item.to}>
                      <NavLink
                        to={item.to}
                        end={children.length === 0 ? item.end : false}
                        className={({ isActive }) => {
                          const active = children.length
                            ? children.some((c) => location.pathname === c.to)
                            : isActive;
                          return `${NAV_ITEM_BASE} ${active ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`;
                        }}
                      >
                        <span className="flex items-center gap-space-md min-w-0">
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        {badge && (
                          <span className={`${BADGE_CLASS} ml-2 shrink-0 ${item.badge === 'pending'
                            ? 'bg-secondary-container text-on-secondary-container font-bold'
                            : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {badge}
                          </span>
                        )}
                      </NavLink>

                      {children.length > 0 && (
                        <div className="mt-1 ml-space-md pl-space-sm space-y-1">
                          {children.map((child) => {
                            const childBadge = badgeValue(child.badge);
                            return (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                end
                                className={({ isActive }) =>
                                  `${SUBITEM_BASE} ${isActive ? SUBITEM_ACTIVE : SUBITEM_IDLE}`
                                }
                              >
                                <span>{child.label}</span>
                                {childBadge && (
                                  <span className={`${BADGE_CLASS} bg-primary-fixed text-on-primary-fixed-variant font-bold`}>
                                    {childBadge}
                                  </span>
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="p-space-md border-t border-surface-container bg-surface-container-low flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-sm p-2 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-ds-label-md text-on-surface font-semibold truncate leading-tight">
              {user?.fullName || ROLE_LABEL[role] || 'Tài khoản'}
            </span>
            <span className="text-[11px] text-primary truncate leading-tight">
              {ROLE_LABEL[role] ?? 'Quản trị viên'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 px-1">
          <Link
            to="/bug-reports"
            className="flex items-center gap-1 text-ds-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span>Hỗ trợ kỹ thuật</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-1 text-ds-label-sm text-error hover:opacity-80 transition-opacity font-semibold border-0 bg-transparent cursor-pointer p-0"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
        <div className="text-[11px] text-on-surface-variant text-center font-bold">v2.5.4</div>
      </div>
    </>
  );

  return (
    <div className="admin-shell min-h-screen bg-background text-ds-body-md text-on-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between border-r border-outline-variant bg-surface-container-lowest shadow-header lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Đóng menu quản trị" className="absolute inset-0 border-0 bg-[#28212e]/45" onClick={() => setDrawerOpen(false)} />
          <aside id="admin-mobile-menu" className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-surface-container-lowest shadow-header">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-[72px] items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-lowest/90 px-space-md shadow-header backdrop-blur-xl lg:left-72 lg:px-space-lg">
          <button
            type="button"
            aria-label="Mở menu quản trị"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-menu"
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 shrink-0 rounded-xl border border-outline-variant/40 bg-transparent flex items-center justify-center text-on-surface-variant hover:text-on-surface lg:hidden"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">menu</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-space-lg">
            {isAdmin ? (
              <form className="relative w-full max-w-md" onSubmit={onSearch}>
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-strong text-[18px]" aria-hidden="true">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Tìm kiếm toàn hệ thống"
                  placeholder="Tìm kiếm ứng viên, JD, doanh nghiệp, phiên phỏng vấn..."
                  className="w-full h-10 pl-10 pr-space-md rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface text-ds-body-sm placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                />
              </form>
            ) : (
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">fact_check</span>
                Operations / kiểm duyệt
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-md shrink-0">
            <Link
              to={isAdmin ? '/admin/audit' : '/admin/job-approvals'}
              aria-label={isAdmin ? 'Nhật ký hoạt động' : 'Kiểm duyệt JD'}
              className="w-10 h-10 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/40 no-underline"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{isAdmin ? 'receipt_long' : 'fact_check'}</span>
            </Link>
            {isAdmin ? (
              <Link
                to="/admin/account"
                className="flex items-center gap-space-sm pl-space-xs cursor-pointer hover:opacity-90 transition-opacity no-underline"
              >
                <span className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                  {initials}
                </span>
                <span className="text-left hidden sm:flex flex-col">
                  <span className="text-ds-label-md text-on-surface font-semibold leading-tight">
                    {user?.fullName || 'Quản trị viên'}
                  </span>
                  <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-[0.12em] leading-tight">
                    {ROLE_LABEL[role] ?? 'Quản trị viên'}
                  </span>
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]" aria-hidden="true">expand_more</span>
              </Link>
            ) : (
              <div className="flex items-center gap-space-sm pl-space-xs">
                <span className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-mono font-bold text-xs">
                  {initials}
                </span>
                <span className="hidden text-left sm:flex sm:flex-col">
                  <span className="text-ds-label-md text-on-surface font-semibold leading-tight">{user?.fullName || 'Nhân viên'}</span>
                  <span className="font-mono text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.12em] leading-tight">{ROLE_LABEL[role] ?? 'Nhân viên vận hành'}</span>
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="relative min-h-screen w-full bg-background pt-[72px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
