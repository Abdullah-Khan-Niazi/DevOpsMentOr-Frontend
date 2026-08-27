import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { enrollmentService } from '../services';

export function useValidateInvitation(token: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollment.validate(token),
    queryFn: () => enrollmentService.preview(token),
    enabled: enabled && token.length > 0,
    retry: false,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (token: string) => enrollmentService.accept(token),
  });
}

export function useMyClass() {
  return useQuery({
    queryKey: QUERY_KEYS.enrollment.myClass,
    queryFn: () => enrollmentService.getMyClass(),
    retry: false,
  });
}
