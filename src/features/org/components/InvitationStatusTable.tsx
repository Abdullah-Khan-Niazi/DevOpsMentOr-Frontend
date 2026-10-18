import { useState, useMemo } from 'react';
import { Button } from '@/shared/components';
import type { InvitationDto } from '../types';

type SortColumn = 'inviteeEmail' | 'status' | 'createdAt' | 'expiresAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

interface InvitationStatusTableProps {
  invitations: InvitationDto[];
  isLoading: boolean;
  resendingId?: number | null;
  canResend: boolean;
  onResend: (invitation: InvitationDto) => void;
}

const STATUS_LABEL: Record<InvitationDto['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

/** F3 contract §10: invitation status table with column sorting and per-row resend action. */
export function InvitationStatusTable({
  invitations,
  isLoading,
  resendingId = null,
  canResend = false,
  onResend,
}: InvitationStatusTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedInvitations = useMemo(() => {
    const list = [...invitations];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'inviteeEmail':
          valA = a.inviteeEmail.toLowerCase();
          valB = b.inviteeEmail.toLowerCase();
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'createdAt':
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case 'expiresAt':
          valA = new Date(a.expiresAt).getTime();
          valB = new Date(b.expiresAt).getTime();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [invitations, sortCol, sortDir]);

  if (isLoading) {
    return <div className="py-8 text-center text-xs font-mono text-muted">Loading invitations…</div>;
  }

  if (invitations.length === 0) {
    return (
      <div className="py-10 text-center text-xs font-mono text-muted border border-dashed border-border/80 p-6">
        No active invitations recorded for this cohort.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
            <th
              className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('inviteeEmail')}
            >
              Invitee Email <SortIcon active={sortCol === 'inviteeEmail'} direction={sortDir} />
            </th>
            <th
              className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
            </th>
            <th
              className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('createdAt')}
            >
              Sent On <SortIcon active={sortCol === 'createdAt'} direction={sortDir} />
            </th>
            <th
              className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('expiresAt')}
            >
              Expires On <SortIcon active={sortCol === 'expiresAt'} direction={sortDir} />
            </th>
            {canResend ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sortedInvitations.map((invite) => (
            <tr
              key={invite.invitationId}
              className="hover:bg-surface/80 transition-colors"
            >
              <td className="px-4 py-3.5 font-mono text-xs font-semibold text-card-foreground">
                {invite.inviteeEmail}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-block px-2 py-0.5 border text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm ${
                    invite.status === 'accepted'
                      ? 'border-border-strong bg-accent/10 text-card-foreground'
                      : invite.status === 'pending'
                        ? 'border-amber-600/50 bg-amber-500/10 text-amber-700'
                        : 'border-border bg-surface text-muted'
                  }`}
                >
                  {STATUS_LABEL[invite.status]}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted font-mono">
                {new Date(invite.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5 text-xs text-muted font-mono">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </td>
              {canResend ? (
                <td className="px-4 py-3.5 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={invite.status === 'accepted'}
                    isLoading={resendingId === invite.invitationId}
                    onClick={() => onResend(invite)}
                  >
                    Resend
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

export default InvitationStatusTable;
