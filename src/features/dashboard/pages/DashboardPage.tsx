import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, EmptyState, ErrorState, PageHeader, ProgressBar } from '@/shared/components';
import { Icon, type IconName } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import { formatNumber, formatRelativeTime, pluralize } from '@/shared/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useGamificationSummary } from '@/features/achievements/hooks/useGamificationSummary';
import { useMyClass } from '@/features/enrollment/hooks';
import { useLabCatalog } from '@/features/labs/hooks';
import { AiMentorDrawer } from '@/features/labs/components/AiMentorDrawer';
import {
  useActivityHistory,
  useContinueLearningPointer,
  useCoursesProgress,
} from '@/features/progress/hooks';
import type { ContinueLearningPointerDto, LearningActivityType } from '@/features/progress/types';
import {
  DashboardActivitySkeleton,
  DashboardContinueSkeleton,
  DashboardCoursesSkeleton,
  DashboardLabsSkeleton,
  DashboardMetricsSkeleton,
  DashboardPageSkeleton,
  DashboardStatsSkeleton,
  DashboardStreakSkeleton,
} from './DashboardPageSkeleton';
import { StatsGrid } from '../components';
import { useDashboardStats } from '../hooks';

const SECTION_TITLE_CLASS = 'text-base font-bold tracking-tight text-card-foreground';
const CARD_CLASS = 'rounded-md border border-border bg-card p-6 shadow-2xs';
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ACTIVITY_LIMIT = 30;
const ACTIVITY_ROWS = 6;
const LAB_CARDS = 4;

