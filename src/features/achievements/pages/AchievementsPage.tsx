import '../styles/achievements.css';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  type IconName,
  PageHeader,
  Pagination,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
  toast,
  XpDelta,
} from '@/shared/components';
import { useUrlState } from '@/shared/hooks';
import { safeHttpUrl } from '@/shared/utils';
import { AchievementRow } from '../components/AchievementRow';
import { BadgeCard } from '../components/BadgeCard';
import { StatsBar } from '../components/StatsBar';
import {
  useAchievementCatalog,
  useBadgeCatalog,
  useCertificateDownload,
  useGamificationProfile,
  usePointsHistory,
} from '../hooks/useGamification';
import type { BadgeType, PointsHistoryDto } from '../types';
import {
  AchievementListSkeleton,
  AchievementsPageSkeleton,
  BadgeGridSkeleton,
  XpHistorySkeleton,
} from './AchievementsPageSkeleton';

const POINTS_PAGE_SIZE = 25;
const RECENT_ACHIEVEMENT_COUNT = 3;
const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

const ACHIEVEMENT_TABS = ['overview', 'badges', 'achievements', 'history', 'certificates'] as const;
type AchievementTab = (typeof ACHIEVEMENT_TABS)[number];

const TABS: ReadonlyArray<TabSwitcherItem<AchievementTab>> = [
  { id: 'overview', label: 'Overview' },
  { id: 'badges', label: 'Badges' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'history', label: 'History' },
  { id: 'certificates', label: 'Certificates' },
];

/** Award kind of an XP history row (`GET /gamification/points/history`); old rows read as `legacy`. */
type XpHistoryEntry = PointsHistoryDto & { kind?: string };

const KIND_ICONS: Record<string, IconName> = {
  lab_step: 'lab',
  lab_done: 'task',
  lab_hint: 'hint',
  lab_wrong: 'x-circle',
  lab_guess: 'warning',
  quiz_wrong: 'x-circle',
  quiz_guess: 'warning',
  quiz_pass: 'quiz',
  lesson: 'lesson',
  module: 'module',
  course: 'course',
  achievement: 'medal',
  badge: 'award',
  daily: 'streak',
  admin: 'shield',
  legacy: 'history',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT);
}

