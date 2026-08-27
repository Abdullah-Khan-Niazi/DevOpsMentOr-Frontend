import { useState } from 'react';
import { Button, Card, ConfirmDialog, toast } from '@/shared/components';
import { useAdminInvites } from '@/features/auth/hooks';
import type { AdminInvitePayload, PendingAdminInvite } from '@/features/auth/types';
import { AdminInviteForm } from '../components/AdminInviteForm';
import { InvitationStatusTable } from '../components/InvitationStatusTable';
import '@/shared/styles/app.css';
import './AdminPlatformAdminsPage.css';

export default function AdminPlatformAdminsPage() {
  const { list, send, revoke, refetch } = useAdminInvites();
  const [revokeTarget, setRevokeTarget] = useState<PendingAdminInvite | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleSend = (values: AdminInvitePayload) => {
    send.mutate(values, {
      onSuccess: () => {
        toast.success('Invitation sent');
        void refetch();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    setRevokingId(revokeTarget.id);
    revoke.mutate(revokeTarget.id, {
      onSuccess: () => {
        toast.success('Invitation revoked');
        setRevokeTarget(null);
        setRevokingId(null);
        void refetch();
      },
      onError: (error) => {
        toast.error(error.message);
        setRevokeTarget(null);
        setRevokingId(null);
      },
    });
  };

  return (
    <div>
      <header className="app-page-header">
        <h1 className="app-page-header__title">Platform administrators</h1>
        <p className="app-page-header__description">
          Invite administrators and manage pending invitations. Admin accounts can only be created
          through this invitation flow.
        </p>
      </header>

      <div className="admin-stack">
        <Card className="admin-card">
          <h2 className="admin-card__title">Invite an administrator</h2>
          <AdminInviteForm isPending={send.isPending} onSubmit={handleSend} />
        </Card>

        <Card className="admin-card">
          <h2 className="admin-card__title">Pending invitations</h2>
          {list.isError ? (
            <div className="flex flex-col gap-3">
              <p className="auth-alert auth-alert--error" role="alert">
                {list.error.message}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <InvitationStatusTable
              invites={list.data}
              isLoading={list.isLoading}
              revokingId={revokingId}
              onRevoke={setRevokeTarget}
            />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke invitation?"
        message={`Revoke this invitation? ${revokeTarget?.fullName ?? ''} (${revokeTarget?.email ?? ''}) will no longer be able to activate the account.`}
        confirmLabel="Revoke"
        isLoading={revokingId !== null}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
