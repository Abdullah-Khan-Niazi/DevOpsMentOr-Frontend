import { apiClient } from '@/shared/services';
import { ENV } from '@/shared/constants';
import type {
  Country,
  FollowResponse,
  MeProfile,
  ProfileResponse,
  PublicProfile,
  SkillCatalogItem,
  UpdateProfilePayload,
  UserSkill,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** Resolve a relative /uploads/... path to the backend origin. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const origin = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export const profileService = {
  /** USR-01 */
  async getMe(): Promise<MeProfile> {
    const { data } = await apiClient.get<{ data: MeProfile }>('/users/me');
    return unwrap(data);
  },

  /** USR-02 */
  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileResponse> {
    const { data } = await apiClient.patch<{ data: ProfileResponse }>('/users/me/profile', payload);
    return unwrap(data);
  },

  /** USR-03 */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<{ data: { avatarUrl: string } }>(
      '/users/me/avatar',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return unwrap(data);
  },

  /** USR-04 */
  async uploadCover(file: File): Promise<{ coverPhotoUrl: string }> {
    const form = new FormData();
    form.append('cover', file);
    const { data } = await apiClient.post<{ data: { coverPhotoUrl: string } }>(
      '/users/me/cover',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return unwrap(data);
  },

  /** USR-05 */
  async getMySkills(): Promise<UserSkill[]> {
    const { data } = await apiClient.get<{ data: UserSkill[] }>('/users/me/skills');
    return unwrap(data);
  },

  /** USR-06 */
  async addSkill(payload: {
    skillId: number;
    proficiencyLevel: string;
    yearsExperience: number;
  }): Promise<UserSkill> {
    const { data } = await apiClient.post<{ data: UserSkill }>('/users/me/skills', payload);
    return unwrap(data);
  },

  /** USR-07 */
  async removeSkill(skillId: number): Promise<void> {
    await apiClient.delete(`/users/me/skills/${skillId}`);
  },

  /** USR-10 */
  async getPublicProfile(userId: number): Promise<PublicProfile> {
    const { data } = await apiClient.get<{ data: PublicProfile }>(`/users/${userId}`);
    return unwrap(data);
  },

  /** USR-11 */
  async followUser(userId: number): Promise<FollowResponse> {
    const { data } = await apiClient.post<{ data: FollowResponse }>(`/users/${userId}/follow`);
    return unwrap(data);
  },

  /** USR-12 */
  async unfollowUser(userId: number): Promise<FollowResponse> {
    const { data } = await apiClient.delete<{ data: FollowResponse }>(`/users/${userId}/follow`);
    return unwrap(data);
  },

  /** USR-13 */
  async getSkillsCatalog(category?: string): Promise<SkillCatalogItem[]> {
    const { data } = await apiClient.get<{ data: SkillCatalogItem[] }>('/skills', {
      params: category ? { category } : undefined,
    });
    return unwrap(data);
  },

  /** USR-14 */
  async getCountries(): Promise<Country[]> {
    const { data } = await apiClient.get<{ data: Country[] }>('/countries');
    return unwrap(data);
  },
};

export default profileService;
