import { useState } from 'react';
import type { LearnerLabStepDto } from '@/features/labs/types';
import { Button, Icon, Skeleton, TabSwitcher, type TabSwitcherItem } from '@/shared/components';
import { cn } from '@/shared/utils';
import { useSlides, useWalkthrough } from '../../hooks/useLabSteps';
import type { useLabEnvironment } from '../../hooks/useLabEnvironment';
import { EnvironmentPanel, type EnvironmentPanelState } from './EnvironmentPanel';
import { EnvironmentToolbar } from './EnvironmentToolbar';
import { SlidesPanel } from './SlidesPanel';
import { WalkthroughPanel } from './WalkthroughPanel';

type EnvironmentTab = 'terminal' | 'slides' | 'walkthrough';

const TABS: ReadonlyArray<TabSwitcherItem<EnvironmentTab>> = [
  { id: 'terminal', label: 'Terminal', icon: 'terminal' },
  { id: 'slides', label: 'Slides', icon: 'slides' },
  { id: 'walkthrough', label: 'Walkthrough', icon: 'walkthrough' },
];

export interface EnvironmentPaneProps {
  labId: number;
  itemId?: number | null;
  env: ReturnType<typeof useLabEnvironment>;
  panelState: EnvironmentPanelState;
  expired: boolean;
  steps?: LearnerLabStepDto[];
  currentStepId?: string | null;
  shownStepId?: string | null;
  shownStep?: LearnerLabStepDto | null;
  completed?: boolean;
  hasRunCheck?: boolean;
  checkPending?: boolean;
  canRunCheck?: boolean;
  guideCollapsed?: boolean;
  nextItem?: { label: string; to: string } | null;
  onExpandGuide?: () => void;
  onSelectStep?: (stepId: string) => void;
  onRunCheck?: () => void;
  onNavigate?: (to: string) => void;
  onStart: () => void;
  onRestart: () => void;
  onRetry: () => void;
  onOpenConflict: () => void;
  showInlineToolbar?: boolean;
}

/**
 * Right studio pane: dark DataCamp control bar (Expand Guide, Terminal/Slides/Walkthrough tabs,
 * segmented objective pills, Run Checks / Next Lesson) above persistent visibility-toggled layers.
 * Switching tabs preserves terminal buffers, slide reader state, and walkthrough scroll.
 */
