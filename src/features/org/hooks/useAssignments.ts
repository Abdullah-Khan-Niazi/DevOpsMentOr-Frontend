import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignmentService,
  type CreateAssignmentPayload,
  type UpdateAssignmentPayload,
} from '../services/assignmentService';

/** Local to the org feature: assignments are class-scoped read models. */
const assignmentKeys = {
  forClass: (classId: string | number) =>
    ['org', 'classes', String(classId), 'assignments'] as const,
  courses: ['curriculum', 'courses'] as const,
};

export function useClassAssignments(classId: string | number, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.forClass(classId),
    queryFn: () => assignmentService.listForClass(classId),
    enabled,
    retry: false,
  });
}

export function useCourseCatalog(enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.courses,
    queryFn: () => assignmentService.listCourses(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAssignment(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => assignmentService.create(classId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.forClass(classId) });
    },
  });
}

export function useUpdateAssignment(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assignmentId: number; payload: UpdateAssignmentPayload }) =>
      assignmentService.update(classId, input.assignmentId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.forClass(classId) });
    },
  });
}

export function useDeleteAssignment(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: number) => assignmentService.remove(classId, assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.forClass(classId) });
    },
  });
}
