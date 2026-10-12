import { Button } from '@/shared/components';
import type { InvitationDto } from '../types';

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

/** F3 contract §10: invitation status table with per-row resend action. */
export function InvitationStatusTable({
  invitations,
  isLoading,
  resendingId = null,
  canResend = false,
  onResend,
}: InvitationStatusTableProps) {
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
            <th className="px-4 py-3 font-medium">Invitee Email</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Sent On</th>
            <th className="px-4 py-3 font-medium">Expires On</th>
            {canResend ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {invitations.map((invite) => (
            <tr
              key={invite.invitationId}
              className="hover:bg-surface/80 transition-colors"
            >
              <td className="px-4 py-3.5 font-mono text-xs font-semibold text-card-foreground">
                {invite.inviteeEmail}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-block px-2 py-0.5 border text-[10px] font-mono font-semibold uppercase tracking-wider ${
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
