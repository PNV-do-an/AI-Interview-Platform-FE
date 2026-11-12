import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './mockup.css';

/**
 * Render HTML xuất từ Stitch. Mockup là prototype tĩnh nên phần tương tác (toggle giá,
 * modal ứng tuyển, filter mentor, accordion...) nằm trong <script> rời của file export;
 * `scripts` được chạy lại sau khi HTML vào DOM. Điều hướng đọc `data-path` hoặc nhãn của
 * thẻ <a href="#"> vì mockup không gắn route thật.
 */

const TEXT_TO_KEY: Record<string, string> = {
  'AI Interview': 'trang-chu',
  'Trang chủ': 'trang-chu',
  'Tìm việc làm': 'tim-viec-lam',
  'Luyện phỏng vấn AI': 'phong-van-ai',
  'Chuyên gia Mentor': 'chuyen-gia-mentor',
  'Bảng giá': 'bang-gia',
  'Đăng nhập': 'dang-nhap',
  'Đăng ký miễn phí': 'dang-ky',
  'Đăng ký ngay': 'dang-ky',
  'Tạo tài khoản miễn phí ngay': 'dang-ky',
  'Bắt đầu miễn phí': 'dang-ky',
  'Nâng cấp gói Pro': 'dang-ky',
  'Đăng ký gói Mentor VIP': 'dang-ky',
  'Đăng ký trở thành Mentor': 'dang-ky',
  'Gia nhập AI Interview': 'dang-ky',
  'Trở thành Mentor': 'dang-ky',
  'Dành cho doanh nghiệp': 'dang-ky',
  'Dùng thử miễn phí 1 buổi': 'phong-van-ai',
  'Trải nghiệm thử AI': 'phong-van-ai',
  'Bắt đầu luyện tập ngay': 'phong-van-ai',
  'Thử phòng luyện tập ngay': 'phong-van-ai',
  'Mô phỏng phỏng vấn AI': 'phong-van-ai',
  'Phân tích giọng nói & cử chỉ': 'phong-van-ai',
  'Báo cáo chỉ số năng lực': 'phong-van-ai',
  'Ngân hàng câu hỏi chuẩn': 'phong-van-ai',
  'Kết nối nhà tuyển dụng': 'phong-van-ai',
  'Tìm cố vấn phù hợp': 'chuyen-gia-mentor',
  'Tư vấn lộ trình cùng chuyên gia': 'chuyen-gia-mentor',
  'Đội ngũ chuyên gia': 'chuyen-gia-mentor',
  'Tìm hiểu chính sách & Quyền lợi': 'chuyen-gia-mentor',
  'Khám phá việc làm': 'tim-viec-lam',
  'Xem tất cả 500+ vị trí tuyển dụng khác': 'tim-viec-lam',
  'Công nghệ thông tin': 'tim-viec-lam',
  'Trung tâm trợ giúp': 'ho-tro',
  'Giới thiệu công ty': 'trang-chu',
  'Tin tức & Sự kiện': 'trang-chu',
  'Liên hệ hợp tác': 'trang-chu',
  'Chính sách bảo mật': 'trang-chu',
  'Điều khoản dịch vụ': 'trang-chu',
  'Tiêu chuẩn AI minh bạch': 'trang-chu',
  'Đăng ký': 'dang-ky',
};

const STATIC_ROUTES: Record<string, string> = {
  'trang-chu': '/',
  'trang-ch': '/',
  'gioi-thieu': '/',
  'tin-tuc-su-kien': '/',
  'lien-he': '/',
  'chinh-sach-bao-mat': '/',
  'dieu-khoan-dich-vu': '/',
  'chuyen-gia-mentor': '/mentors',
  'doi-ngu-chuyen-gia': '/mentors',
  'mang-luoi-mentor': '/mentors',
  'chinh-sach-mentor': '/mentors',
  'bang-gia': '/pricing',
  'dang-nhap': '/login',
  'dang-ky': '/register',
  'dang-ky-mien-phi': '/register',
  'dang-ky-ngay': '/register',
  'dang-ky-mentor': '/register',
  'doi-tac-doanh-nghiep': '/register',
  'tuyen-dung-ai-interview': '/register',
  'danh-gia-nang-luc': '/ai-interview',
  'mo-phong-phong-van': '/ai-interview',
  'ngan-hang-cau-hoi': '/ai-interview',
  'phan-tich-giong-noi': '/ai-interview',
  'tieu-chuan-ai': '/ai-interview',
  'tong-quan': '/dashboard',
  'ho-so-cv': '/my-profile',
  'don-ung-tuyen': '/my-applications',
  'lich-phong-van': '/my-interviews',
  'lich-su-bao-cao': '/mock-interviews/history',
  'cai-dat': '/account',
};

