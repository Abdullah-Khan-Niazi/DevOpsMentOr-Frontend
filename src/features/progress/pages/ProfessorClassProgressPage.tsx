import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Card,
  ErrorState,
  PageHeader,
  Select,
  Skeleton,
  TablePageSkeleton,
} from '@/shared/components';
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

/** Positive integer from `?courseId=`, or null when absent or invalid. */
function readCourseId(raw: string | null): number | null {
  const value = Number(raw);
  return raw !== null && Number.isInteger(value) && value > 0 ? value : null;
}

/** SCR-F5-03: professor class analytics with student drill-down. */
export function ProfessorClassProgressPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = readCourseId(searchParams.get('courseId'));
  const [sort, setSort] = useState<SortKey>({
    column: 'fullName',
    direction: 'asc',
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const classQuery = useClassStudents(classId, true, courseId);
  const detail = useStudentDetail(classId, selectedUserId, courseId);

  const sortedStudents = useMemo(
    () => sortStudents(classQuery.data?.students ?? [], sort),
    [classQuery.data, sort],
  );

  const courseOptions = classQuery.data?.courseOptions ?? [];
  const selectedCourseId = courseId ?? courseOptions[0]?.courseId ?? null;

  function selectCourse(next: number) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        params.set('courseId', String(next));
        return params;
      },
      { replace: true },
    );
  }

  const courseSelect =
    courseOptions.length > 1 ? (
      <Select
        label="Course"
        value={selectedCourseId ?? ''}
        onChange={(event) => selectCourse(Number(event.target.value))}
        options={courseOptions.map((option) => ({
          value: String(option.courseId),
          label: option.title,
        }))}
      />
    ) : null;

  if (classQuery.isLoading) {
    return <TablePageSkeleton />;
  }

  if (classQuery.isError) {
    return (
      <div>
        <PageHeader title="Class Progress" />
        <ErrorState
          message={classQuery.error?.message ?? 'Unable to load class progress.'}
          onRetry={() => void classQuery.refetch()}
        />
      </div>
    );
  }

  const className = classQuery.data?.className ?? 'Class Progress';
  const moduleAverages = classQuery.data?.moduleAverages ?? [];

  return (
    <div>
      <PageHeader title={className} backTo={ROUTES.ORG_CLASSES} actions={courseSelect} />

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
            <div
              className="space-y-6"
              role="status"
              aria-label="Loading student detail"
              aria-busy="true"
            >
              <Skeleton className="h-10 w-64 rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-72 w-full rounded-md" />
            </div>
          ) : detail.isError || !detail.data ? (
            <ErrorState
              message={detail.error?.message ?? 'Unable to load student detail.'}
              onRetry={() => void detail.refetch()}
            />
          ) : (
            <div className="space-y-6">
              <PageHeader
                title={detail.data.student.fullName ?? 'Student'}
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
