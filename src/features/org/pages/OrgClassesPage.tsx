import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgClasses } from '../hooks';
import type { ClassDto } from '../types';
import { NewCohortDrawer, OrgInviteDrawer } from '../components';

const PAGE_SIZE = 15;

/** F3 contract §09 SCR-F3-05: Cohort workspace list and governance. */
export function OrgClassesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inviteTargetCohortId, setInviteTargetCohortId] = useState<number | undefined>(undefined);

  const canManage = useAuthStore((state) =>
    state.user?.permissions?.some((permission) =>
      ['org:classes:manage', 'class:manage'].includes(permission),
    ),
  );
  const canInvite = useAuthStore((state) =>
    state.user?.permissions?.some((permission) =>
      ['org:professors:invite', 'org:students:invite', 'org:manage'].includes(permission),
    ),
  );

  const drawerParam = searchParams.get('drawer');
  const isCohortDrawerOpen = drawerParam === 'cohort';
  const isInviteDrawerOpen = drawerParam === 'invite';

  const openCohortDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'cohort');
      return next;
    });
  };

  const openInviteDrawer = (cohortId?: number) => {
    setInviteTargetCohortId(cohortId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'invite');
      return next;
    });
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('drawer');
      return next;
    });
  };

  const { data, isLoading, isError, error, refetch } = useOrgClasses({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const cohorts = useMemo<ClassDto[]>(() => data?.data ?? [], [data?.data]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Cohorts"
        backTo={ROUTES.ORG_DASHBOARD}
        actions={
          <div className="flex items-center gap-2">
            {canManage ? (
              <Button variant="primary" size="sm" onClick={openCohortDrawer}>
                + New Cohort
              </Button>
            ) : null}
            {canInvite ? (
              <Button variant="secondary" size="sm" onClick={() => openInviteDrawer()}>
                Invite Users
              </Button>
            ) : null}
          </div>
        }
      />

      <Card className="p-6 space-y-4">
        {/* Search bar */}
        <div className="max-w-md">
          <label htmlFor="cohort-search" className="input-label">
            Search Cohorts
          </label>
          <input
            id="cohort-search"
            className="input-field w-full text-xs font-mono mt-1"
            placeholder="Search by cohort name or slug…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load cohorts.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <p className="py-8 text-center text-xs text-muted font-mono">Loading cohorts…</p>
        ) : cohorts.length === 0 ? (
          <EmptyState
            title={search ? 'No matching cohorts found' : 'No cohorts provisioned yet'}
            description={
              search
                ? 'Try a different search keyword.'
                : 'Provision your first academic cohort to start assigning faculty and enrolling students.'
            }
          />
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
                  <th className="px-4 py-3 font-medium">Cohort</th>
                  <th className="px-4 py-3 font-medium">Lead Professor</th>
                  <th className="px-4 py-3 font-medium">Enrolled Students</th>
                  <th className="px-4 py-3 font-medium text-right">Creation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {cohorts.map((cohort) => {
                  const percent =
                    cohort.maxStudents > 0
                      ? Math.min(
                          100,
                          Math.round((cohort.studentCount / cohort.maxStudents) * 100),
                        )
                      : 0;

                  return (
                    <tr
                      key={cohort.classId}
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(cohort.classId)),
                          { state: { fromUrl: ROUTES.ORG_CLASSES } },
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(
                            ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(cohort.classId)),
                            { state: { fromUrl: ROUTES.ORG_CLASSES } },
                          );
                        }
                      }}
                      className="cursor-pointer hover:bg-surface/80 active:bg-surface transition-colors focus:outline-hidden focus:bg-surface/90"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-card-foreground block">
                          {cohort.className}
                        </span>
                        <span className="text-xs text-muted font-mono">{cohort.slug}</span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-card-foreground">
                        {cohort.professorName ? (
                          <span className="font-medium">{cohort.professorName}</span>
                        ) : (
                          <span className="text-muted italic font-mono">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 border border-border bg-surface overflow-hidden">
                            <div
                              className="h-full bg-brand-600 transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted font-mono whitespace-nowrap">
                            {cohort.studentCount} / {cohort.maxStudents}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right text-xs text-muted font-mono">
                        {new Date(cohort.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 ? (
          <div className="pt-4 border-t border-border">
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        ) : null}
      </Card>

      {/* Slide-over Drawers */}
      <NewCohortDrawer
        isOpen={isCohortDrawerOpen}
        onClose={closeDrawer}
        onSuccess={() => void refetch()}
      />

      <OrgInviteDrawer
        isOpen={isInviteDrawerOpen}
        onClose={closeDrawer}
        defaultClassId={inviteTargetCohortId}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}

export default OrgClassesPage;
