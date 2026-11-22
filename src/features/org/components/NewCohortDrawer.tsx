import { useState } from 'react';
import { Button, Drawer, Input, toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCreateClass, useOrgProfessors } from '../hooks';
import { classService } from '../services';

interface NewCohortDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Drawer wrapper: the form is mounted only while the drawer is open, so every
 * opening starts from a clean draft without a state-resetting effect.
 */
export function NewCohortDrawer({ isOpen, onClose, onSuccess }: NewCohortDrawerProps) {
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setSession((n) => n + 1);
  }
  return (
    <NewCohortDrawerForm key={session} open={isOpen} onClose={onClose} onSuccess={onSuccess} />
  );
}

function NewCohortDrawerForm({
  open,
  onClose,
  onSuccess,
}: Omit<NewCohortDrawerProps, 'isOpen'> & { open: boolean }) {
  const [className, setClassName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('50');
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClassMutation = useCreateClass();
  const canAssignProfessor = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:manage'),
  );
  const professorsQuery = useOrgProfessors(canAssignProfessor);
  const professors = professorsQuery.query.data ?? [];

  const dirty =
    className !== '' ||
    slug !== '' ||
    description !== '' ||
    maxStudents !== '50' ||
    selectedProfessorId !== '';

  const handleNameChange = (name: string) => {
    setClassName(name);
    if (nameError) setNameError(null);
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug === '' || slug === autoSlug.slice(0, -1)) {
      setSlug(autoSlug);
      if (slugError) setSlugError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setSlugError(null);

    const trimmedName = className.trim();
    let hasError = false;
    if (!trimmedName) {
      setNameError('Cohort name is required.');
      hasError = true;
    }
    if (!slug.trim()) {
      setSlugError('Identifier / slug is required.');
      hasError = true;
    }
    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createdClass = await createClassMutation.mutateAsync({
        className: trimmedName,
        description: description.trim() || undefined,
        maxStudents: maxStudents ? Math.max(1, Number(maxStudents)) : 50,
      });

      // If a lead professor was selected, assign them
      if (selectedProfessorId) {
        try {
          await classService.assignProfessor(createdClass.classId, Number(selectedProfessorId));
        } catch {
          toast.info('Cohort created, but professor assignment encountered an error.');
        }
      }

      toast.success(`Cohort "${createdClass.className}" created successfully.`);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create cohort.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Class Cohort"
      dirty={dirty}
      busy={isSubmitting}
      footer={(requestClose) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-cohort-form" isLoading={isSubmitting}>
            Provision Cohort
          </Button>
        </>
      )}
    >
      <form id="new-cohort-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Cohort / Class Name"
          placeholder="e.g. CS 101: Intro to Systems"
          value={className}
          error={nameError ?? undefined}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />

        <Input
          label="Identifier / Slug"
          placeholder="e.g. cs-101-systems"
          value={slug}
          error={slugError ?? undefined}
          onChange={(e) => {
            setSlug(e.target.value);
            if (slugError) setSlugError(null);
          }}
          required
        />

        <div>
          <label htmlFor="cohort-desc" className="input-label">
            Description
          </label>
          <textarea
            id="cohort-desc"
            rows={3}
            className="input-field w-full"
            placeholder="Syllabus outline, expectations, or cohort objectives…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Student Capacity Ceiling"
            type="number"
            min={1}
            placeholder="50"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
            required
          />

          {canAssignProfessor ? (
            <div>
              <label htmlFor="cohort-professor" className="input-label">
                Lead Faculty / Professor
              </label>
              <select
                id="cohort-professor"
                className="input-field w-full"
                value={selectedProfessorId}
                onChange={(e) => setSelectedProfessorId(e.target.value)}
              >
                <option value="">Unassigned (assign later)</option>
                {professors.map((p) => (
                  <option key={p.userId} value={String(p.userId)}>
                    {p.fullName ? `${p.fullName} (${p.email})` : p.email}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </form>
    </Drawer>
  );
}
