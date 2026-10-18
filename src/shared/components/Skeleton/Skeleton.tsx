import type { CSSProperties, HTMLAttributes } from 'react';
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
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
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

/** Admin Platform Dashboard Full-Page Skeleton: header, 4 KPI metric cards with sparklines, 2-column split (traffic curve + audit trail), and telemetry monitor */
export function AdminDashboardSkeleton() {
  return (
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading admin dashboard" role="status">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 md:w-80 rounded-md" />
          <Skeleton className="h-4 w-44 md:w-96 rounded-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* 4 KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-sm" />
              <div className="flex items-end gap-1 h-5">
                {[1, 2, 3, 2, 4].map((h, j) => (
                  <Skeleton key={j} className="w-1.5 rounded-xs" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-sm" />
            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3 w-28 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Split: Traffic Density + Audit Stream */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        {/* Traffic Curve Card */}
        <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-52 rounded-sm" />
            <Skeleton className="h-7 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-44 w-full rounded-md" />
        </div>

        {/* Audit Stream Card */}
        <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded-sm" />
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
          <Skeleton className="h-9 w-full rounded-sm" />
          <div className="space-y-2 pt-1">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
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
      <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
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
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading analytics" role="status">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 md:w-80 rounded-md" />
          <Skeleton className="h-4 w-44 md:w-96 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-36 rounded-sm" />
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-sm" />
              <div className="flex items-end gap-1 h-5">
                {[2, 3, 4, 3, 5].map((h, j) => (
                  <Skeleton key={j} className="w-1.5 rounded-xs" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-sm" />
            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* Split Charts: Hatched Pie + Conversion Funnel */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <Skeleton className="h-56 w-full rounded-md" />
        </div>
        <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <Skeleton className="h-56 w-full rounded-md" />
        </div>
      </div>

      {/* Vector Regional Map Skeleton */}
      <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
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
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading organization workspace" role="status">
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
      <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
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
          <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
            <Skeleton className="h-4 w-28 rounded-sm" />
            <Skeleton className="h-8 w-20 rounded-sm" />
            <Skeleton className="h-3.5 w-36 rounded-xs" />
          </div>
        ))}
      </div>

      {/* Member Directory Table Skeleton */}
      <div className="rounded-md border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-5 w-44 rounded-sm" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-sm" />
            <Skeleton className="h-8 w-36 rounded-sm" />
          </div>
        </div>

        <div className="divide-y divide-border/60 border-t border-border/80 pt-2">
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

/** Table Page Full Skeleton: header, filter toolbar, 8-row table, pagination */
export function TablePageSkeleton() {
  return (
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading data table" role="status">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 md:w-64 rounded-md" />
          <Skeleton className="h-4 w-44 md:w-72 rounded-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-md border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <Skeleton className="h-9 w-full rounded-sm" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
        </div>
      </div>

      {/* Full Data Table */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        {/* Table Header Row */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-surface/50">
          <Skeleton className="h-4 w-32 rounded-xs" />
          <Skeleton className="h-4 w-28 rounded-xs hidden md:block" />
          <Skeleton className="h-4 w-24 rounded-xs hidden lg:block" />
          <Skeleton className="h-4 w-20 rounded-xs" />
          <Skeleton className="h-4 w-16 rounded-xs" />
        </div>

        {/* 8 Table Rows */}
        <div className="divide-y divide-border/60">
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
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card">
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
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading settings" role="status">
      {/* Breadcrumb & Title */}
      <div className="space-y-3 pb-2">
        <Skeleton className="h-4 w-36 rounded-xs" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-60 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <Skeleton className="h-8 w-24 rounded-sm" />
        <Skeleton className="h-8 w-24 rounded-sm" />
        <Skeleton className="h-8 w-24 rounded-sm" />
      </div>

      {/* Form Card */}
      <div className="rounded-md border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
    <div className="skeleton-page space-y-6 w-full min-w-0 max-w-full" aria-label="Loading items" role="status">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 md:w-72 rounded-md" />
          <Skeleton className="h-4 w-40 md:w-80 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Search Bar */}
      <div className="rounded-md border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>

      {/* 6-8 Responsive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32 rounded-xs" />
                <Skeleton className="h-3 w-20 rounded-xs" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xs" />
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
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
          <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
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
        <div className="lg:col-span-2 rounded-md border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-sm" />
            <Skeleton className="h-8 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-64 w-full rounded-md" />
        </div>

        <div className="rounded-md border border-border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-36 rounded-sm" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 pb-2 border-b border-border/40 last:border-0">
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

/** Curriculum & Lessons Full-Page Skeleton */
export function CurriculumSkeleton() {
  return (
    <div className="skeleton-page space-y-6 py-2" aria-label="Loading curriculum" role="status">
      <div className="rounded-md border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-5 w-24 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-3/4 max-w-xl rounded-md" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-xs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48 md:w-64 rounded-sm" />
                <Skeleton className="h-4 w-16 rounded-xs" />
              </div>
              <div className="pl-6 space-y-2 pt-1">
                {Array.from({ length: 3 }, (_, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <Skeleton className="h-4 w-40 md:w-56 rounded-xs" />
                    <Skeleton className="h-6 w-16 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border bg-card p-6 shadow-sm space-y-4 h-fit">
          <Skeleton className="h-6 w-36 rounded-sm" />
          <Skeleton className="h-4 w-full rounded-xs" />
          <Skeleton className="h-4 w-4/5 rounded-xs" />
          <div className="pt-4 border-t border-border space-y-3">
            <Skeleton className="h-5 w-28 rounded-xs" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lab Workspace Full-Page Skeleton */
export function LabWorkspaceSkeleton() {
  return (
    <div className="skeleton-page py-2 h-[calc(100vh-6rem)] space-y-4" aria-label="Loading lab workspace" role="status">
      <div className="rounded-md border border-border bg-card px-5 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-sm" />
          <Skeleton className="h-6 w-48 rounded-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-24 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-5 rounded-md border border-border bg-card p-5 shadow-sm space-y-4 overflow-y-auto">
          <Skeleton className="h-6 w-36 rounded-sm" />
          <Skeleton className="h-4 w-full rounded-xs" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-sm border border-border/60 p-4 space-y-2 bg-paper">
                <Skeleton className="h-4 w-40 rounded-xs" />
                <Skeleton className="h-3 w-full rounded-xs" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-md border border-border bg-[#14140F] p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-border/20">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="space-y-2 font-mono pt-2">
              <div className="h-3.5 w-60 rounded-xs bg-white/30" />
              <div className="h-3.5 w-80 rounded-xs bg-white/20" />
              <div className="h-3.5 w-44 rounded-xs bg-white/20" />
            </div>
          </div>
          <div className="pt-4 border-t border-border/20 flex items-center justify-between">
            <div className="h-3 w-32 rounded-xs bg-white/20" />
            <div className="h-7 w-24 rounded-sm bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Homepage Full-Page Skeleton: SiteHeader mockup, centered hero with badge, headline lines, CTA buttons, terminal product frame, proof band, feature cards grid, and footer */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" aria-label="Loading homepage" role="status">
      {/* SiteHeader Skeleton */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
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

      {/* Hero Section Skeleton */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center flex flex-col items-center">
          <Skeleton className="h-6 w-36 rounded-md mb-6" />
          <Skeleton className="h-12 w-4/5 max-w-2xl rounded-md mb-3" />
          <Skeleton className="h-12 w-3/5 max-w-lg rounded-md mb-6" />
          <Skeleton className="h-5 w-full max-w-xl rounded-sm mb-8" />
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Skeleton className="h-11 w-44 rounded-md" />
            <Skeleton className="h-11 w-40 rounded-md" />
          </div>

          {/* Product Frame / Terminal Preview Mockup */}
          <div className="w-full max-w-4xl rounded-md border border-border bg-[#14140F] shadow-xl overflow-hidden text-left">
            <div className="h-10 bg-white/5 border-b border-white/10 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-xs bg-white/15" />
                <Skeleton className="h-5 w-28 rounded-xs bg-white/10" />
              </div>
              <Skeleton className="h-4 w-16 rounded-xs bg-white/10" />
            </div>
            <div className="p-6 space-y-3 font-mono">
              <Skeleton className="h-3.5 w-72 rounded-xs bg-white/25" />
              <Skeleton className="h-3.5 w-96 rounded-xs bg-white/15" />
              <Skeleton className="h-3.5 w-64 rounded-xs bg-white/15" />
              <Skeleton className="h-3.5 w-80 rounded-xs bg-white/20" />
              <Skeleton className="h-3.5 w-52 rounded-xs bg-white/15" />
            </div>
          </div>
        </section>

        {/* Proof / Metrics Strip */}
        <section className="border-y border-border bg-card/40 py-10">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-8 w-24 rounded-sm" />
                <Skeleton className="h-3.5 w-32 rounded-xs" />
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <Skeleton className="h-8 w-64 mx-auto rounded-md" />
            <Skeleton className="h-4 w-full rounded-xs" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-6 shadow-sm space-y-4">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="h-5 w-40 rounded-sm" />
                <Skeleton className="h-4 w-full rounded-xs" />
                <Skeleton className="h-4 w-5/6 rounded-xs" />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-xs" />
              <Skeleton className="h-3 w-32 rounded-xs" />
              <Skeleton className="h-3 w-28 rounded-xs" />
              <Skeleton className="h-3 w-36 rounded-xs" />
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

/** Public Subpage Skeleton: Header mockup, breadcrumb/tag, title, subtitle, content grid, and footer */
export function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" aria-label="Loading page" role="status">
      {/* Header Skeleton */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
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
            <div key={i} className="rounded-md border border-border bg-card p-6 shadow-sm space-y-4">
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
      <footer className="border-t border-border bg-card py-8">
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
