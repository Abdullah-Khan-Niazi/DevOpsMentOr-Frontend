import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { TerminalIframe } from './TerminalIframe';
import { LabTimerCountdown } from './LabTimerCountdown';
import { AiMentorModal } from './AiMentorDrawer';
import { MentorOrb, type MentorOrbState } from './MentorOrb';
import { WorkspaceAssetPanel } from './WorkspaceAssetPanel';
import {
  useActiveInstance,
  useProvisionInstance,
  useRunAssertions,
  useTerminateInstance,
} from '../hooks';
import type { AssertionResultDto, VpnRegion } from '../types';
import type { LessonDto, ModuleDto } from '@/features/curriculum/types';
import '../styles/labs.css';

export interface LabWorkspaceProps {
  lesson: LessonDto;
  module?: ModuleDto | null;
  prevLesson?: LessonDto | null;
  nextLesson?: LessonDto | null;
  onOpenOutline?: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  userXp?: number;
}

/**
 * DataCamp-style Fullscreen Lab Studio:
 * - Edge-to-edge fullscreen studio with zero nested card borders or double margins
 * - Automatic background provisioning on mount (entering lab means lab has started)
 * - Live terminal WebSocket connection with auto-reconnect
 * - DataCamp numbered instructions checklist with instant check assertions
 */
