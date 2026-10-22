import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProgramService from '../../services/program.service';
import logoWordmark from '../../assets/logo-wordmark.png';

/**
 * Shell ứng viên theo bộ mockup Stitch 4 (2026-10-22, `candidate-redesign-stitch4.md`):
 * sidebar w-64 tiếng Việt đúng 7 mục "CÔNG ỨNG VIÊN" + footer Cài đặt tài khoản /
 * Trợ giúp & Hỗ trợ / Đăng xuất. Role khác giữ nhóm màn của họ với nhãn tiếng Việt.
 *
 * Ánh xạ token mockup -> token dự án (như AdminLayout):
 *   text-label-* / text-body-* (scale DESIGN.md) -> text-ds-*
 *   shadow-[0_1px_8px_rgba(0,0,0,0.04)]          -> shadow-header
 *   font-* (font-family biến design)             -> bỏ (app chạy Inter toàn cục)
 * Chip chọn ngôn ngữ + chấm đỏ thông báo trong mockup KHÔNG dựng: app chưa có i18n
 * và chưa có API thông báo (không dựng điều khiển chết).
 */

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
  end?: boolean;
  badgeNew?: boolean;
  badgeCount?: 'applications';
}

const WORKSPACES: { title: string; items: NavItem[] }[] = [
  {
    title: 'Công ứng viên',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: 'grid_view', roles: ['ROLE_USER'] },
      { to: '/my-profile', label: 'Hồ sơ & CV', icon: 'badge', roles: ['ROLE_USER'] },
      { to: '/my-applications', label: 'Đơn ứng tuyển', icon: 'task_alt', roles: ['ROLE_USER'], badgeCount: 'applications' },
      { to: '/interview-booking', label: 'Lịch phỏng vấn', icon: 'calendar_today', roles: ['ROLE_USER'] },
      { to: '/mock-interviews', label: 'Luyện phỏng vấn AI', icon: 'smart_toy', roles: ['ROLE_USER'], badgeNew: true },
      { to: '/interview-history', label: 'Lịch sử & Đánh giá', icon: 'monitoring', roles: ['ROLE_USER'] },
    ],
  },
  {
    title: 'Việc làm',
    items: [
      { to: '/jobs', label: 'Tìm việc', icon: 'work_outline' },
    ],
  },
  {
    title: 'Không gian tuyển dụng',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: 'grid_view', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-jobs', label: 'Tin tuyển dụng', icon: 'work', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/jobs/new', label: 'Đăng tin mới', icon: 'add', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots', label: 'Khung giờ trống', icon: 'event_available', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots/calendar', label: 'Lịch hẹn', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/packages', label: 'Gói dịch vụ', icon: 'deployed_code', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-orders', label: 'Đơn hàng', icon: 'receipt_long', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      { to: '/admin/dashboard', label: 'Admin Console', icon: 'dashboard', roles: ['ROLE_ADMIN'] },
      { to: '/admin/job-approvals', label: 'Admin Console', icon: 'dashboard', roles: ['ROLE_STAFF'] },
    ],
  },
];

const ROLE_LABEL_VN: Record<string, string> = {
  ROLE_USER: 'Ứng viên',
  ROLE_INTERVIEWER: 'Nhà tuyển dụng / Cố vấn',
  ROLE_STAFF: 'Nhân viên vận hành',
  ROLE_ADMIN: 'Quản trị viên',
};

/** Cụm breadcrumb góc trái header, đúng 2 đoạn như mockup. Route khác: không hiện. */
const CRUMBS: { prefix: string; parts: [string, string] }[] = [
  { prefix: '/my-profile', parts: ['Hồ sơ cá nhân', 'Quản lý CV & Kinh nghiệm'] },
  { prefix: '/my-applications', parts: ['Ứng viên', 'Đơn ứng tuyển'] },
  { prefix: '/interview-booking', parts: ['Ứng viên', 'Đặt lịch phỏng vấn'] },
  { prefix: '/mock-interviews', parts: ['Ứng viên', 'Không gian làm việc'] },
  { prefix: '/interview-history', parts: ['Ứng viên', 'Lịch sử & Đánh giá'] },
  { prefix: '/account-settings', parts: ['Trang chủ', 'Cài đặt tài khoản'] },
];

const NAV_ITEM_BASE =
  'flex items-center justify-between gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-ds-label-lg no-underline';
