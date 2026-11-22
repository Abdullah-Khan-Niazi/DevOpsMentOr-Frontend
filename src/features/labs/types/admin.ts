/**
 * Staff lab library and track DTOs (contract C§6.2), consumed by the admin
 * labs page, the curriculum control panel and the lab spec editor.
 */

import type { LabSpecIssue, LabSpecStatus, LabSpecV2, LabStepCheck, LabStepKind } from './labSpec';

export type AdminLabType = 'pro_lab' | 'sherlock' | 'vip_lab';

export interface AdminLabUsageDto {
  /** Module item (spine row) ids that reference this lab. */
  itemIds: number[];
  activeInstances: number;
  completions: number;
  learnersWithProgress: number;
}

export interface AdminLabDto {
  labId: number;
  labName: string;
  slug: string;
  description: string | null;
  difficultyId: number;
  difficultyName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  labType: AdminLabType;
  isActive: boolean;
  isPremium: boolean;
  estimatedHours: number;
  networkDiagramUrl: string | null;
  createdAt: string;
  updatedAt: string;
  specStatus: LabSpecStatus;
  stepCount: number;
  usage: AdminLabUsageDto;
}

export interface AdminLabDetailDto extends AdminLabDto {
  /** Full spec with secrets (admin only); null when not v2. */
  spec: LabSpecV2 | null;
  specIssues: LabSpecIssue[];
}

/** Labs catalog entry (manifest summary; never carries commands, hints or answers). */
export interface CatalogLabDto {
  /** `CxxMxxLxx` (the Labs catalog key). */
  slug: string;
  courseSlug: string;
  moduleSlug: string;
  moduleTitle: string;
  /** Numeric lab id of the Labs manifest. */
  manifestLabId: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  estimatedHours: number;
  dockerImage: string;
  stepCount: number;
  steps: Array<{ id: string; title: string; kind: LabStepKind }>;
  /** `labs.lab_id` with the same slug, when already imported. */
  importedLabId: number | null;
  isUsed: boolean;
}

export interface AdminCheckResultDto {
  passed: boolean;
  reason: 'passed' | 'not_passed' | 'timeout';
  exitCode: number | null;
  statusCode: number | null;
  durationMs: number;
  /** Truncated server side (admin only). */
  stdout: string;
  stderr: string;
}

export interface ValidateLabSpecResultDto {
  valid: boolean;
  issues: LabSpecIssue[];
  warnings: string[];
}

export interface SaveLabSpecResultDto {
  lab: AdminLabDetailDto;
  warnings: string[];
}

/** `POST /admin/labs/import` body (strict). */
export interface ImportCatalogLabPayload {
  slug: string;
}

/** `POST /admin/labs/import` response; 201 when created, 200 on re-import. */
export interface ImportCatalogLabResultDto {
  lab: AdminLabDetailDto;
  created: boolean;
}

/** `updateLabSchema` minus `flagValues` / type-specific config. */
export interface UpdateAdminLabPayload {
  labName?: string;
  slug?: string;
  description?: string | null;
  difficultyId?: number;
  categoryId?: number | null;
  isPremium?: boolean;
  estimatedHours?: number;
  networkDiagramUrl?: string | null;
}

export type TestCheckPayload =
  { instanceId: number; stepId: string } | { instanceId: number; check: LabStepCheck };

/** The caller's own running lab environment (only the fields the editor needs). */
export interface AdminTestInstanceDto {
  instanceId: number;
  labId: number;
  labName?: string;
  status: 'pending' | 'running' | 'stopped' | 'terminated' | 'error';
  expiresAt: string | null;
}

/* ── Tracks ──────────────────────────────────────────────────────────── */

export interface AdminTrackDto {
  trackId: number;
  trackName: string;
  slug: string;
  description: string | null;
  difficultyId: number;
  categoryId: number | null;
  isActive: boolean;
  isPremium: boolean;
  /** Computed server side from the lab items in the track's courses. */
  totalLabs: number;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTrackContentDto {
  courseId: number;
  title: string;
  isPublished: boolean;
  displayOrder: number;
  required: boolean;
  moduleCount: number;
  itemCount: number;
}

export interface AdminTrackDetailDto extends AdminTrackDto {
  content: AdminTrackContentDto[];
}

export interface CreateTrackPayload {
  trackName: string;
  slug: string;
  description?: string;
  difficultyId: number;
  categoryId?: number;
  isPremium?: boolean;
}

export interface UpdateTrackPayload {
  trackName?: string;
  slug?: string;
  description?: string | null;
  difficultyId?: number;
  categoryId?: number | null;
  isActive?: boolean;
  isPremium?: boolean;
}
