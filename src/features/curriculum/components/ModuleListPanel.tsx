import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Input } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { ModuleDto } from '../types';
import { PublishToggle } from './PublishToggle';

interface ModuleListPanelProps {
  modules: ModuleDto[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  busyModuleIds: Set<number>;
  onPublish: (moduleId: number) => void;
  onUnpublish: (moduleId: number) => void;
  onReorder: (moduleId: number, direction: -1 | 1) => void;
  canManage: boolean;
  onCreateModule: () => void;
}

/** F4 SCR-F4-01: drag-sortable module list with publish state (F4-API-09..14). */
export function ModuleListPanel({
  modules,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  busyModuleIds,
  onPublish,
  onUnpublish,
  onReorder,
  canManage,
  onCreateModule,
}: ModuleListPanelProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [draggedId, setDraggedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="space-y-3 p-4">
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <div className="h-4 w-4 rounded bg-border" />
            <div className="h-4 flex-1 rounded bg-border" />
            <div className="h-4 w-16 rounded bg-border" />
          </div>
        ))}
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">{errorMessage ?? 'Unable to load modules.'}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </Card>
    );
  }

  const visible = search.trim()
    ? modules.filter((module) => module.title.toLowerCase().includes(search.trim().toLowerCase()))
    : modules;

  const openEditor = (moduleId: number) => {
    navigate(ROUTES.ADMIN_CURRICULUM_MODULE.replace(':moduleId', String(moduleId)));
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Modules</h3>
          <p className="text-sm text-muted">Drag rows to reorder, or use the arrow keys.</p>
        </div>
        <Input
          type="search"
          placeholder="Search modules…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
          aria-label="Search modules"
        />
      </div>

      <div className="mt-4 space-y-2">
        {visible.length === 0 ? (
          <EmptyState
            title={
              search.trim()
                ? 'No modules match your search.'
                : 'No modules yet. Create the first module.'
            }
            description={
              search.trim()
                ? 'Try a different search term.'
                : 'Modules are the top-level sections of the canonical course.'
            }
          />
        ) : (
          visible.map((module) => {
            const busy = busyModuleIds.has(module.moduleId);
            const move = (direction: -1 | 1) => onReorder(module.moduleId, direction);
            const canMoveUp = module.moduleOrder > 1;
            const canMoveDown = module.moduleOrder < visible.length;
            return (
              <div
                key={module.moduleId}
                draggable
                onDragStart={() => setDraggedId(module.moduleId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={`flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3 ${
                  draggedId === module.moduleId ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  aria-label={`Drag module ${module.title} to reorder`}
                  className="cursor-grab text-muted hover:text-card-foreground"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="6" r="1" />
                    <circle cx="15" cy="6" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="18" r="1" />
                  </svg>
                </button>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(module.moduleId)}
                      className="text-left font-medium text-card-foreground hover:underline"
                    >
                      {module.title}
                    </button>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {module.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Order {module.moduleOrder} · {module.lessonCount}{' '}
                    {module.lessonCount === 1 ? 'lesson' : 'lessons'} · {module.estimatedMinutes}{' '}
                    min
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={!canMoveUp || busy}
                      aria-label={`Move module ${module.title} up`}
                      onClick={() => move(-1)}
                      className="text-muted hover:text-card-foreground disabled:opacity-40"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={!canMoveDown || busy}
                      aria-label={`Move module ${module.title} down`}
                      onClick={() => move(1)}
                      className="text-muted hover:text-card-foreground disabled:opacity-40"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  {canManage ? (
                    <PublishToggle
                      isPublished={module.isPublished}
                      label={module.title}
                      busy={busy}
                      onPublish={() => onPublish(module.moduleId)}
                      onUnpublish={() => onUnpublish(module.moduleId)}
                    />
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEditor(module.moduleId)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canManage ? (
        <div className="mt-4 flex justify-end">
          <Button onClick={onCreateModule}>+ New Module</Button>
        </div>
      ) : null}
    </Card>
  );
}
