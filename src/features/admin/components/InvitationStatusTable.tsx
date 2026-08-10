import { Button, EmptyState, LoadingState } from '@/shared/components';
import type { PendingAdminInvite } from '@/features/auth/types';

// InvitationStatusTable — pending platform-admin invitations with revoke
// (plain-text status, no pills/badges §2.2; confirm dialog before revoke).

interface InvitationStatusTableProps {
  invites: PendingAdminInvite[] | undefined;
  isLoading: boolean;
  revokingId: string | null;
  onRevoke: (invite: PendingAdminInvite) => void;
}

function formatExpiry(iso: string): string {
  const expiresAt = new Date(iso);
  if (Number.isNaN(expiresAt.getTime())) return iso;
  return expiresAt.toLocaleString();
}

export function InvitationStatusTable({
  invites,
  isLoading,
  revokingId,
  onRevoke,
}: InvitationStatusTableProps) {
  if (isLoading) {
    return (
      <div className="admin-table-card">
        <LoadingState label="Loading invitations…" />
      </div>
    );
  }

  if (!invites || invites.length === 0) {
    return (
      <div className="admin-table-card">
        <EmptyState title="No pending invitations." description="" />
      </div>
    );
  }

  return (
    <div className="admin-table-card">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Full name</th>
            <th scope="col">Email</th>
            <th scope="col">Expires</th>
            <th scope="col" className="admin-table__actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td className="admin-table__strong">{invite.fullName}</td>
              <td>{invite.email}</td>
              <td>{formatExpiry(invite.expiresAt)}</td>
              <td className="admin-table__actions">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onRevoke(invite)}
                  disabled={revokingId === invite.id}
                  isLoading={revokingId === invite.id}
                >
                  Revoke
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
