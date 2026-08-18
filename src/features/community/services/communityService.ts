import { apiClient } from '@/shared/services';
import type {
  CommentDto,
  CommentListDto,
  CreateCommentPayload,
  CreateReportPayload,
  CreateReviewPayload,
  LikeResultDto,
  LikeTargetType,
  ReportDto,
  ReviewDto,
  ReviewListDto,
  ReviewTargetType,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 learner community endpoints (OPS-13..19). */
export const communityService = {
  /** OPS-13: approved reviews for one target (public). */
  async listReviews(targetType: ReviewTargetType, targetId: number): Promise<ReviewListDto> {
    const { data } = await apiClient.get<{ data: ReviewListDto }>('/reviews', {
      params: { targetType, targetId },
    });
    return unwrap(data);
  },

  /** OPS-14: submit a review (pending approval). */
  async createReview(payload: CreateReviewPayload): Promise<ReviewDto> {
    const { data } = await apiClient.post<{ data: ReviewDto }>('/reviews', payload);
    return unwrap(data);
  },

  /** OPS-15: visible comments for one target (public). */
  async listComments(
    targetType: CommentDto['targetType'],
    targetId: number,
  ): Promise<CommentListDto> {
    const { data } = await apiClient.get<{ data: CommentListDto }>('/comments', {
      params: { targetType, targetId },
    });
    return unwrap(data);
  },

  /** OPS-16: post a comment. */
  async createComment(payload: CreateCommentPayload): Promise<CommentDto> {
    const { data } = await apiClient.post<{ data: CommentDto }>('/comments', payload);
    return unwrap(data);
  },

  /** OPS-17: delete own comment. */
  async deleteComment(commentId: number): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  },

  /** OPS-18: like content. */
  async like(targetType: LikeTargetType, targetId: number): Promise<LikeResultDto> {
    const { data } = await apiClient.post<{ data: LikeResultDto }>('/likes', {
      targetType,
      targetId,
    });
    return unwrap(data);
  },

  /** OPS-18: unlike content. */
  async unlike(targetType: LikeTargetType, targetId: number): Promise<LikeResultDto> {
    const { data } = await apiClient.delete<{ data: LikeResultDto }>(
      `/likes/${targetType}/${targetId}`,
    );
    return unwrap(data);
  },

  /** OPS-19: file a report (target content never returned to reporter). */
  async createReport(payload: CreateReportPayload): Promise<ReportDto> {
    const { data } = await apiClient.post<{ data: ReportDto }>('/reports', payload);
    return unwrap(data);
  },
};

export default communityService;
