import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Changing this value (for example the pathname) clears a caught error. */
  resetKey?: string;
}

interface RouteErrorBoundaryState {
  error: unknown;
  resetKey?: string;
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(
    `${error.name} ${error.message}`,
  );
}

/**
 * Catches render errors and failed lazy chunk loads for one route. A failed
 * chunk (new deploy, flaky network) offers a full reload; other errors offer
 * a retry that re-renders the route.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<RouteErrorBoundaryState> {
    return { error: error ?? new Error('Unknown error') };
  }

  static getDerivedStateFromProps(
    props: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState,
  ): Partial<RouteErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Route render failed', error, info.componentStack);
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (isChunkLoadError(error)) {
      return (
        <div className="flex flex-col items-center gap-4 py-16">
          <ErrorState
            title="This page failed to load"
            message="Check your connection and reload the page."
          />
          <Button variant="secondary" iconName="refresh" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }

    return (
      <div className="py-16">
        <ErrorState
          title="This page failed to load"
          message="Something went wrong while showing this page."
          onRetry={() => this.setState({ error: null })}
        />
      </div>
    );
  }
}
