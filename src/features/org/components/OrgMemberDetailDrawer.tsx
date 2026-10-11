import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, LoadingState, ErrorState, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useOrgClasses, useOrgUserDetail } from '../hooks';
import { classService } from '../services';

interface OrgMemberDetailDrawerProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function OrgMemberDetailDrawer({
  userId,
  isOpen,
  onClose,
  onUpdate,
}: OrgMemberDetailDrawerProps) {
  const { data: member, isLoading, isError, error, refetch } = useOrgUserDetail(
    userId,
    isOpen && Boolean(userId),
  );

  const classesQuery = useOrgClasses();
  const allCohorts = classesQuery.data?.data ?? [];

  const [selectedCohortToAdd, setSelectedCohortToAdd] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [withdrawingCohortId, setWithdrawingCohortId] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !userId) return null;

  const roleText =
    member?.role === 'org_admin'
      ? 'Organization Admin'
      : member?.role === 'professor'
        ? 'Professor'
        : 'Student Learner';

  const unassignedCohorts = allCohorts.filter(
    (c) => !member?.classes.some((mc) => mc.classId === c.classId),
  );

  const handleAssignCohort = async () => {
    if (!selectedCohortToAdd || !member) return;
    setIsAssigning(true);
    const cohortId = Number(selectedCohortToAdd);

    try {
      if (member.role === 'professor') {
        await classService.assignProfessor(cohortId, member.userId);
        toast.success('Professor assigned to cohort successfully.');
      } else {
        await classService.inviteStudents(cohortId, { emails: [member.email] });
        toast.success('Student enrolled in cohort successfully.');
      }
      setSelectedCohortToAdd('');
      void refetch();
      void classesQuery.refetch();
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign cohort.';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleWithdrawFromCohort = async (cohortId: number) => {
    if (!member) return;
    setWithdrawingCohortId(cohortId);
    try {
      await classService.withdrawStudent(cohortId, member.userId);
      toast.success('Member removed from cohort successfully.');
      void refetch();
      void classesQuery.refetch();
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to withdraw from cohort.';
      toast.error(msg);
    } finally {
      setWithdrawingCohortId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-none">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">Member Profile</h2>
                <p className="text-xs text-muted mt-0.5">
                  Academic record, cohort memberships, and telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted hover:text-card-foreground transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoading ? (
              <LoadingState label="Loading member telemetry…" />
            ) : isError || !member ? (
              <ErrorState
                message={error?.message ?? 'Failed to load member details.'}
                onRetry={() => void refetch()}
              />
            ) : (
              <div className="space-y-6">
                {/* Member Identity Card */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center border border-border bg-surface text-base font-bold text-card-foreground shrink-0 font-mono">
                      {(member.fullName || member.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-card-foreground text-sm truncate">
                        {member.fullName || member.username}
                      </h3>
                      <p className="text-xs text-muted truncate font-mono">{member.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/80 text-xs">
                    <div>
                      <span className="text-muted block">Role</span>
                      <span className="font-mono text-card-foreground font-medium">{roleText}</span>
                    </div>
                    <div>
                      <span className="text-muted block">Account Status</span>
                      <span className="font-mono text-card-foreground capitalize">{member.status}</span>
                    </div>
                    <div>
                      <span className="text-muted block">Country of Origin</span>
                      <span className="font-mono text-card-foreground">
                        {member.countryCode ? member.countryCode.toUpperCase() : 'Not recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Joined Date</span>
                      <span className="font-mono text-card-foreground">
                        {new Date(member.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Telemetry Metrics Strip */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono text-muted mb-2">
                    Learning Telemetry
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-card-foreground">
                        {member.completedModules}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">Modules Completed</div>
                    </Card>
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-card-foreground">
                        {member.quizzesPassed}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">Quizzes Passed</div>
                    </Card>
                    <Card className="p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-card-foreground">
                        {member.labHours}h
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">Lab Hours</div>
                    </Card>
                  </div>
                </div>

                {/* Associated Cohorts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-mono text-muted">
                      Associated Cohorts ({member.classes.length})
                    </h4>
                  </div>

                  {member.classes.length === 0 ? (
                    <div className="border border-border/80 bg-surface/40 p-4 text-center text-xs text-muted font-mono">
                      No cohort assignments recorded for this member.
                    </div>
                  ) : (
                    <div className="border border-border divide-y divide-border/60">
                      {member.classes.map((cls) => (
                        <div
                          key={cls.classId}
                          className="p-3 flex items-center justify-between hover:bg-surface/50 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-card-foreground">
                              {cls.className}
                            </p>
                            <p className="text-[10px] font-mono text-muted">Cohort #{cls.classId}</p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Link
                              to={ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(cls.classId))}
                              className="text-xs text-brand-600 hover:text-brand-700 font-mono hover:underline"
                              onClick={onClose}
                            >
                              Open &rarr;
                            </Link>
                            {member.role === 'org_student' && (
                              <button
                                type="button"
                                disabled={withdrawingCohortId === cls.classId}
                                onClick={() => handleWithdrawFromCohort(cls.classId)}
                                className="text-[11px] text-destructive hover:underline font-mono"
                              >
                                {withdrawingCohortId === cls.classId ? 'Removing…' : 'Withdraw'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add / Assign Cohort Selector */}
                  {member.role !== 'org_admin' && unassignedCohorts.length > 0 && (
                    <div className="border border-dashed border-border p-3 space-y-2 bg-surface/20">
                      <p className="text-xs font-semibold text-card-foreground">
                        {member.role === 'professor'
                          ? 'Assign to Another Cohort'
                          : 'Enroll in Additional Cohort'}
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          className="input-field grow text-xs font-mono"
                          value={selectedCohortToAdd}
                          onChange={(e) => setSelectedCohortToAdd(e.target.value)}
                        >
                          <option value="">Select a cohort to assign…</option>
                          {unassignedCohorts.map((c) => (
                            <option key={c.classId} value={String(c.classId)}>
                              {c.className} ({c.studentCount}/{c.maxStudents})
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleAssignCohort}
                          isLoading={isAssigning}
                          disabled={!selectedCohortToAdd}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-border mt-6">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgMemberDetailDrawer;
