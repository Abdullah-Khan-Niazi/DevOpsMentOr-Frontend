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

  /** List classes for this organization */
  async listClasses(
    orgId: string | number,
    params?: { page?: number; pageSize?: number },
  ): Promise<{
    data: Array<{
      classId: number;
      className: string;
      slug: string;
      description: string | null;
      professorUserId: number;
      professorName: string | null;
      studentCount: number;
      maxStudents: number;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { data } = await apiClient.get<{
      data: {
        data: Array<{
          classId: number;
          className: string;
          slug: string;
          description: string | null;
          professorUserId: number;
          professorName: string | null;
          studentCount: number;
          maxStudents: number;
          createdAt: string;
        }>;
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    }>(`/admin/organizations/${orgId}/classes`, { params });
    return unwrap(data);
  },

  /** Organization analytics */
  async getOrgAnalytics(orgId: string | number): Promise<{
    revenue: {
      totalRevenue: number;
      paidOrdersCount: number;
      activeSubscriptions: number;
      subscriptionPlan: string;
    };
    members: {
      totalMembers: number;
      studentsCount: number;
      professorsCount: number;
      adminsCount: number;
    };
    progress: {
      avgModuleCompletionRate: number;
      avgLabCompletionRate: number;
      totalModuleCompletions: number;
      totalLabCompletions: number;
    };
    compute: {
      activePods: number;
      minCpu: number;
      avgCpu: number;
      maxCpu: number;
      minRam: number;
      avgRam: number;
      maxRam: number;
    };
    dau: {
      minDau: number;
      avgDau: number;
      maxDau: number;
      dailyTrend: Array<{ date: string; activeUsers: number; labCompletions: number }>;
    };
  }> {
    const { data } = await apiClient.get<{
      data: {
        revenue: {
          totalRevenue: number;
          paidOrdersCount: number;
          activeSubscriptions: number;
          subscriptionPlan: string;
        };
        members: {
          totalMembers: number;
          studentsCount: number;
          professorsCount: number;
          adminsCount: number;
        };
        progress: {
          avgModuleCompletionRate: number;
          avgLabCompletionRate: number;
          totalModuleCompletions: number;
          totalLabCompletions: number;
        };
        compute: {
          activePods: number;
          minCpu: number;
          avgCpu: number;
          maxCpu: number;
          minRam: number;
          avgRam: number;
          maxRam: number;
        };
        dau: {
          minDau: number;
          avgDau: number;
          maxDau: number;
          dailyTrend: Array<{ date: string; activeUsers: number; labCompletions: number }>;
        };
      };
    }>(`/admin/organizations/${orgId}/analytics`);
    return unwrap(data);
  },

  /** Send admin invitation via email */
  async inviteOrgAdmin(
    orgId: string | number,
    emailOrUserId: string | number,
  ): Promise<{ token: string; email: string }> {
    const { data } = await apiClient.post<{ data: { token: string; email: string } }>(
      `/admin/organizations/${orgId}/invite-admin`,
      typeof emailOrUserId === 'number' ? { userId: emailOrUserId } : { email: emailOrUserId },
    );
    return unwrap(data);
  },

  /** Class cohort detail including roster, professor, compute resources and leaderboard */
  async getClassDetail(
    orgId: string | number,
    classId: string | number,
  ): Promise<{
    detail: {
      classId: number;
      organizationId: number;
      className: string;
      slug: string;
      description: string | null;
      maxStudents: number;
      studentCount: number;
      createdAt: string;
    };
    professor: {
      userId: number;
      fullName: string | null;
      email: string;
    } | null;
    roster: Array<{
      userId: number;
      fullName: string | null;
      email: string;
      enrolledAt: string;
      isActive: boolean;
    }>;
    analytics: {
      avgProgress: number;
      activePods: number;
      avgCpu: number;
      avgRam: number;
    };
    leaderboard: Array<{
      userId: number;
      fullName: string | null;
      email: string;
      enrolledAt: string;
      completedModules: number;
      completedLabs: number;
      totalScore: number;
    }>;
  }> {
    const { data } = await apiClient.get<{
      data: {
        detail: {
          classId: number;
          organizationId: number;
          className: string;
          slug: string;
          description: string | null;
          maxStudents: number;
          studentCount: number;
          createdAt: string;
        };
        professor: {
          userId: number;
          fullName: string | null;
          email: string;
        } | null;
        roster: Array<{
          userId: number;
          fullName: string | null;
          email: string;
          enrolledAt: string;
          isActive: boolean;
        }>;
        analytics: {
          avgProgress: number;
          activePods: number;
          avgCpu: number;
          avgRam: number;
        };
        leaderboard: Array<{
          userId: number;
          fullName: string | null;
          email: string;
          enrolledAt: string;
          completedModules: number;
          completedLabs: number;
          totalScore: number;
        }>;
      };
    }>(`/admin/organizations/${orgId}/classes/${classId}`);
    return unwrap(data);
  },
};

export default adminOrgService;
