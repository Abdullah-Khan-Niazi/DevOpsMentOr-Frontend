import '../styles/labs.css';
import { useParams } from 'react-router-dom';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { SherlockAnswerForm } from '../components/SherlockAnswerForm';
import { useLabCatalog, useLabDetail } from '../hooks';
import type { LabDetailDto } from '../types';

/** SCR-F6-03: Sherlock diagnostic — answer evidence questions without provisioning. */
export function SherlockLabPage() {
  const { labSlug } = useParams<{ labSlug: string }>();

  const catalog = useLabCatalog();
  const catalogLab = catalog.data?.find((lab) => lab.slug === labSlug);
  const labId = catalogLab?.labId;

  const detail = useLabDetail(String(labId ?? ''), labId !== undefined);
  const lab = detail.data ?? catalogLab;

  if (catalog.isLoading || detail.isLoading) {
    return <LoadingState />;
  }
  if (!lab || lab.labType !== 'sherlock' || detail.isError) {
    return (
      <ErrorState
        title="Diagnostic unavailable"
        message="This lab does not offer a Sherlock diagnostic."
        onRetry={() => void detail.refetch()}
      />
    );
  }
  const sherlock = (lab as LabDetailDto).sherlock;
  if (!sherlock) {
    return (
      <ErrorState
        title="Diagnostic unavailable"
        message="This lab does not offer a Sherlock diagnostic."
        onRetry={() => void detail.refetch()}
      />
    );
  }

  return (
    <div className="sherlock-page">
      <PageHeader
        title={`${lab.labName} — Diagnostic`}
        description="Answer the evidence questions below. No lab instance is required."
      />
      <Card>
        <div className="sherlock-page__meta">
          <span>{sherlock.questions.length} questions</span>
          <span>Requires {sherlock.requiredCorrectAnswers} correct to pass</span>
        </div>
        <SherlockAnswerForm labId={lab.labId} sherlock={sherlock} />
      </Card>
    </div>
  );
}

export default SherlockLabPage;
