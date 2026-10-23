import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoWordmark from '../../assets/logo-wordmark.png';

/**
 * SCR-31 "Trang lỗi ... 404" (FR-AUTH-07). Trang độc lập, mở được cho cả khách lẫn
 * người đã đăng nhập khi vào URL không tồn tại. KHÔNG tự đổi hướng về /dashboard nữa:
 * người dùng cần thấy rõ là trang không tồn tại (định mục 10.2 NOT_FOUND).
 */
const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const homeTo = isAuthenticated ? '/dashboard' : '/';
  const homeLabel = isAuthenticated ? 'Back to overview' : 'Back to home';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 text-center font-sans text-ink">
      <Link to="/" className="inline-flex items-center no-underline">
        <img src={logoWordmark} alt="AI Interview" className="h-5 w-auto object-contain" />
      </Link>

      <span className="font-mono text-[64px] font-bold leading-none text-primary">404</span>

      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-headline-md text-ink">Page not found</h1>
        <p className="m-0 max-w-md text-body-md text-ink-variant">
          We couldn't find the page you're looking for. It may have been moved or no longer exists.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to={homeTo}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-label-md font-medium text-on-primary no-underline transition-colors hover:bg-primary-hover"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          {homeLabel}
        </Link>
        {isAuthenticated && (
          <Link
            to="/jobs"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-card px-4 text-label-md font-medium text-ink no-underline transition-colors hover:bg-surface-low"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Browse jobs
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
