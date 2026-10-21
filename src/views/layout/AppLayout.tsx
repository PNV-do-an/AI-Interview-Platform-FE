import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoWordmark from '../../assets/logo-wordmark.png';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const WORKSPACES: { title: string; items: NavItem[] }[] = [
  {
    title: 'Candidate Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: 'dashboard' },
      { to: '/mock-interviews', label: 'AI Mock Sessions', icon: 'smart_toy', roles: ['ROLE_USER'] },
      { to: '/my-applications', label: 'Applications', icon: 'assignment', roles: ['ROLE_USER'] },
      { to: '/jobs', label: 'Job Board', icon: 'search' },
      { to: '/my-profile', label: 'Profile & CV', icon: 'person', roles: ['ROLE_USER'] },
      { to: '/cv-analyzer', label: 'CV Analysis', icon: 'fact_check', roles: ['ROLE_USER'] },
      { to: '/cover-letters', label: 'Cover Letters', icon: 'mail', roles: ['ROLE_USER'] },
    ],
  },
  {
    title: 'Employer Workspace',
    items: [
      { to: '/my-jobs', label: 'Job Postings', icon: 'work', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/jobs/new', label: 'Post a Job', icon: 'add', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots', label: 'Availability', icon: 'event_available', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-slots/calendar', label: 'Slot Calendar', icon: 'calendar_month', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/packages', label: 'Packages', icon: 'deployed_code', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
      { to: '/my-orders', label: 'Orders', icon: 'receipt_long', roles: ['ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Admin',
    items: [
      // Giao diện admin cũ đã xoá: mọi màn /admin/* sống trong shell AdminLayout
      // (tiếng Việt, theo mockup Stitch). Shell này chỉ còn 1 cửa vào, destinations
      // khớp guard role trong App.tsx để không dẫn tới 403.
      { to: '/admin/dashboard', label: 'Admin Console', icon: 'dashboard', roles: ['ROLE_ADMIN'] },
      { to: '/admin/job-approvals', label: 'Admin Console', icon: 'dashboard', roles: ['ROLE_STAFF'] },
    ],
  },
];

const ROLE_CHIP: Record<string, string> = {
  ROLE_USER: 'Candidate Role',
  ROLE_INTERVIEWER: 'Employer Role',
  ROLE_STAFF: 'Operations Role',
  ROLE_ADMIN: 'Admin Role',
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
  const roleChip = ROLE_CHIP[role] ?? 'Member Role';
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
        <div className="flex h-16 items-center gap-2 px-6">
          <img src={logoWordmark} alt="AI Interview" className="h-5 w-auto" />
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
          <span className="material-symbols-outlined text-[18px]">help_outline</span>Support
        </Link>
        <button type="button" className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`} onClick={() => setDrawerOpen(false)}>
          <span className="material-symbols-outlined text-[18px]">menu_book</span>Documentation
        </button>
        <button type="button" className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`} onClick={() => setDrawerOpen(false)}>
          <span className="material-symbols-outlined text-[18px]">settings</span>Settings
        </button>
        <button
          type="button"
          className={`${NAV_ITEM_CLASS} w-full border-0 bg-transparent text-left`}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>Sign out
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
            aria-label="Open navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-variant hover:bg-surface-high lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <form className="hidden w-80 items-center gap-2 rounded-xl bg-card px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex" onSubmit={onSearch}>
            <span className="material-symbols-outlined text-[18px] text-outline-strong">search</span>
            <input
              className="w-full border-0 bg-transparent text-body-sm text-ink placeholder:text-outline-strong focus:outline-none"
              placeholder="Search candidates, sessions, jobs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
            <kbd className="rounded bg-surface-mid px-1 py-0.5 font-mono text-[12px] text-ink-variant">⌘K</kbd>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-high">
            <span className="material-symbols-outlined text-[20px] text-ink-variant">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
          </span>
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
