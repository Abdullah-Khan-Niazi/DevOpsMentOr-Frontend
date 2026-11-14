import '../styles/labs.css';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { LabShell } from '../components/LabShell';
import {
  useActiveInstance,
  useExtendInstance,
  useRunAssertions,
  useTerminateInstance,
} from '../hooks';
import type { AssertionResultDto } from '../types';

/**
 * SCR-F6-02: DataCamp-style interactive lab session page with 2-pane split learning window.
 * When no active instance exists, redirects to the lab detail overview page.
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
          toast.success('All checkpoint assertions passed! Lab successfully completed.');
        } else {
          toast.error('Some checkpoint assertions did not pass. Check the feedback hints.');
        }
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <LabShell
      instance={instance}
      labSlug={labSlug ?? instance.slug}
      assertions={assertions}
      isChecking={assertionsMutation.isPending}
      hasRunChecks={hasRun}
      onRunChecks={runChecks}
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
    />
  );
}

export default LabSessionPage;
