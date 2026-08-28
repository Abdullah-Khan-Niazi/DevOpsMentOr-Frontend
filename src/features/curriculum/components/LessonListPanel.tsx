import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { LessonDto } from '../types';
import { PublishToggle } from './PublishToggle';

interface LessonListPanelProps {
  lessons: LessonDto[];
  busyLessonIds: Set<number>;
  onPublish: (lessonId: number) => void;
  onUnpublish: (lessonId: number) => void;
  onReorder: (lessonId: number, direction: -1 | 1) => void;
  canManage: boolean;
  onCreateLesson: () => void;
}

const CONTENT_TYPE_LABELS: Record<LessonDto['contentType'], string> = {
  text: 'Text',
  video: 'Video',
  interactive: 'Interactive',
  lab: 'Lab',
};

/** F4 SCR-F4-02: lesson list with order handles and publish state (F4-API-15..18). */
export function LessonListPanel({
  lessons,
  busyLessonIds,
  onPublish,
  onUnpublish,
  onReorder,
  canManage,
  onCreateLesson,
}: LessonListPanelProps) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const openEditor = (lessonId: number) => {
    navigate(ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(lessonId)));
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Lessons</h3>
          <p className="text-sm text-muted">Order controls apply on save.</p>
        </div>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={onCreateLesson}>
            + New Lesson
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {lessons.length === 0 ? (
          <EmptyState
            title="No lessons. Add the first lesson."
            description="Lessons carry the actual course content for this module."
          />
        ) : (
          lessons.map((lesson) => {
            const busy = busyLessonIds.has(lesson.lessonId);
            const index = lessons.findIndex((item) => item.lessonId === lesson.lessonId);
            return (
              <div
                key={lesson.lessonId}
                draggable
                onDragStart={() => setDraggedId(lesson.lessonId)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => event.preventDefault()}
                className={`flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3 ${
                  draggedId === lesson.lessonId ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  aria-label={`Drag lesson ${lesson.title} to reorder`}
                  className="cursor-grab text-muted hover:text-card-foreground"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="6" r="1" />
                    <circle cx="15" cy="6" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="18" r="1" />
                  </svg>
                </button>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(lesson.lessonId)}
                      className="text-left font-medium text-card-foreground hover:underline"
                    >
                      {lesson.title}
                    </button>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {CONTENT_TYPE_LABELS[lesson.contentType]}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {lesson.tags.length > 0 ? (
                    <p className="text-xs text-muted">
                      {lesson.tags.map((tag) => tag.tagName).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0 || busy}
                      aria-label={`Move lesson ${lesson.title} up`}
                      onClick={() => onReorder(lesson.lessonId, -1)}
                      className="text-muted hover:text-card-foreground disabled:opacity-40"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={index === lessons.length - 1 || busy}
                      aria-label={`Move lesson ${lesson.title} down`}
                      onClick={() => onReorder(lesson.lessonId, 1)}
                      className="text-muted hover:text-card-foreground disabled:opacity-40"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  {canManage ? (
                    <PublishToggle
                      isPublished={lesson.isPublished}
                      label={lesson.title}
                      busy={busy}
                      onPublish={() => onPublish(lesson.lessonId)}
                      onUnpublish={() => onUnpublish(lesson.lessonId)}
                    />
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEditor(lesson.lessonId)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
