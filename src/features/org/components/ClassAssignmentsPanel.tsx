import { useMemo, useState } from 'react';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, toast } from '@/shared/components';
import { cn } from '@/shared/utils';
import { ClassAssignmentsPanelSkeleton } from './ClassAssignmentsPanelSkeleton';
import type { AssignmentDeadlineState, ClassAssignmentWithStatsDto } from '../types';
import {
  useClassAssignments,
  useCourseCatalog,
  useCreateAssignment,
  useDeleteAssignment,
  useUpdateAssignment,
} from '../hooks/useAssignments';

const STATE_LABELS: Record<AssignmentDeadlineState, string> = {
  completed: 'Completed',
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_track: 'On track',
  no_deadline: 'Self-paced',
};

const STATE_CLASSES: Record<AssignmentDeadlineState, string> = {
  completed: 'text-success',
  overdue: 'text-error',
  due_soon: 'text-warning',
  on_track: 'text-muted',
  no_deadline: 'text-muted',
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'No deadline';
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface ClassAssignmentsPanelProps {
  classId: string | number;
  canManage: boolean;
}

/**
 * Cohort course assignments (chaos sprint): assign published courses with an
 * optional deadline, monitor completion, edit deadlines, remove assignments.
 */
export function ClassAssignmentsPanel({ classId, canManage }: ClassAssignmentsPanelProps) {
  const assignmentsQuery = useClassAssignments(classId);
  const catalogQuery = useCourseCatalog(canManage);
  const createAssignment = useCreateAssignment(classId);
  const updateAssignment = useUpdateAssignment(classId);
  const deleteAssignment = useDeleteAssignment(classId);

  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [editingDue, setEditingDue] = useState<Record<number, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ClassAssignmentWithStatsDto | null>(null);

  const assignments = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const courses = catalogQuery.data ?? [];
  const assignedCourseIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.courseId)),
    [assignments],
  );
  const availableCourses = courses.filter((course) => !assignedCourseIds.has(course.courseId));

  const handleCreate = () => {
    if (!courseId) {
      toast.error('Select a course to assign to this cohort.');
      return;
    }
    createAssignment.mutate(
      {
        courseId: Number(courseId),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        isMandatory,
      },
      {
        onSuccess: (assignment) => {
          toast.success(`${assignment.courseTitle} assigned to this cohort.`);
          setCourseId('');
          setDueDate('');
          setIsMandatory(true);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleSaveDue = (assignment: ClassAssignmentWithStatsDto) => {
    const value = editingDue[assignment.assignmentId];
    updateAssignment.mutate(
      {
        assignmentId: assignment.assignmentId,
        payload: { dueDate: value ? new Date(value).toISOString() : null },
      },
      {
        onSuccess: () => {
          toast.success(`Deadline updated for ${assignment.courseTitle}.`);
          setEditingDue((prev) => {
            const next = { ...prev };
            delete next[assignment.assignmentId];
            return next;
          });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (assignmentsQuery.isLoading) {
    return <ClassAssignmentsPanelSkeleton />;
  }

  if (assignmentsQuery.isError) {
    return (
      <ErrorState
        message={assignmentsQuery.error?.message ?? 'Unable to load cohort assignments.'}
        onRetry={() => void assignmentsQuery.refetch()}
        retrying={assignmentsQuery.isRefetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card className="space-y-4 p-6">
          <h3 className="text-base font-semibold text-card-foreground">Assign a course</h3>

          <div className="grid gap-4 lg:grid-cols-[2fr_1.4fr_auto_auto] lg:items-end">
            <div>
              <label htmlFor="assignment-course" className="input-label">
                Course
              </label>
              <select
                id="assignment-course"
                className="input-field mt-1 w-full"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                disabled={catalogQuery.isLoading || availableCourses.length === 0}
              >
                <option value="">
                  {catalogQuery.isLoading
                    ? 'Loading courses…'
                    : availableCourses.length === 0
                      ? 'Every published course is already assigned'
                      : 'Select a course…'}
                </option>
                {availableCourses.map((course) => (
                  <option key={course.courseId} value={String(course.courseId)}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignment-due" className="input-label">
                Deadline (optional)
              </label>
              <input
                id="assignment-due"
                type="datetime-local"
                className="input-field mt-1 w-full"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 pb-2 text-xs text-card-foreground">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(event) => setIsMandatory(event.target.checked)}
              />
              Mandatory
            </label>

            <Button
              onClick={handleCreate}
              isLoading={createAssignment.isPending}
              disabled={!courseId}
            >
              Assign course
            </Button>
          </div>

          {catalogQuery.isError ? (
            <p className="text-xs text-error">
              The course catalog could not be loaded. Retry before assigning.
            </p>
          ) : null}
        </Card>
      ) : null}

      {assignments.length === 0 ? (
        <EmptyState title="No courses assigned yet" />
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const editing = assignment.assignmentId in editingDue;
            const dueValue = editing
              ? editingDue[assignment.assignmentId]
              : toDateTimeLocal(assignment.dueDate);
            return (
              <Card key={assignment.assignmentId} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {assignment.courseTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(assignment.dueDate)}
                      {assignment.isMandatory ? ', Mandatory' : ', Optional'}
                    </p>
                  </div>
                  <span className={cn('text-xs font-medium', STATE_CLASSES[assignment.state])}>
                    {STATE_LABELS[assignment.state]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span>
                    {assignment.completedCount} / {assignment.rosterCount} completed
                  </span>
                  {assignment.overdueCount > 0 ? (
                    <span className="text-error">{assignment.overdueCount} overdue</span>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="flex flex-wrap items-end gap-2 pt-3">
                    <div>
                      <label
                        htmlFor={`assignment-due-${assignment.assignmentId}`}
                        className="input-label"
                      >
                        Change deadline
                      </label>
                      <input
                        id={`assignment-due-${assignment.assignmentId}`}
                        type="datetime-local"
                        className="input-field mt-1"
                        value={dueValue}
                        onChange={(event) =>
                          setEditingDue((prev) => ({
                            ...prev,
                            [assignment.assignmentId]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSaveDue(assignment)}
                      isLoading={
                        updateAssignment.isPending &&
                        updateAssignment.variables?.assignmentId === assignment.assignmentId
                      }
                    >
                      Save deadline
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(assignment)}>
                      Remove
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          open
          title="Remove assignment"
          message={`Remove "${deleteTarget.courseTitle}" from this cohort? Learners keep their progress, but the course stops appearing on the cohort task board.`}
          confirmLabel="Remove assignment"
          isLoading={deleteAssignment.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteAssignment.mutate(deleteTarget.assignmentId, {
              onSuccess: () => {
                toast.success('Assignment removed from this cohort.');
                setDeleteTarget(null);
              },
              onError: (error) => toast.error(error.message),
            })
          }
        />
      ) : null}
    </div>
  );
}
