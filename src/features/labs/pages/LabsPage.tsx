import '../styles/labs.css';
import { Link } from 'react-router-dom';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useLabCatalog } from '../hooks';

/** SCR-F6-01 catalog grid: cards with type, difficulty and start CTA. */
export function LabsPage() {
  const { data, isLoading, isError, error, refetch } = useLabCatalog();

  if (isLoading) {
    return <LoadingState />;
  }
  if (isError) {
    return (
      <ErrorState
        title="Could not load labs"
        message={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  const labs = data ?? [];
  if (labs.length === 0) {
    return (
      <div>
        <PageHeader title="Labs" description="Hands-on practice environments." />
        <EmptyState
          title="No labs available"
          description="Check back soon for new practice labs."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Labs"
        description="Provision a secure, isolated practice environment and work through real-world objectives."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <Card key={lab.labId} className="lab-card">
            <div className="lab-card__badges">
              <span className="lab-card__badge">{lab.labType.replace('_', ' ')}</span>
              <span className="lab-card__badge">
                {lab.isPremium ? 'Premium' : (lab.difficultyName ?? 'Any')}
              </span>
            </div>
            <h3 className="lab-card__title">{lab.labName}</h3>
            <p className="lab-card__description">{lab.description ?? 'No description provided.'}</p>
            <div className="lab-card__meta">
              <span>{lab.categoryName ?? 'Uncategorized'}</span>
              <span>{lab.estimatedHours} hrs</span>
              <span>{lab.isStarted ? 'Started' : 'Not started'}</span>
            </div>
            <Link
              className="btn btn--primary btn--md lab-card__cta"
              to={ROUTES.LAB_DETAIL.replace(':labSlug', lab.slug)}
            >
              Start Lab
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LabsPage;
