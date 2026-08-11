/** USR-01: own session identity (mirrors F1 /auth/me). */
export interface MeProfile {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
}

/** USR-02: profile UPSERT response. */
export interface ProfileResponse {
  userId: number;
  fullName: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  country: CountryRef | null;
}

export interface CountryRef {
  countryId: number;
  countryName: string;
}

/** USR-02 request body. */
export interface UpdateProfilePayload {
  fullName?: string;
  displayName?: string | null;
  bio?: string | null;
  countryId?: number | null;
  city?: string | null;
  occupation?: string | null;
  company?: string | null;
  website?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  discordUsername?: string | null;
  isPublic?: boolean;
  timezone?: string;
  language?: string;
}

export interface UploadResponse {
  avatarUrl?: string;
  coverPhotoUrl?: string;
}

/** USR-05/06/07: user skill mapping. */
export interface UserSkill {
  skillId: number;
  skillName: string;
  category: SkillCategory;
  proficiencyLevel: ProficiencyLevel;
  yearsExperience: number;
  isVerified: boolean;
}

/** USR-13: skills catalog entry. */
export interface SkillCatalogItem {
  skillId: number;
  skillName: string;
  category: SkillCategory;
  description: string | null;
}

/** USR-14: countries catalog entry. */
export interface Country {
  countryId: number;
  countryCode: string;
  countryName: string;
  phoneCode: string | null;
  flagEmoji: string | null;
}

/** USR-08/09: user settings key/value pair. */
export interface UserSetting {
  settingKey: string;
  settingValue: unknown;
}

/** USR-10: public profile view. */
export interface PublicProfile {
  userId: number;
  username: string;
  fullName: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
  occupation: string | null;
  city: string | null;
  company: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  discordUsername: string | null;
  country: CountryRef | null;
  isPublic: boolean;
  skills: UserSkill[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowResponse {
  isFollowing: boolean;
}

/** USR-11/12: profile of the target user (Internet profile compound). */
export type FollowActionResponse = FollowResponse;

export type SkillCategory =
  | 'offensive'
  | 'defensive'
  | 'forensics'
  | 'networking'
  | 'web'
  | 'mobile'
  | 'cloud'
  | 'ai_ml'
  | 'governance';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
