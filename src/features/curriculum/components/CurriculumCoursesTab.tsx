import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from '@/shared/components';
import {
  CurriculumInlineTree,
  type CurriculumInlineTreeBaseProps,
  type InlineTreeRoot,
} from './CurriculumInlineTree';
import { CurriculumCourseCreateDrawer } from './CurriculumCourseCreateDrawer';

export interface CurriculumCoursesState {
  canonicalLoading: boolean;
  canonicalError: string | null;
  catalogLoading: boolean;
  catalogError: string | null;
  hasCanonical: boolean;
  onRetry: () => void;
}

interface CurriculumCoursesTabProps {
  tree: CurriculumInlineTreeBaseProps;
  coursesState: CurriculumCoursesState;
}

function CoursesTabSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading courses">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-16 rounded-sm" />
      ))}
    </div>
  );
}

/**
 * Courses tab: the full published catalog plus the canonical course. Opening a
 * course shows Course → Modules → Items as an inline indented tree. Only the
 * canonical course exposes write controls — the admin API enforces that
 * invariant, so every other course is an explicit read-only preview.
 */
export function CurriculumCoursesTab({ tree, coursesState }: CurriculumCoursesTabProps) {
  const [search, setSearch] = useState('');
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);

  const courses = tree.courses;

  const visibleCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...courses].sort((a, b) => a.courseId - b.courseId);
    if (!query) return sorted;
    return sorted.filter(
      (course) =>
        course.title.toLowerCase().includes(query) || course.slug.toLowerCase().includes(query),
    );
  }, [courses, search]);

  const roots: InlineTreeRoot[] = useMemo(
    () => visibleCourses.map((course) => ({ kind: 'course' as const, course })),
    [visibleCourses],
  );

  if (coursesState.canonicalLoading && !coursesState.hasCanonical) {
    return <CoursesTabSkeleton />;
  }

  if (coursesState.canonicalError && !coursesState.hasCanonical) {
    return (
      <ErrorState
        title="Could not load the canonical course"
        message={coursesState.canonicalError}
        onRetry={coursesState.onRetry}
      />
    );
  }

  return (
    <div className="space-y-4">
      {coursesState.catalogError ? (
        <div className="rounded-sm border border-error/30 bg-error/5 px-3 py-2.5">
          <p className="text-xs font-semibold text-error">
            Published course catalog unavailable: {coursesState.catalogError}
          </p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={coursesState.onRetry}>
            Retry catalog
          </Button>
        </div>
      ) : null}

      {!coursesState.catalogError && coursesState.catalogLoading ? (
        <p className="font-mono text-micro text-muted" role="status">
          Loading the published course catalog…
        </p>
      ) : null}

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">All courses</h2>
            <p className="text-xs text-muted">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} · the canonical course
              is fully editable here; other courses open as read-only previews.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search course title or slug…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="text-xs sm:max-w-xs"
            />
            <Button size="sm" onClick={() => setIsCreateCourseOpen(true)}>
              + New Course
            </Button>
          </div>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description="The canonical course and the published catalog both returned empty."
            action={
              <Button variant="secondary" size="sm" onClick={coursesState.onRetry}>
                Refresh courses
              </Button>
            }
          />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            title="No courses match the search"
            description="Clear the search to see the full catalog."
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <CurriculumInlineTree {...tree} roots={roots} />
        )}
      </Card>

      <CurriculumCourseCreateDrawer
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
      />
    </div>
  );
}

export default CurriculumCoursesTab;
