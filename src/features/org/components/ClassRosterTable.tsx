import { useState, useMemo } from 'react';
import { Button } from '@/shared/components';
import type { RosterStudentDto } from '../types';

type SortColumn = 'fullName' | 'status' | 'enrolledAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
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
    return <p className="py-6 text-sm text-muted font-mono">Loading roster…</p>;
  }

  if (students.length === 0) {
    return <p className="py-6 text-sm text-muted font-mono">No students enrolled yet.</p>;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('fullName')}
            >
              Student <SortIcon active={sortCol === 'fullName'} direction={sortDir} />
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('enrolledAt')}
            >
              Enrolled <SortIcon active={sortCol === 'enrolledAt'} direction={sortDir} />
            </th>
            {canManage ? <th className="px-3 py-2 font-medium text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sortedStudents.map((student) => (
            <tr
              key={student.userId}
              className="hover:bg-surface/60 transition-colors"
            >
              <td className="px-3 py-2.5">
                <div className="font-medium text-card-foreground">{student.fullName ?? '—'}</div>
                <div className="text-xs text-muted font-mono">{student.email}</div>
              </td>
              <td className="px-3 py-2.5 text-xs font-mono">
                <span
                  className={`px-2 py-0.5 rounded-sm ${
                    student.isActive
                      ? 'border border-border/80 text-card-foreground bg-pearl-200'
                      : 'border border-border/50 text-muted line-through'
                  }`}
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
