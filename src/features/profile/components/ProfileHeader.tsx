import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { resolveAssetUrl } from '../services';
import type { PublicProfile } from '../types';
import { safeHttpUrl } from '@/shared/utils';

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwn: boolean;
}

export function ProfileHeader({ profile, isOwn }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const avatar = resolveAssetUrl(profile.avatarUrl);
  const cover = resolveAssetUrl(profile.coverPhotoUrl);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {cover ? (
        <div
          className="h-28 w-full bg-cover bg-center sm:h-36"
          style={{ backgroundImage: `url("${cover}")` }}
        />
      ) : (
        <div className="h-28 w-full bg-gradient-to-r from-brand-50 to-slate-100 sm:h-36" />
      )}

      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-12">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile avatar"
              className="h-20 w-20 rounded-full border-2 border-card object-cover shadow-sm sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-card bg-border text-sm text-muted shadow-sm sm:h-24 sm:w-24">
              {profile.fullName?.charAt(0) ?? profile.username.charAt(0)}
            </div>
          )}

          {isOwn ? (
            <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PROFILE_EDIT)}>
              Edit profile
            </Button>
          ) : null}
        </div>

        <h1 className="mt-3 text-xl font-semibold text-card-foreground">
          {profile.displayName ?? profile.fullName ?? profile.username}
        </h1>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted">
          <span>@{profile.username}</span>
          {profile.occupation || profile.company ? (
            <span>
              {profile.occupation ?? ''}
              {profile.company ? `${profile.occupation ? ' at ' : ''}${profile.company}` : ''}
            </span>
          ) : null}
        </p>
        {profile.city || profile.country ? (
          <p className="mt-1 text-sm text-muted">
            {[profile.city, profile.country?.countryName].filter(Boolean).join(', ')}
          </p>
        ) : null}
        {profile.bio ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-card-foreground">{profile.followersCount}</strong>{' '}
            followers
          </span>
          <span>
            <strong className="font-semibold text-card-foreground">{profile.followingCount}</strong>{' '}
            following
          </span>
          {safeHttpUrl(profile.website) ? (
            <a
              href={safeHttpUrl(profile.website) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Website
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