const ACTIVITY_META: Partial<Record<LearningActivityType, { label: string; icon: IconName }>> = {
  LESSON_STARTED: { label: 'Started a lesson', icon: 'lesson' },
  LESSON_COMPLETED: { label: 'Completed a lesson', icon: 'lesson' },
  MODULE_COMPLETED: { label: 'Completed a module', icon: 'module' },
  LAB_STARTED: { label: 'Started a lab', icon: 'lab' },
  LAB_COMPLETED: { label: 'Completed a lab', icon: 'lab' },
  LAB_FAILED: { label: 'Lab attempt failed', icon: 'error' },
  LAB_TERMINATED: { label: 'Lab session ended', icon: 'stop' },
  TRACK_COMPLETED: { label: 'Completed a track', icon: 'trophy' },
  AI_MENTOR_SESSION: { label: 'Asked the AI Mentor', icon: 'mentor' },
  QUIZ_STARTED: { label: 'Started a quiz', icon: 'quiz' },
  QUIZ_PASSED: { label: 'Passed a quiz', icon: 'check-circle' },
  QUIZ_FAILED: { label: 'Failed a quiz', icon: 'error' },
  COURSE_COMPLETED: { label: 'Completed a course', icon: 'course' },
  LAB_STEP_STAGED: { label: 'Staged a lab step', icon: 'lab' },
  LAB_STEP_PASSED: { label: 'Passed a lab step', icon: 'check' },
  LAB_STEP_FAILED: { label: 'Failed a lab step', icon: 'error' },
  LAB_HINT_REVEALED: { label: 'Revealed a lab hint', icon: 'hint' },
  QUIZ_TERMINAL_STAGED: { label: 'Staged a quiz terminal', icon: 'quiz' },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/** Get the 7 dates of the current week (Sunday to Saturday) in YYYY-MM-DD */
function getCurrentWeekDates(): string[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** Route for the continue pointer, by item kind (C§4.3). */
function continuePath(pointer: ContinueLearningPointerDto): string {
  if (pointer.kind === 'quiz' && pointer.quizId !== null) {
    return ROUTES.LEARN_QUIZ.replace(':quizId', String(pointer.quizId));
  }
  if (pointer.kind === 'lab' && pointer.labId !== null) {
    return `${ROUTES.LEARN_LAB.replace(':labId', String(pointer.labId))}?itemId=${pointer.lessonId}`;
  }
  return ROUTES.LEARN_LESSON.replace(':lessonId', String(pointer.lessonId));
}

/** XP balance, total earned, global rank and streak from the server summary. Hidden without access. */
function SummaryMetrics() {
  const summary = useGamificationSummary();
  // A disabled query (no gamification permission) never fetches; render nothing.
  if (summary.fetchStatus === 'idle' && summary.isPending) return null;
  if (summary.isPending) return <DashboardMetricsSkeleton />;
  if (summary.isError) {
    return (
      <div className="w-full sm:w-auto">
        <ErrorState compact error={summary.error} onRetry={() => void summary.refetch()} />
      </div>
    );
  }
  const data = summary.data;
  if (!data) return null;

  const cards: Array<{ key: string; icon: IconName; value: string; label: string }> = [
    { key: 'balance', icon: 'zap', value: formatNumber(data.balance), label: 'XP balance' },
    {
      key: 'earned',
      icon: 'award',
      value: formatNumber(data.totalEarned),
      label: 'Total XP earned',
    },
  ];
  if (data.globalRank !== null) {
    cards.push({
      key: 'rank',
      icon: 'leaderboard',
      value: `#${formatNumber(data.globalRank)}`,
      label: 'Global rank',
    });
  }
  cards.push({
    key: 'streak',
    icon: 'streak',
    value: formatNumber(data.currentStreakDays),
    label: 'Day streak',
  });

  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex min-w-[7.5rem] items-center gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-2xs transition-colors hover:border-border/80"
        >
          <Icon name={card.icon} size={18} className="shrink-0 text-card-foreground" />
          <div>
            <div className="text-base font-bold leading-tight text-card-foreground">
              {card.value}
            </div>
            <div className="text-xs font-medium text-muted">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Enrolled class context card (org students only). */
function ClassCard({
  className,
  organizationName,
}: {
  className: string;
  organizationName: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-2xs sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Icon name="my-class" size={18} className="shrink-0 text-card-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-card-foreground">{className}</p>
          <p className="truncate text-xs text-muted">{organizationName}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.STUDENT_MY_CLASS)}>
        View class
      </Button>
    </div>
  );
}

/** Continue learning: the server pointer routed by item kind, or an empty state for new learners. */
function ContinueSection() {
  const navigate = useNavigate();
  const pointerQuery = useContinueLearningPointer();

  if (pointerQuery.isPending) return <DashboardContinueSkeleton />;

  const pointer = pointerQuery.data ?? null;

  return (
    <section className="space-y-3">
      <h2 className={SECTION_TITLE_CLASS}>Continue learning</h2>
      {pointerQuery.isError ? (
        <ErrorState error={pointerQuery.error} onRetry={() => void pointerQuery.refetch()} />
      ) : pointer === null ? (
        <div className={CARD_CLASS}>
          <EmptyState
            icon="lesson"
            title="No lesson started yet"
            action={
              <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.LEARN)}>
                Browse courses
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-2xs sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Icon name="module" size={13} className="shrink-0" />
              <span className="truncate">{pointer.moduleTitle}</span>
            </p>
            <h3 className="truncate text-xl font-bold tracking-tight text-card-foreground">
              {pointer.lessonTitle}
            </h3>
            <div className="max-w-md space-y-1.5 pt-1">
              <p className="font-mono text-xs text-muted">{pointer.progressPct}% complete</p>
              <ProgressBar value={pointer.progressPct} label="Continue learning progress" />
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(continuePath(pointer))}
            className="shrink-0 whitespace-nowrap"
          >
            {pointer.progressPct >= 100 ? 'Review' : 'Resume'}
          </Button>
        </div>
      )}
    </section>
  );
}

