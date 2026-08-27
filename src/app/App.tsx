import { useSessionValidator } from '@/features/auth';
import { ToastViewport } from '@/shared/components';
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
