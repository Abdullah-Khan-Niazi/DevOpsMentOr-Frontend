import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { classService, type CreateClassPayload } from '../services';

export function useOrgClasses(params?: { search?: string; page?: number; pageSize?: number }) {
  const queryKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: [...QUERY_KEYS.org.classes, queryKey],
    queryFn: () => classService.listClasses(params),
  });
}

export function useClassDetail(classId: string | number, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.org.classDetail(classId),
    queryFn: () => classService.getClass(classId),
    enabled: enabled && Boolean(classId),
    retry: false,
  });

  const update = useMutation({
    mutationFn: (payload: CreateClassPayload) => classService.updateClass(classId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classDetail(classId) }),
  });

  const assignProfessor = useMutation({
    mutationFn: (professorUserId: number) => classService.assignProfessor(classId, professorUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classDetail(classId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classes });
    },
  });

  return { query, update, assignProfessor };
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassPayload) => classService.createClass(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classes });
      void queryClient.invalidateQueries({ queryKey: ['org', 'me'] });
    },
  });
}

export function useClassRoster(
  classId: string | number,
  params?: { search?: string; page?: number; pageSize?: number },
  enabled = true,
) {
  const queryKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: [...QUERY_KEYS.org.roster(classId), queryKey],
    queryFn: () => classService.getRoster(classId, params),
    enabled: enabled && Boolean(classId),
  });
}

export function useClassInvitations(
  classId: string | number,
  params?: { page?: number; pageSize?: number },
  enabled = true,
) {
  const queryKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: [...QUERY_KEYS.org.invitations(classId), queryKey],
    queryFn: () => classService.listInvitations(classId, params),
    enabled: enabled && Boolean(classId),
  });
}

export function useInviteStudents(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) => classService.inviteStudents(classId, { emails }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.invitations(classId) });
    },
  });
}

export function useImportStudents(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => classService.importStudents(classId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.invitations(classId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.roster(classId) });
    },
  });
}

export function useWithdrawStudent(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string | number) => classService.withdrawStudent(classId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.roster(classId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classDetail(classId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.classes });
    },
  });
}
