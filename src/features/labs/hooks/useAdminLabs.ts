import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useOptimisticMutation } from '@/shared/hooks';
import { adminLabsService } from '../services/adminLabsService';
import type {
  AdminLabDetailDto,
  AdminLabDto,
  TestCheckPayload,
  UpdateAdminLabPayload,
} from '../types/admin';
import type { LabSpecV2 } from '../types/labSpec';

/** Module items show each lab's readiness (`isActive`, `specStatus`, `stepCount`). */
const CURRICULUM_ADMIN_ROOT = QUERY_KEYS.curriculumAdmin.all;

/* ── Queries ───────────────────────────────────────────────────────────── */

/** Staff lab library. */
export function useAdminLabs() {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.list,
    queryFn: () => adminLabsService.list(),
    retry: false,
  });
}

/** Lab detail with the full spec (admin only). */
export function useAdminLab(labId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.detail(labId),
    queryFn: () => adminLabsService.get(labId),
    enabled: enabled && Boolean(labId),
    retry: false,
  });
}

/** Labs catalog for the import picker; `unusedOnly` hides slugs already imported. */
export function useAdminLabCatalog(unusedOnly = false, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.adminLabs.catalog(unusedOnly),
    queryFn: () => adminLabsService.catalog(unusedOnly),
    enabled,
    retry: false,
  });
}

/* ── Lab mutations ─────────────────────────────────────────────────────── */

/** Imports (or re-imports) a lab from the Labs catalog; not optimistic. */
export function useImportCatalogLab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => adminLabsService.importFromCatalog(slug),
    onSuccess: ({ lab }) => {
      queryClient.setQueryData<AdminLabDetailDto>(QUERY_KEYS.adminLabs.detail(lab.labId), lab);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.list });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.catalog(true) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.catalog(false) });
    },
  });
}

/** Live spec validation for the editor. Takes an abort signal for stale requests. */
export function useValidateLabSpec() {
  return useMutation({
    mutationFn: ({ spec, signal }: { spec: unknown; signal?: AbortSignal }) =>
      adminLabsService.validateSpec(spec, signal),
  });
}

/** Saves the step spec; the detail cache takes the returned lab. */
export function useSaveLabSpec(labId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spec: LabSpecV2) => adminLabsService.saveSpec(labId, spec),
    onSuccess: ({ lab }) => {
      queryClient.setQueryData<AdminLabDetailDto>(QUERY_KEYS.adminLabs.detail(labId), lab);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.list });
      void queryClient.invalidateQueries({ queryKey: CURRICULUM_ADMIN_ROOT });
    },
  });
}

/** Edits the lab metadata (no spec, no flag values). Caches take the response. */
export function useUpdateAdminLab(labId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdminLabPayload) => adminLabsService.update(labId, payload),
    onSuccess: (lab) => {
      queryClient.setQueryData<AdminLabDetailDto>(
        QUERY_KEYS.adminLabs.detail(labId),
        (old) => old && { ...old, ...lab },
      );
      queryClient.setQueryData<AdminLabDto[]>(QUERY_KEYS.adminLabs.list, (old) =>
        old?.map((existing) => (existing.labId === labId ? lab : existing)),
      );
      void queryClient.invalidateQueries({ queryKey: CURRICULUM_ADMIN_ROOT });
    },
  });
}

/**
 * Active switch. Optimistic on the lab list. Errors are not toasted here:
 * `LAB_NOT_READY`, `CATALOG_LAB_NOT_FOUND` and `CATALOG_UNAVAILABLE` need
 * their own messages and actions, so the caller handles `onError`.
 */
export function useSetLabActive() {
  const queryClient = useQueryClient();
  return useOptimisticMutation<{ labId: number; isActive: boolean }, void, AdminLabDto[]>({
    mutationFn: ({ labId, isActive }) => adminLabsService.setActive(labId, isActive),
    queryKey: QUERY_KEYS.adminLabs.list,
    apply: (old, { labId, isActive }) =>
      old?.map((lab) => (lab.labId === labId ? { ...lab, isActive } : lab)),
    onSuccess: (_data, { labId }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLabs.detail(labId) });
    },
    invalidate: [CURRICULUM_ADMIN_ROOT],
    errorMessage: false,
  });
}

/**
 * Deletes a lab; optimistic on the list. 409 `LAB_IN_USE` / `LAB_HAS_LEARNER_DATA`
 * roll back; errors are left to `DeleteEntityDialog` (no toast here).
 */
export function useDeleteLab() {
  const queryClient = useQueryClient();
  return useOptimisticMutation<number, void, AdminLabDto[]>({
    mutationFn: (labId) => adminLabsService.delete(labId),
    queryKey: QUERY_KEYS.adminLabs.list,
    apply: (old, labId) => old?.filter((lab) => lab.labId !== labId),
    onSuccess: (_data, labId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.adminLabs.detail(labId) });
    },
    invalidate: [QUERY_KEYS.adminLabs.catalog(true), QUERY_KEYS.adminLabs.catalog(false)],
    errorMessage: false,
  });
}

/** Runs one check on a running instance. Not cached: the result belongs to the editor. */
export function useTestCheck(labId: number) {
  return useMutation({
    mutationFn: (payload: TestCheckPayload) => adminLabsService.testCheck(labId, payload),
  });
}
