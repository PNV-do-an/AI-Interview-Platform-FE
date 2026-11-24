import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Shell công khai dùng chung cho khu vực ứng viên và nhà tuyển dụng.
 *
 * Mục tiêu: hai khu vực này trông như một trang web thật (header trong, footer tối,
 * nội dung max-w-7xl) thay vì console quản trị có sidebar cố định. Admin vẫn dùng
 * AdminLayout riêng.
 */

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
  {
    title: 'Dành cho ứng viên',
    links: [
      { label: 'Tìm việc làm', to: '/jobs' },
      { label: 'Luyện phỏng vấn AI', to: '/mock-interviews' },
      { label: 'Phân tích CV', to: '/cv-analyzer' },
      { label: 'Lộ trình ôn tập', to: '/study' },
    ],
  },
  {
    title: 'Dành cho nhà tuyển dụng',
    links: [
      { label: 'Đăng tin tuyển dụng', to: '/jobs/new' },
      { label: 'Quản lý tin đăng', to: '/my-jobs' },
      // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
      // { label: 'Lịch phỏng vấn', to: '/my-slots' },
      { label: 'Gói dịch vụ', to: '/packages' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm trợ giúp', to: '/bug-reports' },
      { label: 'Gửi báo lỗi', to: '/bug-reports' },
      { label: 'Thông báo', to: '/notifications' },
    ],
  },
];

const initialsOf = (name: string): string =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

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

  const displayName = user?.fullName || user?.email || 'Tài khoản';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased theme-home">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-[0_1px_12px_rgba(15,23,42,0.05)]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <Link to={homeTo} className="flex items-center gap-2.5 group no-underline flex-shrink-0" aria-label="AI Interview">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YLWyXI6zV1VNWAKua3PkKH0HlTIdIzUbhb6YPTr3VBuL4Ga2KVW0j2WBifvbBD5AhD60T-nSrRLjB3nO8huiGt1WK2ISAoeF191cowURaM_WVq3f7Pbcs64rDRYhOjqlSKARz9L0_m4RDfINtIOPP8QmCzQqCpGg7qHwmYKYvC-qZt4XCtxVlqvwir9tQRjAJfbjq7kI0IfKwPwr7XAqlg4nzz8wpjSmabI5Y2vo7yE3-ESQuud9"
              alt="AI Interview"
              className="w-8 h-8 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-[17px] font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors whitespace-nowrap">
              AI Interview
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 bg-slate-100/80 rounded-full p-1 border border-slate-200/60" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-all no-underline whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link
              to="/notifications"
              aria-label="Thông báo"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[21px]">notifications</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm hover:border-indigo-300 hover:shadow transition-all"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {initialsOf(displayName)}
                </span>
                <span className="hidden md:flex flex-col items-start leading-tight">
                  <span className="max-w-[150px] truncate text-xs font-semibold text-slate-900">{displayName}</span>
                  <span className="text-[10px] font-medium text-indigo-600">{roleLabel}</span>
                </span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="m-0 truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="m-0 text-xs text-slate-500">{roleLabel}</p>
                  </div>
                  <div className="py-1">
                    {[{ label: 'Tài khoản của tôi', to: accountTo }, ...quickLinks].map((link) => (
                      <Link
                        key={`${link.to}-${link.label}`}
                        to={link.to}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 no-underline"
                      >
                        <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 border-0 bg-transparent cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
          >
            <span className="material-symbols-outlined text-[22px]">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm font-medium no-underline transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
                <Link to={accountTo} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50">
                  Tài khoản của tôi
                </Link>
                <Link to="/notifications" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50">
                  Thông báo
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white border-0 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>

      <footer className="bg-slate-900 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Link to={homeTo} className="flex items-center gap-2.5 no-underline w-fit group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YLWyXI6zV1VNWAKua3PkKH0HlTIdIzUbhb6YPTr3VBuL4Ga2KVW0j2WBifvbBD5AhD60T-nSrRLjB3nO8huiGt1WK2ISAoeF191cowURaM_WVq3f7Pbcs64rDRYhOjqlSKARz9L0_m4RDfINtIOPP8QmCzQqCpGg7qHwmYKYvC-qZt4XCtxVlqvwir9tQRjAJfbjq7kI0IfKwPwr7XAqlg4nzz8wpjSmabI5Y2vo7yE3-ESQuud9"
                  alt="AI Interview"
                  className="w-8 h-8 rounded-xl object-contain"
                />
                <span className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">AI Interview</span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Nền tảng luyện phỏng vấn AI và kết nối cơ hội nghề nghiệp dành cho ứng viên và nhà tuyển dụng tại Việt Nam.
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <span className="text-xs font-bold text-white uppercase tracking-widest">{group.title}</span>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors no-underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              © {new Date().getFullYear()} AI Interview Platform. Mọi quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Hệ thống đang hoạt động
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalShell;
