import type { LessonDto } from '../types';
import { ContentTypeIcon, CONTENT_TYPE_LABELS } from './ContentTypeIcon';

interface LessonListItemProps {
  lesson: LessonDto;
  isActive?: boolean;
  onOpen: (lessonId: number) => void;
}

/** F4 SCR-F4-05/06: learner-facing lesson row (title, type, duration). */
export function LessonListItem({ lesson, isActive = false, onOpen }: LessonListItemProps) {
  const minutes = lesson.videoDurationSeconds
    ? Math.max(1, Math.round(lesson.videoDurationSeconds / 60))
    : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(lesson.lessonId)}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-card-foreground hover:bg-surface'
        }`}
      >
        <ContentTypeIcon type={lesson.contentType} />
        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
        <span className="shrink-0 text-xs text-muted">
          {CONTENT_TYPE_LABELS[lesson.contentType]}
          {minutes ? ` · ${minutes} min` : ''}
        </span>
      </button>
    </li>
  );
}
