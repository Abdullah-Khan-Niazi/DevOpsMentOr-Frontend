import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useOptimisticMutation } from '@/shared/hooks';
import { adminLabsService } from '@/features/labs/services/adminLabsService';
import type {
  AdminTrackDetailDto,
  AdminTrackDto,
  CreateTrackPayload,
  UpdateTrackPayload,
} from '@/features/labs/types/admin';

/** Reorders `items` to the id sequence `ids` (ids are the exact full set). */
function orderByIds<T>(items: T[], ids: number[], idOf: (item: T) => number): T[] {
  const byId = new Map(items.map((item) => [idOf(item), item] as const));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

/** Course list rows carry `trackIds`; attach/detach changes them. */
const CURRICULUM_ADMIN_ROOT = QUERY_KEYS.curriculumAdmin.all;

/* ── Queries ───────────────────────────────────────────────────────────── */

export function useAdminTracks() {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.trackList,
    queryFn: () => adminLabsService.listTracks(),
    retry: false,
  });
}

/** Track detail with its course content rows (`{ track: AdminTrackDetailDto }`). */
export function useAdminTrack(trackId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.track(trackId),
    queryFn: () => adminLabsService.getTrack(trackId),
    enabled: enabled && Boolean(trackId),
    retry: false,
  });
}

/* ── Track mutations ───────────────────────────────────────────────────── */

/** Creates a track (single-track platform: 409 `SINGLE_TRACK_ONLY`); not optimistic. */
export function useCreateTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrackPayload) => adminLabsService.createTrack(payload),
    onSuccess: (track) => {
      queryClient.setQueryData<AdminTrackDto[]>(QUERY_KEYS.adminLabs.trackList, (old) =>
        old ? [...old, track] : old,
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.trackList });
    },
  });
}

/** Track field save. Detail and list caches updated from the response. */
export function useUpdateTrack(trackId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTrackPayload) => adminLabsService.updateTrack(trackId, payload),
    onSuccess: (track) => {
      queryClient.setQueryData<AdminTrackDetailDto>(
        QUERY_KEYS.adminLabs.track(trackId),
        (old) => old && { ...old, ...track },
      );
      queryClient.setQueryData<AdminTrackDto[]>(QUERY_KEYS.adminLabs.trackList, (old) =>
        old?.map((existing) => (existing.trackId === trackId ? track : existing)),
      );
    },
  });
}

/** Publish switch for a track (`isActive`). Optimistic on the track list cache. */
export function useSetTrackActive(trackId: number) {
  return useOptimisticMutation<boolean, AdminTrackDto, AdminTrackDto[]>({
    mutationFn: (isActive) => adminLabsService.updateTrack(trackId, { isActive }),
    queryKey: QUERY_KEYS.adminLabs.trackList,
    apply: (old, isActive) =>
      old?.map((track) => (track.trackId === trackId ? { ...track, isActive } : track)),
    invalidate: [QUERY_KEYS.adminLabs.track(trackId)],
  });
}

/**
 * Appends a course to the track; not optimistic. 409 `TRACK_CONTENT_EXISTS`
 * and 404 `COURSE_NOT_FOUND` are left to the caller (the drawer refetches and
 * shows the message), so the caches are refreshed on failure too.
 */
export function useAttachCourse(trackId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, required }: { courseId: number; required?: boolean }) =>
      adminLabsService.attachCourse(trackId, courseId, required),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.track(trackId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.trackList });
      void queryClient.invalidateQueries({ queryKey: CURRICULUM_ADMIN_ROOT });
    },
  });
}

/** Per-row Required switch of a track course. Optimistic on the track detail cache. */
export function useSetCourseRequired(trackId: number) {
  return useOptimisticMutation<{ courseId: number; required: boolean }, void, AdminTrackDetailDto>({
    mutationFn: ({ courseId, required }) =>
      adminLabsService.setCourseRequired(trackId, courseId, required),
    queryKey: QUERY_KEYS.adminLabs.track(trackId),
    apply: (old, { courseId, required }) =>
      old && {
        ...old,
        content: old.content.map((row) => (row.courseId === courseId ? { ...row, required } : row)),
      },
  });
}

/** Removes a course from the track. Optimistic on the track detail cache. */
export function useDetachCourse(trackId: number) {
  return useOptimisticMutation<number, void, AdminTrackDetailDto>({
    mutationFn: (courseId) => adminLabsService.detachCourse(trackId, courseId),
    queryKey: QUERY_KEYS.adminLabs.track(trackId),
    apply: (old, courseId) => {
      if (!old) return old;
      const content = old.content.filter((row) => row.courseId !== courseId);
      return { ...old, content, courseCount: content.length };
    },
    invalidate: [QUERY_KEYS.adminLabs.trackList, CURRICULUM_ADMIN_ROOT],
  });
}

/** Reorders the track's courses (exact full set). Optimistic on the track detail cache. */
export function useReorderTrackCourses(trackId: number) {
  return useOptimisticMutation<number[], void, AdminTrackDetailDto>({
    mutationFn: (courseIds) => adminLabsService.reorderCourses(trackId, courseIds),
    queryKey: QUERY_KEYS.adminLabs.track(trackId),
    apply: (old, courseIds) =>
      old && {
        ...old,
        content: orderByIds(old.content, courseIds, (row) => row.courseId).map((row, index) => ({
          ...row,
          displayOrder: index + 1,
        })),
      },
  });
}
