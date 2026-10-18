import type { StudentProgressDto } from '../types';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/shared/components/Button';

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
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors"
        aria-hidden="true"
      >
        <path d="m5 10 3 3 3-3M5 6l3-3 3 3" />
      </svg>
    );
  }
  if (direction === 'asc') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-ink transition-transform"
        aria-hidden="true"
      >
        <path d="M8 13V3M4 7l4-4 4 4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5 text-ink transition-transform"
      aria-hidden="true"
    >
      <path d="M8 3v10m-4-4 4 4 4-4" />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={index} className="border-b border-border/60 last:border-0 animate-pulse">
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-36 rounded bg-paper-dim" />
            <div className="mt-1.5 h-2.5 w-24 rounded bg-paper-dim" />
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 rounded-sm bg-paper-dim" />
              <div className="h-3 w-8 rounded-sm bg-paper-dim" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="h-3 w-16 rounded bg-paper-dim" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-3 w-20 rounded bg-paper-dim" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-3 w-16 rounded bg-paper-dim" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-7 w-20 rounded bg-paper-dim" />
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
      <button
        type="button"
        onClick={() =>
          onSortChange({
            column,
            direction: active && sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded"
      >
        <span>{label}</span>
        <SortIcon active={active} direction={sort.direction} />
      </button>
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
      <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-pearl-100 shadow-sm">
        <table className="w-full text-left text-sm" aria-label="Student progress">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
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
    return (
      <div className="rounded-lg border border-border/80 bg-pearl-100 p-8 text-center text-sm text-muted shadow-sm">
        No students enrolled yet.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border/80 bg-pearl-100 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-pearl-200/50 text-xs text-muted">
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
            {onSelectStudent ? (
              <th className="px-4 py-3 font-semibold text-xs tracking-wider uppercase text-muted">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {students.map((student) => (
            <tr
              key={student.userId}
              className="transition-colors duration-150 hover:bg-[#F3EFE6] cursor-default"
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
                      percentage={student.progressPercentage}
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
                <span className="text-xs text-muted">{student.labsCompleted === 1 ? 'lab' : 'labs'}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(student.lastActiveAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    student.progressPercentage >= 100
                      ? 'inline-flex items-center rounded-sm bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                      : 'inline-flex items-center rounded-sm bg-pearl-200 px-2.5 py-0.5 text-xs font-medium text-text-secondary ring-1 ring-inset ring-paper-line'
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
