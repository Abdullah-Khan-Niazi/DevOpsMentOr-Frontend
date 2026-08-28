import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { progressService } from '../services';
import type { CompleteLessonPayload, SubmitQuizAttemptPayload } from '../types';

export function useCourseProgress(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.course,
    queryFn: () => progressService.getCourseProgress(),
    enabled,
    retry: false,
  });
}

export function useModulesProgress(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.modules,
    queryFn: () => progressService.getModulesProgress(),
    enabled,
    retry: false,
  });
}

export function useContinueLearning(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.continue,
    queryFn: () => progressService.getContinueLearning(),
    enabled,
    retry: false,
  });
}

export function useActivityHistory(limit = 20, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.activity(limit),
    queryFn: () => progressService.getActivity(limit),
    enabled,
    retry: false,
  });
}

export function useQuizMeta(quizId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizMeta(quizId),
    queryFn: () => progressService.getQuizMeta(Number(quizId)),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

export function useQuizQuestions(quizId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizQuestions(quizId),
    queryFn: () => progressService.getQuizQuestions(Number(quizId)),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

export function useQuizAttemptHistory(quizId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizAttempts(quizId),
    queryFn: () => progressService.getQuizAttempts(Number(quizId)),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

export function useStartLesson() {
  return useMutation({
    mutationFn: (lessonId: number) => progressService.startLesson(lessonId),
  });
}

export function useCompleteLesson() {
  return useMutation({
    mutationFn: ({ lessonId, payload }: { lessonId: number; payload: CompleteLessonPayload }) =>
      progressService.completeLesson(lessonId, payload),
  });
}

export function useSubmitQuizAttempt(quizId: string) {
  return useMutation({
    mutationFn: (payload: SubmitQuizAttemptPayload) =>
      progressService.submitQuizAttempt(Number(quizId), payload),
  });
}

export function useClassStudents(classId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.classStudents(classId),
    queryFn: () => progressService.getClassStudents(Number(classId)),
    enabled: enabled && classId.length > 0,
    retry: false,
  });
}

export function useStudentDetail(classId: string, userId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.studentDetail(classId, userId),
    queryFn: () => progressService.getStudentDetail(Number(classId), userId as number),
    enabled: classId.length > 0 && userId !== null,
    retry: false,
  });
}

export function useOrgStudents(orgId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.orgStudents(orgId),
    queryFn: () => progressService.getOrgStudents(orgId as number),
    enabled: enabled && orgId !== null,
    retry: false,
  });
}

export function useAdminUserProgress(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.adminUser(userId),
    queryFn: () => progressService.getAdminUserProgress(Number(userId)),
    enabled: userId.length > 0,
    retry: false,
  });
}
