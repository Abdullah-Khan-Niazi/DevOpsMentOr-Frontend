import { Icon, IconButton } from '@/shared/components';
import { cn } from '@/shared/utils';
import { ReorderList } from '../ReorderList';
import { MAX_STEPS, type StepDraft } from './labSpecSchema';

// Steps of the spec in order: select, reorder (drag or Alt+arrows), duplicate, delete.
// Purely presentational; the drawer owns the draft.

export interface StepListProps {
  steps: StepDraft[];
  selectedKey: string;
  /** Steps with validation issues (keys of `StepDraft`). */
  flaggedKeys: ReadonlySet<string>;
  disabled?: boolean;
  onSelect: (key: string) => void;
  onReorder: (keys: Array<number | string>) => void;
  onAdd: () => void;
  onDuplicate: (key: string) => void;
  onDelete: (key: string) => void;
}

export function StepList({
  steps,
  selectedKey,
  flaggedKeys,
  disabled = false,
  onSelect,
  onReorder,
  onAdd,
  onDuplicate,
  onDelete,
}: StepListProps) {
  const full = steps.length >= MAX_STEPS;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="input-label">Steps</span>
        <IconButton
          icon="plus"
          label="Add step"
          size="sm"
          disabled={disabled || full}
          onClick={onAdd}
        />
      </div>

      <ReorderList
        ariaLabel="Steps"
        items={steps}
        getId={(draft) => draft.key}
        disabled={disabled}
        onReorder={onReorder}
        renderItem={(draft) => {
          const selected = draft.key === selectedKey;
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-current={selected ? 'step' : undefined}
                onClick={() => onSelect(draft.key)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hover',
                  selected && 'bg-surface-hover text-card-foreground',
                )}
              >
                <Icon
                  name={draft.step.kind === 'task' ? 'task' : 'quiz'}
                  size={18}
                  selected={selected}
                  className={selected ? undefined : 'text-muted'}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-card-foreground">
                    {draft.step.title || 'Untitled step'}
                  </span>
                  <span className="block truncate font-mono text-micro text-muted">
                    {draft.step.id}
                  </span>
                </span>
                {flaggedKeys.has(draft.key) ? (
                  <Icon name="warning" size={16} title="Has issues" className="text-signal" />
                ) : null}
              </button>
              <IconButton
                icon="copy"
                label="Duplicate step"
                size="sm"
                disabled={disabled || full}
                onClick={() => onDuplicate(draft.key)}
              />
              <IconButton
                icon="delete"
                label="Delete step"
                size="sm"
                tone="danger"
                disabled={disabled || steps.length <= 1}
                onClick={() => onDelete(draft.key)}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
