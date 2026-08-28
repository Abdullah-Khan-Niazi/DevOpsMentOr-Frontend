import '../styles/labs.css';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useLabCatalog, useTrackDetail, useTrackProgress } from '../hooks';
import type { TrackProgressItemDto } from '../types';

/** LAB-14/LAB-15: track detail with item checklist and live progress. */
export function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();

  const detail = useTrackDetail(trackId ?? '', Boolean(trackId));
  const progress = useTrackProgress(trackId ?? '', Boolean(trackId));
  const catalog = useLabCatalog(Boolean(trackId));

  if (detail.isLoading || progress.isLoading || catalog.isLoading) {
    return <LoadingState />;
  }
  const track = detail.data;
  if (detail.isError || !track || catalog.isError) {
    return (
      <ErrorState
        title="Track unavailable"
        message={detail.error?.message ?? 'This track does not exist.'}
        onRetry={() => void detail.refetch()}
      />
    );
  }

  const progressData = progress.data;
  const pct = progressData?.progressPercentage ?? 0;
  const completed = progressData?.completedItems ?? 0;
  const total = progressData?.totalItems ?? track.items.length;

  return (
    <div className="track-detail">
      <PageHeader
        title={track.trackName}
        description={track.description ?? 'No description provided.'}
      />

      <Card className="track-detail__progress">
        <div className="track-detail__progress-row">
          <span>
            {completed} of {total} items completed
          </span>
          <span>{pct}%</span>
        </div>
        <div className="track-detail__progress-bar" aria-label="Track progress">
          <div className="track-detail__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {progressData?.isCompleted && (
          <p className="track-detail__complete">Track completed — well done!</p>
        )}
      </Card>

      <Card>
        <ol className="track-detail__items">
          {track.items.map((item: TrackProgressItemDto) => {
            const labSlug = catalog.data?.find((l) => l.labId === item.contentId)?.slug;
            const to =
              item.contentType === 'lab'
                ? labSlug
                  ? ROUTES.LAB_DETAIL.replace(':labSlug', labSlug)
                  : ROUTES.LABS
                : ROUTES.LEARN; // course content opens the learner curriculum
            return (
              <li key={`${item.contentType}-${item.contentId}`} className="track-detail__item">
                <span
                  className={`track-detail__item-check${item.completed ? ' is-complete' : ''}`}
                  aria-hidden="true"
                >
                  {item.completed ? '✓' : '○'}
                </span>
                <Link className="track-detail__item-link" to={to}>
                  {item.title}
                </Link>
                <span className="track-detail__item-type">
                  {item.contentType === 'lab' ? 'Lab' : 'Course'}
                  {item.required ? ' · Required' : ''}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

export default TrackDetailPage;
