import { Card, ErrorState, PageHeader } from '@/shared/components';
import { EditProfileSkeleton } from './EditProfileSkeleton';
import { useMyProfile } from '../hooks';
import { MediaUpload, ProfileForm, SkillsManager } from '../components';

export default function EditProfilePage() {
  const { me, profile, isLoading, isError, error, refetch } = useMyProfile();

  if (isError) {
    return (
      <ErrorState message={error?.message ?? 'Unable to load your profile.'} onRetry={refetch} />
    );
  }

  if (isLoading || !me || !profile) return <EditProfileSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit profile" />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Photos</h2>
          <MediaUpload avatarUrl={profile.avatarUrl} coverPhotoUrl={profile.coverPhotoUrl} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Profile details</h2>
          <ProfileForm userId={me.userId} initial={profile} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Skills</h2>
          <SkillsManager />
        </Card>
      </div>
    </div>
  );
}
