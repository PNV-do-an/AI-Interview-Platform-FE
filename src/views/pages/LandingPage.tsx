import React, { useEffect, useRef } from 'react';
import PublicShell from '../layout/PublicShell';
import { ClosingSection, FeatureSection, HowItWorksSection, LandingHero, TrustStrip } from '../components/LandingSections';
import '../components/landing.css';

const LandingPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const targets = Array.from(page.querySelectorAll<HTMLElement>('[data-reveal]'));
    targets.forEach((target) => target.classList.add('landing-reveal-pending'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -32px 0px' });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <PublicShell>
      <div ref={pageRef} className="landing-page overflow-hidden text-slate-900">
        <LandingHero />
        <TrustStrip />
        <FeatureSection />
        <HowItWorksSection />
        <ClosingSection />
      </div>
    </PublicShell>
  );
};

export default LandingPage;