export function EnvironmentPane({
  labId,
  env,
  panelState,
  expired,
  steps = [],
  currentStepId = null,
  shownStepId = null,
  shownStep = null,
  completed = false,
  hasRunCheck = false,
  checkPending = false,
  canRunCheck = false,
  guideCollapsed = false,
  nextItem = null,
  onExpandGuide,
  onSelectStep,
  onRunCheck,
  onNavigate,
  onStart,
  onRestart,
  onRetry,
  onOpenConflict,
  showInlineToolbar = false,
}: EnvironmentPaneProps) {
  const [tab, setTab] = useState<EnvironmentTab>('terminal');

  // Keep Slides and Walkthrough mounted once first opened so switching tabs never resets state.
  const [slidesOpened, setSlidesOpened] = useState(false);
  if (tab === 'slides' && !slidesOpened) setSlidesOpened(true);
  const [walkthroughOpened, setWalkthroughOpened] = useState(false);
  if (tab === 'walkthrough' && !walkthroughOpened) setWalkthroughOpened(true);

  const slides = useSlides(labId, slidesOpened);
  const walkthrough = useWalkthrough(labId, walkthroughOpened);

  const instance = env.instance;
  const showToolbar =
    showInlineToolbar &&
    instance !== null &&
    !expired &&
    (instance.status === 'pending' || instance.status === 'running');

  const passedCount = steps.filter((step) => step.status === 'passed').length;
  const allPassed = steps.length > 0 && passedCount === steps.length;
  const showTaskCheck = !completed && shownStep?.kind === 'task' && onRunCheck !== undefined;

  const terminalLayer = env.isLoading ? (
    <div
      role="status"
      aria-label="Loading lab environment"
      className="flex min-h-0 flex-1 flex-col gap-3 bg-ink-deep p-4 text-pearl-100"
    >
      <Skeleton className="min-h-0 flex-1 rounded-md opacity-20" />
      <p className="m-0 font-mono text-xs text-pearl-200">Checking lab environment…</p>
    </div>
  ) : (
    <EnvironmentPanel
      state={panelState}
      instance={expired ? null : instance}
      error={env.error ?? env.activeError ?? null}
      onStart={onStart}
      onRestart={onRestart}
      onRetry={onRetry}
      startPending={env.isStarting}
      otherActive={env.otherInstance ? { labName: env.otherInstance.labName } : null}
      onEndOther={onOpenConflict}
      reloadKey={env.reconnectKey}
    >
      {showToolbar && instance !== null ? (
        <EnvironmentToolbar
          expiresAt={instance.expiresAt}
          onExtend={() => env.extend(instance.instanceId)}
          onReconnect={env.reconnect}
          onEnd={() => env.end(instance.instanceId)}
          extendPending={env.isExtending}
          endPending={env.isEnding}
        />
      ) : null}
    </EnvironmentPanel>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-ink-deep">
      {/* Dark DataCamp Studio Toolbar */}
      <div className="grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 bg-ink-deep px-3">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          {guideCollapsed && onExpandGuide ? (
            <button
              type="button"
              onClick={onExpandGuide}
              className="lab-guide-toggle lab-guide-toggle--dark"
              data-tooltip="Expand Guide"
              data-tooltip-align="left"
              aria-label="Expand Guide"
              aria-pressed={guideCollapsed}
            >
              <Icon name="panel-open" size={18} />
            </button>
          ) : null}

          <TabSwitcher
            items={TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Environment views"
            className="tab-switcher--dark"
          />
        </div>

        {/* Center: Segmented Step Pills */}
        {steps.length > 0 ? (
          <div className="hidden items-center justify-center justify-self-center md:flex">
            <div className="flex items-center gap-1.5" role="group" aria-label="Lab steps">
              {steps.map((step) => {
                const locked = step.status === 'locked';
                const passed = step.status === 'passed';
                const active = step.stepId === (shownStepId ?? currentStepId);
                return (
                  <button
                    key={step.stepId}
                    type="button"
                    disabled={locked}
                    onClick={() => onSelectStep?.(step.stepId)}
                    title={`Step ${step.position}: ${step.title} (${step.status})`}
                    aria-label={`Step ${step.position}: ${step.title}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-(--duration-fast)',
                      locked ? 'cursor-not-allowed' : 'cursor-pointer',
                      passed
                        ? 'w-8 bg-check-success'
                        : active
                          ? 'w-8 bg-pearl-100'
                          : 'w-6 bg-pearl-100/20',
                    )}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Right: Run Checks / Next Lesson Action */}
        <div className="flex shrink-0 items-center gap-2 justify-self-end">
          {allPassed || completed ? (
            nextItem && onNavigate ? (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => onNavigate(nextItem.to)}
                className="lab-run-checks-btn h-7 px-3 font-mono text-xs"
              >
                {`${nextItem.label} →`}
              </Button>
            ) : (
              <span className="font-mono text-xs font-semibold text-check-success">
                Objectives Met
              </span>
            )
          ) : showTaskCheck ? (
            <Button
              variant="tertiary"
              size="sm"
              onClick={onRunCheck}
              disabled={!canRunCheck || checkPending}
              className={cn(
                'lab-run-checks-btn h-7 px-3 font-mono text-xs',
                checkPending && 'lab-run-checks-btn--checking',
              )}
            >
              {checkPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="lab-run-checks-pulse" aria-hidden="true" />
                  <span>Checking…</span>
                </span>
              ) : shownStep?.status === 'passed' ? (
                'Check again'
              ) : hasRunCheck ? (
                'Re-run Checks'
              ) : (
                'Run Checks'
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Persistent Layered Panels */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          aria-hidden={tab !== 'terminal'}
          className={cn(
            'absolute inset-0 flex min-h-0 flex-col transition-opacity duration-(--duration-fast) ease-(--ease-apple-out)',
            tab === 'terminal'
              ? 'visible z-10 opacity-100 pointer-events-auto'
              : 'invisible z-0 opacity-0 pointer-events-none',
          )}
        >
          {terminalLayer}
        </div>

        {slidesOpened ? (
          <div
            aria-hidden={tab !== 'slides'}
            className={cn(
              'absolute inset-0 flex min-h-0 flex-col transition-opacity duration-(--duration-fast) ease-(--ease-apple-out)',
              tab === 'slides'
                ? 'visible z-10 opacity-100 pointer-events-auto'
                : 'invisible z-0 opacity-0 pointer-events-none',
            )}
          >
            <SlidesPanel
              url={slides.data?.url ?? null}
              active={tab === 'slides'}
              loading={slides.isLoading || (slides.isFetching && !slides.data)}
              error={slides.error}
              onRetry={() => void slides.refetch()}
            />
          </div>
        ) : null}

        {walkthroughOpened ? (
          <div
            aria-hidden={tab !== 'walkthrough'}
            className={cn(
              'absolute inset-0 flex min-h-0 flex-col transition-opacity duration-(--duration-fast) ease-(--ease-apple-out)',
              tab === 'walkthrough'
                ? 'visible z-10 opacity-100 pointer-events-auto'
                : 'invisible z-0 opacity-0 pointer-events-none',
            )}
          >
            <WalkthroughPanel
              markdown={walkthrough.data?.markdown ?? null}
              loading={walkthrough.isLoading}
              error={walkthrough.error}
              onRetry={() => void walkthrough.refetch()}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default EnvironmentPane;
