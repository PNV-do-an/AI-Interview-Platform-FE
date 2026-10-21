import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './views/components/ProtectedRoute';
import AppLayout from './views/layout/AppLayout';
import AdminLayout from './views/layout/AdminLayout';
import LoginPage from './views/pages/LoginPage';
import RegisterPage from './views/pages/RegisterPage';
import DashboardPage from './views/pages/DashboardPage';
import AdminUserManagementPage from './views/pages/AdminUserManagementPage';
import AdminAuditLogPage from './views/pages/AdminAuditLogPage';
import AdminCategoryPage from './views/pages/AdminCategoryPage';
import UnauthorizedPage from './views/pages/UnauthorizedPage';
import ForgotPasswordPage from './views/pages/ForgotPasswordPage';
import ResetPasswordPage from './views/pages/ResetPasswordPage';
import VerifyEmailPage from './views/pages/VerifyEmailPage';
import CheckEmailPage from './views/pages/CheckEmailPage';
import JobsPage from './views/pages/JobsPage';
import JobDetailPage from './views/pages/JobDetailPage';
import JobFormPage from './views/pages/JobFormPage';
import MyJobsPage from './views/pages/MyJobsPage';
import MySlotsPage from './views/pages/MySlotsPage';
import InterviewCalendarPage from './views/pages/InterviewCalendarPage';
import MyApplicationsPage from './views/pages/MyApplicationsPage';
import CandidateProfilePage from './views/pages/CandidateProfilePage';
import MockInterviewsPage from './views/pages/MockInterviewsPage';
import MockInterviewSessionPage from './views/pages/MockInterviewSessionPage';
import MockInterviewResultPage from './views/pages/MockInterviewResultPage';
import CvAnalyzerPage from './views/pages/CvAnalyzerPage';
import CoverLettersPage from './views/pages/CoverLettersPage';
import PackagesPage from './views/pages/PackagesPage';
import MyOrdersPage from './views/pages/MyOrdersPage';
import PackageManagementPage from './views/pages/PackageManagementPage';
import EmployerReviewsPage from './views/pages/EmployerReviewsPage';
import BugReportsPage from './views/pages/BugReportsPage';
import AdminFeedbackPage from './views/pages/AdminFeedbackPage';
import LandingPage from './views/pages/LandingPage';
import PublicJobBoardPage from './views/pages/PublicJobBoardPage';
import TwoFactorPage from './views/pages/TwoFactorPage';
import MagicLinkPage from './views/pages/MagicLinkPage';
import DeviceCheckPage from './views/pages/DeviceCheckPage';
import JobApprovalPage from './views/pages/JobApprovalPage';
import JobReviewDetailPage from './views/pages/JobReviewDetailPage';
import JobModerationHistoryPage from './views/pages/JobModerationHistoryPage';
import AdminDashboardPage from './views/pages/AdminDashboardPage';
import AdminUserDetailPage from './views/pages/AdminUserDetailPage';
import AdminRolePermissionPage from './views/pages/AdminRolePermissionPage';
import AdminSystemSettingsPage from './views/pages/AdminSystemSettingsPage';
import AdminAccountSettingsPage from './views/pages/AdminAccountSettingsPage';
import CandidateEvaluationPage from './views/pages/CandidateEvaluationPage';
import RubricStudioPage from './views/pages/RubricStudioPage';
import HiringAnalyticsPage from './views/pages/HiringAnalyticsPage';

/** Trang chủ: tiếp thị cho người chưa đăng nhập, vào thẳng workspace cho người đã đăng nhập. */
const HomeRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/two-factor" element={<TwoFactorPage />} />
          <Route path="/magic-link" element={<MagicLinkPage />} />
          <Route path="/opportunities" element={<PublicJobBoardPage />} />

          {/* Protected routes — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/employers/:id/reviews" element={<EmployerReviewsPage />} />
              <Route path="/bug-reports" element={<BugReportsPage />} />

              {/* Employer / mentor routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_INTERVIEWER', 'ROLE_ADMIN', 'ROLE_STAFF']} />}>
                <Route path="/jobs/new" element={<JobFormPage />} />
                <Route path="/jobs/:id/edit" element={<JobFormPage />} />
                <Route path="/my-jobs" element={<MyJobsPage />} />
                <Route path="/my-slots" element={<MySlotsPage />} />
                <Route path="/my-slots/calendar" element={<InterviewCalendarPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
              </Route>

              {/* Candidate routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_USER']} />}>
                <Route path="/my-applications" element={<MyApplicationsPage />} />
                <Route path="/my-profile" element={<CandidateProfilePage />} />
                <Route path="/mock-interviews" element={<MockInterviewsPage />} />
                <Route path="/mock-interviews/:id" element={<MockInterviewSessionPage />} />
                <Route path="/mock-interviews/:id/result" element={<MockInterviewResultPage />} />
                <Route path="/cv-analyzer" element={<CvAnalyzerPage />} />
                <Route path="/cover-letters" element={<CoverLettersPage />} />
                <Route path="/device-check" element={<DeviceCheckPage />} />
              </Route>

              {/* Screens mockup chưa có backend: dựng tĩnh, chỉ route để soi UI, chưa gắn vào sidebar */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_INTERVIEWER', 'ROLE_ADMIN', 'ROLE_STAFF']} />}>
                <Route path="/candidates/:id/evaluation" element={<CandidateEvaluationPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']} />}>
                {/* Rubric Studio + Hiring Analytics không có trong bộ mockup admin 2026-10-21:
                    giữ route, mở bằng link trong màn Cấu hình AI / Tổng quan chứ không có item sidebar. */}
                <Route path="/admin/rubrics" element={<RubricStudioPage />} />
                <Route path="/admin/analytics" element={<HiringAnalyticsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Admin Console: shell riêng theo mockup Stitch (aside w-72 + header) cho mọi route /admin/*.
              Guard role khớp từng route với sidebar trong AdminLayout để không dẫn tới 403. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']} />}>
                <Route path="/admin/job-approvals" element={<JobApprovalPage />} />
                <Route path="/admin/job-approvals/history" element={<JobModerationHistoryPage />} />
                <Route path="/admin/job-approvals/:id" element={<JobReviewDetailPage />} />
                <Route path="/admin/packages" element={<PackageManagementPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUserManagementPage />} />
                <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                <Route path="/admin/roles" element={<AdminRolePermissionPage />} />
                <Route path="/admin/categories" element={<AdminCategoryPage />} />
                <Route path="/admin/audit" element={<AdminAuditLogPage />} />
                <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
                <Route path="/admin/account" element={<AdminAccountSettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
