import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  TabRow,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useClassDetail, useOrgProfessors } from '../hooks';
import { ProfessorAssignmentSelector } from '../components';

type LocalTab = 'overview' | 'settings';

/** F3 contract §10 SCR-F3-06: class detail with sliding-underline tab row. */
export function OrgClassDetailPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const canManage = useAuthStore((state) =>
    (state.user?.permissions ?? []).some(
      (permission) => permission === 'org:classes:manage' || permission === 'class:manage',
    ),
  );

  const [localTab, setLocalTab] = useState<LocalTab>('overview');
  const { query: detail, update, assignProfessor } = useClassDetail(classId);
  const professors = useOrgProfessors();

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editing, setEditing] = useState(false);

  const rosterPath = ROUTES.ORG_CLASS_ROSTER.replace(':classId', classId);
  const invitePath = ROUTES.ORG_CLASS_INVITE.replace(':classId', classId);

  const activeTab =
    location.pathname === rosterPath
      ? 'students'
      : location.pathname === invitePath
        ? 'invitations'
        : localTab;

  const onTabChange = (tab: string) => {
    if (tab === 'students') {
      navigate(rosterPath);
      return;
    }
    if (tab === 'invitations') {
      navigate(invitePath);
      return;
    }
    setLocalTab(tab as LocalTab);
  };

  if (detail.isLoading) {
    return (
      <div>
        <PageHeader title="Class" />
        <LoadingState label="Loading class…" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div>
        <PageHeader title="Class" />
        <ErrorState
          message={detail.error?.message ?? 'Unable to load this class.'}
          onRetry={() => void detail.refetch()}
        />
      </div>
    );
  }

  const klass = detail.data;

  const startEditing = () => {
    setEditName(klass.className);
    setEditDesc(klass.description ?? '');
    setEditMax(String(klass.maxStudents));
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      toast.error('Class name is required.');
      return;
    }
    update.mutate(
      {
        className: editName.trim(),
        description: editDesc.trim() || null,
        maxStudents: editMax ? Number(editMax) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Class updated.');
          setEditing(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title={klass.className}
        description={
          klass.professorName ? `Professor: ${klass.professorName}` : 'No professor assigned yet.'
        }
      />

      <div className="mb-5">
        <TabRow
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'students', label: 'Students' },
            { id: 'invitations', label: 'Invitations' },
            { id: 'settings', label: 'Settings' },
          ]}
          activeId={activeTab}
          onChange={onTabChange}
        />
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-medium text-slate-900">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Slug</dt>
                <dd className="text-slate-900">{klass.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Max students</dt>
                <dd className="text-slate-900">{klass.maxStudents}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Enrolled</dt>
                <dd className="text-slate-900">{klass.studentCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-900">{new Date(klass.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate-600">{klass.description || 'No description.'}</p>
          </Card>

          <Card className="p-5">
            <h3 className="font-medium text-slate-900">Professor assignment</h3>
            <div className="mt-3">
              {canManage ? (
                <ProfessorAssignmentSelector
                  professors={professors.query.data ?? []}
                  currentProfessorUserId={klass.professorUserId}
                  submitting={assignProfessor.isPending}
                  onAssign={(professorUserId) =>
                    assignProfessor.mutate(professorUserId, {
                      onSuccess: () => toast.success('Professor assigned.'),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                />
              ) : (
                <p className="text-sm text-slate-600">
                  {klass.professorName ?? 'No professor assigned yet.'}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card className="max-w-2xl space-y-4 p-6">
          <h3 className="font-medium text-slate-900">Class settings</h3>
          {canManage ? (
            editing ? (
              <>
                <Input
                  label="Class name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <div>
                  <label htmlFor="class-edit-desc" className="input-label">
                    Description
                  </label>
                  <textarea
                    id="class-edit-desc"
                    rows={3}
                    className="input-field w-full"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <Input
                  label="Max students"
                  type="number"
                  min={1}
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={saveEdit} isLoading={update.isPending}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="secondary" onClick={startEditing}>
                Edit details
              </Button>
            )
          ) : (
            <p className="text-sm text-slate-500">You do not have permission to edit this class.</p>
          )}
        </Card>
      )}
    </div>
  );
}

export default OrgClassDetailPage;
