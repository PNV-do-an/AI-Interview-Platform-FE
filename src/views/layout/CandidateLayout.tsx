import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalShell, { PortalNavItem } from './PortalShell';

/**
 * Khu vực ứng viên: dùng chrome công khai giống trang chủ (header trong + footer tối),
 * không còn sidebar kiểu admin. Các trang con tự render nội dung trong max-w-7xl.
 */

const NAV_ITEMS: PortalNavItem[] = [
  { to: '/dashboard', label: 'Tổng quan', end: true },
  { to: '/jobs', label: 'Tìm việc làm' },
  { to: '/my-applications', label: 'Đơn ứng tuyển' },
  // TẠM TẮT (24/11/2026): lịch phỏng vấn
  // { to: '/my-interviews', label: 'Lịch phỏng vấn' },
  { to: '/mock-interviews', label: 'Luyện AI' },
  { to: '/payments', label: 'Ví & thanh toán' },
];

const QUICK_LINKS = [
  { label: 'Hồ sơ & CV', to: '/my-profile' },
  { label: 'Nạp tiền vào ví', to: '/wallet' },
  { label: 'Gói dịch vụ & nâng cấp', to: '/packages' },
  { label: 'Thư xin việc', to: '/cover-letters' },
  { label: 'Lộ trình ôn tập', to: '/study' },
  { label: 'Trợ giúp & hỗ trợ', to: '/bug-reports' },
];

const FOOTER_GROUPS = [
  {
    title: 'Ứng viên',
    links: [
      { label: 'Tìm việc làm', to: '/jobs' },
      { label: 'Đơn ứng tuyển', to: '/my-applications' },
      // TẠM TẮT (24/11/2026): lịch phỏng vấn
      // { label: 'Lịch phỏng vấn', to: '/my-interviews' },
      { label: 'Luyện phỏng vấn AI', to: '/mock-interviews' },
    ],
  },
  {
    title: 'Công cụ',
    links: [
      { label: 'Phân tích CV', to: '/cv-analyzer' },
      { label: 'Hồ sơ & CV', to: '/my-profile' },
      { label: 'Lộ trình ôn tập', to: '/study' },
      { label: 'Kiểm tra thiết bị', to: '/device-check' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm trợ giúp', to: '/bug-reports' },
      { label: 'Thông báo', to: '/notifications' },
      { label: 'Cài đặt tài khoản', to: '/account' },
    ],
  },
];

const CandidateLayout: React.FC = () => (
  <PortalShell
    navItems={NAV_ITEMS}
    roleLabel="Ứng viên"
    homeTo="/dashboard"
    accountTo="/account"
    quickLinks={QUICK_LINKS}
    footerGroups={FOOTER_GROUPS}
  >
    <Outlet />
  </PortalShell>
);

export default CandidateLayout;
