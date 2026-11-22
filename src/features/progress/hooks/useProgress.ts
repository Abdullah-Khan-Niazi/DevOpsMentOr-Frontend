import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { applyXpDelta, hasCode } from '@/shared/services';
import { progressService } from '../services';
import type { CompleteLessonPayload, LessonCompleteResultDto } from '../types';

/** Learner progress for every published course the learner has started (C§4.3). */
export function useCoursesProgress(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.courses,
    queryFn: () => progressService.listCoursesProgress(),
    enabled,
    retry: false,
  });
}

/** Learner progress for one course (C§4.3). */
export function useCourseProgressById(courseId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.courseDetail(courseId ?? 0),
    queryFn: () => progressService.getCourseProgress(courseId as number),
    enabled: enabled && courseId !== null && courseId > 0,
    retry: false,
  });
}

/** Per-module progress of one course (C§4.3). */
export function useCourseModulesProgress(courseId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.courseModules(courseId ?? 0),
    queryFn: () => progressService.getCourseModulesProgress(courseId as number),
    enabled: enabled && courseId !== null && courseId > 0,
    retry: false,
  });
}

/** Per-item progress of one module (C§4.3). */
export function useModuleItemsProgress(moduleId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.moduleItems(moduleId ?? 0),
    queryFn: () => progressService.getModuleItemsProgress(moduleId as number),
    enabled: enabled && moduleId !== null && moduleId > 0,
    retry: false,
  });
}

/** Continue-learning pointer with item kind, routed by `kind`/`labId`/`quizId` (C§4.3). */
export function useContinueLearningPointer(enabled = true) {
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

export function useQuizAttemptHistory(quizId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizAttempts(quizId),
    queryFn: () => progressService.getQuizAttempts(Number(quizId)),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

/** Marks a lesson or item started (idempotent). */
export function useStartLesson() {
  return useMutation({
    mutationFn: (lessonId: number) => progressService.startLesson(lessonId),
  });
}

/**
 * Marks an item complete. `LESSON_NOT_STARTED` starts the item and retries once (FE§4.3).
 * Applies the server XP delta to the top bar and refreshes the progress and learn module
 * caches. Errors are not swallowed: the caller renders them.
 */
export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      payload,
    }: {
      lessonId: number;
      payload: CompleteLessonPayload;
    }): Promise<LessonCompleteResultDto> => {
      try {
        return await progressService.completeLesson(lessonId, payload.timeSpentSeconds);
      } catch (error) {
        if (!hasCode(error, ERROR_CODES.LESSON_NOT_STARTED)) throw error;
        await progressService.startLesson(lessonId);
        return progressService.completeLesson(lessonId, payload.timeSpentSeconds);
      }
    },
    onSuccess: (result) => {
      if (result.xp.delta !== 0) applyXpDelta(queryClient, result.xp);
      const { courseId, moduleId } = result.lesson;
      // Legacy single-course keys still read by the old dashboard and lesson pages.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.course });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.modules });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.courses });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.courseDetail(courseId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progress.courseModules(courseId),
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.moduleItems(moduleId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.continue });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learn.module(moduleId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learn.moduleItems(moduleId) });
    },
  });
}

/**
 * Staff: class progress. `courseId` selects the class-assigned course to analyse; the key
 * includes it so each course caches separately.
 */
export function useClassStudents(classId: string, enabled = true, courseId?: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.progress.classStudents(classId), courseId ?? null],
    queryFn: () => progressService.getClassStudents(Number(classId), 1, 25, courseId ?? undefined),
    enabled: enabled && classId.length > 0,
    retry: false,
  });
}

/** Staff: one student's drill-down within a class; `courseId` as in `useClassStudents`. */
export function useStudentDetail(classId: string, userId: number | null, courseId?: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.progress.studentDetail(classId, userId), courseId ?? null],
    queryFn: () =>
      progressService.getStudentDetail(Number(classId), userId as number, courseId ?? undefined),
    enabled: classId.length > 0 && userId !== null,
    retry: false,
  });
}

/** Staff: org aggregate; `courseId` as in `useClassStudents`. */
export function useOrgStudents(orgId: number | null, enabled = true, courseId?: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.progress.orgStudents(orgId), courseId ?? null],
    queryFn: () => progressService.getOrgStudents(orgId as number, courseId ?? undefined),
    enabled: enabled && orgId !== null,
    retry: false,
  });
}

/** Platform admin: any user's progress; `courseId` as in `useClassStudents`. */
export function useAdminUserProgress(userId: string, courseId?: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.progress.adminUser(userId), courseId ?? null],
    queryFn: () => progressService.getAdminUserProgress(Number(userId), courseId ?? undefined),
    enabled: userId.length > 0,
    retry: false,
  });
}
