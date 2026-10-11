import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  TabRow,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  ActivityLogTable,
  CourseProgressCard,
  ModuleBreakdownTable,
  ModuleProgressSummaryRow,
  StudentProgressTable,
  type SortKey,
} from '@/features/progress/components';
import { useClassStudents, useStudentDetail } from '@/features/progress/hooks';
import {
  useClassDetail,
  useClassInvitations,
  useClassRoster,
  useOrgProfessors,
  useResendInvitation,
  useWithdrawStudent,
} from '../hooks';
import {
  ClassRosterTable,
  InvitationStatusTable,
  OrgInviteDrawer,
  ProfessorAssignmentSelector,
} from '../components';
import type { InvitationDto } from '../types';

type ClassTab = 'overview' | 'students' | 'progress' | 'invitations' | 'settings';
const ROSTER_PAGE_SIZE = 20;
const INVITES_PAGE_SIZE = 20;

function sortStudents<
  T extends {
    fullName: string | null;
    progressPercentage: number;
    labsCompleted: number;
    lastActiveAt: string | null;
  },
>(students: T[], sort: SortKey): T[] {
  const sorted = [...students];
  const direction = sort.direction === 'asc' ? 1 : -1;
  sorted.sort((a, b) => {
    if (sort.column === 'fullName') {
      return (
        (a.fullName ?? 'Unnamed student').localeCompare(b.fullName ?? 'Unnamed student') * direction
      );
    }
    if (sort.column === 'lastActiveAt') {
      const av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : -1;
      const bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : -1;
      return (av - bv) * direction;
    }
    if (sort.column === 'status') {
      const av = a.progressPercentage >= 100 ? 1 : 0;
      const bv = b.progressPercentage >= 100 ? 1 : 0;
      return (av - bv) * direction;
    }
    return (a[sort.column] - b[sort.column]) * direction;
  });
  return sorted;
}

