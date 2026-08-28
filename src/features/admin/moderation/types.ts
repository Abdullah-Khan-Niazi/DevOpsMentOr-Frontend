/** F8 §05 admin moderation contracts (OPS-27..34, SCR-F8-11/12). */

export interface AdminReviewDto {
  reviewId: number;
  targetType: 'course' | 'lab';
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

export interface AdminReviewListDto {
  data: AdminReviewDto[];
  total: number;
  page: number;
}

export interface AdminCommentDto {
  commentId: number;
  parentCommentId: number | null;
  targetType: 'course' | 'lab' | 'news';
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

export interface AdminCommentListDto {
  data: AdminCommentDto[];
  total: number;
  page: number;
}

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface AdminReportDto {
  reportId: number;
  targetType: 'user' | 'comment' | 'review' | 'course';
  targetId: number;
  reportReason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporter: {
    userId: number;
    fullName: string | null;
  };
}

export interface AdminReportListDto {
  data: AdminReportDto[];
  total: number;
  page: number;
}

export interface ModerationQueueSummary {
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
}
