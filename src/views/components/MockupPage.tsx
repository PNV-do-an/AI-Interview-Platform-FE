import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PATH_MAP: Record<string, string> = {
  'trang-chu': '/',
  'trang-ch': '/',
  'tim-viec-lam': '/opportunities',
  'tim-viec': '/opportunities',
  'phong-van-ai': '/mock-interviews',
  'luyen-phong-van-ai': '/mock-interviews',
  'chuyen-gia-mentor': '/opportunities',
  'bang-gia': '/packages',
  'dang-nhap': '/login',
  'dang-ky-mien-phi': '/register',
  'dang-ky-ngay': '/register',
  'dang-ky': '/register',
};

const MockupPage: React.FC<{ html: string }> = ({ html }) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('[data-path]') as HTMLElement | null;
      if (!target) return;
      const dataPath = target.getAttribute('data-path');
      if (!dataPath) return;
      event.preventDefault();
      const route = PATH_MAP[dataPath];
      if (route) {
        navigate(route);
      } else {
        // eslint-disable-next-line no-console
        console.log('Navigating to:', dataPath);
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [navigate]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MockupPage;