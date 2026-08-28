import { apiClient } from '@/shared/services';
import type {
  AdminCommentListDto,
  AdminReviewDto,
  AdminReviewListDto,
  AdminReportDto,
  AdminReportListDto,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin moderation endpoints (OPS-27..34, SCR-F8-11/12). */
export const adminModerationService = {
  /** OPS-27: all reviews, filtered by approval status. */
  async listReviews(
    status: 'pending' | 'approved' | 'all' = 'all',
    page = 1,
  ): Promise<AdminReviewListDto> {
    const { data } = await apiClient.get<{ data: AdminReviewListDto }>('/admin/reviews', {
      params: { status, page, limit: 25 },
    });
    return unwrap(data);
  },

  /** OPS-28: approve a review (recomputes target average rating). */
  async approveReview(reviewId: number): Promise<AdminReviewDto> {
    const { data } = await apiClient.patch<{ data: AdminReviewDto }>(
      `/admin/reviews/${reviewId}/approve`,
    );
    return unwrap(data);
  },

  /** OPS-29: delete a review. */
  async deleteReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/admin/reviews/${reviewId}`);
  },

  /** Additive: list comments for moderation (browse surface for pin/hide). */
  async listComments(page = 1): Promise<AdminCommentListDto> {
    const { data } = await apiClient.get<{ data: AdminCommentListDto }>('/admin/comments', {
      params: { page, limit: 25 },
    });
    return unwrap(data);
  },

  /** OPS-30: pin/unpin a comment. */
  async pinComment(commentId: number): Promise<{ commentId: number; isPinned: boolean }> {
    const { data } = await apiClient.patch<{ data: { commentId: number; isPinned: boolean } }>(
      `/admin/comments/${commentId}/pin`,
    );
    return unwrap(data);
  },

  /** OPS-31: hide/unhide a comment. */
  async hideComment(commentId: number): Promise<{ commentId: number; isHidden: boolean }> {
    const { data } = await apiClient.patch<{ data: { commentId: number; isHidden: boolean } }>(
      `/admin/comments/${commentId}/hide`,
    );
    return unwrap(data);
  },

  /** OPS-32: report queue by status (backend enum has no `all`). */
  async listReports(
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' = 'pending',
    page = 1,
  ): Promise<AdminReportListDto> {
    const { data } = await apiClient.get<{ data: AdminReportListDto }>('/admin/reports', {
      params: { status, page, limit: 25 },
    });
    return unwrap(data);
  },

  /** OPS-33: resolve a report. */
  async resolveReport(reportId: number): Promise<AdminReportDto> {
    const { data } = await apiClient.patch<{ data: AdminReportDto }>(
      `/admin/reports/${reportId}/resolve`,
    );
    return unwrap(data);
  },

  /** OPS-34: dismiss a report. */
  async dismissReport(reportId: number): Promise<AdminReportDto> {
    const { data } = await apiClient.patch<{ data: AdminReportDto }>(
      `/admin/reports/${reportId}/dismiss`,
    );
    return unwrap(data);
  },
};

export default adminModerationService;