/** F3 contract §10 SCR-F3-06: Unified class detail with smooth inline tabs. */
export function OrgClassDetailPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backState = location.state as { fromUrl?: string } | undefined;

  const handleBack = () => {
    if (backState?.fromUrl) {
      navigate(backState.fromUrl);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.ORG_DASHBOARD);
    }
  };

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const isPrivileged =
    roles.includes('platform_admin') ||
    roles.includes('org_admin') ||
    roles.includes('admin');

  const canManage =
    isPrivileged ||
    permissions.some((p) =>
      ['org:classes:manage', 'class:manage', 'org:manage', 'platform.organizations.manage'].includes(p),
    );
  const canInvite =
    isPrivileged ||
    permissions.some((p) =>
      ['class:students:invite', 'org:students:invite', 'org:professors:invite'].includes(p),
    );

  const isInviteDrawerOpen = searchParams.get('drawer') === 'invite';
  const openInviteDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'invite');
      return next;
    });
  };
  const closeInviteDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('drawer');
      return next;
    });
  };

  // URL-driven tab state with fallback
  const tabParam = searchParams.get('tab') as ClassTab | null;
  const activeTab: ClassTab =
    tabParam && ['overview', 'students', 'progress', 'invitations', 'settings'].includes(tabParam)
      ? tabParam
      : 'overview';

  const setTab = (newTab: ClassTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true },
    );
  };

  // Class detail queries & mutations
  const { query: detail, update, assignProfessor } = useClassDetail(classId);
  const professors = useOrgProfessors();

  // Settings editing state & initialization
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMax, setEditMax] = useState('');
  const [withdrawAllOpen, setWithdrawAllOpen] = useState(false);

  useEffect(() => {
    if (detail.data) {
      setEditName(detail.data.className);
      setEditDesc(detail.data.description ?? '');
      setEditMax(String(detail.data.maxStudents));
    }
  }, [detail.data]);

  const resetEdit = () => {
    if (detail.data) {
      setEditName(detail.data.className);
      setEditDesc(detail.data.description ?? '');
      setEditMax(String(detail.data.maxStudents));
    }
  };

  // Roster tab state & hooks
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDraft, setRosterDraft] = useState('');
  const [withdrawTarget, setWithdrawTarget] = useState<number | null>(null);

  const roster = useClassRoster(
    classId,
    { search: rosterSearch || undefined, page: rosterPage, pageSize: ROSTER_PAGE_SIZE },
    activeTab === 'students',
  );
  const withdraw = useWithdrawStudent(classId);

  // Invitations tab state & hooks
  const [invitesPage, setInvitesPage] = useState(1);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const invitations = useClassInvitations(
    classId,
    { page: invitesPage, pageSize: INVITES_PAGE_SIZE },
    activeTab === 'invitations',
  );
  const resendInvite = useResendInvitation(classId);

  // Progress tab state & hooks
  const [progressSort, setProgressSort] = useState<SortKey>({
    column: 'fullName',
    direction: 'asc',
  });
  const [selectedProgressUserId, setSelectedProgressUserId] = useState<number | null>(null);

  const classProgress = useClassStudents(classId, activeTab === 'progress');
  const studentDetail = useStudentDetail(classId, selectedProgressUserId);

  const sortedProgressStudents = useMemo(
    () => sortStudents(classProgress.data?.students ?? [], progressSort),
    [classProgress.data, progressSort],
  );

  if (detail.isLoading) {
    return (
      <div>
        <PageHeader title="Class" onBack={handleBack} />
        <LoadingState label="Loading class…" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div>
        <PageHeader title="Class" onBack={handleBack} />
        <ErrorState
          message={detail.error?.message ?? 'Unable to load this class.'}
          onRetry={() => void detail.refetch()}
        />
      </div>
    );
  }

  const klass = detail.data;

  const saveEdit = () => {
    if (!editName.trim()) {
      toast.error('Cohort name is required.');
      return;
    }
    update.mutate(
      {
        className: editName.trim(),
        description: editDesc.trim() || null,
        maxStudents: editMax ? Number(editMax) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Cohort settings updated.');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const applyRosterSearch = () => {
    setRosterPage(1);
    setRosterSearch(rosterDraft.trim());
  };

  const handleWithdraw = (userId: number) => {
    withdraw.mutate(userId, {
      onSuccess: () => {
        toast.success('Student withdrawn.');
        setWithdrawTarget(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleResend = (inv: InvitationDto) => {
    setResendingId(inv.invitationId);
    resendInvite.mutate(inv.invitationId, {
      onSuccess: () => {
        toast.success('Invitation resent.');
      },
      onError: (error) => toast.error(error.message),
      onSettled: () => setResendingId(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={klass.className}
        onBack={handleBack}
      />

      <TabRow
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Students' },
          { id: 'progress', label: 'Progress' },
          { id: 'invitations', label: 'Invitations' },
          { id: 'settings', label: 'Settings' },
        ]}
        activeId={activeTab}
        onChange={(id) => setTab(id as ClassTab)}
      />

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card className="space-y-4 p-5">
            <h3 className="font-medium text-card-foreground">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Slug</dt>
                <dd className="font-mono text-card-foreground">{klass.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Max students</dt>
                <dd className="text-card-foreground">{klass.maxStudents}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Enrolled</dt>
                <dd className="text-card-foreground">{klass.studentCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Created</dt>
                <dd className="text-card-foreground">
                  {new Date(klass.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-muted">Description</p>
              <p className="mt-1 text-sm text-card-foreground">
                {klass.description || 'No description provided.'}
              </p>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="font-medium text-card-foreground">Professor assignment</h3>
            <div>
              {canManage ? (
                <ProfessorAssignmentSelector
                  professors={professors.query.data ?? []}
                  currentProfessorUserId={klass.professorUserId}
                  submitting={assignProfessor.isPending}
                  onAssign={(professorUserId) =>
                    assignProfessor.mutate(professorUserId, {
                      onSuccess: () => toast.success('Professor assigned.'),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                />
              ) : (
                <p className="text-sm text-card-foreground">
                  {klass.professorName ?? 'No professor assigned yet.'}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Students Tab ─── */}
      {activeTab === 'students' && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="grow max-w-md">
              <label htmlFor="roster-search" className="input-label">
                Search students
              </label>
              <div className="flex gap-2">
                <input
                  id="roster-search"
                  className="input-field w-full"
                  placeholder="Name or email…"
                  value={rosterDraft}
                  onChange={(e) => setRosterDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyRosterSearch();
                  }}
                />
                <Button variant="secondary" onClick={applyRosterSearch}>
                  Search
                </Button>
              </div>
            </div>
          </div>

          {roster.isError ? (
            <ErrorState
              message={roster.error?.message ?? 'Unable to load roster.'}
              onRetry={() => void roster.refetch()}
            />
          ) : (
            <>
              <ClassRosterTable
                students={roster.data?.data ?? []}
                isLoading={roster.isLoading}
                canManage={canInvite}
                onWithdraw={(userId) => setWithdrawTarget(userId)}
              />
              {roster.data && roster.data.totalPages > 1 ? (
                <Pagination
                  page={roster.data.page}
                  pageSize={roster.data.pageSize}
                  total={roster.data.total}
                  totalPages={roster.data.totalPages}
                  onPageChange={setRosterPage}
                />
              ) : null}
            </>
          )}

          {withdrawTarget !== null && (
            <ConfirmDialog
              open
              title="Withdraw student"
              onCancel={() => setWithdrawTarget(null)}
              onConfirm={() => handleWithdraw(withdrawTarget)}
              confirmLabel="Withdraw"
              isLoading={withdraw.isPending}
              message="Remove this student from the class? Their historical enrollment record is preserved."
            />
          )}
        </Card>
      )}

      {/* ─── Progress Tab ─── */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {classProgress.isLoading ? (
            <LoadingState label="Loading cohort progress…" />
          ) : classProgress.isError ? (
            <ErrorState
              message={classProgress.error?.message ?? 'Unable to load cohort progress.'}
              onRetry={() => void classProgress.refetch()}
            />
          ) : (
            <>
              <ModuleProgressSummaryRow
                modules={classProgress.data?.moduleAverages ?? []}
                isLoading={classProgress.isLoading}
              />

              <Card className="p-5">
                <StudentProgressTable
                  students={sortedProgressStudents}
                  isLoading={classProgress.isLoading}
                  sort={progressSort}
                  onSortChange={setProgressSort}
                  onSelectStudent={setSelectedProgressUserId}
                />
              </Card>

              {selectedProgressUserId !== null ? (
                <div id="cohort-student-progress-detail" className="mt-8">
                  {studentDetail.isLoading ? (
                    <LoadingState label="Loading student detail…" />
                  ) : studentDetail.isError || !studentDetail.data ? (
                    <ErrorState
                      message={studentDetail.error?.message ?? 'Unable to load student detail.'}
                      onRetry={() => void studentDetail.refetch()}
                    />
                  ) : (
                    <div className="space-y-6">
                      <PageHeader
                        title={studentDetail.data.student.fullName ?? 'Student'}
                        description={studentDetail.data.student.email}
                        actions={
                          <button
                            type="button"
                            onClick={() => setSelectedProgressUserId(null)}
                            className="border border-border bg-surface px-3 py-1.5 text-xs font-mono font-medium text-muted hover:text-card-foreground transition-colors"
                          >
                            Close detail
                          </button>
                        }
                      />
                      <CourseProgressCard course={studentDetail.data.course} isLoading={false} />
                      <Card className="p-5">
                        <h2 className="mb-3 text-sm font-semibold text-card-foreground">
                          Module breakdown
                        </h2>
                        <ModuleBreakdownTable
                          modules={studentDetail.data.modules}
                          isLoading={false}
                        />
                      </Card>
                      <Card className="p-5">
                        <h2 className="mb-3 text-sm font-semibold text-card-foreground">
                          Activity log
                        </h2>
                        <ActivityLogTable
                          items={studentDetail.data.activity}
                          isLoading={false}
                        />
                      </Card>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* ─── Invitations Tab ─── */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-semibold text-card-foreground">Cohort Invitations</h3>
                <p className="mt-0.5 text-xs text-muted font-mono">
                  Active enrollment invitations, delivery telemetry, and access tokens for this cohort.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canInvite && (
                  <Button variant="primary" size="sm" onClick={openInviteDrawer}>
                    + Invite Students
                  </Button>
                )}
              </div>
            </div>

            {invitations.isError ? (
              <ErrorState
                message={invitations.error?.message ?? 'Unable to load invitations.'}
                onRetry={() => void invitations.refetch()}
              />
            ) : (
              <>
                <InvitationStatusTable
                  invitations={invitations.data?.data ?? []}
                  isLoading={invitations.isLoading}
                  canResend={canInvite}
                  resendingId={resendingId}
                  onResend={handleResend}
                />
                {invitations.data && invitations.data.totalPages > 1 ? (
                  <Pagination
                    page={invitations.data.page}
                    pageSize={invitations.data.pageSize}
                    total={invitations.data.total}
                    totalPages={invitations.data.totalPages}
                    onPageChange={setInvitesPage}
                  />
                ) : null}
              </>
            )}
          </Card>
        </div>
      )}

      {/* ─── Settings Tab ─── */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* General Cohort Settings */}
          <Card className="p-6 space-y-5">
            <div className="border-b border-border pb-4">
              <h3 className="text-base font-semibold text-card-foreground">Cohort Settings</h3>
              <p className="mt-0.5 text-xs text-muted font-mono">
                General configuration, capacity limits, and descriptions for {klass.className}.
              </p>
            </div>

            {canManage ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Cohort Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="input-label">Cohort Identifier / Slug</label>
                    <div className="input-field bg-surface text-muted cursor-not-allowed font-mono text-xs">
                      {klass.slug}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="cohort-desc" className="input-label">
                    Description
                  </label>
                  <textarea
                    id="cohort-desc"
                    rows={3}
                    className="input-field w-full font-mono text-xs"
                    placeholder="Brief description of this cohort's learning schedule or curriculum goals…"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                <div className="max-w-xs">
                  <Input
                    label="Student Capacity Ceiling"
                    type="number"
                    min={1}
                    value={editMax}
                    onChange={(e) => setEditMax(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted font-mono">
                    Currently {klass.studentCount} students enrolled
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={saveEdit}
                    isLoading={update.isPending}
                    disabled={!editName.trim()}
                  >
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={resetEdit}>
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">You do not have permission to edit this cohort.</p>
            )}
          </Card>

          {/* Academic Leadership & Professor Assignment */}
          <Card className="p-6 space-y-4">
            <div className="border-b border-border pb-4">
              <h3 className="text-base font-semibold text-card-foreground">Lead Professor Assignment</h3>
              <p className="mt-0.5 text-xs text-muted font-mono">
                Assigned instructor responsible for monitoring progress, answering student queries, and grading capstone labs.
              </p>
            </div>

            <div>
              {canManage ? (
                <ProfessorAssignmentSelector
                  professors={professors.query.data ?? []}
                  currentProfessorUserId={klass.professorUserId}
                  submitting={assignProfessor.isPending}
                  onAssign={(professorUserId) =>
                    assignProfessor.mutate(professorUserId, {
                      onSuccess: () => toast.success('Professor assigned to cohort.'),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                />
              ) : (
                <p className="text-sm text-card-foreground font-mono">
                  {klass.professorName ?? 'No professor assigned yet.'}
                </p>
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 space-y-4 border-red-500/40 bg-red-500/5">
            <div>
              <h3 className="text-base font-semibold text-red-500">Danger Zone</h3>
              <p className="mt-0.5 text-xs text-muted font-mono">
                Irreversible administrative actions for this cohort.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div>
                <p className="text-sm font-semibold text-card-foreground">Withdraw All Students</p>
                <p className="text-xs text-muted">
                  Remove all enrolled students from this cohort roster while preserving their progress history.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                disabled={klass.studentCount === 0}
                onClick={() => setWithdrawAllOpen(true)}
              >
                Withdraw All Students
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── SLIDE-OVER INVITATION DRAWER ─── */}
      <OrgInviteDrawer
        isOpen={isInviteDrawerOpen}
        onClose={closeInviteDrawer}
        defaultRole="student"
        defaultClassId={Number(classId)}
        onSuccess={() => {
          void invitations.refetch();
          void detail.refetch();
          void roster.refetch();
        }}
      />

      {withdrawAllOpen && (
        <ConfirmDialog
          open
          title="Withdraw all students"
          onCancel={() => setWithdrawAllOpen(false)}
          onConfirm={async () => {
            try {
              const students = roster.data?.data ?? [];
              for (const s of students) {
                await withdraw.mutateAsync(s.userId);
              }
              toast.success('All students withdrawn from cohort.');
              void roster.refetch();
              void detail.refetch();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to withdraw students';
              toast.error(msg);
            } finally {
              setWithdrawAllOpen(false);
            }
          }}
          confirmLabel="Withdraw All"
          isLoading={withdraw.isPending}
          message={`Are you sure you want to withdraw all ${klass.studentCount} students from this cohort? Their historical progress is kept safe.`}
        />
      )}
    </div>
  );
}

export default OrgClassDetailPage;
