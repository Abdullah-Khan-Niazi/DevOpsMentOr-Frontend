import { apiClient } from '@/shared/services';
import type { MyOrgDto, ProfessorDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

export interface UpdateMyOrgPayload {
  name?: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  billingEmail?: string | null;
}

export interface InviteProfessorPayload {
  email: string;
}

/** Contract §07 ORG-06..ORG-10 org workspace + enrollment endpoints. */
export const orgService = {
  /** ORG-06 */
  async getMyOrg(): Promise<MyOrgDto> {
    const { data } = await apiClient.get<{ data: MyOrgDto }>('/org/me');
    return unwrap(data);
  },

  /** Org dashboard settings update (contract update-org). */
  async updateMyOrg(payload: UpdateMyOrgPayload): Promise<MyOrgDto> {
    const { data } = await apiClient.patch<{ data: MyOrgDto }>('/org/me', payload);
    return unwrap(data);
  },

  /** ORG-07 email-domain restriction. */
  async setEmailDomain(emailDomain: string | null): Promise<{ domain: string | null }> {
    const { data } = await apiClient.patch<{ data: { domain: string | null } }>(
      '/org/settings/email-domain',
      { domain: emailDomain },
    );
    return unwrap(data);
  },

  /** ORG-10 */
  async listProfessors(): Promise<ProfessorDto[]> {
    const { data } = await apiClient.get<{ data: ProfessorDto[] }>('/org/professors');
    return unwrap(data);
  },

  /** ORG-09 invite professor. */
  async inviteProfessor(payload: InviteProfessorPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ data: { message: string } }>(
      '/org/professors/invite',
      payload,
    );
    return unwrap(data);
  },
};

export default orgService;
