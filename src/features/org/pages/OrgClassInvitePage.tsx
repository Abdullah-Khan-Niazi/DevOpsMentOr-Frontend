import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  useClassDetail,
  useClassInvitations,
  useImportStudents,
  useInviteStudents,
} from '../hooks';
import { BulkImportPanel, InvitationStatusTable, InviteStudentsForm } from '../components';
import type { InvitationDto } from '../types';

const PAGE_SIZE = 20;

/** F3 contract §09 SCR-F3-07: student invite (CLS-07) + bulk import (CLS-08). */
export function OrgClassInvitePage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const canInvite = useAuthStore((state) =>
    (state.user?.permissions ?? []).some((permission) =>
      ['class:students:invite', 'org:students:invite'].includes(permission),
    ),
  );

  const [page, setPage] = useState(1);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const detail = useClassDetail(classId);
  const invitations = useClassInvitations(classId, { page, pageSize: PAGE_SIZE }, true);
  const invite = useInviteStudents(classId);
  const importStudents = useImportStudents(classId);

  const handleInvite = (emails: string[]) => {
    invite.mutate(emails, {
      onSuccess: (result) => {
        if (result.invited.length > 0) {
          toast.success(`${result.invited.length} invitation(s) sent.`);
        }
        result.skipped.forEach((skip) => toast.info(`${skip.email}: ${skip.reason}`));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleResend = (invitation: InvitationDto) => {
    setResendingId(invitation.invitationId);
    invite.mutate([invitation.inviteeEmail], {
      onSuccess: (result) => {
        if (result.invited.includes(invitation.inviteeEmail)) {
          toast.success('Invitation resent.');
        } else {
          const skip = result.skipped.find((s) => s.email === invitation.inviteeEmail);
          toast.info(skip ? `${skip.reason} — still pending.` : 'Invitation unchanged.');
        }
      },
      onError: (error) => toast.error(error.message),
      onSettled: () => setResendingId(null),
    });
  };

  const handleImport = (file: File) => {
    importStudents.mutate(file, {
      onSuccess: (summary) => {
        toast.success(`${summary.successCount} of ${summary.totalRows} rows imported.`);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div>
      <PageHeader
        title="Invite students"
        description={
          detail.query.data
            ? `Send enrollment invitations for ${detail.query.data.className}`
            : 'Student invites'
        }
        actions={
          <Link
            to={ROUTES.ORG_CLASS_DETAIL.replace(':classId', classId)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            ← Back to class
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div>
            <h3 className="font-medium text-slate-900">Invite by email</h3>
            <p className="mt-1 text-sm text-muted">
              One email per line or comma-separated (max 50 per call). Students must match your
              organization's email domain if restricted.
            </p>
          </div>
          {canInvite ? (
            <InviteStudentsForm submitting={invite.isPending} onSubmit={handleInvite} />
          ) : (
            <p className="text-sm text-slate-500">You do not have invite permission.</p>
          )}

          <BulkImportPanel
            submitting={importStudents.isPending}
            onImport={handleImport}
            result={importStudents.data ?? null}
          />
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <h3 className="font-medium text-slate-900">Invitation status</h3>
            <p className="mt-1 text-sm text-muted">
              Resend reminders to pending invitations; expired invites are replaced.
            </p>
          </div>
          {invitations.isError ? (
            <ErrorState
              message={invitations.error?.message ?? 'Unable to load invitations.'}
              onRetry={() => void invitations.refetch()}
            />
          ) : (
            <>
              <InvitationStatusTable
                invitations={invitations.data?.data ?? []}
                isLoading={invitations.isLoading}
                canResend={canInvite}
                resendingId={resendingId}
                onResend={handleResend}
              />
              {invitations.data ? (
                <Pagination
                  page={invitations.data.page}
                  pageSize={invitations.data.pageSize}
                  total={invitations.data.total}
                  totalPages={invitations.data.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default OrgClassInvitePage;
