import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { profileService } from '../services';
import type {
  Country,
  MeProfile,
  PublicProfile,
  SkillCatalogItem,
  UpdateProfilePayload,
  UserSkill,
} from '../types';

/** USR-01 + USR-10 (own view): full edit-profile data source. */
export function useMyProfile() {
  const meQuery = useQuery<MeProfile, ApiError>({
    queryKey: QUERY_KEYS.profile.me,
    queryFn: () => profileService.getMe(),
  });

  const profileQuery = useQuery<PublicProfile, ApiError>({
    queryKey: QUERY_KEYS.profile.public(meQuery.data?.userId ?? 0),
    queryFn: () => profileService.getPublicProfile(meQuery.data!.userId),
    enabled: Boolean(meQuery.data),
  });

  return {
    me: meQuery.data,
    profile: profileQuery.data,
    isLoading: meQuery.isLoading || profileQuery.isLoading,
    isError: meQuery.isError || profileQuery.isError,
    error: meQuery.error ?? profileQuery.error,
    refetch: () => {
      void meQuery.refetch();
      void profileQuery.refetch();
    },
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, UpdateProfilePayload>({
    mutationFn: (payload) => profileService.updateProfile(payload).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.me });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useAvatarUpload() {
  const queryClient = useQueryClient();
  return useMutation<{ avatarUrl: string }, ApiError, File>({
    mutationFn: (file) => profileService.uploadAvatar(file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useCoverUpload() {
  const queryClient = useQueryClient();
  return useMutation<{ coverPhotoUrl: string }, ApiError, File>({
    mutationFn: (file) => profileService.uploadCover(file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useMySkills() {
  const queryClient = useQueryClient();
  const query = useQuery<UserSkill[], ApiError>({
    queryKey: QUERY_KEYS.profile.mySkills,
    queryFn: () => profileService.getMySkills(),
  });

  const addSkill = useMutation<
    UserSkill,
    ApiError,
    { skillId: number; proficiencyLevel: string; yearsExperience: number }
  >({
    mutationFn: profileService.addSkill,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.mySkills }),
  });

  const removeSkill = useMutation({
    mutationFn: (skillId: number) => profileService.removeSkill(skillId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.mySkills }),
  });

  return { list: query, addSkill, removeSkill };
}

export function useSkillsCatalog() {
  return useQuery<SkillCatalogItem[], ApiError>({
    queryKey: QUERY_KEYS.profile.skillsCatalog,
    queryFn: () => profileService.getSkillsCatalog(),
  });
}

export function useCountries() {
  return useQuery<Country[], ApiError>({
    queryKey: QUERY_KEYS.profile.countries,
    queryFn: () => profileService.getCountries(),
  });
}

export function usePublicProfile(userId: number, enabled = true) {
  const meQuery = useQuery<MeProfile, ApiError>({
    queryKey: QUERY_KEYS.profile.me,
    queryFn: () => profileService.getMe(),
    enabled,
  });

  const publicProfile = useQuery<PublicProfile, ApiError>({
    queryKey: QUERY_KEYS.profile.public(userId),
    queryFn: () => profileService.getPublicProfile(userId),
    enabled: enabled && userId > 0,
    retry: false,
  });

  const isOwnProfile = meQuery.data?.userId === userId;

  useEffect(() => {
    if (isOwnProfile) {
      void publicProfile.refetch();
    }
  }, [isOwnProfile, publicProfile]);

  return { profile: publicProfile.data, ...publicProfile, isOwnProfile };
}

export function useFollow(userId: number) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.profile.public(userId);

  const follow = useMutation({
    mutationFn: () => profileService.followUser(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const unfollow = useMutation({
    mutationFn: () => profileService.unfollowUser(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  return { follow, unfollow };
}
