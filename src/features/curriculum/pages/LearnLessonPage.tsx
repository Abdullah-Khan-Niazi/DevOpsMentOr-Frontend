import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorState, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { CONTENT_TYPE_LABELS } from '../components/ContentTypeIcon';
import { CourseOutlineModal } from '../components/CourseOutlineModal';
import { useLearnLesson, useLearnModule, useLearnModuleLessons } from '../hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCompleteLesson, useStartLesson } from '@/features/progress/hooks';
import { useGamificationProfile } from '@/features/achievements/hooks/useGamification';
import { LabWorkspace } from '@/features/labs';

/**
 * DataCamp-Inspired Unified Learner Screen (Video, Lecture, and Labs).
 * Features:
 * - Iconic top navigation pill: [ ← | ☰ Course Outline | → ]
 * - DB-driven XP header badge
 * - Split-view lecture player with interactive clickable timecoded transcript
 * - Clean bottom progress bar with segmented completion dots
 */
export function LearnLessonPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lessonQuery = useLearnLesson(lessonId);
  const lesson = lessonQuery.data;

  const moduleQuery = useLearnModule(lesson?.moduleId ?? '', Boolean(lesson));
  const lessonsQuery = useLearnModuleLessons(lesson?.moduleId ?? '', Boolean(lesson));
  const gamificationQuery = useGamificationProfile();

  const canWriteProgress = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('progress.self.write'),
  );
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();
  const startedRef = useRef<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [isSidePanelHidden, setIsSidePanelHidden] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!canWriteProgress || !lesson) return;
    if (startedRef.current === lesson.lessonId) return;
    startedRef.current = lesson.lessonId;
    startLesson.mutate(lesson.lessonId, {
      onError: () => undefined,
    });
  }, [canWriteProgress, lesson, startLesson]);

  const handleComplete = () => {
    if (!lesson) return;
    const timeSpentSeconds = Math.min(3600, Math.floor((Date.now() - startedAt) / 1000));
    completeLesson.mutate(
      { lessonId: lesson.lessonId, payload: { timeSpentSeconds } },
      {
        onSuccess: () => {
          setIsCompleted(true);
          toast.success(
            `Lesson completed! +${lesson.contentType === 'lab' ? 75 : 15} XP added to profile.`,
          );
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleSeek = (seconds: number) => {
    setActiveTimestamp(seconds);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  };

  if (lessonQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto py-4">
        <div className="h-10 bg-border/40 rounded-xs" />
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <div className="h-[480px] bg-border/20 rounded-xs" />
          <div className="h-[480px] bg-border/30 rounded-xs" />
        </div>
      </div>
    );
  }

  if (lessonQuery.isError || !lesson) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <ErrorState
          message={lessonQuery.error?.message ?? 'Lesson unavailable.'}
          onRetry={() => void lessonQuery.refetch()}
        />
      </div>
    );
  }

  const module = moduleQuery.data ?? null;
  const lessons = lessonsQuery.data ?? [];

  const index = lessons.findIndex((item) => item.lessonId === lesson.lessonId);
  const prevLesson = index > 0 ? lessons[index - 1] : null;
  const nextLesson = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const userXp = gamificationQuery.data?.points?.balance ?? 120;

  // Hand-off directly to full interactive LabWorkspace when content type is lab
  if (lesson.contentType === 'lab') {
    return (
      <div className="w-full">
        <LabWorkspace
          lesson={lesson}
          module={module}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          onOpenOutline={() => setOutlineOpen(true)}
          onComplete={handleComplete}
          isCompleted={isCompleted}
          userXp={userXp}
        />

        <CourseOutlineModal
          isOpen={outlineOpen}
          onClose={() => setOutlineOpen(false)}
          activeLessonId={lesson.lessonId}
          moduleId={lesson.moduleId}
        />
      </div>
    );
  }

  // Simulated timestamp sections for videos/lectures (DataCamp pattern)
  const transcriptBlocks = [
    {
      title: '1. Architecture & Background',
      timeRange: '00:00 - 00:45',
      seconds: 0,
      summary: `Introduction to ${lesson.title}. Key operational tradeoffs and engineering baseline.`,
    },
    {
      title: '2. Deep Dive & Core Mechanics',
      timeRange: '00:45 - 02:30',
      seconds: 45,
      summary: 'Inspecting internal state, configuration flags, and performance isolation.',
    },
    {
      title: '3. Production Best Practices',
      timeRange: '02:30 - 04:00',
      seconds: 150,
      summary: 'Remediation protocols, deployment safety checks, and observability metrics.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* ─── Top Global Learn Header (DataCamp Pattern) ──────────────────── */}
      <header className="relative h-12 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back / Exit Button & Lesson Title */}
        <div className="flex items-center gap-2.5 min-w-0 z-10 max-w-[28%] sm:max-w-[32%]">
          <button
            type="button"
            onClick={() => navigate(ROUTES.LEARN)}
            className="p-1.5 rounded-xs hover:bg-surface text-muted hover:text-card-foreground transition-colors cursor-pointer mr-0.5 shrink-0"
            title="Exit to Curriculum"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-card-foreground truncate">
            {lesson.title}
          </span>
        </div>

        {/* Center: Exactly Horizontally Centered Nav Control */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-20 pointer-events-auto">
          <div className="inline-flex items-center rounded-xs border border-border bg-paper shadow-2xs divide-x divide-border overflow-hidden shrink-0">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(prevLesson.lessonId)))}
              className="px-2.5 py-1.5 hover:bg-surface-hover text-muted hover:text-card-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
              title={prevLesson ? `Previous: ${prevLesson.title}` : 'No previous lesson'}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setOutlineOpen(true)}
              className="px-3 py-1.5 hover:bg-surface-hover text-xs font-mono font-medium text-card-foreground flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              title="Open module outline"
            >
              <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Module Outline
            </button>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)))}
              className="px-2.5 py-1.5 hover:bg-surface-hover text-muted hover:text-card-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
              title={nextLesson ? `Next: ${nextLesson.title}` : 'No next lesson'}
            >
              →
            </button>
          </div>
        </div>

        {/* Right: DB-driven User XP Counter */}
        <div className="flex items-center gap-3 shrink-0 z-10 ml-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-paper border border-border text-xs font-mono text-card-foreground">
            <span className="font-semibold">{userXp.toLocaleString()} XP</span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Split: Transcript on Left, Player on Right ───── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left Transcript / Key Concepts Panel */}
        {!isSidePanelHidden && (
          <aside className="w-80 md:w-96 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-border bg-paper/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <h3 className="text-xs font-mono uppercase tracking-wider text-card-foreground font-semibold">
                  Transcript & Notes
                </h3>
              </div>
              <span className="text-xs font-mono text-muted font-medium">
                +15 XP
              </span>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Tags / Skills Chips */}
              {lesson.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lesson.tags.map((tag) => (
                    <span
                      key={tag.tagId}
                      className="text-[10px] font-mono text-muted bg-paper px-1.5 py-0.5 rounded-xs border border-border"
                    >
                      #{tag.tagName}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamped Transcript Cards (DataCamp Pattern) */}
              <div className="space-y-2">
                {transcriptBlocks.map((block, idx) => {
                  const isActive = activeTimestamp === block.seconds;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSeek(block.seconds)}
                      className={`p-3 rounded-xs border transition-all cursor-pointer ${
                        isActive
                          ? 'border-brand-500 bg-brand-50/10 border-l-3 border-l-brand-600'
                          : 'border-border/60 bg-paper/50 hover:bg-surface-hover hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-card-foreground">
                          {block.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-paper border border-border text-muted">
                          {block.timeRange}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {block.summary}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Lesson Text / Syllabus Content if present */}
              {lesson.content && (
                <div className="pt-3 border-t border-border space-y-2 text-xs leading-relaxed text-muted">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
                    Lesson Reference
                  </span>
                  <p className="whitespace-pre-line text-card-foreground">
                    {lesson.content}
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Right Player / Media Area */}
        <main className="flex-1 bg-surface/30 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
          <div className="w-full max-w-4xl space-y-4">
            {lesson.contentType === 'video' ? (
              <div className="relative aspect-video rounded-sm border border-border bg-black shadow-lg overflow-hidden group/video">
                {lesson.videoUrl ? (
                  <video
                    ref={videoRef}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                    aria-label={`Video: ${lesson.title}`}
                  >
                    <source src={lesson.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white/60 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="font-mono text-xs">No video stream linked to this lesson.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-sm border border-border bg-card shadow-sm space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  {CONTENT_TYPE_LABELS[lesson.contentType]}
                </span>
                <h1 className="text-2xl font-bold text-card-foreground">{lesson.title}</h1>
                <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground/90">
                  {lesson.content ? (
                    lesson.content.split('\n\n').map((para, i) => (
                      <p key={i} className="leading-relaxed">{para}</p>
                    ))
                  ) : (
                    <p className="text-muted">Content for this module is being staged.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Bottom Navigation & Progress Bar (DataCamp Pattern) ─────────── */}
      <footer className="h-12 border-t border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Toggle Side Panel */}
        <button
          type="button"
          onClick={() => setIsSidePanelHidden((h) => !h)}
          className="px-2.5 py-1 rounded-xs border border-border bg-paper hover:bg-surface-hover text-xs font-mono text-card-foreground transition-all cursor-pointer font-medium flex items-center gap-1.5 active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          {isSidePanelHidden ? 'Show Side Panel' : 'Hide Side Panel'}
        </button>

        {/* Center: Segmented Progress Dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {lessons.map((l, lIdx) => (
            <div
              key={l.lessonId}
              className={`h-1.5 rounded-full transition-all ${
                lIdx < index || isCompleted
                  ? 'bg-emerald-500 w-8'
                  : lIdx === index
                    ? 'bg-brand-600 w-10 ring-1 ring-brand-500/30'
                    : 'bg-border/80 w-6'
              }`}
              title={`Lesson ${lIdx + 1}: ${l.title}`}
            />
          ))}
          <span className="text-[11px] font-mono text-muted ml-2">
            Item {index + 1} of {lessons.length}
          </span>
        </div>

        {/* Right: Primary Action / Next Button with Microinteractions */}
        <div className="flex items-center gap-2">
          {isCompleted && nextLesson ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)))}
              className="font-mono text-xs shadow-xs active:scale-[0.98] transition-all"
            >
              Next Lesson →
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              isLoading={completeLesson.isPending}
              className="font-mono text-xs shadow-xs active:scale-[0.98] transition-all"
            >
              {isCompleted ? '✓ Completed' : 'Got It! (Mark Complete)'}
            </Button>
          )}
        </div>
      </footer>

      {/* Module Outline Modal */}
      <CourseOutlineModal
        isOpen={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        activeLessonId={lesson.lessonId}
        moduleId={lesson.moduleId}
      />
    </div>
  );
}

export default LearnLessonPage;
