import { Button } from '@/shared/components';
import type { RosterStudentDto } from '../types';

interface ClassRosterTableProps {
  students: RosterStudentDto[];
  isLoading: boolean;
  canManage: boolean;
  onWithdraw: (userId: number) => void;
}

/** F3 contract §09 SCR-F3-07: roster table with withdraw action. */
export function ClassRosterTable({
  students,
  isLoading,
  canManage,
  onWithdraw,
}: ClassRosterTableProps) {
  if (isLoading) {
    return <p className="py-6 text-sm text-muted">Loading roster…</p>;
  }

  if (students.length === 0) {
    return <p className="py-6 text-sm text-muted">No students enrolled yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
          <th className="px-3 py-2 font-medium">Student</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Enrolled</th>
          {canManage ? <th className="px-3 py-2 font-medium">Actions</th> : null}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr
            key={student.userId}
            className="border-b border-border/60 last:border-0 hover:bg-surface/60"
          >
            <td className="px-3 py-2.5">
              <div className="font-medium text-card-foreground">{student.fullName ?? '—'}</div>
              <div className="text-xs text-muted">{student.email}</div>
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">
              {student.isActive ? 'Active' : 'Withdrawn'}
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">
              {new Date(student.enrolledAt).toLocaleDateString()}
            </td>
            {canManage ? (
              <td className="px-3 py-2.5">
                <Button variant="danger" size="sm" onClick={() => onWithdraw(student.userId)}>
                  Withdraw
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ClassRosterTable;
