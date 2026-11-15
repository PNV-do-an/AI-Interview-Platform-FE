/**
 * Wrapper cho route public /ai-interview: bọc MockInterviewsPage trong PublicShell
 * để có header/footer marketing nhất quán. Route ứng viên /mock-interviews dùng
 * MockInterviewsPage trực tiếp (CandidateLayout đã có sidebar/header riêng).
 */
import React from 'react';
import PublicShell from '../layout/PublicShell';
import MockInterviewsPage from './MockInterviewsPage';

const MockInterviewsPublicPage: React.FC = () => (
  <PublicShell>
    <MockInterviewsPage />
  </PublicShell>
);

export default MockInterviewsPublicPage;
