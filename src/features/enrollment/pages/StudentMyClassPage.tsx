import { useSearchParams } from 'react-router-dom';
import { Card, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { cn } from '@/shared/utils';
import { StudentMyClassPageSkeleton } from './StudentMyClassPageSkeleton';
import { useMyClass, useMyClasses } from '../hooks';

/** F3 contract §09 SCR-F3-10: all of a student's class enrollments (ENR-03). */
export function StudentMyClassPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classesQuery = useMyClasses();
  const classes = classesQuery.data ?? [];

  const requestedClassId = Number(searchParams.get('classId'));
  const selectedClass =
    classes.find((entry) => entry.classId === requestedClassId) ?? classes[0] ?? null;
  const selectedClassId = selectedClass?.classId;

  const detailQuery = useMyClass(Boolean(selectedClassId), selectedClassId);
  const detail = detailQuery.data ?? selectedClass;

  const selectClass = (classId: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('classId', String(classId));
        return next;
      },
      { replace: true },
    );
  };

  if (classesQuery.isLoading) return <StudentMyClassPageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="My classes" />

      {classesQuery.isError ? (
        <ErrorState
          message={classesQuery.error?.message ?? 'Unable to load your classes.'}
          onRetry={() => void classesQuery.refetch()}
          retrying={classesQuery.isRefetching}
        />
      ) : classes.length === 0 ? (
        <EmptyState title="You are not enrolled in a class yet" />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="space-y-2 p-4 md:col-span-1">
            <h2 className="text-sm font-semibold text-card-foreground">Enrollments</h2>
            <div className="space-y-1.5">
              {classes.map((entry) => {
                const active = entry.classId === selectedClassId;
                return (
                  <button
                    key={entry.classId}
                    type="button"
                    onClick={() => selectClass(entry.classId)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                      active
                        ? 'border-border-strong bg-surface text-card-foreground'
                        : 'border-border bg-card text-muted hover:bg-surface-hover hover:text-card-foreground',
                    )}
                  >
                    <span className="block truncate text-sm font-medium">{entry.className}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {entry.organizationName}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="md:col-span-2">
            {detailQuery.isError && !detail ? (
              <ErrorState
                message={detailQuery.error?.message ?? 'Unable to load this class.'}
                onRetry={() => void detailQuery.refetch()}
                retrying={detailQuery.isRefetching}
              />
            ) : detail ? (
              <Card className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">{detail.className}</h2>
                  <p className="mt-1 text-sm text-muted">{detail.organizationName}</p>
                </div>
                <dl className="text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Enrolled</dt>
                    <dd className="font-medium text-card-foreground">
                      {new Date(detail.enrolledAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentMyClassPage;
