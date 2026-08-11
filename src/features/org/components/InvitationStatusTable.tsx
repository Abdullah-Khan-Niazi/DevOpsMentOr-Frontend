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
    return <p className="py-6 text-sm text-slate-500">Loading invitations…</p>;
  }

  if (invitations.length === 0) {
    return <p className="py-6 text-sm text-slate-500">No invitations sent yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
          <th className="px-3 py-2 font-medium">Invitee</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Sent</th>
          <th className="px-3 py-2 font-medium">Expires</th>
          {canResend ? <th className="px-3 py-2 font-medium">Actions</th> : null}
        </tr>
      </thead>
      <tbody>
        {invitations.map((invite) => (
          <tr
            key={invite.invitationId}
            className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
          >
            <td className="px-3 py-2.5 font-medium text-slate-900">{invite.inviteeEmail}</td>
            <td className="px-3 py-2.5">
              <span
                className={
                  invite.status === 'accepted'
                    ? 'text-green-700'
                    : invite.status === 'pending'
                      ? 'text-amber-700'
                      : 'text-slate-500'
                }
              >
                {STATUS_LABEL[invite.status]}
              </span>
            </td>
            <td className="px-3 py-2.5 text-slate-600">
              {new Date(invite.createdAt).toLocaleDateString()}
            </td>
            <td className="px-3 py-2.5 text-slate-600">
              {new Date(invite.expiresAt).toLocaleDateString()}
            </td>
            {canResend ? (
              <td className="px-3 py-2.5">
                <Button
                  variant="ghost"
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
  );
}

export default InvitationStatusTable;
