const fs=require('fs');
const files = [
  'src/views/pages/LandingPage.tsx',
  'src/views/pages/PublicJobBoardPage.tsx',
  'src/views/pages/JobDetailPage.tsx',
  'src/views/pages/PackagesPage.tsx',
  'src/views/pages/MockInterviewsPage.tsx',
  'src/views/pages/MockInterviewResultPage.tsx',
];
for (const f of files) {
  let s = fs.readFileSync(f,'utf8');
  s = s.replace("import React from 'react';\n", "import React from 'react';\nimport MockupPage from '../components/MockupPage';\n");
  s = s.replace("  return <div dangerouslySetInnerHTML={{ __html: PAGE_HTML }} />;", "  return <MockupPage html={PAGE_HTML} />;");
  // LandingPage uses LANDING_HTML
  s = s.replace("  return <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />;", "  return <MockupPage html={LANDING_HTML} />;");
  fs.writeFileSync(f,s,'utf8');
  console.log('updated', f);
}
