/**
 * F3 response DTOs shared by the org workspace, enrollment, and platform-admin
 * org management. Mirrors the backend org/classes/enrollment DTOs (contract §07).
 * All dates are ISO strings; org/class/user identifiers are numbers.
 */

export interface OrganizationDto {
  organizationId: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  industry: string | null;
  isVerified: boolean;
  billingEmail: string | null;
  createdAt: string;
}

export interface OrgAdminDetailDto extends OrganizationDto {
  adminUserId: number | null;
  adminEmail: string | null;
}

export interface AdminOrgListDto {
  data: OrganizationDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** GET /org/me */
export interface MyOrgDto extends OrganizationDto {
  stats: {
    classCount: number;
    studentCount: number;
    professorCount: number;
  };
  emailDomain: string | null;
}

/** ORG-10 professors list row */
export interface ProfessorDto {
  userId: number;
  fullName: string | null;
  email: string;
  assignedClassCount: number;
}

/** CLS-02 class list row */
export interface ClassDto {
  classId: number;
  organizationId: number;
  className: string;
  slug: string;
  description: string | null;
  professorUserId: number;
  professorName: string | null;
  maxStudents: number;
  studentCount: number;
  createdAt: string;
}

/** CLS-03 class detail */
export type ClassDetailDto = ClassDto;

/** CLS-06 roster row */
export interface RosterStudentDto {
  userId: number;
  fullName: string | null;
  email: string;
  enrolledAt: string;
  isActive: boolean;
}

/** Sorted roster with pagination metadata */
export interface RosterDto {
  data: RosterStudentDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Class invitation list row */
export interface InvitationDto {
  invitationId: number;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface PaginatedInvitationsDto {
  data: InvitationDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** CLS-07 invite response */
export interface InviteStudentsResultDto {
  invited: string[];
  skipped: Array<{
    email: string;
    reason: 'domain_mismatch' | 'already_enrolled' | 'invite_pending';
  }>;
}

/** CLS-08 import response */
export interface ImportSummaryDto {
  totalRows: number;
  successCount: number;
  errors: Array<{ row: number; email: string; reason: string }>;
}

/** ENR-01 public token validation */
export interface InvitePreviewDto {
  kind: 'class' | 'professor';
  inviteeEmail: string;
  className: string | null;
  organizationName: string;
  status: string;
  expiresAt: string;
}

/** ENR-02 accept response */
export interface EnrollmentAcceptedDto {
  kind: 'class' | 'professor';
  className: string | null;
  organizationName: string;
}

/** ENR-03 student my-class */
export interface StudentClassDto {
  classId: number;
  className: string;
  organizationName: string;
  enrolledAt: string;
}

/** ORG-01 create org response (platform admin) */
export interface OrgCreatedDto {
  organizationId: number;
  name: string;
  slug: string;
  createdAt: string;
}
