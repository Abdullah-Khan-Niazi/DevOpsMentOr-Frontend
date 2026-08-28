import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, PageHeader, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useCreateClass } from '../hooks';

/** F3 contract §09 SCR-F3-05: new class form (CLS-01). */
export function OrgClassCreatePage() {
  const navigate = useNavigate();
  const create = useCreateClass();
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('');

  const handleSubmit = () => {
    if (!className.trim()) {
      toast.error('Class name is required.');
      return;
    }
    create.mutate(
      {
        className: className.trim(),
        description: description.trim() || null,
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
      },
      {
        onSuccess: (klass) => {
          toast.success('Class created.');
          navigate(ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(klass.classId)));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New class"
        description="Create a class within your organization."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(ROUTES.ORG_CLASSES)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={create.isPending}>
              Create class
            </Button>
          </div>
        }
      />

      <Card className="space-y-4 p-6">
        <Input
          label="Class name"
          placeholder="e.g. CS 101 — Intro to Programming"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />
        <div>
          <label htmlFor="class-description" className="input-label">
            Description
          </label>
          <textarea
            id="class-description"
            rows={4}
            className="input-field w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description shown to students."
          />
        </div>
        <Input
          label="Max students"
          type="number"
          min={1}
          placeholder="50"
          value={maxStudents}
          onChange={(e) => setMaxStudents(e.target.value)}
        />
        <p className="text-xs text-muted">
          Students join after accepting an email invitation sent from this class.
        </p>
      </Card>
    </div>
  );
}

export default OrgClassCreatePage;
