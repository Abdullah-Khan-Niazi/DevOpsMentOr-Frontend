import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ErrorState, PageHeader } from '@/shared/components';
import { PublicProfileSkeleton } from './PublicProfileSkeleton';
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

  const { profile, isLoading, isError, error, isOwnProfile, refetch, isRefetching } =
    usePublicProfile(Number.isFinite(id) ? id : 0);

  if (!Number.isFinite(id) || id < 1) {
    return <ErrorState message="Invalid profile URL." onRetry={() => navigate('/')} />;
  }

  if (isError) {
    const message = error?.statusCode === 403 ? 'This profile is private.' : error?.message;
    return (
      <ErrorState
        message={message ?? 'Unable to load this profile.'}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  }

  if (isLoading || !profile) {
    return <PublicProfileSkeleton />;
  }

  const grouped = groupSkills(profile.skills);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
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
                <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="inline-flex items-center gap-2 text-sm font-medium text-card-foreground"
                    >
                      {skill.skillName}
                      <span className="text-xs text-muted">{skill.proficiencyLevel}</span>
                      {skill.yearsExperience > 0 ? (
                        <span className="text-xs text-muted">{skill.yearsExperience}y</span>
                      ) : null}
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
