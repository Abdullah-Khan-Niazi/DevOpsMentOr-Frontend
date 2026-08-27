import { Card, ErrorState, PageHeader, Spinner } from '@/shared/components';
import { useMyProfile } from '../hooks';
import { MediaUpload, ProfileForm, SkillsManager } from '../components';

export default function EditProfilePage() {
  const { me, profile, isLoading, isError, error } = useMyProfile();

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Unable to load your profile.'}
        onRetry={() => undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit profile"
        description="Your public profile and preferences — shown to other users on the platform."
      />

      {isLoading || !me || !profile ? (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Loading profile…" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
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
      )}
    </div>
  );
}
