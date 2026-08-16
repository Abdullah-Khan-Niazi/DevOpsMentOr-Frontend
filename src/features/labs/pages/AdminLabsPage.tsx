import '../styles/labs.css';
import { useState } from 'react';
import { Button, Card, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useAdminLabs } from '../hooks';
import { labsService } from '../services';
import type { AdminLabDto, CreateLabPayload, LabType } from '../types';

const LAB_TYPES: LabType[] = ['pro_lab', 'sherlock', 'vip_lab'];

/** LAB-16/17/18: admin lab management — create, edit, publish/unpublish. */
export function AdminLabsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAdminLabs();
  const [editing, setEditing] = useState<AdminLabDto | null>(null);
  const [draft, setDraft] = useState<CreateLabPayload | null>(null);
  const [saving, setSaving] = useState(false);

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.labs('all') });
  };

  const openCreate = (): void => {
    setEditing(null);
    setDraft({
      labName: '',
      slug: '',
      difficultyId: 1,
      labType: 'pro_lab',
      estimatedHours: 2,
    });
  };

  const openEdit = (lab: AdminLabDto): void => {
    setEditing(lab);
    setDraft({
      labName: lab.labName,
      slug: lab.slug,
      description: lab.description ?? undefined,
      difficultyId: lab.difficultyId,
      categoryId: lab.categoryId ?? undefined,
      labType: lab.labType,
      isPremium: lab.isPremium,
      estimatedHours: lab.estimatedHours,
    });
  };

  const save = (): void => {
    if (!draft) {
      return;
    }
    if (draft.labName.trim().length === 0 || draft.slug.trim().length === 0) {
      toast.error('Lab name and slug are required.');
      return;
    }
    setSaving(true);
    const payload: CreateLabPayload = { ...draft };
    if (draft.labType === 'pro_lab') {
      payload.proLabConfig = {
        networkIpRange: draft.proLabConfig?.networkIpRange,
        totalMachines: draft.proLabConfig?.totalMachines ?? 1,
        requiredRootCount: draft.proLabConfig?.requiredRootCount ?? 1,
        ...(draft.proLabConfig?.flagValues ? { flagValues: draft.proLabConfig.flagValues } : {}),
      };
    }
    if (draft.labType === 'sherlock') {
      payload.sherlockConfig = {
        evidenceFileUrl: draft.sherlockConfig?.evidenceFileUrl,
        questions: draft.sherlockConfig?.questions ?? [],
        answers: draft.sherlockConfig?.answers ?? [],
        requiredCorrectAnswers: draft.sherlockConfig?.requiredCorrectAnswers ?? 1,
      };
    }
    const request = editing
      ? labsService.adminUpdateLab(editing.labId, payload)
      : labsService.adminCreateLab(payload);
    request
      .then(() => {
        toast.success(editing ? 'Lab updated.' : 'Lab created.');
        setDraft(null);
        setEditing(null);
        invalidate();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not save lab.');
      })
      .finally(() => setSaving(false));
  };

  const togglePublish = (lab: AdminLabDto): void => {
    labsService
      .adminPublishLab(lab.labId, !lab.isActive)
      .then(() => {
        toast.success(lab.isActive ? 'Lab unpublished.' : 'Lab published.');
        invalidate();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not update publication.');
      });
  };

  return (
    <div>
      <PageHeader title="Labs" description="Create, edit and publish hands-on lab environments." />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>New lab</Button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          title="Could not load labs"
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Lab</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Premium</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((lab) => (
                <tr key={lab.labId}>
                  <td>
                    <strong>{lab.labName}</strong>
                    <span className="admin-table__muted">/{lab.slug}</span>
                  </td>
                  <td>{lab.labType.replace('_', ' ')}</td>
                  <td>{lab.difficultyName ?? 'Unknown'}</td>
                  <td>{lab.isPremium ? 'Yes' : 'No'}</td>
                  <td>{lab.isActive ? 'Published' : 'Draft'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(lab)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => togglePublish(lab)}>
                        {lab.isActive ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
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
            <h2>{editing ? 'Edit lab' : 'New lab'}</h2>
            <label className="input-label">
              Lab name
              <input
                className="input-field"
                value={draft.labName}
                onChange={(e) => setDraft({ ...draft, labName: e.target.value })}
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
                Type
                <select
                  className="input-field"
                  value={draft.labType}
                  onChange={(e) => setDraft({ ...draft, labType: e.target.value as LabType })}
                >
                  {LAB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-label">
                Difficulty ID
                <input
                  className="input-field"
                  type="number"
                  value={draft.difficultyId}
                  onChange={(e) => setDraft({ ...draft, difficultyId: Number(e.target.value) })}
                />
              </label>
              <label className="input-label">
                Estimated hours
                <input
                  className="input-field"
                  type="number"
                  value={draft.estimatedHours ?? 2}
                  onChange={(e) => setDraft({ ...draft, estimatedHours: Number(e.target.value) })}
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

            {draft.labType === 'pro_lab' && (
              <fieldset className="lab-admin-form__section">
                <legend>Pro lab configuration</legend>
                <div className="lab-admin-form__grid">
                  <label className="input-label">
                    Network IP range
                    <input
                      className="input-field"
                      placeholder="10.0.0.0/24"
                      value={draft.proLabConfig?.networkIpRange ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          proLabConfig: {
                            ...draft.proLabConfig,
                            networkIpRange: e.target.value,
                            totalMachines: draft.proLabConfig?.totalMachines ?? 1,
                            requiredRootCount: draft.proLabConfig?.requiredRootCount ?? 1,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="input-label">
                    Total machines
                    <input
                      className="input-field"
                      type="number"
                      min={1}
                      value={draft.proLabConfig?.totalMachines ?? 1}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          proLabConfig: {
                            ...draft.proLabConfig,
                            totalMachines: Number(e.target.value),
                            requiredRootCount: draft.proLabConfig?.requiredRootCount ?? 1,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="input-label">
                    Required assertion count
                    <input
                      className="input-field"
                      type="number"
                      min={1}
                      value={draft.proLabConfig?.requiredRootCount ?? 1}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          proLabConfig: {
                            ...draft.proLabConfig,
                            requiredRootCount: Number(e.target.value),
                            totalMachines: draft.proLabConfig?.totalMachines ?? 1,
                          },
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            )}

            {draft.labType === 'sherlock' && (
              <fieldset className="lab-admin-form__section">
                <legend>Sherlock configuration</legend>
                <label className="input-label">
                  Evidence file URL
                  <input
                    className="input-field"
                    placeholder="https://…"
                    value={draft.sherlockConfig?.evidenceFileUrl ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sherlockConfig: {
                          ...draft.sherlockConfig,
                          evidenceFileUrl: e.target.value,
                          questions: draft.sherlockConfig?.questions ?? [],
                          answers: draft.sherlockConfig?.answers ?? [],
                          requiredCorrectAnswers: draft.sherlockConfig?.requiredCorrectAnswers ?? 1,
                        },
                      })
                    }
                  />
                </label>
                <label className="input-label">
                  Questions (JSON array: id, text, optional hint)
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder='[{"id":"q1","text":"What port does nginx listen on?","hint":"Check the config"}]'
                    value={JSON.stringify(draft.sherlockConfig?.questions ?? [], null, 0)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value) as Array<{
                          id: string;
                          text: string;
                          hint?: string;
                        }>;
                        setDraft({
                          ...draft,
                          sherlockConfig: {
                            ...draft.sherlockConfig,
                            questions: parsed,
                            answers: draft.sherlockConfig?.answers ?? [],
                            requiredCorrectAnswers:
                              draft.sherlockConfig?.requiredCorrectAnswers ?? 1,
                          },
                        });
                      } catch {
                        // keep previous questions until valid JSON
                      }
                    }}
                  />
                </label>
                <label className="input-label">
                  Answers (JSON array: id, answer — server-side only, never returned)
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder='[{"id":"q1","answer":"80"}]'
                    value={JSON.stringify(draft.sherlockConfig?.answers ?? [], null, 0)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value) as Array<{
                          id: string;
                          answer: string;
                        }>;
                        setDraft({
                          ...draft,
                          sherlockConfig: {
                            ...draft.sherlockConfig,
                            answers: parsed,
                            questions: draft.sherlockConfig?.questions ?? [],
                            requiredCorrectAnswers:
                              draft.sherlockConfig?.requiredCorrectAnswers ?? 1,
                          },
                        });
                      } catch {
                        // keep previous answers until valid JSON
                      }
                    }}
                  />
                </label>
                <label className="input-label">
                  Required correct answers
                  <input
                    className="input-field"
                    type="number"
                    min={1}
                    value={draft.sherlockConfig?.requiredCorrectAnswers ?? 1}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sherlockConfig: {
                          ...draft.sherlockConfig,
                          requiredCorrectAnswers: Number(e.target.value),
                          questions: draft.sherlockConfig?.questions ?? [],
                          answers: draft.sherlockConfig?.answers ?? [],
                        },
                      })
                    }
                  />
                </label>
              </fieldset>
            )}
            <div className="lab-admin-form__actions">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={save} isLoading={saving}>
                {editing ? 'Save changes' : 'Create lab'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminLabsPage;
