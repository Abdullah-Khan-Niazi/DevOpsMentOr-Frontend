import { useState, useMemo } from 'react';
import { Button, Card, ErrorState, Modal, PageHeader, DetailFormSkeleton, toast } from '@/shared/components';
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
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

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

  const availableGroups = useMemo(() => {
    if (!query.data) return [];
    const set = new Set<string>();
    query.data.forEach((s) => {
      if (s.groupName) set.add(s.groupName);
    });
    return Array.from(set);
  }, [query.data]);

  const filteredSettings = useMemo(() => {
    if (!query.data) return [];
    return query.data.filter((setting) => {
      if (selectedGroup !== 'all' && setting.groupName !== selectedGroup) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const keyMatch = setting.settingKey.toLowerCase().includes(q);
        const descMatch = setting.description?.toLowerCase().includes(q);
        if (!keyMatch && !descMatch) return false;
      }
      return true;
    });
  }, [query.data, selectedGroup, search]);

  if (query.isLoading) {
    return <DetailFormSkeleton />;
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title="System Settings" />

      {query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Unable to load settings.'}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {query.data ? (
        <Card>
          {/* Single Responsive Filter Toolbar */}
          <div className="mb-4 flex items-center gap-1.5 w-full">
            <input
              id="settings-search"
              className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
              placeholder="Search setting key or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              id="settings-group"
              className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">All Groups</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {(search || selectedGroup !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedGroup('all');
                }}
                className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
               
              >
                Reset
              </Button>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Setting Key</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium w-28">Group</th>
                  <th className="px-3 py-2 font-medium w-28">Updated</th>
                  <th className="px-3 py-2 font-medium w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettings.map((setting) => (
                  <tr key={setting.settingId} className="border-b border-border/60 last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-2 font-semibold text-card-foreground">
                      {setting.settingKey}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-card-foreground">
                      <span>
                        {displayValue(setting.settingValue)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {setting.groupName ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">
                      {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {setting.isEditable ? (
                        <button
                          type="button"
                          onClick={() => openEditor(setting)}
                          className="px-2.5 py-1 text-xs font-mono rounded-xs border border-border bg-surface text-card-foreground hover:bg-card-foreground hover:text-surface transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal
        open={editing !== null}
        onClose={update.isPending ? () => undefined : () => setEditing(null)}
        title={`Edit ${editing?.settingKey ?? ''}`}
      >
        <div className="space-y-4 font-mono text-xs">
          <div>
            <label htmlFor="setting-value" className="input-label block mb-1">
              Configuration Value
            </label>
            {editing ? (
              <input
                id="setting-value"
                className="input-field w-full font-mono text-xs"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
               
              />
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              variant="primary"
              onClick={saveEdit}
              isLoading={update.isPending}
              disabled={!editing || editValue.trim() === ''}
             
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminSettingsPage;
