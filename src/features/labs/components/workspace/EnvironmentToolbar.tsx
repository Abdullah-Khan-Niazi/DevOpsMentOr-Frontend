import { useState } from 'react';
import { ConfirmDialog, Countdown, IconButton } from '@/shared/components';

export interface EnvironmentToolbarProps {
  /** Lab environment expiry from the server; null when the environment has no deadline. */
  expiresAt: string | null;
  onExtend: () => void;
  onReconnect: () => void;
  onEnd: () => void;
  extendPending?: boolean;
  endPending?: boolean;
}

/** Warning style for the countdown below this many seconds. */
const WARN_BELOW_SECONDS = 5 * 60;

/** Lab environment controls above the terminal. Icon-only, no borders. */
export function EnvironmentToolbar({
  expiresAt,
  onExtend,
  onReconnect,
  onEnd,
  extendPending = false,
  endPending = false,
}: EnvironmentToolbarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-2 px-2 py-1">
      {expiresAt ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Time left</span>
          <Countdown until={expiresAt} label="Time left" warnBelowSeconds={WARN_BELOW_SECONDS} />
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          icon="timer"
          label="Extend lab environment"
          size="sm"
          isLoading={extendPending}
          onClick={onExtend}
        />
        <IconButton icon="refresh" label="Reconnect terminal" size="sm" onClick={onReconnect} />
        <IconButton
          icon="stop"
          label="End lab environment"
          size="sm"
          tone="danger"
          isLoading={endPending}
          onClick={() => setConfirmOpen(true)}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="End lab environment?"
        message="The environment and everything in it will be deleted."
        confirmLabel="End lab environment"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onEnd();
        }}
      />
    </div>
  );
}

export default EnvironmentToolbar;
