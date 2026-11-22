import { useState, useMemo } from 'react';
import { Button, EmptyState, Icon } from '@/shared/components';
import type { RosterStudentDto } from '../types';
import { OrgTableSkeleton } from './OrgTableSkeleton';

type SortColumn = 'fullName' | 'status' | 'enrolledAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}
    >
      <Icon name={active ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'} size={14} />
    </span>
  );
}

interface ClassRosterTableProps {
  students: RosterStudentDto[];
  isLoading: boolean;
  canManage: boolean;
  onWithdraw: (userId: number) => void;
}

/** F3 contract §09 SCR-F3-07: roster table with column sorting and withdraw action. */
export function ClassRosterTable({
  students,
  isLoading,
  canManage,
  onWithdraw,
}: ClassRosterTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('fullName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'fullName':
          valA = (a.fullName ?? a.email).toLowerCase();
          valB = (b.fullName ?? b.email).toLowerCase();
          break;
        case 'status':
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
        case 'enrolledAt':
          valA = new Date(a.enrolledAt).getTime();
          valB = new Date(b.enrolledAt).getTime();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, sortCol, sortDir]);

  if (isLoading) {
    return <OrgTableSkeleton label="Loading roster" columns={canManage ? 4 : 3} />;
  }

  if (students.length === 0) {
    return <EmptyState icon="users" title="No students enrolled yet" />;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted font-mono">
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'fullName' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('fullName')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Student <SortIcon active={sortCol === 'fullName'} direction={sortDir} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('status')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'enrolledAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('enrolledAt')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Enrolled <SortIcon active={sortCol === 'enrolledAt'} direction={sortDir} />
              </button>
            </th>
            {canManage ? <th className="px-3 py-2 font-medium text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((student) => (
            <tr key={student.userId} className="hover:bg-surface/60 transition-colors">
              <td className="px-3 py-2.5">
                <div className="font-medium text-card-foreground">{student.fullName ?? '-'}</div>
                <div className="text-xs text-muted font-mono">{student.email}</div>
              </td>
              <td className="px-3 py-2.5 text-xs font-mono">
                <span
                  className={student.isActive ? 'text-card-foreground' : 'text-muted line-through'}
                >
                  {student.isActive ? 'Active' : 'Withdrawn'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted font-mono">
                {new Date(student.enrolledAt).toLocaleDateString()}
              </td>
              {canManage ? (
                <td className="px-3 py-2.5 text-right">
                  <Button variant="danger" size="sm" onClick={() => onWithdraw(student.userId)}>
                    Withdraw
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

export default ClassRosterTable;
