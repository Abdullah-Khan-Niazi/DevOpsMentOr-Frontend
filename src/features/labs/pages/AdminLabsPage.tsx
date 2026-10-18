import { useState, useMemo } from 'react';
import { Button, Card, ErrorState, PageHeader, TablePageSkeleton, toast } from '@/shared/components';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useAdminLabs } from '../hooks';
import { labsService } from '../services';
import type { AdminLabDto, CreateLabPayload, LabType } from '../types';

const LAB_TYPES: LabType[] = ['pro_lab', 'sherlock', 'vip_lab'];

type SortColumn = 'labName' | 'labType' | 'difficultyName' | 'isPremium' | 'isActive';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

/** LAB-16/17/18: admin lab management — create, edit, publish/unpublish. */
export function AdminLabsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAdminLabs();
  const [editing, setEditing] = useState<AdminLabDto | null>(null);
  const [draft, setDraft] = useState<CreateLabPayload | null>(null);
  const [saving, setSaving] = useState(false);

  const [sortCol, setSortCol] = useState<SortColumn>('labName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

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

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filteredLabs = useMemo(() => {
    if (!data) return [];
    return data.filter((lab) => {
      if (typeFilter !== 'all' && lab.labType !== typeFilter) return false;
      if (statusFilter === 'published' && !lab.isActive) return false;
      if (statusFilter === 'draft' && lab.isActive) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!lab.labName.toLowerCase().includes(q) && !lab.slug.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, search, typeFilter, statusFilter]);

  const sortedLabs = useMemo(() => {
    const list = [...filteredLabs];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'labName':
          valA = a.labName.toLowerCase();
          valB = b.labName.toLowerCase();
          break;
        case 'labType':
          valA = a.labType;
          valB = b.labType;
          break;
        case 'difficultyName':
          valA = (a.difficultyName ?? '').toLowerCase();
          valB = (b.difficultyName ?? '').toLowerCase();
          break;
        case 'isPremium':
          valA = a.isPremium ? 1 : 0;
          valB = b.isPremium ? 1 : 0;
          break;
        case 'isActive':
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredLabs, sortCol, sortDir]);

  if (isLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Labs"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Lab
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Could not load labs"
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card>
          {/* Single-line filter toolbar */}
          <div className="mb-4 flex items-center gap-1.5 w-full">
            <input
              id="labs-search"
              className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
              placeholder="Search lab name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              id="labs-type-filter"
              className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Lab Types</option>
              <option value="pro_lab">Pro Lab</option>
              <option value="vip_lab">VIP Lab</option>
              <option value="sherlock">Diagnostic Assessment</option>
            </select>

            <select
              id="labs-status-filter"
              className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
               
              >
                Reset
              </Button>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('labName')}
                  >
                    Lab <SortIcon active={sortCol === 'labName'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('labType')}
                  >
                    Type <SortIcon active={sortCol === 'labType'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('difficultyName')}
                  >
                    Difficulty <SortIcon active={sortCol === 'difficultyName'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('isPremium')}
                  >
                    Premium <SortIcon active={sortCol === 'isPremium'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('isActive')}
                  >
                    Status <SortIcon active={sortCol === 'isActive'} direction={sortDir} />
                  </th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedLabs.map((lab) => (
                  <tr key={lab.labId} className="border-b border-border/60 last:border-0 hover:bg-surface/50 active:bg-surface-hover/60 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-card-foreground">{lab.labName}</div>
                      <div className="text-[11px] text-muted font-mono">/{lab.slug}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground uppercase text-[11px]">
                      {lab.labType === 'sherlock' ? 'Diagnostic' : lab.labType.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {lab.difficultyName ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {lab.isPremium ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs">
                      <span className={lab.isActive ? 'font-semibold text-card-foreground' : 'text-muted'}>
                        {lab.isActive ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
          </div>
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
                <legend>Diagnostic assessment configuration</legend>
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