/** Started courses with their server progress. */
function CoursesSection() {
  const coursesQuery = useCoursesProgress();

  if (coursesQuery.isPending) return <DashboardCoursesSkeleton />;

  const courses = coursesQuery.data ?? [];

  return (
    <section className="space-y-3">
      <h2 className={SECTION_TITLE_CLASS}>Courses</h2>
      {coursesQuery.isError ? (
        <ErrorState error={coursesQuery.error} onRetry={() => void coursesQuery.refetch()} />
      ) : courses.length === 0 ? (
        <div className={CARD_CLASS}>
          <EmptyState icon="course" title="No courses started yet" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.courseId}
              to={ROUTES.LEARN_COURSE.replace(':courseId', String(course.courseId))}
              className="flex flex-col gap-3 rounded-md border border-border bg-card p-5 shadow-2xs transition-colors hover:border-ink/50"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="line-clamp-2 min-w-0 text-base font-bold tracking-tight text-card-foreground">
                  {course.courseTitle}
                </h4>
                {course.isCompleted ? (
                  <Icon
                    name="check-circle"
                    size={16}
                    title="Course completed"
                    className="shrink-0 text-card-foreground"
                  />
                ) : null}
              </div>
              <ProgressBar
                value={course.progressPercentage}
                label={`${course.courseTitle} progress`}
              />
              <div className="flex items-center justify-between gap-2 font-mono text-xs text-muted">
                <span>
                  {formatNumber(course.completedLessonCount)} of {formatNumber(course.totalLessons)}{' '}
                  items
                </span>
                <span>{course.progressPercentage}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** Recent learning activity from the server, newest first. */
function ActivitySection() {
  const activity = useActivityHistory(ACTIVITY_LIMIT);

  if (activity.isPending) return <DashboardActivitySkeleton />;

  const rows = (activity.data ?? [])
    .filter((item) => ACTIVITY_META[item.activityType] !== undefined)
    .slice(0, ACTIVITY_ROWS);

  return (
    <section className="space-y-3">
      <h2 className={SECTION_TITLE_CLASS}>Recent activity</h2>
      {activity.isError ? (
        <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />
      ) : rows.length === 0 ? (
        <div className={CARD_CLASS}>
          <EmptyState icon="history" title="No activity yet" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((item) => {
            const meta = ACTIVITY_META[item.activityType];
            if (!meta) return null;
            return (
              <li key={item.logId} className="flex items-center gap-3 py-2">
                <Icon name={meta.icon} size={16} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
                  {meta.label}
                </span>
                <time className="shrink-0 font-mono text-xs text-muted" dateTime={item.createdAt}>
                  {formatRelativeTime(item.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Labs from the learner catalog; difficulty and hours are shown only when the database has them. */
function LabsSection() {
  const labsQuery = useLabCatalog();

  if (labsQuery.isPending) return <DashboardLabsSkeleton />;

  const labs = (labsQuery.data ?? []).slice(0, LAB_CARDS);

  return (
    <section className="space-y-3">
      <h2 className={SECTION_TITLE_CLASS}>Labs</h2>
      {labsQuery.isError ? (
        <ErrorState error={labsQuery.error} onRetry={() => void labsQuery.refetch()} />
      ) : labs.length === 0 ? (
        <div className={CARD_CLASS}>
          <EmptyState icon="lab" title="No labs available yet" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {labs.map((lab) => (
            <Link
              key={lab.labId}
              to={ROUTES.LAB_DETAIL.replace(':labSlug', lab.slug)}
              className="flex flex-col gap-3 rounded-md border border-border bg-card p-5 shadow-2xs transition-colors hover:border-ink/50"
            >
              <div className="flex items-start gap-2">
                <Icon name="lab" size={16} className="mt-0.5 shrink-0 text-muted" />
                <h4 className="line-clamp-2 min-w-0 text-base font-bold tracking-tight text-card-foreground">
                  {lab.labName}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
                {lab.difficultyName ? <span>{lab.difficultyName}</span> : null}
                {lab.estimatedHours > 0 ? <span>{formatNumber(lab.estimatedHours)} h</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** Streak count from the summary and the seven-day tracker from the activity history. */
function StreakCard() {
  const summary = useGamificationSummary();
  const activity = useActivityHistory(ACTIVITY_LIMIT);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const todayKey = new Date().toISOString().slice(0, 10);

  const activeDates = useMemo(
    () =>
      new Set(
        (activity.data ?? []).map((item) => new Date(item.createdAt).toISOString().slice(0, 10)),
      ),
    [activity.data],
  );

  if (activity.isPending) return <DashboardStreakSkeleton />;

  const streakDays = summary.data?.currentStreakDays ?? null;

  return (
    <div className={`${CARD_CLASS} space-y-6`}>
      {activity.isError ? (
        <ErrorState compact error={activity.error} onRetry={() => void activity.refetch()} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className={SECTION_TITLE_CLASS}>Day streak</h3>
              {streakDays !== null ? (
                <div className="text-xl font-bold tracking-tight text-card-foreground">
                  {pluralize(streakDays, 'day', 'days')}
                </div>
              ) : null}
            </div>
            {streakDays !== null ? (
              <div className="flex items-center gap-1 rounded-xs border border-border bg-paper px-3 py-1.5 text-lg font-bold text-card-foreground">
                <Icon name="zap" size={18} />
                <span>{formatNumber(streakDays)}</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {weekDates.map((dateStr, idx) => {
              const isActive = activeDates.has(dateStr);
              const isToday = dateStr === todayKey;

              return (
                <div
                  key={dateStr}
                  className="flex flex-col items-center gap-1"
                  title={`${dateStr}${isActive ? ' Active' : ''}`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-ink text-paper shadow-2xs'
                        : isToday
                          ? 'border-2 border-dashed border-card-foreground text-card-foreground'
                          : 'border border-border bg-paper text-muted'
                    }`}
                  >
                    {isActive ? <Icon name="zap" size={14} /> : WEEKDAY_LABELS[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** AI mentor entry point: opens the drawer in general mode (no lesson or lab context). */
function MentorCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <Icon name="sparkles" size={20} className="text-card-foreground" />
      <div className="space-y-1">
        <h3 className={SECTION_TITLE_CLASS}>DevOps AI Mentor</h3>
        <p className="text-xs leading-relaxed text-muted">
          Stuck on a failing container or terminal task? Get debugging hints, architecture
          explanations, and command walkthroughs.
        </p>
      </div>
      <Button
        variant="secondary"
        size="md"
        iconName="sparkles"
        onClick={onOpen}
        className="w-full justify-center"
      >
        Ask AI Mentor
      </Button>
    </div>
  );
}

/** SCR-F5-01: Learner dashboard. Every value comes from the server; sections own their states. */
function LearnerDashboard() {
  const user = useAuthStore((state) => state.user);
  const roles = new Set(user?.roles ?? []);
  const myClassQuery = useMyClass(roles.has('org_student'));
  const enrolledClass = myClassQuery.data ?? null;

  const pointerQuery = useContinueLearningPointer();
  const coursesQuery = useCoursesProgress();

  const [isAiMentorOpen, setIsAiMentorOpen] = useState(false);

  // The whole-page skeleton shows only while the first core reads are in flight;
  // afterwards each section settles on its own skeleton, empty or error state.
  if (pointerQuery.isPending && coursesQuery.isPending) {
    return <DashboardPageSkeleton />;
  }

  const greeting = getGreeting();
  const userName = user?.fullName || user?.username || 'Learner';

  return (
    <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-8 pb-16">
      <div className="flex flex-col justify-between gap-6 pb-2 lg:flex-row lg:items-center">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
          {greeting}, {userName}!
        </h1>
        <SummaryMetrics />
      </div>

      {enrolledClass ? (
        <ClassCard
          className={enrolledClass.className}
          organizationName={enrolledClass.organizationName}
        />
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          <ContinueSection />
          <CoursesSection />
          <ActivitySection />
          <LabsSection />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-4">
          <StreakCard />
          <MentorCard onOpen={() => setIsAiMentorOpen(true)} />
        </div>
      </div>

      {isAiMentorOpen ? <AiMentorDrawer onClose={() => setIsAiMentorOpen(false)} /> : null}
    </div>
  );
}

/** Existing platform stats dashboard (users without progress.self.read). */
function AdminStatsDashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  return (
    <div>
      <PageHeader title="Platform Dashboard" />

      {isLoading ? <DashboardStatsSkeleton /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && !data ? (
        <div className="p-8 text-center text-xs font-mono text-muted border border-border rounded-xs bg-card">
          No dashboard data available.
        </div>
      ) : null}

      {!isLoading && !isError && data ? <StatsGrid stats={data} /> : null}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    const roles = new Set(user.roles ?? []);
    const permissions = new Set(user.permissions ?? []);

    // Platform administrators have a dedicated surface. Everyone else,
    // including org admins and professors, may use their personal space.
    if (roles.has('platform_admin') || permissions.has('platform.admin.access')) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
  }

  // LearnerDashboard assumes progress.self.read (learner progress hooks).
  // Staff without that permission get the stats dashboard instead of a
  // broken learner surface.
  const hasProgressRead = (user?.permissions ?? []).includes('progress.self.read');

  return hasProgressRead ? <LearnerDashboard /> : <AdminStatsDashboard />;
}
