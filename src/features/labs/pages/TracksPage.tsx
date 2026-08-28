import '../styles/labs.css';
import { Link } from 'react-router-dom';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth';
import { useTrackProgressBatch, useTracks } from '../hooks';

/** LAB-13: track catalog — ordered learning paths over labs and courses. */
export function TracksPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = user !== null;
  const { data, isLoading, isError, error, refetch } = useTracks();

  const trackIds = (data ?? []).map((track) => String(track.trackId));
  const progressQueries = useTrackProgressBatch(isAuthenticated ? trackIds : []);

  if (isLoading) {
    return <LoadingState />;
  }
  if (isError) {
    return (
      <ErrorState
        title="Could not load tracks"
        message={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  const tracks = data ?? [];
  if (tracks.length === 0) {
    return (
      <div>
        <PageHeader title="Tracks" description="Guided learning paths." />
        <EmptyState
          title="No tracks available"
          description="Check back soon for new learning tracks."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tracks"
        description="Follow a structured path: complete the required labs and courses in order."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track, index) => {
          const progress = isAuthenticated ? progressQueries[index]?.data : undefined;
          const pct = progress?.progressPercentage ?? 0;
          const completed = progress?.completedItems ?? 0;
          const total = progress?.totalItems ?? 0;
          return (
            <Card key={track.trackId} className="track-card">
              <div className="track-card__badges">
                <span className="lab-card__badge">{track.difficultyName ?? 'Any'}</span>
                {track.isPremium && <span className="lab-card__badge">Premium</span>}
                {isAuthenticated && (
                  <span className="lab-card__badge">
                    {completed} of {total} · {pct}%
                  </span>
                )}
              </div>
              <h3 className="track-card__title">{track.trackName}</h3>
              <p className="track-card__description">
                {track.description ?? 'No description provided.'}
              </p>
              <div className="track-card__meta">
                <span>{track.totalLabs} labs</span>
                <span>{track.categoryName ?? 'Uncategorized'}</span>
              </div>
              <Link
                className="btn btn--primary btn--md track-card__cta"
                to={ROUTES.TRACK_DETAIL.replace(':trackId', String(track.trackId))}
              >
                View track
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default TracksPage;
