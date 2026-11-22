import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';

interface OptimisticContext<TCache> {
  previous: TCache | undefined;
}

export interface UseOptimisticMutationOptions<TVars, TData, TCache> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Cache entry updated optimistically (and restored on failure). */
  queryKey: QueryKey;
  /** Returns the optimistic cache value; return `old` unchanged to skip. */
  apply: (old: TCache | undefined, vars: TVars) => TCache | undefined;
  /** Extra keys (prefixes) invalidated after the mutation settles. */
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, vars: TVars) => void;
  /** Toast text on failure; defaults to the server message. Pass `false` to own the feedback. */
  errorMessage?: string | false;
  onError?: (error: unknown, vars: TVars) => void;
}

/**
 * Optimistic update with rollback: cancels in-flight reads of `queryKey`,
 * snapshots and applies the change, restores the snapshot and shows an error
 * toast on failure, then invalidates `queryKey` and `invalidate` either way.
 */
export function useOptimisticMutation<TVars, TData = unknown, TCache = unknown>({
  mutationFn,
  queryKey,
  apply,
  invalidate = [],
  onSuccess,
  errorMessage,
  onError,
}: UseOptimisticMutationOptions<TVars, TData, TCache>): UseMutationResult<
  TData,
  unknown,
  TVars,
  OptimisticContext<TCache>
> {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVars, OptimisticContext<TCache>>({
    mutationFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TCache>(queryKey);
      queryClient.setQueryData<TCache | undefined>(queryKey, (old) => apply(old, vars));
      return { previous };
    },
    onError: (error, vars, context) => {
      if (context) queryClient.setQueryData<TCache | undefined>(queryKey, context.previous);
      if (errorMessage !== false) {
        if (errorMessage) toast.error(errorMessage);
        else toast.error(error);
      }
      onError?.(error, vars);
    },
    onSuccess: (data, vars) => onSuccess?.(data, vars),
    onSettled: async () => {
      await Promise.all(
        [queryKey, ...invalidate].map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
    },
  });
}
