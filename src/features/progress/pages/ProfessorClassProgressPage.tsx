import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { StudentProgressTable, type SortKey } from '../components/StudentProgressTable';
import { useClassStudents, useStudentDetail } from '../hooks';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { ModuleBreakdownTable } from '../components/ModuleBreakdownTable';
import { CourseProgressCard } from '../components/CourseProgressCard';
import { ModuleProgressSummaryRow } from '../components/ModuleProgressSummaryRow';

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

/** SCR-F5-03: professor class analytics with student drill-down. */
export function ProfessorClassProgressPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const [sort, setSort] = useState<SortKey>({
    column: 'fullName',
    direction: 'asc',
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const classQuery = useClassStudents(classId);
  const detail = useStudentDetail(classId, selectedUserId);

  const sortedStudents = useMemo(
    () => sortStudents(classQuery.data?.students ?? [], sort),
    [classQuery.data, sort],
  );

  const averageProgress = useMemo(() => {
    const students = classQuery.data?.students ?? [];
    if (students.length === 0) return 0;
    return Math.round(
      students.reduce((sum, student) => sum + student.progressPercentage, 0) / students.length,
    );
  }, [classQuery.data]);

  if (classQuery.isError) {
    return (
      <div>
        <PageHeader title="Class progress" />
        <ErrorState
          message={classQuery.error?.message ?? 'Unable to load class progress.'}
          onRetry={() => void classQuery.refetch()}
        />
      </div>
    );
  }

  const className = classQuery.data?.className ?? 'Class';
  const students = classQuery.data?.students ?? [];
  const moduleAverages = classQuery.data?.moduleAverages ?? [];

  return (
    <div>
      <PageHeader
        title="Class progress"
        description={`${className} · ${students.length} student${students.length === 1 ? '' : 's'} · ${averageProgress}% average`}
        actions={
          <Link
            to={ROUTES.ORG_CLASSES}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            ← Back to classes
          </Link>
        }
      />

      <ModuleProgressSummaryRow modules={moduleAverages ?? []} isLoading={classQuery.isLoading} />

      <Card className="mt-6 p-5">
        <StudentProgressTable
          students={sortedStudents}
          isLoading={classQuery.isLoading}
          sort={sort}
          onSortChange={setSort}
          onSelectStudent={setSelectedUserId}
        />
      </Card>

      {selectedUserId !== null ? (
        <div id="student-detail" className="mt-8">
          {detail.isLoading ? (
            <LoadingState label="Loading student detail…" />
          ) : detail.isError || !detail.data ? (
            <ErrorState
              message={detail.error?.message ?? 'Unable to load student detail.'}
              onRetry={() => void detail.refetch()}
            />
          ) : (
            <div className="space-y-6">
              <PageHeader
                title={detail.data.student.fullName ?? 'Student'}
                description={detail.data.student.email}
                actions={
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    Close detail
                  </button>
                }
              />
              <CourseProgressCard course={detail.data.course} isLoading={false} />
              <Card className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-card-foreground">
                  Module breakdown
                </h2>
                <ModuleBreakdownTable modules={detail.data.modules} isLoading={false} />
              </Card>
              <Card className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-card-foreground">Activity log</h2>
                <ActivityLogTable items={detail.data.activity} isLoading={false} />
              </Card>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default ProfessorClassProgressPage;
