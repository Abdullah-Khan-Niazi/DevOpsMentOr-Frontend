import { apiClient, LONG_REQUEST_TIMEOUT_MS } from '@/shared/services';
import type {
  AdminCheckResultDto,
  AdminLabDetailDto,
  AdminLabDto,
  AdminTrackDetailDto,
  AdminTrackDto,
  CatalogLabDto,
  CreateTrackPayload,
  ImportCatalogLabResultDto,
  SaveLabSpecResultDto,
  TestCheckPayload,
  UpdateAdminLabPayload,
  UpdateTrackPayload,
  ValidateLabSpecResultDto,
} from '../types/admin';
import type { LabSpecV2 } from '../types/labSpec';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

const LABS_BASE = '/admin/labs';
const TRACKS_BASE = '/admin/tracks';

/** Staff lab library (C§6.2 labs) and track (C§6.2 tracks) API. */
export const adminLabsService = {
  /* ── Labs ────────────────────────────────────────────────────────── */

  async list(): Promise<AdminLabDto[]> {
    const { data } = await apiClient.get<{ data: { labs: AdminLabDto[] } }>(LABS_BASE);
    return unwrap(data).labs;
  },

  /** Labs catalog entries; `unusedOnly` hides slugs already imported. */
  async catalog(unusedOnly = false): Promise<CatalogLabDto[]> {
    const { data } = await apiClient.get<{ data: { labs: CatalogLabDto[] } }>(
      `${LABS_BASE}/catalog`,
      { params: { unusedOnly: String(unusedOnly) } },
    );
    return unwrap(data).labs;
  },

  /** Imports a lab from the Labs catalog (new lab 201, re-import 200). */
  async importFromCatalog(slug: string): Promise<ImportCatalogLabResultDto> {
    const { data } = await apiClient.post<{ data: ImportCatalogLabResultDto }>(
      '/admin/labs/import',
      { slug },
    );
    return unwrap(data);
  },

  /** Live editor validation; the server never answers 422 for this call. */
  async validateSpec(spec: unknown, signal?: AbortSignal): Promise<ValidateLabSpecResultDto> {
    const { data } = await apiClient.post<{ data: ValidateLabSpecResultDto }>(
      `${LABS_BASE}/spec/validate`,
      { spec },
      { signal },
    );
    return unwrap(data);
  },

  async get(labId: number): Promise<AdminLabDetailDto> {
    const { data } = await apiClient.get<{ data: { lab: AdminLabDetailDto } }>(
      `${LABS_BASE}/${labId}`,
    );
    return unwrap(data).lab;
  },

  async update(labId: number, payload: UpdateAdminLabPayload): Promise<AdminLabDto> {
    const { data } = await apiClient.patch<{ data: { lab: AdminLabDto } }>(
      `${LABS_BASE}/${labId}`,
      payload,
    );
    return unwrap(data).lab;
  },

  /** Replaces the lab's v2 step spec; 422 `LAB_SPEC_INVALID` carries the issues. */
  async saveSpec(labId: number, spec: LabSpecV2): Promise<SaveLabSpecResultDto> {
    const { data } = await apiClient.put<{ data: SaveLabSpecResultDto }>(
      `${LABS_BASE}/${labId}/spec`,
      { spec },
    );
    return unwrap(data);
  },

  /** Activating requires a valid spec and a catalog image for the slug. */
  async setActive(labId: number, isActive: boolean): Promise<void> {
    await apiClient.patch(`${LABS_BASE}/${labId}/publish`, { isActive });
  },

  async delete(labId: number): Promise<void> {
    await apiClient.delete(`${LABS_BASE}/${labId}`);
  },

  /** Runs one check against a running instance; can take as long as the check timeout. */
  async testCheck(labId: number, payload: TestCheckPayload): Promise<AdminCheckResultDto> {
    const { data } = await apiClient.post<{ data: { result: AdminCheckResultDto } }>(
      `${LABS_BASE}/${labId}/test-check`,
      payload,
      { timeout: LONG_REQUEST_TIMEOUT_MS },
    );
    return unwrap(data).result;
  },

  /* ── Tracks ──────────────────────────────────────────────────────── */

  async listTracks(): Promise<AdminTrackDto[]> {
    const { data } = await apiClient.get<{ data: { tracks: AdminTrackDto[] } }>(TRACKS_BASE);
    return unwrap(data).tracks;
  },

  async getTrack(trackId: number): Promise<AdminTrackDetailDto> {
    const { data } = await apiClient.get<{ data: { track: AdminTrackDetailDto } }>(
      `${TRACKS_BASE}/${trackId}`,
    );
    return unwrap(data).track;
  },

  async createTrack(payload: CreateTrackPayload): Promise<AdminTrackDto> {
    const { data } = await apiClient.post<{ data: { track: AdminTrackDto } }>(TRACKS_BASE, payload);
    return unwrap(data).track;
  },

  async updateTrack(trackId: number, payload: UpdateTrackPayload): Promise<AdminTrackDto> {
    const { data } = await apiClient.patch<{ data: { track: AdminTrackDto } }>(
      `${TRACKS_BASE}/${trackId}`,
      payload,
    );
    return unwrap(data).track;
  },

  /** Appends the course to the end of the track. */
  async attachCourse(trackId: number, courseId: number, required = false): Promise<void> {
    await apiClient.post(`${TRACKS_BASE}/${trackId}/content`, { courseId, required });
  },

  async setCourseRequired(trackId: number, courseId: number, required: boolean): Promise<void> {
    await apiClient.patch(`${TRACKS_BASE}/${trackId}/content/${courseId}`, { required });
  },

  async detachCourse(trackId: number, courseId: number): Promise<void> {
    await apiClient.delete(`${TRACKS_BASE}/${trackId}/content/${courseId}`);
  },

  /** `courseIds` must be the exact full set of the track's courses. */
  async reorderCourses(trackId: number, courseIds: number[]): Promise<void> {
    await apiClient.patch(`${TRACKS_BASE}/${trackId}/content/reorder`, { courseIds });
  },
};
