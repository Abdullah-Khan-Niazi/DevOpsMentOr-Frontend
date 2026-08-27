import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminModerationService } from '../services';

export function useAdminReviews(status: 'pending' | 'approved' | 'all', page = 1) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminModeration.reviews(status, page),
    queryFn: () => adminModerationService.listReviews(status, page),
    retry: false,
  });

  const approve = useMutation({
    mutationFn: (reviewId: number) => adminModerationService.approveReview(reviewId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.reviewsPrefix }),
  });

  const remove = useMutation({
    mutationFn: (reviewId: number) => adminModerationService.deleteReview(reviewId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.reviewsPrefix }),
  });

  return { query, approve, remove };
}

export function useAdminComments(page = 1) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminModeration.comments(page),
    queryFn: () => adminModerationService.listComments(page),
    retry: false,
  });

  const pin = useMutation({
    mutationFn: (commentId: number) => adminModerationService.pinComment(commentId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.commentsPrefix }),
  });

  const hide = useMutation({
    mutationFn: (commentId: number) => adminModerationService.hideComment(commentId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.commentsPrefix }),
  });

  return { query, pin, hide };
}

export function useAdminReports(
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
  page = 1,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminModeration.reports(status, page),
    queryFn: () => adminModerationService.listReports(status, page),
    retry: false,
  });

  const resolve = useMutation({
    mutationFn: (reportId: number) => adminModerationService.resolveReport(reportId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.reportsPrefix }),
  });

  const dismiss = useMutation({
    mutationFn: (reportId: number) => adminModerationService.dismissReport(reportId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminModeration.reportsPrefix }),
  });

  return { query, resolve, dismiss };
}
