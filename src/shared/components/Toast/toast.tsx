import type { ReactNode } from 'react';
import { XpDelta } from '@/shared/components/XpDelta';
import { getErrorMessage, isCanceledError } from '@/shared/services/apiError';
import { useToastStore, type ToastOptions } from './toastStore';

function push(type: Parameters<ReturnType<typeof useToastStore.getState>['push']>[0]) {
  return (message: ReactNode, options?: ToastOptions) =>
    useToastStore.getState().push(type, message, options);
}

export const toast = {
  success: push('success'),
  warning: push('warning'),
  info: push('info'),
  /**
   * Error toast from a message or any thrown value (uses the API error message).
   * Canceled requests are not errors the user caused and show nothing.
   */
  error: (messageOrError: unknown, options?: ToastOptions): string | null => {
    if (isCanceledError(messageOrError)) return null;
    const message =
      typeof messageOrError === 'string' && messageOrError.trim()
        ? messageOrError
        : getErrorMessage(messageOrError);
    return useToastStore.getState().push('error', message, options);
  },
  /** XP change from a server response, for example `toast.xp(25, 'Step passed')`. */
  xp: (delta: number, label: string, options?: ToastOptions) =>
    useToastStore.getState().push(
      delta < 0 ? 'warning' : 'success',
      <span className="inline-flex flex-wrap items-center gap-2">
        <XpDelta delta={delta} />
        <span>{label}</span>
      </span>,
      options,
    ),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
