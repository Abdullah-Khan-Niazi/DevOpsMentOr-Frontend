import { useState, useMemo } from 'react';
import { Button, Card, ErrorState, PageHeader, TablePageSkeleton } from '@/shared/components';
import { useAdminTracks } from '../hooks';
import { CurriculumTrackDrawer } from '@/features/curriculum/components/CurriculumTrackDrawer';
import type { AdminTrackDto } from '../types';

type SortColumn = 'trackName' | 'estimatedHours' | 'difficultyName' | 'isActive';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}
    >
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

/**
 * LAB-19/20/21: admin track management — create and edit ordered paths. The
 * create/edit form lives in the shared curriculum track drawer so this page
 * and the curriculum Tracks tab stay on one implementation.
 */
export function AdminTracksPage() {
  const { data, isLoading, isError, error, refetch } = useAdminTracks();
  const [drawer, setDrawer] = useState<{
    mode: 'create' | 'edit';
    track: AdminTrackDto | null;
  } | null>(null);

  const [sortCol, setSortCol] = useState<SortColumn>('trackName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const openCreate = (): void => {
    setDrawer({ mode: 'create', track: null });
  };

  const openEdit = (track: AdminTrackDto): void => {
    setDrawer({ mode: 'edit', track });
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filteredTracks = useMemo(() => {
    if (!data) return [];
    return data.filter((track) => {
      if (statusFilter === 'published' && !track.isActive) return false;
      if (statusFilter === 'draft' && track.isActive) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!track.trackName.toLowerCase().includes(q) && !track.slug.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [data, search, statusFilter]);

  const sortedTracks = useMemo(() => {
    const list = [...filteredTracks];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'trackName':
          valA = a.trackName.toLowerCase();
          valB = b.trackName.toLowerCase();
          break;
        case 'estimatedHours':
          valA = a.estimatedHours;
          valB = b.estimatedHours;
          break;
        case 'difficultyName':
          valA = (a.difficultyName ?? '').toLowerCase();
          valB = (b.difficultyName ?? '').toLowerCase();
          break;
        case 'isActive':
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredTracks, sortCol, sortDir]);

  if (isLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Tracks"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Track
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Could not load tracks"
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card>
          {/* Single-line filter toolbar */}
          <div className="mb-4 flex items-center gap-1.5 w-full">
            <input
              id="tracks-search"
              className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
              placeholder="Search track name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              id="tracks-status-filter"
              className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="h-7 text-caption rounded-none px-2 shrink-0 transition-transform active:scale-95"
              >
                Reset
              </Button>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border text-caption uppercase tracking-wide text-muted">
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('trackName')}
                  >
                    Track <SortIcon active={sortCol === 'trackName'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('estimatedHours')}
                  >
                    Hours <SortIcon active={sortCol === 'estimatedHours'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('difficultyName')}
                  >
                    Difficulty{' '}
                    <SortIcon active={sortCol === 'difficultyName'} direction={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('isActive')}
                  >
                    Status <SortIcon active={sortCol === 'isActive'} direction={sortDir} />
                  </th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedTracks.map((track) => (
                  <tr
                    key={track.trackId}
                    className="border-b border-border/60 last:border-0 hover:bg-surface/50 active:bg-surface-hover/60 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-card-foreground">{track.trackName}</div>
                      <div className="text-caption text-muted font-mono">/{track.slug}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {track.estimatedHours} hrs
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {track.difficultyName ?? 'Any'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs">
                      <span
                        className={
                          track.isActive ? 'font-semibold text-card-foreground' : 'text-muted'
                        }
                      >
                        {track.isActive ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(track)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CurriculumTrackDrawer
        isOpen={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        mode={drawer?.mode ?? 'create'}
        track={drawer?.track ?? null}
      />
    </div>
  );
}

export default AdminTracksPage;
