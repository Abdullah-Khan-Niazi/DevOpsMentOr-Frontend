import { Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicPageSkeleton } from '@/shared/components/Skeleton';
import { RouteErrorBoundary } from './RouteErrorBoundary';

export interface LazyPageProps {
  children: ReactNode;
  /** Layout-matching skeleton shown while the route chunk loads. */
  skeleton?: ReactNode;
}

/** Route wrapper for lazy pages: Suspense with a skeleton plus a route error boundary. */
export function LazyPage({ children, skeleton }: LazyPageProps) {
  const { pathname } = useLocation();
  return (
    <RouteErrorBoundary resetKey={pathname}>
      <Suspense fallback={skeleton ?? <PublicPageSkeleton />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}
