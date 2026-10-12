import { useState, useMemo } from 'react';
import { Button, Card, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useAdminTracks } from '../hooks';
import { labsService } from '../services';
import type { AdminTrackDto, CreateTrackPayload } from '../types';

/** LAB-19/20/21: admin track management — create and edit ordered paths. */
export function AdminTracksPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAdminTracks();
  const [editing, setEditing] = useState<AdminTrackDto | null>(null);
  const [draft, setDraft] = useState<CreateTrackPayload | null>(null);
  const [saving, setSaving] = useState(false);

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.tracks('all') });
  };

  const openCreate = (): void => {
    setEditing(null);
    setDraft({ trackName: '', slug: '', totalLabs: 0, content: [] });
  };

  const openEdit = (track: AdminTrackDto): void => {
    setEditing(track);
    setDraft({
      trackName: track.trackName,
      slug: track.slug,
      description: track.description ?? undefined,
      difficultyId: track.difficultyId ?? undefined,
      totalLabs: 0,
      content: [],
    });
  };

  const save = (): void => {
    if (!draft) {
      return;
    }
    if (draft.trackName.trim().length === 0 || draft.slug.trim().length === 0) {
      toast.error('Track name and slug are required.');
      return;
    }
    setSaving(true);
    const request = editing
      ? labsService.adminUpdateTrack(editing.trackId, draft)
      : labsService.adminCreateTrack(draft);
    request
      .then(() => {
        toast.success(editing ? 'Track updated.' : 'Track created.');
        setDraft(null);
        setEditing(null);
        invalidate();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not save track.');
      })
      .finally(() => setSaving(false));
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTracks = useMemo(() => {
    if (!data) return [];
    return data.filter((track) => {
      if (statusFilter === 'published' && !track.isActive) return false;
      if (statusFilter === 'draft' && track.isActive) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!track.trackName.toLowerCase().includes(q) && !track.slug.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Tracks"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Track
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          title="Could not load tracks"
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card style={{ borderRadius: 0 }}>
          {/* Single-line filter toolbar */}
          <div className="mb-4 flex items-center gap-1.5 w-full">
            <input
              id="tracks-search"
              className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
              placeholder="Search track name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              id="tracks-status-filter"
              className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
                style={{ borderRadius: 0 }}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Track</th>
                  <th className="px-3 py-2 font-medium">Hours</th>
                  <th className="px-3 py-2 font-medium">Difficulty</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track) => (
                  <tr key={track.trackId} className="border-b border-border/60 last:border-0 hover:bg-surface/50 active:bg-surface-hover/60 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-card-foreground">{track.trackName}</div>
                      <div className="text-[11px] text-muted font-mono">/{track.slug}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{track.estimatedHours} hrs</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{track.difficultyName ?? 'Any'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs">
                      <span className={track.isActive ? 'font-semibold text-card-foreground' : 'text-muted'}>
                        {track.isActive ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(track)} style={{ borderRadius: 0 }}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {draft && (
        <div className="modal-backdrop">
          <Card className="lab-admin-form">
            <h2>{editing ? 'Edit track' : 'New track'}</h2>
            <label className="input-label">
              Track name
              <input
                className="input-field"
                value={draft.trackName}
                onChange={(e) => setDraft({ ...draft, trackName: e.target.value })}
              />
            </label>
            <label className="input-label">
              Slug
              <input
                className="input-field"
                value={draft.slug}
                onChange={(e) =>
                  setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }
              />
            </label>
            <label className="input-label">
              Description
              <textarea
                className="input-field"
                rows={3}
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <div className="lab-admin-form__grid">
              <label className="input-label">
                Difficulty ID
                <input
                  className="input-field"
                  type="number"
                  value={draft.difficultyId ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      difficultyId: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="input-label">
                Category ID
                <input
                  className="input-field"
                  type="number"
                  value={draft.categoryId ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      categoryId: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="input-label">
                Total labs
                <input
                  className="input-field"
                  type="number"
                  value={draft.totalLabs}
                  onChange={(e) => setDraft({ ...draft, totalLabs: Number(e.target.value) })}
                />
              </label>
              <label className="input-label">
                Premium
                <select
                  className="input-field"
                  value={draft.isPremium ? '1' : '0'}
                  onChange={(e) => setDraft({ ...draft, isPremium: e.target.value === '1' })}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </label>
            </div>
            <p className="lab-admin-form__note">
              Content items (labs and courses with display order and required flags) are managed via
              the API.
            </p>
            <div className="lab-admin-form__actions">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={save} isLoading={saving}>
                {editing ? 'Save changes' : 'Create track'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminTracksPage;
