import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { communityService } from '../services';

export function useReviews(targetType: 'course' | 'lab', targetId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.community.reviews(targetType, targetId),
    queryFn: () => communityService.listReviews(targetType, targetId),
    retry: false,
  });
}

export function useCreateReview(targetType: 'course' | 'lab', targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof communityService.createReview>[0]) =>
      communityService.createReview(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.reviews(targetType, targetId),
      }),
  });
}

export function useComments(targetType: 'course' | 'lab' | 'news', targetId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.community.comments(targetType, targetId),
    queryFn: () => communityService.listComments(targetType, targetId),
    retry: false,
  });
}

export function useCreateComment(targetType: 'course' | 'lab' | 'news', targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof communityService.createComment>[0]) =>
      communityService.createComment(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.comments(targetType, targetId),
      }),
  });
}

export function useDeleteComment(targetType: 'course' | 'lab' | 'news', targetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => communityService.deleteComment(commentId),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.comments(targetType, targetId),
      }),
  });
}

export function useLike(targetType: 'comment' | 'review') {
  return useMutation({
    mutationFn: (targetId: number) => communityService.like(targetType, targetId),
  });
}

export function useUnlike(targetType: 'comment' | 'review') {
  return useMutation({
    mutationFn: (targetId: number) => communityService.unlike(targetType, targetId),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof communityService.createReport>[0]) =>
      communityService.createReport(payload),
  });
}
