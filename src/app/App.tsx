import { useSessionValidator } from '@/features/auth';
import { AppRoutes } from './routes';
import { ScrollToTop } from './ScrollToTop';

export default function App() {
  useSessionValidator();
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
    </>
  );
}
