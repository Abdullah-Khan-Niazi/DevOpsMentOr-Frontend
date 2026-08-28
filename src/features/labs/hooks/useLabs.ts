import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { labsService } from '../services';
import type { VpnRegion } from '../types';

/** LAB-01 */
export function useLabCatalog(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.all,
    queryFn: () => labsService.listLabs(),
    enabled,
    retry: false,
  });
}

/** LAB-02 */
export function useLabDetail(labId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.detail(labId),
    queryFn: () => labsService.getLabDetail(Number(labId)),
    enabled: enabled && labId.length > 0,
    retry: false,
  });
}

/** LAB-04: the learner's single active instance. */
export function useActiveInstance(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.activeInstance,
    queryFn: () => labsService.getActiveInstance(),
    enabled,
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useProvisionInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labId, region }: { labId: number; region?: VpnRegion }) =>
      labsService.provisionInstance(labId, region),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
  });
}

export function useStopInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: number) => labsService.stopInstance(instanceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
  });
}

export function useTerminateInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: number) => labsService.terminateInstance(instanceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.all });
    },
  });
}

export function useExtendInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: number) => labsService.extendInstance(instanceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
  });
}

/** LAB-08 */
export function useRunAssertions() {
  return useMutation({
    mutationFn: (instanceId: number) => labsService.runAssertions(instanceId),
  });
}

/** LAB-09 */
export function useSubmitSherlockAnswers(labId: number) {
  return useMutation({
    mutationFn: (answers: Array<{ questionId: string; answer: string }>) =>
      labsService.submitSherlockAnswers(labId, answers),
  });
}

/** LAB-10 */
export function useVpnConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.labs.vpnConfig,
    queryFn: () => labsService.getVpnConfig(),
    retry: false,
  });
}

/* ── Tracks (LAB-13..LAB-15) ─────────────────────────────────────────── */

export function useTracks() {
  return useQuery({
    queryKey: QUERY_KEYS.labs.tracks,
    queryFn: () => labsService.listTracks(),
    retry: false,
  });
}

export function useTrackDetail(trackId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.trackDetail(trackId),
    queryFn: () => labsService.getTrackDetail(Number(trackId)),
    enabled: enabled && trackId.length > 0,
    retry: false,
  });
}

export function useTrackProgress(trackId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.trackProgress(trackId),
    queryFn: () => labsService.getTrackProgress(Number(trackId)),
    enabled: enabled && trackId.length > 0,
    retry: false,
  });
}

/** LAB-15 batch variant for catalog cards (SCR-F6-09 completion badges). */
export function useTrackProgressBatch(trackIds: string[]) {
  return useQueries({
    queries: trackIds.map((trackId) => ({
      queryKey: QUERY_KEYS.labs.trackProgress(trackId),
      queryFn: () => labsService.getTrackProgress(Number(trackId)),
      retry: false,
      enabled: trackId.length > 0,
    })),
  });
}

/* ── Admin (LAB-16..LAB-22) ──────────────────────────────────────────── */

export function useAdminLabs() {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.labs('all'),
    queryFn: () => labsService.adminListLabs(),
    retry: false,
  });
}

export function useAdminTracks() {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.tracks('all'),
    queryFn: () => labsService.adminListTracks(),
    retry: false,
  });
}

export function useAdminLabInstances(page = 1, pageSize = 20, status?: string, search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.instances(`${page}-${pageSize}-${status ?? ''}-${search ?? ''}`),
    queryFn: () => labsService.adminListInstances({ page, pageSize, status, search }),
    retry: false,
    refetchInterval: 30_000,
  });
}
