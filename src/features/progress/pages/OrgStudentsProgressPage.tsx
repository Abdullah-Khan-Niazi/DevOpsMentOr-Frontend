import { useMemo, useState } from 'react';
import { Card, ErrorState, LoadingState, PageHeader, Pagination } from '@/shared/components';
import { useMyOrg } from '@/features/org/hooks';
import { StudentProgressTable, type SortKey } from '../components/StudentProgressTable';
import { useOrgStudents } from '../hooks';

const PAGE_SIZE = 25;

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

/** SCR-F5-04: org-admin aggregate student analytics (F5-API-11). */
export function OrgStudentsProgressPage() {
  const org = useMyOrg();
  const orgId = org.query.data?.organizationId ?? null;

  const [sort, setSort] = useState<SortKey>({
    column: 'fullName',
    direction: 'asc',
  });
  const [page, setPage] = useState(1);

  const studentsQuery = useOrgStudents(orgId);
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const sortedStudents = useMemo(() => sortStudents(students, sort), [students, sort]);
  const pagedStudents = sortedStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));

  if (org.query.isLoading || studentsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Student progress" />
        <LoadingState label="Loading student progress…" />
      </div>
    );
  }

  if (org.query.isError || studentsQuery.isError) {
    return (
      <div>
        <PageHeader title="Student progress" />
        <ErrorState
          message={
            org.query.error?.message ??
            studentsQuery.error?.message ??
            'Unable to load student progress.'
          }
          onRetry={() => {
            void org.query.refetch();
            void studentsQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Student progress"
        description={`All students in ${org.query.data?.name ?? 'your organization'}`}
      />

      <Card className="p-5">
        <StudentProgressTable
          students={pagedStudents}
          isLoading={studentsQuery.isLoading}
          sort={sort}
          onSortChange={setSort}
        />{' '}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={sortedStudents.length}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}

export default OrgStudentsProgressPage;
