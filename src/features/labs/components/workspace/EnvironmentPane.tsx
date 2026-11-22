import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Skeleton, TabSwitcher, type TabSwitcherItem } from '@/shared/components';
import { useSlides, useWalkthrough } from '../../hooks/useLabSteps';
import { useLabEnvironment } from '../../hooks/useLabEnvironment';
import { EnvironmentConflictDialog } from './EnvironmentConflictDialog';
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
  /** Module item id from `?itemId=` (slides are resolved from the lab's course). */
  itemId?: number | null;
}

/**
 * Right pane of the lab workspace: the lab environment terminal, the module slides and the
 * lab walkthrough. The terminal never starts on mount; starting is an explicit action.
 */
export function EnvironmentPane({ labId }: EnvironmentPaneProps) {
  const [tab, setTab] = useState<EnvironmentTab>('terminal');
  const [conflictOpen, setConflictOpen] = useState(false);
  // Expiry deadline (ISO) that has passed; the instance then reads as stopped.
  const [elapsedFor, setElapsedFor] = useState<string | null>(null);
  // Instance being ended by Restart; a new environment starts once that one is gone.
  const restartOfRef = useRef<number | null>(null);

  const env = useLabEnvironment(labId);
  // Slides stay mounted once opened so the reader keeps their page across tab switches.
  const [slidesOpened, setSlidesOpened] = useState(false);
  if (tab === 'slides' && !slidesOpened) setSlidesOpened(true);
  const slides = useSlides(labId, tab === 'slides');
  const walkthrough = useWalkthrough(labId, tab === 'walkthrough');

  const instance = env.instance;
  const expiresAt = instance?.expiresAt ?? null;
  const expired = expiresAt !== null && elapsedFor === expiresAt;
  const refetchActive = env.refetch;
  const endError = env.endError;
  const isEnding = env.isEnding;
  const start = env.start;

  // The environment expires at the server deadline; refresh then so the state reads stopped.
  useEffect(() => {
    if (expiresAt === null) return undefined;
    const id = window.setTimeout(
      () => {
        setElapsedFor(expiresAt);
        void refetchActive();
      },
      Math.max(0, Date.parse(expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [expiresAt, refetchActive]);

  // Restart: once the stopped environment is gone, start a new one. A failed end cancels it.
  useEffect(() => {
    if (restartOfRef.current === null || isEnding) return;
    if (instance === null) {
      restartOfRef.current = null;
      start();
    }
  }, [instance, isEnding, start]);

  useEffect(() => {
    if (endError) restartOfRef.current = null;
  }, [endError]);

  // A start refused because another lab is running opens the conflict dialog.
  const conflictDialogOpen = conflictOpen || env.startResult?.kind === 'conflict';

  function closeConflict() {
    setConflictOpen(false);
    env.dismissConflict();
  }

  function handleStart() {
    if (env.conflict) {
      setConflictOpen(true);
      return;
    }
    env.start();
  }

  function restart() {
    if (instance === null) return;
    restartOfRef.current = instance.instanceId;
    env.end(instance.instanceId);
  }

  function retryEnvironment() {
    if (env.timedOut) {
      env.retryWait();
      return;
    }
    if (instance === null) {
      env.start();
      return;
    }
    env.reconnect();
    void env.refetch();
  }

  let panelState: EnvironmentPanelState;
  if (instance !== null) {
    if (expired) panelState = 'stopped';
    else if (instance.status === 'pending') panelState = env.timedOut ? 'timeout' : 'pending';
    else if (instance.status === 'running')
      panelState = instance.terminalWsUrl ? 'running' : 'reconnecting';
    else if (instance.status === 'error') panelState = 'error';
    else panelState = 'stopped';
  } else if (env.error !== null || env.activeError) {
    panelState = 'error';
  } else if (env.isStarting) {
    panelState = 'pending';
  } else {
    panelState = 'none';
  }

  const showToolbar =
    instance !== null &&
    !expired &&
    (instance.status === 'pending' || instance.status === 'running');

  const terminal = env.isLoading ? (
    <div
      role="status"
      aria-label="Loading lab environment"
      className="flex min-h-0 flex-1 flex-col p-4"
    >
      <Skeleton className="min-h-0 flex-1 rounded-md" />
    </div>
  ) : (
    <EnvironmentPanel
      state={panelState}
      instance={expired ? null : instance}
      error={env.error ?? env.activeError ?? null}
      onStart={handleStart}
      onRestart={restart}
      onRetry={retryEnvironment}
      startPending={env.isStarting}
      otherActive={env.otherInstance ? { labName: env.otherInstance.labName } : null}
      onEndOther={() => setConflictOpen(true)}
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

  let content: ReactNode = null;
  if (tab === 'terminal') {
    content = terminal;
  } else if (tab === 'walkthrough') {
    content = (
      <WalkthroughPanel
        markdown={walkthrough.data?.markdown ?? null}
        loading={walkthrough.isLoading}
        error={walkthrough.error}
        onRetry={() => void walkthrough.refetch()}
      />
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 pb-3">
        <TabSwitcher items={TABS} value={tab} onChange={setTab} ariaLabel="Environment views" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {content}
        {slidesOpened ? (
          <div className={tab === 'slides' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
            <SlidesPanel
              url={slides.data?.url ?? null}
              active={tab === 'slides'}
              loading={slides.isLoading || (slides.isFetching && !slides.data)}
              error={slides.error}
              onRetry={() => void slides.refetch()}
            />
          </div>
        ) : null}
      </div>

      <EnvironmentConflictDialog
        open={conflictDialogOpen}
        otherLabName={env.otherInstance?.labName ?? 'Another lab'}
        onConfirm={() => env.replaceConflict()}
        onClose={closeConflict}
      />
    </div>
  );
}

export default EnvironmentPane;
