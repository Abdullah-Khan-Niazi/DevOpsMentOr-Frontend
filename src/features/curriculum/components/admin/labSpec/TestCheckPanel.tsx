import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, CodeBlock, ConfirmDialog, FieldError, Icon } from '@/shared/components';
import { QUERY_KEYS } from '@/shared/constants';
import { useInterval, useRetryAfter } from '@/shared/hooks';
import { getErrorMessage, getStatusCode, hasCode } from '@/shared/services/apiError';
import { useActiveInstance, useTerminateInstance } from '@/features/labs/hooks/useLabs';
import { labsService } from '@/features/labs/services/labsService';
import { useTestCheck } from '@/features/labs/hooks/useAdminLabs';
import type { AdminCheckResultDto } from '@/features/labs/types/admin';
import type { LabStepCheck } from '@/features/labs/types/labSpec';

// Runs one draft check against the admin's own running lab environment (contract
// C§6.2 test-check). The check is sent as a draft, so the result always matches what
// the author sees, saved or not. Nothing is written to learner progress.

export interface TestCheckPanelProps {
  labId: number;
  check: LabStepCheck;
  /** False while the check fails client validation. */
  checkValid: boolean;
  disabled?: boolean;
}

/** While the environment is starting, its status is polled at this interval. */
const STARTING_POLL_MS = 3000;

export function TestCheckPanel({
  labId,
  check,
  checkValid,
  disabled = false,
}: TestCheckPanelProps) {
  const queryClient = useQueryClient();
  const activeQuery = useActiveInstance(true);
  const terminate = useTerminateInstance();
  const runCheck = useTestCheck(labId);
  const retry = useRetryAfter(runCheck.error);
  const [conflictOpen, setConflictOpen] = useState(false);

  const instance = activeQuery.data ?? null;
  const ownLab = instance !== null && instance.labId === labId;
  const running = ownLab && instance.status === 'running';

  const start = useMutation({
    mutationFn: async (endCurrent: boolean) => {
      if (endCurrent && instance) await terminate.mutateAsync(instance.instanceId);
      // The service call uses the long request timeout (provisioning starts a container).
      await labsService.provisionInstance(labId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
    onError: (error, endCurrent) => {
      if (!endCurrent && hasCode(error, 'INSTANCE_ALREADY_ACTIVE')) setConflictOpen(true);
    },
  });

  useInterval(
    () => void activeQuery.refetch(),
    ownLab && !running && !activeQuery.isFetching ? STARTING_POLL_MS : null,
  );

  const startError =
    start.error && !hasCode(start.error, 'INSTANCE_ALREADY_ACTIVE') ? start.error : null;
  const checkError =
    runCheck.error && getStatusCode(runCheck.error) !== 429 ? runCheck.error : null;

  if (!ownLab) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            iconName="play"
            isLoading={start.isPending}
            disabled={disabled}
            onClick={() => start.mutate(false)}
          >
            Start lab environment
          </Button>
        </div>
        <FieldError message={startError ? getErrorMessage(startError) : undefined} />
        <ConfirmDialog
          open={conflictOpen}
          title="End the running lab environment?"
          message={`Your lab environment for ${instance?.labName ?? 'another lab'} is running. It has to end before this lab can start.`}
          confirmLabel="End and start"
          tone="danger"
          onCancel={() => setConflictOpen(false)}
          onConfirm={() => {
            setConflictOpen(false);
            start.mutate(true);
          }}
        />
      </div>
    );
  }

  if (!running) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Starting the lab environment</span>
        <Button
          variant="ghost"
          size="sm"
          iconName="refresh"
          isLoading={activeQuery.isFetching}
          onClick={() => void activeQuery.refetch()}
        >
          Refresh status
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          iconName="play"
          isLoading={runCheck.isPending}
          disabled={disabled || !checkValid || retry.blocked}
          onClick={() => runCheck.mutate({ instanceId: instance.instanceId, check })}
        >
          {retry.blocked ? `Try again in ${retry.secondsLeft}s` : 'Run check'}
        </Button>
      </div>
      <FieldError message={checkError ? getErrorMessage(checkError) : undefined} />
      {runCheck.data ? <CheckResult result={runCheck.data} /> : null}
    </div>
  );
}

function resultLabel(result: AdminCheckResultDto): string {
  if (result.passed) return 'Check passed';
  if (result.reason === 'timeout') return 'Check timed out';
  return 'Check did not pass';
}

function CheckResult({ result }: { result: AdminCheckResultDto }) {
  const details = [
    result.exitCode !== null ? `Exit code ${result.exitCode}` : null,
    result.statusCode !== null ? `HTTP status ${result.statusCode}` : null,
    `${result.durationMs} ms`,
  ].filter((detail): detail is string => detail !== null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <Icon
            name={result.passed ? 'check-circle' : 'error'}
            size={18}
            className={result.passed ? 'text-success' : 'text-signal'}
          />
          {resultLabel(result)}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 font-mono text-xs text-muted">
          {details.map((detail) => (
            <span key={detail}>{detail}</span>
          ))}
        </span>
      </div>
      {result.stdout ? (
        <div className="flex min-w-0 flex-col gap-2">
          <span className="input-label">Standard output</span>
          <CodeBlock code={result.stdout} />
        </div>
      ) : null}
      {result.stderr ? (
        <div className="flex min-w-0 flex-col gap-2">
          <span className="input-label">Standard error</span>
          <CodeBlock code={result.stderr} />
        </div>
      ) : null}
    </div>
  );
}
