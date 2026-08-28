/** F6 domain types mirroring the backend response DTOs (§05). */

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

export interface ProLabDetailDto {
  proLabId: number;
  labId: number;
  networkIpRange: string | null;
  totalMachines: number;
  requiredRootCount: number;
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

export interface LabDetailDto extends LabDto {
  proLab: ProLabDetailDto | null;
  sherlock: SherlockDetailDto | null;
}

export interface ProvisionInstanceDto {
  instanceId: number;
  labId: number;
  status: 'pending' | 'running';
  hostname: string | null;
  assignedIp: string | null;
  sshPort: number;
  rootPassword: string;
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
