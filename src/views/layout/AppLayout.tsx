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
  {
    title: 'Tuyển dụng & Đánh giá',
    items: [
      { to: '/my-jobs', label: 'Quản lý JD', icon: 'description', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-applications', label: 'Ứng viên & Hồ sơ', icon: 'group', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots', label: 'Lịch rảnh phỏng vấn', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/candidates/evaluation', label: 'Đánh giá ứng viên', icon: 'fact_check', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
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
      { to: '/jobs/new', label: 'Tạo JD mới', icon: 'add', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/account', label: 'Ngân hàng câu hỏi AI', icon: 'smart_toy', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/my-slots/calendar', label: 'Lịch khung giờ', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/packages', label: 'Gói dịch vụ', icon: 'deployed_code', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-orders', label: 'Đơn hàng', icon: 'receipt_long', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/company/settings', label: 'Cài đặt công ty', icon: 'settings', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
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
  ROLE_INTERVIEWER: 'Nhà tuyển dụng',
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
  
  // Show Recruiter Hub theme for employer/admin/staff roles
  const isRecruiterHub = role === 'ROLE_INTERVIEWER' || role === 'ROLE_STAFF' || role === 'ROLE_ADMIN';
  const companyName = user?.companyName || 'VNG Tech Corp';

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
        {isRecruiterHub ? (
          /* Recruiter Hub Theme */
          <>
            <div className="h-16 px-6 flex items-center gap-2 bg-surface-container-lowest">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGnPm-z5wcMsjaaW5iLdOOC3Tm-Nrozhb39xZfygpkc8UPbNirmNIws550ECEn31XcK4jF_0o9oP756U3wBnbmgYOcoL7milXTMVjQM2SFPXfuQMuQgmxTSrjY4TXQs4UcGIIUeKaiv-fNFBzNfPRJv4BDswVt8-F6htFrBw6bzNtwqx2ifR6mZKBNXbweyNWt3u1l94xHtTeAVDAb4wg3l1OcEOMtlv0p7GBCVTNRK6Qs8Hq7DyTm" 
                alt="AI Interview Logo" 
                className="w-10 h-10 rounded-xl object-contain shadow-sm"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">AI Interview</span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider text-[10px] font-bold">NHÀ TUYỂN DỤNG</span>
              </div>
            </div>
            
            <div className="px-4 py-3">
              <nav className="flex flex-col gap-4">
                {workspaces.map((section) => (
                  <div key={section.title} className="flex flex-col gap-1">
                    <span className="px-2 text-label-sm uppercase text-outline tracking-wider text-[11px]">{section.title}</span>
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2 rounded-lg font-label-lg text-label-lg transition-all ${
                            isActive 
                              ? 'bg-primary-container text-on-primary shadow-sm' 
                              : 'text-ink-variant hover:bg-surface-container hover:text-ink'
                          }`
                        }
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* AI Recruiter Assistant Banner */}
            <div className="px-4 m-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span className="font-label-md text-label-md">AI Recruiter Assistant</span>
              </div>
              <p className="font-body-sm text-body-sm text-ink-variant">Sàng lọc tự động 48 hồ sơ hôm nay với độ khớp &gt; 85%.</p>
              <a className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant inline-flex items-center gap-2 mt-1 font-semibold cursor-pointer">
                Xem gợi ý ngay <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </>
        ) : (
          /* Default Candidate Theme */
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
          </>
        )}
      </div>

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

      <header className={`fixed top-0 left-0 right-0 h-16 ${isRecruiterHub ? 'bg-surface-container-lowest/90 backdrop-blur-md' : 'bg-surface/80'} shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6 ${isRecruiterHub ? 'lg:left-72' : 'lg:left-72'}`}>
        <div className="flex items-center flex-1 max-w-md">
          <form className="w-full relative" onSubmit={onSearch}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Tìm kiếm ứng viên, vị trí JD, kỹ năng..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm"
            />
          </form>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            <button 
              className="w-10 h-10 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors relative" 
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
            </button>
          </div>
          
          {isRecruiterHub && (
            <>
              <div className="h-8 w-[1px] bg-outline-variant/40"></div>
              <div className="flex items-center gap-3 pl-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">{companyName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-label-sm text-[10px] font-bold">NHÀ TUYỂN DỤNG</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-ink-variant text-[11px] leading-3">HR Manager</span>
                </div>
              </div>
            </>
          )}
          
          {!isRecruiterHub && (
            <div className="flex items-center gap-2 pl-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                {initials || '?'}
              </span>
              <span className="hidden flex-col text-left md:flex">
                <span className="text-label-md leading-none text-ink">{user?.fullName ?? user?.email}</span>
                <span className="mt-1 text-label-sm leading-none text-ink-variant">{roleChip}</span>
              </span>
            </div>
          )}
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
