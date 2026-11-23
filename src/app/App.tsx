import { useSessionValidator } from '@/features/auth/hooks/useSessionValidator';
import { ToastViewport } from '@/shared/components/Toast';
import { AppRoutes } from './routes';
import { ScrollToTop } from './ScrollToTop';

export default function App() {
  useSessionValidator();
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <ToastViewport />
    </>
  );
}
