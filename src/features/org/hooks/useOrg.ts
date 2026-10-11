import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { orgService, type UpdateMyOrgPayload } from '../services';

export function useMyOrg() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.org.me,
    queryFn: () => orgService.getMyOrg(),
    retry: false,
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

export function useOrgProfessors() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.org.professors,
    queryFn: () => orgService.listProfessors(),
  });

  const invite = useMutation({
    mutationFn: (email: string) => orgService.inviteProfessor({ email }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.professors }),
  });

  return { query, invite };
}

export function useOrgUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.org.users,
    queryFn: () => orgService.listOrgUsers(),
  });
}

export function useOrgUserDetail(userId: number | string | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.org.userDetail(userId ?? 0),
    queryFn: () => orgService.getOrgUserDetail(userId!),
    enabled: Boolean(userId) && enabled,
  });
}

export function useMyOrgAnalytics() {
  return useQuery({
    queryKey: ['org', 'analytics'],
    queryFn: () => orgService.getMyOrgAnalytics(),
  });
}

export type { UpdateMyOrgPayload } from '../services';
