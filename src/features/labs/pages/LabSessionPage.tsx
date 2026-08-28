import '../styles/labs.css';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Button, ErrorState, LoadingState, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { AssertionChecklist } from '../components/AssertionChecklist';
import { LabShell } from '../components/LabShell';
import {
  useActiveInstance,
  useExtendInstance,
  useRunAssertions,
  useTerminateInstance,
} from '../hooks';
import type { AssertionResultDto } from '../types';

/**
 * SCR-F6-02: full-bleed session — live terminal, assertion sidebar, timer,
 * extend/terminate and the AI Mentor drawer. When no instance is active,
 * redirects to the lab detail page (§09 route guard).
 */
export function LabSessionPage() {
  const { labSlug } = useParams<{ labSlug: string }>();
  const [assertions, setAssertions] = useState<AssertionResultDto['assertions']>([]);
  const [hasRun, setHasRun] = useState(false);

  const active = useActiveInstance();
  const assertionsMutation = useRunAssertions();
  const extend = useExtendInstance();
  const terminate = useTerminateInstance();

  const instance = active.data ?? undefined;

  if (active.isLoading) {
    return <LoadingState />;
  }
  if (active.isError) {
    return (
      <ErrorState
        title="Could not load lab session"
        message={active.error.message}
        onRetry={() => void active.refetch()}
      />
    );
  }
  if (!instance) {
    return <Navigate to={ROUTES.LAB_DETAIL.replace(':labSlug', labSlug ?? '')} replace />;
  }

  const runChecks = (): void => {
    assertionsMutation.mutate(instance.instanceId, {
      onSuccess: (result) => {
        setAssertions(result.assertions);
        setHasRun(true);
        if (result.allPassed) {
          toast.success('All assertions passed — lab complete.');
        }
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <LabShell
      instance={instance}
      labSlug={labSlug ?? instance.slug}
      onTerminate={(instanceId) =>
        terminate.mutate(instanceId, {
          onError: (error) => toast.error(error.message),
        })
      }
      onExtend={(instanceId) =>
        extend.mutate(instanceId, {
          onError: (error) => toast.error(error.message),
        })
      }
      assertionSidebar={
        <div className="lab-shell__assertions">
          <div className="lab-shell__assertions-head">
            <h2>Objectives</h2>
            <Button size="sm" onClick={runChecks} isLoading={assertionsMutation.isPending}>
              {hasRun ? 'Re-run checks' : 'Run checks'}
            </Button>
          </div>
          <AssertionChecklist items={assertions} isLoading={assertionsMutation.isPending} />
        </div>
      }
    />
  );
}

export default LabSessionPage;
