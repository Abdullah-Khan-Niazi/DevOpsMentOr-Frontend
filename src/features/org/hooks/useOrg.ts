import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { orgService, type CreateOrgPayload, type UpdateMyOrgPayload } from '../services';

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgPayload) => orgService.createOrg(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
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