export function LabWorkspace({
  lesson,
  module: _module,
  prevLesson,
  nextLesson,
  onOpenOutline,
  onComplete,
  isCompleted = false,
  userXp = 120,
}: LabWorkspaceProps) {
  const navigate = useNavigate();
  const activeRegion: VpnRegion = 'US';
  const [activeTab, setActiveTab] = useState<'terminal' | 'slides' | 'walkthrough'>('terminal');
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorBotState, setMentorBotState] = useState<MentorOrbState>('rest');
  const [fabHovered, setFabHovered] = useState(false);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);
  const [assertions, setAssertions] = useState<AssertionResultDto['assertions']>([]);
  const [hasRunAssertions, setHasRunAssertions] = useState(false);
  const [expandedHintIndex, setExpandedHintIndex] = useState<number | null>(null);

  // Auto-reconnect to active instance on refresh
  const activeInstanceQuery = useActiveInstance();
  const instance = activeInstanceQuery.data ?? null;

  const provisionMutation = useProvisionInstance();
  const terminateMutation = useTerminateInstance();
  const assertionsMutation = useRunAssertions();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Handle Launch Lab
  const handleLaunch = () => {
    const targetLabId = lesson.lessonId > 0 ? lesson.lessonId : 1;
    provisionMutation.mutate(
      { labId: targetLabId, region: activeRegion },
      {
        onSuccess: (data) => {
          toast.success(`Lab allocated: ${data.hostname || 'sandbox pod'}`);
          void activeInstanceQuery.refetch();
        },
        onError: (err) => {
          toast.error(err.message ?? 'Failed to provision lab sandbox.');
        },
      },
    );
  };

  // Auto-start lab immediately on page entry if none active
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (
      !hasAutoStarted.current &&
      !activeInstanceQuery.isLoading &&
      !instance &&
      !provisionMutation.isPending &&
      !provisionMutation.isSuccess &&
      !provisionMutation.isError
    ) {
      hasAutoStarted.current = true;
      handleLaunch();
    }
  }, [
    activeInstanceQuery.isLoading,
    instance,
    provisionMutation.isPending,
    provisionMutation.isSuccess,
    provisionMutation.isError,
  ]);

  // Synthetic default assertions if none evaluated yet
  const defaultObjectives = useMemo(() => {
    return [
      {
        name: 'Environment provisioned & network accessible',
        passed: Boolean(instance && instance.status === 'running'),
        message: 'Ensure the ephemeral sandbox is provisioned and listening.',
        hint: 'Wait for the container to finish bootstrapping, then execute commands in the terminal.',
      },
      {
        name: 'Execute configuration and task remediation',
        passed: false,
        message: 'Inspect the cluster and apply required manifests.',
        hint: 'Use "kubectl get pods -A" to identify failed pods and fix them using manifests in /workspace/.',
      },
      {
        name: 'Verify service response & healthy container state',
        passed: false,
        message: 'Confirm HTTP 200 OK health response on the exposed port.',
        hint: 'Run "curl -s http://localhost:8080/health" or check endpoint status via "kubectl get svc".',
      },
    ];
  }, [instance]);

  const displayedAssertions = assertions.length > 0 ? assertions : defaultObjectives;
  const passedCount = displayedAssertions.filter((a) => a.passed).length;
  const allPassed = displayedAssertions.length > 0 && passedCount === displayedAssertions.length;

  // Handle Terminate Lab
  const handleTerminate = () => {
    if (!instance) {
      navigate(ROUTES.LEARN);
      return;
    }
    terminateMutation.mutate(instance.instanceId, {
      onSuccess: () => {
        toast.info('Lab session terminated.');
        setConfirmTerminate(false);
        navigate(ROUTES.LEARN);
      },
      onError: (err) => {
        toast.error(err.message ?? 'Failed to terminate lab session.');
        setConfirmTerminate(false);
      },
    });
  };

  // Handle Run Assertion Checks
  const handleRunChecks = () => {
    if (!instance) {
      toast.error('Sandbox is still bootstrapping. Please wait…');
      return;
    }
    assertionsMutation.mutate(instance.instanceId, {
      onSuccess: (result) => {
        setAssertions(result.assertions);
        setHasRunAssertions(true);
        if (result.allPassed) {
          toast.success('All objectives passed! +75 XP earned.');
          onComplete?.();
        } else {
          toast.info('Some checks are still pending. See instructions checklist on the left.');
        }
      },
      onError: (err) => {
        toast.error(err.message ?? 'Failed to evaluate assertions.');
      },
    });
  };

  const isProvisioning =
    provisionMutation.isPending || activeInstanceQuery.isLoading || instance?.status === 'pending';
  const isRunning = Boolean(instance && instance.status === 'running' && instance.terminalWsUrl);

  return (
    <div
      className="fixed inset-0 z-[var(--z-workspace)] flex flex-col h-dvh w-screen bg-background overflow-hidden select-none"
      data-testid="unified-lab-workspace"
    >
      {/* ─── Top Studio Header (DataCamp Fullscreen Standard) ───────────── */}
      <header className="relative h-12 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back / Exit Button & Lesson Title */}
        <div className="flex items-center gap-2.5 min-w-0 z-10 max-w-[28%] sm:max-w-[32%]">
          <button
            type="button"
            onClick={() => {
              if (isRunning) {
                setConfirmTerminate(true);
              } else {
                navigate(ROUTES.LEARN);
              }
            }}
            className="p-1.5 rounded-xs hover:bg-surface text-muted hover:text-card-foreground transition-colors cursor-pointer mr-0.5 shrink-0"
            title="Exit to Curriculum"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
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
              onClick={() =>
                prevLesson &&
                navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(prevLesson.lessonId)))
              }
              className="px-2.5 py-1.5 hover:bg-surface-hover text-muted hover:text-card-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.96]"
              title={prevLesson ? `Previous: ${prevLesson.title}` : 'No previous lesson'}
            >
              ←
            </button>
            <button
              type="button"
              onClick={onOpenOutline}
              className="px-3 py-1.5 hover:bg-surface-hover text-xs font-mono font-medium text-card-foreground flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              title="Open module outline"
            >
              <svg
                className="w-3.5 h-3.5 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Module Outline
            </button>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() =>
                nextLesson &&
                navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)))
              }
              className="px-2.5 py-1.5 hover:bg-surface-hover text-muted hover:text-card-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.96]"
              title={nextLesson ? `Next: ${nextLesson.title}` : 'No next lesson'}
            >
              →
            </button>
          </div>
        </div>

        {/* Right: Live Session Controls & XP */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10 ml-auto">
          {isRunning && instance ? (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-transparent text-[0.6875rem] font-mono">
              <span className="text-muted">TIME:</span>
              <LabTimerCountdown
                expiresAt={instance.expiresAt}
                onLowTime={() => toast.warning('Less than 5 minutes remaining in session!')}
              />
            </div>
          ) : isProvisioning ? (
            <div className="flex items-center gap-2 px-2 py-1 bg-transparent text-card-foreground text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping inline-block shrink-0" />
              <span>Bootstrapping Sandbox…</span>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleLaunch}
              isLoading={provisionMutation.isPending}
              className="h-7 text-xs px-2.5 font-mono"
            >
              Start Sandbox
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-transparent text-[0.6875rem] font-mono text-card-foreground">
            <span className="font-semibold">{userXp.toLocaleString()} XP</span>
          </div>
        </div>
      </header>

      {/* ─── Main Studio Area: Left Tasks, Right Live Terminal ─────────── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left Instructions & Objectives Panel (DataCamp Pattern) */}
        {!instructionsCollapsed && (
          <aside className="w-80 md:w-96 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto">
            {/* Panel Tab Header */}
            <div className="p-3.5 border-b border-border bg-paper/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-muted shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <h3 className="text-xs font-mono uppercase tracking-wider text-card-foreground font-semibold truncate">
                  Lab Scenario & Tasks
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-muted font-medium">75 XP</span>
                <button
                  type="button"
                  onClick={() => setInstructionsCollapsed(true)}
                  className="lab-guide-toggle"
                  data-tooltip="Collapse Guide"
                  aria-label="Collapse Guide"
                  aria-pressed={instructionsCollapsed}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-sm leading-relaxed text-card-foreground">
              {/* Context / Scenario description */}
              {lesson.content ? (
                <div className="space-y-3 prose prose-sm max-w-none text-xs text-muted">
                  {lesson.content
                    .split('\n\n')
                    .slice(0, 2)
                    .map((block, idx) => (
                      <p key={idx} className="whitespace-pre-line text-card-foreground/90">
                        {block}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Follow the numbered tasks below to configure and test the live container sandbox.
                </p>
              )}

              {/* DataCamp Numbered Instructions Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-mono uppercase font-bold text-card-foreground">
                    Tasks ({passedCount}/{displayedAssertions.length})
                  </span>
                  <span className="text-[0.625rem] font-mono text-muted">
                    {allPassed ? 'All objectives met' : 'Complete to earn XP'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {displayedAssertions.map((item, idx) => {
                    const isHintOpen = expandedHintIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xs border transition-all ${
                          item.passed
                            ? 'border-success/40 bg-success/10'
                            : 'border-border/80 bg-paper/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Number Badge (DataCamp circle) */}
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] font-bold ${
                              item.passed
                                ? 'bg-success text-pearl-100'
                                : 'bg-surface border border-border text-card-foreground'
                            }`}
                          >
                            {item.passed ? '✓' : idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-card-foreground">{item.name}</p>
                            {item.message && (
                              <p className="text-[0.6875rem] text-muted mt-0.5">{item.message}</p>
                            )}

                            {/* Hint button */}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedHintIndex(isHintOpen ? null : idx)}
                                className="text-[0.625rem] font-mono text-muted hover:text-card-foreground hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isHintOpen ? 'Hide Hint' : 'Take Hint (-5 XP)'}
                              </button>

                              {isHintOpen && (
                                <div className="mt-1.5 p-2 rounded-xs bg-paper border border-border text-[0.6875rem] font-mono text-muted">
                                  {/* @ts-expect-error synthetic hint prop */}
                                  {item.hint ??
                                    'Inspect running pods and verify configuration flags in /workspace/.'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Terminal Helper Commands */}
              <div className="border-t border-border pt-3 space-y-2">
                <span className="text-[0.625rem] font-mono uppercase tracking-wider text-muted font-bold block">
                  Helpful Commands
                </span>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-xs bg-paper border border-border">
                    <code>kubectl get pods -A</code>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-xs bg-paper border border-border">
                    <code>curl -s localhost:8080/health</code>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center/Right Live Terminal Area (Full Viewport) */}
        <main className="flex-1 bg-ink-deep flex flex-col relative min-h-0 overflow-hidden">
          {/* Terminal Tabs Bar */}
          <div className="h-10 border-b border-pearl-100/10 bg-ink-deep px-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0 justify-self-start">
              {instructionsCollapsed && (
                <button
                  type="button"
                  onClick={() => setInstructionsCollapsed(false)}
                  className="lab-guide-toggle lab-guide-toggle--dark"
                  data-tooltip="Expand Guide"
                  data-tooltip-align="left"
                  aria-label="Expand Guide"
                  aria-pressed={instructionsCollapsed}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <polyline points="14 9 17 12 14 15" />
                  </svg>
                </button>
              )}

              <div
                className="inline-flex items-center rounded-xs bg-ink-deep/40 border border-pearl-100/10 p-0.5 text-xs font-mono"
                role="tablist"
                aria-label="Lab workspace panels"
              >
                {(
                  [
                    { id: 'terminal', label: 'Terminal' },
                    { id: 'slides', label: 'Slides' },
                    { id: 'walkthrough', label: 'Walkthrough' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-0.5 rounded-xs transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-pearl-100 focus-visible:outline-offset-2 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeTab === tab.id
                        ? 'bg-pearl-100/20 text-pearl-100 font-semibold hover:bg-pearl-100 hover:text-ink-deep hover:font-bold hover:brightness-110'
                        : 'text-pearl-100/60 hover:text-pearl-100 hover:bg-pearl-100/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Segmented Progress Dots centered in terminal bar */}
            <div className="hidden md:flex items-center justify-center gap-2 justify-self-center">
              <div className="flex items-center gap-1.5">
                {displayedAssertions.map((item, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      item.passed ? 'bg-check-success w-8' : 'bg-pearl-100/20 w-6'
                    }`}
                    title={`Objective ${i + 1}: ${item.name} (${item.passed ? 'Passed' : 'Pending'})`}
                  />
                ))}
              </div>
              <span className="text-[0.6875rem] font-mono text-pearl-100/70">
                {passedCount}/{displayedAssertions.length}
              </span>
            </div>

            {/* Right: Run Checks (tertiary) / Next Lesson Action */}
            <div className="flex items-center gap-2 shrink-0 justify-self-end">
              {allPassed || isCompleted ? (
                nextLesson ? (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() =>
                      navigate(
                        ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)),
                      )
                    }
                    className="lab-run-checks-btn h-7 text-xs font-mono px-3"
                  >
                    Next Lesson →
                  </Button>
                ) : (
                  <span className="text-xs font-mono font-semibold text-check-success">
                    Objectives Met
                  </span>
                )
              ) : (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={handleRunChecks}
                  disabled={!isRunning || assertionsMutation.isPending}
                  className={`lab-run-checks-btn h-7 text-xs font-mono px-3 ${
                    assertionsMutation.isPending ? 'lab-run-checks-btn--checking' : ''
                  }`}
                >
                  {assertionsMutation.isPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="lab-run-checks-pulse" aria-hidden="true" />
                      <span>Checking…</span>
                    </span>
                  ) : hasRunAssertions ? (
                    'Re-run Checks'
                  ) : (
                    'Run Checks'
                  )}
                </Button>
              )}
            </div>
          </div>

          {activeTab === 'slides' ? (
            <WorkspaceAssetPanel kind="slides" slug={lesson.slug} lessonTitle={lesson.title} />
          ) : activeTab === 'walkthrough' ? (
            <WorkspaceAssetPanel
              kind="walkthroughs"
              slug={lesson.slug}
              lessonTitle={lesson.title}
            />
          ) : isRunning && instance ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              <TerminalIframe
                terminalWsUrl={instance.terminalWsUrl!}
                title={`${lesson.title} Terminal`}
              />
            </div>
          ) : isProvisioning ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-ink-deep text-pearl-100 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-pearl-100/20 border-t-pearl-100 animate-spin" />
              <div className="space-y-1.5 text-center max-w-md">
                <h3 className="text-base font-mono font-bold text-pearl-100 tracking-tight">
                  Bootstrapping Lab Environment…
                </h3>
                <p className="text-xs font-mono text-pearl-100/60 leading-relaxed">
                  Allocating dedicated container namespace, mounting volumes, and bridging xterm
                  stream.
                </p>
              </div>
              <div className="w-48 h-1 rounded-full bg-pearl-100/10 overflow-hidden">
                <div className="h-full bg-signal animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          ) : provisionMutation.isError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-ink-deep text-pearl-100 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 border border-error/30 flex items-center justify-center text-error">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-mono font-bold text-pearl-100">
                  Sandbox Allocation Failed
                </h3>
                <p className="text-xs font-mono text-pearl-100/60">
                  {provisionMutation.error?.message ?? 'Could not allocate container namespace.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleLaunch}
                className="h-8 font-mono text-xs px-4"
              >
                Retry Launch
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-ink-deep text-pearl-100 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-pearl-100/20 border-t-pearl-100 animate-spin" />
              <p className="font-mono text-xs text-pearl-100/60">Initializing sandbox session…</p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Isometric Icon-Only AI Mentor Trigger */}
      <button
        type="button"
        onClick={() => setMentorOpen((v) => !v)}
        onMouseEnter={() => setFabHovered(true)}
        onMouseLeave={() => setFabHovered(false)}
        className="lab-mentor-fab"
        data-tooltip="AI Mentor"
        aria-label="AI Mentor"
        aria-expanded={mentorOpen}
        aria-pressed={mentorOpen}
      >
        <MentorOrb
          state={mentorOpen ? mentorBotState : fabHovered ? 'doodling' : mentorBotState}
          size="md"
        />
      </button>

      {/* Floating AI Mentor Chat Modal (originating from FAB) */}
      {mentorOpen && (
        <AiMentorModal
          lessonId={lesson.lessonId}
          labId={instance?.labId ?? lesson.lessonId}
          onClose={() => {
            setMentorOpen(false);
            setMentorBotState('rest');
          }}
          onBotStateChange={setMentorBotState}
        />
      )}

      {/* Confirm Terminate Modal */}
      <ConfirmDialog
        open={confirmTerminate}
        title="Exit and terminate sandbox session?"
        message="All active terminal state will be cleared. You can resume anytime."
        confirmLabel="Exit Sandbox"
        onCancel={() => setConfirmTerminate(false)}
        onConfirm={handleTerminate}
      />
    </div>
  );
}

export default LabWorkspace;
