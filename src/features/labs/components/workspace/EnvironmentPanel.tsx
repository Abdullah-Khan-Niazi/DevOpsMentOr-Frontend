import type { ReactNode } from 'react';
import { Button, EmptyState, ErrorState, Skeleton } from '@/shared/components';
import { safeHttpUrl } from '@/shared/utils';
import type { ActiveInstanceDto } from '@/features/labs/types';
import { TerminalFrame } from './TerminalFrame';

export type EnvironmentPanelState =
  'none' | 'pending' | 'running' | 'reconnecting' | 'stopped' | 'error' | 'timeout';

export interface EnvironmentPanelProps {
  state: EnvironmentPanelState;
  /** Active lab environment of the learner, when there is one. */
  instance: ActiveInstanceDto | null;
  /** Failure from provisioning or polling; shown by the error state. */
  error: unknown | null;
  onStart: () => void;
  onRestart: () => void;
  onRetry: () => void;
  /** Disables and marks the start and restart buttons while provisioning is in flight. */
  startPending: boolean;
  /** Another lab's environment is active; starting this one requires ending it first. */
  otherActive: { labName: string } | null;
  onEndOther: () => void;
  /** Changing this remounts the terminal frame (toolbar reconnect). */
  reloadKey?: number;
  /** Toolbar rendered above the environment content. */
  children?: ReactNode;
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 items-center justify-center">{children}</div>;
}

function EnvironmentSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Starting lab environment"
      className="flex min-h-0 flex-1 flex-col gap-3 p-4"
    >
      <Skeleton className="min-h-0 flex-1 rounded-md" />
      <p className="text-sm text-muted-foreground">Starting lab environment</p>
    </div>
  );
}

/**
 * Right pane terminal states for the learner's lab environment. Fills its parent
 * (flex 1, min-height 0) and stays presentational: the page owns the hooks.
 */
export function EnvironmentPanel({
  state,
  instance,
  error,
  onStart,
  onRestart,
  onRetry,
  startPending,
  otherActive,
  onEndOther,
  reloadKey = 0,
  children,
}: EnvironmentPanelProps) {
  const terminalUrl = safeHttpUrl(instance?.terminalWsUrl);

  let content: ReactNode;

  if (state === 'none') {
    content = otherActive ? (
      <Centered>
        <EmptyState
          icon="terminal"
          title={`End ${otherActive.labName} to start this lab`}
          action={
            <Button variant="secondary" iconName="stop" onClick={onEndOther}>
              End other lab environment
            </Button>
          }
        />
      </Centered>
    ) : (
      <Centered>
        <EmptyState
          icon="terminal"
          title="No lab environment running"
          action={
            <Button iconName="play" isLoading={startPending} onClick={onStart}>
              Start lab environment
            </Button>
          }
        />
      </Centered>
    );
  } else if (state === 'pending') {
    content = <EnvironmentSkeleton />;
  } else if (state === 'running' && terminalUrl) {
    content = <TerminalFrame url={terminalUrl} reloadKey={reloadKey} />;
  } else if (state === 'running' || state === 'reconnecting') {
    content = (
      <Centered>
        <EmptyState
          icon="refresh"
          title="Reconnecting"
          action={
            <Button variant="secondary" iconName="refresh" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </Centered>
    );
  } else if (state === 'stopped') {
    content = (
      <Centered>
        <EmptyState
          icon="stop"
          title="Lab environment stopped"
          action={
            <Button iconName="restart" isLoading={startPending} onClick={onRestart}>
              Restart lab environment
            </Button>
          }
        />
      </Centered>
    );
  } else if (state === 'timeout') {
    content = (
      <Centered>
        <ErrorState title="Lab environment timed out" onRetry={onRetry} />
      </Centered>
    );
  } else {
    content = (
      <Centered>
        <ErrorState
          title="Lab environment unavailable"
          error={error ?? undefined}
          onRetry={onRetry}
        />
      </Centered>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {children}
      <div className="flex min-h-0 flex-1 flex-col">{content}</div>
    </div>
  );
}

export default EnvironmentPanel;
