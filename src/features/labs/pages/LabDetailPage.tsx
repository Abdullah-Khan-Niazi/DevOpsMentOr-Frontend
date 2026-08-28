import '../styles/labs.css';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { InstanceStatusWidget } from '../components/InstanceStatusWidget';
import {
  useActiveInstance,
  useLabCatalog,
  useLabDetail,
  useProvisionInstance,
  useStopInstance,
  useTerminateInstance,
} from '../hooks';
import type { LabDetailDto, VpnRegion } from '../types';
import { CommentThread } from '@/features/community';
import { ReviewSection } from '@/features/community';

/**
 * SCR-F6-01: lab detail with description, requirements and Start Lab.
 * F8 boundary exception (user-approved): embeds SCR-F8-05 reviews and
 * SCR-F8-06 comments for the lab.
 */
export function LabDetailPage() {
  const { labSlug } = useParams<{ labSlug: string }>();
  const navigate = useNavigate();
  const [region, setRegion] = useState<VpnRegion>('US');

  const catalog = useLabCatalog();
  const catalogLab = catalog.data?.find((lab) => lab.slug === labSlug);
  const labId = catalogLab?.labId;

  const detail = useLabDetail(String(labId ?? ''), labId !== undefined);
  const active = useActiveInstance(labId !== undefined);
  const provision = useProvisionInstance();
  const stop = useStopInstance();
  const terminate = useTerminateInstance();

  const lab = detail.data ?? catalogLab;

  const startLab = (): void => {
    if (!lab) {
      return;
    }
    provision.mutate(
      { labId: lab.labId, region },
      {
        onSuccess: () => {
          toast.success('Lab instance provisioned.');
          navigate(ROUTES.LAB_SESSION.replace(':labSlug', lab.slug));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (catalog.isLoading || detail.isLoading || active.isLoading) {
    return <LoadingState />;
  }
  if (catalog.isError || detail.isError || !lab) {
    return (
      <ErrorState
        title="Lab unavailable"
        message={detail.error?.message ?? 'This lab does not exist or is inactive.'}
        onRetry={() => {
          void catalog.refetch();
          void detail.refetch();
        }}
      />
    );
  }

  const proLab = (lab as LabDetailDto).proLab;
  const checkpointCount = proLab?.checkpoints.length ?? 0;

  return (
    <div className="lab-detail">
      <PageHeader title={lab.labName} description={lab.description ?? 'No description provided.'} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <dl className="lab-detail__meta">
            <div>
              <dt>Difficulty</dt>
              <dd>{lab.difficultyName ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd className="lab-detail__type">{lab.labType.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{lab.categoryName ?? 'Uncategorized'}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{lab.estimatedHours} hrs</dd>
            </div>
            {proLab && (
              <>
                <div>
                  <dt>Machines</dt>
                  <dd>{proLab.totalMachines}</dd>
                </div>
                <div>
                  <dt>Checkpoints</dt>
                  <dd>{checkpointCount}</dd>
                </div>
              </>
            )}
            {lab.isPremium && (
              <div>
                <dt>Access</dt>
                <dd className="lab-detail__premium">Premium</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="lab-detail__actions">
          <h3 className="lab-detail__actions-title">Start session</h3>
          {active.data ? (
            <>
              <InstanceStatusWidget
                instance={active.data}
                isBusy={stop.isPending || terminate.isPending}
                onStop={(instanceId) =>
                  stop.mutate(instanceId, {
                    onError: (error) => toast.error(error.message),
                  })
                }
                onTerminate={(instanceId) =>
                  terminate.mutate(instanceId, {
                    onError: (error) => toast.error(error.message),
                  })
                }
              />
              <Link
                className="lab-detail__continue"
                to={ROUTES.LAB_SESSION.replace(':labSlug', lab.slug)}
              >
                Open active session →
              </Link>
            </>
          ) : (
            <>
              <label className="input-label" htmlFor="vpn-region">
                VPN region
              </label>
              <select
                id="vpn-region"
                className="input-field"
                value={region}
                onChange={(e) => setRegion(e.target.value as VpnRegion)}
              >
                {(['US', 'EU', 'ASIA', 'AUSTRALIA', 'SOUTH_AMERICA', 'AFRICA'] as VpnRegion[]).map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
              <Button
                className="lab-detail__start"
                onClick={startLab}
                isLoading={provision.isPending}
                disabled={provision.isPending}
              >
                Start Lab
              </Button>
              {lab.labType === 'sherlock' && (
                <Link
                  className="lab-detail__diagnostic"
                  to={ROUTES.SHERLOCK_DIAGNOSTIC.replace(':labSlug', lab.slug)}
                >
                  Or open the diagnostic → (no instance required)
                </Link>
              )}
            </>
          )}
        </Card>
      </div>

      <ReviewSection targetType="lab" targetId={lab.labId} />
      <CommentThread targetType="lab" targetId={lab.labId} />
    </div>
  );
}

export default LabDetailPage;
