import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  href?: string;
}

export interface PageHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backTo?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Global single-header PageHeader — Contract v8 standard.
 * Single clean title with standardized transparent-background back button.
 * Eyebrows, subtitles, and breadcrumbs are strictly purged.
 */
export function PageHeader({
  title,
  breadcrumbs,
  backTo,
  onBack,
  actions,
}: PageHeaderProps) {
  // Derive single header title: prefer explicit title, otherwise last crumb label
  const resolvedTitle =
    title ??
    (breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : '');

  // Derive back destination: explicit backTo, or second-to-last breadcrumb if multi-crumb
  const resolvedBackTo =
    backTo ??
    (breadcrumbs && breadcrumbs.length > 1
      ? breadcrumbs[breadcrumbs.length - 2].to ?? breadcrumbs[breadcrumbs.length - 2].href
      : undefined);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex items-center gap-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-7 w-7 items-center justify-center border-0 bg-transparent text-muted transition-colors hover:text-card-foreground shrink-0 p-0 cursor-pointer"
            aria-label="Back"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : resolvedBackTo ? (
          <Link
            to={resolvedBackTo}
            className="inline-flex h-7 w-7 items-center justify-center border-0 bg-transparent text-muted transition-colors hover:text-card-foreground shrink-0 p-0"
            aria-label="Back"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-card-foreground truncate">
          {resolvedTitle}
        </h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
