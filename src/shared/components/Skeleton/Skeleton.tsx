import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils';
import './Skeleton.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const customStyle: CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined
      ? { height: typeof height === 'number' ? `${height}px` : height }
      : {}),
  };

  return (
    <div
      className={cn('skeleton-bone', `skeleton-bone--${variant}`, className)}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Text lines; `widths` per line (defaults to full lines with a shorter last line). */
export function SkeletonText({
  lines = 3,
  widths,
  className,
  style,
}: {
  lines?: number;
  widths?: ReadonlyArray<string>;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn('space-y-2', className)} style={style} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-3.5"
          width={widths?.[i] ?? (i === lines - 1 && lines > 1 ? '65%' : '100%')}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({
  size = 32,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const rem = `${size / 16}rem`;
  return (
    <Skeleton variant="circular" width={rem} height={rem} className={className} style={style} />
  );
}

/**
 * Page-level skeleton shell: full width and height flex column that dedicated
 * screen skeletons compose. It is the only status landmark a page skeleton exposes;
 * the bones inside are decorative (aria-hidden).
 */
export function PageSkeleton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="page-skeleton" role="status" aria-label={label} aria-busy="true">
      {children}
    </div>
  );
}

/** Tree rows (icon + label + meta) indented by `depth`; used inside lazy tree nodes. */
export function TreeSkeleton({ rows = 3, depth = 0 }: { rows?: number; depth?: number }) {
  return (
    <div
      className="space-y-1 py-1"
      style={{ paddingInlineStart: `${depth * 1.25}rem` }}
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-10 items-center gap-2 px-2">
          <Skeleton className="h-4 w-4 rounded-xs" />
          <Skeleton className="h-4 w-4 rounded-xs" />
          <Skeleton className="h-4 rounded-xs" width={`${[48, 36, 42, 30][i % 4]}%`} />
          <Skeleton className="ml-auto h-3 w-16 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

/** Learn hub: header with search and switcher, continue strip, course card grid. */
export function LearnCatalogSkeleton() {
  return (
    <div className="skeleton-page w-full min-w-0" aria-label="Loading courses" role="status">
      <Skeleton className="h-8 w-32 rounded-md" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-full max-w-sm rounded-sm" />
        <Skeleton className="h-8 w-60 rounded-sm" />
      </div>
      <div className="flex items-center gap-4 rounded-md bg-card p-4 shadow-sm">
        <Skeleton className="h-10 w-10 rounded-sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-56 rounded-xs" />
          <Skeleton className="h-2 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-4 shadow-sm">
            <Skeleton className="aspect-[16/9] w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-sm" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3.5 w-12 rounded-xs" />
              <Skeleton className="h-3.5 w-14 rounded-xs" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Quiz runner: question rail, header with progress, question and options. */
export function QuizSkeleton() {
  return (
    <div className="skeleton-page w-full min-w-0" aria-label="Loading quiz" role="status">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-sm" />
        <Skeleton className="h-7 w-64 rounded-md" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full max-w-[10rem] rounded-sm" />
          ))}
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-4 w-14 rounded-xs" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <SkeletonText lines={2} widths={['90%', '60%']} />
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <SkeletonCircle size={18} />
                <Skeleton className="h-4 rounded-xs" width={`${[55, 40, 62, 35][i]}%`} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drawer form body: labelled fields and a text area. */
export function DrawerFormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-label="Loading" role="status">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded-xs" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
      ))}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28 rounded-xs" />
        <Skeleton className="h-28 w-full rounded-sm" />
      </div>
    </div>
  );
}

