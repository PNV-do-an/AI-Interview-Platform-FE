import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

/**
 * Shell "CANDIDATE PORTAL" theo mockup Stitch 2026-10-26
 * (`stitch_ai_interview_platform (5).zip`, màn `t_ng_quan_ng_vi_n`).
 *
 * Mockup dùng chrome riêng cho ứng viên (aside `w-64`, nav không icon, avatar góc phải) nên
 * khu vực ROLE_USER tách khỏi `AppLayout`; employer/staff vẫn đi `AppLayout` vì chưa có thiết kế mới.
 * Token: cùng bộ `ds-*` / `surface-container-*` với `AdminLayout` (DESIGN.md "AI Interview &
 * Career Nexus"). aside `w-64` -> nội dung `lg:pl-64`, header `lg:left-64` (responsive như shell admin).
 */

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tổng quan', end: true },
  { to: '/my-profile', label: 'Hồ sơ & CV' },
  { to: '/jobs', label: 'Tìm việc làm' },
  { to: '/my-applications', label: 'Đơn ứng tuyển' },
  { to: '/my-interviews', label: 'Lịch phỏng vấn' },
  { to: '/mock-interviews', label: 'Luyện phỏng vấn AI' },
  { to: '/mock-interviews/history', label: 'Báo cáo & Đánh giá' },
];

const FOOTER_ITEMS = [
  { to: '/account', label: 'Cài đặt tài khoản' },
  { to: '/bug-reports', label: 'Trợ giúp & Hỗ trợ' },
];

const NAV_BASE =
  'flex items-center px-space-md py-space-sm rounded-lg transition-colors text-ds-label-lg';
const NAV_IDLE = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';
const NAV_ACTIVE = 'bg-primary text-on-primary shadow-sm font-semibold';

const CandidateLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(query.trim())}`);
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <>
      <div className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm px-gutter-compact">
          <BrandLogo
            markClass="h-9 w-9 rounded-xl shadow-sm"
            nameClass="text-ds-headline-sm text-on-surface font-semibold"
            sub="Candidate Portal"
          />
        </div>

        <nav className="flex flex-col gap-space-xs px-space-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_IDLE}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-space-xs px-space-sm pt-space-md border-t border-outline-variant/30">
        {FOOTER_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_IDLE}`}
          >
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center px-space-md py-space-sm rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors text-left font-semibold"
        >
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface text-ds-body-md text-on-surface">
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col justify-between bg-surface-container-low py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 lg:flex">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col justify-between bg-surface-container-low shadow-header">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 right-0 lg:left-64 z-40 flex h-16 items-center justify-between gap-space-sm bg-surface/85 px-space-md lg:px-gutter shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-space-md">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant lg:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <form className="relative w-full max-w-md" onSubmit={onSearch}>
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm kiếm"
                placeholder="Tìm kiếm cơ hội việc làm, phiên luyện AI, lịch phỏng vấn..."
                className="w-full h-9 pl-8 pr-space-md bg-surface-container-lowest rounded-lg text-ds-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </form>
          </div>

          <div className="flex shrink-0 items-center gap-space-md">
            <Link
              to="/notifications"
              aria-label="Thông báo"
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface no-underline"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </Link>
            <Link to="/account" className="flex items-center gap-space-sm pl-space-xs no-underline">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-ds-label-sm font-bold text-on-primary">
                {initials || '?'}
              </span>
              <span className="hidden flex-col text-left sm:flex">
                <span className="text-ds-label-lg leading-tight text-on-surface">
                  {user?.fullName ?? user?.email}
                </span>
                <span className="text-ds-label-sm leading-tight text-on-surface-variant">Ứng viên</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="w-full min-h-screen bg-surface px-gutter-compact pb-space-2xl pt-16 lg:px-gutter lg:py-space-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CandidateLayout;
