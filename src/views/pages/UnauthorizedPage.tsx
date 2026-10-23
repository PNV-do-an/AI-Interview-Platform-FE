/**
 * Màn 403 "Bạn không có quyền truy cập trang này" — bản dựng lại theo mockup Stitch mới (2026-10-21).
 * Chrome tiếng Việt + token ds-* (adminKit), bỏ ảnh khoá svg và glow trang trí thừa theo
 * spec/conventions/frontend-ui.md mục 3-4.
 * Khối mockup không có nguồn dữ liệu nên đã cắt: email support@aiinterview.vn, hotline 1900 8888,
 * link footer System Status / Support Desk / Privacy. Ô "Phiên hiện tại" thay bằng email + vai trò
 * thật từ AuthContext (dùng nhãn tiếng Việt ROLE_VN).
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { ROLE_VN, adminButton } from '../components/adminKit';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full pt-space-xl px-margin flex justify-center items-center">
        <Link to="/" className="inline-flex items-center gap-space-sm no-underline text-inherit">
          <BrandLogo markClass="h-6" />
        </Link>
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center px-gutter py-space-xl">
        <div className="relative w-full max-w-3xl flex flex-col items-center">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-primary-fixed opacity-60 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-16 w-80 h-80 rounded-full bg-secondary-fixed opacity-50 blur-3xl pointer-events-none" />

          <div className="relative w-full bg-surface-container-lowest rounded-xl shadow-proof px-gutter py-space-xl md:p-space-2xl flex flex-col items-center text-center overflow-hidden">
            <span className="inline-flex items-center px-space-md py-1.5 rounded-full bg-surface-container-low text-ds-label-md text-on-surface-variant mb-space-lg">
              Hệ Thống Phỏng Vấn AI Thông Minh
            </span>

            <span className="w-16 h-16 rounded-full bg-surface-container-low border border-outline-variant/50 flex items-center justify-center text-error mb-space-md">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </span>

            <div className="text-ds-display-lg md:text-[88px] md:leading-[92px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface via-primary to-on-surface select-none">
              403
            </div>
            <h1 className="text-ds-headline-xl text-on-surface font-bold mb-space-xs">
              Bạn không có quyền truy cập trang này
            </h1>
            <p className="text-ds-body-lg text-on-surface-variant max-w-lg mx-auto mb-space-xl">
              Khu vực này được bảo vệ hoặc dành riêng cho người dùng được phân quyền. Vui lòng kiểm tra lại
              tài khoản hoặc liên hệ quản trị viên nếu bạn cho rằng đây là sự nhầm lẫn.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md w-full max-w-md mb-space-xl">
              <Link to="/dashboard" className={`${adminButton('primary', 'w-full sm:w-auto flex-1 shadow-md')} no-underline`}>
                <span className="material-symbols-outlined text-[20px]">home</span>
                Về trang chủ
              </Link>
              <button type="button" onClick={() => navigate(-1)} className={adminButton('ghost', 'w-full sm:w-auto flex-1')}>
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Quay lại
              </button>
            </div>

            <div className="w-full max-w-xl rounded-lg bg-surface-container-low p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-left">
              <div className="flex items-center gap-space-sm">
                <span className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Mã định danh lỗi</span>
                  <span className="text-ds-label-md text-on-surface font-medium">403_ACCESS_DENIED</span>
                </span>
              </div>
              <span className="hidden sm:block h-6 w-px bg-outline-variant" />
              <div className="flex flex-col">
                <span className="text-ds-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Phiên hiện tại</span>
                <span className="text-ds-label-md text-on-surface font-medium">
                  {user ? `${user.email} · ${ROLE_VN[user.role] ?? user.role}` : 'Chưa đăng nhập'}
                </span>
              </div>
            </div>

            {user && (
              <p className="mt-space-lg flex items-center gap-space-sm text-ds-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-secondary-teal" />
                Hệ thống ghi nhận phiên bảo mật của bạn đang hoạt động bình thường
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full pb-space-lg px-margin flex items-center justify-center text-center text-ds-body-sm text-on-surface-variant">
        <p>© 2026 AI Interview Platform. Bảo lưu toàn quyền.</p>
      </footer>
    </div>
  );
};

export default UnauthorizedPage;
