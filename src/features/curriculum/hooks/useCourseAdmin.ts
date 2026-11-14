import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminCurriculumService,
  type CreateCoursePayload,
} from '../services/adminCurriculumService';

/** Difficulty/category reference data for the course-create drawer. */
export function useCurriculumTaxonomies(enabled = true) {
  const difficulties = useQuery({
    queryKey: ['curriculum', 'difficulties'],
    queryFn: () => adminCurriculumService.listDifficulties(),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const categories = useQuery({
    queryKey: ['curriculum', 'categories'],
    queryFn: () => adminCurriculumService.listCategories(),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  return { difficulties, categories };
}

/** Multi-course: create a DRAFT course; publish separately via updateCourse. */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => adminCurriculumService.createCourse(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['curriculum'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
    },
  });
}