/** Admin Platform Dashboard Full-Page Skeleton: header, 4 KPI metric cards with sparklines, 2-column split (traffic curve + audit trail), and telemetry monitor */
export function AdminDashboardSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading admin dashboard"
      role="status"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <Skeleton className="h-8 w-64 md:w-80 rounded-md" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* 4 KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-sm" />
              <div className="flex items-end gap-1 h-5">
                {[1, 2, 3, 2, 4].map((h, j) => (
                  <Skeleton key={j} className="w-1.5 rounded-xs" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-sm" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3 w-28 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Split: Traffic Density + Audit Stream */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        {/* Traffic Curve Card */}
        <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-52 rounded-sm" />
            <Skeleton className="h-7 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-44 w-full rounded-md" />
        </div>

        {/* Audit Stream Card */}
        <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded-sm" />
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
          <Skeleton className="h-9 w-full rounded-sm" />
          <div className="space-y-2 pt-1">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton variant="circular" className="h-6 w-6" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32 rounded-xs" />
                    <Skeleton className="h-2.5 w-24 rounded-xs" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-Width Telemetry Monitor Skeleton */}
      <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded-sm" />
          <Skeleton className="h-7 w-40 rounded-sm" />
        </div>
        <Skeleton className="h-10 w-full rounded-sm" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}

/** Analytics Page Full Skeleton: header, 8 KPI cards, Hatched Pie / Funnel, Vector Map, Traffic Density Curve */
export function AnalyticsPageSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading analytics"
      role="status"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <Skeleton className="h-8 w-64 md:w-80 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-sm" />
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-sm" />
              <div className="flex items-end gap-1 h-5">
                {[2, 3, 4, 3, 5].map((h, j) => (
                  <Skeleton key={j} className="w-1.5 rounded-xs" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-sm" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* Split Charts: Hatched Pie + Conversion Funnel */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <Skeleton className="h-56 w-full rounded-md" />
        </div>
        <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <Skeleton className="h-56 w-full rounded-md" />
        </div>
      </div>

      {/* Vector Regional Map Skeleton */}
      <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-60 rounded-sm" />
          <Skeleton className="h-7 w-36 rounded-sm" />
        </div>
        <Skeleton className="h-80 w-full rounded-md" />
      </div>
    </div>
  );
}

/** Organization Dashboard Full Skeleton: identity banner with seat quota, 4 KPI cards, cohorts list, and member directory */
export function OrgDashboardSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading organization workspace"
      role="status"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 md:w-80 rounded-md" />
          <Skeleton className="h-4 w-44 md:w-72 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Org Identity Banner */}
      <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-sm" />
              <Skeleton className="h-4 w-64 rounded-xs" />
            </div>
          </div>
          <div className="space-y-2 sm:text-right">
            <Skeleton className="h-4 w-32 rounded-xs sm:ml-auto" />
            <Skeleton className="h-2.5 w-44 rounded-sm" />
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-5 shadow-sm space-y-3">
            <Skeleton className="h-4 w-28 rounded-sm" />
            <Skeleton className="h-8 w-20 rounded-sm" />
            <Skeleton className="h-3.5 w-36 rounded-xs" />
          </div>
        ))}
      </div>

      {/* Member Directory Table Skeleton */}
      <div className="rounded-md bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-sm" />
            <Skeleton className="h-8 w-36 rounded-sm" />
          </div>
        </div>

        <div className="pt-2">
          {Array.from({ length: 6 }, (_, j) => (
            <div key={j} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-xs" />
                  <Skeleton className="h-3 w-48 rounded-xs" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 rounded-xs hidden sm:block" />
              <Skeleton className="h-5 w-20 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Divider-free table skeleton: header row plus rows, no borders between rows. */
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full min-w-0 space-y-1" role="status" aria-label="Loading table">
      <div className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className="h-3.5 flex-1 rounded-xs" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded-xs" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Table Page Full Skeleton: header, filter toolbar, 8-row table, pagination */
export function TablePageSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading data table"
      role="status"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <Skeleton className="h-8 w-56 md:w-64 rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-md bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <Skeleton className="h-9 w-full rounded-sm" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
        </div>
      </div>

      {/* Full Data Table */}
      <div className="rounded-md bg-card shadow-sm overflow-hidden">
        {/* Table Header Row */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-surface/50">
          <Skeleton className="h-4 w-32 rounded-xs" />
          <Skeleton className="h-4 w-28 rounded-xs hidden md:block" />
          <Skeleton className="h-4 w-24 rounded-xs hidden lg:block" />
          <Skeleton className="h-4 w-20 rounded-xs" />
          <Skeleton className="h-4 w-16 rounded-xs" />
        </div>

        {/* 8 Table Rows */}
        <div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3 w-1/3">
                <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded-xs" />
                  <Skeleton className="h-3 w-44 rounded-xs" />
                </div>
              </div>
              <Skeleton className="h-4 w-28 rounded-xs hidden md:block" />
              <Skeleton className="h-4 w-24 rounded-xs hidden lg:block" />
              <Skeleton className="h-5 w-20 rounded-xs" />
              <Skeleton className="h-7 w-20 rounded-xs" />
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-card">
          <Skeleton className="h-4 w-36 rounded-xs" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-8 w-8 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Detail Form / Settings Full-Page Skeleton: breadcrumb, tabs, multi-field form */
export function DetailFormSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading settings"
      role="status"
    >
      {/* Breadcrumb & Title */}
      <div className="space-y-3 pb-2">
        <Skeleton className="h-4 w-36 rounded-xs" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-60 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 pb-2">
        <Skeleton className="h-8 w-24 rounded-sm" />
        <Skeleton className="h-8 w-24 rounded-sm" />
        <Skeleton className="h-8 w-24 rounded-sm" />
      </div>

      {/* Form Card */}
      <div className="rounded-md bg-card p-6 md:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-10 w-full rounded-sm" />
            <Skeleton className="h-3 w-48 rounded-xs" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-24 w-full rounded-sm" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Grid Cards Skeleton: for Badges, Achievements, Events, Announcements */
export function GridCardsSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 w-full min-w-0 max-w-full"
      aria-label="Loading items"
      role="status"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 md:w-72 rounded-md" />
          <Skeleton className="h-4 w-40 md:w-80 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Search Bar */}
      <div className="rounded-md bg-card p-4 shadow-sm flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>

      {/* 6-8 Responsive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32 rounded-xs" />
                <Skeleton className="h-3 w-20 rounded-xs" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xs" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-24 rounded-xs" />
              <Skeleton className="h-7 w-20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Learner Dashboard Skeleton: header, streak badge, hero courses, continue learning, progress cards */
export function DashboardSkeleton() {
  return (
    <div className="skeleton-page space-y-6 py-2" aria-label="Loading dashboard" role="status">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 md:w-72 rounded-md" />
          <Skeleton className="h-4 w-40 md:w-80 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-28 rounded-sm" />
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-xs" />
              <Skeleton variant="circular" className="h-8 w-8" />
            </div>
            <Skeleton className="h-8 w-32 rounded-sm" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3 w-28 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-md bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-sm" />
            <Skeleton className="h-8 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-64 w-full rounded-md" />
        </div>

        <div className="rounded-md bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-36 rounded-sm" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 pb-2">
                <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-full rounded-xs" />
                  <Skeleton className="h-3 w-2/3 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Curriculum & Tree DAG Master View Skeleton */
export function CurriculumSkeleton() {
  return (
    <div
      className="skeleton-page space-y-6 py-2 w-full min-w-0"
      aria-label="Loading curriculum"
      role="status"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-xs" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-card/40">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-9 w-full max-w-md rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <Skeleton className="h-8 w-36 rounded-xs" />
      </div>

      {/* Course Root Card */}
      <div className="rounded-md p-5 bg-card/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-sm" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-28 rounded-xs" />
              <Skeleton className="h-5 w-64 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-sm" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-5 w-24 rounded-xs" />
          <Skeleton className="h-5 w-28 rounded-xs" />
          <Skeleton className="h-5 w-20 rounded-xs" />
          <Skeleton className="h-5 w-36 rounded-xs" />
        </div>
      </div>

      {/* Module Tree Hierarchy */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            {/* Module Row */}
            <div className="flex items-center justify-between p-3 rounded-sm bg-card/20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-xs" />
                <Skeleton className="h-5 w-8 rounded-xs" />
                <Skeleton className="h-5 w-56 rounded-sm" />
                <Skeleton className="h-4 w-16 rounded-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-xs" />
                <Skeleton className="h-4 w-16 rounded-xs" />
              </div>
            </div>

            {/* Indented Children */}
            <div className="pl-6 ml-4 space-y-1.5 py-1">
              {Array.from({ length: 3 }, (_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between p-2.5 rounded-xs bg-card/10"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-xs" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48 md:w-72 rounded-xs" />
                      <Skeleton className="h-3 w-36 rounded-xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12 rounded-xs" />
                    <Skeleton className="h-4 w-14 rounded-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lab workspace: two panes (steps left, environment right), full viewport height. */
export function LabWorkspaceSkeleton() {
  return (
    <div
      className="skeleton-page grid h-dvh min-h-0 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(22rem,2fr)_3fr]"
      aria-label="Loading lab workspace"
      role="status"
    >
      <div className="flex min-h-0 flex-col gap-5 overflow-hidden rounded-md bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-sm" />
          <Skeleton className="h-6 w-56 rounded-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-40 rounded-xs" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded-sm" />
          <SkeletonText lines={3} widths={['100%', '94%', '70%']} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-64 rounded-sm" />
          <SkeletonText lines={4} widths={['100%', '96%', '88%', '60%']} />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
        <div className="mt-auto flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-3 rounded-md bg-ink p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="h-7 w-20 rounded-sm bg-pearl-100/25" />
            <div className="h-7 w-16 rounded-sm bg-pearl-100/15" />
            <div className="h-7 w-24 rounded-sm bg-pearl-100/15" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-14 rounded-xs bg-pearl-100/20" />
            <div className="h-7 w-7 rounded-sm bg-pearl-100/15" />
            <div className="h-7 w-7 rounded-sm bg-pearl-100/15" />
          </div>
        </div>
        <div className="flex-1 space-y-2 rounded-md bg-ink-deep p-4 font-mono">
          <div className="h-3.5 w-60 rounded-xs bg-pearl-100/30" />
          <div className="h-3.5 w-80 rounded-xs bg-pearl-100/20" />
          <div className="h-3.5 w-44 rounded-xs bg-pearl-100/20" />
        </div>
      </div>
    </div>
  );
}

/** Public Subpage Skeleton: Header mockup, breadcrumb/tag, title, subtitle, content grid, and footer */
export function PublicPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      aria-label="Loading page"
      role="status"
    >
      {/* Header Skeleton */}
      <header className="h-16 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-5 w-32 rounded-xs" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-4 w-20 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-4 w-16 rounded-xs" />
            <Skeleton className="h-4 w-16 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-sm" />
            <Skeleton className="h-8 w-24 rounded-sm" />
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 space-y-8">
        <div className="space-y-3 max-w-2xl">
          <Skeleton className="h-4 w-28 rounded-xs" />
          <Skeleton className="h-9 md:h-11 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-xs" />
          <Skeleton className="h-4 w-3/4 rounded-xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-md bg-card p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-36 rounded-sm" />
              <Skeleton className="h-4 w-full rounded-xs" />
              <Skeleton className="h-4 w-4/5 rounded-xs" />
              <div className="pt-2 flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded-xs" />
                <Skeleton className="h-8 w-24 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-xs" />
          <Skeleton className="h-4 w-60 rounded-xs" />
        </div>
      </footer>
    </div>
  );
}

/** Auth Screen Full-Page Skeleton: mirrors AuthLayout with left context panel and centered auth card */
export function AuthPageSkeleton() {
  return (
    <div className="auth-page min-h-screen" aria-label="Loading authentication" role="status">
      {/* Branded Left Context Panel (hidden on mobile, visible on desktop) */}
      <aside className="auth-context">
        <div className="auth-context__inner space-y-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-6 w-36 rounded-xs" />
          </div>
          <div className="space-y-4 pt-10">
            <Skeleton className="h-8 w-4/5 rounded-md" />
            <Skeleton className="h-4 w-full rounded-xs" />
            <Skeleton className="h-4 w-5/6 rounded-xs" />
          </div>
          <div className="space-y-3 pt-6">
            <Skeleton className="h-4 w-3/4 rounded-xs" />
            <Skeleton className="h-4 w-2/3 rounded-xs" />
            <Skeleton className="h-4 w-4/5 rounded-xs" />
          </div>
        </div>
      </aside>

      {/* Right Form Panel / Centered Card */}
      <main className="auth-panel">
        <div className="auth-panel__inner space-y-6">
          <Skeleton className="h-4 w-32 rounded-xs" />

          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-xs" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-xs" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded-xs" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-md mt-2" />
          </div>

          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-28 rounded-xs" />
            <Skeleton className="h-px flex-1" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          <Skeleton className="h-4 w-44 mx-auto rounded-xs mt-4" />
        </div>
      </main>
    </div>
  );
}
