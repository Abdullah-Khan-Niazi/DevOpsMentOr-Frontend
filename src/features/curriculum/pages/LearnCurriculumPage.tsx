import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ErrorState, Icon } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { ModuleAccordionList } from '../components/ModuleAccordionList';
import { useCourseOverview } from '../hooks';
import { useContinueLearning } from '@/features/progress/hooks';
import { useBadgeCatalog, useGamificationProfile } from '@/features/achievements/hooks/useGamification';
import { ReportModal } from '@/features/community';

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LayersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PlayIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TrophyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/**
 * F4 SCR-F4-05: Learner Curriculum View.
 * Strictly adheres to Ink & Paper monochrome design principles:
 * - Pure black & white layout with crisp borders and whitespace hierarchy
 * - No navy backgrounds, no yellow/amber accents, no emojis, no pills
 * - Reviews & comments purged
 * - Clean chapter list with first-class Quizzes, Labs, and Lessons
 */
export function LearnCurriculumPage() {
  const navigate = useNavigate();
  const overview = useCourseOverview();
  const continueLearning = useContinueLearning();
  const badgesQuery = useBadgeCatalog();
  const gamificationProfile = useGamificationProfile();
  const [reportOpen, setReportOpen] = useState(false);

  const courseBadge = useMemo(() => {
    const list = badgesQuery.data ?? [];
    return (
      list.find(
        (b) =>
          b.slug.toLowerCase().includes('devops') ||
          b.badgeType === 'diamond' ||
          b.badgeType === 'platinum' ||
          b.badgeType === 'gold',
      ) ??
      list[0] ??
      null
    );
  }, [badgesQuery.data]);

  if (overview.isLoading) {
    return (
      <div className="space-y-6 w-full min-w-0 max-w-full">
        <div className="h-48 rounded-xs bg-card border border-border animate-pulse p-6" />
        <div className="space-y-3">
          <div className="h-20 rounded-xs bg-card border border-border animate-pulse" />
          <div className="h-20 rounded-xs bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <div className="space-y-6 w-full min-w-0 max-w-full">
        <ErrorState
          message={overview.error?.message ?? 'Unable to load the curriculum.'}
          onRetry={() => void overview.refetch()}
        />
      </div>
    );
  }

  const { course, modules } = overview.data;

  // DB-driven computed total points for the track
  const totalCoursePoints = (course.totalLessons * 60) + (course.totalQuizzes * 40) + 500;
  const userXp = gamificationProfile.data?.points?.balance;

  const openLesson = (lessonId: number) => {
    navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(lessonId)));
  };

  const handleResumeLearning = () => {
    if (continueLearning.data?.lessonId) {
      openLesson(continueLearning.data.lessonId);
    } else if (modules[0]) {
      navigate(ROUTES.LEARN_LESSON.replace(':lessonId', '1'));
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full pb-12 select-none">
      {/* ─── 1. TRACK OVERVIEW CARD (INK & PAPER MONOCHROME) ───────────────── */}
      <div className="border border-border bg-card p-6 sm:p-8 rounded-xs shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="text-xs font-mono text-muted">
              DevOps Engineering Curriculum
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground tracking-tight">
              {course.title}
            </h1>

            <p className="text-sm text-muted max-w-2xl leading-relaxed">
              {course.description ?? 'Comprehensive hands-on curriculum in Linux server administration, Kubernetes architecture, and cloud reliability.'}
            </p>

            {userXp !== undefined && (
              <p className="text-xs font-mono text-muted pt-1">
                Your Progress: <span className="text-card-foreground font-semibold">{userXp.toLocaleString()} XP</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleResumeLearning}
                className="font-mono text-xs px-6 h-10 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                {continueLearning.data ? 'Resume Learning →' : 'Start Track →'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setReportOpen(true)}
                className="font-mono text-xs px-4 h-10"
              >
                <Icon name="flag" size={13} />
                Report
              </Button>
            </div>
          </div>

          {/* Right: Certified Track Credential Info */}
          {courseBadge && (
            <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-xs border border-border bg-paper/60 shrink-0 w-60 text-center space-y-2">
              <div className="w-10 h-10 rounded-xs bg-paper border border-border flex items-center justify-center text-card-foreground">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-muted block">
                  Track Credential
                </span>
                <h4 className="text-xs font-bold text-card-foreground mt-0.5">
                  {courseBadge.badgeName}
                </h4>
                <p className="text-[10px] text-muted font-mono mt-0.5">
                  Verified Certificate upon completion
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real DB Metrics Strip - Pure typography and optical spacing, no pills, no emojis */}
        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono text-muted">
          <span className="flex items-center gap-1.5 text-card-foreground font-semibold">
            {totalCoursePoints.toLocaleString()} Total XP
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-muted" />
            {course.estimatedHours} Hours
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <LayersIcon className="w-3.5 h-3.5 text-muted" />
            {modules.length} Modules
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <PlayIcon className="w-3.5 h-3.5 text-muted" />
            {course.totalLessons} Lessons & Labs
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <CheckCircleIcon className="w-3.5 h-3.5 text-muted" />
            {course.totalQuizzes} Quizzes
          </span>
        </div>
      </div>

      {/* ─── 2. CHAPTER OUTLINE LIST ────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
            Course Curriculum ({modules.length} Modules)
          </h2>
          <span className="text-xs font-mono text-muted">
            All chapters interactive
          </span>
        </div>

        <ModuleAccordionList
          modules={modules}
          isError={false}
          onRetry={() => void overview.refetch()}
          onOpenLesson={openLesson}
        />
      </div>

      {/* Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="course"
        targetId={course.courseId}
      />
    </div>
  );
}

export default LearnCurriculumPage;
