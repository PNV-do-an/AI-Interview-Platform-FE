import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalShell, { PortalNavItem } from './PortalShell';

/**
 * Khu vực nhà tuyển dụng: chrome công khai giống trang chủ, không dùng sidebar admin.
 * Chỉ ROLE_INTERVIEWER đi vào shell này; staff/admin vẫn dùng AppLayout/AdminLayout.
 */

const NAV_ITEMS: PortalNavItem[] = [
  { to: '/dashboard', label: 'Tổng quan', end: true },
  { to: '/my-jobs', label: 'Tin tuyển dụng' },
  { to: '/jobs/new', label: 'Đăng tin mới' },
  // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
  // { to: '/my-slots', label: 'Lịch rảnh', end: true },
  // { to: '/my-slots/calendar', label: 'Lịch phỏng vấn' },
  { to: '/payments', label: 'Ví & thanh toán' },
];

const QUICK_LINKS = [
  { label: 'Nạp tiền vào ví', to: '/wallet' },
  { label: 'Gói dịch vụ', to: '/packages' },
  { label: 'Đơn hàng của tôi', to: '/my-orders' },
  // TẠM TẮT (24/11/2026): booking/mentor
  // { label: 'Lịch sử phỏng vấn', to: '/my-bookings' },
  // { label: 'Bảng giá mentor', to: '/mentor-pricing' },
  { label: 'Rút tiền', to: '/withdrawals' },
  { label: 'Trợ giúp & hỗ trợ', to: '/bug-reports' },
];

const FOOTER_GROUPS = [
  {
    title: 'Tuyển dụng',
    links: [
      { label: 'Đăng tin mới', to: '/jobs/new' },
      { label: 'Quản lý tin đăng', to: '/my-jobs' },
      // TẠM TẮT (24/11/2026): đặt lịch phỏng vấn
      // { label: 'Lịch rảnh', to: '/my-slots' },
      // { label: 'Lịch phỏng vấn', to: '/my-slots/calendar' },
    ],
  },
  {
    title: 'Dịch vụ',
    links: [
      { label: 'Gói dịch vụ', to: '/packages' },
      { label: 'Đơn hàng', to: '/my-orders' },
      // TẠM TẮT (24/11/2026): booking/mentor
      // { label: 'Đánh giá ứng viên', to: '/my-bookings' },
      // { label: 'Bảng giá mentor', to: '/mentor-pricing' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm trợ giúp', to: '/bug-reports' },
      { label: 'Thông báo', to: '/notifications' },
      { label: 'Đánh giá doanh nghiệp', to: '/employers/1/reviews' },
    ],
  },
];

const EmployerLayout: React.FC = () => (
  <PortalShell
    navItems={NAV_ITEMS}
    roleLabel="Nhà tuyển dụng"
    homeTo="/dashboard"
    accountTo="/dashboard"
    quickLinks={QUICK_LINKS}
    footerGroups={FOOTER_GROUPS}
  >
    <Outlet />
  </PortalShell>
);

export default EmployerLayout;
