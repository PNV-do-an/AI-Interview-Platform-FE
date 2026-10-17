import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './views/components/ProtectedRoute';
import LoginPage from './views/pages/LoginPage';
import RegisterPage from './views/pages/RegisterPage';
import DashboardPage from './views/pages/DashboardPage';
import AdminUserManagementPage from './views/pages/AdminUserManagementPage';
import UnauthorizedPage from './views/pages/UnauthorizedPage';
import ForgotPasswordPage from './views/pages/ForgotPasswordPage';
import ResetPasswordPage from './views/pages/ResetPasswordPage';
import VerifyEmailPage from './views/pages/VerifyEmailPage';
import JobsPage from './views/pages/JobsPage';
import JobDetailPage from './views/pages/JobDetailPage';
import JobFormPage from './views/pages/JobFormPage';
import MyJobsPage from './views/pages/MyJobsPage';
import MySlotsPage from './views/pages/MySlotsPage';
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />

          {/* Protected routes — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Job browsing (any authenticated user) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/employers/:id/reviews" element={<EmployerReviewsPage />} />
            <Route path="/bug-reports" element={<BugReportsPage />} />
          </Route>

          {/* Employer / mentor routes */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_INTERVIEWER', 'ROLE_ADMIN', 'ROLE_STAFF']} />}>
            <Route path="/jobs/new" element={<JobFormPage />} />
            <Route path="/jobs/:id/edit" element={<JobFormPage />} />
            <Route path="/my-jobs" element={<MyJobsPage />} />
            <Route path="/my-slots" element={<MySlotsPage />} />
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
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
          </Route>

          {/* Admin & staff routes */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']} />}>
            <Route path="/admin/packages" element={<PackageManagementPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
