import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminOrgService, type CreateOrgPayload, type UpdateOrgPayload } from '../services';

export function useAdminOrganizations(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: QUERY_KEYS.admin.organizations(queryKey),
    queryFn: () => adminOrgService.listOrgs(params),
  });
}

export function useAdminOrganizationDetail(orgId: string | number | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.admin.organizationDetail(orgId ?? ''),
    queryFn: () => adminOrgService.getOrg(orgId as string | number),
    enabled: enabled && orgId !== undefined,
    retry: false,
  });

  const update = useMutation({
    mutationFn: (payload: UpdateOrgPayload) =>
      adminOrgService.updateOrg(orgId as string | number, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.organizationDetail(orgId ?? ''),
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });

  const assignAdmin = useMutation({
    mutationFn: (userId: number) =>
      adminOrgService.assignOrgAdmin(orgId as string | number, userId),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.organizationDetail(orgId ?? ''),
      }),
  });

  return { query, update, assignAdmin };
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgPayload) => adminOrgService.createOrg(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });
}

export type { CreateOrgPayload, UpdateOrgPayload } from '../services';
