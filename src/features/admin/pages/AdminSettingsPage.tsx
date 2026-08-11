import { useState } from 'react';
import { Button, Card, ErrorState, Modal, PageHeader, toast } from '@/shared/components';
import { useAdminSystemSettings } from '../hooks';
import type { SystemSetting } from '../types';

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return value === null ? 'null' : JSON.stringify(value);
}

export function AdminSettingsPage() {
  const { query, update } = useAdminSystemSettings();
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [editValue, setEditValue] = useState('');

  const openEditor = (setting: SystemSetting) => {
    setEditing(setting);
    setEditValue(displayValue(setting.settingValue));
  };

  const saveEdit = () => {
    if (!editing) return;
    update.mutate(
      { key: editing.settingKey, value: normalize(editValue) },
      {
        onSuccess: () => {
          toast.success('Setting saved');
          setEditing(null);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const normalize = (raw: string): unknown => {
    if (editing?.settingValue !== null && typeof editing?.settingValue !== 'string') {
      const num = Number(raw);
      if (!Number.isNaN(num) && raw.trim() !== '') return num;
      if (raw === 'true') return true;
      if (raw === 'false') return false;
    }
    return raw;
  };

  return (
    <div>
      <PageHeader
        title="System settings"
        description="Platform-wide configuration. Changes are recorded in the audit log."
      />

      {query.isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-secondary" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Unable to load settings.'}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {query.data ? (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Setting</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((setting) => (
                <tr key={setting.settingId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-card-foreground">{setting.settingKey}</div>
                    {setting.description ? (
                      <div className="text-xs text-muted">{setting.description}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {displayValue(setting.settingValue)}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{setting.groupName ?? '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {setting.isEditable ? (
                      <button
                        type="button"
                        onClick={() => openEditor(setting)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Modal
        open={editing !== null}
        onClose={update.isPending ? () => undefined : () => setEditing(null)}
        title={`Edit ${editing?.settingKey ?? ''}`}
      >
        <p className="modal-panel__body">The previous value is recorded in the audit log.</p>
        <label htmlFor="setting-value" className="input-label">
          Value
        </label>
        {editing ? (
          <input
            id="setting-value"
            className="input-field w-full"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        ) : null}
        <div className="modal-panel__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditing(null)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={saveEdit}
            isLoading={update.isPending}
            disabled={!editing || editValue.trim() === ''}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminSettingsPage;
