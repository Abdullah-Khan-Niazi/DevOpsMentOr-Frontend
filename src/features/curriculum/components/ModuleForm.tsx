import { useState } from 'react';
import { Button, Input, toast } from '@/shared/components';

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

  const submit = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Module title must be at least 3 characters.');
      return;
    }
    onSubmit({
      title: title.trim(),
      description,
      estimatedMinutes,
      moduleOrder,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Module title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Containerization Fundamentals"
        minLength={3}
        required
      />
      <div>
        <label htmlFor="module-description" className="input-label">
          Description
        </label>
        <textarea
          id="module-description"
          rows={3}
          className="input-field w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional module description."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Estimated minutes"
          type="number"
          min={1}
          max={600}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(e.target.value)}
          placeholder="120"
        />
        <Input
          label="Order"
          type="number"
          min={1}
          value={moduleOrder}
          onChange={(e) => setModuleOrder(e.target.value)}
          placeholder="1"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={submit} isLoading={saving}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
