import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { TerminalIframe } from './TerminalIframe';
import { LabTimerCountdown } from './LabTimerCountdown';
import { AiMentorDrawer } from './AiMentorDrawer';
import {
  useActiveInstance,
  useExtendInstance,
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
  const [activeTab, setActiveTab] = useState<'terminal' | 'docs'>('terminal');
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);
  const [assertions, setAssertions] = useState<AssertionResultDto['assertions']>([]);
  const [hasRunAssertions, setHasRunAssertions] = useState(false);
  const [expandedHintIndex, setExpandedHintIndex] = useState<number | null>(null);

  // Auto-reconnect to active instance on refresh
  const activeInstanceQuery = useActiveInstance();
  const instance = activeInstanceQuery.data ?? null;

  const provisionMutation = useProvisionInstance();
  const terminateMutation = useTerminateInstance();
  const extendMutation = useExtendInstance();
  const assertionsMutation = useRunAssertions();

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
  }, [activeInstanceQuery.isLoading, instance, provisionMutation.isPending, provisionMutation.isSuccess, provisionMutation.isError]);

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

  // Handle Extend Time
  const handleExtend = () => {
    if (!instance) return;
    extendMutation.mutate(instance.instanceId, {
      onSuccess: (res) => {
        toast.success(`Session extended. Remaining: ${res.extensionsRemaining}`);
        void activeInstanceQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message ?? 'Could not extend session.');
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

  const isProvisioning = provisionMutation.isPending || activeInstanceQuery.isLoading || instance?.status === 'pending';
  const isRunning = Boolean(instance && instance.status === 'running' && instance.terminalWsUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-background overflow-hidden select-none"
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
              <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Module Outline
            </button>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)))}
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
            <>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-paper border border-border text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="text-muted">TIME:</span>
                <LabTimerCountdown
                  expiresAt={instance.expiresAt}
                  onLowTime={() => toast.warning('Less than 5 minutes remaining in session!')}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExtend}
                isLoading={extendMutation.isPending}
                className="h-7 text-xs px-2"
                title="Add 30 minutes to session"
              >
                +30m
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmTerminate(true)}
                isLoading={terminateMutation.isPending}
                className="h-7 text-xs px-2"
                title="Terminate active sandbox"
              >
                Exit
              </Button>
            </>
          ) : isProvisioning ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-paper border border-border text-card-foreground text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMentorOpen((v) => !v)}
            className="h-7 text-xs px-2.5 font-mono font-semibold"
            title="Ask AI Mentor for hints"
          >
            AI Mentor
          </Button>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xs bg-paper border border-border text-[11px] font-mono text-card-foreground">
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
            <div className="p-3.5 border-b border-border bg-paper/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <h3 className="text-xs font-mono uppercase tracking-wider text-card-foreground font-semibold">
                  Lab Scenario & Tasks
                </h3>
              </div>
              <span className="text-xs font-mono text-muted font-medium">
                75 XP
              </span>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-sm leading-relaxed text-card-foreground">
              {/* Context / Scenario description */}
              {lesson.content ? (
                <div className="space-y-3 prose prose-sm dark:prose-invert max-w-none text-xs text-muted">
                  {lesson.content.split('\n\n').slice(0, 2).map((block, idx) => (
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
                  <span className="text-[10px] font-mono text-muted">
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
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-border/80 bg-paper/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Number Badge (DataCamp circle) */}
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                              item.passed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-surface border border-border text-card-foreground'
                            }`}
                          >
                            {item.passed ? '✓' : idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-card-foreground">
                              {item.name}
                            </p>
                            {item.message && (
                              <p className="text-[11px] text-muted mt-0.5">
                                {item.message}
                              </p>
                            )}

                            {/* Hint button */}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedHintIndex(isHintOpen ? null : idx)}
                                className="text-[10px] font-mono text-muted hover:text-card-foreground hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isHintOpen ? 'Hide Hint' : 'Take Hint (-5 XP)'}
                              </button>

                              {isHintOpen && (
                                <div className="mt-1.5 p-2 rounded-xs bg-paper border border-border text-[11px] font-mono text-muted">
                                  {/* @ts-expect-error synthetic hint prop */}
                                  {item.hint ?? 'Inspect running pods and verify configuration flags in /workspace/.'}
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
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
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
        <main className="flex-1 bg-[#14140F] flex flex-col relative min-h-0 overflow-hidden">
          {/* Terminal Tabs Bar */}
          <div className="h-9 border-b border-white/10 bg-[#1A1A14] px-3 flex items-center justify-between shrink-0">
            <div className="inline-flex items-center rounded-xs bg-black/40 border border-white/10 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-0.5 rounded-xs transition-colors cursor-pointer ${
                  activeTab === 'terminal'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Terminal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-0.5 rounded-xs transition-colors cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Architecture & Docs
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-white/40">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
              <span>{isRunning ? 'Connected · Live Shell' : 'Interactive Sandbox'}</span>
            </div>
          </div>

          {activeTab === 'docs' ? (
            <div className="flex-1 p-6 text-white overflow-y-auto space-y-4 font-sans text-xs max-w-3xl">
              <h2 className="text-base font-bold text-white font-mono">
                System Topology & Target State
              </h2>
              <p className="text-white/80 leading-relaxed">
                This lab instance operates inside an isolated container namespace. The ingress port forwards traffic directly from your terminal session to port 30080 on the internal bridge.
              </p>
              <div className="p-4 rounded-xs border border-white/10 bg-white/5 font-mono space-y-2 text-white/90">
                <p className="text-emerald-400 font-bold">Cluster Network Spec:</p>
                <p>• Internal CIDR: 10.244.0.0/16</p>
                <p>• Health Probe Endpoint: GET /health</p>
                <p>• Target Deployment: devops-core-app</p>
              </div>
            </div>
          ) : isRunning && instance ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              <TerminalIframe
                terminalWsUrl={instance.terminalWsUrl!}
                title={`${lesson.title} Terminal`}
              />
            </div>
          ) : isProvisioning ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D1117] text-white space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="space-y-1.5 text-center max-w-md">
                <h3 className="text-base font-mono font-bold text-white tracking-tight">
                  Bootstrapping Lab Environment…
                </h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">
                  Allocating dedicated container namespace, mounting volumes, and bridging xterm stream.
                </p>
              </div>
              <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          ) : provisionMutation.isError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D1117] text-white space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-mono font-bold text-white">
                  Sandbox Allocation Failed
                </h3>
                <p className="text-xs font-mono text-white/60">
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D1117] text-white space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <p className="font-mono text-xs text-white/60">
                Initializing sandbox session…
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ─── Bottom Studio Evaluation Bar (DataCamp Standard) ───────────── */}
      <footer className="h-12 border-t border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Hide Guide Toggle */}
        <button
          type="button"
          onClick={() => setInstructionsCollapsed((c) => !c)}
          className="px-2.5 py-1 rounded-xs border border-border bg-paper hover:bg-surface-hover text-xs font-mono text-card-foreground transition-all cursor-pointer font-medium flex items-center gap-1.5 active:scale-[0.98]"
        >
          <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          {instructionsCollapsed ? 'Show Guide' : 'Hide Guide'}
        </button>

        {/* Center: Segmented Progress Dots for Assertions */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {displayedAssertions.map((item, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  item.passed
                    ? 'bg-emerald-500 w-10'
                    : 'bg-border/80 w-8'
                }`}
                title={`Objective ${i + 1}: ${item.name} (${item.passed ? 'Passed' : 'Pending'})`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-muted ml-1.5">
            Checks ({passedCount}/{displayedAssertions.length} Passed)
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {allPassed || isCompleted ? (
            nextLesson ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(nextLesson.lessonId)))}
                className="font-mono text-xs shadow-xs active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700"
              >
                Continue to Next Lesson →
              </Button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                ✓ Objectives Met
              </div>
            )
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunChecks}
              isLoading={assertionsMutation.isPending}
              disabled={!isRunning || assertionsMutation.isPending}
              className="h-8 text-xs font-mono active:scale-[0.98] transition-all"
            >
              {hasRunAssertions ? 'Re-run Checks' : 'Run Checks'}
            </Button>
          )}
        </div>
      </footer>

      {/* AI Mentor Drawer */}
      {mentorOpen && (
        <AiMentorDrawer
          lessonId={lesson.lessonId}
          labId={instance?.labId ?? lesson.lessonId}
          onClose={() => setMentorOpen(false)}
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
