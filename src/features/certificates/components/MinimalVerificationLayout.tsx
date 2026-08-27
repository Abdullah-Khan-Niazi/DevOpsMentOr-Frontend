import { SiteLogo } from '@/shared/components';
import type { ReactNode } from 'react';
import '../styles/certificates.css';

// SCR-F7-05 §09: minimal standalone layout for certificate verification —
// centered card, brand logo, no navigation, no authentication links. Safe to
// embed in LinkedIn or resume links.

interface MinimalVerificationLayoutProps {
  children: ReactNode;
}

export function MinimalVerificationLayout({ children }: MinimalVerificationLayoutProps) {
  return (
    <div className="verify-shell">
      <main className="verify-shell__inner">
        <a href="/" className="verify-shell__brand" aria-label="DevOps Mentor home">
          <SiteLogo />
        </a>
        {children}
      </main>
    </div>
  );
}

export default MinimalVerificationLayout;
