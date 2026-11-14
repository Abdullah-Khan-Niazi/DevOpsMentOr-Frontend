import { useState } from 'react';
import { Button, EmptyState, ErrorState, LoadingState, toast } from '@/shared/components';
import { useTrackDetail } from '@/features/labs/hooks';
import { CurriculumDrawerShell } from './CurriculumDrawerShell';
import { useAdminTrackMutations } from '../hooks/useAdminTrackMutations';
import type { AdminTrackDto, TrackContentItemDto } from '@/features/labs/types';
import type { CourseDto } from '../types';

interface CurriculumAttachCourseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  track: AdminTrackDto | null;
  /** Merged course list (published catalog + canonical course). */
  courses: CourseDto[];
}

/**
 * One task: attach an existing course to a published track. The backend
 * replaces track content wholesale, so the submit merges the currently loaded
 * items with the new course instead of sending only the new entry.
 */
export function CurriculumAttachCourseDrawer({
  isOpen,
  onClose,
  track,
  courses,
}: CurriculumAttachCourseDrawerProps) {
  return (
    <CurriculumDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="TRACK CONTENT · COURSE"
      title={track ? `Attach a course to ${track.trackName}` : 'Attach a course'}
    >
      {track ? (
        <AttachCourseForm key={track.trackId} track={track} courses={courses} onClose={onClose} />
      ) : null}
    </CurriculumDrawerShell>
  );
}

function AttachCourseForm({
  track,
  courses,
  onClose,
}: {
  track: AdminTrackDto;
  courses: CourseDto[];
  onClose: () => void;
}) {
  const detail = useTrackDetail(String(track.trackId), track.isActive);
  const mutations = useAdminTrackMutations();

  const [courseId, setCourseId] = useState('');
  const [required, setRequired] = useState(true);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  if (!track.isActive) {
    return (
      <ErrorState
        title="Track is a draft"
        message="The tracks API only returns linked content for published tracks, so attaching a course would replace content this panel cannot read. Publish the track first."
        onRetry={onClose}
      />
    );
  }

  if (detail.isLoading) {
    return <LoadingState label="Loading current track content…" />;
  }

  if (detail.isError || !detail.data) {
    return (
      <ErrorState
        title="Could not load the track content"
        message={
          detail.error?.message ??
          'The current track items are unavailable, so attaching a course could overwrite them.'
        }
        onRetry={() => void detail.refetch()}
      />
    );
  }

  const existingItems = detail.data.items;
  const attachedCourseIds = new Set(
    existingItems.filter((item) => item.contentType === 'course').map((item) => item.contentId),
  );
  const availableCourses = courses.filter((course) => !attachedCourseIds.has(course.courseId));
  const selectedCourse = courses.find((course) => String(course.courseId) === courseId) ?? null;
  const saving = mutations.update.isPending;

  const handleAttach = () => {
    if (!selectedCourse) {
      setSelectionError('Select a course to attach to this track.');
      return;
    }

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.displayOrder), 0);
    const content = [
      ...existingItems.map((item: TrackContentItemDto) => ({
        contentType: item.contentType,
        contentId: item.contentId,
        displayOrder: item.displayOrder,
        required: item.required,
      })),
      {
        contentType: 'course' as const,
        contentId: selectedCourse.courseId,
        displayOrder: maxOrder + 1,
        required,
      },
    ];

    mutations.update.mutate(
      { trackId: track.trackId, payload: { content } },
      {
        onSuccess: () => {
          toast.success(`${selectedCourse.title} attached to ${track.trackName}.`);
          onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (availableCourses.length === 0) {
    return (
      <EmptyState
        title="Every course is already attached"
        description="All known courses are already part of this track. Detach one via the tracks API before attaching it again."
        action={
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-border/60 bg-surface/30 px-3 py-2">
        <p className="font-mono text-micro text-muted">
          Currently linked: {existingItems.length} {existingItems.length === 1 ? 'item' : 'items'} ·{' '}
          {attachedCourseIds.size} {attachedCourseIds.size === 1 ? 'course' : 'courses'}
        </p>
      </div>

      <div>
        <label htmlFor="attach-course" className="input-label mb-1 block">
          Course to attach
        </label>
        <select
          id="attach-course"
          className="filter-input h-9 w-full text-xs"
          value={courseId}
          disabled={saving}
          onChange={(event) => {
            setCourseId(event.target.value);
            if (selectionError) setSelectionError(null);
          }}
        >
          <option value="">Select a course…</option>
          {availableCourses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
              {course.title} · /{course.slug}
              {course.isPublished ? '' : ' (draft)'}
            </option>
          ))}
        </select>
        {selectionError ? (
          <p className="mt-1 text-xs text-error" role="alert">
            {selectionError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="attach-course-required"
          type="checkbox"
          checked={required}
          disabled={saving}
          onChange={(event) => setRequired(event.target.checked)}
          className="h-4 w-4 rounded-xs accent-brand-600"
        />
        <label htmlFor="attach-course-required" className="text-xs text-card-foreground">
          Mark this course as required for track completion
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={handleAttach} isLoading={saving}>
          Attach Course
        </Button>
      </div>
    </div>
  );
}

export default CurriculumAttachCourseDrawer;
