import type { ReactNode } from 'react';
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
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-sub">{subtitle}</p> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
