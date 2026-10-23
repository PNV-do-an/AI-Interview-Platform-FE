import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Card, EmptyState, PageHeader, buttonClass,
} from '../components/ui';

/**
 * SCR-08 "Trung tâm thông báo" (FR-SCH-07). Backend CHƯA có endpoint /notifications
 * (xem spec/INDEX.md) — hệ thống chỉ gửi email side-effect theo cờ trong
 * GET/PUT /admin/settings. Vì luật "chỉ đồ thật", màn này KHÔNG bịa danh sách thông báo:
 * nó hiển thị empty state trung thực + giải thích kênh báo hiện có, chờ API.
 */
const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const firstName = (user?.fullName || user?.email || '').split(' ')[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Thông báo"
        description={firstName ? `Thông tin cập nhật về tài khoản của ${firstName}.` : 'Thông tin cập nhật về tài khoản.'}
      />

      <Card className="mb-4">
        <EmptyState
          icon="notifications_none"
          title="Chưa có thông báo nào"
          description="Chưa có thông báo trong ứng dụng — backend hiện chưa có endpoint notifications. Email vẫn gửi khi đặt lịch phỏng vấn và các sự kiện tài khoản."
          action={
            <Link to="/dashboard" className={`${buttonClass('secondary')} no-underline`}>
              Về trang tổng quan
            </Link>
          }
        />
      </Card>

      <Card>
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-ink-variant">mark_email_read</span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-label-md text-ink">Kênh báo hiện đang hoạt động</p>
            <p className="m-0 text-body-sm text-ink-variant">
              Lịch hẹn được xác nhận, nhắc phỏng vấn và quyết định duyệt tin đều gửi qua email.
              Quản trị viên bật/tắt từng loại trong phần cấu hình hệ thống.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
