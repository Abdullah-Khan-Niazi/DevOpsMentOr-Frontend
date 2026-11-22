import { useQueries, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ModuleDto } from '../types';
import { curriculumService } from '../services';

/** Published courses for the learner (`GET /curriculum/courses`). */
export function useLearnCourses(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.courses,
    queryFn: () => curriculumService.listCourses(),
    enabled,
    retry: false,
  });
}

/** One course outline with its access decision (`GET /curriculum/courses/:courseId`). */
export function useLearnCourse(courseId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.course(courseId ?? 0),
    queryFn: () => curriculumService.getCourse(courseId as number),
    enabled: enabled && courseId !== null && courseId > 0,
    retry: false,
  });
}

/** Published modules of one course (`GET /curriculum/courses/:courseId/modules`). */
export function useLearnCourseModules(courseId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.courseModules(courseId ?? 0),
    queryFn: () => curriculumService.listCourseModules(courseId as number),
    enabled: enabled && courseId !== null && courseId > 0,
    retry: false,
  });
}

/**
 * Modules of every published course, one query per course (`useQueries`).
 * `data` is undefined until the course list and every course's modules have loaded;
 * `isError` / `error` report the first failure.
 */
export function useAllLearnModules() {
  const courses = useLearnCourses();
  const courseIds = courses.data?.map((course) => course.courseId) ?? [];
  const moduleQueries = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: QUERY_KEYS.learn.courseModules(courseId),
      queryFn: () => curriculumService.listCourseModules(courseId),
      retry: false,
    })),
  });

  const isPending = courses.isPending || moduleQueries.some((query) => query.isPending);
  const failed = [courses, ...moduleQueries].find((query) => query.isError);
  const data: ModuleDto[] | undefined = isPending
    ? undefined
    : moduleQueries.flatMap((query) => query.data ?? []);

  return {
    data,
    isPending,
    isFetching: courses.isFetching || moduleQueries.some((query) => query.isFetching),
    isError: Boolean(failed),
    error: failed?.error ?? null,
    /** Refetches the course list and every failed per-course module query (error state retry). */
    refetch: () =>
      Promise.all([
        courses.refetch(),
        ...moduleQueries.filter((query) => query.isError).map((query) => query.refetch()),
      ]),
  };
}

export function useLearnModule(moduleId: string | number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.module(moduleId),
    queryFn: () => curriculumService.getModule(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });
}

/** Ordered items (lessons, labs, quizzes) of one module (`GET /curriculum/modules/:moduleId/items`). */
export function useLearnModuleItems(moduleId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.moduleItems(moduleId ?? 0),
    queryFn: () => curriculumService.listModuleItems(moduleId as number),
    enabled: enabled && moduleId !== null && moduleId > 0,
    retry: false,
  });
}

/**
 * One item by id (`GET /curriculum/lessons/:lessonId`). Pass `{ enabled: false }`
 * to defer the request.
 */
export function useLearnLesson(lessonId: string | number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: QUERY_KEYS.learn.lesson(lessonId),
    queryFn: () => curriculumService.getLesson(lessonId),
    enabled: enabled && Boolean(lessonId),
    retry: false,
  });
}

/**
 * Module context of an item for the AI mentor and slides (keyed `learn.lessonContext`).
 * Runs only when an item id is given.
 */
export function useLessonContext(itemId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.lessonContext(itemId ?? 0),
    queryFn: () => curriculumService.getLesson(itemId as number),
    enabled: itemId !== null && itemId > 0,
    retry: false,
  });
}
