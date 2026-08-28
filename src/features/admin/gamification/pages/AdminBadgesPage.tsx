import '../styles/gamification-admin.css';
import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, PageHeader, toast } from '@/shared/components';
import { useAdminBadges } from '../hooks/useAdminGamification';
import type { BadgeDto, CreateBadgePayload } from '../types';

const BADGE_TYPES: BadgeDto['badgeType'][] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'special',
];

const TRIGGER_TYPES: Array<{
  triggerType: NonNullable<CreateBadgePayload['criteria']>['triggerType'];
  label: string;
}> = [
  { triggerType: 'course_complete', label: 'Course completed' },
  { triggerType: 'lab_complete', label: 'Lab completed' },
  { triggerType: 'achievement_unlock', label: 'Achievement unlocked' },
  { triggerType: 'manual', label: 'Manual award' },
  { triggerType: 'points_threshold', label: 'Points threshold' },
];

interface BadgeDraft {
  badgeName: string;
  slug: string;
  description: string;
  badgeType: BadgeDto['badgeType'];
  iconUrl: string;
  pointsRequired: string;
  isHidden: boolean;
  triggerType: NonNullable<CreateBadgePayload['criteria']>['triggerType'] | '';
  triggerValue: string;
}

const emptyDraft: BadgeDraft = {
  badgeName: '',
  slug: '',
  description: '',
  badgeType: 'bronze',
  iconUrl: '',
  pointsRequired: '0',
  isHidden: false,
  triggerType: '',
  triggerValue: '',
};

function toPayload(draft: BadgeDraft): CreateBadgePayload {
  const payload: CreateBadgePayload = {
    badgeName: draft.badgeName.trim(),
    slug: draft.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    badgeType: draft.badgeType,
    pointsRequired: Number(draft.pointsRequired) || 0,
    isHidden: draft.isHidden,
  };
  if (draft.description.trim()) payload.description = draft.description.trim();
  if (draft.iconUrl.trim()) payload.iconUrl = draft.iconUrl.trim();
  if (draft.triggerType) {
    payload.criteria = {
      triggerType: draft.triggerType,
      triggerValue: parseTriggerValue(draft.triggerValue),
    };
  }
  return payload;
}

function parseTriggerValue(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new Error('Trigger value must be a valid JSON object.');
}

/** SCR-F7-07: platform-admin badge catalog management. */
export function AdminBadgesPage() {
  const { query, create, update } = useAdminBadges();
  const [draft, setDraft] = useState<BadgeDraft | null>(null);
  const [editing, setEditing] = useState<BadgeDto | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = (): void => {
    setEditing(null);
    setDraft({ ...emptyDraft });
  };

  const openEdit = (badge: BadgeDto): void => {
    setEditing(badge);
    setDraft({
      badgeName: badge.badgeName,
      slug: badge.slug,
      description: badge.description ?? '',
      badgeType: badge.badgeType,
      iconUrl: badge.iconUrl ?? '',
      pointsRequired: String(badge.pointsRequired),
      isHidden: badge.isHidden,
      triggerType: badge.criteria?.triggerType ?? '',
      triggerValue: JSON.stringify(badge.criteria?.triggerValue ?? {}),
    });
  };

  const close = (): void => {
    setDraft(null);
    setEditing(null);
  };

  const save = (): void => {
    if (!draft) return;
    if (draft.badgeName.trim().length < 3 || draft.slug.trim().length < 3) {
      toast.error('Badge name and slug must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) {
      toast.error('Slug may only contain lowercase letters, numbers and dashes.');
      return;
    }
    let payload: CreateBadgePayload;
    try {
      payload = toPayload(draft);
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Could not save the badge.');
      return;
    }
    setSaving(true);
    const request = editing
      ? update.mutateAsync({ badgeId: editing.badgeId, payload })
      : create.mutateAsync(payload);
    request
      .then(() => {
        toast.success(editing ? 'Badge updated.' : 'Badge created.');
        close();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not save the badge.');
      })
      .finally(() => setSaving(false));
  };

  const toggleHidden = (badge: BadgeDto): void => {
    update
      .mutateAsync({ badgeId: badge.badgeId, payload: { isHidden: !badge.isHidden } })
      .then(() => {
        toast.success(
          badge.isHidden ? 'Badge is now visible to learners.' : 'Badge hidden from learners.',
        );
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not update visibility.');
      });
  };

  return (
    <div>
      <PageHeader
        title="Badges"
        description="Create and edit the badge catalog. Hidden badges are never shown to learners."
        actions={<Button onClick={openCreate}>New badge</Button>}
      />

      {query.isLoading ? (
        <div className="admin-table-wrap" aria-hidden="true">
          <div className="admin-table admin-table--skeleton" />
        </div>
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Could not load the badge catalog.'}
          onRetry={() => void query.refetch()}
        />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No badges configured"
          description="Create your first badge to start rewarding learners."
        />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Badge</th>
                <th>Type</th>
                <th>Points</th>
                <th>Visibility</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((badge) => (
                <tr key={badge.badgeId}>
                  <td>
                    <strong>{badge.badgeName}</strong>
                    <span className="admin-table__muted">/{badge.slug}</span>
                  </td>
                  <td>{badge.badgeType}</td>
                  <td>{badge.pointsRequired}</td>
                  <td>{badge.isHidden ? 'Hidden' : 'Visible'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(badge)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleHidden(badge)}>
                        {badge.isHidden ? 'Unhide' : 'Hide'}
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
            <h2>{editing ? 'Edit badge' : 'New badge'}</h2>
            <div className="gamification-admin__grid">
              <label className="input-label">
                Badge name
                <input
                  className="input-field"
                  value={draft.badgeName}
                  onChange={(e) => setDraft({ ...draft, badgeName: e.target.value })}
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
                Type
                <select
                  className="input-field"
                  value={draft.badgeType}
                  onChange={(e) =>
                    setDraft({ ...draft, badgeType: e.target.value as BadgeDto['badgeType'] })
                  }
                >
                  {BADGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-label">
                Points required
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={draft.pointsRequired}
                  onChange={(e) => setDraft({ ...draft, pointsRequired: e.target.value })}
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
            <label className="input-label">
              Icon URL
              <input
                className="input-field"
                placeholder="https://…"
                value={draft.iconUrl}
                onChange={(e) => setDraft({ ...draft, iconUrl: e.target.value })}
              />
            </label>
            <fieldset className="gamification-admin__section">
              <legend>Award criteria (optional)</legend>
              <label className="input-label">
                Trigger type
                <select
                  className="input-field"
                  value={draft.triggerType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      triggerType: e.target.value as BadgeDraft['triggerType'],
                    })
                  }
                >
                  <option value="">None</option>
                  {TRIGGER_TYPES.map((trigger) => (
                    <option key={trigger.triggerType} value={trigger.triggerType}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-label">
                Trigger value (JSON object)
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder='{"count": 1}'
                  value={draft.triggerValue}
                  onChange={(e) => setDraft({ ...draft, triggerValue: e.target.value })}
                />
              </label>
            </fieldset>
            <label className="gamification-admin__check">
              <input
                type="checkbox"
                checked={draft.isHidden}
                onChange={(e) => setDraft({ ...draft, isHidden: e.target.checked })}
              />
              Hidden from learners
            </label>
            <div className="gamification-admin__actions">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={save} isLoading={saving}>
                {editing ? 'Save changes' : 'Create badge'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default AdminBadgesPage;
