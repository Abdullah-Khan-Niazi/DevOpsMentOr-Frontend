import { useSessionValidator } from '@/features/auth';
import { AppRoutes } from './routes';

export default function App() {
  useSessionValidator();
  return <AppRoutes />;
}
