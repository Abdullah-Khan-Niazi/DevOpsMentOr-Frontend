import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { IconButton } from '@/shared/components/IconButton';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  href?: string;
}

export interface PageHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  backTo?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Global single-header PageHeader.
 * Single clean title with standardized transparent-background back button.
 * Eyebrows, subtitles, and breadcrumbs are strictly purged.
 */
export function PageHeader({ title, breadcrumbs, backTo, onBack, actions }: PageHeaderProps) {
  // Derive single header title: prefer explicit title, otherwise last crumb label
  const resolvedTitle =
    title ??
    (breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : '');

  // Derive back destination: explicit backTo, or second-to-last breadcrumb if multi-crumb
  const resolvedBackTo =
    backTo ??
    (breadcrumbs && breadcrumbs.length > 1
      ? (breadcrumbs[breadcrumbs.length - 2].to ?? breadcrumbs[breadcrumbs.length - 2].href)
      : undefined);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex items-center gap-2.5">
        {onBack ? (
          <IconButton
            icon="arrow-left"
            label="Back"
            size="sm"
            showTooltip={false}
            onClick={onBack}
          />
        ) : resolvedBackTo ? (
          <Link to={resolvedBackTo} className="icon-btn icon-btn--sm" aria-label="Back">
            <Icon name="arrow-left" size={18} />
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
