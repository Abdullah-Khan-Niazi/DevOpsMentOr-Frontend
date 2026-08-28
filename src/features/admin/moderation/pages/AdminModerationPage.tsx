import '../styles/moderation-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  LoadingState,
  PageHeader,
  TabRow,
  toast,
} from '@/shared/components';
import { useAdminComments, useAdminReviews } from '../hooks/useAdminModeration';
import type { AdminCommentDto, AdminReviewDto } from '../types';

// SCR-F8-11: admin content moderation — pending review queue with approve
// / delete actions, plus a comment tab with pin/hide controls. Resolve/
// Dismiss are irreversible status changes (no confirm dialog: admin
// workflow speed).

const MODERATION_TABS = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'comments', label: 'Comments' },
] as const;

type ModerationTab = (typeof MODERATION_TABS)[number]['id'];

const REVIEW_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'all', label: 'All' },
] as const;

type ReviewTab = (typeof REVIEW_TABS)[number]['id'];

function ReviewCard({
  review,
  onApprove,
  onDelete,
  isPending,
}: {
  review: AdminReviewDto;
  onApprove: (reviewId: number) => void;
  onDelete: (reviewId: number) => void;
  isPending: boolean;
}) {
  return (
    <Card className="moderation-item">
      <div className="moderation-item__head">
        <span className="moderation-item__author">
          {review.author.fullName ?? `User ${review.author.userId}`}
        </span>
        <span className="moderation-item__badge" data-pending={!review.isApproved}>
          {review.isApproved ? 'Approved' : 'Pending'}
        </span>
      </div>
      <p className="moderation-item__meta">
        {review.targetType} #{review.targetId} · {'★'.repeat(review.rating ?? 0)}
        {'☆'.repeat(5 - (review.rating ?? 0))} · {new Date(review.createdAt).toLocaleString()}
      </p>
      {review.title ? <h4 className="moderation-item__title">{review.title}</h4> : null}
      {review.content ? <p className="moderation-item__content">{review.content}</p> : null}
      <div className="moderation-item__actions">
        {!review.isApproved ? (
          <Button size="sm" onClick={() => onApprove(review.reviewId)} disabled={isPending}>
            Approve
          </Button>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(review.reviewId)}
          disabled={isPending}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

function CommentCard({
  comment,
  onPin,
  onHide,
  isPending,
}: {
  comment: AdminCommentDto;
  onPin: (commentId: number) => void;
  onHide: (commentId: number) => void;
  isPending: boolean;
}) {
  return (
    <Card className="moderation-item">
      <div className="moderation-item__head">
        <span className="moderation-item__author">
          {comment.author.fullName ?? `User ${comment.author.userId}`}
        </span>
        <span className="moderation-item__badge" data-pending={comment.isHidden}>
          {comment.isHidden ? 'Hidden' : 'Visible'}
        </span>
      </div>
      <p className="moderation-item__meta">
        {comment.targetType} #{comment.targetId}
        {comment.parentCommentId !== null ? ` · reply to #${comment.parentCommentId}` : ''} ·{' '}
        {new Date(comment.createdAt).toLocaleString()}
      </p>
      <p className="moderation-item__content">{comment.content}</p>
      <div className="moderation-item__actions">
        <Button size="sm" onClick={() => onPin(comment.commentId)} disabled={isPending}>
          {comment.isPinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onHide(comment.commentId)}
          disabled={isPending}
        >
          {comment.isHidden ? 'Unhide' : 'Hide'}
        </Button>
      </div>
    </Card>
  );
}

export function AdminModerationPage() {
  const [tab, setTab] = useState<ModerationTab>('reviews');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('pending');
  const { query, approve, remove } = useAdminReviews(reviewTab, 1);
  const { query: commentsQuery, pin, hide } = useAdminComments(1);

  return (
    <div className="moderation-admin-page">
      <PageHeader
        title="Content moderation"
        description="Review submissions pending approval and remove violations."
      />

      <TabRow
        items={[...MODERATION_TABS]}
        activeId={tab}
        onChange={(id) => setTab(id as ModerationTab)}
      />

      {tab === 'reviews' ? (
        <>
          <div className="moderation-admin-page__sub-tabs">
            <TabRow
              items={[...REVIEW_TABS]}
              activeId={reviewTab}
              onChange={(id) => setReviewTab(id as ReviewTab)}
            />
          </div>

          {query.isError ? (
            <ErrorState title="Could not load reviews" message="Please try again later." />
          ) : query.isLoading ? (
            <LoadingState />
          ) : query.data && query.data.data.length > 0 ? (
            <div className="moderation-admin-page__list">
              {query.data.data.map((review) => (
                <ReviewCard
                  key={review.reviewId}
                  review={review}
                  onApprove={(reviewId) =>
                    approve.mutate(reviewId, {
                      onSuccess: () => toast.success('Review approved.'),
                      onError: () => toast.error('Could not approve the review.'),
                    })
                  }
                  onDelete={(reviewId) =>
                    remove.mutate(reviewId, {
                      onSuccess: () => toast.success('Review deleted.'),
                      onError: () => toast.error('Could not delete the review.'),
                    })
                  }
                  isPending={approve.isPending || remove.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews in this view." />
          )}
        </>
      ) : commentsQuery.isError ? (
        <ErrorState title="Could not load comments" message="Please try again later." />
      ) : commentsQuery.isLoading ? (
        <LoadingState />
      ) : commentsQuery.data && commentsQuery.data.data.length > 0 ? (
        <div className="moderation-admin-page__list">
          {commentsQuery.data.data.map((comment) => (
            <CommentCard
              key={comment.commentId}
              comment={comment}
              onPin={(commentId) =>
                pin.mutate(commentId, {
                  onSuccess: (result) =>
                    toast.success(result.isPinned ? 'Comment pinned.' : 'Comment unpinned.'),
                  onError: () => toast.error('Could not update the comment.'),
                })
              }
              onHide={(commentId) =>
                hide.mutate(commentId, {
                  onSuccess: (result) =>
                    toast.success(result.isHidden ? 'Comment hidden.' : 'Comment unhidden.'),
                  onError: () => toast.error('Could not update the comment.'),
                })
              }
              isPending={pin.isPending || hide.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No comments yet." />
      )}
    </div>
  );
}

export default AdminModerationPage;
