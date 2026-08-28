import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Modal,
  PageHeader,
  toast,
} from '@/shared/components';
import { useAdminUserDetail } from '../hooks';
import { ROUTES } from '@/shared/constants';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusText(
  user: Pick<{ deletedAt: string | null; isBanned: boolean; isActive: boolean }, never> & {
    deletedAt: string | null;
    isBanned: boolean;
    isActive: boolean;
  },
): string {
  if (user.deletedAt) return 'Deleted';
  if (user.isBanned) return 'Banned';
  if (!user.isActive) return 'Inactive';
  return 'Active';
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const id = Number(userId);

  const { query, ban, unban, remove } = useAdminUserDetail(Number.isFinite(id) ? id : 0, id > 0);
  const [confirmBan, setConfirmBan] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banReason, setBanReason] = useState('');

  const canBan = banReason.trim().length >= 10;

  if (!Number.isFinite(id) || id < 1) {
    return <ErrorState message="Invalid user ID." onRetry={() => navigate('/admin/users')} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={query.error?.message ?? 'User not found.'}
        onRetry={() => navigate('/admin/users')}
      />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <>
        <div className="h-8 w-64 animate-pulse rounded-md bg-secondary" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-secondary" />
          <div className="h-64 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="mt-6 h-56 animate-pulse rounded-lg bg-secondary" />
      </>
    );
  }

  const user = query.data;
  const isAdmin = user.roles.includes('platform_admin');

  const handleBan = () => {
    if (!canBan) {
      toast.error('Ban reason must be at least 10 characters.');
      return;
    }
    ban.mutate(banReason, {
      onSuccess: () => {
        toast.success('User banned');
        setConfirmBan(false);
        setBanReason('');
      },
      onError: (error) => {
        toast.error(error.message);
        setConfirmBan(false);
      },
    });
  };

  const handleUnban = () => {
    unban.mutate(undefined, {
      onSuccess: () => toast.success('User unbanned'),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleDelete = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('User deleted');
        setConfirmDelete(false);
        navigate('/admin/users');
      },
      onError: (error) => {
        toast.error(error.message);
        setConfirmDelete(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName ?? user.username}
        description={`@${user.username} · ${user.email}`}
        actions={
          <div className="flex items-center gap-2">
            {/* F5 boundary exception (user-approved): entry point for SCR-F5-05. */}
            <Link
              to={ROUTES.ADMIN_USER_PROGRESS.replace(':userId', String(user.userId))}
              className="inline-block rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              View progress
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/users')}
            >
              Back to users
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-card-foreground">Account</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Status">{statusText(user)}</Row>
            <Row label="Roles">{user.roles.join(', ') || '—'}</Row>
            <Row label="Verified">{user.isVerified ? 'Yes' : 'No'}</Row>
            <Row label="Joined">{formatDate(user.createdAt)}</Row>
            {user.banReason ? <Row label="Ban reason">{user.banReason}</Row> : null}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {!user.isBanned && !isAdmin && !user.deletedAt ? (
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmBan(true)}>
                Ban user
              </Button>
            ) : null}
            {user.isBanned && !user.deletedAt ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUnban}
                isLoading={unban.isPending}
              >
                Unban user
              </Button>
            ) : null}
            {!user.deletedAt ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                isLoading={remove.isPending}
              >
                Delete user
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-card-foreground">Engagement</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Followers">{user.followersCount}</Row>
            <Row label="Following">{user.followingCount}</Row>
            <Row label="Profile views">{user.profile?.profileViews ?? 0}</Row>
            <Row label="Reputation">{user.profile?.reputationScore ?? 0}</Row>
          </dl>
          {user.skills.length > 0 ? (
            <div className="mt-3 text-sm text-muted-foreground">
              {user.skills.map((skill) => skill.skillName).join(', ')}
            </div>
          ) : null}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-card-foreground">Login history</h2>
        {user.loginHistory.length === 0 ? (
          <p className="text-sm text-muted">No recorded sign-ins yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Method</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {user.loginHistory.map((login) => (
                <tr key={login.loginId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{formatDate(login.createdAt)}</td>
                  <td className="px-3 py-2">{login.loginType}</td>
                  <td className="px-3 py-2">{login.ipAddress ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {login.isSuccessful ? 'Success' : 'Failed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={confirmBan}
        onClose={ban.isPending ? () => undefined : () => setConfirmBan(false)}
        title="Ban this user?"
      >
        <p className="modal-panel__body">
          The reason is stored with the audit log entry and shown to other admins.
        </p>
        <label htmlFor="ban-reason" className="input-label">
          Reason
        </label>
        <textarea
          id="ban-reason"
          rows={3}
          className={`input-field w-full resize-y ${banReason.length > 0 && !canBan ? 'input-field--error' : ''}`}
          placeholder="Reason (min 10 characters)…"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
        />
        <div className="modal-panel__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmBan(false)}
            disabled={ban.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleBan}
            isLoading={ban.isPending}
            disabled={!canBan}
          >
            Ban user
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete user?"
        message={`${user.fullName ?? user.username} will be soft-deleted. Their profile becomes inaccessible and the action is recorded in the audit log.`}
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-card-foreground">{children}</dd>
    </div>
  );
}

export default AdminUserDetailPage;
