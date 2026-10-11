import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { AuthContextPanel } from './AuthContextPanel';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <AuthContextPanel />

      <main className="auth-panel">
        <div className="auth-panel__inner">
          <div className="mb-4">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-card-foreground transition-colors group select-none py-1"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Homepage</span>
            </Link>
          </div>
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-sub">{subtitle}</p> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
