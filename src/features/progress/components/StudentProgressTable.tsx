import type { StudentProgressDto } from '../types';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { Button } from '@/shared/components/Button';
import { EmptyState, Icon, Skeleton } from '@/shared/components';

export interface SortKey {
  column: 'fullName' | 'progressPercentage' | 'labsCompleted' | 'lastActiveAt' | 'status';
  direction: 'asc' | 'desc';
}

interface StudentProgressTableProps {
  students: StudentProgressDto[];
  isLoading: boolean;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  onSelectStudent?: (userId: number) => void;
}

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function studentStatus(student: Pick<StudentProgressDto, 'progressPercentage'>): string {
  return student.progressPercentage >= 100 ? 'Completed' : 'In progress';
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <Icon
        name="sort"
        size={14}
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors"
      />
    );
  }
  if (direction === 'asc') {
    return <Icon name="arrow-up" size={14} className="w-3.5 h-3.5 text-ink transition-transform" />;
  }
  return <Icon name="arrow-down" size={14} className="w-3.5 h-3.5 text-ink transition-transform" />;
}

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={index}>
          <td className="px-4 py-3.5">
            <Skeleton className="h-3.5 w-36 rounded-xs" />
            <Skeleton className="mt-1.5 h-2.5 w-24 rounded-xs" />
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-28 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-xs" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-3 w-16 rounded-xs" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-3 w-20 rounded-xs" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-3 w-16 rounded-xs" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-7 w-20 rounded-md" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function SortableHeader({
  label,
  column,
  sort,
  onSortChange,
}: {
  label: string;
  column: SortKey['column'];
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}) {
  const active = sort.column === column;
  return (
    <th
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="px-4 py-3 font-semibold text-xs tracking-wider uppercase text-muted"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onSortChange({
            column,
            direction: active && sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className="group"
      >
        <span>{label}</span>
        <SortIcon active={active} direction={sort.direction} />
      </Button>
    </th>
  );
}

/** SCR-F5-03 / SCR-F5-04: sortable student progress table. */
export function StudentProgressTable({
  students,
  isLoading,
  sort,
  onSortChange,
  onSelectStudent,
}: StudentProgressTableProps) {
  if (isLoading) {
    return (
      <div
        className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-pearl-100 shadow-sm"
        role="status"
        aria-label="Loading student progress"
      >
        <table className="w-full text-left text-sm" aria-hidden="true">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Labs</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {onSelectStudent ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <SkeletonRows />
        </table>
      </div>
    );
  }

  if (students.length === 0) {
    return <EmptyState title="No students enrolled yet." icon="users" />;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-pearl-100 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-pearl-200/50 text-xs text-muted">
            <SortableHeader
              label="Student"
              column="fullName"
              sort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Progress"
              column="progressPercentage"
              sort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Labs"
              column="labsCompleted"
              sort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Last active"
              column="lastActiveAt"
              sort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Status"
              column="status"
              sort={sort}
              onSortChange={onSortChange}
            />
            {onSelectStudent ? (
              <th className="px-4 py-3 font-semibold text-xs tracking-wider uppercase text-muted">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.userId}
              className="transition-colors duration-150 hover:bg-surface-hover cursor-default"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-card-foreground">
                  {student.fullName ?? 'Unnamed student'}
                </div>
                <div className="text-xs text-muted">{student.email}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-28">
                    <ProgressBar
                      value={student.progressPercentage}
                      label={`Progress for ${student.fullName ?? 'student'}`}
                      size="sm"
                    />
                  </div>
                  <span className="shrink-0 tabular-nums text-xs font-semibold text-muted-foreground">
                    {student.progressPercentage}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                <span className="font-medium text-ink">{student.labsCompleted}</span>{' '}
                <span className="text-xs text-muted">
                  {student.labsCompleted === 1 ? 'lab' : 'labs'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(student.lastActiveAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    student.progressPercentage >= 100
                      ? 'text-xs font-medium text-success'
                      : 'text-xs font-medium text-muted'
                  }
                >
                  {studentStatus(student)}
                </span>
              </td>
              {onSelectStudent ? (
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSelectStudent(student.userId)}
                  >
                    View detail
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentProgressTable;
