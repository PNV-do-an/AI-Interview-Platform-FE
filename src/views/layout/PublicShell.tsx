import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

/**
 * PublicShell – Header + Footer dùng chung cho 5 trang marketing public:
 *   /  (LandingPage)
 *   /opportunities  (PublicJobBoardPage)
 *   /ai-interview   (MockInterviewsPage)
 *   /mentors        (MentorsPage)
 *   /pricing        (PackagesPage)
 *
 * Thiết kế: capsule nav + scrolled-shadow header + mobile drawer + footer đầy đủ.
 * Các mockup page tự render <header> và <footer> trong HTML bên trong; MockupPage.tsx
 * strip chúng khi được đặt bên trong <main>.  PublicShell bọc bên ngoài nên không bị strip.
 */

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Trang chủ' },
  { to: '/opportunities', label: 'Tìm việc làm' },
  { to: '/ai-interview', label: 'Luyện phỏng vấn AI' },
  { to: '/mentors', label: 'Chuyên gia Mentor' },
  { to: '/pricing', label: 'Bảng giá' },
];

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-on-surface antialiased">
      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_12px_rgba(15,23,42,0.08)] border-b border-slate-200/60'
            : 'bg-white/80 backdrop-blur-sm border-b border-slate-200/40'
        }`}
      >
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group no-underline flex-shrink-0"
            aria-label="AI Interview – Trang chủ"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YLWyXI6zV1VNWAKua3PkKH0HlTIdIzUbhb6YPTr3VBuL4Ga2KVW0j2WBifvbBD5AhD60T-nSrRLjB3nO8huiGt1WK2ISAoeF191cowURaM_WVq3f7Pbcs64rDRYhOjqlSKARz9L0_m4RDfINtIOPP8QmCzQqCpGg7qHwmYKYvC-qZt4XCtxVlqvwir9tQRjAJfbjq7kI0IfKwPwr7XAqlg4nzz8wpjSmabI5Y2vo7yE3-ESQuud9"
              alt="AI Interview Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-[17px] font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors whitespace-nowrap">
              AI Interview
            </span>
          </Link>

          {/* Desktop Capsule Nav */}
          <nav
            className="hidden lg:flex items-center gap-0.5 bg-slate-100/70 rounded-full p-1 border border-slate-200/50"
            aria-label="Điều hướng chính"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
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

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors no-underline whitespace-nowrap"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all no-underline whitespace-nowrap"
            >
              Đăng ký miễn phí
            </Link>
          </div>

          {/* Mobile: CTA + Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/register"
              className="sm:hidden px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-all no-underline whitespace-nowrap"
            >
              Đăng ký
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors no-underline"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 transition-all no-underline"
              >
                Đăng ký miễn phí
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden border-t border-slate-200/60 bg-white/98 backdrop-blur-md"
            role="navigation"
            aria-label="Điều hướng mobile"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-xl text-sm font-medium transition-colors no-underline ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm text-center hover:bg-slate-50 transition-colors no-underline"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm text-center hover:bg-indigo-700 transition-all no-underline shadow-sm"
                >
                  Đăng ký miễn phí
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 pt-16 min-h-0">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-300">
        {/* Top section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <Link to="/" className="flex items-center gap-2.5 no-underline w-fit group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YLWyXI6zV1VNWAKua3PkKH0HlTIdIzUbhb6YPTr3VBuL4Ga2KVW0j2WBifvbBD5AhD60T-nSrRLjB3nO8huiGt1WK2ISAoeF191cowURaM_WVq3f7Pbcs64rDRYhOjqlSKARz9L0_m4RDfINtIOPP8QmCzQqCpGg7qHwmYKYvC-qZt4XCtxVlqvwir9tQRjAJfbjq7kI0IfKwPwr7XAqlg4nzz8wpjSmabI5Y2vo7yE3-ESQuud9"
                  alt="AI Interview"
                  className="w-8 h-8 rounded-xl object-contain"
                />
                <span className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">AI Interview</span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Nền tảng luyện phỏng vấn AI đầu tiên tại Việt Nam, kết hợp công nghệ giọng nói thời gian thực và mạng lưới mentor hàng đầu giúp bạn tự tin chinh phục mọi nhà tuyển dụng.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { href: '#', label: 'Facebook', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                  { href: '#', label: 'LinkedIn', icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                  { href: '#', label: 'YouTube', icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M9.75 15.02l5.75-3.02-5.75-3.02v6.04z' },
                ].map(({ href, label, icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d={icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {[
              {
                title: 'Sản phẩm',
                links: [
                  { label: 'Luyện phỏng vấn AI', to: '/ai-interview' },
                  { label: 'Tìm việc làm', to: '/opportunities' },
                  { label: 'Chuyên gia Mentor', to: '/mentors' },
                  { label: 'Bảng giá', to: '/pricing' },
                ],
              },
              {
                title: 'Công ty',
                links: [
                  { label: 'Giới thiệu', to: '/' },
                  { label: 'Tin tức & Sự kiện', to: '/' },
                  { label: 'Liên hệ hợp tác', to: '/' },
                  { label: 'Trung tâm trợ giúp', to: '/' },
                ],
              },
              {
                title: 'Pháp lý',
                links: [
                  { label: 'Chính sách bảo mật', to: '/' },
                  { label: 'Điều khoản dịch vụ', to: '/' },
                  { label: 'Tiêu chuẩn AI minh bạch', to: '/' },
                  { label: 'Cookie Policy', to: '/' },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title} className="flex flex-col gap-4">
                <span className="text-xs font-bold text-white uppercase tracking-widest">{title}</span>
                <ul className="flex flex-col gap-2.5">
                  {links.map(({ label, to }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-slate-400 hover:text-white transition-colors no-underline"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              © {new Date().getFullYear()} AI Interview Platform. Mọi quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Hệ thống đang hoạt động
              </span>
              <span className="mx-2">·</span>
              <span>Phiên bản 2.5.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicShell;
