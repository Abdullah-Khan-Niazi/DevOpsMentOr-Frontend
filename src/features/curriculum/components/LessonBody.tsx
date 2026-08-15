import type { LessonDto } from '../types';

interface LessonBodyProps {
  lesson: LessonDto;
}

/** F4 SCR-F4-06: renders text, video, or the lab/interactive stub (F6 later). */
export function LessonBody({ lesson }: LessonBodyProps) {
  if (lesson.contentType === 'video') {
    return lesson.videoUrl ? (
      <video
        controls
        preload="metadata"
        className="w-full rounded-lg border border-border bg-black"
        aria-label={`Video: ${lesson.title}`}
      >
        <source src={lesson.videoUrl} />
        Your browser does not support the video tag.
      </video>
    ) : (
      <p className="text-sm text-muted">No video attached to this lesson yet.</p>
    );
  }

  if (lesson.contentType === 'lab' || lesson.contentType === 'interactive') {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="font-medium text-card-foreground">
          {lesson.contentType === 'lab' ? 'Lab experience' : 'Interactive experience'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {lesson.contentType === 'lab'
            ? 'Hands-on labs launch from the lab engine, arriving in a later release.'
            : 'Interactive content arrives with the learning experience release.'}
        </p>
      </div>
    );
  }

  return (
    <article className="space-y-4 text-card-foreground">
      {lesson.content
        ?.split('\n')
        .filter((line) => line.trim())
        .map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {paragraph}
          </p>
        )) ?? <p className="text-sm text-muted">This lesson has no content yet.</p>}
    </article>
  );
}
