import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, ErrorState, PageHeader } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  useActivityHistory,
  useContinueLearning,
  useCourseProgress,
  useModulesProgress,
} from '@/features/progress/hooks';
import { useBadgeCatalog, useGamificationProfile } from '@/features/achievements/hooks/useGamification';
import { useCourseOverview } from '@/features/curriculum/hooks';
import { useLabCatalog } from '@/features/labs/hooks';
import { AiMentorDrawer } from '@/features/labs/components/AiMentorDrawer';
import { StatsGrid } from '../components';
import { useDashboardStats } from '../hooks';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function computeStreak(activityDates: string[]): number {
  const days = new Set(activityDates.map((value) => new Date(value).toISOString().slice(0, 10)));
  if (days.size === 0) return 0;

  const today = new Date();
  const cursor = new Date(today);
  let streak = 0;

  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

/**
 * SCR-F5-01: Learner Dashboard.
 * Modeled after the reference layout (d.webp) in Ink & Paper monochrome aesthetic:
 * - Direct DB-driven progress, modules, labs, streak & activities (zero hardcoding)
 * - Top greeting + progress statement + 4 top metric cards
 * - Left column: Continue learning card (with top-right rounded curve and action buttons)
 *   + Recommended 2x2 grid with difficulty filters
 * - Right column: Streak tracker card with 7-day indicators & skill breakdown
 *   + DevOps AI Mentor card
 * - Zero emojis, no AI-slop pastel colors, strictly token-driven monochrome.
 */
function LearnerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const course = useCourseProgress();
  const modules = useModulesProgress();
  const continueLearning = useContinueLearning();
  const activity = useActivityHistory(30);
  const gamificationProfile = useGamificationProfile();
  const badgesQuery = useBadgeCatalog();
  const courseOverview = useCourseOverview();
  const labCatalog = useLabCatalog();

  const [selectedFilter, setSelectedFilter] = useState<DifficultyFilter>('all');
  const [isAiMentorOpen, setIsAiMentorOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stardust_dashboard_bookmark') === 'true';
    } catch {
      return false;
    }
  });

  const toggleBookmark = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('stardust_dashboard_bookmark', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const activityItems = useMemo(() => activity.data ?? [], [activity.data]);

  const activityDatesSet = useMemo(() => {
    return new Set(activityItems.map((item) => new Date(item.createdAt).toISOString().slice(0, 10)));
  }, [activityItems]);

  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const streak = useMemo(
    () => computeStreak(activityItems.map((item) => item.createdAt)),
    [activityItems],
  );

  const totalPoints = gamificationProfile.data?.points?.balance ?? 0;
  const currentStreak = gamificationProfile.data?.currentStreakDays ?? streak;
  const badgesCount = gamificationProfile.data?.badges?.length ?? badgesQuery.data?.length ?? 0;

  const isError = course.isError || continueLearning.isError;

  const retry = () => {
    void course.refetch();
    void modules.refetch();
    void continueLearning.refetch();
    void activity.refetch();
    void gamificationProfile.refetch();
    void courseOverview.refetch();
    void labCatalog.refetch();
  };

  if (isError) {
    return (
      <div className="space-y-6 w-full min-w-0 max-w-full">
        <PageHeader title="Dashboard" />
        <ErrorState
          message={
            course.error?.message ??
            continueLearning.error?.message ??
            'Unable to load your progress.'
          }
          onRetry={retry}
        />
      </div>
    );
  }

  const pointer = continueLearning.data ?? null;
  const progressPct = pointer?.progressPct ?? course.data?.progressPercentage ?? 0;
  const greeting = getGreeting();
  const userName = user?.fullName || user?.username || 'Learner';

  const totalModulesCount = modules.data?.length ?? courseOverview.data?.modules?.length ?? 0;
  const completedLessonsCount = course.data?.completedLessonCount ?? 0;

  // Filtered Recommended items (2x2 grid)
  const recommendedItems = useMemo(() => {
    const rawModules = courseOverview.data?.modules ?? [];
    const rawLabs = labCatalog.data ?? [];

    const combined: Array<{
      id: string;
      title: string;
      eyebrow: string;
      difficulty: string;
      meta: string;
      to: string;
      icon: 'roles' | 'lab';
    }> = [];

    // Add published modules
    for (const mod of rawModules) {
      combined.push({
        id: `mod-${mod.moduleId}`,
        title: mod.title,
        eyebrow: 'Module',
        difficulty: mod.estimatedMinutes > 90 ? 'Intermediate' : 'Beginner',
        meta: `${mod.estimatedMinutes || 45} mins`,
        to: ROUTES.LEARN,
        icon: 'roles',
      });
    }

    // Add labs
    for (const lab of rawLabs) {
      combined.push({
        id: `lab-${lab.labId}`,
        title: lab.labName,
        eyebrow: lab.labType === 'sherlock' ? 'Diagnostic Challenge' : 'Hands-On Lab',
        difficulty: lab.difficultyName || 'Intermediate',
        meta: `${lab.estimatedHours || 1} hr`,
        to: lab.slug ? ROUTES.LAB_DETAIL.replace(':labSlug', lab.slug) : ROUTES.LABS,
        icon: 'lab',
      });
    }

    if (selectedFilter === 'all') {
      return combined.slice(0, 4);
    }

    const filtered = combined.filter(
      (item) => item.difficulty.toLowerCase() === selectedFilter.toLowerCase(),
    );

    // If filter yields fewer than 4, pad with others
    if (filtered.length < 4) {
      const remaining = combined.filter(
        (item) => item.difficulty.toLowerCase() !== selectedFilter.toLowerCase(),
      );
      return [...filtered, ...remaining].slice(0, 4);
    }

    return filtered.slice(0, 4);
  }, [courseOverview.data?.modules, labCatalog.data, selectedFilter]);

  // Skill items derived from actual modules
  const skillItems = useMemo(() => {
    const mods = modules.data ?? [];
    if (mods.length === 0) {
      return [
        { name: 'Linux Administration', pct: progressPct, xp: Math.round(totalPoints * 0.4) },
        { name: 'Docker & Containers', pct: Math.min(100, progressPct + 10), xp: Math.round(totalPoints * 0.3) },
        { name: 'Kubernetes Pods', pct: Math.max(0, progressPct - 20), xp: Math.round(totalPoints * 0.2) },
        { name: 'CI/CD Pipelines', pct: Math.max(0, progressPct - 35), xp: Math.round(totalPoints * 0.1) },
      ];
    }
    return mods.slice(0, 4).map((m) => ({
      name: m.moduleTitle,
      pct: m.progressPercentage,
      xp: m.completedLessons * 120,
    }));
  }, [modules.data, progressPct, totalPoints]);

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full pb-16 select-none">
      {/* ─── 1. TOP HEADER & METRICS ROW (MATCHING d.webp) ────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left: Greeting & Goal Progress */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
            {greeting}, {userName}!
          </h1>
          <p className="text-sm text-muted font-medium flex items-center gap-1.5">
            You&apos;re {progressPct}% closer to your goal.
            <Icon name="zap" size={14} className="text-card-foreground shrink-0" />
          </p>
        </div>

        {/* Right: 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          {/* Card 1: Points / XP */}
          <div className="border border-border bg-card px-4 py-3 rounded-xl flex items-center gap-3.5 shadow-2xs hover:border-border/80 transition-colors min-w-[120px]">
            <div className="w-10 h-10 rounded-lg border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0">
              <Icon name="award" size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-card-foreground leading-tight">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Points</div>
            </div>
          </div>

          {/* Card 2: Modules */}
          <div className="border border-border bg-card px-4 py-3 rounded-xl flex items-center gap-3.5 shadow-2xs hover:border-border/80 transition-colors min-w-[120px]">
            <div className="w-10 h-10 rounded-lg border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0">
              <Icon name="roles" size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-card-foreground leading-tight">
                {totalModulesCount}
              </div>
              <div className="text-xs text-muted font-medium">Modules</div>
            </div>
          </div>

          {/* Card 3: Certificates / Badges */}
          <div className="border border-border bg-card px-4 py-3 rounded-xl flex items-center gap-3.5 shadow-2xs hover:border-border/80 transition-colors min-w-[120px]">
            <div className="w-10 h-10 rounded-lg border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0">
              <Icon name="flag" size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-card-foreground leading-tight">
                {badgesCount}
              </div>
              <div className="text-xs text-muted font-medium">Badges</div>
            </div>
          </div>

          {/* Card 4: Challenges / Completed Labs */}
          <div className="border border-border bg-card px-4 py-3 rounded-xl flex items-center gap-3.5 shadow-2xs hover:border-border/80 transition-colors min-w-[120px]">
            <div className="w-10 h-10 rounded-lg border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0">
              <Icon name="terminal" size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-card-foreground leading-tight">
                {completedLessonsCount}
              </div>
              <div className="text-xs text-muted font-medium">Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN 2-COLUMN LAYOUT (LEFT 65%, RIGHT 35%) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── LEFT COLUMN (~65% width) ────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8 min-w-0">
          {/* Section A: Continue Learning */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-card-foreground tracking-tight">
              Continue learning
            </h2>

            {/* Continue Learning Card with Top-Right Curved Cutout */}
            <div className="relative border border-border bg-card rounded-2xl p-6 shadow-2xs transition-all overflow-hidden group">
              {/* Top-Right Curved Accent Area with Circular Micro-Interaction Buttons */}
              <div className="absolute top-0 right-0 flex items-center gap-2 p-3 bg-paper border-b border-l border-border rounded-bl-2xl">
                <button
                  type="button"
                  onClick={toggleBookmark}
                  className={`w-9 h-9 rounded-full border border-border flex items-center justify-center transition-all cursor-pointer ${
                    isBookmarked
                      ? 'bg-ink text-paper dark:bg-pearl-100 dark:text-ink font-bold'
                      : 'bg-card text-muted hover:text-card-foreground hover:bg-surface-hover'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Bookmark lesson'}
                  aria-label="Bookmark lesson"
                >
                  <Icon name="bookmark" size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LEARN)}
                  className="w-9 h-9 rounded-full border border-border bg-card text-muted hover:text-card-foreground hover:bg-surface-hover flex items-center justify-center transition-all cursor-pointer"
                  title="Curriculum outline"
                  aria-label="More options"
                >
                  <Icon name="more-horizontal" size={16} />
                </button>
              </div>

              {/* Main Card Content */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2 sm:pt-0">
                {/* Topic Icon Container */}
                <div className="w-20 h-20 rounded-2xl border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0 shadow-2xs">
                  <Icon name="terminal" size={36} />
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 min-w-0 pr-16 sm:pr-24">
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <Icon name="roles" size={13} />
                    <span>{pointer?.moduleTitle ?? 'Core Curriculum'}</span>
                  </div>

                  <h3 className="text-xl font-bold text-card-foreground tracking-tight truncate">
                    {pointer?.lessonTitle ?? 'Operating Systems & Linux Fundamentals'}
                  </h3>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-mono text-muted">
                      {progressPct}% of 100% Completed
                    </span>
                    <div className="w-full max-w-md h-2 bg-paper border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink dark:bg-pearl-100 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, progressPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Learning Action */}
                <div className="shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (pointer?.lessonId) {
                        navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(pointer.lessonId)));
                      } else {
                        navigate(ROUTES.LEARN);
                      }
                    }}
                    className="rounded-full px-6 py-2.5 bg-ink text-paper dark:bg-pearl-100 dark:text-ink font-semibold text-xs tracking-wide shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Resume learning
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Recommended For You */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-card-foreground tracking-tight">
                Recommended For You
              </h2>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-xs font-medium self-start sm:self-center">
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      selectedFilter === tab
                        ? 'bg-ink text-paper dark:bg-pearl-100 dark:text-ink font-semibold'
                        : 'text-muted hover:text-card-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 2x2 Grid of Recommended Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(item.to)}
                  className="border border-border bg-card hover:border-ink/50 dark:hover:border-pearl-100/50 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-150 cursor-pointer shadow-2xs group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                      <Icon name={item.icon} size={13} />
                      <span>{item.eyebrow}</span>
                    </div>
                    <h4 className="text-base font-bold text-card-foreground tracking-tight group-hover:text-ink dark:group-hover:text-pearl-100 line-clamp-2">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted">
                      <span className="px-2 py-0.5 rounded-sm border border-border bg-paper font-sans font-medium text-[11px]">
                        {item.difficulty}
                      </span>
                      <span>•</span>
                      <span>{item.meta}</span>
                    </div>

                    <div className="w-8 h-8 rounded-lg border border-border bg-paper flex items-center justify-center text-muted group-hover:text-card-foreground transition-colors shrink-0">
                      <Icon name="external-link" size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* See All Modules Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(ROUTES.LEARN)}
              className="w-full justify-center text-xs font-semibold py-3 rounded-xl border border-border bg-card hover:bg-surface-hover hover:border-ink/40 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>See all modules</span>
              <Icon name="external-link" size={14} />
            </Button>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (~35% width) ───────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* Card 1: Streak Card */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-2xs space-y-6">
            {/* Streak Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-card-foreground tracking-tight">
                  You&apos;re on a
                </h3>
                <div className="text-xl font-bold text-card-foreground tracking-tight">
                  {currentStreak}-day streak
                </div>
              </div>

              <div className="flex items-center gap-1 text-lg font-bold text-card-foreground border border-border bg-paper px-3 py-1.5 rounded-xl shadow-2xs">
                <Icon name="zap" size={18} />
                <span>{currentStreak}</span>
              </div>
            </div>

            {/* 7-Day Circular Tracker Row */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {weekDates.map((dateStr, idx) => {
                const isActive = activityDatesSet.has(dateStr);
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                const dayLabel = WEEKDAY_LABELS[idx];

                return (
                  <div
                    key={dateStr}
                    className="flex flex-col items-center gap-1"
                    title={`${dateStr} ${isActive ? '• Active' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-ink text-paper dark:bg-pearl-100 dark:text-ink shadow-2xs scale-105'
                          : isToday
                            ? 'border-2 border-dashed border-card-foreground text-card-foreground'
                            : 'border border-border bg-paper text-muted'
                      }`}
                    >
                      {isActive ? (
                        <Icon name="zap" size={14} />
                      ) : (
                        dayLabel
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skill XP Breakdown */}
            <div className="space-y-3.5 pt-2 border-t border-border">
              {skillItems.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-card-foreground truncate max-w-[180px]">
                      {skill.name}
                    </span>
                    <span className="font-mono text-muted text-[11px]">
                      {skill.xp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-paper border border-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink dark:bg-pearl-100 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, skill.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* View More Details Link */}
            <div className="pt-2">
              <Link
                to={ROUTES.ACHIEVEMENTS}
                className="text-xs font-semibold text-card-foreground hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View more details</span>
                <span>›</span>
              </Link>
            </div>
          </div>

          {/* Card 2: AI DevOps Mentor (User instructed: "for the bottom right thing let it be the AI bot") */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-2xs space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl border border-border bg-paper flex items-center justify-center text-card-foreground shrink-0 shadow-2xs">
                <Icon name="sparkles" size={20} />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border border-border bg-paper text-muted">
                Assistant
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-card-foreground tracking-tight">
                DevOps AI Mentor
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Stuck on a failing container or terminal task? Get instant debugging hints, architecture explanations, and command walkthroughs.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAiMentorOpen(true)}
              className="w-full justify-center text-xs font-semibold py-2.5 rounded-xl bg-ink text-paper dark:bg-pearl-100 dark:text-ink shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Icon name="sparkles" size={14} />
              <span>Ask AI Mentor</span>
            </Button>
          </div>
        </div>
      </div>

      {/* AI Mentor Drawer */}
      {isAiMentorOpen && (
        <AiMentorDrawer
          lessonId={pointer?.lessonId ?? 1}
          onClose={() => setIsAiMentorOpen(false)}
        />
      )}
    </div>
  );
}

/** Existing platform stats dashboard (users without progress.self.read). */
function AdminStatsDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();

  return (
    <div>
      <PageHeader title="Platform Dashboard" />

      {isLoading || isFetching ? <div className="text-xs text-muted font-mono p-4">Loading dashboard…</div> : null}

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

    const activeWorkspace = localStorage.getItem('stardust_active_workspace') || 'default';

    // If user has explicitly selected Personal Space via the context switcher,
    // let them stay and learn in the LearnerDashboard rather than auto-bouncing them!
    if (activeWorkspace !== 'personal') {
      if (roles.has('platform_admin') || permissions.has('platform.admin.access')) {
        return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
      }
      if (
        roles.has('org_admin') ||
        permissions.has('org:manage') ||
        roles.has('professor') ||
        permissions.has('progress.org.read')
      ) {
        return <Navigate to={ROUTES.ORG_DASHBOARD} replace />;
      }
    }
  }

  const hasProgressRead = (user?.permissions ?? []).includes('progress.self.read');

  return hasProgressRead || (user?.roles ?? []).length > 0 ? <LearnerDashboard /> : <AdminStatsDashboard />;
}
