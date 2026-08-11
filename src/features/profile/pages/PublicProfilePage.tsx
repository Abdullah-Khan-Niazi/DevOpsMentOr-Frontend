import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ErrorState, PageHeader, Spinner } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { usePublicProfile } from '../hooks';
import { FollowButton, ProfileHeader } from '../components';
import type { UserSkill } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  offensive: 'Offensive security',
  defensive: 'Defensive security',
  forensics: 'Forensics',
  networking: 'Networking',
  web: 'Web',
  mobile: 'Mobile',
  cloud: 'Cloud',
  ai_ml: 'AI/ML',
  governance: 'Governance & compliance',
};

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const authed = useAuthStore((state) => state.isAuthenticated);
  const id = Number(userId);

  const { profile, isLoading, isError, error, isOwnProfile } = usePublicProfile(
    Number.isFinite(id) ? id : 0,
  );

  if (!Number.isFinite(id) || id < 1) {
    return <ErrorState message="Invalid profile URL." onRetry={() => navigate('/')} />;
  }

  if (isError) {
    const message = error?.statusCode === 403 ? 'This profile is private.' : error?.message;
    return (
      <ErrorState
        message={message ?? 'Unable to load this profile.'}
        onRetry={() => navigate('/')}
      />
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading profile…" />
      </div>
    );
  }

  const grouped = groupSkills(profile.skills);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        description={`@${profile.username}`}
        actions={
          authed ? (
            <FollowButton
              userId={profile.userId}
              isFollowing={profile.isFollowing}
              isOwn={isOwnProfile}
            />
          ) : null
        }
      />
      <ProfileHeader profile={profile} isOwn={isOwnProfile} />

      {profile.skills.length > 0 ? (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-card-foreground">Skills</h2>
          <div className="space-y-3">
            {[...grouped.entries()].map(([category, skills]) => (
              <div key={category}>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {CATEGORY_LABELS[category] ?? category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
                    >
                      {skill.skillName}
                      <span className="text-xs text-muted-foreground">
                        {skill.proficiencyLevel}
                        {skill.yearsExperience > 0 ? ` · ${skill.yearsExperience}y` : ''}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {!isOwnProfile ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function groupSkills(skills: UserSkill[]): Map<string, UserSkill[]> {
  const groups = new Map<string, UserSkill[]>();
  for (const skill of skills) {
    const arr = groups.get(skill.category) ?? [];
    arr.push(skill);
    groups.set(skill.category, arr);
  }
  return groups;
}
