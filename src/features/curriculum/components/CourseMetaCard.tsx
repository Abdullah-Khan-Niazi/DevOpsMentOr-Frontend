import { useState } from 'react';
import { Button, Input } from '@/shared/components';
import type { CourseDto } from '../types';

const DIFFICULTIES = [
  { value: 1, label: 'Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Insane' },
] as const;

const CATEGORIES = [
  { value: 'web', label: 'Web Architecture' },
  { value: 'reverse-engineering', label: 'Reverse Engineering' },
  { value: 'forensics', label: 'Forensics & Incident Response' },
  { value: 'cryptography', label: 'Cryptography' },
  { value: 'network', label: 'Networking & VPC' },
  { value: 'cloud', label: 'Cloud & Infrastructure' },
  { value: 'ai-ml', label: 'AI/ML Systems' },
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
  onCancel?: () => void;
}

/**
 * Course settings and architecture editor inside the slide-over drawer.
 * Clean, cardless presentation with field-specific validation.
 */
export function CourseMetaCard({
  course,
  saving,
  onSave,
  onCancel,
}: CourseMetaCardProps) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? '');
  const [estimatedHours, setEstimatedHours] = useState(String(course.estimatedHours));
  const [difficultyId, setDifficultyId] = useState(String(course.difficultyId));
  const [categoryId, setCategoryId] = useState(course.categoryId ? String(course.categoryId) : '');
  const [titleError, setTitleError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!val.trim()) {
      setTitleError('Course title is required');
    } else if (val.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
    } else {
      setTitleError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
      difficultyId: difficultyId ? Number(difficultyId) : undefined,
      categoryId: categoryId ? Number(categoryId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Overview Status Strip */}
      <div className="flex items-center justify-between p-3 rounded-xs bg-paper border border-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
            Scope
          </span>
          <span className="text-xs font-semibold text-card-foreground">
            Canonical Production Track
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
              course.isPublished
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {course.isPublished ? 'Live & Published' : 'Draft / Unpublished'}
          </span>
        </div>
      </div>

      {/* Title with field error */}
      <div>
        <Input
          label="Track / Course Title *"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., DevOps Engineer: Production Architecture & Labs"
          error={titleError ?? undefined}
        />
        {titleError && (
          <p className="mt-1 text-xs text-rose-500 font-mono">{titleError}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="course-description" className="input-label">
          Architecture Description
        </label>
        <textarea
          id="course-description"
          rows={3}
          className="input-field w-full text-xs"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="High-level syllabus overview, engineering stack, and target capabilities."
        />
      </div>

      {/* 3-column parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Input
            label="Estimated Hours"
            type="number"
            min={0}
            max={10000}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            className="text-xs"
          />
        </div>

        <div>
          <label htmlFor="course-difficulty" className="input-label text-xs">
            Target Difficulty
          </label>
          <select
            id="course-difficulty"
            className="input-field w-full text-xs font-mono h-9"
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
          <label htmlFor="course-category" className="input-label text-xs">
            Curriculum Domain
          </label>
          <select
            id="course-category"
            className="input-field w-full text-xs font-mono h-9"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">General DevOps</option>
            {CATEGORIES.map((category, index) => (
              <option key={category.value} value={index + 1}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" isLoading={saving}>
          Save Course Settings
        </Button>
      </div>
    </form>
  );
}
