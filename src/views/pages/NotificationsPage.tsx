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
        title="Notifications"
        description={firstName ? `Account alerts for ${firstName}.` : 'Account alerts.'}
      />

      <Card className="mb-4">
        <EmptyState
          icon="notifications_none"
          title="No notifications yet"
          description="In-app alerts are not available yet — the backend has no notifications endpoint. You still receive email for interview scheduling and account events."
          action={
            <Link to="/dashboard" className={`${buttonClass('secondary')} no-underline`}>
              Back to overview
            </Link>
          }
        />
      </Card>

      <Card>
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-ink-variant">mark_email_read</span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-label-md text-ink">Where alerts come from today</p>
            <p className="m-0 text-body-sm text-ink-variant">
              Booking confirmations, interview reminders, and approval decisions are delivered by
              email. Delivery toggles are configured by an administrator under system settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
