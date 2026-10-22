import { useState } from 'react';
import { Button, Input } from '@/shared/components';

export interface ModuleFormValues {
  title: string;
  description: string;
  estimatedMinutes: string;
  moduleOrder: string;
}

interface ModuleFormProps {
  initial: ModuleFormValues;
  submitLabel: string;
  saving: boolean;
  onSubmit: (values: ModuleFormValues) => void;
  onCancel?: () => void;
}

/** F4 SCR-F4-02: module create/edit form (F4-API-10/11). */
export function ModuleForm({ initial, submitLabel, saving, onSubmit, onCancel }: ModuleFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial.estimatedMinutes);
  const [moduleOrder, setModuleOrder] = useState(initial.moduleOrder);

  // Field validation errors
  const [titleError, setTitleError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Module title must be at least 3 characters.');
      isValid = false;
    }
    const orderNum = Number(moduleOrder);
    if (!moduleOrder || isNaN(orderNum) || orderNum < 1) {
      setOrderError('Sequence order must be 1 or greater.');
      isValid = false;
    }
    if (!isValid) return;

    onSubmit({
      title: title.trim(),
      description,
      estimatedMinutes,
      moduleOrder,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <Input
        label="Module Title"
        value={title}
        error={titleError ?? undefined}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError) setTitleError(null);
        }}
        placeholder="e.g. Containerization Fundamentals & Linux Namespaces"
        required
      />

      <div>
        <label htmlFor="module-description" className="input-label block mb-1">
          Description & Summary
        </label>
        <textarea
          id="module-description"
          rows={3}
          className="input-field w-full text-xs font-mono leading-relaxed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Summary of architectural concepts and hands-on skills covered in this module."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Estimated Duration (Minutes)"
          type="number"
          min={1}
          max={600}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(e.target.value)}
          placeholder="120"
        />

        <Input
          label="Sequence Order"
          type="number"
          min={1}
          value={moduleOrder}
          error={orderError ?? undefined}
          onChange={(e) => {
            setModuleOrder(e.target.value);
            if (orderError) setOrderError(null);
          }}
          placeholder="1"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        {onCancel ? (
          <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" size="sm" type="submit" isLoading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ModuleForm;
