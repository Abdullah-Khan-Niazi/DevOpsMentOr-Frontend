import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { resolveAssetUrl } from '../services';
import type { PublicProfile } from '../types';

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwn: boolean;
}

export function ProfileHeader({ profile, isOwn }: ProfileHeaderProps) {
  const avatar = resolveAssetUrl(profile.avatarUrl);
  const cover = resolveAssetUrl(profile.coverPhotoUrl);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {cover ? (
        <div
          className="h-28 w-full bg-cover bg-center sm:h-36"
          style={{ backgroundImage: `url(${cover})` }}
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
            <Link
              to={ROUTES.PROFILE_EDIT}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-border"
            >
              Edit profile
            </Link>
          ) : null}
        </div>

        <h1 className="mt-3 text-xl font-semibold text-card-foreground">
          {profile.displayName ?? profile.fullName ?? profile.username}
        </h1>
        <p className="text-sm text-muted">
          @{profile.username}
          {profile.occupation ? ` · ${profile.occupation}` : ''}
          {profile.company ? ` at ${profile.company}` : ''}
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
          {profile.website ? (
            <a
              href={profile.website}
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
