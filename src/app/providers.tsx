import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthBootstrap } from '@/features/auth/components/AuthBootstrap';
import { getStatusCode, isNetworkError } from '@/shared/services/apiError';

interface AppProvidersProps {
  children: ReactNode;
}

const MAX_QUERY_RETRIES = 2;

/** Retry only failures that can succeed on a second try: offline/timeout and 5xx. */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  return isNetworkError(error) || (getStatusCode(error) ?? 0) >= 500;
}

function createQueryClient() {
  return new QueryClient({
    // Components own mutation feedback (inline errors, toasts); nothing is toasted globally.
    mutationCache: new MutationCache({
      onError: (error) => {
        if (import.meta.env.DEV) console.warn('Mutation failed', error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>{children}</AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
