import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from '@/shared/components';
import { useAdminTracks } from '@/features/labs/hooks';
import {
  CurriculumInlineTree,
  type CurriculumInlineTreeBaseProps,
  type InlineTreeRoot,
} from './CurriculumInlineTree';

interface CurriculumTracksTabProps {
  /** Shared inline-tree data + actions provided by the master panel. */
  tree: CurriculumInlineTreeBaseProps;
  onNewTrack: () => void;
}

type TrackSort = 'name-asc' | 'name-desc' | 'hours-desc' | 'status';

function TrackListSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading tracks">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-16 rounded-sm" />
      ))}
    </div>
  );
}

/**
 * Tracks tab: every track as an expandable inline root. Expanding a track
 * lazy-loads its linked content (courses/labs); expanding a linked course
 * reveals its modules and — for the canonical course — their items. Track
 * create/edit, publish state and "attach existing course" live here.
 */
export function CurriculumTracksTab({ tree, onNewTrack }: CurriculumTracksTabProps) {
  const tracksQuery = useAdminTracks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sort, setSort] = useState<TrackSort>('name-asc');

  const tracks = useMemo(() => tracksQuery.data ?? [], [tracksQuery.data]);

  const visibleTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tracks.filter((track) => {
      if (statusFilter === 'published' && !track.isActive) return false;
      if (statusFilter === 'draft' && track.isActive) return false;
      if (query) {
        return (
          track.trackName.toLowerCase().includes(query) || track.slug.toLowerCase().includes(query)
        );
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name-desc':
          return b.trackName.localeCompare(a.trackName);
        case 'hours-desc':
          return b.estimatedHours - a.estimatedHours;
        case 'status':
          return Number(b.isActive) - Number(a.isActive);
        default:
          return a.trackName.localeCompare(b.trackName);
      }
    });
    return sorted;
  }, [tracks, search, statusFilter, sort]);

  const roots: InlineTreeRoot[] = useMemo(
    () => visibleTracks.map((track) => ({ kind: 'track' as const, track })),
    [visibleTracks],
  );

  if (tracksQuery.isLoading) {
    return <TrackListSkeleton />;
  }

  if (tracksQuery.isError) {
    return (
      <ErrorState
        title="Could not load tracks"
        message={tracksQuery.error.message}
        onRetry={() => void tracksQuery.refetch()}
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Tracks</h2>
          <p className="text-xs text-muted">
            Expand a track to inspect its linked courses, modules and items.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewTrack}>
          + New Track
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <Input
          placeholder="Search track name or slug…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="text-xs"
        />
        <select
          aria-label="Filter by track status"
          className="filter-input h-9 shrink-0 text-xs"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | 'published' | 'draft')}
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          aria-label="Sort tracks"
          className="filter-input h-9 shrink-0 text-xs"
          value={sort}
          onChange={(event) => setSort(event.target.value as TrackSort)}
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="hours-desc">Most hours</option>
          <option value="status">Published first</option>
        </select>
        {search || statusFilter !== 'all' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          title="No tracks yet"
          description="Create the first track, then attach existing courses to build its hierarchy."
          action={
            <Button variant="primary" size="sm" onClick={onNewTrack}>
              + New Track
            </Button>
          }
        />
      ) : visibleTracks.length === 0 ? (
        <EmptyState
          title="No tracks match the current filters"
          description="Clear the search or status filter to see every track."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <CurriculumInlineTree {...tree} roots={roots} />
      )}
    </Card>
  );
}

export default CurriculumTracksTab;
