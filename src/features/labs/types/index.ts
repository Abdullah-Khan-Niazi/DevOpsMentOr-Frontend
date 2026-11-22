/** F6 domain types mirroring the backend response DTOs (§05, C§4.1). */

import type { XpDeltaDto } from '@/features/progress/types';
import type { LabMode, LabStepKind } from './labSpec';

export type LabType = 'pro_lab' | 'sherlock' | 'vip_lab';
export type VpnRegion = 'US' | 'EU' | 'ASIA' | 'AUSTRALIA' | 'SOUTH_AMERICA' | 'AFRICA';
export type LabInstanceStatus = 'pending' | 'running' | 'stopped' | 'terminated' | 'error';
export type TrackContentType = 'lab' | 'course';

export interface LabDto {
  labId: number;
  labName: string;
  slug: string;
  description: string | null;
  difficultyId: number;
  difficultyName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  labType: LabType;
  isActive: boolean;
  isPremium: boolean;
  estimatedHours: number;
  networkDiagramUrl: string | null;
  isStarted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated not part of any learner DTO anymore (C§4.1); read only by the legacy LabDetailPage. */
export interface ProLabDetailDto {
  proLabId: number;
  labId: number;
  networkIpRange: string | null;
  totalMachines: number;
  requiredRootCount: number;
  /** @deprecated checkpoint assertions are retired; learners see step state (C§4.1). */
  checkpoints: Array<{ checkpointId: string; assertionGroupId: string }>;
  activeUsersCount: number;
}

export interface SherlockDetailDto {
  sherlockId: number;
  labId: number;
  evidenceFileUrl: string | null;
  evidenceFileSize: number | null;
  fileHash: string | null;
  questions: Array<{ id: string; text: string; hint: string | null }>;
  requiredCorrectAnswers: number;
}

/** One step of a lab as listed before starting it (no instructions, hints or checks). Points are scaled. */
export interface LabStepSummaryDto {
  stepId: string;
  position: number;
  title: string;
  kind: LabStepKind;
  points: number;
}

/** `GET /labs/:labId` (C§4.1). No checkpoints and no secrets: steps are listed without checks, setup or answers. */
export interface LabDetailDto extends LabDto {
  /** false when anonymous. */
  isCompleted: boolean;
  /** null when the spec is not ready. */
  mode: LabMode | null;
  /** Markdown. */
  scenarioIntro: string;
  stepCount: number;
  /** Sum of scaled step points plus the scaled completion bonus (C3). */
  pointsAvailable: number;
  steps: LabStepSummaryDto[];
  sherlock: SherlockDetailDto | null;
  /**
   * @deprecated the learner DTO no longer carries `proLab` (C§4.1); kept optional so the
   * legacy LabDetailPage compiles until wave 4 removes it.
   */
  proLab?: ProLabDetailDto | null;
}

export type LabStepStatus = 'locked' | 'current' | 'passed';

/**
 * Learner view of one lab step (C§4.1). `points` is scaled by the difficulty multiplier;
 * hint cost and penalties are the per-step values (never scaled).
 */
export interface LearnerLabStepDto {
  stepId: string;
  position: number;
  title: string;
  kind: LabStepKind;
  status: LabStepStatus;
  /** Markdown; null while the step is locked. */
  instructions: string | null;
  /** Points available for this step (round(step.points * multiplier)). */
  points: number;
  pointsAwarded: number;
  passedAt: string | null;
  /** `setup.length > 0 || kind === 'question'`. */
  requiresStage: boolean;
  /** Latest LAB_STEP_STAGED for the active instance. */
  stagedOnInstanceId: number | null;
  hints: {
    total: number;
    revealed: Array<{ hintIndex: number; text: string }>;
    nextHintIndex: number | null;
    /** Points deducted per reveal of this step's hint (step.hintCost). */
    cost: number;
  };
  /** Per-step penalties; both 0 for task steps. */
  penalties: { wrongAnswer: number; guess: number };
}

export interface LabStepsStateTotals {
  pointsAvailable: number;
  pointsEarned: number;
  hintPenalties: number;
  wrongAnswerPenalties: number;
  guessPenalties: number;
}

/** `GET /labs/:labId/steps` (C§4.1). */
export interface LabStepsStateDto {
  labId: number;
  slug: string;
  labName: string;
  mode: LabMode;
  scenarioIntro: string;
  steps: LearnerLabStepDto[];
  currentStepId: string | null;
  completedAt: string | null;
  /** Scaled completion bonus of the spec. */
  completionBonus: number;
  totals: LabStepsStateTotals;
  activeInstance: {
    instanceId: number;
    status: LabInstanceStatus;
    expiresAt: string | null;
    terminalWsUrl: string | null;
  } | null;
  /** Set when the user's active instance belongs to another lab, so the FE can offer "End it". */
  otherActiveInstance: { instanceId: number; labId: number; labName: string } | null;
}

export type LabStepCheckReason = 'passed' | 'not_passed' | 'timeout' | 'wrong_answer';

/** Body of `POST /labs/instances/:instanceId/steps/:stepId/check` (C§4.1, strict). `answer` for question steps only. */
export interface LabStepCheckPayload {
  answer?: string;
}

/** `POST .../steps/:stepId/check` response (C§4.1). `message` is generic: never stdout, stderr or hints. */
export interface LabStepCheckResultDto {
  stepId: string;
  passed: boolean;
  alreadyPassed: boolean;
  reason: LabStepCheckReason;
  message: string;
  /** Question steps only. */
  guessed: boolean;
  pointsAwarded: number;
  penalties: { wrongAnswer: number; guess: number };
  nextStepId: string | null;
  labCompleted: boolean;
  completion: null | {
    completedAt: string;
    completionBonus: number;
    completedLessonIds: number[];
  };
  xp: XpDeltaDto;
}

/** `POST .../steps/:stepId/stage` response (C§4.1). */
export interface LabStepStageResultDto {
  stepId: string;
  instanceId: number;
  stagedAt: string;
  setupRan: boolean;
}

/** `POST /labs/:labId/steps/:stepId/hints/:hintIndex/reveal` response (C§4.1). */
export interface HintRevealResultDto {
  stepId: string;
  hintIndex: number;
  text: string;
  alreadyRevealed: boolean;
  penaltyApplied: number;
  remaining: number;
  xp: XpDeltaDto;
}

/** `GET /labs/:labId/walkthrough` response body (C§4.1, C2). Markdown is sanitized by the FE. */
export interface LabWalkthroughDto {
  labId: number;
  slug: string;
  markdown: string;
}

/** `GET /labs/:labId/slides` response body: short-lived presigned deck URL. */
export interface LabSlidesDto {
  labId: number;
  url: string;
  /** ISO instant after which the URL stops working. */
  expiresAt: string;
}

/** `POST /labs/:labId/instances` response. No credential is generated or returned (D27). */
export interface ProvisionInstanceDto {
  instanceId: number;
  labId: number;
  labSlug: string;
  status: 'pending' | 'running';
  hostname: string | null;
  assignedIp: string | null;
  sshPort: number;
  terminalWsUrl: string;
  expiresAt: string;
  vpnAssignment: { ovpnConfigUrl: string | null };
}

export interface ActiveInstanceDto {
  instanceId: number;
  labId: number;
  labName: string;
  slug: string;
  status: LabInstanceStatus;
  hostname: string | null;
  assignedIp: string | null;
  sshPort: number;
  ramGb: number;
  cpuCores: number;
  diskGb: number;
  startedAt: string;
  expiresAt: string | null;
  terminalWsUrl: string | null;
}

export interface StopInstanceDto {
  instanceId: number;
  status: 'stopped';
}

export interface TerminateInstanceDto {
  instanceId: number;
  status: 'terminated';
}

export interface ExtendInstanceDto {
  instanceId: number;
  newExpiresAt: string;
  extensionsUsed: number;
  extensionsRemaining: number;
}

/** @deprecated assertion engine retired; replaced by `LabStepCheckResultDto` (C§4.1). */
export interface AssertionResultDto {
  instanceId: number;
  assertions: Array<{ name: string; passed: boolean; message: string | null }>;
  allPassed: boolean;
  completedAt: string | null;
}

export interface SherlockSubmissionResultDto {
  labId: number;
  results: Array<{ questionId: string; passed: boolean }>;
  isPassed: boolean;
  score: number;
}

export interface VpnConfigDto {
  assignmentId: number;
  vpnId: number;
  serverName: string;
  serverLocation: string | null;
  region: VpnRegion;
  ovpnConfigUrl: string | null;
  assignedAt: string;
  expiresAt: string | null;
}

export interface TrackDto {
  trackId: number;
  trackName: string;
  slug: string;
  description: string | null;
  difficultyId: number | null;
  difficultyName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  totalLabs: number;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
}

export interface TrackContentItemDto {
  trackId: number;
  contentType: TrackContentType;
  contentId: number;
  displayOrder: number;
  required: boolean;
  title: string;
  completed: boolean;
}

export interface TrackDetailDto extends TrackDto {
  totalLabs: number;
  totalCourses: number;
  items: TrackContentItemDto[];
}

export interface TrackProgressDto {
  trackId: number;
  trackName: string;
  slug: string;
  totalItems: number;
  completedItems: number;
  totalRequired: number | null;
  completedRequired: number;
  progressPercentage: number;
  isCompleted: boolean;
  items: TrackProgressItemDto[];
}

export interface TrackProgressItemDto {
  trackId: number;
  contentType: TrackContentType;
  contentId: number;
  displayOrder: number;
  required: boolean;
  title: string;
  completed: boolean;
}

export interface AiMentorMessageDto {
  sessionKey: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
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
  labType: LabType;
  isActive: boolean;
  isPremium: boolean;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTrackDto {
  trackId: number;
  trackName: string;
  slug: string;
  description: string | null;
  difficultyId: number | null;
  difficultyName: string | null;
  estimatedHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminInstanceDto {
  instanceId: number;
  userId: number;
  username: string | null;
  labId: number | null;
  labName: string | null;
  labType: LabType | null;
  hostname: string | null;
  assignedIp: string | null;
  sshPort: number;
  ramGb: number;
  cpuCores: number;
  diskGb: number;
  status: LabInstanceStatus;
  startedAt: string;
  expiresAt: string | null;
  terminatedAt: string | null;
  vpnId: number;
}

export interface AdminInstancesResponseDto {
  instances: AdminInstanceDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLabPayload {
  labName: string;
  slug: string;
  description?: string;
  difficultyId: number;
  categoryId?: number;
  labType: LabType;
  isPremium?: boolean;
  estimatedHours?: number;
  networkDiagramUrl?: string;
  proLabConfig?: {
    networkIpRange?: string;
    totalMachines: number;
    requiredRootCount: number;
    flagValues?: Record<string, string>;
  };
  sherlockConfig?: {
    evidenceFileUrl?: string;
    evidenceFileSize?: number;
    fileHash?: string;
    questions: Array<{ id: string; text: string; hint?: string }>;
    answers: Array<{ id: string; answer: string }>;
    requiredCorrectAnswers: number;
  };
}

export interface CreateTrackPayload {
  trackName: string;
  slug: string;
  description?: string;
  difficultyId?: number;
  categoryId?: number;
  totalLabs: number;
  isPremium?: boolean;
  content: Array<{
    contentType: TrackContentType;
    contentId: number;
    displayOrder: number;
    required: boolean;
  }>;
}
