import type { StudentProgressDto } from '../types';
import { ProgressBar } from './ProgressBar';

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

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index} className="border-b border-border/60 last:border-0">
          <td className="px-3 py-3">
            <div className="h-3 w-2/3 rounded bg-border" />
            <div className="mt-1.5 h-2 w-1/3 rounded bg-border" />
          </td>
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 rounded-full bg-border" />
              <div className="h-3 w-8 rounded bg-border" />
            </div>
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-16 rounded bg-border" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-20 rounded bg-border" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-14 rounded bg-border" />
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
      className="px-3 py-2 font-medium"
    >
      <button
        type="button"
        onClick={() =>
          onSortChange({
            column,
            direction: active && sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className="inline-flex items-center gap-1 uppercase tracking-wide text-muted transition-colors hover:text-card-foreground"
      >
        {label}
        <span aria-hidden="true">{active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}

/** SCR-F5-03 / SCR-F5-04: sortable student progress table (text status only). */
export function StudentProgressTable({
  students,
  isLoading,
  sort,
  onSortChange,
  onSelectStudent,
}: StudentProgressTableProps) {
  if (isLoading) {
    return (
      <table className="w-full text-left text-sm" aria-label="Student progress">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="px-3 py-2 font-medium">Student</th>
            <th className="px-3 py-2 font-medium">Progress</th>
            <th className="px-3 py-2 font-medium">Labs</th>
            <th className="px-3 py-2 font-medium">Last active</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <SkeletonRows />
      </table>
    );
  }

  if (students.length === 0) {
    return <p className="py-6 text-sm text-muted">No students enrolled yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted">
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
          <SortableHeader label="Status" column="status" sort={sort} onSortChange={onSortChange} />
          {onSelectStudent ? <th className="px-3 py-2 font-medium">Actions</th> : null}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr
            key={student.userId}
            className="border-b border-border/60 last:border-0 hover:bg-surface/60"
          >
            <td className="px-3 py-2.5">
              <div className="font-medium text-card-foreground">
                {student.fullName ?? 'Unnamed student'}
              </div>
              <div className="text-xs text-muted">{student.email}</div>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <ProgressBar
                    percentage={student.progressPercentage}
                    label={`Progress for ${student.fullName ?? 'student'}`}
                    size="sm"
                  />
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {student.progressPercentage}%
                </span>
              </div>
            </td>
            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
              {student.labsCompleted} lab{student.labsCompleted === 1 ? '' : 's'}
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">
              {formatDate(student.lastActiveAt)}
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">{studentStatus(student)}</td>
            {onSelectStudent ? (
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onSelectStudent(student.userId)}
                  className="inline-block rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  View detail
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default StudentProgressTable;
