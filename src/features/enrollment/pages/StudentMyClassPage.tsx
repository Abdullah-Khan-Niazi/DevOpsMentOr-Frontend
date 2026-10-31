import { useSearchParams } from 'react-router-dom';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { cn } from '@/shared/utils';
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="My classes" description="Every organization class you are enrolled in." />

      {classesQuery.isLoading ? (
        <LoadingState label="Loading your classes…" />
      ) : classesQuery.isError ? (
        <ErrorState
          message={classesQuery.error?.message ?? 'Unable to load your classes.'}
          onRetry={() => void classesQuery.refetch()}
        />
      ) : classes.length === 0 ? (
        <EmptyState
          title="You are not enrolled in a class yet"
          description="Ask your organization to invite you, use your workspace switcher to join with a class code, or accept an enrollment invitation when you receive one."
        />
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
              />
            ) : detail ? (
              <Card className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">{detail.className}</h2>
                  <p className="mt-1 text-sm text-muted">{detail.organizationName}</p>
                </div>
                <dl className="border-t border-border pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Enrolled</dt>
                    <dd className="font-medium text-card-foreground">
                      {new Date(detail.enrolledAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs leading-relaxed text-muted">
                  Use the workspace switcher to open any class or join another one with a class
                  code.
                </p>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentMyClassPage;
