import { TabPanel, TabSwitcher, type TabSwitcherItem } from '@/shared/components';
import { useUrlState } from '@/shared/hooks';
import { AdminGamificationPage } from './AdminGamificationPage';
import AdminBadgesPage from './AdminBadgesPage';
import AdminAchievementsPage from './AdminAchievementsPage';
import AdminSeasonsPage from './AdminSeasonsPage';

const TAB_IDS = ['overview', 'badges', 'achievements', 'seasons'] as const;
type GamificationTab = (typeof TAB_IDS)[number];

const TAB_ITEMS: ReadonlyArray<TabSwitcherItem<GamificationTab>> = [
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
  const [activeTab, setActiveTab] = useUrlState<GamificationTab>('tab', TAB_IDS, 'overview');

  return (
    <div className="space-y-6">
      <TabSwitcher
        items={TAB_ITEMS}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Gamification sections"
        idPrefix="gamification"
      />
      <TabPanel idPrefix="gamification" id="overview" active={activeTab === 'overview'}>
        <AdminGamificationPage />
      </TabPanel>
      <TabPanel idPrefix="gamification" id="badges" active={activeTab === 'badges'}>
        <AdminBadgesPage />
      </TabPanel>
      <TabPanel idPrefix="gamification" id="achievements" active={activeTab === 'achievements'}>
        <AdminAchievementsPage />
      </TabPanel>
      <TabPanel idPrefix="gamification" id="seasons" active={activeTab === 'seasons'}>
        <AdminSeasonsPage />
      </TabPanel>
    </div>
  );
}
