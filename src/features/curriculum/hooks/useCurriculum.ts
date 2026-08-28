import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { curriculumService } from '../services';

export function useCourseOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.learn.overview,
    queryFn: () => curriculumService.getCourseOverview(),
    retry: false,
  });
}

export function useLearnModule(moduleId: string | number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.module(moduleId),
    queryFn: () => curriculumService.getModule(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });
}

export function useLearnModuleLessons(moduleId: string | number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.moduleLessons(moduleId),
    queryFn: () => curriculumService.getModuleLessons(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });
}

export function useLearnLesson(lessonId: string | number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.lesson(lessonId),
    queryFn: () => curriculumService.getLesson(lessonId),
    enabled: enabled && Boolean(lessonId),
    retry: false,
  });
}

export function useLearnModuleQuizzes(moduleId: string | number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.learn.quizzes(moduleId),
    queryFn: () => curriculumService.getModuleQuizzes(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });
}
