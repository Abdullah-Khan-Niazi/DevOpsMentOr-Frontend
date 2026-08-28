import { useState } from 'react';
import {
  Button,
  Card,
  ConfirmDialog,
  Input,
  LoadingState,
  Modal,
  toast,
} from '@/shared/components';
import { useApiTokens } from '@/features/auth/hooks';
import { ApiTokenRevealModal } from '@/features/auth/components/ApiTokenRevealModal';
import type { ApiToken } from '@/features/auth/types';
import '@/shared/styles/app.css';
import './SettingsSecurity.css';

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function ApiTokensPage() {
  const { list, create, revoke, refetch } = useApiTokens();
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [revealed, setRevealed] = useState<{ name: string; rawToken: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const openCreate = () => {
    setTokenName('');
    setExpiresInDays('');
    setCreateOpen(true);
  };

  const handleCreate = () => {
    if (!tokenName.trim()) return;
    create.mutate(
      {
        tokenName: tokenName.trim(),
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          setRevealed({ name: created.tokenName, rawToken: created.rawToken });
          void refetch();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    setRevokingId(revokeTarget.tokenId);
    revoke.mutate(revokeTarget.tokenId, {
      onSuccess: () => {
        toast.success('Token revoked');
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
        <h1 className="app-page-header__title">API tokens</h1>
        <p className="app-page-header__description">
          Personal tokens for API access. A token is shown only once, at creation.
        </p>
      </header>

      <div className="settings-stack">
        <Card className="settings-card">
          <h2 className="settings-card__title">Your tokens</h2>
          <div className="settings-card__body">
            {list.isLoading ? <LoadingState label="Loading tokens…" /> : null}

            {list.isError ? (
              <div className="flex flex-col gap-3">
                <p className="auth-alert auth-alert--error" role="alert">
                  {list.error.message}
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            ) : null}

            {list.data && list.data.length === 0 ? (
              <p>No API tokens created.</p>
            ) : (
              <div className="token-list">
                {list.data?.map((token) => (
                  <div key={token.tokenId} className="token-list__row">
                    <div className="token-list__info">
                      <span className="token-list__name">{token.tokenName}</span>
                      <span className="token-list__meta">
                        Created {formatDate(token.createdAt)} · Expires{' '}
                        {formatDate(token.expiresAt)} · Last used {formatDate(token.lastUsedAt)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setRevokeTarget(token)}
                      disabled={revokingId === token.tokenId}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Button type="button" onClick={openCreate}>
              Create token
            </Button>
          </div>
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create API token">
        <div className="flex flex-col gap-4">
          <Input
            label="Token name"
            type="text"
            placeholder="ci-deploy-agent"
            value={tokenName}
            onChange={(event) => setTokenName(event.target.value)}
            maxLength={100}
            hint="1–100 characters"
          />
          <Input
            label="Expires in (days)"
            type="number"
            min={1}
            placeholder="Leave empty for no expiry"
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.target.value)}
          />

          {create.isError ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {create.error.message}
            </p>
          ) : null}

          <div className="modal-panel__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              isLoading={create.isPending}
              disabled={!tokenName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <ApiTokenRevealModal
        open={revealed !== null}
        tokenName={revealed?.name ?? ''}
        rawToken={revealed?.rawToken ?? ''}
        onClose={() => setRevealed(null)}
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke token?"
        message={`Revoke token? ${revokeTarget?.tokenName ?? ''} will stop working immediately.`}
        confirmLabel="Revoke"
        isLoading={revokingId !== null}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
