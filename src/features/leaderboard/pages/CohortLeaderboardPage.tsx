import { useAuthStore } from '@/features/auth';
import { LeaderboardPage } from './LeaderboardPage';

// SCR-F7-04: legacy cohort route (removed in wave 4). Class and organization
// cohort boards are tabs of LeaderboardPage; this route opens on the class board
// when the user may see class standings, otherwise on the organization board.

export function CohortLeaderboardPage() {
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.roles.includes('platform_admin') ?? false;
  const hasClassAccess =
    !isPlatformAdmin && (user?.permissions ?? []).includes('gamification:class:read');

  return <LeaderboardPage defaultTab={hasClassAccess ? 'class' : 'organization'} />;
}

export default CohortLeaderboardPage;
