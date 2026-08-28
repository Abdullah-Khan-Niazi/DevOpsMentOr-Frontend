import '../styles/gamification-admin.css';
import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, PageHeader, toast } from '@/shared/components';
import { useAdminSeasons } from '../hooks/useAdminGamification';
import type { CreateSeasonPayload, SeasonContentPayload, UpdateSeasonPayload } from '../types';

interface ContentDraft {
  contentId: string;
  releaseOrder: string;
  isReleased: boolean;
}

interface SeasonDraft {
  seasonName: string;
  seasonNumber: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  content: ContentDraft[];
}

const emptyDraft: SeasonDraft = {
  seasonName: '',
  seasonNumber: '',
  description: '',
  startDate: '',
  endDate: '',
  isActive: true,
  content: [],
};

function toPayload(draft: SeasonDraft): CreateSeasonPayload {
  return {
    seasonName: draft.seasonName.trim(),
    seasonNumber: Number(draft.seasonNumber),
    description: draft.description.trim() || undefined,
    startDate: draft.startDate,
    endDate: draft.endDate,
    isActive: draft.isActive,
  };
}

function toContentPayload(items: ContentDraft[]): SeasonContentPayload[] {
  return items
    .map((item) => ({
      contentType: 'lab' as const,
      contentId: Number(item.contentId),
      releaseOrder: Number(item.releaseOrder) || 0,
      isReleased: item.isReleased,
    }))
    .filter((item) => Number.isInteger(item.contentId) && item.contentId > 0);
}

/** SCR-F7-09: platform-admin season management. */
export function AdminSeasonsPage() {
  const { query, create, update } = useAdminSeasons();
  const [draft, setDraft] = useState<SeasonDraft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = (): void => {
    setEditingId(null);
    setDraft({ ...emptyDraft });
  };

  const openEdit = (seasonId: number): void => {
    const season = (query.data ?? []).find((item) => item.seasonId === seasonId);
    if (!season) return;
    setEditingId(seasonId);
    setDraft({
      seasonName: season.seasonName,
      seasonNumber: String(season.seasonNumber),
      description: season.description ?? '',
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
      content: [],
    });
  };

  const close = (): void => {
    setDraft(null);
    setEditingId(null);
  };

  const save = (): void => {
    if (!draft) return;
    if (!draft.seasonName.trim()) {
      toast.error('Season name is required.');
      return;
    }
    if (!Number.isInteger(Number(draft.seasonNumber)) || Number(draft.seasonNumber) <= 0) {
      toast.error('Season number must be a positive integer.');
      return;
    }
    if (!draft.startDate || !draft.endDate) {
      toast.error('Start and end dates are required.');
      return;
    }
    if (draft.endDate <= draft.startDate) {
      toast.error('End date must be after the start date.');
      return;
    }
    setSaving(true);
    const payload: CreateSeasonPayload = toPayload(draft);
    const updatePayload: UpdateSeasonPayload =
      editingId !== null
        ? draft.content.length > 0
          ? { ...payload, content: toContentPayload(draft.content) }
          : payload
        : payload;
    const request =
      editingId !== null
        ? update.mutateAsync({ seasonId: editingId, payload: updatePayload })
        : create.mutateAsync(payload);
    request
      .then(() => {
        toast.success(editingId !== null ? 'Season updated.' : 'Season created.');
        close();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not save the season.');
      })
      .finally(() => setSaving(false));
  };

  const toggleActive = (seasonId: number): void => {
    const season = (query.data ?? []).find((item) => item.seasonId === seasonId);
    if (!season) return;
    update
      .mutateAsync({ seasonId, payload: { isActive: !season.isActive } })
      .then(() => {
        toast.success(season.isActive ? 'Season deactivated.' : 'Season activated.');
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not update the season.');
      });
  };

  const addContentRow = (): void => {
    setDraft((current) =>
      current
        ? {
            ...current,
            content: [...current.content, { contentId: '', releaseOrder: '0', isReleased: false }],
          }
        : current,
    );
  };

  const updateContentRow = (index: number, patch: Partial<ContentDraft>): void => {
    setDraft((current) =>
      current
        ? {
            ...current,
            content: current.content.map((row, i) => (i === index ? { ...row, ...patch } : row)),
          }
        : current,
    );
  };

  const removeContentRow = (index: number): void => {
    setDraft((current) =>
      current ? { ...current, content: current.content.filter((_, i) => i !== index) } : current,
    );
  };

  return (
    <div>
      <PageHeader
        title="Seasons"
        description="Create time-boxed ranking periods and assign labs to them."
        actions={<Button onClick={openCreate}>New season</Button>}
      />

      {query.isLoading ? (
        <div className="admin-table-wrap" aria-hidden="true">
          <div className="admin-table admin-table--skeleton" />
        </div>
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Could not load seasons.'}
          onRetry={() => void query.refetch()}
        />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No seasons yet"
          description="Create a season to start ranking periods."
        />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Season</th>
                <th>Number</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((season) => (
                <tr key={season.seasonId}>
                  <td>
                    <strong>{season.seasonName}</strong>
                  </td>
                  <td>{season.seasonNumber}</td>
                  <td>{season.startDate}</td>
                  <td>{season.endDate}</td>
                  <td>{season.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(season.seasonId)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(season.seasonId)}
                      >
                        {season.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {draft ? (
        <div className="modal-backdrop">
          <Card className="gamification-admin__form">
            <h2>{editingId !== null ? 'Edit season' : 'New season'}</h2>
            <div className="gamification-admin__grid">
              <label className="input-label">
                Season name
                <input
                  className="input-field"
                  value={draft.seasonName}
                  onChange={(e) => setDraft({ ...draft, seasonName: e.target.value })}
                />
              </label>
              <label className="input-label">
                Season number
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={draft.seasonNumber}
                  onChange={(e) => setDraft({ ...draft, seasonNumber: e.target.value })}
                />
              </label>
            </div>
            <label className="input-label">
              Description
              <textarea
                className="input-field"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <div className="gamification-admin__grid">
              <label className="input-label">
                Start date
                <input
                  className="input-field"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </label>
              <label className="input-label">
                End date
                <input
                  className="input-field"
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                />
              </label>
            </div>

            {editingId !== null ? (
              <fieldset className="gamification-admin__section">
                <legend>Season content (labs)</legend>
                {draft.content.map((row, index) => (
                  <div key={index} className="gamification-admin__content-row">
                    <label className="input-label">
                      Lab ID
                      <input
                        className="input-field"
                        type="number"
                        min={1}
                        value={row.contentId}
                        onChange={(e) => updateContentRow(index, { contentId: e.target.value })}
                      />
                    </label>
                    <label className="input-label">
                      Release order
                      <input
                        className="input-field"
                        type="number"
                        min={0}
                        value={row.releaseOrder}
                        onChange={(e) => updateContentRow(index, { releaseOrder: e.target.value })}
                      />
                    </label>
                    <label className="gamification-admin__check">
                      <input
                        type="checkbox"
                        checked={row.isReleased}
                        onChange={(e) => updateContentRow(index, { isReleased: e.target.checked })}
                      />
                      Released
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => removeContentRow(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="gamification-admin__actions">
                  <Button variant="secondary" size="sm" onClick={addContentRow}>
                    Add lab
                  </Button>
                </div>
              </fieldset>
            ) : null}

            <label className="gamification-admin__check">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              Active
            </label>
            <div className="gamification-admin__actions">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={save} isLoading={saving}>
                {editingId !== null ? 'Save changes' : 'Create season'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default AdminSeasonsPage;
