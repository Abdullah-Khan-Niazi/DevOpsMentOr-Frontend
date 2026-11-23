import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { hasCode, isApiError, isTimeoutError } from '@/shared/services';
import type { ApiError } from '@/shared/types';
import { labsService } from '../services';
import type { ProvisionInstanceDto, VpnRegion } from '../types';

/** FE§4.4: poll the active instance every 2 s while it is `pending`. */
export const ENVIRONMENT_POLL_MS = 2_000;
/** FE§4.4: stop polling and report a timeout error after 120 s pending. */
export const ENVIRONMENT_START_TIMEOUT_MS = 120_000;

export interface EnvironmentConflict {
  /** The learner's active instance, which belongs to another lab. */
  instanceId: number;
  labId: number;
}

/** Outcome of a start request (the mutation never rejects for the handled cases). */
export type StartEnvironmentResult =
  | { kind: 'started'; instance: ProvisionInstanceDto }
  /** Same lab already active: adopted, the active instance is refetched. */
  | { kind: 'adopted'; instanceId: number }
  /** Another lab is active: the page asks before ending it (`replaceConflict`). */
  | { kind: 'conflict'; instanceId: number; labId: number }
  /** Client timeout: the server may have started it; state was refetched. */
  | { kind: 'unknown' };

const START_TIMEOUT_ERROR: ApiError = {
  kind: 'timeout',
  message: 'The lab environment did not start within 2 minutes. Try again.',
  code: null,
  errors: [],
  retryAfterSeconds: null,
};

/** `INSTANCE_ALREADY_ACTIVE` carries `{ instanceId, labId }` in `errors[0]` (C§0.1). */
function alreadyActiveDetail(error: unknown): { instanceId: number; labId: number } | null {
  if (!hasCode(error, ERROR_CODES.INSTANCE_ALREADY_ACTIVE) || !isApiError(error)) return null;
  const first = error.errors[0];
  if (typeof first?.instanceId !== 'number' || typeof first.labId !== 'number') return null;
  return { instanceId: first.instanceId, labId: first.labId };
}

function invalidateActive(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
}

/**
 * The learner's lab environment for one lab. Never starts one on mount: `start`
 * is called by the page's button. Stopped and expired states are reported through
 * `instance.status`; `reconnectKey` changes on reconnect so the terminal frame reloads.
 */
