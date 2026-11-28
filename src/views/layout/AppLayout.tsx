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
    title: 'Bảng điều khiển',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard' },
    ],
  },
  // Mọi destination ở đây phải khớp route + allowedRoles trong App.tsx: shell này từng có
  // mục dẫn tới 403 (/account, /my-applications cho employer) hoặc 404 (/company/settings).
  {
    title: 'Tuyển dụng',
    items: [
      { to: '/my-jobs', label: 'Quản lý JD', icon: 'description', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/jobs/new', label: 'Tạo JD mới', icon: 'add', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
      // { to: '/my-slots', label: 'Lịch rảnh phỏng vấn', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Khu vực ứng viên',
    items: [
      { to: '/mock-interviews', label: 'Luyện tập cùng AI', icon: 'smart_toy', roles: ['ROLE_USER'] },
      { to: '/jobs', label: 'Bảng tin tuyển dụng', icon: 'search' },
      { to: '/my-profile', label: 'Hồ sơ & CV', icon: 'person', roles: ['ROLE_USER'] },
      { to: '/cv-analyzer', label: 'Phân tích CV', icon: 'fact_check', roles: ['ROLE_USER'] },
      { to: '/cover-letters', label: 'Thư xin việc', icon: 'mail', roles: ['ROLE_USER'] },
      { to: '/device-check', label: 'Kiểm tra thiết bị', icon: 'videocam', roles: ['ROLE_USER'] },
    ],
  },
  {
    title: 'Công cụ AI',
    items: [
      // Rubric Studio có route + guard ADMIN/STAFF nhưng trước giờ không có cửa vào nào.
      { to: '/admin/rubrics', label: 'Rubric & câu hỏi AI', icon: 'smart_toy', roles: ['ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
      // { to: '/my-slots/calendar', label: 'Lịch khung giờ', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
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
  ROLE_USER: 'Ứng viên',
  ROLE_INTERVIEWER: 'Nhà tuyển dụng',
  ROLE_STAFF: 'Vận hành',
  ROLE_ADMIN: 'Quản trị',
};

const NAV_ITEM_CLASS =
  'flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-label-md text-ink-variant no-underline transition-all hover:border-outline hover:bg-card hover:text-ink';
const NAV_ITEM_ACTIVE_CLASS =
  'border-primary/10 bg-[#30243a] font-label-md text-on-primary shadow-[3px_3px_0_#d5ef6c]';

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
  
  const isOperationsWorkspace = role === 'ROLE_INTERVIEWER' || role === 'ROLE_STAFF' || role === 'ROLE_ADMIN';

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
        {isOperationsWorkspace ? (
          /* Workspace for hiring, operations, and admin roles */
          <>
            <div className="flex h-[72px] items-center border-b border-outline px-5">
              <BrandLogo
                markClass="h-8"
                nameClass="text-[15px] font-bold tracking-tight text-ink"
                sub={roleChip}
              />
            </div>
            
            <div className="px-4 py-4">
              <nav className="flex flex-col gap-5" aria-label="Điều hướng workspace">
                {workspaces.map((section) => (
                  <div key={section.title} className="flex flex-col gap-1">
                    <span className="px-3 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{section.title}</span>
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={({ isActive }) =>
                          `${NAV_ITEM_CLASS} ${isActive ? NAV_ITEM_ACTIVE_CLASS : ''}`
                        }
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </>
        ) : (
          /* Fallback navigation for candidate and unknown roles */
          <>
            <div className="flex h-16 items-center px-6">
              <BrandLogo markClass="h-6" nameClass="text-[15px] font-bold tracking-tight text-ink" />
            </div>

            <div className="px-6 py-1">
              <div className="flex items-center justify-between rounded-xl bg-surface-low p-2">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-label-sm text-ink">{roleChip}</span>
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-500">unfold_more</span>
              </div>
            </div>

            <nav className="mt-4 flex flex-col gap-4 px-3">
              {workspaces.map((section) => (
                <div key={section.title} className="flex flex-col gap-1">
                  <span className="px-2 text-label-sm uppercase text-slate-500">{section.title}</span>
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
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
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
    <div className={`career-shell role-workspace-shell min-h-screen bg-surface font-sans text-ink ${isOperationsWorkspace ? 'theme-home' : ''}`}>
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between overflow-y-auto border-r border-outline bg-card shadow-header lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Đóng menu điều hướng" className="absolute inset-0 border-0 bg-[#28212e]/45" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between overflow-y-auto border-r border-outline bg-card shadow-card">
            {sidebar}
          </aside>
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-40 flex h-[72px] items-center justify-between gap-3 border-b border-outline/80 bg-card/90 px-4 shadow-header backdrop-blur-xl sm:px-6 lg:left-72">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline bg-card text-ink-variant transition-colors hover:bg-surface-high lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">menu</span>
          </button>
          <form className="relative w-full max-w-md" onSubmit={onSearch}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant text-[20px]" aria-hidden="true">search</span>
            <input
              className="w-full h-10 rounded-xl border border-outline bg-surface-low pl-10 pr-3 text-sm text-ink placeholder:text-ink-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              placeholder="Tìm kiếm tin tuyển dụng, kỹ năng..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm tin tuyển dụng"
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/notifications"
            aria-label="Thông báo"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline bg-card text-primary no-underline transition-colors hover:border-primary/30 hover:bg-surface-low"
          >
            <span className="material-symbols-outlined text-[21px]" aria-hidden="true">notifications</span>
          </Link>

          <div className="hidden h-8 w-px bg-outline sm:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-fixed font-mono text-xs font-bold text-primary">
              {initials || '?'}
            </span>
            <span className="hidden min-w-0 flex-col text-left md:flex">
              <span className="max-w-40 truncate text-xs font-semibold leading-tight text-ink">{user?.fullName ?? user?.email}</span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] leading-tight text-primary">{roleChip}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="lg:pl-72">
        <main className="min-h-screen px-4 pb-10 pt-[72px] sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
