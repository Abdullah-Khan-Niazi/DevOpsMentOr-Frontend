import { Link } from 'react-router-dom';
import type { LessonDto } from '../types';

interface LessonBodyProps {
  lesson: LessonDto;
}

const MODULE_1_LAB_SLUGS: Record<number, string> = {
  1: '01-os-linux-basics',
  2: '02-linux-filesystem-hierarchy',
  3: '03-cli-fundamentals',
  4: '04-package-management-vim',
  5: '05-users-groups-permissions',
  6: '06-pipes-redirection-shell-scripting',
  7: '07-networking-ssh-security',
};

function resolveLabSlugForLesson(lesson: LessonDto): string {
  const text = `${lesson.title} ${lesson.content ?? ''}`.toLowerCase();
  for (const slug of Object.values(MODULE_1_LAB_SLUGS)) {
    if (text.includes(slug)) {
      return slug;
    }
  }
  if (text.includes('filesystem') || text.includes('fhs')) {
    return '02-linux-filesystem-hierarchy';
  }
  if (text.includes('cli') || text.includes('file operations')) {
    return '03-cli-fundamentals';
  }
  if (text.includes('package') || text.includes('vim') || text.includes('nano')) {
    return '04-package-management-vim';
  }
  if (text.includes('users') || text.includes('groups') || text.includes('permissions')) {
    return '05-users-groups-permissions';
  }
  if (text.includes('pipes') || text.includes('redirection') || text.includes('scripting')) {
    return '06-pipes-redirection-shell-scripting';
  }
  if (text.includes('networking') || text.includes('ssh') || text.includes('security')) {
    return '07-networking-ssh-security';
  }
  return MODULE_1_LAB_SLUGS[lesson.lessonOrder] ?? '01-os-linux-basics';
}

/** F4 SCR-F4-06: renders text, video, or the DataCamp-style lab/interactive launcher. */
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
    const labSlug = resolveLabSlugForLesson(lesson);
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded border border-border bg-paper-dim px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
              Hands-on Lab Exercise
            </span>
            <span className="font-mono text-xs text-muted-foreground">· Live Sandbox Environment</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Estimated: ~45 min</span>
        </div>

        <div className="mt-4 space-y-3">
          <h3 className="text-base font-semibold text-card-foreground">{lesson.title}</h3>
          <p className="text-xs leading-relaxed text-muted">
            {lesson.content ??
              'Launch your isolated, full-root Linux container to practice guided exploration, unguided operational tasks, and break-fix incident remediation in real time.'}
          </p>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 1
              </span>
              <p className="text-xs font-medium text-card-foreground">Guided System Exploration</p>
            </div>
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 2
              </span>
              <p className="text-xs font-medium text-card-foreground">Unguided Operational Tasks</p>
            </div>
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 3
              </span>
              <p className="text-xs font-medium text-card-foreground">Break-Fix Remediation</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Interactive Web Terminal &amp; Automated Verification (/{labSlug})</span>
          </div>
          <Link
            to={`/labs/${labSlug}`}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-medium text-pearl-100 transition-opacity hover:opacity-90"
          >
            <span>Launch Lab Workspace</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
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

export default LessonBody;
