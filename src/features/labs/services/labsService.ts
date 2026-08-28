import { apiClient } from '@/shared/services';
import type {
  ActiveInstanceDto,
  AdminInstancesResponseDto,
  AdminLabDto,
  AdminTrackDto,
  AssertionResultDto,
  CreateLabPayload,
  CreateTrackPayload,
  ExtendInstanceDto,
  LabDetailDto,
  LabDto,
  ProvisionInstanceDto,
  SherlockSubmissionResultDto,
  StopInstanceDto,
  TerminateInstanceDto,
  TrackDetailDto,
  TrackDto,
  TrackProgressDto,
  VpnConfigDto,
  VpnRegion,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F6 §07 lab/execution-engine endpoints (LAB-01..LAB-22). */
export const labsService = {
  /** LAB-01 */
  async listLabs(): Promise<LabDto[]> {
    const { data } = await apiClient.get<{ data: { labs: LabDto[] } }>('/labs');
    return unwrap(data).labs;
  },

  /** LAB-02 */
  async getLabDetail(labId: number): Promise<LabDetailDto> {
    const { data } = await apiClient.get<{ data: { lab: LabDetailDto } }>(`/labs/${labId}`);
    return unwrap(data).lab;
  },

  /** LAB-03 */
  async provisionInstance(labId: number, region?: VpnRegion): Promise<ProvisionInstanceDto> {
    const { data } = await apiClient.post<{ data: { instance: ProvisionInstanceDto } }>(
      `/labs/${labId}/instances`,
      { region },
    );
    return unwrap(data).instance;
  },

  /** LAB-04 */
  async getActiveInstance(): Promise<ActiveInstanceDto | null> {
    const { data } = await apiClient.get<{ data: { instance: ActiveInstanceDto | null } }>(
      '/labs/instances/active',
    );
    return unwrap(data).instance;
  },

  /** LAB-05 */
  async stopInstance(instanceId: number): Promise<StopInstanceDto> {
    const { data } = await apiClient.patch<{ data: StopInstanceDto }>(
      `/labs/instances/${instanceId}/stop`,
    );
    return unwrap(data);
  },

  /** LAB-06 */
  async terminateInstance(instanceId: number): Promise<TerminateInstanceDto> {
    const { data } = await apiClient.delete<{ data: TerminateInstanceDto }>(
      `/labs/instances/${instanceId}`,
    );
    return unwrap(data);
  },

  /** LAB-07 */
  async extendInstance(instanceId: number): Promise<ExtendInstanceDto> {
    const { data } = await apiClient.patch<{ data: ExtendInstanceDto }>(
      `/labs/instances/${instanceId}/extend`,
    );
    return unwrap(data);
  },

  /** LAB-08 */
  async runAssertions(instanceId: number): Promise<AssertionResultDto> {
    const { data } = await apiClient.post<{ data: AssertionResultDto }>(
      `/labs/instances/${instanceId}/assert`,
    );
    return unwrap(data);
  },

  /** LAB-09 */
  async submitSherlockAnswers(
    labId: number,
    answers: Array<{ questionId: string; answer: string }>,
  ): Promise<SherlockSubmissionResultDto> {
    const { data } = await apiClient.post<{ data: SherlockSubmissionResultDto }>(
      `/labs/${labId}/sherlock/submit`,
      { answers },
    );
    return unwrap(data);
  },

  /** LAB-10 */
  async getVpnConfig(region?: VpnRegion): Promise<VpnConfigDto> {
    const { data } = await apiClient.get<{ data: { config: VpnConfigDto } }>('/labs/vpn/config', {
      params: region ? { region } : undefined,
    });
    return unwrap(data).config;
  },

  /** LAB-13 */
  async listTracks(): Promise<TrackDto[]> {
    const { data } = await apiClient.get<{ data: { tracks: TrackDto[] } }>('/tracks');
    return unwrap(data).tracks;
  },

  /** LAB-14 */
  async getTrackDetail(trackId: number): Promise<TrackDetailDto> {
    const { data } = await apiClient.get<{ data: { track: TrackDetailDto } }>(`/tracks/${trackId}`);
    return unwrap(data).track;
  },

  /** LAB-15 */
  async getTrackProgress(trackId: number): Promise<TrackProgressDto> {
    const { data } = await apiClient.get<{ data: TrackProgressDto }>(`/tracks/${trackId}/progress`);
    return unwrap(data);
  },

  /* ── Admin (LAB-16..LAB-22) ─────────────────────────────────────────── */

  async adminListLabs(): Promise<AdminLabDto[]> {
    const { data } = await apiClient.get<{ data: { labs: AdminLabDto[] } }>('/admin/labs');
    return unwrap(data).labs;
  },

  async adminCreateLab(payload: CreateLabPayload): Promise<AdminLabDto> {
    const { data } = await apiClient.post<{ data: { lab: AdminLabDto } }>('/admin/labs', payload);
    return unwrap(data).lab;
  },

  async adminUpdateLab(labId: number, payload: Partial<CreateLabPayload>): Promise<AdminLabDto> {
    const { data } = await apiClient.patch<{ data: { lab: AdminLabDto } }>(
      `/admin/labs/${labId}`,
      payload,
    );
    return unwrap(data).lab;
  },

  async adminPublishLab(labId: number, isActive: boolean): Promise<void> {
    await apiClient.patch(`/admin/labs/${labId}/publish`, { isActive });
  },

  async adminListTracks(): Promise<AdminTrackDto[]> {
    const { data } = await apiClient.get<{ data: { tracks: AdminTrackDto[] } }>('/admin/tracks');
    return unwrap(data).tracks;
  },

  async adminCreateTrack(payload: CreateTrackPayload): Promise<AdminTrackDto> {
    const { data } = await apiClient.post<{ data: { track: AdminTrackDto } }>(
      '/admin/tracks',
      payload,
    );
    return unwrap(data).track;
  },

  async adminUpdateTrack(
    trackId: number,
    payload: Partial<CreateTrackPayload>,
  ): Promise<AdminTrackDto> {
    const { data } = await apiClient.patch<{ data: { track: AdminTrackDto } }>(
      `/admin/tracks/${trackId}`,
      payload,
    );
    return unwrap(data).track;
  },

  async adminListInstances(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<AdminInstancesResponseDto> {
    const { data } = await apiClient.get<{ data: AdminInstancesResponseDto }>(
      '/admin/lab-instances',
      { params },
    );
    return unwrap(data);
  },

  async adminTerminateInstance(instanceId: number, reason?: string): Promise<void> {
    await apiClient.delete(`/admin/lab-instances/${instanceId}`, { data: { reason } });
  },
};

export default labsService;
