import { useState, useEffect } from 'react';
import { Button, Input, toast } from '@/shared/components';
import { useCreateClass, useOrgProfessors } from '../hooks';
import { classService } from '../services';

interface NewCohortDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewCohortDrawer({ isOpen, onClose, onSuccess }: NewCohortDrawerProps) {
  const [className, setClassName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('50');
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClassMutation = useCreateClass();
  const professorsQuery = useOrgProfessors();
  const professors = professorsQuery.query.data ?? [];

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setClassName('');
      setSlug('');
      setDescription('');
      setMaxStudents('50');
      setSelectedProfessorId('');
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setClassName(name);
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug === '' || slug === autoSlug.slice(0, -1)) {
      setSlug(autoSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = className.trim();
    if (!trimmedName) {
      toast.error('Cohort name is required.');
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">New Class Cohort</h2>
                <p className="text-xs text-muted mt-0.5">
                  Provision an academic cohort workspace for students and faculty.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted hover:text-card-foreground transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form id="new-cohort-form" onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Cohort / Class Name"
                placeholder="e.g. CS 101 — Intro to Systems"
                value={className}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />

              <Input
                label="Identifier / Slug"
                placeholder="e.g. cs-101-systems"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                hint="Machine-friendly identifier for the cohort URL."
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
              </div>

              <div className="border border-border/80 bg-surface/50 p-3">
                <p className="text-xs text-muted leading-relaxed font-mono">
                  Enrolled students will have access to the curriculum modules, assigned labs, and
                  telemetry progress reports provisioned under this cohort.
                </p>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-cohort-form"
              isLoading={isSubmitting}
            >
              Provision Cohort
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