export function useLabEnvironment(labId: number, enabled = true) {
  const queryClient = useQueryClient();
  const [timedOut, setTimedOut] = useState(false);
  const [waitEpoch, setWaitEpoch] = useState(0);
  const [reconnectKey, setReconnectKey] = useState(0);

  const active = useQuery({
    queryKey: QUERY_KEYS.labs.activeInstance,
    queryFn: () => labsService.getActiveInstance(),
    enabled: enabled && Number.isInteger(labId) && labId > 0,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.labId === labId && query.state.data.status === 'pending' && !timedOut
        ? ENVIRONMENT_POLL_MS
        : false,
  });

  // The learner has at most one active instance; it belongs to this lab or to another one.
  const activeInstance = active.data ?? null;
  const instance = activeInstance && activeInstance.labId === labId ? activeInstance : null;
  const otherInstance = activeInstance && activeInstance.labId !== labId ? activeInstance : null;
  const status = instance?.status ?? null;

  // 120 s budget per pending episode; restarts after `retry()` through `waitEpoch`.
  useEffect(() => {
    if (status !== 'pending') return undefined;
    const id = window.setTimeout(() => setTimedOut(true), ENVIRONMENT_START_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [status, waitEpoch]);

  // A timeout only counts while the instance is still pending (it may have been ended since).
  const startTimedOut = timedOut && status === 'pending';

  const startMutation = useMutation({
    mutationFn: async ({ region }: { region?: VpnRegion }): Promise<StartEnvironmentResult> => {
      try {
        const instance = await labsService.provisionInstance(labId, region);
        return { kind: 'started', instance };
      } catch (error) {
        const existing = alreadyActiveDetail(error);
        if (existing) {
          await invalidateActive(queryClient);
          if (existing.labId === labId) {
            return { kind: 'adopted', instanceId: existing.instanceId };
          }
          return { kind: 'conflict', instanceId: existing.instanceId, labId: existing.labId };
        }
        if (isTimeoutError(error)) {
          await invalidateActive(queryClient);
          return { kind: 'unknown' };
        }
        throw error;
      }
    },
    onSuccess: () => {
      setTimedOut(false);
      void invalidateActive(queryClient);
    },
  });

  const endMutation = useMutation({
    mutationFn: (instanceId: number) => labsService.terminateInstance(instanceId),
    onSuccess: () => {
      void invalidateActive(queryClient);
    },
    onError: (error) => {
      if (hasCode(error, ERROR_CODES.INSTANCE_NOT_FOUND, ERROR_CODES.INSTANCE_NOT_RUNNING)) {
        void invalidateActive(queryClient);
      }
    },
  });

  const extendMutation = useMutation({
    mutationFn: (instanceId: number) => labsService.extendInstance(instanceId),
    onSuccess: () => {
      void invalidateActive(queryClient);
    },
    onError: (error) => {
      if (hasCode(error, ERROR_CODES.INSTANCE_NOT_FOUND, ERROR_CODES.INSTANCE_NOT_RUNNING)) {
        void invalidateActive(queryClient);
      }
    },
  });

  const conflictResult = startMutation.data?.kind === 'conflict' ? startMutation.data : null;
  // A start refused with INSTANCE_ALREADY_ACTIVE (other lab), or another lab's instance seen
  // up front in the active-instance read: both are resolved by `replaceConflict`.
  const conflict: EnvironmentConflict | null = conflictResult
    ? { instanceId: conflictResult.instanceId, labId: conflictResult.labId }
    : otherInstance
      ? { instanceId: otherInstance.instanceId, labId: otherInstance.labId }
      : null;

  /**
   * Ends the other lab's environment, then starts this one (FE§4.4 conflict dialog).
   * Rejects with the first failure so `EnvironmentConflictDialog.onConfirm` can show it.
   */
  const replaceConflict = async (region?: VpnRegion): Promise<void> => {
    if (!conflict) return;
    try {
      await endMutation.mutateAsync(conflict.instanceId);
    } catch (error) {
      // Already gone (ended elsewhere or expired): starting is still the right next step.
      if (!hasCode(error, ERROR_CODES.INSTANCE_NOT_FOUND)) throw error;
    }
    await startMutation.mutateAsync({ region });
  };

  const error: unknown = startTimedOut ? START_TIMEOUT_ERROR : (startMutation.error ?? null);

  return {
    /** This lab's active instance; null when none or when the active one belongs to another lab. */
    instance,
    /** The learner's active instance of another lab (offer to end it instead of Start). */
    otherInstance,
    status,
    isLoading: active.isLoading,
    activeError: active.error,
    error,
    timedOut: startTimedOut,
    /** Restarts the 120 s wait for a still-pending instance. */
    retryWait: () => {
      setTimedOut(false);
      setWaitEpoch((value) => value + 1);
      void invalidateActive(queryClient);
    },
    start: (region?: VpnRegion) => startMutation.mutate({ region }),
    end: (instanceId: number) => endMutation.mutate(instanceId),
    extend: (instanceId: number) => extendMutation.mutate(instanceId),
    /** Result of the last start: `adopted` and `started` need no action from the page. */
    startResult: startMutation.data ?? null,
    conflict,
    replaceConflict,
    dismissConflict: () => startMutation.reset(),
    isStarting: startMutation.isPending,
    isEnding: endMutation.isPending,
    isExtending: extendMutation.isPending,
    endError: endMutation.error,
    extendError: extendMutation.error,
    extendResult: extendMutation.data ?? null,
    /** Bumped on reconnect; use as the terminal frame `key` to reload it. */
    reconnectKey,
    reconnect: () => setReconnectKey((value) => value + 1),
    refetch: active.refetch,
  };
}
