import type { ReactNode } from 'react';
import { Button, Icon } from '@/shared/components';
import { getErrorMessage } from '@/shared/services';
import { safeHttpUrl } from '@/shared/utils';
import type { ActiveInstanceDto } from '@/features/labs/types';
import { TerminalFrame } from './TerminalFrame';

export type EnvironmentPanelState =
  'none' | 'pending' | 'running' | 'reconnecting' | 'stopped' | 'error' | 'timeout';

export interface EnvironmentPanelProps {
  state: EnvironmentPanelState;
  instance: ActiveInstanceDto | null;
  error: unknown | null;
  onStart: () => void;
  onRestart: () => void;
  onRetry: () => void;
  startPending: boolean;
  otherActive: { labName: string } | null;
  onEndOther: () => void;
  reloadKey?: number;
  children?: ReactNode;
}

function DarkState({
  icon,
  title,
  message,
  action,
}: {
  icon: 'terminal' | 'refresh' | 'stop' | 'error';
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-ink-deep p-8 text-center text-pearl-100">
      <div className="flex size-12 items-center justify-center rounded-full bg-pearl-100/10 text-pearl-100">
        <Icon name={icon} size={22} />
      </div>
      <div className="flex max-w-md flex-col gap-1">
        <h3 className="m-0 font-mono text-sm font-bold tracking-tight text-pearl-100">{title}</h3>
        {message ? (
          <p className="m-0 font-mono text-xs leading-relaxed text-pearl-200">{message}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Right-pane terminal viewport for the learner's lab environment. Renders on the deep-ink
 * terminal canvas across all states so bootstrapping, live ttyd stream, and restart transitions
 * match the DataCamp-style dark studio frame cleanly without flash or nested scrollbars.
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
      <DarkState
        icon="terminal"
        title={`End ${otherActive.labName} to start this lab`}
        message="Only one active sandbox session can run at a time."
        action={
          <Button variant="secondary" size="sm" iconName="stop" onClick={onEndOther}>
            End other lab environment
          </Button>
        }
      />
    ) : (
      <DarkState
        icon="terminal"
        title="No lab environment running"
        action={
          <Button
            variant="secondary"
            size="sm"
            iconName="play"
            isLoading={startPending}
            loadingLabel="Starting sandbox…"
            onClick={onStart}
          >
            Start Sandbox
          </Button>
        }
      />
    );
  } else if (state === 'pending') {
    content = (
      <div
        role="status"
        aria-live="polite"
        aria-label="Bootstrapping lab environment"
        className="flex flex-1 flex-col items-center justify-center gap-4 bg-ink-deep p-8 text-center text-pearl-100"
      >
        <span className="spin-ring size-11 text-pearl-100" aria-hidden="true" />
        <div className="flex max-w-md flex-col gap-1.5">
          <h3 className="m-0 font-mono text-base font-bold tracking-tight text-pearl-100">
            Bootstrapping Lab Environment…
          </h3>
          <p className="m-0 font-mono text-xs leading-relaxed text-pearl-200">
            Allocating dedicated container namespace and connecting terminal stream.
          </p>
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-pearl-100/15" aria-hidden="true">
          <div className="lab-bootstrap-bar__fill h-full rounded-full bg-signal" />
        </div>
      </div>
    );
  } else if (state === 'running' && terminalUrl) {
    content = <TerminalFrame url={terminalUrl} reloadKey={reloadKey} />;
  } else if (state === 'running' || state === 'reconnecting') {
    content = (
      <DarkState
        icon="refresh"
        title="Reconnecting terminal…"
        action={
          <Button variant="secondary" size="sm" iconName="refresh" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  } else if (state === 'stopped') {
    content = (
      <DarkState
        icon="stop"
        title="Sandbox session stopped"
        message="Relaunch the sandbox whenever you are ready to continue."
        action={
          <Button
            variant="secondary"
            size="sm"
            iconName="restart"
            isLoading={startPending}
            loadingLabel="Restarting sandbox…"
            onClick={onRestart}
          >
            Start Sandbox
          </Button>
        }
      />
    );
  } else if (state === 'timeout') {
    content = (
      <DarkState
        icon="error"
        title="Lab environment timed out"
        action={
          <Button variant="secondary" size="sm" iconName="refresh" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  } else {
    content = (
      <DarkState
        icon="error"
        title="Sandbox Allocation Failed"
        message={
          error ? getErrorMessage(error, 'Could not allocate container namespace.') : undefined
        }
        action={
          <Button variant="secondary" size="sm" iconName="refresh" onClick={onRetry}>
            Retry Launch
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink-deep">
      {children}
      <div className="flex min-h-0 flex-1 flex-col">{content}</div>
    </div>
  );
}

export default EnvironmentPanel;
