import { useMemo } from 'react';
import { ROUTES } from '@/shared/constants';
import type { ModuleDto, ModuleItemDto } from '../types';
import {
  useLearnCourse,
  useLearnCourseModules,
  useLearnModule,
  useLearnModuleItems,
} from './useCurriculum';

/** Route for a module item, or null when the item has no destination yet. */
export function getModuleItemRoute(item: ModuleItemDto): string | null {
  if (item.kind === 'lab') {
    return item.lab
      ? `${ROUTES.LEARN_LAB.replace(':labId', String(item.lab.labId))}?itemId=${item.itemId}`
      : null;
  }
  if (item.kind === 'quiz') {
    return item.quiz ? ROUTES.LEARN_QUIZ.replace(':quizId', String(item.quiz.quizId)) : null;
  }
  return ROUTES.LEARN_LESSON.replace(':lessonId', String(item.itemId));
}

export interface CourseSequenceTarget {
  title: string;
  to: string;
  crossesModule: boolean;
}

export interface UseCourseSequenceParams {
  courseId: number | null;
  moduleId: number | null;
  currentItemId?: number | null;
  currentLabId?: number | null;
  currentQuizId?: number | null;
  enabled?: boolean;
}

export interface UseCourseSequenceResult {
  resolvedCourseId: number | null;
  courseTitle: string | null;
  courseModules: ModuleDto[];
  prevItem: CourseSequenceTarget | null;
  nextItem: CourseSequenceTarget | null;
  isLastItemInCourse: boolean;
  ready: boolean;
}

function toTarget(
  item: ModuleItemDto | null | undefined,
  crossesModule: boolean,
): CourseSequenceTarget | null {
  if (!item) return null;
  const to = getModuleItemRoute(item);
  return to ? { title: item.title, to, crossesModule } : null;
}

/**
 * Resolves the previous and next ordered item across modules in the same course so completing
 * a lesson, lab, or quiz smoothly advances to the next item (or flags the last item in course).
 */
export function useCourseSequence({
  courseId,
  moduleId,
  currentItemId = null,
  currentLabId = null,
  currentQuizId = null,
  enabled = true,
}: UseCourseSequenceParams): UseCourseSequenceResult {
  const needsModuleLookup = enabled && courseId === null && moduleId !== null;
  const moduleQuery = useLearnModule(moduleId ?? 0, needsModuleLookup);
  const resolvedCourseId = courseId ?? moduleQuery.data?.courseId ?? null;

  const courseQuery = useLearnCourse(resolvedCourseId, enabled && resolvedCourseId !== null);
  const modulesQuery = useLearnCourseModules(
    resolvedCourseId,
    enabled && resolvedCourseId !== null,
  );
  const currentItemsQuery = useLearnModuleItems(moduleId, enabled && moduleId !== null);

  const courseModules = useMemo(
    () => [...(modulesQuery.data ?? [])].sort((a, b) => a.moduleOrder - b.moduleOrder),
    [modulesQuery.data],
  );

  const currentItems = useMemo(
    () => [...(currentItemsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [currentItemsQuery.data],
  );

  const currentItemIndex = useMemo(() => {
    if (currentItemId !== null) {
      const byItem = currentItems.findIndex((item) => item.itemId === currentItemId);
      if (byItem !== -1) return byItem;
    }
    if (currentLabId !== null) {
      const byLab = currentItems.findIndex(
        (item) => item.kind === 'lab' && item.lab?.labId === currentLabId,
      );
      if (byLab !== -1) return byLab;
    }
    if (currentQuizId !== null) {
      const byQuiz = currentItems.findIndex(
        (item) => item.kind === 'quiz' && item.quiz?.quizId === currentQuizId,
      );
      if (byQuiz !== -1) return byQuiz;
    }
    return -1;
  }, [currentItems, currentItemId, currentLabId, currentQuizId]);

  const currentModuleIndex = useMemo(
    () => (moduleId === null ? -1 : courseModules.findIndex((mod) => mod.moduleId === moduleId)),
    [courseModules, moduleId],
  );

  const prevModule = currentModuleIndex > 0 ? courseModules[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < courseModules.length - 1
      ? courseModules[currentModuleIndex + 1]
      : null;

  const atFirstItemInModule = currentItemIndex === 0;
  const atLastOrMissingInModule =
    currentItemIndex < 0 || currentItemIndex === currentItems.length - 1;

  const prevModuleItemsQuery = useLearnModuleItems(
    prevModule?.moduleId ?? null,
    enabled && prevModule !== null && atFirstItemInModule,
  );
  const nextModuleItemsQuery = useLearnModuleItems(
    nextModule?.moduleId ?? null,
    enabled && nextModule !== null && atLastOrMissingInModule,
  );

  const prevModuleItems = useMemo(
    () => [...(prevModuleItemsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [prevModuleItemsQuery.data],
  );
  const nextModuleItems = useMemo(
    () => [...(nextModuleItemsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [nextModuleItemsQuery.data],
  );

  const prevItem = useMemo(() => {
    if (currentItemIndex > 0) {
      for (let i = currentItemIndex - 1; i >= 0; i -= 1) {
        const candidate = toTarget(currentItems[i], false);
        if (candidate) return candidate;
      }
    }
    if (atFirstItemInModule && prevModule !== null) {
      for (let i = prevModuleItems.length - 1; i >= 0; i -= 1) {
        const candidate = toTarget(prevModuleItems[i], true);
        if (candidate) return candidate;
      }
    }
    return null;
  }, [currentItemIndex, currentItems, atFirstItemInModule, prevModule, prevModuleItems]);

  const nextItem = useMemo(() => {
    if (currentItemIndex >= 0 && currentItemIndex < currentItems.length - 1) {
      for (let i = currentItemIndex + 1; i < currentItems.length; i += 1) {
        const candidate = toTarget(currentItems[i], false);
        if (candidate) return candidate;
      }
    }
    if (currentItemIndex === currentItems.length - 1 && nextModule !== null) {
      for (let i = 0; i < nextModuleItems.length; i += 1) {
        const candidate = toTarget(nextModuleItems[i], true);
        if (candidate) return candidate;
      }
    }
    return null;
  }, [currentItemIndex, currentItems, nextModule, nextModuleItems]);

  const awaitingNextModuleItems =
    currentItemIndex >= 0 &&
    currentItemIndex === currentItems.length - 1 &&
    nextModule !== null &&
    nextModuleItemsQuery.isPending;

  const ready =
    !needsModuleLookup || !moduleQuery.isPending
      ? (resolvedCourseId === null || !modulesQuery.isPending) &&
        (moduleId === null || !currentItemsQuery.isPending) &&
        !awaitingNextModuleItems
      : false;

  const isLastItemInCourse = ready && currentItemIndex >= 0 && nextItem === null;

  return {
    resolvedCourseId,
    courseTitle: courseQuery.data?.course.title ?? null,
    courseModules,
    prevItem,
    nextItem,
    isLastItemInCourse,
    ready,
  };
}
