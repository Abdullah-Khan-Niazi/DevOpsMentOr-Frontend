import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { refreshAuthSession } from '@/features/auth/utils/refreshAuthSession';
import { orgService, type CreateOrgPayload, type UpdateMyOrgPayload } from '../services';

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgPayload) => orgService.createOrg(payload),
    onSuccess: async () => {
      await refreshAuthSession();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.memberships }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
      ]);
    },
  });
}

/** Multi-org: all active memberships for the signed-in user. */
export function useMyMemberships(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.org.memberships,
    queryFn: () => orgService.listMyMemberships(),
    retry: false,
    enabled,
  });
}

/** Multi-org: switch the active organization (validated server-side). */
export function useSwitchOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: number) => orgService.switchOrg(organizationId),
    onSuccess: async () => {
      await refreshAuthSession();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.memberships }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classes }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.users }),
      ]);
    },
  });
}

export function useMyOrg(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.org.me,
    queryFn: () => orgService.getMyOrg(),
    retry: false,
    enabled,
  });

  const update = useMutation({
    mutationFn: (payload: UpdateMyOrgPayload) => orgService.updateMyOrg(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me }),
  });

  const setEmailDomain = useMutation({
    mutationFn: (emailDomain: string | null) => orgService.setEmailDomain(emailDomain),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me }),
  });

  return { query, update, setEmailDomain };
}

export function useOrgProfessors(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.org.professors,
    queryFn: () => orgService.listProfessors(),
    enabled,
  });

  const invite = useMutation({
    mutationFn: (email: string) => orgService.inviteProfessor({ email }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.professors }),
  });

  return { query, invite };
}

export function useOrgUsers(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.org.users,
    queryFn: () => orgService.listOrgUsers(),
    enabled,
  });
}

export function useOrgUserDetail(userId: number | string | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.org.userDetail(userId ?? 0),
    queryFn: () => orgService.getOrgUserDetail(userId!),
    enabled: Boolean(userId) && enabled,
  });
}

export function useMyOrgAnalytics(enabled = true) {
  return useQuery({
    queryKey: ['org', 'analytics'],
    queryFn: () => orgService.getMyOrgAnalytics(),
    enabled,
  });
}

export type { UpdateMyOrgPayload } from '../services';
