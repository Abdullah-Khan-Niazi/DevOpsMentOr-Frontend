import type { ReactNode } from 'react';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';

/** Mounts the boot-time silent refresh once. Children render immediately; protected routes wait on `useAuthReady`. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  return <>{children}</>;
}
