import { useState } from 'react';
import { Button, Input, toast } from '@/shared/components';
import { CurriculumDrawerShell } from './CurriculumDrawerShell';
import { useCreateCourse, useCurriculumTaxonomies } from '../hooks/useCourseAdmin';

interface CurriculumCourseCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * One-task drawer: creates a DRAFT course. Publishing is a separate explicit
 * action from the course editor, so a half-built course never reaches learners.
 */
export function CurriculumCourseCreateDrawer({
  isOpen,
  onClose,
}: CurriculumCourseCreateDrawerProps) {
  const createCourse = useCreateCourse();
  const { difficulties, categories } = useCurriculumTaxonomies(isOpen);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [difficultyId, setDifficultyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('12');
  const [isPremium, setIsPremium] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setDifficultyId('');
    setCategoryId('');
    setEstimatedHours('12');
    setIsPremium(false);
    setTitleError(null);
  };

  const handleClose = () => {
    if (createCourse.isPending) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setTitleError('Course title must be at least 3 characters.');
      return;
    }
    setTitleError(null);

    const resolvedDifficulty = difficultyId || String(difficulties.data?.[0]?.difficultyId ?? '');
    if (!resolvedDifficulty) {
      toast.error('Pick a difficulty. Load the options first if the list is empty.');
      return;
    }

    createCourse.mutate(
      {
        title: trimmedTitle,
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        difficultyId: Number(resolvedDifficulty),
        categoryId: categoryId ? Number(categoryId) : null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
        isPremium,
      },
      {
        onSuccess: (course) => {
          toast.success(
            `Course "${course.title}" created as a draft. Publish it when it is ready.`,
          );
          reset();
          onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <CurriculumDrawerShell
      isOpen={isOpen}
      onClose={handleClose}
      eyebrow="CREATE · COURSE"
      title="New course"
    >
      <div className="space-y-4">
        <Input
          label="Course title"
          placeholder="e.g. Advanced Kubernetes Operations"
          value={title}
          error={titleError ?? undefined}
          onChange={(event) => {
            const next = event.target.value;
            setTitle(next);
            if (!slugTouched) {
              setSlug(slugify(next));
            }
            if (titleError) setTitleError(null);
          }}
          required
        />

        <Input
          label="Slug"
          placeholder="advanced-kubernetes-operations"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />

        <div>
          <label htmlFor="course-description" className="input-label">
            Description
          </label>
          <textarea
            id="course-description"
            rows={3}
            className="input-field w-full"
            placeholder="What this course covers and who it is for…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="course-difficulty" className="input-label">
              Difficulty <span className="text-signal">*</span>
            </label>
            <select
              id="course-difficulty"
              className="input-field mt-1 w-full"
              value={difficultyId}
              onChange={(event) => setDifficultyId(event.target.value)}
              disabled={difficulties.isLoading}
            >
              <option value="">
                {difficulties.isLoading
                  ? 'Loading difficulties…'
                  : difficulties.isError
                    ? 'Could not load difficulties'
                    : 'Select difficulty…'}
              </option>
              {(difficulties.data ?? []).map((option) => (
                <option key={option.difficultyId} value={String(option.difficultyId)}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-category" className="input-label">
              Category
            </label>
            <select
              id="course-category"
              className="input-field mt-1 w-full"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={categories.isLoading}
            >
              <option value="">No category</option>
              {(categories.data ?? []).map((option) => (
                <option key={option.categoryId} value={String(option.categoryId)}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Estimated hours"
            type="number"
            min={0}
            value={estimatedHours}
            onChange={(event) => setEstimatedHours(event.target.value)}
          />
          <label className="flex items-end gap-2 pb-2 text-xs text-card-foreground">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(event) => setIsPremium(event.target.checked)}
            />
            Premium course (requires assignment or org entitlement)
          </label>
        </div>

        {difficulties.isError ? (
          <div className="rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
            Difficulty options could not be loaded. Close and reopen the drawer to retry.
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={createCourse.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={createCourse.isPending}>
            Create draft course
          </Button>
        </div>
      </div>
    </CurriculumDrawerShell>
  );
}

export default CurriculumCourseCreateDrawer;
