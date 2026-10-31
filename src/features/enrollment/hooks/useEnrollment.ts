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

export function useMyClass(enabled = true, classId?: string | number) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollment.myClass(classId),
    queryFn: () => enrollmentService.getMyClass(classId),
    retry: false,
    enabled,
  });
}

export function useMyClasses(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollment.myClasses,
    queryFn: () => enrollmentService.listMyClasses(),
    retry: false,
    enabled,
  });
}
