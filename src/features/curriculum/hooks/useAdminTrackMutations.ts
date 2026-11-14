import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { labsService } from '@/features/labs/services';
import type { CreateTrackPayload } from '@/features/labs/types';

/**
 * The backend update-track validator also accepts `isActive`; the frontend
 * `CreateTrackPayload` type predates the publish flow, so the update payload
 * widens it instead of editing the shared labs types.
 */
export type TrackUpdatePayload = Partial<CreateTrackPayload> & { isActive?: boolean };

/**
 * Track create/update mutations shared by the curriculum Tracks tab and the
 * reusable track drawer. Invalidates the admin track list plus the affected
 * public track detail so the inline hierarchy reflects drafts/publishes.
 */
export function useAdminTrackMutations() {
  const queryClient = useQueryClient();

  const invalidateTrack = (trackId?: number) => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.tracks('all') });
    if (trackId !== undefined) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.labs.trackDetail(String(trackId)),
      });
    }
  };

  const create = useMutation({
    mutationFn: (payload: CreateTrackPayload) => labsService.adminCreateTrack(payload),
    onSuccess: () => invalidateTrack(),
  });

  const update = useMutation({
    mutationFn: (input: { trackId: number; payload: TrackUpdatePayload }) =>
      labsService.adminUpdateTrack(input.trackId, input.payload),
    onSuccess: (_track, input) => invalidateTrack(input.trackId),
  });

  return { create, update };
}

export default useAdminTrackMutations;