const NAV_ITEM_IDLE = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';
const NAV_ITEM_ACTIVE = 'bg-primary-container text-on-primary shadow-sm font-semibold';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [applicationCount, setApplicationCount] = useState<number | null>(null);

  const role = user?.role ?? '';
  const isCandidate = role === 'ROLE_USER';
  const fetched = useRef(false);

  useEffect(() => {
    if (!isCandidate || fetched.current) return;
    fetched.current = true;
    ProgramService.getMyApplications({ page: 0, size: 1 })
      .then((res) => setApplicationCount(res.data.data?.totalElements ?? null))
      .catch(() => { /* badge là phụ — thiếu thì ẩn, không chặn shell */ });
  }, [isCandidate]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const workspaces = WORKSPACES.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  const crumbs = CRUMBS.find((c) => location.pathname === c.prefix || location.pathname.startsWith(`${c.prefix}/`));

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(query)}`);
  };

  const renderIcon = (name: string, extra = '') => (
    <span className={`material-symbols-outlined text-[20px] ${extra}`}>{name}</span>
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${NAV_ITEM_BASE} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`;

  const sidebar = (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 px-gutter-compact py-space-md">
          <img src={logoWordmark} alt="AI Interview" className="h-6 w-auto self-start" />
          <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            Candidate Portal
          </span>
        </div>

        <nav className="flex flex-col gap-space-xs px-space-sm">
          {workspaces.map((section) => (
            <div key={section.title} className="mb-space-sm">
              <div className="px-space-md pb-1.5 pt-space-sm text-ds-label-sm uppercase tracking-wider text-outline-strong font-bold">
                {section.title}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={`${item.label}-${item.to}`}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                >
                  <span className="flex items-center gap-space-sm min-w-0">
                    {renderIcon(item.icon, item.icon === 'smart_toy' ? 'text-secondary' : '')}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badgeCount === 'applications' && applicationCount !== null && applicationCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-semibold text-ds-label-sm">
                      {applicationCount}
                    </span>
                  )}
                  {item.badgeNew && (
                    <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container uppercase tracking-wider text-ds-label-sm font-bold">
                      Mới
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-space-xs px-space-sm pt-space-md border-t border-outline-variant/30">
        {isCandidate && (
          <NavLink to="/account-settings" className={navLinkClass}>
            <span className="flex items-center gap-space-sm">
              {renderIcon('settings')}
              <span>Cài đặt tài khoản</span>
            </span>
          </NavLink>
        )}
        <NavLink to="/bug-reports" className={navLinkClass}>
          <span className="flex items-center gap-space-sm">
            {renderIcon('help_outline')}
            <span>Trợ giúp & Hỗ trợ</span>
          </span>
        </NavLink>
        <button
          type="button"
          className={`${NAV_ITEM_BASE} w-full border-0 bg-transparent text-left text-error hover:bg-error-container hover:text-on-error-container`}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <span className="flex items-center gap-space-sm">
            {renderIcon('logout')}
            <span>Đăng xuất</span>
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col justify-between overflow-y-auto bg-surface-container-low py-space-md shadow-header lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col justify-between overflow-y-auto bg-surface-container-low py-space-md shadow-header">
            {sidebar}
          </aside>
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-2 bg-surface/85 px-4 shadow-header backdrop-blur-xl lg:left-64 lg:px-gutter">
        <div className="flex min-w-0 flex-1 items-center gap-space-md">
          <button
            type="button"
            aria-label="Mở menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            {renderIcon('menu')}
          </button>
          {crumbs && (
            <div className="hidden md:flex shrink-0 items-center gap-space-xs text-ds-body-sm text-on-surface-variant">
              <span className="text-ds-label-md">{crumbs.parts[0]}</span>
              {renderIcon('chevron_right', 'text-[14px]')}
              <span className="text-ds-label-md text-primary">{crumbs.parts[1]}</span>
            </div>
          )}
          <form className="relative w-full max-w-xs" onSubmit={onSearch}>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-full h-9 pl-8 pr-space-md bg-surface-container-lowest rounded-lg text-ds-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              placeholder="Tìm việc, câu hỏi phỏng vấn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm"
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-space-md">
          <Link
            to="/notifications"
            aria-label="Thông báo"
            className="relative flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface no-underline"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </Link>
          <div className="flex items-center gap-space-sm pl-space-xs">
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary text-ds-label-md font-bold">
              {initials || '?'}
            </span>
            <span className="hidden flex-col text-left sm:flex">
              <span className="text-ds-label-md text-on-surface leading-tight">{user?.fullName ?? user?.email}</span>
              <span className="text-ds-label-sm text-on-surface-variant">{ROLE_LABEL_VN[role] ?? 'Thành viên'}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="lg:pl-64">
        <main className="px-4 pb-10 pt-16 lg:px-gutter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
