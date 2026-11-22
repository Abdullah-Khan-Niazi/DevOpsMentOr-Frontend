import { useState } from 'react';
import { Card, ConfirmDialog, ErrorState, toast } from '@/shared/components';
import { useAdminInvites } from '@/features/auth/hooks';
import type { AdminInvitePayload, PendingAdminInvite } from '@/features/auth/types';
import { AdminInviteForm } from '../components/AdminInviteForm';
import { InvitationStatusTable } from '../components/InvitationStatusTable';
import { AdminPlatformAdminsSkeleton } from './AdminPlatformAdminsSkeleton';
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

  if (list.isLoading) return <AdminPlatformAdminsSkeleton />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <header className="app-page-header">
        <h1 className="app-page-header__title">Platform administrators</h1>
      </header>

      <div className="admin-stack">
        <Card className="admin-card">
          <h2 className="admin-card__title">Invite an administrator</h2>
          <AdminInviteForm isPending={send.isPending} onSubmit={handleSend} />
        </Card>

        <Card className="admin-card">
          <h2 className="admin-card__title">Pending invitations</h2>
          {list.isError ? (
            <ErrorState
              error={list.error}
              onRetry={() => void refetch()}
              retrying={list.isRefetching}
              compact
            />
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
