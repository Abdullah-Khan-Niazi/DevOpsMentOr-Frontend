import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/services';
import type { CourseDto } from '../types';

/**
 * Published course catalog (`GET /curriculum/courses`).
 *
 * Powers the Courses tab ("show all courses") and the Tracks tab's
 * "attach an existing course" picker. Shares the `['curriculum','courses']`
 * query key with the org assignment picker so the catalog is fetched once.
 */
export function useCurriculumCatalog(enabled = true) {
  return useQuery({
    queryKey: ['curriculum', 'courses'] as const,
    queryFn: async (): Promise<CourseDto[]> => {
      const { data } = await apiClient.get<{ data: CourseDto[] }>('/curriculum/courses');
      return data.data;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export default useCurriculumCatalog;
