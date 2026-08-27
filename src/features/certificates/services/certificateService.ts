import { apiClient } from '@/shared/services';
import type { CertificateVerificationDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F7 §07 certificate endpoints (GAM-14 — public, unauthenticated). */
export const certificateService = {
  /** GAM-14: verify a certificate by its public number. */
  async verify(certNumber: string): Promise<CertificateVerificationDto> {
    const { data } = await apiClient.get<{ data: CertificateVerificationDto }>(
      `/certificates/verify/${encodeURIComponent(certNumber)}`,
    );
    return unwrap(data);
  },
};

export default certificateService;
