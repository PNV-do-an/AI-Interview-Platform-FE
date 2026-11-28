import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export interface PortalNavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface PortalShellProps {
  children: React.ReactNode;
  navItems: PortalNavItem[];
  roleLabel: string;
  homeTo?: string;
  footerGroups?: { title: string; links: { label: string; to: string }[] }[];
  accountTo?: string;
  quickLinks?: { label: string; to: string; icon?: string }[];
}

const DEFAULT_FOOTER_GROUPS = [
  { title: 'Dành cho ứng viên', links: [{ label: 'Tìm việc làm', to: '/jobs' }, { label: 'Luyện phỏng vấn AI', to: '/mock-interviews' }, { label: 'Phân tích CV', to: '/cv-analyzer' }] },
  { title: 'Dành cho tuyển dụng', links: [{ label: 'Đăng tin tuyển dụng', to: '/jobs/new' }, { label: 'Quản lý tin đăng', to: '/my-jobs' }, { label: 'Gói dịch vụ', to: '/packages' }] },
  { title: 'Hỗ trợ', links: [{ label: 'Trung tâm trợ giúp', to: '/bug-reports' }, { label: 'Thông báo', to: '/notifications' }, { label: 'Tài khoản', to: '/account' }] },
];

const initialsOf = (name: string): string =>
  (name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';

const PortalShell: React.FC<PortalShellProps> = ({
  children,
  navItems,
  roleLabel,
  homeTo = '/dashboard',
  footerGroups = DEFAULT_FOOTER_GROUPS,
  accountTo = '/account',
  quickLinks = [],
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = user?.fullName || user?.email || 'Tài khoản';
  const initials = initialsOf(displayName);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="career-shell flex min-h-screen flex-col font-sans antialiased">
      <a href="#portal-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#d5ef6c] focus:px-4 focus:py-3 focus:font-bold focus:text-[#28212e]">Bỏ qua điều hướng</a>
      <header className="sticky top-0 z-40 border-b border-[#28212e]/10 bg-[#f3efe6]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={homeTo} className="flex shrink-0 items-center gap-2.5 no-underline" aria-label="AI Interview — Tổng quan">
            <span className="flex size-10 items-center justify-center rounded-[14px] border border-[#604273]/20 bg-[#e9dff0]"><BrandLogo markClass="h-7" nameClass="hidden" /></span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-bold tracking-[-0.04em] text-[#28212e]">AI Interview</span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#6f6675]">{roleLabel} / workspace</span>
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-[#28212e]/10 bg-[#fffdf7]/65 p-1 lg:flex" aria-label="Điều hướng không gian làm việc">
            {navItems.map((item, index) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold no-underline transition ${isActive ? 'bg-[#604273] text-[#fffdf7]' : 'text-[#6f6675] hover:bg-[#fffdf7] hover:text-[#28212e]'}`}>
                <span className="font-mono text-[9px] opacity-60">0{index + 1}</span>{item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link to="/notifications" aria-label="Thông báo" className="flex size-10 items-center justify-center rounded-xl border border-[#28212e]/10 bg-[#fffdf7] text-[#604273] no-underline transition hover:-translate-y-0.5 hover:shadow-sm">
              <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
            </Link>
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setUserMenuOpen((open) => !open)} aria-expanded={userMenuOpen} aria-haspopup="menu" className="flex min-h-10 items-center gap-2 rounded-xl border border-[#28212e]/10 bg-[#fffdf7] py-1 pl-1 pr-3 text-left transition hover:border-[#604273]/40">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#e9dff0] font-mono text-xs font-bold text-[#604273]">{initials}</span>
                <span className="hidden max-w-32 truncate text-xs font-semibold text-[#28212e] md:block">{displayName}</span>
                <span className="material-symbols-outlined text-base text-[#6f6675]" aria-hidden="true">expand_more</span>
              </button>
              {userMenuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#28212e]/10 bg-[#fffdf7] p-2 shadow-xl">
                  <div className="border-b border-[#d9d0c3] px-3 py-2">
                    <p className="m-0 truncate text-sm font-bold text-[#28212e]">{displayName}</p>
                    <p className="m-0 mt-1 font-mono text-[10px] uppercase tracking-wider text-[#6f6675]">{roleLabel}</p>
                  </div>
                  <div className="py-1">
                    {[{ label: 'Tài khoản của tôi', to: accountTo }, ...quickLinks].map((item) => (
                      <Link key={`${item.to}-${item.label}`} to={item.to} role="menuitem" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#514957] no-underline hover:bg-[#f3efe6] hover:text-[#604273]">
                        <span className="material-symbols-outlined text-base text-[#ee795f]" aria-hidden="true">{item.icon ?? 'arrow_outward'}</span>{item.label}
                      </Link>
                    ))}
                  </div>
                  <button type="button" role="menuitem" onClick={signOut} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-[#ad493b] transition hover:bg-[#f9d9d0]">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">logout</span>Đăng xuất
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} aria-controls="portal-mobile-menu" className="flex size-10 items-center justify-center rounded-xl border border-[#28212e]/10 bg-[#fffdf7] text-[#28212e] lg:hidden">
              <span className="material-symbols-outlined" aria-hidden="true">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="portal-mobile-menu" className="border-t border-[#28212e]/10 bg-[#f3efe6] px-4 pb-5 pt-3 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Điều hướng điện thoại">
              {navItems.map((item, index) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold no-underline ${isActive ? 'bg-[#604273] text-[#fffdf7]' : 'text-[#28212e] hover:bg-[#fffdf7]'}`}>
                  <span className="font-mono text-[10px] text-[#ee795f]">0{index + 1}</span>{item.label}
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#28212e]/10 pt-3">
                <Link to={accountTo} className="flex min-h-11 items-center justify-center rounded-xl border border-[#28212e]/15 bg-[#fffdf7] text-sm font-semibold text-[#28212e] no-underline">Tài khoản</Link>
                <button type="button" onClick={signOut} className="min-h-11 rounded-xl bg-[#604273] text-sm font-bold text-[#fffdf7]">Đăng xuất</button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="portal-content" className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
        {children}
      </main>

      <footer className="mt-auto border-t border-[#28212e]/10 bg-[#ebe5d9]">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
          <div>
            <Link to={homeTo} className="inline-flex items-center gap-2 font-bold text-[#28212e] no-underline"><BrandLogo markClass="h-7" nameClass="text-sm font-bold text-[#28212e]" /></Link>
            <p className="mt-3 max-w-xs text-xs leading-5 text-[#6f6675]">Không gian nghề nghiệp của bạn, bớt nghi thức và nhiều lần thử hơn.</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#604273]">{group.title}</h2>
              <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-xs">
                {group.links.map((item) => <li key={`${group.title}-${item.label}`}><Link to={item.to} className="text-[#6f6675] no-underline transition hover:text-[#604273]">{item.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#28212e]/10 px-5 py-4 text-center font-mono text-[9px] uppercase tracking-widest text-[#6f6675]">AI Interview · tín hiệu từ Việt Nam · © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};

export default PortalShell;
