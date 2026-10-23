import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const WORKSPACES: { title: string; items: NavItem[] }[] = [
  {
    title: 'Khu vực ứng viên',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard' },
      { to: '/mock-interviews', label: 'Luyện tập cùng AI', icon: 'smart_toy', roles: ['ROLE_USER'] },
      { to: '/my-applications', label: 'Đơn ứng tuyển', icon: 'assignment', roles: ['ROLE_USER'] },
      { to: '/jobs', label: 'Bảng tin tuyển dụng', icon: 'search' },
      { to: '/my-profile', label: 'Hồ sơ & CV', icon: 'person', roles: ['ROLE_USER'] },
      { to: '/cv-analyzer', label: 'Phân tích CV', icon: 'fact_check', roles: ['ROLE_USER'] },
      { to: '/cover-letters', label: 'Thư xin việc', icon: 'mail', roles: ['ROLE_USER'] },
      { to: '/device-check', label: 'Kiểm tra thiết bị', icon: 'videocam', roles: ['ROLE_USER'] },
    ],
  },
  {
    title: 'Khu vực nhà tuyển dụng',
    items: [
      { to: '/my-jobs', label: 'Tin đã đăng', icon: 'work', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/jobs/new', label: 'Đăng tin mới', icon: 'add', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots', label: 'Lịch trống', icon: 'event_available', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots/calendar', label: 'Lịch khung giờ', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/packages', label: 'Gói dịch vụ', icon: 'deployed_code', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-orders', label: 'Đơn hàng', icon: 'receipt_long', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      // Giao diện admin cũ đã xoá: mọi màn /admin/* sống trong shell AdminLayout
      // (tiếng Việt, theo mockup Stitch). Shell này chỉ còn 1 cửa vào, destinations
      // khớp guard role trong App.tsx để không dẫn tới 403.
      { to: '/admin/dashboard', label: 'Trang quản trị', icon: 'dashboard', roles: ['ROLE_ADMIN'] },
      { to: '/admin/job-approvals', label: 'Trang quản trị', icon: 'dashboard', roles: ['ROLE_STAFF'] },
    ],
  },
];

const ROLE_CHIP: Record<string, string> = {
  ROLE_USER: 'Vai trò ứng viên',
  ROLE_INTERVIEWER: 'Vai trò nhà tuyển dụng',
  ROLE_STAFF: 'Vai trò vận hành',
  ROLE_ADMIN: 'Vai trò quản trị',
};

const NAV_ITEM_CLASS =
  'flex items-center gap-2 rounded-lg px-2 py-1 text-label-md text-ink-variant no-underline transition-colors hover:bg-surface-high hover:text-ink';
const NAV_ITEM_ACTIVE_CLASS = 'bg-primary-container font-label-md text-on-primary';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const role = user?.role ?? '';
  const roleChip = ROLE_CHIP[role] ?? 'Thành viên';
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

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(query)}`);
  };

  const sidebar = (
    <>
      <div className="flex flex-col">
        <div className="flex h-16 items-center px-6">
          <BrandLogo markClass="h-6" nameClass="text-[15px] font-bold tracking-tight text-ink" />
        </div>

        <div className="px-6 py-1">
          <div className="flex items-center justify-between rounded-xl bg-surface-low p-2">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-label-sm text-ink">{roleChip}</span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline-strong">unfold_more</span>
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-4 px-3">
          {workspaces.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <span className="px-2 text-label-sm uppercase text-outline-strong">{section.title}</span>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `${NAV_ITEM_CLASS} ${isActive ? NAV_ITEM_ACTIVE_CLASS : ''}`
                  }
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <Link to="/bug-reports" className={NAV_ITEM_CLASS} onClick={() => setDrawerOpen(false)}>
          <span className="material-symbols-outlined text-[18px]">help_outline</span>Hỗ trợ
        </Link>
        <button type="button" className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`} onClick={() => setDrawerOpen(false)}>
          <span className="material-symbols-outlined text-[18px]">menu_book</span>Tài liệu
        </button>
        <button type="button" className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`} onClick={() => setDrawerOpen(false)}>
          <span className="material-symbols-outlined text-[18px]">settings</span>Cấu hình
        </button>
        <button
          type="button"
          className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between overflow-y-auto bg-card shadow-header lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between overflow-y-auto bg-card shadow-card">
            {sidebar}
          </aside>
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-surface/80 px-4 shadow-header backdrop-blur-xl lg:left-72 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-variant hover:bg-surface-high lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <form className="hidden w-80 items-center gap-2 rounded-xl bg-card px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex" onSubmit={onSearch}>
            <span className="material-symbols-outlined text-[18px] text-outline-strong">search</span>
            <input
              className="w-full border-0 bg-transparent text-body-sm text-ink placeholder:text-outline-strong focus:outline-none"
              placeholder="Tìm ứng viên, phiên luyện tập, tin tuyển dụng..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm"
            />
            <kbd className="rounded bg-surface-mid px-1 py-0.5 font-mono text-[12px] text-ink-variant">⌘K</kbd>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            aria-label="Thông báo"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg no-underline hover:bg-surface-high"
          >
            <span className="material-symbols-outlined text-[20px] text-ink-variant">notifications</span>
          </Link>
          <div className="flex items-center gap-2 pl-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
              {initials || '?'}
            </span>
            <span className="hidden flex-col text-left md:flex">
              <span className="text-label-md leading-none text-ink">{user?.fullName ?? user?.email}</span>
              <span className="mt-1 text-label-sm leading-none text-ink-variant">{roleChip}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="lg:pl-72">
        <main className="px-4 pb-10 pt-16 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
