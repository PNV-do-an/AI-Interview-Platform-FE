import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Trang chủ' },
  { to: '/opportunities', label: 'Tìm việc làm' },
  { to: '/ai-interview', label: 'Luyện AI' },
  { to: '/cv-builder', label: 'Tạo CV' },
  { to: '/pricing', label: 'Bảng giá' },
];

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="public-shell flex min-h-screen flex-col font-sans antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#d5ef6c] focus:px-4 focus:py-3 focus:font-bold focus:text-[#28212e]">
        Bỏ qua điều hướng
      </a>
      <header className="public-header sticky top-0 z-50">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 no-underline" aria-label="AI Interview — Trang chủ">
            <span className="flex size-10 items-center justify-center rounded-[14px] border border-[#604273]/20 bg-[#e9dff0]">
              <BrandLogo markClass="h-7" nameClass="hidden" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-[-0.04em] text-[#28212e] sm:text-base">AI Interview</span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#6f6675]">career lab / VN</span>
            </span>
          </Link>

          <nav className="public-nav hidden items-center gap-1 rounded-2xl border border-[#28212e]/10 bg-[#fffdf7]/65 p-1 lg:flex" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `public-nav-link inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold no-underline ${isActive ? 'bg-[#fffdf7] text-[#28212e] shadow-sm' : ''}`}
              >
                <span className="font-mono text-[9px] opacity-50">0{index + 1}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link to="/login" className="px-2 py-2 text-sm font-semibold text-[#4d4654] no-underline transition hover:text-[#604273]">Đăng nhập</Link>
            <Link to="/register" className="public-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold no-underline">
              Vào phòng thử<span aria-hidden="true">↗</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#28212e]/15 bg-[#fffdf7] text-[#28212e] transition hover:bg-[#e9dff0] lg:hidden"
          >
            <span className="material-symbols-outlined" aria-hidden="true">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {menuOpen && (
          <div id="public-mobile-menu" className="border-t border-[#28212e]/10 bg-[#f3efe6] px-4 pb-5 pt-3 shadow-lg lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Điều hướng điện thoại">
              {NAV_ITEMS.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold no-underline ${isActive ? 'bg-[#e9dff0] text-[#4f3569]' : 'text-[#28212e]'}`}
                >
                  <span className="font-mono text-xs text-[#ee795f]">0{index + 1}</span>{item.label}
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#28212e]/10 pt-3 sm:hidden">
                <Link to="/login" className="flex min-h-11 items-center justify-center rounded-xl border border-[#28212e]/15 bg-[#fffdf7] text-sm font-semibold text-[#28212e] no-underline">Đăng nhập</Link>
                <Link to="/register" className="public-cta flex min-h-11 items-center justify-center rounded-xl text-sm font-bold no-underline">Đăng ký</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="min-h-0 flex-1">{children}</main>

      <footer className="public-footer">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10 lg:py-16">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2.5 text-[#fffdf7] no-underline">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#fffdf7]/10"><BrandLogo markClass="h-7" nameClass="hidden" /></span>
              <span className="text-base font-bold tracking-tight">AI Interview</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[#e7dce9]/80">Một phòng thử nhỏ cho những bước đi nghề nghiệp lớn. Diễn tập, hoàn thiện hồ sơ và gặp cơ hội mới.</p>
            <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#d5ef6c]">
              <span className="size-2 rounded-full bg-[#d5ef6c]" aria-hidden="true" />Trạm đang phát tín hiệu
            </span>
          </div>
          <div>
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5ef6c]">Khám phá</h2>
            <ul className="mt-4 flex list-none flex-col gap-3 p-0 text-sm">
              <li><Link to="/opportunities" className="no-underline">Cơ hội nghề nghiệp</Link></li>
              <li><Link to="/ai-interview" className="no-underline">Luyện phỏng vấn AI</Link></li>
              <li><Link to="/pricing" className="no-underline">Gói dịch vụ</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5ef6c]">Bắt đầu</h2>
            <ul className="mt-4 flex list-none flex-col gap-3 p-0 text-sm">
              <li><Link to="/register" className="no-underline">Tạo tài khoản</Link></li>
              <li><Link to="/login" className="no-underline">Đăng nhập</Link></li>
              <li><Link to="/opportunities" className="no-underline">Tìm việc làm</Link></li>
            </ul>
          </div>
          <div className="flex flex-col items-start justify-between gap-6 md:items-end">
            <span className="rotate-2 rounded-lg border border-[#fffdf7]/20 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#fffdf7]/70">Được làm ở Trái Đất</span>
            <p className="m-0 text-left text-xs text-[#e7dce9]/65 md:text-right">© {new Date().getFullYear()} AI Interview Platform<br />Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicShell;
