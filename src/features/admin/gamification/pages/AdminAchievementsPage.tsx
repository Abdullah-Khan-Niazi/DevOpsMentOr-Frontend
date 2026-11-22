import '../styles/gamification-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  PageHeader,
  toast,
} from '@/shared/components';
import { AdminAchievementsSkeleton } from './AdminAchievementsSkeleton';
import { useAdminAchievements } from '../hooks/useAdminGamification';
import type { CreateAchievementPayload } from '../types';

const TRIGGER_TYPES: Array<{
  value: CreateAchievementPayload['triggerType'];
  label: string;
}> = [
  { value: 'lab_completions', label: 'Lab completions' },
  { value: 'course_completions', label: 'Course completions' },
  { value: 'streak_days', label: 'Streak days' },
  { value: 'points_balance', label: 'Points balance' },
];

interface AchievementDraft {
  name: string;
  description: string;
  pointsAwarded: string;
  triggerType: CreateAchievementPayload['triggerType'];
  triggerValue: string;
  isActive: boolean;
}

const emptyDraft: AchievementDraft = {
  name: '',
  description: '',
  pointsAwarded: '0',
  triggerType: 'lab_completions',
  triggerValue: '{}',
  isActive: true,
};

/** SCR-F7-08: platform-admin achievement catalog management. */
export function AdminAchievementsPage() {
  const { query, create, update } = useAdminAchievements();
  const [draft, setDraft] = useState<AchievementDraft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = (): void => {
    setEditingId(null);
    setDraft({ ...emptyDraft });
  };

  const openEdit = (achievementId: number): void => {
    const achievement = (query.data ?? []).find((item) => item.achievementId === achievementId);
    if (!achievement) return;
    setEditingId(achievementId);
    setDraft({
      name: achievement.name,
      description: achievement.description ?? '',
      pointsAwarded: String(achievement.pointsAwarded),
      triggerType:
        (achievement.triggerType as CreateAchievementPayload['triggerType']) ?? 'lab_completions',
      triggerValue: '{}',
      isActive: achievement.isActive,
    });
  };

  const close = (): void => {
    setDraft(null);
    setEditingId(null);
  };

  const save = (): void => {
    if (!draft) return;
    if (draft.name.trim().length < 3) {
      toast.error('Achievement name must be at least 3 characters.');
      return;
    }
    let triggerValue: Record<string, unknown>;
    try {
      triggerValue = JSON.parse(draft.triggerValue) as Record<string, unknown>;
      if (
        triggerValue === null ||
        typeof triggerValue !== 'object' ||
        Array.isArray(triggerValue)
      ) {
        throw new Error('Trigger value must be a valid JSON object.');
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Trigger value must be valid JSON.');
      return;
    }
    const payload: CreateAchievementPayload = {
      name: draft.name.trim(),
      pointsAwarded: Number(draft.pointsAwarded) || 0,
      triggerType: draft.triggerType,
      triggerValue,
      isActive: draft.isActive,
    };
    if (draft.description.trim()) payload.description = draft.description.trim();
    setSaving(true);
    const request =
      editingId !== null
        ? update.mutateAsync({ achievementId: editingId, payload })
        : create.mutateAsync(payload);
    request
      .then(() => {
        toast.success(editingId !== null ? 'Achievement updated.' : 'Achievement created.');
        close();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not save the achievement.');
      })
      .finally(() => setSaving(false));
  };

  const toggleActive = (achievementId: number): void => {
    const achievement = (query.data ?? []).find((item) => item.achievementId === achievementId);
    if (!achievement) return;
    update
      .mutateAsync({ achievementId, payload: { isActive: !achievement.isActive } })
      .then(() => {
        toast.success(achievement.isActive ? 'Achievement deactivated.' : 'Achievement activated.');
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not update the achievement.');
      });
  };

  if (query.isLoading) {
    return <AdminAchievementsSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="Achievements"
        actions={<Button onClick={openCreate}>New achievement</Button>}
      />

      {query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Could not load the achievement catalog.'}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState icon="award" title="No achievements configured" />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Achievement</th>
                <th>Trigger</th>
                <th>Points</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((achievement) => (
                <tr key={achievement.achievementId}>
                  <td>
                    <strong>{achievement.name}</strong>
                    {achievement.description ? (
                      <div className="admin-table__muted">{achievement.description}</div>
                    ) : null}
                  </td>
                  <td>{achievement.triggerType ?? '–'}</td>
                  <td>{achievement.pointsAwarded}</td>
                  <td>{achievement.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(achievement.achievementId)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(achievement.achievementId)}
                        isLoading={
                          update.isPending &&
                          update.variables?.achievementId === achievement.achievementId
                        }
                        disabled={update.isPending}
                      >
                        {achievement.isActive ? 'Deactivate' : 'Activate'}
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
        <Drawer
          open
          onClose={close}
          title={editingId !== null ? 'Edit achievement' : 'New achievement'}
          busy={saving}
          footer={(requestClose) => (
            <>
              <Button variant="ghost" onClick={requestClose}>
                Cancel
              </Button>
              <Button onClick={save} isLoading={saving}>
                {editingId !== null ? 'Save changes' : 'Create achievement'}
              </Button>
            </>
          )}
        >
          <div className="gamification-admin__form">
            <label className="input-label">
              Name
              <input
                className="input-field"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
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
                Trigger type
                <select
                  className="input-field"
                  value={draft.triggerType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      triggerType: e.target.value as CreateAchievementPayload['triggerType'],
                    })
                  }
                >
                  {TRIGGER_TYPES.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-label">
                Points awarded
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={draft.pointsAwarded}
                  onChange={(e) => setDraft({ ...draft, pointsAwarded: e.target.value })}
                />
              </label>
            </div>
            <label className="input-label">
              Trigger value (JSON object)
              <textarea
                className="input-field"
                rows={3}
                placeholder='{"count": 5}'
                value={draft.triggerValue}
                onChange={(e) => setDraft({ ...draft, triggerValue: e.target.value })}
              />
            </label>
            <label className="gamification-admin__check">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}

export default AdminAchievementsPage;
