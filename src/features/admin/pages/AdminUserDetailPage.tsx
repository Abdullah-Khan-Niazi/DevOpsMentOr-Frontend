import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  DetailFormSkeleton,
  ErrorState,
  PageHeader,
  Pagination,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
  toast,
} from '@/shared/components';
import { useUrlState } from '@/shared/hooks';
import {
  ActivityLogTable,
  CourseProgressCard,
  ModuleBreakdownTable,
} from '@/features/progress/components';
import { useAdminUserProgress } from '@/features/progress/hooks';
import { useAdminUserDetail } from '../hooks';
import { ROUTES } from '@/shared/constants';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusText(
  user: Pick<{ deletedAt: string | null; isBanned: boolean; isActive: boolean }, never> & {
    deletedAt: string | null;
    isBanned: boolean;
    isActive: boolean;
  },
): string {
  if (user.deletedAt) return 'Soft-deleted';
  if (user.isBanned) return 'Banned';
  if (!user.isActive) return 'Inactive';
  return 'Active';
}

const TAB_IDS = ['profile', 'security', 'engagement', 'governance'] as const;
type UserDetailTab = (typeof TAB_IDS)[number];

const TABS: ReadonlyArray<TabSwitcherItem<UserDetailTab>> = [
  { id: 'profile', label: 'Profile & Identity' },
  { id: 'security', label: 'Security & Logins' },
  { id: 'engagement', label: 'Activity & Progress' },
  { id: 'governance', label: 'Danger Zone' },
];

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backState = location.state as
    | {
        fromOrgId?: number;
        fromTab?: string;
        fromClassId?: number;
        fromUrl?: string;
      }
    | undefined;

  const handleBack = () => {
    if (backState?.fromUrl) {
      navigate(backState.fromUrl);
    } else if (backState?.fromOrgId) {
      const orgUrl = `${ROUTES.ADMIN_ORGANIZATION_DETAIL.replace(':orgId', String(backState.fromOrgId))}?tab=${backState.fromTab ?? 'cohorts'}${backState.fromClassId ? `&classId=${backState.fromClassId}` : ''}`;
      navigate(orgUrl);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.ADMIN_USERS);
    }
  };

  const id = Number(userId);

  const { query, ban, unban, remove, restore } = useAdminUserDetail(
    Number.isFinite(id) ? id : 0,
    id > 0,
  );
  const progressQuery = useAdminUserProgress(String(id));
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 10;
  const [activeTab, setActiveTab] = useUrlState<UserDetailTab>('tab', TAB_IDS, 'profile');
  const [banReason, setBanReason] = useState('');
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(false);

  const canBan = banReason.trim().length >= 10;

  if (!Number.isFinite(id) || id < 1) {
    return <ErrorState message="Invalid user ID." onRetry={() => navigate('/admin/users')} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={query.error?.message ?? 'User not found.'}
        onRetry={() => navigate('/admin/users')}
      />
    );
  }

  if (query.isLoading || !query.data) {
    return <DetailFormSkeleton />;
  }

  const user = query.data;
  const isAdmin = user.roles.includes('platform_admin');

  const handleBan = () => {
    if (!canBan) {
      toast.error('Ban reason must be at least 10 characters.');
      return;
    }
    ban.mutate(banReason, {
      onSuccess: () => {
        toast.success('User banned');
        setBanReason('');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleUnban = () => {
    unban.mutate(undefined, {
      onSuccess: () => toast.success('User unbanned'),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleDelete = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('User soft-deleted successfully');
        setDeleteConfirmStep(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleRestore = () => {
    restore.mutate(undefined, {
      onSuccess: () => toast.success('User restored successfully'),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title={user.fullName ?? user.username}
        breadcrumbs={[
          { label: 'Platform', to: ROUTES.ADMIN_DASHBOARD },
          { label: 'Users', to: ROUTES.ADMIN_USERS },
          { label: user.fullName ?? user.username },
        ]}
        onBack={handleBack}
      />

      <TabSwitcher
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="User sections"
        idPrefix="user-detail"
      />

      <TabPanel idPrefix="user-detail" id="profile" active={activeTab === 'profile'}>
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
              {(user.fullName ?? user.username)[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {user.fullName ?? user.username}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span>@{user.username}</span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <Row label="Account status">{statusText(user)}</Row>
            <Row label="Assigned roles">{user.roles.join(', ') || 'None'}</Row>
            <Row label="Email verified">{user.isVerified ? 'Yes' : 'No'}</Row>
            <Row label="Joined platform">{formatDate(user.createdAt)}</Row>
            <Row label="Last login">{formatDate(user.loginHistory[0]?.createdAt ?? null)}</Row>
            {user.profile?.country ? (
              <Row label="Country">{user.profile.country.countryName}</Row>
            ) : null}
            {user.profile?.occupation ? (
              <Row label="Occupation">{user.profile.occupation}</Row>
            ) : null}
            {user.profile?.company ? <Row label="Company">{user.profile.company}</Row> : null}
          </dl>

          {user.bio ? (
            <div>
              <h3 className="text-xs font-semibold text-muted mb-1">Bio</h3>
              <p className="text-sm text-card-foreground">{user.bio}</p>
            </div>
          ) : null}

          {user.skills.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold text-muted mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span
                    key={skill.skillId}
                    className="rounded-xs bg-surface px-2.5 py-1 text-xs text-card-foreground"
                  >
                    {skill.skillName} <span className="text-muted">{skill.proficiencyLevel}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </TabPanel>

      <TabPanel idPrefix="user-detail" id="security" active={activeTab === 'security'}>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-card-foreground">
              Governance & Ban Status
            </h2>
            {user.isBanned ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-medium">User is currently banned.</p>
                {user.banReason ? (
                  <p className="mt-1 text-xs text-red-700">Reason: {user.banReason}</p>
                ) : null}
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUnban}
                    isLoading={unban.isPending}
                  >
                    Unban user
                  </Button>
                </div>
              </div>
            ) : isAdmin ? (
              <p className="text-sm text-muted">Platform administrators cannot be banned.</p>
            ) : user.deletedAt ? (
              <p className="text-sm text-muted">User is deleted. Restore account before banning.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="ban-reason" className="input-label">
                    Ban reason (minimum 10 characters)
                  </label>
                  <textarea
                    id="ban-reason"
                    rows={2}
                    className="input-field w-full resize-y"
                    placeholder="Provide justification for governance logs…"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleBan}
                  isLoading={ban.isPending}
                  disabled={!canBan}
                >
                  Ban user
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold text-card-foreground">Login History</h2>
            {user.loginHistory.length === 0 ? (
              <p className="text-sm text-muted">No recorded sign-ins yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">IP Address</th>
                    <th className="px-3 py-2 font-medium">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {user.loginHistory.map((login) => (
                    <tr key={login.loginId}>
                      <td className="px-3 py-2">{formatDate(login.createdAt)}</td>
                      <td className="px-3 py-2 uppercase text-xs">{login.loginType}</td>
                      <td className="px-3 py-2">{login.ipAddress ?? '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {login.isSuccessful ? (
                          <span className="font-mono text-card-foreground font-medium">
                            Success
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Failed {login.failureReason ? `(${login.failureReason})` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </TabPanel>

      <TabPanel idPrefix="user-detail" id="engagement" active={activeTab === 'engagement'}>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-card-foreground">
              Engagement Metrics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border p-4 bg-surface rounded-md">
                <span className="text-xs text-muted">Followers</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {user.followersCount}
                </p>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md">
                <span className="text-xs text-muted">Following</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {user.followingCount}
                </p>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md">
                <span className="text-xs text-muted">Profile Views</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {user.profile?.profileViews ?? 0}
                </p>
              </div>
              <div className="border border-border p-4 bg-surface rounded-md">
                <span className="text-xs text-muted">Reputation Score</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {user.profile?.reputationScore ?? 0}
                </p>
              </div>
            </div>
          </Card>

          {progressQuery.isError ? (
            <ErrorState
              message={
                progressQuery.error?.message ?? 'Unable to load curriculum and lab progress.'
              }
              onRetry={() => void progressQuery.refetch()}
            />
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <CourseProgressCard
                  course={progressQuery.data?.course ?? null}
                  isLoading={progressQuery.isLoading}
                />
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-card-foreground">Quiz Attempts</h3>
                  {progressQuery.isLoading ? (
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-2/3 bg-border animate-pulse rounded-xs" />
                      <div className="h-3 w-1/2 bg-border animate-pulse rounded-xs" />
                    </div>
                  ) : (progressQuery.data?.quizAttempts.length ?? 0) === 0 ? (
                    <p className="mt-4 text-sm text-muted">No quiz attempts recorded yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {(progressQuery.data?.quizAttempts ?? []).map((attempt) => (
                        <li
                          key={attempt.attemptId}
                          className="flex items-center justify-between gap-3 pt-2 text-sm"
                        >
                          <span className="text-card-foreground font-medium">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          <span className="flex items-center gap-3 tabular-nums text-xs">
                            <span className="font-bold">{attempt.score}%</span>
                            <span
                              className={
                                attempt.isPassed
                                  ? 'font-mono text-card-foreground font-bold'
                                  : 'text-red-500 font-medium'
                              }
                            >
                              {attempt.isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">
                  Module Breakdown
                </h3>
                <ModuleBreakdownTable
                  modules={progressQuery.data?.modules ?? []}
                  isLoading={progressQuery.isLoading}
                />
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">
                  Curriculum & Lab Activity Log
                </h3>
                <ActivityLogTable
                  items={(progressQuery.data?.activity ?? []).slice(
                    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
                    activityPage * ACTIVITY_PAGE_SIZE,
                  )}
                  isLoading={progressQuery.isLoading}
                />
                {!progressQuery.isLoading && (progressQuery.data?.activity.length ?? 0) > 0 && (
                  <Pagination
                    page={activityPage}
                    pageSize={ACTIVITY_PAGE_SIZE}
                    total={progressQuery.data?.activity.length ?? 0}
                    totalPages={Math.max(
                      1,
                      Math.ceil((progressQuery.data?.activity.length ?? 0) / ACTIVITY_PAGE_SIZE),
                    )}
                    onPageChange={setActivityPage}
                  />
                )}
              </Card>
            </>
          )}
        </div>
      </TabPanel>

      <TabPanel idPrefix="user-detail" id="governance" active={activeTab === 'governance'}>
        <Card className="border-red-200 p-6">
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Danger Zone</h2>

          {user.deletedAt ? (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold">User is Soft-Deleted</h3>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleRestore}
                  isLoading={restore.isPending}
                  className="shrink-0"
                >
                  Restore user account
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-red-200 bg-red-50/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium text-red-900">Soft-delete user</h3>
                </div>
                {deleteConfirmStep ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeleteConfirmStep(false)}
                      disabled={remove.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      isLoading={remove.isPending}
                    >
                      Confirm delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteConfirmStep(true)}
                  >
                    Delete user
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </TabPanel>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-card-foreground">{children}</dd>
    </div>
  );
}

export default AdminUserDetailPage;
