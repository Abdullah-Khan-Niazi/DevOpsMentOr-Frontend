/** F8 §05 community contracts (SCR-F8-05..07, OPS-13..19, OPS-27..34). */

export type ReviewTargetType = 'course' | 'lab';
export type CommentTargetType = 'course' | 'lab' | 'news';
export type LikeTargetType = 'comment' | 'review';
export type ReportTargetType = 'user' | 'comment' | 'review' | 'course';

export interface ReviewDto {
  reviewId: number;
  targetType: ReviewTargetType;
  targetId: number;
  rating: number | null;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  author: {
    userId: number;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface ReviewListDto {
  data: ReviewDto[];
  total: number;
  page: number;
}

export interface CommentDto {
  commentId: number;
  parentCommentId: number | null;
  targetType: CommentTargetType;
  targetId: number;
  content: string;
  isPinned: boolean;
  isHidden: boolean;
  likesCount: number;
  createdAt: string;
  author: {
    userId: number;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface CommentListDto {
  data: CommentDto[];
  total: number;
  page: number;
}

export interface LikeResultDto {
  targetType: LikeTargetType;
  targetId: number;
  liked: boolean;
  likesCount: number;
}

export interface ReportDto {
  reportId: number;
  targetType: ReportTargetType;
  targetId: number;
  reportReason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}

/** OPS-14: review submit payload (rating + optional title/content). */
export interface CreateReviewPayload {
  targetType: ReviewTargetType;
  targetId: number;
  rating: number;
  title?: string | null;
  content?: string | null;
}

/** OPS-16: comment submit payload. */
export interface CreateCommentPayload {
  targetType: CommentTargetType;
  targetId: number;
  content: string;
  parentCommentId?: number | null;
}

/** OPS-19: report submit payload. */
export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: number;
  reportReason: string;
  description?: string | null;
}

/** Fixed report-reason list (seeded in `system_settings.reports.reason_categories`). */
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'offensive content',
  'misinformation',
  'outdated content',
  'security concern',
  'other',
] as const;
