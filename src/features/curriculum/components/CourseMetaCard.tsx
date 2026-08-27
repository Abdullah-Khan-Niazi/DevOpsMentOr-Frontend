import { useState } from 'react';
import { Button, Card, Input, toast } from '@/shared/components';
import type { CourseDto } from '../types';

// Mirrors the F4 seed data (scripts/seed.ts): the difficulty_levels and
// categories catalogs are closed sets seeded for the canonical course.
const DIFFICULTIES = [
  { value: 1, label: 'Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Insane' },
] as const;

const CATEGORIES = [
  { value: 'web', label: 'Web' },
  { value: 'reverse-engineering', label: 'Reverse Engineering' },
  { value: 'forensics', label: 'Forensics' },
  { value: 'cryptography', label: 'Cryptography' },
  { value: 'network', label: 'Network' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'ai-ml', label: 'AI/ML' },
] as const;

export interface CourseMetaSavePayload {
  title: string;
  description: string | null;
  estimatedHours: number;
  difficultyId?: number;
  categoryId: number | null;
}

interface CourseMetaCardProps {
  course: CourseDto;
  moduleCount: number;
  canManage: boolean;
  saving: boolean;
  onSave: (payload: CourseMetaSavePayload) => void;
}

/** F4 SCR-F4-01: course-level stats card with inline metadata editing. */
export function CourseMetaCard({
  course,
  moduleCount,
  canManage,
  saving,
  onSave,
}: CourseMetaCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? '');
  const [estimatedHours, setEstimatedHours] = useState(String(course.estimatedHours));
  const [difficultyId, setDifficultyId] = useState(String(course.difficultyId));
  const [categoryId, setCategoryId] = useState(course.categoryId ? String(course.categoryId) : '');

  const startEditing = () => {
    setTitle(course.title);
    setDescription(course.description ?? '');
    setEstimatedHours(String(course.estimatedHours));
    setDifficultyId(String(course.difficultyId));
    setCategoryId(course.categoryId ? String(course.categoryId) : '');
    setEditing(true);
  };

  const save = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Course title must be at least 3 characters.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
      difficultyId: difficultyId ? Number(difficultyId) : undefined,
      categoryId: categoryId ? Number(categoryId) : null,
    });
    setEditing(false);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-card-foreground">{course.title}</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {course.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{course.description || 'No description.'}</p>
          <p className="mt-1 text-xs text-muted">
            {course.difficultyName ?? 'No difficulty'} · {course.categoryName ?? 'No category'}
          </p>
        </div>
        {canManage && (
          <Button variant="secondary" size="sm" onClick={startEditing}>
            Edit course
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course title"
          />
          <div>
            <label htmlFor="course-description" className="input-label">
              Description
            </label>
            <textarea
              id="course-description"
              rows={3}
              className="input-field w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short course description."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Estimated hours"
              type="number"
              min={0}
              max={10000}
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
            <div>
              <label htmlFor="course-difficulty" className="input-label">
                Difficulty
              </label>
              <select
                id="course-difficulty"
                className="input-field w-full"
                value={difficultyId}
                onChange={(e) => setDifficultyId(e.target.value)}
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
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
                className="input-field w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">None</option>
                {CATEGORIES.map((category, index) => (
                  <option key={category.value} value={index + 1}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save} isLoading={saving}>
              Save course
            </Button>
          </div>
        </div>
      ) : (
        <dl className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <dt className="text-sm text-muted">Modules</dt>
            <dd className="mt-1 text-2xl font-semibold text-card-foreground">{moduleCount}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <dt className="text-sm text-muted">Lessons</dt>
            <dd className="mt-1 text-2xl font-semibold text-card-foreground">
              {course.totalLessons}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <dt className="text-sm text-muted">Quizzes</dt>
            <dd className="mt-1 text-2xl font-semibold text-card-foreground">
              {course.totalQuizzes}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