const norm = (value: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

const runScripts = (code: string) => {
  if (!code.trim()) return;
  // `new Function` giữ code trong closure để chạy lại được nhiều lần (không đụng
  // khai báo `let/const` toàn cục), rồi gán các function ra window cho inline onclick.
  const names = Array.from(code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)).map((m) => m[1]);
  const expose = names.map((name) => `window[${JSON.stringify(name)}] = ${name};`).join('\n');
  // eslint-disable-next-line no-new-func
  const runner = new Function(`return (function(){\n${code}\n${expose}\n})();`);

  // Script export bọc trong DOMContentLoaded, nhưng React chèn HTML sau khi sự kiện đã
  // bắn -> chạy listener ngay lập tức thay vì đăng ký (tránh listener mồ côi trên document).
  const original = document.addEventListener;
  document.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (type === 'DOMContentLoaded') {
      try {
        const handler = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener);
        handler(new Event('DOMContentLoaded'));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
      return;
    }
    return original.call(document, type, listener, options);
  } as typeof document.addEventListener;

  try {
    runner();
  } finally {
    document.addEventListener = original;
  }
};

const MockupPage: React.FC<{ html: string; scripts?: string }> = ({ html, scripts }) => {
  const ref = useRef<HTMLDivElement & { __mockupScripts?: string }>(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // Mockup là trang đầy đủ (header/footer/aside riêng). Khi được render bên trong shell
  // (CandidateLayout/AppLayout có <main>), chỉ giữ nội dung <main> để không lặp chrome.
  useEffect(() => {
    const root = ref.current;
    if (!root || !root.closest('main') || root.dataset.mockupScoped === '1') return;
    root.dataset.mockupScoped = '1';
    Array.from(root.children).forEach((child) => {
      if (child.tagName === 'HEADER' || child.tagName === 'FOOTER' || child.tagName === 'ASIDE') child.remove();
    });
    const main = Array.from(root.children).find((child) => child.tagName === 'MAIN');
    if (main) root.innerHTML = main.innerHTML;
  }, [html]);

  useEffect(() => {
    if (!scripts) return;
    const root = ref.current;
    if (!root || root.__mockupScripts === scripts) return;
    root.__mockupScripts = scripts;
    runScripts(scripts);
  }, [scripts]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const resolve = (key: string): string | undefined => {
      if (key === 'tim-viec-lam' || key === 'tim-viec' || key === 'ket-noi-viec-lam') {
        return isAuthenticated ? '/jobs' : '/opportunities';
      }
      if (key === 'phong-van-ai' || key === 'luyen-phong-van-ai') {
        return isAuthenticated ? '/mock-interviews' : '/ai-interview';
      }
      if (key === 'ho-tro' || key === 'trung-tam-tro-giup') {
        return isAuthenticated ? '/bug-reports' : '/';
      }
      return STATIC_ROUTES[key];
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagged = target.closest('[data-path]') as HTMLElement | null;
      const key = tagged?.getAttribute('data-path') ?? undefined;
      if (key === 'dang-xuat') {
        event.preventDefault();
        logout();
        navigate('/login');
        return;
      }

      let route = key ? resolve(key) : undefined;
      if (!route) {
        const anchor = target.closest('a');
        const href = anchor?.getAttribute('href');
        if (anchor && (href === '#' || href === '')) {
          const label = norm(anchor.textContent);
          const matched = Object.keys(TEXT_TO_KEY)
            .filter((text) => label.includes(text))
            .sort((a, b) => b.length - a.length)[0];
          route = matched ? resolve(TEXT_TO_KEY[matched]) : undefined;
        }
      }

      if (route) {
        event.preventDefault();
        navigate(route);
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [navigate, isAuthenticated, logout]);

  return <div ref={ref} className="mockup-root" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MockupPage;
