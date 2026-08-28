import '../styles/labs.css';
import { useState } from 'react';
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

  return (
    <div>
      <PageHeader title="Tracks" description="Create and edit learning tracks." />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>New track</Button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          title="Could not load tracks"
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Hours</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((track) => (
                <tr key={track.trackId}>
                  <td>
                    <strong>{track.trackName}</strong>
                    <span className="admin-table__muted">/{track.slug}</span>
                  </td>
                  <td>{track.estimatedHours} hrs</td>
                  <td>{track.difficultyName ?? 'Any'}</td>
                  <td>{track.isActive ? 'Published' : 'Draft'}</td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(track)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
