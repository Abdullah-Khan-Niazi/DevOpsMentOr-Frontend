import { apiClient } from '@/shared/services';
import type {
  AdminOrgListDto,
  OrgAdminDetailDto,
  OrgCreatedDto,
  OrganizationDto,
} from '@/features/org/types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

export interface CreateOrgPayload {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  billingEmail?: string;
}

export interface UpdateOrgPayload {
  name?: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  billingEmail?: string | null;
}

/** Contract §07 ORG-01..ORG-05 platform-admin organization management. */
export const adminOrgService = {
  /** ORG-01 */
  async createOrg(payload: CreateOrgPayload): Promise<OrgCreatedDto> {
    const { data } = await apiClient.post<{ data: OrgCreatedDto }>('/admin/organizations', payload);
    return unwrap(data);
  },

  /** ORG-02 */
  async listOrgs(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminOrgListDto> {
    const { data } = await apiClient.get<{ data: AdminOrgListDto }>('/admin/organizations', {
      params,
    });
    return unwrap(data);
  },

  /** ORG-03 */
  async getOrg(orgId: string | number): Promise<OrgAdminDetailDto> {
    const { data } = await apiClient.get<{ data: OrgAdminDetailDto }>(
      `/admin/organizations/${orgId}`,
    );
    return unwrap(data);
  },

  /** ORG-04 */
  async updateOrg(orgId: string | number, payload: UpdateOrgPayload): Promise<OrganizationDto> {
    const { data } = await apiClient.patch<{ data: OrganizationDto }>(
      `/admin/organizations/${orgId}`,
      payload,
    );
    return unwrap(data);
  },

  /** ORG-05 assign org admin */
  async assignOrgAdmin(orgId: string | number, userId: number): Promise<OrgAdminDetailDto> {
    const { data } = await apiClient.post<{ data: OrgAdminDetailDto }>(
      `/admin/organizations/${orgId}/admins`,
      { userId },
    );
    return unwrap(data);
  },
};

export default adminOrgService;
