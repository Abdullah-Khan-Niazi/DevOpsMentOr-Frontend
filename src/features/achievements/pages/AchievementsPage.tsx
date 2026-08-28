import '../styles/achievements.css';
import { useMemo, useState } from 'react';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  TabRow,
  toast,
} from '@/shared/components';
import { BadgeCard } from '../components/BadgeCard';
import { AchievementRow } from '../components/AchievementRow';
import { CertificateCard } from '../components/CertificateCard';
import { StatsBar } from '../components/StatsBar';
import {
  useAchievementCatalog,
  useBadgeCatalog,
  useCertificateDownload,
  useGamificationProfile,
  usePointsHistory,
} from '../hooks/useGamification';
import type { BadgeType, PointsSourceType } from '../types';

const POINTS_PAGE_SIZE = 25;

const SOURCE_LABELS: Record<PointsSourceType, string> = {
  machine_own: 'Machine owned',
  challenge_solve: 'Challenge solved',
  course_complete: 'Course completed',
  achievement: 'Achievement unlocked',
  daily_bonus: 'Daily bonus',
  admin_adjustment: 'Admin adjustment',
  penalty: 'Penalty',
};

type TabId = 'badges' | 'achievements' | 'certificates' | 'points';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'badges', label: 'Badges' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'points', label: 'Points history' },
];

/** SCR-F7-01: learner achievements, certificates and points ledger. */
export function AchievementsPage() {
  const [tab, setTab] = useState<TabId>('badges');
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
        if (result.url) {
          window.open(result.url, '_blank', 'noopener,noreferrer');
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
    void navigator.clipboard
      .writeText(`${window.location.origin}/verify/${certNumber}`)
      .then(() => toast.success('Verification link copied.'))
      .catch(() => toast.error('Could not copy the link.'));
  };

  if (profile.isError) {
    return (
      <div>
        <PageHeader title="Achievements & certificates" />
        <ErrorState
          title="Could not load your gamification profile"
          message={profile.error?.message ?? 'Unable to reach the gamification service.'}
          onRetry={() => void profile.refetch()}
        />
      </div>
    );
  }

  const data = profile.data;

  return (
    <div>
      <PageHeader
        title="Achievements & certificates"
        description="Your badges, achievements, points and course certificates."
      />

      <StatsBar
        pointsBalance={data?.points.balance ?? null}
        globalRank={data?.globalRank ?? null}
        badgeCount={data?.badges.length ?? null}
        streakDays={data?.currentStreakDays ?? null}
        isLoading={profile.isLoading}
      />

      <div className="mt-6">
        <TabRow items={TABS} activeId={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      <div className="mt-6">
        {tab === 'badges' ? (
          profile.isLoading || badgeCatalog.isLoading ? (
            <div className="badge-grid">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="badge-card badge-card--skeleton" aria-hidden="true" />
              ))}
            </div>
          ) : badgeCatalog.isError ? (
            <ErrorState
              message={badgeCatalog.error?.message ?? 'Could not load the badge catalog.'}
              onRetry={() => void badgeCatalog.refetch()}
            />
          ) : badgeItems.length === 0 ? (
            <EmptyState
              title="No badges earned yet"
              description="Complete your first module to start collecting badges."
            />
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
          )
        ) : null}

        {tab === 'achievements' ? (
          profile.isLoading ? (
            <div className="achievement-list" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="achievement-row achievement-row--skeleton" />
              ))}
            </div>
          ) : achievementItems.length === 0 ? (
            <EmptyState
              title="No achievements unlocked yet"
              description="Keep learning and completing labs to unlock achievements."
            />
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
          )
        ) : null}

        {tab === 'certificates' ? (
          profile.isLoading ? (
            <div className="certificate-list" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="certificate-card certificate-card--skeleton" />
              ))}
            </div>
          ) : (data?.certificates.length ?? 0) === 0 ? (
            <EmptyState
              title="No certificates yet"
              description="Finish a course to earn your first certificate."
            />
          ) : (
            <div className="certificate-list">
              {data?.certificates.map((certificate) => (
                <CertificateCard
                  key={certificate.certificateId}
                  certificate={certificate}
                  onDownload={onDownload}
                  onCopyLink={onCopyLink}
                />
              ))}
            </div>
          )
        ) : null}

        {tab === 'points' ? (
          pointsHistory.isLoading ? (
            <div className="points-table-wrap" aria-hidden="true">
              <div className="points-table points-table--skeleton" />
            </div>
          ) : pointsHistory.isError ? (
            <ErrorState
              message={pointsHistory.error?.message ?? 'Could not load your points history.'}
              onRetry={() => void pointsHistory.refetch()}
            />
          ) : (pointsHistory.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title="No points history yet"
              description="Points you earn from courses, labs and achievements will appear here."
            />
          ) : (
            <Card>
              <table className="points-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Description</th>
                    <th className="points-table__num">Change</th>
                    <th className="points-table__num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsHistory.data?.items.map((entry) => (
                    <tr key={entry.historyId}>
                      <td>
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td>{SOURCE_LABELS[entry.sourceType] ?? entry.sourceType}</td>
                      <td>{entry.description ?? '–'}</td>
                      <td
                        className={`points-table__num points-table__change ${
                          entry.pointsChange < 0 ? 'points-table__change--negative' : ''
                        }`}
                      >
                        {entry.pointsChange > 0 ? `+${entry.pointsChange}` : entry.pointsChange}
                      </td>
                      <td className="points-table__num">{entry.pointsBalanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={pointsPage}
                pageSize={POINTS_PAGE_SIZE}
                total={pointsHistory.data?.total ?? 0}
                totalPages={Math.max(
                  1,
                  Math.ceil((pointsHistory.data?.total ?? 0) / POINTS_PAGE_SIZE),
                )}
                onPageChange={setPointsPage}
              />
            </Card>
          )
        ) : null}
      </div>
    </div>
  );
}

export default AchievementsPage;
