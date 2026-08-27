import '../styles/gamification-admin.css';
import { useState } from 'react';
import { Button, Card, ConfirmDialog, Input, PageHeader, toast } from '@/shared/components';
import {
  useAdjustPoints,
  useInvalidateCertificate,
  useRecomputeLeaderboard,
} from '../hooks/useAdminGamification';

interface AdjustDraft {
  targetUserId: string;
  pointsChange: string;
  description: string;
}

/** SCR-F7-06: admin gamification dashboard — manual adjustments and oversight. */
export function AdminGamificationPage() {
  const [draft, setDraft] = useState<AdjustDraft>({
    targetUserId: '',
    pointsChange: '',
    description: '',
  });
  const [invalidateId, setInvalidateId] = useState('');
  const [confirmInvalidate, setConfirmInvalidate] = useState(false);
  const [confirmRecompute, setConfirmRecompute] = useState(false);

  const adjust = useAdjustPoints();
  const invalidate = useInvalidateCertificate();
  const recompute = useRecomputeLeaderboard();

  const submitAdjustment = (): void => {
    const targetUserId = Number(draft.targetUserId);
    const pointsChange = Number(draft.pointsChange);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      toast.error('Enter a valid user ID.');
      return;
    }
    if (!Number.isInteger(pointsChange) || pointsChange === 0) {
      toast.error('Points change must be a non-zero integer.');
      return;
    }
    if (draft.description.trim().length < 5) {
      toast.error('Description must be at least 5 characters.');
      return;
    }
    adjust.mutate(
      { targetUserId, pointsChange, description: draft.description.trim() },
      {
        onSuccess: (result) => {
          toast.success(`Adjustment applied. New balance: ${result.newBalance} pts`);
          setDraft({ targetUserId: '', pointsChange: '', description: '' });
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string }).message ?? 'Could not apply the adjustment.');
        },
      },
    );
  };

  const confirmInvalidateNow = (): void => {
    const certId = Number(invalidateId);
    if (!Number.isInteger(certId) || certId <= 0) {
      toast.error('Enter a valid certificate ID.');
      setConfirmInvalidate(false);
      return;
    }
    invalidate.mutate(certId, {
      onSuccess: () => {
        toast.success('Certificate invalidated.');
        setInvalidateId('');
        setConfirmInvalidate(false);
      },
      onError: (err: unknown) => {
        toast.error(
          (err as { message?: string }).message ?? 'Could not invalidate the certificate.',
        );
        setConfirmInvalidate(false);
      },
    });
  };

  const confirmRecomputeNow = (): void => {
    recompute.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(
          `Leaderboard recomputed. ${result.processedUsers} user${result.processedUsers === 1 ? '' : 's'}, ${result.snapshotRows} history row${result.snapshotRows === 1 ? '' : 's'}.`,
        );
        setConfirmRecompute(false);
      },
      onError: (err: unknown) => {
        toast.error(
          (err as { message?: string }).message ?? 'Could not recompute the leaderboard.',
        );
        setConfirmRecompute(false);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Gamification"
        description="Manual point adjustments, certificate oversight and leaderboard operations."
      />

      <div className="gamification-admin__grid">
        <Card className="gamification-admin__card">
          <h2 className="gamification-admin__title">Adjust points</h2>
          <p className="gamification-admin__note">
            Record a manual points change for a learner. Corrections are ledger entries, so every
            adjustment is permanent.
          </p>
          <Input
            label="User ID"
            name="targetUserId"
            type="number"
            placeholder="42"
            value={draft.targetUserId}
            onChange={(e) => setDraft({ ...draft, targetUserId: e.target.value })}
          />
          <Input
            label="Points change"
            name="pointsChange"
            type="number"
            placeholder="-25 or +100"
            value={draft.pointsChange}
            onChange={(e) => setDraft({ ...draft, pointsChange: e.target.value })}
          />
          <Input
            label="Description"
            name="description"
            placeholder="Reason for the adjustment"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <div className="gamification-admin__actions">
            <Button onClick={submitAdjustment} isLoading={adjust.isPending}>
              Apply adjustment
            </Button>
          </div>
        </Card>

        <Card className="gamification-admin__card">
          <h2 className="gamification-admin__title">Invalidate certificate</h2>
          <p className="gamification-admin__note">
            Mark a certificate as no longer valid. Verification requests will still return the
            holder details but report the certificate as invalid.
          </p>
          <Input
            label="Certificate ID"
            name="certId"
            type="number"
            placeholder="12"
            value={invalidateId}
            onChange={(e) => setInvalidateId(e.target.value)}
          />
          <div className="gamification-admin__actions">
            <Button variant="danger" onClick={() => setConfirmInvalidate(true)}>
              Invalidate certificate
            </Button>
          </div>
        </Card>

        <Card className="gamification-admin__card">
          <h2 className="gamification-admin__title">Recompute leaderboard</h2>
          <p className="gamification-admin__note">
            Recalculate global standings from the points ledger immediately instead of waiting for
            the scheduled run. This also writes a leaderboard history snapshot.
          </p>
          <div className="gamification-admin__actions">
            <Button variant="secondary" onClick={() => setConfirmRecompute(true)}>
              Recompute now
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmInvalidate}
        title="Invalidate certificate"
        message="This permanently marks the certificate as invalid and cannot be undone."
        confirmLabel="Invalidate"
        isLoading={invalidate.isPending}
        onCancel={() => setConfirmInvalidate(false)}
        onConfirm={confirmInvalidateNow}
      />
      <ConfirmDialog
        open={confirmRecompute}
        title="Recompute global leaderboard"
        message="Recompute standings for all learners now?"
        confirmLabel="Recompute"
        isLoading={recompute.isPending}
        onCancel={() => setConfirmRecompute(false)}
        onConfirm={confirmRecomputeNow}
      />
    </div>
  );
}

export default AdminGamificationPage;