/** SCR-F7-01: learner achievements, badges, XP history and certificates (URL-driven tabs). */
export function AchievementsPage() {
  const [tab, setTab] = useUrlState<AchievementTab>('tab', ACHIEVEMENT_TABS, 'overview');
  const [pointsPage, setPointsPage] = useState(1);

  const profile = useGamificationProfile();
  const badgeCatalog = useBadgeCatalog();
  const achievementCatalog = useAchievementCatalog();
  const pointsHistory = usePointsHistory(pointsPage);
  const download = useCertificateDownload();

  const earnedBadgeIds = useMemo(
    () => new Set(profile.data?.badges.map((badge) => badge.badgeId) ?? []),
    [profile.data],
  );

  const badgeItems = useMemo(() => {
    const earned = profile.data?.badges ?? [];
    const catalog = badgeCatalog.data ?? [];
    const byId = new Map(catalog.map((badge) => [badge.badgeId, badge]));
    const items: Array<{
      badgeId: number;
      badgeName: string;
      badgeType: BadgeType;
      iconUrl: string | null;
      description: string | null;
      awardedAt: string | null;
    }> = earned.map((badge) => ({
      badgeId: badge.badgeId,
      badgeName: badge.badgeName,
      badgeType: badge.badgeType,
      iconUrl: badge.iconUrl,
      description: byId.get(badge.badgeId)?.description ?? null,
      awardedAt: badge.awardedAt,
    }));
    for (const badge of catalog) {
      if (!earnedBadgeIds.has(badge.badgeId)) {
        items.push({
          badgeId: badge.badgeId,
          badgeName: badge.badgeName,
          badgeType: badge.badgeType,
          iconUrl: badge.iconUrl,
          description: badge.description,
          awardedAt: null,
        });
      }
    }
    return items;
  }, [profile.data, badgeCatalog.data, earnedBadgeIds]);

  const achievementItems = useMemo(() => {
    const unlocked = profile.data?.achievements ?? [];
    const catalog = achievementCatalog.data ?? [];
    const descriptions = new Map(
      catalog.map((achievement) => [achievement.achievementId, achievement.description]),
    );
    return [...unlocked]
      .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
      .map((achievement) => ({
        ...achievement,
        description: descriptions.get(achievement.achievementId) ?? null,
      }));
  }, [profile.data, achievementCatalog.data]);

  const onDownload = (certId: number): void => {
    download.mutate(certId, {
      onSuccess: (result) => {
        const url = safeHttpUrl(result.url);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          toast.error('No download link is available for this certificate.');
        }
      },
      onError: (err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not start the download.');
      },
    });
  };

  const onCopyLink = (certNumber: string): void => {
    if (!navigator.clipboard) {
      toast.error('Could not copy the link.');
      return;
    }
    void navigator.clipboard
      .writeText(`${window.location.origin}/verify/${certNumber}`)
      .then(() => toast.success('Verification link copied.'))
      .catch(() => toast.error('Could not copy the link.'));
  };

  if (profile.isLoading) {
    return <AchievementsPageSkeleton />;
  }

  if (profile.isError) {
    return (
      <div>
        <PageHeader title="Achievements" />
        <ErrorState
          title="Could not load your gamification profile"
          message={profile.error?.message ?? 'Unable to reach the gamification service.'}
          onRetry={() => void profile.refetch()}
        />
      </div>
    );
  }

  const data = profile.data;
  const recentAchievements = achievementItems.slice(0, RECENT_ACHIEVEMENT_COUNT);
  const pointsItems = (pointsHistory.data?.items ?? []) as XpHistoryEntry[];
  const pointsTotalPages = Math.max(
    1,
    Math.ceil((pointsHistory.data?.total ?? 0) / POINTS_PAGE_SIZE),
  );

  return (
    <div>
      <PageHeader title="Achievements" />

      <div className="mt-6">
        <TabSwitcher
          items={TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Achievements sections"
          idPrefix="achievements"
        />
      </div>

      <div className="mt-6">
        <TabPanel idPrefix="achievements" id="overview" active={tab === 'overview'}>
          <div className="flex flex-col gap-6">
            <StatsBar
              pointsBalance={data?.points.balance ?? null}
              globalRank={data?.globalRank ?? null}
              badgeCount={data?.badges.length ?? null}
              streakDays={data?.currentStreakDays ?? null}
              isLoading={false}
            />
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-card-foreground">Recent achievements</h2>
              {recentAchievements.length === 0 ? (
                <EmptyState title="No achievements unlocked yet" />
              ) : (
                <div className="achievement-list">
                  {recentAchievements.map((achievement) => (
                    <AchievementRow
                      key={achievement.achievementId}
                      name={achievement.name}
                      description={achievement.description}
                      pointsAwarded={achievement.pointsAwarded}
                      unlockedAt={achievement.unlockedAt}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </TabPanel>

        <TabPanel idPrefix="achievements" id="badges" active={tab === 'badges'}>
          {badgeCatalog.isLoading ? (
            <BadgeGridSkeleton />
          ) : badgeCatalog.isError ? (
            <ErrorState
              message={badgeCatalog.error?.message ?? 'Could not load the badge catalog.'}
              onRetry={() => void badgeCatalog.refetch()}
            />
          ) : badgeItems.length === 0 ? (
            <EmptyState title="No badges yet" />
          ) : (
            <div className="badge-grid">
              {badgeItems.map((badge) => (
                <BadgeCard
                  key={badge.badgeId}
                  badgeName={badge.badgeName}
                  badgeType={badge.badgeType}
                  iconUrl={badge.iconUrl}
                  awardedAt={badge.awardedAt}
                  description={badge.description}
                />
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel idPrefix="achievements" id="achievements" active={tab === 'achievements'}>
          {achievementCatalog.isLoading ? (
            <AchievementListSkeleton />
          ) : achievementCatalog.isError ? (
            <ErrorState
              message={
                achievementCatalog.error?.message ?? 'Could not load the achievement catalog.'
              }
              onRetry={() => void achievementCatalog.refetch()}
            />
          ) : achievementItems.length === 0 ? (
            <EmptyState title="No achievements unlocked yet" />
          ) : (
            <div className="achievement-list">
              {achievementItems.map((achievement) => (
                <AchievementRow
                  key={achievement.achievementId}
                  name={achievement.name}
                  description={achievement.description}
                  pointsAwarded={achievement.pointsAwarded}
                  unlockedAt={achievement.unlockedAt}
                />
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel idPrefix="achievements" id="history" active={tab === 'history'}>
          {pointsHistory.isLoading ? (
            <XpHistorySkeleton />
          ) : pointsHistory.isError ? (
            <ErrorState
              message={pointsHistory.error?.message ?? 'Could not load your XP history.'}
              onRetry={() => void pointsHistory.refetch()}
            />
          ) : pointsItems.length === 0 ? (
            <EmptyState title="No XP history yet" />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="points-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th className="points-table__num">XP</th>
                      <th className="points-table__num">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsItems.map((entry) => (
                      <tr key={entry.historyId}>
                        <td>{formatDate(entry.createdAt)}</td>
                        <td>
                          <span className="inline-flex items-center gap-2">
                            <Icon
                              name={KIND_ICONS[entry.kind ?? 'legacy'] ?? 'history'}
                              size={16}
                            />
                            <span>{entry.description ?? '–'}</span>
                          </span>
                        </td>
                        <td className="points-table__num">
                          <XpDelta delta={entry.pointsChange} />
                        </td>
                        <td className="points-table__num">{entry.pointsBalanceAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={pointsPage}
                pageSize={POINTS_PAGE_SIZE}
                total={pointsHistory.data?.total ?? 0}
                totalPages={pointsTotalPages}
                onPageChange={setPointsPage}
              />
            </Card>
          )}
        </TabPanel>

        <TabPanel idPrefix="achievements" id="certificates" active={tab === 'certificates'}>
          {(data?.certificates.length ?? 0) === 0 ? (
            <EmptyState title="No certificates yet" />
          ) : (
            <div className="certificate-list">
              {data?.certificates.map((certificate) => (
                <Card key={certificate.certificateId} className="certificate-card">
                  <div className="certificate-card__header">
                    <h3 className="certificate-card__title">{certificate.courseTitle}</h3>
                  </div>
                  <p className="certificate-card__number">{certificate.certificateNumber}</p>
                  <p className="certificate-card__meta">
                    {`Issued ${formatDate(certificate.issuedAt)}`}
                    {certificate.grade !== null ? ` · Grade ${certificate.grade}%` : ''}
                    {certificate.isValid ? '' : ' · Invalidated'}
                  </p>
                  <div className="certificate-card__actions">
                    <Button
                      size="sm"
                      isLoading={
                        download.isPending && download.variables === certificate.certificateId
                      }
                      loadingLabel="Starting download"
                      onClick={() => onDownload(certificate.certificateId)}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onCopyLink(certificate.certificateNumber)}
                    >
                      Copy share link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>
      </div>
    </div>
  );
}

export default AchievementsPage;
