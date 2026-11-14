import { useSearchParams } from 'react-router-dom';
import { TabRow, type TabItem } from '@/shared/components';
import { AdminGamificationPage } from './AdminGamificationPage';
import AdminBadgesPage from './AdminBadgesPage';
import AdminAchievementsPage from './AdminAchievementsPage';
import AdminSeasonsPage from './AdminSeasonsPage';

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'badges', label: 'Badges' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'seasons', label: 'Seasons' },
];

/**
 * Single gamification surface (nav consolidation): overview, badges,
 * achievements and seasons are tabs of one page instead of four nav entries.
 * The tab is URL-driven so deep links keep working.
 */
export default function AdminGamificationHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab') ?? 'overview';
  const activeTab = TABS.some((tab) => tab.id === requested) ? requested : 'overview';

  const setTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-6">
      <TabRow items={TABS} activeId={activeTab} onChange={setTab} />
      {activeTab === 'badges' ? (
        <AdminBadgesPage />
      ) : activeTab === 'achievements' ? (
        <AdminAchievementsPage />
      ) : activeTab === 'seasons' ? (
        <AdminSeasonsPage />
      ) : (
        <AdminGamificationPage />
      )}
    </div>
  );
}
