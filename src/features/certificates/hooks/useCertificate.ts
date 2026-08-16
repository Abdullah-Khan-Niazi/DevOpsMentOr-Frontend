import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { certificateService } from '../services';

/** GAM-14: public certificate verification (enabled only for a non-empty number). */
export function useVerifyCertificate(certNumber: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.certificates.verify(certNumber ?? ''),
    queryFn: () => certificateService.verify(certNumber as string),
    enabled: Boolean(certNumber),
    retry: false,
  });
}
