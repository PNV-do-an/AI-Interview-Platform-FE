/**
 * Wrapper cho route public /ai-interview: bọc MockInterviewsMarketingPage trong PublicShell
 * để có header/footer marketing nhất quán. Route ứng viên /mock-interviews dùng
 * MockInterviewsPage (portal luyện tập thật) trực tiếp — CandidateLayout đã có sidebar/header riêng.
 */
import React from 'react';
import PublicShell from '../layout/PublicShell';
import MockInterviewsMarketingPage from './MockInterviewsMarketingPage';

const MockInterviewsPublicPage: React.FC = () => (
  <PublicShell>
    <MockInterviewsMarketingPage />
  </PublicShell>
);

export default MockInterviewsPublicPage;
